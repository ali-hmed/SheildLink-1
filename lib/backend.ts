export function getBackendUrl(): string | undefined {
  if (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) {
    return process.env.BACKEND_URL.trim();
  }
  try {
    const cfContext = (globalThis as Record<string | symbol, unknown>)[Symbol.for("__cloudflare-context__")] as
      | { env?: { BACKEND_URL?: string } }
      | undefined;
    if (cfContext?.env?.BACKEND_URL && cfContext.env.BACKEND_URL.trim()) {
      return cfContext.env.BACKEND_URL.trim();
    }
  } catch {
    // Non-Cloudflare environment
  }
  return undefined;
}

export function getGoogleSafeBrowsingKey(): string | undefined {
  if (process.env.GOOGLE_SAFE_BROWSING_API_KEY && process.env.GOOGLE_SAFE_BROWSING_API_KEY.trim()) {
    return process.env.GOOGLE_SAFE_BROWSING_API_KEY.trim();
  }
  try {
    const cfContext = (globalThis as Record<string | symbol, unknown>)[Symbol.for("__cloudflare-context__")] as
      | { env?: { GOOGLE_SAFE_BROWSING_API_KEY?: string } }
      | undefined;
    if (cfContext?.env?.GOOGLE_SAFE_BROWSING_API_KEY && cfContext.env.GOOGLE_SAFE_BROWSING_API_KEY.trim()) {
      return cfContext.env.GOOGLE_SAFE_BROWSING_API_KEY.trim();
    }
  } catch {
    // Non-Cloudflare environment
  }
  return undefined;
}
