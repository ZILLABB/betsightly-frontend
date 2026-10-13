/** Public, read-only editorial predictions; separate from official engine slips. */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://betsightly-api.onrender.com/api";

export async function getManualEditorial<T>(): Promise<T> {
  const response = await fetch(`${API_BASE}/growth/editorial-slips`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Manual editorial feed unavailable");
  return response.json() as Promise<T>;
}
