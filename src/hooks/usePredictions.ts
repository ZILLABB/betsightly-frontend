import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/predictions';
import type { AccumulatorResponse } from '../types';

interface Cache {
  data: AccumulatorResponse | null;
  ts: number;
  date: string | null;
}

interface StoredCache {
  data: AccumulatorResponse;
  ts: number;
  date: string;
}

const cache: Cache = { data: null, ts: 0, date: null };
const TTL = 5 * 60 * 1000;
const INCOMPLETE_TTL = 30 * 1000;
const INCOMPLETE_POLL_INTERVAL = 60 * 1000;

// Admin can publish a previously empty 2x/5x/10x tier during the day.
// Incomplete cards are short-lived even in sessionStorage; complete cards
// keep the existing five-minute TTL.
const hasMissingTier = (data: AccumulatorResponse) =>
  (["2_odds", "5_odds", "10_odds"] as const)
    .some(key => !data.accumulators?.[key]?.selected);
const cacheTTL = (data: AccumulatorResponse) =>
  hasMissingTier(data) ? INCOMPLETE_TTL : TTL;
const SESSION_KEY = 'betsightly_predictions_same_day_v1';
const ENDPOINT = '/leagues/daily-accumulators';

const currentWatDate = () =>
  new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

const isAccumulatorResponse = (value: unknown): value is AccumulatorResponse => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AccumulatorResponse>;
  const accumulators = candidate.accumulators as unknown as Record<string, unknown> | undefined;
  return typeof candidate.date === 'string'
    && !!accumulators
    && typeof accumulators === 'object'
    && typeof accumulators.rollover === 'object'
    && typeof accumulators['2_odds'] === 'object';
};

const clearStoredCache = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* unavailable */ }
};

const readStoredCache = (): StoredCache | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCache>;
    if (typeof parsed.ts !== 'number' || !Number.isFinite(parsed.ts)
        || parsed.ts <= 0 || parsed.ts > Date.now() + 60_000
        || parsed.date !== currentWatDate()
        || !isAccumulatorResponse(parsed.data)
        || parsed.data.date !== parsed.date) {
      clearStoredCache();
      return null;
    }
    return parsed as StoredCache;
  } catch {
    clearStoredCache();
    return null;
  }
};

const usableCache = (): Cache | null => {
  const today = currentWatDate();
  if (cache.data && cache.date === today && cache.data.date === today) return cache;
  cache.data = null;
  cache.ts = 0;
  cache.date = null;
  const stored = readStoredCache();
  if (!stored) return null;
  Object.assign(cache, stored);
  return cache;
};

const persistSuccess = (data: AccumulatorResponse, ts: number) => {
  const today = currentWatDate();
  Object.assign(cache, { data, ts, date: data.date });
  if (data.date !== today) {
    clearStoredCache();
    return;
  }
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data, ts, date: today }));
  } catch { /* memory caching remains available */ }
};

const logFetchFailure = (error: unknown) => {
  const candidate = error as Error & { status?: number };
  console.warn('[predictions_fetch_failed]', {
    endpoint: ENDPOINT,
    status: typeof candidate?.status === 'number' ? candidate.status : undefined,
    category: candidate?.name === 'AbortError'
      ? 'timeout'
      : typeof candidate?.status === 'number' ? 'http' : 'network',
  });
};

export function usePredictions() {
  const initial = usableCache();
  const [data, setData] = useState<AccumulatorResponse | null>(initial?.data ?? null);
  const [loading, setLoading] = useState(
    !initial?.data || Date.now() - initial.ts >= cacheTTL(initial.data),
  );
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(initial?.ts ?? null);
  const mountedRef = useRef(true);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    const available = usableCache();
    if (!force && available?.data && now - available.ts < cacheTTL(available.data)) {
      if (mountedRef.current) {
        setData(available.data);
        setLastUpdated(available.ts);
        setUsingFallback(false);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setError(null);
    setUsingFallback(false);
    try {
      const result = await api.getTodaysAccumulators();
      const timestamp = Date.now();
      persistSuccess(result, timestamp);
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(timestamp);
        setError(null);
      }
    } catch (err) {
      logFetchFailure(err);
      const fallback = usableCache();
      if (mountedRef.current) {
        if (fallback?.data) {
          setData(fallback.data);
          setLastUpdated(fallback.ts);
          setUsingFallback(true);
          setError('Showing the last available data while we reconnect.');
        } else {
          setData(null);
          setLastUpdated(null);
          setUsingFallback(false);
          setError("We couldn’t load the predictions right now.");
        }
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

  // Same-day recovery fills only previously empty tiers. Keep the displayed
  // locked record in view, but discover a newly recovered 10x (or 2x/5x)
  // without requiring visitors to reload the page. No bookmaker calls here:
  // this endpoint reads only the persisted publication.
  useEffect(() => {
    if (!data || data.date !== currentWatDate()) return;
    if (!hasMissingTier(data)) return;
    const maybeRefresh = () => {
      if (document.visibilityState === "hidden") return;
      const latest = usableCache();
      if (Date.now() - (latest?.ts ?? 0) >= INCOMPLETE_TTL) {
        void load(true);
      }
    };
    const timer = window.setInterval(maybeRefresh, INCOMPLETE_POLL_INTERVAL);
    window.addEventListener("focus", maybeRefresh);
    document.addEventListener("visibilitychange", maybeRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", maybeRefresh);
      document.removeEventListener("visibilitychange", maybeRefresh);
    };
  }, [data, load]);

  return {
    data, loading, error, usingFallback, lastUpdated,
    refetch: () => load(true),
  };
}

export const __resetPredictionsCacheForTests = () => {
  cache.data = null;
  cache.ts = 0;
  cache.date = null;
};
