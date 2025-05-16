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
  getOddsClass,
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
  // Safely extract prediction data with null checks
  const game = safeGet(prediction, 'game', {}) as Record<string, unknown>;

  // Extract team objects and handle them properly
  const homeTeamObj = safeGet(game, 'homeTeam', { name: 'Home Team' });
  const awayTeamObj = safeGet(game, 'awayTeam', { name: 'Away Team' });

  // Extract team names safely - check for both object and string formats
  let homeTeam = 'Home Team';
  if (typeof homeTeamObj === 'string') {
    homeTeam = homeTeamObj;
  } else if (homeTeamObj && typeof homeTeamObj === 'object') {
    homeTeam = safeGet(homeTeamObj, 'name', 'Home Team') as string;
  }

  let awayTeam = 'Away Team';
  if (typeof awayTeamObj === 'string') {
    awayTeam = awayTeamObj;
  } else if (awayTeamObj && typeof awayTeamObj === 'object') {
    awayTeam = safeGet(awayTeamObj, 'name', 'Away Team') as string;
  }

  // Log team names for debugging
  console.log('Team names:', { homeTeam, awayTeam, homeTeamObj, awayTeamObj });

  const league = safeGet(game, 'league', 'Unknown League') as string;
  const sport = safeGet(game, 'sport', 'mixed') as string;
  const startTime = safeGet(game, 'startTime', null) as Date | string | null;
  const predictionType = safeGet(prediction, 'predictionType', '') as string;
  const odds = safeGet(prediction, 'odds', 0) as number;
  const status = safeGet(prediction, 'status', 'pending') as string;
  const createdAt = safeGet(prediction, 'createdAt', null) as Date | string | null;
  const explanation = safeGet(prediction, 'explanation', '') as string;
  const description = safeGet(prediction, 'description', '') as string;
  // Get confidence and normalize it to be between 0 and 1
  let confidenceValue = safeGet(prediction, 'confidence', 0) as number;

  // If confidence is greater than 1, assume it's already a percentage and convert to decimal
  if (confidenceValue > 1) {
    confidenceValue = confidenceValue / 100;
  }

  // Ensure confidence is never above 100%
  const confidence = Math.min(confidenceValue, 1);

  // Extract quality metrics with null checks
  const qualityRating = safeGet(prediction, 'quality_rating', '') as string;
  const predictionQuality = safeGet(prediction, 'prediction_quality', 0) as number;
  const matchResultCertainty = safeGet(prediction, 'match_result_certainty', 0) as number;
  const overUnderCertainty = safeGet(prediction, 'over_under_certainty', 0) as number;
  const bttsCertainty = safeGet(prediction, 'btts_certainty', 0) as number;

  // Extract prediction percentages with null checks
  const homeWinPct = safeGet(prediction, 'homeWinPct', 0) as number;
  const drawPct = safeGet(prediction, 'drawPct', 0) as number;
  const awayWinPct = safeGet(prediction, 'awayWinPct', 0) as number;
  const over25Pct = safeGet(prediction, 'over25Pct', 0) as number;
  const under25Pct = safeGet(prediction, 'under25Pct', 0) as number;
  const bttsYesPct = safeGet(prediction, 'bttsYesPct', 0) as number;
  const bttsNoPct = safeGet(prediction, 'bttsNoPct', 0) as number;

  const gameCode = safeGet(prediction, 'gameCode', '') as string;
  const bookmaker = safeGet(prediction, 'bookmaker', '') as string;

  // Generate a reason if none exists
  const reason = explanation || description || generateReason(predictionType, homeTeam, awayTeam, odds);

  // Get game status
  const gameStatus = safeGet(prediction, 'game.status', '') as string;

  // Get game start time and convert to local time
  const gameTimeStr = safeGet(prediction, 'game.startTime', '');
  const gameTime = gameTimeStr ? new Date(gameTimeStr) : new Date();

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

  // Calculate derived values
  const statusVariant =
    status === "won" ? "success" :
    status === "lost" ? "destructive" :
    "warning";

  const oddsClass = getOddsClass(odds);

  // Mock data for stats (in a real app, this would come from the prediction)
  const valueRating = Math.floor((confidence / 20) + 1); // 1-5 scale based on confidence
  const valueStars = "★".repeat(valueRating) + "☆".repeat(5 - valueRating);
  // Unused variable commented out
  // const historicalSuccess = Math.floor(confidence);

  // Determine card variant class
  const variantClass =
    variant === PredictionCardVariant.PREMIUM ? "border-[#F5A623]/30 bg-gradient-to-b from-[#1A1A27] to-[#1A1A27]/80" :
    variant === PredictionCardVariant.ROLLOVER ? "border-[#56CCF2]/30 bg-gradient-to-b from-[#1A1A27] to-[#1A1A27]/80" :
    "";

  // Render different layouts based on mode
  if (mode === PredictionCardMode.COMPACT) {
    return (
      <motion.div
        className={`p-3 border border-[#2A2A3C]/30 rounded-xl bg-gradient-to-b from-[#1A1A27]/90 to-[#1A1A27]/70 shadow-sm ${className}`}
        onClick={onClick}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        variants={cardVariants}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-semibold truncate mr-2 text-white">
            {homeTeam} vs {awayTeam}
          </div>
          <div className="flex items-center gap-1">
            <PredictionQuality prediction={prediction} showDetails={false} />
            <div className={`text-sm font-bold px-2 py-1 rounded-md bg-[#2A2A3C]/50 ${oddsClass}`}>
              {formatOdds(odds)}x
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <div className="bg-[#2A2A3C]/50 text-xs px-2 py-1 rounded-md text-white">
              {predictionType}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <div className="text-xs text-[#A1A1AA]">
              {gameTimeStr ? formatLocalDateTime(gameTimeStr).split(' ')[0] : safeFormatDate(startTime)}
            </div>
          </div>
        </div>

        <div className="flex items-center text-xs text-[#A1A1AA] mt-2">
          <div className="bg-[#2A2A3C]/30 px-2 py-0.5 rounded-md">{league}</div>
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
            <div className={`px-3 py-2 rounded-lg ${variant === PredictionCardVariant.PREMIUM ? 'bg-[#F5A623]/20 text-[#F5A623]' : 'bg-white/10 text-white'} font-bold`}>
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
            <p className="text-xs font-medium text-white/70">{Math.round(confidence * 100)}%</p>
          </div>
          <div className="w-full bg-[#2A2A3C] rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${variant === PredictionCardVariant.PREMIUM ? 'bg-[#F5A623]' : 'bg-[#56CCF2]'}`}
              style={{ width: `${Math.round(confidence * 100)}%` }}
            ></div>
          </div>
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



