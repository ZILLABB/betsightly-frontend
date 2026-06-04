/**
 * World Cup 2026 API Service
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface WCPrediction {
  match_id: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  commence_time: string;
  prediction: string;
  prediction_key: string;
  confidence: number;
  risk_level: string;
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
