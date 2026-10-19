import { useEffect, useState } from "react";
import { api, type ManualRemainingResponse } from "../api/predictions";

/** Only the visitor's explicit "Show available now" action books a reduced
 * manual variant. Nothing automatically regenerates immutable daily slips. */
export function useManualRemaining(enabled: boolean, publicationDate?: string) {
  const [data, setData] = useState<ManualRemainingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || !publicationDate) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    api.getManualBookableNow()
      .then(result => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(null);
          setLoading(false);
          setError("Couldn't verify a reduced manual code at the bookmaker. Your original published tickets remain visible.");
        }
      });
    return () => { active = false; };
  }, [enabled, publicationDate]);
  return { data, loading, error };
}
