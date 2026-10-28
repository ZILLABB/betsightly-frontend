import { useCallback, useEffect, useState } from "react";
import { api, type ManualRemainingResponse } from "../api/predictions";
import type { CategoryKey } from "../types";

/** Recognise newly unplaceable manual legs automatically while preserving
 * the immutable original. A near-target expansion only runs after the user
 * explicitly asks for that *different* wager. */
export function useManualRemaining(enabled: boolean, publicationDate?: string) {
  const [data, setData] = useState<ManualRemainingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [targetTier, setTargetTier] = useState<CategoryKey | null>(null);
  const refetch = useCallback(() => {
    setTargetTier(null);
    setRefreshVersion(v => v + 1);
  }, []);
  const findNearTarget = useCallback((tier: CategoryKey) => {
    setTargetTier(tier);
    setRefreshVersion(v => v + 1);
  }, []);

  // One bounded automatic check every two minutes while this page is open.
  // Never run provider calls on hidden tabs or when no old code was affected.
  useEffect(() => {
    if (!enabled || !publicationDate) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setTargetTier(null);
        setRefreshVersion(v => v + 1);
      }
    }, 120_000);
    return () => window.clearInterval(timer);
  }, [enabled, publicationDate]);

  useEffect(() => {
    if (!enabled || !publicationDate) {
      setData(null);
      setError(null);
      setLoading(false);
      setTargetTier(null);
      return;
    }
    let active = true;
    if (document.visibilityState === "hidden") return;
    setLoading(true);
    setError(null);
    api.getManualBookableNow(targetTier !== null, targetTier ?? undefined)
      .then(result => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setError("Could not verify remaining SportyBet matches. The original published ticket remains visible.");
        }
      });
    return () => { active = false; };
  }, [enabled, publicationDate, refreshVersion, targetTier]);
  return { data, loading, error, refetch, findNearTarget, targetTier };
}
