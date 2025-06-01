/**
 * Basketball-specific types and interfaces
 */

export type BasketballLeague = 'NBA' | 'WNBA' | 'G-League' | 'NCAA';
export type BasketballSeason = 'regular' | 'playoffs' | 'preseason' | 'offseason';
export type BasketballPredictionType = 'moneyline' | 'spread' | 'total' | 'player_props';

export interface BasketballTeam {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference: 'Eastern' | 'Western';
  division: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
}

export interface BasketballPlayer {
  id: string;
  name: string;
  position: string;
  jersey_number: number;
  team_id: string;
  stats?: {
    points_per_game: number;
    rebounds_per_game: number;
    assists_per_game: number;
    field_goal_percentage: number;
  };
}

export interface BasketballGame {
  id: string;
  home_team: BasketballTeam;
  away_team: BasketballTeam;
  start_time: string;
  league: BasketballLeague;
  season: BasketballSeason;
  venue?: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  score?: {
    home: number;
    away: number;
    quarter?: number;
    time_remaining?: string;
  };
  betting_lines?: {
    moneyline: {
      home: number;
      away: number;
    };
    spread: {
      home: number;
      away: number;
      points: number;
    };
    total: {
      over: number;
      under: number;
      points: number;
    };
  };
}

export interface BasketballPrediction {
  id: string;
  game_id: string;
  game: BasketballGame;
  prediction_type: BasketballPredictionType;
  prediction: string;
  odds: number;
  confidence: number;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
  explanation?: string;
  model_version?: string;
  
  // Specific prediction details
  moneyline_prediction?: 'home' | 'away';
  spread_prediction?: {
    team: 'home' | 'away';
    points: number;
  };
  total_prediction?: {
    type: 'over' | 'under';
    points: number;
  };
  
  // Quality metrics
  quality_score?: number;
  reliability_index?: number;
  value_bet?: boolean;
  expected_value?: number;
}

export interface BasketballModelStatus {
  model_name: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  last_updated: string;
  accuracy: number;
  predictions_today: number;
  version: string;
  league: BasketballLeague;
  prediction_types: BasketballPredictionType[];
  performance_metrics?: {
    precision: number;
    recall: number;
    f1_score: number;
    roi: number;
    sharpe_ratio: number;
  };
  training_data?: {
    games_count: number;
    last_training_date: string;
    features_count: number;
  };
}

export interface BasketballApiResponse {
  predictions: BasketballPrediction[];
  total_count: number;
  date: string;
  season_active: boolean;
  season_info: {
    current_season: BasketballSeason;
    season_start: string;
    season_end: string;
    playoffs_start?: string;
  };
  models_status: BasketballModelStatus[];
  meta_info?: {
    api_version: string;
    last_updated: string;
    data_sources: string[];
  };
}

export interface BasketballSeasonInfo {
  league: BasketballLeague;
  season: BasketballSeason;
  year: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  playoffs_start?: string;
  playoffs_end?: string;
  games_total: number;
  games_completed: number;
  current_week?: number;
}

export interface BasketballStats {
  total_predictions: number;
  accuracy_overall: number;
  accuracy_by_type: Record<BasketballPredictionType, number>;
  roi_overall: number;
  roi_by_type: Record<BasketballPredictionType, number>;
  active_models: number;
  season_active: boolean;
  predictions_today: number;
  value_bets_found: number;
}

export interface BasketballFilters {
  league?: BasketballLeague;
  season?: BasketballSeason;
  prediction_type?: BasketballPredictionType;
  min_confidence?: number;
  max_odds?: number;
  min_odds?: number;
  team?: string;
  date_range?: {
    start: string;
    end: string;
  };
  value_bets_only?: boolean;
}

// Enhanced basketball prediction with AI explanations
export interface EnhancedBasketballPrediction extends BasketballPrediction {
  ai_explanation?: {
    method: 'SHAP' | 'LIME';
    feature_importance: {
      feature_name: string;
      importance_score: number;
      impact: 'positive' | 'negative';
    }[];
    key_factors: string[];
    risk_factors: string[];
    confidence_explanation: string;
  };
  meta_stacking?: {
    ensemble_models: string[];
    model_weights: Record<string, number>;
    consensus_score: number;
    disagreement_score: number;
  };
  market_analysis?: {
    value_bet: boolean;
    expected_value: number;
    market_efficiency: number;
    recommended_stake?: number;
  };
}

export default {
  BasketballLeague,
  BasketballSeason,
  BasketballPredictionType,
  BasketballTeam,
  BasketballPlayer,
  BasketballGame,
  BasketballPrediction,
  BasketballModelStatus,
  BasketballApiResponse,
  BasketballSeasonInfo,
  BasketballStats,
  BasketballFilters,
  EnhancedBasketballPrediction
};
