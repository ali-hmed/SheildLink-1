import { getBackendUrl, getGoogleSafeBrowsingKey } from "@/lib/backend";

export async function GET() {
  const backendUrl = getBackendUrl();
  const googleApiKey = getGoogleSafeBrowsingKey();

  if (backendUrl && !backendUrl.includes("127.0.0.1") && !backendUrl.includes("localhost")) {
    try {
      const targetUrl = new URL("/api/health", backendUrl).toString();
      const backendRes = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
      const data = await backendRes.text();
      return new Response(data, {
        status: backendRes.status,
        headers: {
          "Content-Type": backendRes.headers.get("Content-Type") || "application/json",
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[LinkShield] Error checking backend health at ${backendUrl}: ${message}`);
      return Response.json(
        { status: "unreachable", reputation_provider: "unknown", detail: "Backend service unreachable" },
        { status: 502 }
      );
    }
  }

  return Response.json({
    status: "ok",
    reputation_provider: googleApiKey ? "configured" : "not_configured",
  });
}
