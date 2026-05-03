import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/predictions';
import type { AccumulatorResponse } from '../types';

interface Cache {
  data: AccumulatorResponse | null;
  ts: number;
}

const cache: Cache = { data: null, ts: 0 };
const TTL = 5 * 60 * 1000;

export function usePredictions() {
  const [data, setData] = useState<AccumulatorResponse | null>(cache.data);
  const [loading, setLoading] = useState(cache.data === null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cache.data && now - cache.ts < TTL) {
      setData(cache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.getTodaysAccumulators();
      cache.data = result;
      cache.ts = Date.now();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError('Unable to reach the server. Showing cached data if available.');
        if (cache.data) setData(cache.data);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return { data, loading, error, refetch: () => load(true) };
}
