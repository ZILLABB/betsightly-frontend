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
  /** When this pick entered the card. Picks added after first publication
   *  carry a later stamp and `added_later`, so the morning card stays
   *  distinguishable from anything that appeared during the day. */
  added_at?: string;
  added_later?: boolean;
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
  models_used?: number;
  model_sources?: string[];
  raw_confidence?: number;
  ml_confidence?: number | null;
  market_implied_probability?: number | null;
  calibration_group?: string;
  calibration_sample?: number;
  safe_tier_eligible?: boolean;
  edge?: number;
  expected_value?: number;
  bookmaker?: string;
  model_type?: string;
  // Logo URLs (from API-Football)
  home_team_logo?: string;
  away_team_logo?: string;
  league_logo?: string;
  /** True when `odds` is a live sportsbook price, not our own fair price. */
  odds_are_real?: boolean;
  odds_provider?: string;
  match_info?: MatchInfo;
  /** Kickoff time (UTC ISO). */
  kickoff?: string;
  market?: string;
  league_slug?: string;
  venue?: string | null;
  venue_city?: string | null;
  broadcast?: string[];
  /** Last five results, most recent last, e.g. "WWLDW". */
  home_form?: string | null;
  away_form?: string | null;
  home_record?: string | null;
  away_record?: string | null;
  expected_goals?: number;
  expected_home_goals?: number;
  expected_away_goals?: number;
  elo_agreement?: string | null;
}

export interface MatchInfo {
  kickoff_utc?: string;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  broadcast?: string | null;
  /** Last five results, most recent last, e.g. "WWLDW". */
  home_form?: string | null;
  away_form?: string | null;
  home_record?: string | null;
  away_record?: string | null;
  home_elo?: number | null;
  away_elo?: number | null;
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

/**
 * A SportyBet booking code for one tier.
 *
 * `active` is the only status carrying a code. The others exist so the card
 * can say why a tier has none rather than silently omitting the row — a
 * missing code with no explanation reads as a bug, and `stale` in particular
 * needs saying out loud, because someone may have copied the old one.
 */
export interface TierBooking {
  status: "active" | "unavailable" | "failed" | "invalid" | "stale";
  share_code?: string | null;
  share_url?: string;
  legs?: number;
  /** True when a singles tier booked only the picks that were available.
   *  Ten Over 1.5 picks are ten bets, so a code holding seven of them is
   *  seven of those bets — but the card has to say so rather than implying
   *  the code carries everything on screen. */
  partial?: boolean;
  /** Fixtures the bookmaker had no counterpart for. */
  unbooked?: string[];
  /** When the code was created — the prices in it are the prices from then. */
  priced_at?: string;
  expires_at?: string | null;
  reason?: string;
}

export interface CategoryData {
  selected: boolean;
  games: GamePrediction[];
  total_odds: number;
  risk_level: string;
  /** For an accumulator, the chance every leg lands — a 10x slip is ~15%, not
   *  a safe bet. For a `singles` tier, the average chance of one pick landing. */
  hit_probability?: number;
  /** How the tier is meant to be staked. `singles` means every pick is its own
   *  bet, so the combined odds and joint probability must not be the headline —
   *  ten 70% picks land together 2.8% of the time, and showing that as the
   *  tier's number would state a risk nobody is actually taking. Absent means
   *  accumulator, which is how every other tier works. */
  presentation?: "accumulator" | "singles";
  /** The SportyBet slip for this exact tier, when one could be created. */
  booking?: TierBooking;
  /** Bumped whenever the tier is extended after first publication. */
  revision?: number;
  last_updated_at?: string;
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
  /** When the card was first built, and how many times it has been rebuilt.
   *  A rebuild used to replace the day's card leaving no trace, so someone
   *  refreshing a tier could not tell what had changed. */
  first_published_at?: string;
  last_updated_at?: string;
  revision?: number;
  accumulators: {
    banker: CategoryData;
    '2_odds': CategoryData;
    '5_odds': CategoryData;
    '10_odds': CategoryData;
    over_1_5: CategoryData;
    rollover: CategoryData;
  };
}

export type CategoryKey = 'banker' | '2_odds' | '5_odds' | '10_odds' | 'over_1_5' | 'rollover';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  faint: string;
  riskLabel: string;
}

/**
 * Categories are ordered safest-first and coloured along a single green-to-amber
 * risk axis rather than each getting its own hue.
 *
 * Six competing saturated colours is the strongest "generated" tell a UI can
 * have, and it also wastes colour: when every tab is a different bright hue,
 * hue carries no meaning beyond "which tab". Here green means reliable and
 * amber means risky, so the palette says something true before a word is read,
 * and red/green stay free to mean lost/won.
 */
export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'banker',
    label: 'Banker',
    shortLabel: 'Bank',
    description: 'One or two picks · highest reliability',
    color: '#34d399',
    faint: 'rgba(52,211,153,0.09)',
    riskLabel: 'Most Reliable',
  },
  {
    key: 'over_1_5',
    label: 'Over 1.5',
    shortLabel: '1.5+',
    description: '2+ goals · very safe picks',
    color: '#10b981',
    faint: 'rgba(16,185,129,0.08)',
    riskLabel: 'Very Safe',
  },
  {
    key: '2_odds',
    label: '2 Odds',
    shortLabel: '2x',
    description: 'Safe picks · high confidence',
    color: '#059669',
    faint: 'rgba(5,150,105,0.10)',
    riskLabel: 'Low Risk',
  },
  {
    key: '5_odds',
    label: '5 Odds',
    shortLabel: '5x',
    description: 'Balanced risk & reward',
    color: '#fbbf24',
    faint: 'rgba(251,191,36,0.08)',
    riskLabel: 'Medium Risk',
  },
  {
    key: '10_odds',
    label: '10 Odds',
    shortLabel: '10x',
    description: 'Long shot · rarely lands',
    color: '#f59e0b',
    faint: 'rgba(245,158,11,0.08)',
    riskLabel: 'High Risk',
  },
  {
    key: 'rollover',
    label: 'Rollover',
    shortLabel: 'Roll',
    description: 'Multi-day challenge',
    color: '#fb923c',
    faint: 'rgba(251,146,60,0.08)',
    riskLabel: 'Challenge',
  },
];
