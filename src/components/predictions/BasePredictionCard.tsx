/**
 * Base Prediction Card Component
 *
 * This component provides a foundation for displaying prediction cards with
 * different layouts and styles.
 */

import React from "react";
import { Card, CardContent, CardHeader } from "../common/Card";
import TeamLogo from "../common/TeamLogo";
import { safeGet, safeFormatDate } from "../../utils/nullChecks";
import { Calendar } from "lucide-react";
import type { Prediction } from "../../types";
import { motion } from "framer-motion";
import { cardVariants } from "../../utils/animations";
import { formatLocalDateTime } from "../../utils/formatters";
import {
  PredictionCardMode,
  PredictionCardVariant,
  formatOdds,
  generateReason
} from "../../utils/predictionUtils";
import PredictionQuality from "./PredictionQuality";

interface BasePredictionCardProps {
  // Data
  prediction: Prediction;

  // Display options
  mode?: PredictionCardMode;
  variant?: PredictionCardVariant;
  showReason?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  index?: number;

  // Actions
  onCopy?: () => void;
  // onShare is unused but kept for API compatibility
  onShare?: () => void;
  onClick?: () => void;

  // Styling
  className?: string;
}

/**
 * Base Prediction Card Component
 */
const BasePredictionCard: React.FC<BasePredictionCardProps> = ({
  // Data
  prediction,

  // Display options
  mode = PredictionCardMode.STANDARD,
  variant = PredictionCardVariant.DEFAULT,
  showReason = true,
  index,
  onClick,

  // Styling
  className = ""
}) => {
  // Check if this prediction has nested predictions (common in API response)
  const nestedPredictions = safeGet(prediction, 'predictions', null) as any[] | null;

  // If we have nested predictions, use the first one for additional data
  const firstNestedPrediction = nestedPredictions && nestedPredictions.length > 0
    ? nestedPredictions[0]
    : null;

  // Extract fixture data from the nested prediction
  const fixture = firstNestedPrediction
    ? safeGet(firstNestedPrediction, 'fixture', null)
    : safeGet(prediction, 'fixture', null);

  // Extract game data (legacy format)
  const game = safeGet(prediction, 'game', {}) as Record<string, unknown>;

  // Home team extraction - prioritize fixture data based on API example
  let homeTeam: string | null = null;

  if (fixture) {
    // Get from fixture (primary source based on API example)
    homeTeam = safeGet(fixture, 'home_team', null) as string | null;
  }

  // Fallbacks if not found in fixture
  if (!homeTeam) {
    // Try direct from prediction
    homeTeam = safeGet(prediction, 'home_team',
      safeGet(prediction, 'homeTeam', null)) as string | null;

    // Try from nested prediction
    if (!homeTeam && firstNestedPrediction) {
      homeTeam = safeGet(firstNestedPrediction, 'home_team',
        safeGet(firstNestedPrediction, 'homeTeam', null)) as string | null;
    }

    // Try from game object (legacy format)
    if (!homeTeam) {
      const homeTeamObj = safeGet(game, 'homeTeam', null);
      if (typeof homeTeamObj === 'string') {
        homeTeam = homeTeamObj;
      } else if (homeTeamObj && typeof homeTeamObj === 'object') {
        homeTeam = safeGet(homeTeamObj, 'name', null) as string | null;
      }
    }
  }

  // Away team extraction - prioritize fixture data based on API example
  let awayTeam: string | null = null;

  if (fixture) {
    // Get from fixture (primary source based on API example)
    awayTeam = safeGet(fixture, 'away_team', null) as string | null;
  }

  // Fallbacks if not found in fixture
  if (!awayTeam) {
    // Try direct from prediction
    awayTeam = safeGet(prediction, 'away_team',
      safeGet(prediction, 'awayTeam', null)) as string | null;

    // Try from nested prediction
    if (!awayTeam && firstNestedPrediction) {
      awayTeam = safeGet(firstNestedPrediction, 'away_team',
        safeGet(firstNestedPrediction, 'awayTeam', null)) as string | null;
    }

    // Try from game object (legacy format)
    if (!awayTeam) {
      const awayTeamObj = safeGet(game, 'awayTeam', null);
      if (typeof awayTeamObj === 'string') {
        awayTeam = awayTeamObj;
      } else if (awayTeamObj && typeof awayTeamObj === 'object') {
        awayTeam = safeGet(awayTeamObj, 'name', null) as string | null;
      }
    }
  }

  // If still not found, use default values
  homeTeam = homeTeam || 'Home Team';
  awayTeam = awayTeam || 'Away Team';

  // Extract team form data from fixture
  const homeForm = fixture ? safeGet(fixture, 'home_form', null) : null;
  const awayForm = fixture ? safeGet(fixture, 'away_form', null) : null;

  // Get league with priority order - prioritize fixture data based on API example
  let league = 'Unknown League';

  if (fixture) {
    // Get from fixture (primary source based on API example)
    league = safeGet(fixture, 'league_name', null) as string || league;
  }

  // Fallbacks if not found in fixture
  if (league === 'Unknown League') {
    league = safeGet(prediction, 'league',
      safeGet(prediction, 'competition',
        safeGet(firstNestedPrediction, 'league',
          safeGet(firstNestedPrediction, 'competition',
            safeGet(game, 'league',
              safeGet(game, 'competition', 'Unknown League')))))) as string;
  }

  // Get prediction type with priority order - prioritize nested prediction based on API example
  let predictionType = '';

  if (firstNestedPrediction) {
    // Get from nested prediction (primary source based on API example)
    predictionType = safeGet(firstNestedPrediction, 'prediction_type', null) as string || predictionType;
  }

  // Fallbacks if not found in nested prediction
  if (!predictionType) {
    predictionType = safeGet(prediction, 'predictionType',
      safeGet(prediction, 'prediction_type',
        safeGet(prediction, 'bet_type', ''))) as string;
  }

  // Format prediction type for display
  if (predictionType === 'match_result') {
    predictionType = 'Match Result';
  } else if (predictionType === 'over_under') {
    predictionType = 'Over/Under 2.5';
  } else if (predictionType === 'btts') {
    predictionType = 'Both Teams To Score';
  }

  // Get prediction text based on prediction type and nested prediction data
  let predictionText = '';

  if (firstNestedPrediction) {
    if (predictionType === 'Match Result') {
      const matchResultPred = safeGet(firstNestedPrediction, 'match_result_pred', null);
      if (matchResultPred === 'home') {
        predictionText = `${homeTeam} to win`;
      } else if (matchResultPred === 'draw') {
        predictionText = 'Draw';
      } else if (matchResultPred === 'away') {
        predictionText = `${awayTeam} to win`;
      }
    } else if (predictionType === 'Over/Under 2.5') {
      const overUnderPred = safeGet(firstNestedPrediction, 'over_under_pred', null);
      predictionText = `${overUnderPred === 'over' ? 'Over' : 'Under'} 2.5 goals`;
    } else if (predictionType === 'Both Teams To Score') {
      const bttsPred = safeGet(firstNestedPrediction, 'btts_pred', null);
      predictionText = `BTTS: ${bttsPred === 'yes' ? 'Yes' : 'No'}`;
    }
  }

  // Get odds with priority order - ensure we get the correct odds for each prediction
  let odds = 0;

  // For nested predictions (like in 5_odds and 10_odds categories)
  if (firstNestedPrediction) {
    // If this is a nested prediction from the predictions array, use its own odds
    odds = safeGet(firstNestedPrediction, 'odds', 0) as number;

    // If the prediction has its own odds (it might be a nested prediction passed directly)
    const predictionOdds = safeGet(prediction, 'odds', 0) as number;
    if (odds === 0 && predictionOdds > 0) {
      odds = predictionOdds;
    }

    // If still no odds, try combined odds from parent
    if (odds === 0) {
      odds = safeGet(prediction, 'combined_odds', 0) as number;
    }
  } else {
    // For regular predictions, try direct odds first
    odds = safeGet(prediction, 'odds', 0) as number;

    // If not found, try combined odds
    if (odds === 0) {
      odds = safeGet(prediction, 'combined_odds', 0) as number;
    }

    // Last fallback to value field
    if (odds === 0) {
      odds = safeGet(prediction, 'value', 0) as number;
    }
  }

  // Get match odds from fixture
  const homeOdds = fixture ? safeGet(fixture, 'home_odds', null) : null;
  const drawOdds = fixture ? safeGet(fixture, 'draw_odds', null) : null;
  const awayOdds = fixture ? safeGet(fixture, 'away_odds', null) : null;

  // Get explanation with priority order
  const explanation = safeGet(prediction, 'explanation',
    safeGet(prediction, 'reason',
      safeGet(firstNestedPrediction, 'explanation',
        safeGet(firstNestedPrediction, 'reason', '')))) as string;

  // Get description with priority order
  const description = safeGet(prediction, 'description',
    safeGet(prediction, 'summary',
      safeGet(firstNestedPrediction, 'description',
        safeGet(firstNestedPrediction, 'summary', '')))) as string;

  // Get confidence with priority order based on API example
  let confidenceValue = 0;

  // First try combined_confidence from main prediction (based on API example)
  confidenceValue = safeGet(prediction, 'combined_confidence', 0) as number;

  // If not found, try confidence from nested prediction
  if (confidenceValue === 0 && firstNestedPrediction) {
    confidenceValue = safeGet(firstNestedPrediction, 'confidence', 0) as number;
  }

  // Fallbacks if still not found
  if (confidenceValue === 0) {
    confidenceValue = safeGet(prediction, 'confidence',
      safeGet(prediction, 'confidence_pct',
        safeGet(prediction, 'confidencePct', 0))) as number;
  }

  // If confidence is greater than 1, assume it's already a percentage and convert to decimal
  if (confidenceValue > 1) {
    confidenceValue = confidenceValue / 100;
  }

  // Ensure confidence is never above 100%
  const confidence = Math.min(confidenceValue, 1);

  // Get uncertainty with priority order
  let uncertaintyValue = safeGet(prediction, 'uncertainty',
    safeGet(prediction, 'uncertainty_pct',
      safeGet(firstNestedPrediction, 'uncertainty',
        safeGet(firstNestedPrediction, 'uncertainty_pct', null)))) as number | null;

  // If uncertainty is greater than 1, assume it's already a percentage and convert to decimal
  if (uncertaintyValue && uncertaintyValue > 1) {
    uncertaintyValue = uncertaintyValue / 100;
  }

  // Ensure uncertainty is never above 100% or below 0%
  const uncertainty = uncertaintyValue !== null ? Math.min(Math.max(uncertaintyValue, 0), 1) : null;

  // Get prediction quality with priority order
  const predictionQuality = safeGet(prediction, 'prediction_quality',
    safeGet(prediction, 'quality',
      safeGet(prediction, 'quality_rating',
        safeGet(firstNestedPrediction, 'prediction_quality',
          safeGet(firstNestedPrediction, 'quality',
            safeGet(firstNestedPrediction, 'quality_rating', 0)))))) as number;

  // Generate a reason if none exists
  const reason = explanation || description || generateReason(predictionType, homeTeam, awayTeam, odds);

  // Get category and game code
  const category = safeGet(prediction, 'category',
    safeGet(prediction, 'prediction_category',
      safeGet(firstNestedPrediction, 'category',
        safeGet(firstNestedPrediction, 'prediction_category', '')))) as string;

  const gameCode = safeGet(prediction, 'gameCode',
    safeGet(prediction, 'game_code',
      safeGet(prediction, 'code',
        safeGet(firstNestedPrediction, 'gameCode',
          safeGet(firstNestedPrediction, 'game_code',
            safeGet(firstNestedPrediction, 'code', '')))))) as string;

  // Get game status with priority order
  const gameStatus = safeGet(prediction, 'game_status',
    safeGet(prediction, 'match_status',
      safeGet(game, 'status',
        safeGet(game, 'match_status',
          safeGet(prediction, 'status',
            safeGet(prediction, 'result', '')))))) as string;

  // Get game start time from fixture based on API example
  let gameTimeStr = '';

  if (fixture) {
    // Get from fixture (primary source based on API example)
    gameTimeStr = safeGet(fixture, 'date', null) as string || gameTimeStr;
  }

  // Fallbacks if not found in fixture
  if (!gameTimeStr) {
    gameTimeStr = safeGet(prediction, 'game_time',
      safeGet(prediction, 'match_time',
        safeGet(prediction, 'startTime',
          safeGet(prediction, 'start_time',
            safeGet(prediction, 'date',
              safeGet(game, 'startTime',
                safeGet(game, 'start_time',
                  safeGet(game, 'date',
                    safeGet(firstNestedPrediction, 'startTime',
                      safeGet(firstNestedPrediction, 'start_time',
                        safeGet(firstNestedPrediction, 'date', ''))))))))))) as string;
  }

  // Get start time for fallback display
  const startTime = gameTimeStr || '';

  // Convert to local time (with type safety)
  const gameTime = gameTimeStr && typeof gameTimeStr === 'string' && gameTimeStr.length > 0
    ? new Date(gameTimeStr)
    : new Date();

  // Format date and time for display
  const dateString = gameTime.toLocaleDateString();
  const timeString = gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get current time in user's local timezone
  const now = new Date();

  // Calculate time difference in milliseconds
  const timeDiff = now.getTime() - gameTime.getTime();

  // Format game time for display with AM/PM
  const formattedGameTime = gameTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // Ensure 12-hour format with AM/PM
  });

  // Get today's date at midnight for date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get game date at midnight
  const gameDate = new Date(gameTime);
  gameDate.setHours(0, 0, 0, 0);

  // Check if game is today
  const isToday = gameDate.getTime() === today.getTime();

  // Determine game status based on start time if status is not provided
  const derivedGameStatus =
    safeGet(prediction, 'status', '') === 'unavailable' ? 'NO DATA' :
    gameStatus === 'live' || gameStatus === 'in_play' ? 'LIVE' :
    gameStatus === 'finished' || gameStatus === 'ended' ? 'ENDED' :
    timeDiff > 7200000 ? 'ENDED' : // More than 2 hours after start time
    timeDiff > 0 && timeDiff < 7200000 ? 'IN PLAY' : // Started but less than 2 hours ago
    isToday && timeDiff > -3600000 ? `STARTS ${formattedGameTime}` : // Today and within 1 hour
    isToday ? `TODAY ${formattedGameTime}` : // Later today
    'UPCOMING';

  // Calculate value rating based on confidence and odds
  // This is a common formula used in betting: higher confidence and higher odds = better value
  let valueRating = 1; // Default to 1 star

  if (confidence > 0 && odds > 0) {
    // Calculate value rating based on confidence and odds
    // Higher confidence and higher odds = better value
    // Scale to 1-5 stars
    valueRating = Math.min(5, Math.max(1, Math.floor((confidence * odds) / 2)));
  } else {
    // Fallbacks if confidence or odds are missing
    valueRating = safeGet(prediction, 'value_rating',
      safeGet(prediction, 'value',
        safeGet(firstNestedPrediction, 'value_rating',
          safeGet(firstNestedPrediction, 'value',
            predictionQuality > 0
              ? Math.floor(predictionQuality)
              : Math.floor((confidence / 20) + 1)
          )
        )
      )
    ) as number;
  }

  // Generate star rating display
  const valueStars = "★".repeat(Math.min(valueRating, 5)) + "☆".repeat(Math.max(0, 5 - valueRating));

  // Render different layouts based on mode
  if (mode === PredictionCardMode.COMPACT) {
    return (
      <motion.div
        className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 ${className}`}
        onClick={onClick}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        variants={cardVariants}
      >
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-yellow-500 rounded-l-xl"></div>

        {/* Premium badge for compact mode */}
        {variant === PredictionCardVariant.PREMIUM && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              PREMIUM
            </div>
          </div>
        )}

        {/* Index number if provided */}
        {index !== undefined && (
          <div className="absolute top-2 left-3 z-10">
            <div className="bg-gray-800/80 text-amber-400 text-xs font-bold px-2 py-1 rounded-md">
              #{index}
            </div>
          </div>
        )}

        <div className="relative z-5 space-y-2">
          {/* Teams - compact vertical layout */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <TeamLogo teamName={homeTeam} size="sm" variant="circle" />
              <span className="text-white font-medium text-xs text-center">{homeTeam}</span>
            </div>
            <div className="flex justify-center">
              <span className="text-amber-500 font-bold text-xs">VS</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <TeamLogo teamName={awayTeam} size="sm" variant="circle" />
              <span className="text-white font-medium text-xs text-center">{awayTeam}</span>
            </div>
          </div>

          {/* Prediction and odds */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-400 font-medium truncate">{predictionText || predictionType}</p>
            </div>
            <div className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-1 rounded-md font-bold text-xs">
              {formatOdds(odds)}x
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-gray-400 truncate">{league}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500 truncate">
                {gameTimeStr ? formatLocalDateTime(gameTimeStr).split(' ')[0] : safeFormatDate(startTime)}
              </span>
            </div>
            <div className="flex-shrink-0">
              <PredictionQuality prediction={prediction} showDetails={false} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard or detailed mode - Formal Base Design
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      variants={cardVariants}
      className="w-full"
    >
      <Card
        variant={variant === PredictionCardVariant.PREMIUM ? "premium" : "default"}
        className={`w-full overflow-hidden relative shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
        onClick={onClick}
      >
        {/* Premium Badge */}
        {variant === PredictionCardVariant.PREMIUM && (
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              PREMIUM
            </div>
          </div>
        )}

        {/* Card Header - Team Information */}
        <CardHeader className="p-4 pb-3 border-b" style={{ background: "rgba(0,0,0,0.25)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between gap-4">
            {/* Teams Section */}
            <div className="flex-1 min-w-0">
              <div className="space-y-2 mb-3">
                {/* Home Team */}
                <div className="flex items-center justify-center gap-2">
                  <TeamLogo teamName={homeTeam} size="md" variant="circle" />
                  <span className="text-white font-semibold text-sm text-center">{homeTeam}</span>
                </div>

                {/* VS Separator */}
                <div className="flex justify-center">
                  <span className="text-amber-500 font-bold text-lg">VS</span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-center gap-2">
                  <TeamLogo teamName={awayTeam} size="md" variant="circle" />
                  <span className="text-white font-semibold text-sm text-center">{awayTeam}</span>
                </div>
              </div>

              {/* League and Status */}
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="text-amber-400 font-medium">{league}</span>
                <span className="text-gray-400">•</span>
                <div className={`px-2 py-1 rounded-md font-medium ${
                  derivedGameStatus.includes('NO DATA') ? 'bg-gray-600/20 text-gray-500' :
                  derivedGameStatus.includes('LIVE') ? 'bg-red-500/20 text-red-400' :
                  derivedGameStatus.includes('ENDED') ? 'bg-gray-500/20 text-gray-400' :
                  derivedGameStatus.includes('IN PLAY') ? 'bg-green-500/20 text-green-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {derivedGameStatus}
                </div>
              </div>
            </div>

            {/* Odds Display */}
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 px-4 py-2 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-amber-400 font-medium">ODDS</div>
                  <div className="text-amber-500 font-bold text-lg">{formatOdds(odds)}x</div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Time */}
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{gameTimeStr ? formatLocalDateTime(gameTimeStr) : safeFormatDate(startTime)}</span>
          </div>
        </CardHeader>

        {/* Card Content - Prediction Details */}
        <CardContent className="p-4 space-y-3">
          {/* Prediction Type */}
          <div className="rounded-lg p-3" style={{ background: "var(--surface-4)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 font-medium mb-1">PREDICTION</div>
                <div className="text-white font-semibold">{predictionText || predictionType}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 font-medium mb-1">CATEGORY</div>
                <div className="text-amber-400 font-medium text-sm">{category || 'Standard'}</div>
              </div>
            </div>
          </div>

          {/* Confidence Metrics */}
          <div className="space-y-3">
            {/* Confidence Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-400">CONFIDENCE</span>
                <span className="text-xs font-bold text-amber-400">
                  {safeGet(prediction, 'confidence_display', (confidence * 100).toFixed(1) + '%')}
                </span>
              </div>
              <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "var(--surface-5)" }}>
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, safeGet(prediction, 'confidence_pct', confidence * 100)))}%` }}
                ></div>
              </div>
            </div>

            {/* Risk Level (if available) */}
            {(uncertainty !== null || safeGet(prediction, 'uncertainty', null) !== null) && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-400">RISK LEVEL</span>
                  <span className="text-xs font-bold text-red-400">
                    {safeGet(prediction, 'uncertainty_display',
                      (safeGet(prediction, 'uncertainty', uncertainty) as number * 100).toFixed(1) + '%')}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "var(--surface-5)" }}>
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, safeGet(prediction, 'uncertainty_pct',
                      (safeGet(prediction, 'uncertainty', uncertainty) as number * 100))))}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Quality Rating */}
          <div className="pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <PredictionQuality prediction={prediction} showDetails={false} />
          </div>

          {/* Reason/Explanation */}
          {showReason && reason && (
            <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid var(--border-default)" }}>
              <div className="text-xs text-amber-400 font-medium mb-2">ANALYSIS</div>
              <p className="text-sm text-gray-300 leading-relaxed">{reason}</p>
            </div>
          )}

          {/* Game Code (if available) */}
          {gameCode && (
            <div className="flex items-center justify-center pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="text-xs text-gray-500">
                Code: <span className="font-mono text-amber-400">{gameCode}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BasePredictionCard;

// Re-export the enums for use in other components
export { PredictionCardMode, PredictionCardVariant };



