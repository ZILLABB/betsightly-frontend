import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/predictions';
import type { HistoryResponse } from '../api/predictions';

interface Cache {
  data: HistoryResponse | null;
  ts: number;
  days: number;
}

const cache: Cache = { data: null, ts: 0, days: 0 };
const TTL = 10 * 60 * 1000; // 10 min — history changes at most once per day

export function usePredictionHistory(days = 14) {
  const [data, setData] = useState<HistoryResponse | null>(
    cache.days === days ? cache.data : null,
  );
  const [loading, setLoading] = useState(data === null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (!force && cache.data && cache.days === days && now - cache.ts < TTL) {
        setData(cache.data);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await api.getPredictionHistory(days);
        cache.data = result;
        cache.ts = Date.now();
        cache.days = days;
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch {
        if (mountedRef.current) {
          setError('Unable to load prediction history.');
          if (cache.data && cache.days === days) setData(cache.data);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [days],
  );

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { data, loading, error, refetch: () => load(true) };
}
