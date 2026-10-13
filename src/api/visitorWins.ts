/** Private, win-only Builder notifications. Never include visitor IDs in URLs. */
const BASE = import.meta.env.VITE_API_BASE_URL ||
  "https://betsightly-api.onrender.com/api";

export interface PrivateWinningPrediction {
  ticket_id: string;
  generated_at: string | null;
  won_at: string | null;
  prediction_odds: number | null;
  leg_count: number;
  status: "won";
  wager_confirmed: false;
}
export interface PrivateWinsResponse {
  status: "success" | "unavailable";
  predictions_only: true;
  notifications: PrivateWinningPrediction[];
}

export async function fetchPrivateBuilderWins(
  anonymousId: string,
  signal?: AbortSignal,
): Promise<PrivateWinsResponse> {
  const response = await fetch(`${BASE}/leagues/slip-builder/visitor-wins`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ anonymous_id: anonymousId }),
    signal,
  });
  if (!response.ok) throw new Error("Private win lookup unavailable");
  return response.json() as Promise<PrivateWinsResponse>;
}
