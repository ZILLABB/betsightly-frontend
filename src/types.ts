export type SportType = "soccer" | "basketball" | "mixed" | "tennis" | "football" | string;
export type DataSourceType = "football-data-org" | "football-data-uk" | "balldontlie" | "mock";
export type BookmakerType = "bet365" | "betway" | "1xbet" | "22bet" | "sportybet";
export type PredictionStatus = "won" | "lost" | "pending";
export type HealthStatus = "healthy" | "unhealthy" | "degraded";
export type ModelStatus = "active" | "inactive" | "training" | "error";
export type PredictionCategory = "2_odds" | "5_odds" | "10_odds" | "rollover";
export type AIExplanationMethod = "SHAP" | "LIME";

export interface Punter {
  id: string;
  name: string;
  winRate: number;
  totalPredictions: number;
  wonPredictions: number;
  averageOdds: number;
  specialties: SportType[];
  verified: boolean;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    telegram?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  logo: string;
}

export interface Game {
  id: string;
  sport: SportType;
  homeTeam: Team | string;
  awayTeam: Team | string;
  startTime: Date | string;
  league: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  status?: "scheduled" | "live" | "finished" | "cancelled";
  score?: { home: number; away: number };
}

// Individual prediction type for each bet category
export interface IndividualPrediction {
  prediction: string; // e.g., "home", "away", "draw", "over", "under", "yes", "no"
  confidence: number; // confidence percentage (0-100)
  probabilities: number[]; // probability array for different outcomes
}

// Fixture information from API
export interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  date: string; // ISO date string
  competition: string;
}

// Predictions object containing all three prediction types
export interface PredictionsObject {
  match_result: IndividualPrediction;
  over_under: IndividualPrediction;
  btts: IndividualPrediction;
}

// Main prediction interface matching API response structure
export interface Prediction {
  // Core API response structure
  fixture: Fixture;
  predictions: PredictionsObject;
  confidence: number; // overall confidence score
  timestamp?: string; // prediction timestamp

  // Legacy fields for backward compatibility
  id?: string;
  gameId?: string;
  game?: Game;
  predictionType?: string;
  prediction?: string;
  odds?: number;
  status?: "won" | "lost" | "pending";
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

  // Fields for API compatibility
  combined_odds?: number;
  combined_confidence?: number;
  combinedOdds?: number;
  combinedConfidence?: number;
  comboId?: string;
  value?: number;

  // Prediction percentages (legacy)
  homeWinPct?: number;
  drawPct?: number;
  awayWinPct?: number;
  over25Pct?: number;
  under25Pct?: number;
  bttsYesPct?: number;
  bttsNoPct?: number;

  // Quality metrics
  quality_rating?: string;
  prediction_quality?: number;
  match_result_confidence?: number;
  over_under_confidence?: number;
  btts_confidence?: number;
  match_result_certainty?: number;
  over_under_certainty?: number;
  btts_certainty?: number;
}

// API response structure for /api/predictions/best
export interface PredictionsApiResponse {
  "2_odds": Prediction[];
  "5_odds": Prediction[];
  "10_odds": Prediction[];
  "rollover": Prediction[];
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
  category?: PredictionCategory;
  minConfidence?: number;
  searchQuery?: string;
}

// Enhanced prediction interfaces
export interface AIExplanation {
  method: AIExplanationMethod;
  feature_importance: {
    feature_name: string;
    importance_score: number;
    impact: 'positive' | 'negative';
  }[];
  confidence_factors: string[];
  risk_factors: string[];
  explanation_text: string;
}

export interface MetaStackingInfo {
  ensemble_models: string[];
  model_weights: Record<string, number>;
  consensus_score: number;
  disagreement_score: number;
  final_confidence: number;
}

export interface MarketAnalysis {
  value_bet: boolean;
  expected_value: number;
  market_efficiency: number;
  recommended_stake?: number;
}

export interface EnhancedPrediction extends Prediction {
  ai_explanation?: AIExplanation;
  meta_stacking?: MetaStackingInfo;
  quality_score: number;
  reliability_index: number;
  market_analysis?: MarketAnalysis;
}

// Health monitoring interfaces
export interface SystemHealthStatus {
  overall_status: HealthStatus;
  last_updated: string;
  api_health: boolean;
  api_ready: boolean;
  api_alive: boolean;
  response_times: {
    health_check: number;
    readiness_check: number;
    liveness_check: number;
  };
  components?: {
    database: { status: HealthStatus; response_time: number };
    ml_models: { status: HealthStatus; response_time: number };
    external_apis: { status: HealthStatus; response_time: number };
    cache: { status: HealthStatus; response_time: number };
  };
}

// Auto-refresh configuration
export interface AutoRefreshConfig {
  enabled: boolean;
  interval: number;
  maxRetries: number;
  retryDelay: number;
}

