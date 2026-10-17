import { PreviewResponse, PreviewStatus, ScreenshotStatus } from "./types";

function isPrivateOrReservedIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("0.")) return true;
  if (ip === "255.255.255.255") return true;

  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  }
  return false;
}

function isBlockedHost(host: string): boolean {
  const clean = host.toLowerCase().trim().replace(/^[\[]|[\]]$/g, "");
  const blocked = [
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
    "169.254.169.254",
    "100.100.100.200",
  ];
  if (blocked.includes(clean)) return true;
  if (isPrivateOrReservedIp(clean)) return true;
  return false;
}

function sanitizeText(text: string | null | undefined, maxLen = 300): string | null {
  if (!text) return null;
  const noHtml = text.replace(/<[^>]+>/g, " ");
  const clean = noHtml.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length > maxLen) {
    return clean.slice(0, maxLen).trim() + "...";
  }
  return clean;
}

// In-memory cache for preview responses (10 minutes)
const previewCache = new Map<string, { timestamp: number; data: PreviewResponse }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function generateSelfContainedPreview(rawUrl: string): Promise<PreviewResponse> {
  const nowIso = new Date().toISOString();
  const stripped = (rawUrl || "").trim();

  if (!stripped) {
    return {
      input_url: rawUrl,
      final_url: rawUrl,
      domain: "",
      status: "failed",
      screenshot_status: "failed",
      error_message: "URL cannot be empty.",
      redirect_chain: [],
      generated_at: nowIso,
    };
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(stripped);
  const workingUrl = hasScheme ? stripped : `https://${stripped}`;

  let parsed: URL;
  try {
    parsed = new URL(workingUrl);
  } catch (err: unknown) {
    return {
      input_url: stripped,
      final_url: workingUrl,
      domain: "",
      status: "failed",
      screenshot_status: "unsupported",
      error_message: `Malformed URL: ${err instanceof Error ? err.message : String(err)}`,
      redirect_chain: [],
      generated_at: nowIso,
    };
  }

  const scheme = parsed.protocol.replace(":", "").toLowerCase();
  if (scheme !== "http" && scheme !== "https") {
    return {
      input_url: stripped,
      final_url: workingUrl,
      domain: parsed.hostname,
      status: "failed",
      screenshot_status: "unsupported",
      error_message: `Unsupported scheme '${scheme}'. Only HTTP and HTTPS are permitted.`,
      redirect_chain: [],
      generated_at: nowIso,
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname) {
    return {
      input_url: stripped,
      final_url: workingUrl,
      domain: "",
      status: "failed",
      screenshot_status: "unsupported",
      error_message: "Missing hostname in URL.",
      redirect_chain: [],
      generated_at: nowIso,
    };
  }

  if (isBlockedHost(hostname)) {
    return {
      input_url: stripped,
      final_url: workingUrl,
      domain: hostname,
      status: "blocked",
      screenshot_status: "unsupported",
      error_message: `Destination '${hostname}' is a restricted private or internal network address.`,
      redirect_chain: [],
      generated_at: nowIso,
    };
  }

  const normalizedUrl = parsed.toString();

  // Check cache
  const cached = previewCache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let currentUrl = normalizedUrl;
  const redirectChain: string[] = [currentUrl];
  let finalHtml = "";
  let fetchError: string | null = null;

  // Follow redirects safely
  try {
    const visited = new Set<string>([currentUrl]);
    let hops = 0;
    const maxHops = 5;

    while (hops < maxHops) {
      hops++;
      const currentParsed = new URL(currentUrl);
      if (isBlockedHost(currentParsed.hostname)) {
        return {
          input_url: stripped,
          final_url: currentUrl,
          domain: currentParsed.hostname,
          redirect_chain: redirectChain,
          status: "blocked",
          screenshot_status: "unsupported",
          error_message: `Redirect target '${currentParsed.hostname}' is a restricted address.`,
          generated_at: nowIso,
        };
      }

      const res = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (LinkShield/1.0 Preview Bot)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(6000),
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) break;
        const nextUrl = new URL(loc, currentUrl).toString();
        if (visited.has(nextUrl)) {
          fetchError = "Redirect loop detected.";
          break;
        }
        visited.add(nextUrl);
        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
        continue;
      }

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html") || contentType.includes("application/xhtml") || !contentType) {
          // Read up to 256KB
          const text = await res.text();
          finalHtml = text.slice(0, 262144);
        }
      }
      break;
    }
  } catch (err: unknown) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  const finalParsed = new URL(currentUrl);
  const finalDomain = finalParsed.hostname.toLowerCase();

  // Extract metadata using regex
  let title: string | null = null;
  let description: string | null = null;
  let ogImage: string | null = null;
  let favicon: string | null = null;

  if (finalHtml) {
    const titleMatch = finalHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1];

    const ogTitleMatch = finalHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (!title && ogTitleMatch) title = ogTitleMatch[1];

    const descMatch = finalHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch) description = descMatch[1];

    const ogDescMatch = finalHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    if (!description && ogDescMatch) description = ogDescMatch[1];

    const ogImgMatch = finalHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImgMatch) {
      try {
        ogImage = new URL(ogImgMatch[1], currentUrl).toString();
      } catch {
        // Ignore
      }
    }

    const iconMatch = finalHtml.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
    if (iconMatch) {
      try {
        favicon = new URL(iconMatch[1], currentUrl).toString();
      } catch {
        // Ignore
      }
    }
  }

  if (!favicon) {
    favicon = `${finalParsed.protocol}//${finalParsed.host}/favicon.ico`;
  }

  // Screenshot capture via Microlink in isolated browser sandbox
  let screenshotUrl: string | null = null;
  let screenshotStatus: ScreenshotStatus = "unsupported";
  let screenshotError: string | null = null;

  if (!isBlockedHost(finalDomain)) {
    try {
      const shotApi = `https://api.microlink.io?url=${encodeURIComponent(currentUrl)}&screenshot=true&meta=false`;
      const shotRes = await fetch(shotApi, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (shotRes.ok) {
        const shotJson = (await shotRes.json()) as {
          status?: string;
          data?: { screenshot?: { url?: string } };
        };
        const candidateUrl = shotJson?.data?.screenshot?.url;
        if (candidateUrl && candidateUrl.startsWith("https://")) {
          screenshotUrl = candidateUrl;
          screenshotStatus = "available";
        } else {
          screenshotStatus = "failed";
          screenshotError = "Screenshot service did not return an image URL.";
        }
      } else {
        screenshotStatus = "failed";
        screenshotError = `Screenshot service returned status ${shotRes.status}.`;
      }
    } catch (err: unknown) {
      screenshotStatus = "failed";
      screenshotError = err instanceof Error ? err.message : "Screenshot capture timed out.";
    }
  }

  let status: PreviewStatus = "ready";
  if (screenshotStatus === "failed" && !title && !description) {
    status = "failed";
  } else if (screenshotStatus === "failed") {
    status = "screenshot_failed";
  }

  const result: PreviewResponse = {
    input_url: stripped,
    final_url: currentUrl,
    domain: finalDomain,
    title: sanitizeText(title, 200),
    description: sanitizeText(description, 400),
    favicon_url: favicon,
    og_image_url: ogImage,
    screenshot_url: screenshotUrl,
    screenshot_status: screenshotStatus,
    screenshot_error: screenshotError,
    redirect_chain: redirectChain.length > 1 ? redirectChain : [],
    status,
    error_message: status === "failed" ? fetchError || screenshotError : null,
    generated_at: nowIso,
  };

  previewCache.set(normalizedUrl, { timestamp: Date.now(), data: result });
  return result;
}
