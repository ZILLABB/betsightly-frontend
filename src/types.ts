// ── Shared entity types (used by services + pages) ──────────────────────

export interface Punter {
  id: number;
  name: string;
  nickname?: string;
  telegram_username?: string;
  country: string;
  specialty?: string;
  verified: boolean;
  image_url?: string;
  bio?: string;
  social_media?: Record<string, string>;
  success_rate?: number;
  popularity?: number;
  total_won?: number;
  total_lost?: number;
  created_at?: string;
  updated_at?: string;
  betting_codes?: BettingCode[];
}

export interface Bookmaker {
  id: number;
  name: string;
  logo_url?: string;
  website_url?: string;
  created_at?: string;
}

export type BookmakerType = Bookmaker;

export interface BettingCode {
  id: number;
  code: string;
  punter_id: number;
  bookmaker_id?: number;
  odds?: number;
  event_date?: string;
  status: string;
  confidence?: number;
  featured?: boolean;
  notes?: string;
  punter_name?: string;
  bookmaker_name?: string;
  punter?: Punter;
  bookmaker?: Bookmaker;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp?: string;
  environment?: string;
}

export interface BettingCodesResponse {
  betting_codes: BettingCode[];
  total: number;
}

export type PredictionStatus = 'won' | 'lost' | 'pending';

export interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  league: string;
  match_datetime: string;
  status?: string;
}

export interface Prediction {
  id: number | string;
  fixture_id?: number;
  fixture?: Fixture;
  home_team?: string;
  away_team?: string;
  league?: string;
  date?: string;
  prediction: string;
  prediction_type: string;
  confidence: number;
  odds?: number;
  status?: PredictionStatus;
  created_at?: string;
  updated_at?: string;
  game?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    startTime: string;
    fixture?: Fixture;
  };
  gameId?: string;
  predictionType?: string;
  createdAt?: string;
}

export interface Game {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  date: string;
  status?: string;
  fixture?: Fixture;
}

// ── Prediction-specific types ───────────────────────────────────────────

export interface GamePrediction {
  fixture_id: number;
  home_team: string;
  away_team: string;
  league: string;
  date: string;
  prediction: string;  // readable prediction (e.g., "Over 1.5 goals")
  prediction_type: string;
  prediction_value?: string;
  readable_prediction?: string;  // keep for backwards compat
  confidence: number;
  estimated_odds?: number;
  odds?: number;  // real odds from bookmaker
  real_odds?: number;
  risk_score?: number;
  risk_level?: string;
  models_agreed?: number;
  edge?: number;
  expected_value?: number;
  bookmaker?: string;
  model_type?: string;
  // Logo URLs (from API-Football)
  home_team_logo?: string;
  away_team_logo?: string;
  league_logo?: string;
}

export interface RolloverPick {
  match_id: string;
  match: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  commence_time?: string;
  market: 'match_result' | 'goals' | 'btts' | 'double_chance';
  prediction: string;
  odds: number;
  confidence: number;
  status?: 'pending' | 'won' | 'lost' | 'void';
}

export interface RolloverChainDay {
  day_number: number;
  date: string;
  picks: RolloverPick[];
  combined_odds: number;
  avg_confidence: number;
  status: 'pending' | 'won' | 'lost' | 'void';
}

export interface CategoryData {
  selected: boolean;
  games: GamePrediction[];
  total_odds: number;
  risk_level: string;
  reason?: string;
  // Rollover-specific fields
  chain?: RolloverChainDay[];
  chain_length?: number;
  target_days?: number;
  cumulative_odds?: number;
}

export interface AccumulatorResponse {
  status: string;
  date: string;
  accumulators: {
    '2_odds': CategoryData;
    '5_odds': CategoryData;
    '10_odds': CategoryData;
    over_1_5: CategoryData;
    rollover: CategoryData;
  };
}

export type CategoryKey = '2_odds' | '5_odds' | '10_odds' | 'over_1_5' | 'rollover';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  faint: string;
  riskLabel: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: '2_odds',
    label: '2 Odds',
    shortLabel: '2x',
    description: 'Safe picks · high confidence',
    color: '#22c55e',
    faint: 'rgba(34,197,94,0.10)',
    riskLabel: 'Low Risk',
  },
  {
    key: '5_odds',
    label: '5 Odds',
    shortLabel: '5x',
    description: 'Balanced risk & reward',
    color: '#60a5fa',
    faint: 'rgba(96,165,250,0.10)',
    riskLabel: 'Medium Risk',
  },
  {
    key: '10_odds',
    label: '10 Odds',
    shortLabel: '10x',
    description: 'High reward accumulator',
    color: '#f59e0b',
    faint: 'rgba(245,158,11,0.10)',
    riskLabel: 'High Risk',
  },
  {
    key: 'over_1_5',
    label: 'Over 1.5',
    shortLabel: '⚽ 1.5',
    description: '2+ goals · very safe picks',
    color: '#f472b6',
    faint: 'rgba(244,114,182,0.10)',
    riskLabel: 'Very Safe',
  },
  {
    key: 'rollover',
    label: 'Rollover',
    shortLabel: 'Roll',
    description: 'Multi-day challenge',
    color: '#a78bfa',
    faint: 'rgba(167,139,250,0.10)',
    riskLabel: 'Challenge',
  },
];
