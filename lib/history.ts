import { HistoryItem, ScanResponse } from "./types";

const HISTORY_STORAGE_KEY = "linkshield_scan_history_v1";
const MAX_HISTORY_ITEMS = 10;

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Graceful fallback for corrupted storage
  }
  return [];
}

export function saveScanToHistory(response: ScanResponse): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadHistory();
    // Deduplicate by normalized_url
    const filtered = current.filter(
      (item) => item.normalized_url.toLowerCase() !== response.normalized_url.toLowerCase()
    );

    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: response.input_url,
      normalized_url: response.normalized_url,
      hostname: response.hostname,
      verdict: response.verdict,
      risk_score: response.risk_score,
      scanned_at: response.scanned_at,
      response,
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore clear errors
  }
}
