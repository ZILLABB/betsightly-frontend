import type { AccumulatorResponse, GamePrediction, TierBooking } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://betsightly-api.onrender.com/api';

/** Requests that build something can take a while — the slip builder runs the
 *  whole model pipeline on a cold instance — so the timeout is per call rather
 *  than one number for everything. */
const DEFAULT_TIMEOUT = 30_000;

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, ...rest } = init ?? {};
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: { Accept: 'application/json', ...(rest.headers ?? {}) },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      // Carry the status and whatever the server said. This helper used to
      // throw a bare "HTTP 405", which is what turned a GET sent to a POST
      // route into an unexplained "could not build a slip" on screen.
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.detail || body?.reason || body?.message || '';
      } catch { /* body was not json */ }
      const err = new Error(detail || `HTTP ${res.status}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    return res.json() as Promise<T>;
  } finally {
    window.clearTimeout(timer);
  }
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
  /** The day's card: banker, 2/5/10 odds, over 1.5 and the rollover chain.
   *
   * This has to be the leagues engine. `/accumulators/today` is the retired
   * pipeline — it has no banker tier and returns no games, odds or hit
   * probability at all, only {selected, reason, recommendation}, and it is not
   * what gets published at 08:00 WAT, locked, or calibrated. AccumulatorResponse
   * was migrated to the leagues shape but this call was left pointing at the old
   * path, so the Predictions page has been rendering a response that cannot
   * satisfy its own type and every tier reads as empty. */
  getTodaysAccumulators: () =>
    request<AccumulatorResponse>('/leagues/daily-accumulators'),

  /** A slip rebuilt from fixtures that have not kicked off yet.
   *
   * The published card is frozen at 08:00 so it cannot change under anyone who
   * booked it, which means a visitor arriving mid-afternoon may find legs
   * already under way. This gives them something they can still place. It is
   * not archived and not settled — only the 08:00 card carries the record. */
  getBookableNow: () =>
    request<BookableNowResponse>('/leagues/bookable-now'),

  /** Live scores for today's fixtures, keyed by match_id. Fetched apart from
   *  the card because the card is frozen at 08:00 and a score is not. */
  getLiveScores: () =>
    request<LiveScoresResponse>('/leagues/live-scores'),

  /** Build a slip to a requested multiplier and book it.
   *
   * `horizon` is a real choice, not a setting. "today" settles tonight from a
   * single WAT calendar day; "week" draws on seven WAT dates, which provides
   * a larger qualifying board but takes longer to resolve. */
  buildSlip: (target: number, horizon: "today" | "week" = "week", refresh = false) =>
    request<BuiltSlip>(
      `/leagues/slip-builder/generate?target=${target}&horizon=${horizon}${refresh ? "&refresh=true" : ""}`,
      // Generous: on a cold instance this runs the pipeline across a week of
      // fixtures before it can answer.
      { method: "POST", timeoutMs: 240_000 }),

  getSlipTargets: () => request<SlipTargets>('/leagues/slip-builder/targets'),

  getPredictionHistory: (days = 14) =>
    request<HistoryResponse>(`/daily-predictions/history?days=${days}`),

  getAccumulatorResults: (date?: string) =>
    request<ResultsResponse>(`/accumulators/results${date ? `?target_date=${date}` : ''}`),

  /** Settled history for every category (banker, 2/5/10 odds, over 1.5). */
  getLeagueResults: (days = 30) =>
    request<LeagueResultsResponse>(`/leagues/results?days=${days}`),

  /** Predicted confidence vs measured hit rate. */
  getCalibration: (days = 180) =>
    request<CalibrationResponse>(`/leagues/calibration?days=${days}`),

};

/** A slip built to a requested multiplier. */
export interface BuiltSlip {
  status: "success" | "unavailable" | "error";
  target: number;
  horizon?: "today" | "week";
  odds?: number;
  legs?: number;
  /** The chance every leg lands. A 50x slip is a few percent, not a good bet
   *  dressed up — showing it is the difference between a product and a lure. */
  hit_probability?: number;
  /** Model-estimated return per unit: joint hit probability × displayed odds. */
  expected_return?: number;
  avg_confidence?: number;
  first_kickoff?: string | null;
  last_kickoff?: string | null;
  games?: GamePrediction[];
  booking?: TierBooking;
  /** Present when the target could not be reached honestly. */
  reason?: string;
  best_reachable?: number;
  cached?: boolean;
}

export interface SlipTargets {
  status: string;
  targets: number[];
  min: number;
  max: number;
  max_legs: number;
  horizons: string[];
  note: string;
}

export interface BookableNowResponse {
  status: string;
  available: boolean;
  reason?: string;
  date?: string;
  kickoffs_remaining?: number;
  accumulators?: AccumulatorResponse["accumulators"];
}

export interface LiveScoresResponse {
  status: string;
  count: number;
  scores: Record<string, {
    home_score: number | null;
    away_score: number | null;
    state: string;
    state_label: string;
    detail?: string | null;
    clock?: string | null;
    live: boolean;
    finished: boolean;
  }>;
  leagues: string[];
}

export interface CalibrationBucket {
  range: string;
  low: number;
  high: number;
  predicted: number;
  actual: number | null;
  sample: number;
}

export interface CalibrationResponse {
  status: string;
  buckets: CalibrationBucket[];
  total_legs: number;
  hit_rate: number | null;
  avg_predicted: number | null;
  bias: number | null;
}

export interface SettledLeg {
  match_id?: string;
  home_team: string;
  away_team: string;
  league?: string;
  commence_time?: string;
  prediction: string;
  market?: string;
  market_group?: string;
  odds?: number;
  odds_are_real?: boolean;
  confidence?: number;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  status: 'pending' | 'won' | 'lost' | 'void';
}

export interface SettledSlip {
  date: string;
  category: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  total_odds: number;
  hit_probability: number;
  picks: SettledLeg[];
  settled_at?: string | null;
}

export interface CategoryPerformance {
  /** "slip" — the whole accumulator is one bet. "pick" — each leg is its own
   *  bet, so won/lost count individual picks and must not be added to slips. */
  unit?: "slip" | "pick";
  won: number;
  lost: number;
  settled: number;
  win_rate: number;
  staked: number;
  returned: number;
  profit: number;
  roi: number;
}

export interface LeagueResultsResponse {
  status: string;
  days: number;
  summary: Record<string, CategoryPerformance>;
  history: SettledSlip[];
  rollover_history?: import("../types").RolloverChainDay[];
  by_date: Record<string, Record<string, SettledSlip>>;
}
