export type SportType = "soccer" | "basketball" | "mixed";
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
  homeTeam: Team;
  awayTeam: Team;
  startTime: Date;
  league: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  status: "scheduled" | "live" | "finished" | "cancelled";
}

export interface Prediction {
  id: string;
  gameId?: string;
  game: Game;
  predictionType: string;
  odds: number;
  status: "won" | "lost" | "pending";
  createdAt: Date;
  description?: string;
  reason?: string;
  explanation?: string;
  confidence?: number;
  gameCode?: string;
  punterId?: string;
  punter?: Punter;
  bookmaker?: BookmakerType;
  rolloverDay?: number;  
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

