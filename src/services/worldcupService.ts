/**
 * World Cup 2026 API Service
 */

// Strip trailing /api if present — worldcup endpoints are at /api/worldcup/*
const _raw = import.meta.env.VITE_API_BASE_URL || 'https://betsightly-api.onrender.com/api';
const API_BASE = _raw.replace(/\/api\/?$/, '');

export interface WCPrediction {
  match_id: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  commence_time: string;
  prediction: string;
  prediction_key: string;
  prediction_market: string;
  confidence: number;
  risk_level: string;
  top_tips: { tip: string; market: string; confidence: number; odds?: number }[];
  probabilities: { home_win: number; draw: number; away_win: number };
  goals: {
    expected_home: number;
    expected_away: number;
    expected_total: number;
    over_2_5_prob: number;
    under_2_5_prob: number;
    over_1_5_prob: number;
    btts_prob: number;
  };
  best_odds: {
    home_win?: number;
    away_win?: number;
    draw?: number;
    over_2_5?: number;
    under_2_5?: number;
  };
  value_bets: {
    bet: string;
    market: string;
    odds: number;
    our_prob: number;
    implied_prob: number;
    edge: number;
    expected_value: number;
  }[];
  data_quality: {
    home_has_wc_data: boolean;
    away_has_wc_data: boolean;
    home_wc_matches: number;
    away_wc_matches: number;
  };
}

export interface WCValueBet {
  match: string;
  match_id: string;
  commence_time: string;
  home_team_logo?: string;
  away_team_logo?: string;
  bet: string;
  market: string;
  odds: number;
  our_prob: number;
  implied_prob: number;
  edge: number;
  expected_value: number;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function getWCPredictions(minConfidence = 0): Promise<WCPrediction[]> {
  const data = await fetchJSON<{ predictions: WCPrediction[] }>(
    `/api/worldcup/predictions?min_confidence=${minConfidence}`
  );
  return data.predictions;
}

export async function getWCValueBets(minEdge = 0): Promise<WCValueBet[]> {
  const data = await fetchJSON<{ value_bets: WCValueBet[] }>(
    `/api/worldcup/value-bets?min_edge=${minEdge}`
  );
  return data.value_bets;
}

export async function getWCTeams(): Promise<any[]> {
  const data = await fetchJSON<{ teams: any[] }>('/api/worldcup/teams');
  return data.teams;
}

export interface WCGroup {
  teams: { name: string; logo?: string }[];
  matches: WCPrediction[];
  total_matches: number;
}

export async function getWCGroups(): Promise<Record<string, WCGroup>> {
  const data = await fetchJSON<{ groups: Record<string, WCGroup> }>('/api/worldcup/groups');
  return data.groups;
}

export interface WCAccuPick {
  match: string;
  match_id: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  commence_time: string;
  group: string;
  tip: string;
  market: string;
  confidence: number;
  estimated_odds?: number;
}

export interface WCAccumulator {
  picks: WCAccuPick[];
  total_picks: number;
  total_odds: number;
  label: string;
}

export async function getWCAccumulators(date?: string): Promise<{ date: string; accumulators: Record<string, WCAccumulator> }> {
  const url = date ? `/api/worldcup/accumulators?date=${date}` : '/api/worldcup/accumulators';
  return fetchJSON(url);
}

export async function getWCPerformance(): Promise<any> {
  return fetchJSON('/api/worldcup/performance');
}
