import type { RecommendationBoardResponse } from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL || "https://betsightly-api.onrender.com/api";

export async function getFixtureRecommendations(
  date?: string,
): Promise<RecommendationBoardResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`${BASE}/leagues/recommendations${query}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<RecommendationBoardResponse>;
}
