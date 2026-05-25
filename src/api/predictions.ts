import type { AccumulatorResponse } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/* ── History types ───────────────────────────────────── */

export interface HistorySummary {
  prediction_date: string;
  total_fixtures: number;
  upcoming_fixtures: number;
  predictions_generated: number;
  models_used: number;
  betting_counts: Record<string, number>;
  status: string;
  generation_time: string | null;
}

export interface HistoryResponse {
  status: string;
  days_requested: number;
  days_found: number;
  history: HistorySummary[];
}

/* ── API ─────────────────────────────────────────────── */

export const api = {
  getTodaysAccumulators: () =>
    request<AccumulatorResponse>('/accumulators/today'),

  getPredictionHistory: (days = 14) =>
    request<HistoryResponse>(`/daily-predictions/history?days=${days}`),
};
