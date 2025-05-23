export type SportType = "soccer" | "basketball" | "mixed" | "tennis" | "football" | string;
export type DataSourceType = "football-data-org" | "football-data-uk" | "balldontlie" | "mock";
export type BookmakerType = "bet365" | "betway" | "1xbet" | "22bet" | "sportybet";
export type PredictionStatus = "won" | "lost" | "pending";

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

export interface Prediction {
  id: string;
  gameId?: string;
  game: Game;
  predictionType: string;
  prediction?: string;
  odds: number;
  status: "won" | "lost" | "pending";
  createdAt: Date | string;
  description?: string;
  reason?: string;
  explanation?: string;
  confidence?: number;
  confidencePct?: number;
  uncertainty?: number;
  gameCode?: string;
  punterId?: string;
  punter?: Punter;
  bookmaker?: BookmakerType;
  rolloverDay?: number;
  // Fields for API compatibility
  predictions?: any[];
  combined_odds?: number;
  combined_confidence?: number;
  // Fields for combination predictions
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
  // Quality metrics
  quality_rating?: string;
  prediction_quality?: number;
  match_result_confidence?: number;
  over_under_confidence?: number;
  btts_confidence?: number;
  match_result_certainty?: number;
  over_under_certainty?: number;
  btts_certainty?: number;
  // Any additional fields from the API
  [key: string]: any;
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

