/** Optional research-only API. No booking, publication or write actions. */
const BASE = import.meta.env.VITE_API_BASE_URL || "https://betsightly-api.onrender.com/api";

export async function getAIScoutWatchlist<T>(): Promise<T> {
  const response = await fetch(`${BASE}/leagues/ai-scout/watchlist`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Scout research HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
