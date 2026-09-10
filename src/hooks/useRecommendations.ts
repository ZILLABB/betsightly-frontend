import React from "react";
import { getFixtureRecommendations } from "../api/recommendations";
import type { RecommendationBoardResponse } from "../types";

const cache: { value: RecommendationBoardResponse | null; ts: number } = {
  value: null,
  ts: 0,
};
const TTL = 5 * 60 * 1000;

export function useRecommendations() {
  const [data, setData] = React.useState(cache.value);
  const [loading, setLoading] = React.useState(!cache.value);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (force = false) => {
    if (!force && cache.value && Date.now() - cache.ts < TTL) {
      setData(cache.value);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getFixtureRecommendations();
      cache.value = result;
      cache.ts = Date.now();
      setData(result);
    } catch {
      setError("The full match board is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);
  return { data, loading, error, refetch: () => load(true) };
}
