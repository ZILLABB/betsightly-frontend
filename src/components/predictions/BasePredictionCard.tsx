/**
 * Base Prediction Card Component
 *
 * This component provides a foundation for displaying prediction cards with
 * different layouts and styles.
 */

import React from "react";
import { Badge } from "../common/Badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../common/Card";
import CopyButton from "../common/CopyButton";
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
  showStats = true,
  // showActions = true,
  index,

  // Actions
  onCopy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onShare: _onShare,
  onClick,

  // Styling
  className = ""
}) => {
  // First, log the entire prediction object to see its structure
  console.log('Full prediction object:', prediction);

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

  // Log fixture data for debugging
  console.log('Fixture data:', fixture);

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

  // Log team data for debugging
  console.log('Team data from API:', {
    homeTeam,
    awayTeam,
    homeForm,
    awayForm
  });

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

  // Log the odds data for debugging
  console.log('Odds data:', {
    finalOdds: odds,
    predictionOdds: safeGet(prediction, 'odds', null),
    predictionCombinedOdds: safeGet(prediction, 'combined_odds', null),
    nestedPredictionOdds: firstNestedPrediction ? safeGet(firstNestedPrediction, 'odds', null) : null
  });

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

  // Log prediction data for debugging
  console.log('Prediction data:', {
    league,
    predictionType,
    predictionText,
    odds,
    homeOdds,
    drawOdds,
    awayOdds
  });
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

  // Log confidence data for debugging
  console.log('Confidence data:', {
    confidenceValue,
    confidence,
    predictionCombinedConfidence: safeGet(prediction, 'combined_confidence', null),
    nestedPredictionConfidence: firstNestedPrediction ? safeGet(firstNestedPrediction, 'confidence', null) : null
  });

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

  // Log the game time for debugging
  console.log('Game time data:', {
    gameTimeStr,
    startTime,
    gameTime,
    dateString,
    timeString,
    fixtureDate: fixture ? safeGet(fixture, 'date', null) : null
  });

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

  // Log value rating data for debugging
  console.log('Value rating data:', {
    valueRating,
    valueStars,
    confidence,
    odds,
    calculatedValue: confidence * odds
  });

  // Render different layouts based on mode
  if (mode === PredictionCardMode.COMPACT) {
    return (
      <motion.div
        className={`relative overflow-hidden p-3 border border-[#2A2A3C]/40 rounded-lg bg-gradient-to-b from-[#1A1A27] to-[#131320] shadow-md hover:shadow-lg transition-all duration-300 ${className}`}
        onClick={onClick}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        variants={cardVariants}
      >
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500/80 to-amber-600/50"></div>

        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            derivedGameStatus.includes('LIVE') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            derivedGameStatus.includes('ENDED') ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
            derivedGameStatus.includes('IN PLAY') ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            derivedGameStatus.includes('STARTS') ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            derivedGameStatus.includes('TODAY') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              derivedGameStatus.includes('LIVE') ? 'bg-red-400 animate-pulse' :
              derivedGameStatus.includes('IN PLAY') ? 'bg-green-400 animate-pulse' :
              'bg-current'
            }`}></span>
            <span>{derivedGameStatus}</span>
          </div>
        </div>

        {/* Main content with padding for the status indicator */}
        <div className="pt-6">
          {/* Teams */}
          <div className="mb-3">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 mr-2"></div>
              <h3 className="text-sm font-semibold text-white">{homeTeam}</h3>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 mr-2"></div>
              <h3 className="text-sm font-semibold text-white">{awayTeam}</h3>
            </div>
          </div>

          {/* Middle section with prediction type and odds */}
          <div className="flex justify-between items-center mb-3">
            <div className="bg-[#2A2A3C]/60 text-xs px-2 py-1 rounded-md text-white font-medium">
              {predictionType}
            </div>
            <div className="flex items-center">
              <div className="text-xs font-bold px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400">
                {formatOdds(odds)}x
              </div>
            </div>
          </div>

          {/* Bottom section with league, time and confidence */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-xs text-white/70 bg-[#2A2A3C]/40 px-2 py-0.5 rounded-md">
                {league}
              </div>
              <div className="text-xs text-white/60">
                {gameTimeStr ? formatLocalDateTime(gameTimeStr).split(' ')[0] : safeFormatDate(startTime)}
              </div>
            </div>
            <PredictionQuality prediction={prediction} showDetails={false} />
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard or detailed mode
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
        className={`w-full overflow-hidden ${className}`}
        onClick={onClick}
      >
      {/* Card Header with Gradient Background */}
      <div className={`relative overflow-hidden ${variant === PredictionCardVariant.PREMIUM ? 'bg-gradient-to-r from-[#1A1A27] to-[#2A1A27]' : 'bg-gradient-to-r from-[#1A1A27] to-[#1A2A37]'}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <CardHeader className="p-4 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {homeTeam} vs {awayTeam}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <div className={`text-xs px-2 py-0.5 rounded-md ${
                  derivedGameStatus.includes('LIVE') ? 'bg-red-500/20 text-red-400' :
                  derivedGameStatus.includes('ENDED') ? 'bg-gray-500/20 text-gray-400' :
                  derivedGameStatus.includes('IN PLAY') ? 'bg-green-500/20 text-green-400' :
                  derivedGameStatus.includes('STARTS') ? 'bg-yellow-500/20 text-yellow-400' :
                  derivedGameStatus.includes('TODAY') ? 'bg-purple-500/20 text-purple-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {derivedGameStatus}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-white/70" />
                  <p className="text-xs text-white/70">
                    {gameTimeStr ? formatLocalDateTime(gameTimeStr) : safeFormatDate(startTime)}
                  </p>
                </div>
              </div>
            </div>
            <div className={`px-3 py-2 rounded-lg flex items-center justify-center min-w-[60px] ${
              variant === PredictionCardVariant.PREMIUM
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            } font-bold`}>
              {formatOdds(odds)}x
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="p-4 bg-[#1A1A27]">
        <div className="flex justify-between items-center mb-4">
          <div className="bg-[#2A2A3C]/50 px-3 py-2 rounded-lg">
            <p className="text-xs font-medium text-white/70 mb-1">League</p>
            <p className="text-sm font-medium text-white">{league}</p>
          </div>
          <div className="bg-[#2A2A3C]/50 px-3 py-2 rounded-lg">
            <p className="text-xs font-medium text-white/70 mb-1">Bet Type</p>
            <p className="text-sm font-semibold text-white">{predictionType}</p>
          </div>
        </div>

        {/* Confidence indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-medium text-white/70">Confidence</p>
            <p className="text-xs font-medium text-white/70">
              {safeGet(prediction, 'confidence_display',
                (confidence * 100).toFixed(1) + '%')}
            </p>
          </div>
          <div className="w-full bg-[#2A2A3C] rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${variant === PredictionCardVariant.PREMIUM ? 'bg-[#F5A623]' : 'bg-[#56CCF2]'}`}
              style={{ width: `${safeGet(prediction, 'confidence_pct', confidence * 100)}%` }}
            ></div>
          </div>

          {/* Uncertainty indicator (if available) */}
          {(uncertainty !== null || safeGet(prediction, 'uncertainty', null) !== null) && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-medium text-white/70">Uncertainty</p>
                <p className="text-xs font-medium text-white/70">
                  {safeGet(prediction, 'uncertainty_display',
                    (safeGet(prediction, 'uncertainty', uncertainty) as number * 100).toFixed(1) + '%')}
                </p>
              </div>
              <div className="w-full bg-[#2A2A3C] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-[#F97316]"
                  style={{ width: `${safeGet(prediction, 'uncertainty_pct',
                    (safeGet(prediction, 'uncertainty', uncertainty) as number * 100))}%` }}
                ></div>
              </div>
              <p className="text-xs text-white/50 mt-1">
                {safeGet(prediction, 'uncertainty_message',
                  (safeGet(prediction, 'uncertainty', uncertainty) as number) < 0.2
                    ? "High confidence in this prediction"
                    : (safeGet(prediction, 'uncertainty', uncertainty) as number) < 0.4
                    ? "Good confidence in this prediction"
                    : (safeGet(prediction, 'uncertainty', uncertainty) as number) < 0.6
                    ? "Moderate uncertainty in this prediction"
                    : "High uncertainty in this prediction"
                )}
              </p>
            </div>
          )}
        </div>

        {/* Quality Rating */}
        <div className="mb-4">
          <PredictionQuality prediction={prediction} showDetails={true} />
        </div>

        {/* Reason/Explanation */}
        {showReason && reason && (
          <div className="mt-3 p-3 bg-[#2A2A3C]/30 rounded-lg border-l-2 border-[#56CCF2]">
            <p className="text-xs text-white/80">{reason}</p>
          </div>
        )}
      </CardContent>

      {/* Premium badge */}
      {variant === PredictionCardVariant.PREMIUM && (
        <div className="absolute top-0 right-0">
          <div className="bg-[#F5A623] text-[#1A1A27] text-xs font-bold px-2 py-1 rounded-bl-md">
            PREMIUM
          </div>
        </div>
      )}
    </Card>
    </motion.div>
  );
};

export default BasePredictionCard;

// Re-export the enums for use in other components
export { PredictionCardMode, PredictionCardVariant };



