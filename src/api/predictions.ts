import type { AccumulatorResponse } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://betsightly-api.onrender.com/api';

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

/* ── Result-checking types ───────────────────────────── */

export interface ResultGame {
  fixture_id: number;
  home_team: string;
  away_team: string;
  league: string;
  date: string;
  prediction: string;
  confidence: number;
  odds: number;
  home_score: number | null;
  away_score: number | null;
  result: 'won' | 'lost' | 'pending' | 'void';
  home_team_logo?: string;
  away_team_logo?: string;
  league_logo?: string;
}

export interface CategoryResult {
  selected: boolean;
  reason?: string;
  total_odds?: number;
  games?: ResultGame[];
  wins?: number;
  losses?: number;
  pending?: number;
  total_games?: number;
  accumulator_result?: 'won' | 'lost' | 'pending';
}

export interface ResultsResponse {
  status: string;
  date: string;
  fixtures_checked: number;
  categories: Record<string, CategoryResult>;
}

/* ── API ─────────────────────────────────────────────── */

export const api = {
  getTodaysAccumulators: () =>
    request<AccumulatorResponse>('/accumulators/today'),

  getPredictionHistory: (days = 14) =>
    request<HistoryResponse>(`/daily-predictions/history?days=${days}`),

  getAccumulatorResults: (date?: string) =>
    request<ResultsResponse>(`/accumulators/results${date ? `?target_date=${date}` : ''}`),
};
