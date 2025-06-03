export type SportType = "soccer" | "basketball" | "mixed" | "tennis" | "football" | string;
export type DataSourceType = "football-data-org" | "football-data-uk" | "balldontlie" | "mock";
export type BookmakerType = "bet365" | "betway" | "1xbet" | "22bet" | "sportybet";
export type PredictionStatus = "won" | "lost" | "pending";

// Backend API response types
export type ServiceUsed = "cached_predictions" | "advanced_ml_service" | "basic_prediction_service" | "fallback_mock_data";
export type PredictionType = "match_result" | "over_under" | "btts" | "both_teams_to_score" | "total_goals";
export type BettingCodeStatus = "pending" | "won" | "lost" | "void";

// Backend Punter interface (matches API response)
export interface Punter {
  id: number;
  name: string;
  nickname?: string;
  country: string;
  popularity: number;
  specialty?: string;
  success_rate?: number;
  image_url?: string;
  social_media?: Record<string, string>;
  bio?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  winRate?: number;
  totalPredictions?: number;
  wonPredictions?: number;
  averageOdds?: number;
  specialties?: SportType[];
}

// Backend Bookmaker interface (matches API response)
export interface Bookmaker {
  id: number;
  name: string;
  country: string;
  website?: string;
  logo_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  // Backend fields
  form?: string;
}

// Backend Fixture interface (matches API response)
export interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  league: string;
  match_datetime: string;
  home_team_form?: string;
  away_team_form?: string;
  venue?: string;
  status?: string;
}

// Legacy Game interface for backward compatibility
export interface Game {
  id: string;
  sport?: SportType;
  homeTeam: Team | string;
  awayTeam: Team | string;
  startTime: Date | string;
  league: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  status?: "scheduled" | "live" | "finished" | "cancelled";
  score?: { home: number; away: number };
  // Backend compatibility
  fixture?: Fixture;
}

// Backend Prediction interface (matches API response)
export interface Prediction {
  id: number;
  fixture: Fixture;
  prediction_type: PredictionType;
  prediction: string;
  odds: number;
  confidence: number;
  created_at: string;
  updated_at: string;
  status?: PredictionStatus;

  // Nested predictions for combination bets
  predictions?: Prediction[];
  combined_odds?: number;
  combined_confidence?: number;

  // Service information
  service_used?: ServiceUsed;

  // Quality metrics from ML models
  quality_rating?: string;
  prediction_quality?: number;
  match_result_confidence?: number;
  over_under_confidence?: number;
  btts_confidence?: number;
  match_result_certainty?: number;
  over_under_certainty?: number;
  btts_certainty?: number;

  // Legacy fields for backward compatibility
  gameId?: string;
  game?: Game;
  predictionType?: string;
  createdAt?: Date | string;
  description?: string;
  reason?: string;
  explanation?: string;
  confidencePct?: number;
  uncertainty?: number;
  gameCode?: string;
  punterId?: string;
  punter?: Punter;
  bookmaker?: BookmakerType;
  rolloverDay?: number;
  combinedOdds?: number;
  combinedConfidence?: number;
  comboId?: string;
  value?: number;

  // Prediction percentages
  homeWinPct?: number;
  drawPct?: number;
  awayWinPct?: number;
  over25Pct?: number;
  under25Pct?: number;
  bttsYesPct?: number;
  bttsNoPct?: number;

  // Any additional fields from the API
  [key: string]: any;
}

// Backend BettingCode interface (matches API response)
export interface BettingCode {
  id: number;
  code: string;
  punter_id: number;
  punter_name: string;
  bookmaker_id?: number;
  bookmaker_name?: string;
  odds?: number;
  event_date?: string;
  expiry_date?: string;
  status: BettingCodeStatus;
  confidence?: number;
  featured: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Nested objects
  punter?: Punter;
  bookmaker?: Bookmaker;
}

export interface DailyPredictions {
  date: Date;
  predictions: Prediction[];
}

export interface RolloverGame {
  id: string;
  predictions: Prediction[];
  startDate: Date;
  endDate: Date;
  successRate: number;
  isActive: boolean;
  // New fields for 10-day rollover
  targetOdds?: number;
  dailyCombinations?: {
    day: number;
    date: Date;
    predictions: Prediction[];
    combinedOdds: number;
    combinedConfidence: number;
    status: "won" | "lost" | "pending";
  }[];
}

export interface StatsOverview {
  totalPredictions: number;
  wonPredictions: number;
  lostPredictions: number;
  pendingPredictions: number;
  successRate: number;
  averageOdds: number;
}

export interface SportStats {
  sport: SportType;
  totalPredictions: number;
  successRate: number;
}

export interface PredictionFilters {
  sport?: SportType;
  status?: "won" | "lost" | "pending";
  dateRange?: {
    start: Date;
    end: Date;
  };
  odds?: {
    min: number;
    max: number;
  };
}

// Backend API Response interfaces
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: string;
  service_used?: ServiceUsed;
  cache_status?: "HIT" | "MISS";
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version?: string;
  services?: {
    database?: "healthy" | "unhealthy";
    ml_models?: "healthy" | "unhealthy";
    cache?: "healthy" | "unhealthy";
  };
}

export interface PredictionCategoriesResponse {
  "2_odds": Prediction[];
  "5_odds": Prediction[];
  "10_odds": Prediction[];
  "rollover": Prediction[];
  service_used?: ServiceUsed;
  timestamp?: string;
}

export interface BettingCodesResponse {
  betting_codes: BettingCode[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

