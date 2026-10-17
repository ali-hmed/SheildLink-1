import { getBackendUrl } from "@/lib/backend";
import { generateSelfContainedPreview } from "@/lib/preview";

export async function POST(request: Request) {
  const backendUrl = getBackendUrl();

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    return Response.json({ detail: "Unable to read request payload." }, { status: 400 });
  }

  // 1. If an external BACKEND_URL is explicitly configured, proxy to it.
  if (backendUrl && !backendUrl.includes("127.0.0.1") && !backendUrl.includes("localhost")) {
    try {
      const targetUrl = new URL("/api/preview", backendUrl).toString();
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
      console.error(`[LinkShield] Error proxying preview request to backend at ${backendUrl}: ${message}`);
      return Response.json(
        { detail: "Backend preview service is currently unreachable." },
        { status: 502 }
      );
    }
  }

  // 2. Self-contained execution: Parse and generate preview directly in Next.js / Edge
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
    const previewResponse = await generateSelfContainedPreview(payload.url);
    return Response.json(previewResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[LinkShield] Error generating preview: ${message}`);
    return Response.json({ detail: `Unable to generate website preview: ${message}` }, { status: 500 });
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
