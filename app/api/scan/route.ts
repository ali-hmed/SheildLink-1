import { getBackendUrl, getGoogleSafeBrowsingKey } from "@/lib/backend";
import { executeScan, ScannerValidationError } from "@/lib/scanner";

export async function POST(request: Request) {
  const backendUrl = getBackendUrl();
  const googleApiKey = getGoogleSafeBrowsingKey();

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    return Response.json({ detail: "Unable to read request payload." }, { status: 400 });
  }

  // 1. If an external BACKEND_URL is explicitly configured, proxy to it.
  if (backendUrl && !backendUrl.includes("127.0.0.1") && !backendUrl.includes("localhost")) {
    try {
      const targetUrl = new URL("/api/scan", backendUrl).toString();
      const backendRes = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyText,
        signal: AbortSignal.timeout(15000),
      });

      const data = await backendRes.text();
      return new Response(data, {
        status: backendRes.status,
        headers: {
          "Content-Type": backendRes.headers.get("Content-Type") || "application/json",
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[LinkShield] Error proxying request to backend at ${backendUrl}: ${message}`);
      return Response.json(
        { detail: "Backend analyzer service is currently unreachable." },
        { status: 502 }
      );
    }
  }

  // 2. Self-contained execution: Parse and scan directly in Next.js / Cloudflare Workers
  let payload: { url?: string };
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return Response.json({ detail: "Invalid JSON in request body." }, { status: 400 });
  }

  if (!payload || typeof payload.url !== "string") {
    return Response.json({ detail: "Request must include a 'url' string parameter." }, { status: 422 });
  }

  try {
    const scanResponse = await executeScan(payload.url, googleApiKey);
    return Response.json(scanResponse);
  } catch (err: unknown) {
    if (err instanceof ScannerValidationError) {
      return Response.json({ detail: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[LinkShield] Internal error analyzing URL: ${message}`);
    return Response.json({ detail: `Unable to analyze URL: ${message}` }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
