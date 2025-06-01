/**
 * Professional Prediction Card Component
 *
 * This component provides a comprehensive, professional display for betting predictions
 * with enhanced visual design, multiple prediction types, and detailed confidence analysis.
 */

import React, { useState } from "react";
import { Badge } from "../common/Badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../common/Card";
import CopyButton from "../common/CopyButton";
import { safeGet, safeFormatDate } from "../../utils/nullChecks";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  extractPredictionData,
  formatPredictionText,
  formatGameTime,
  getConfidenceColorClass,
  getReliabilityIndicator
} from "../../utils/predictionDataExtraction";

interface ProfessionalPredictionCardProps {
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
 * Professional Prediction Card Component
 */
const ProfessionalPredictionCard: React.FC<ProfessionalPredictionCardProps> = ({
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
  // State for expandable sections
  const [showProbabilities, setShowProbabilities] = useState(false);

  // Use the new extraction utility for consistent data handling
  const extractedData = extractPredictionData(prediction);
  const { fixture, predictions, overallConfidence, league, gameTime, homeTeam, awayTeam } = extractedData;



  // Legacy data extraction for backward compatibility
  const game = safeGet(prediction, 'game', {}) as Record<string, unknown>;

  // Extract team form data from fixture
  const homeForm = fixture ? safeGet(fixture, 'home_form', null) : null;
  const awayForm = fixture ? safeGet(fixture, 'away_form', null) : null;

  // Use extracted data for display
  const predictionType = 'Match Result'; // Default display type
  const predictionText = formatPredictionText('match_result', predictions.match_result, homeTeam, awayTeam);
  const odds = safeGet(prediction, 'odds', safeGet(prediction, 'combined_odds', 2.0)) as number;

  // Get match odds from fixture
  const homeOdds = fixture ? safeGet(fixture, 'home_odds', null) : null;
  const drawOdds = fixture ? safeGet(fixture, 'draw_odds', null) : null;
  const awayOdds = fixture ? safeGet(fixture, 'away_odds', null) : null;

  // Get explanation with priority order
  const explanation = safeGet(prediction, 'explanation', safeGet(prediction, 'reason', '')) as string;

  // Get description with priority order
  const description = safeGet(prediction, 'description', safeGet(prediction, 'summary', '')) as string;
  // Use extracted confidence (already processed)
  const confidence = overallConfidence / 100; // Convert to decimal for compatibility

  // Get uncertainty with priority order
  let uncertaintyValue = safeGet(prediction, 'uncertainty', safeGet(prediction, 'uncertainty_pct', null)) as number | null;

  // If uncertainty is greater than 1, assume it's already a percentage and convert to decimal
  if (uncertaintyValue && uncertaintyValue > 1) {
    uncertaintyValue = uncertaintyValue / 100;
  }

  // Ensure uncertainty is never above 100% or below 0%
  const uncertainty = uncertaintyValue !== null ? Math.min(Math.max(uncertaintyValue, 0), 1) : null;

  // Get prediction quality with priority order
  const predictionQuality = safeGet(prediction, 'prediction_quality',
    safeGet(prediction, 'quality',
      safeGet(prediction, 'quality_rating', 0))) as number;

  // Generate a reason if none exists
  const reason = explanation || description || generateReason(predictionType, homeTeam, awayTeam, odds);

  // Get game status with priority order
  const gameStatus = safeGet(prediction, 'game_status',
    safeGet(prediction, 'match_status',
      safeGet(game, 'status',
        safeGet(game, 'match_status',
          safeGet(prediction, 'status',
            safeGet(prediction, 'result', '')))))) as string;

  // Process game time using the utility function
  const gameTimeDate = typeof gameTime === 'string' ? new Date(gameTime) :
                      gameTime instanceof Date ? gameTime : new Date();

  // Ensure we have a valid date
  if (isNaN(gameTimeDate.getTime())) {
    console.warn('Invalid game time, using current time as fallback');
  }

  // Get current time for status calculation
  const now = new Date();
  const timeDiff = now.getTime() - gameTimeDate.getTime();

  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gameDate = new Date(gameTimeDate);
  gameDate.setHours(0, 0, 0, 0);
  const isToday = gameDate.getTime() === today.getTime();

  // Format game time for display
  const formattedGameTime = formatGameTime(gameTime);

  // Determine game status based on start time if status is not provided
  const derivedGameStatus =
    gameStatus === 'live' || gameStatus === 'in_play' ? 'LIVE' :
    gameStatus === 'finished' || gameStatus === 'ended' ? 'ENDED' :
    timeDiff > 7200000 ? 'ENDED' : // More than 2 hours after start time
    timeDiff > 0 && timeDiff < 7200000 ? 'IN PLAY' : // Started but less than 2 hours ago
    isToday && timeDiff > -3600000 ? `STARTS ${formattedGameTime}` : // Today and within 1 hour
    isToday ? `TODAY ${formattedGameTime}` : // Later today
    formattedGameTime; // Show formatted time for future games

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
        predictionQuality > 0
          ? Math.floor(predictionQuality)
          : Math.floor((confidence / 20) + 1)
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
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col gap-1 flex-1 mr-2">
              {predictionText && (
                <div className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-md font-semibold border border-amber-500/30">
                  {predictionText}
                </div>
              )}
              <div className="bg-[#2A2A3C]/60 text-xs px-2 py-1 rounded-md text-white font-medium">
                {predictionType}
              </div>
            </div>
            <div className="flex items-center flex-shrink-0">
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
                {formattedGameTime}
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
        {/* League - stacked vertically for cleaner layout */}
        <div className="bg-[#2A2A3C]/50 px-3 py-2 rounded-lg mb-3">
          <p className="text-xs font-medium text-white/70 mb-1">League</p>
          <p className="text-sm font-medium text-white">{league}</p>
        </div>



        {/* All Three Predictions - Enhanced Display */}
        <div className="bg-[#2A2A3C]/50 px-3 py-2 rounded-lg mb-4">
          <p className="text-xs font-medium text-white/70 mb-2">Predictions</p>

          {/* Match Result */}
          {predictions.match_result && (
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">⚽</span>
                <span className="text-xs font-medium text-white">Match Result</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-400">
                  {predictions.match_result.prediction === 'home' ? homeTeam :
                   predictions.match_result.prediction === 'away' ? awayTeam :
                   'Draw'}
                </span>
                <span className="text-xs text-white/70">
                  {predictions.match_result.confidence.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Over/Under */}
          {predictions.over_under && (
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">📊</span>
                <span className="text-xs font-medium text-white">Over/Under 2.5</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-400">
                  {predictions.over_under.prediction === 'over' ? 'Over 2.5' : 'Under 2.5'}
                </span>
                <span className="text-xs text-white/70">
                  {predictions.over_under.confidence.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Both Teams to Score */}
          {predictions.btts && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs">🎯</span>
                <span className="text-xs font-medium text-white">Both Teams to Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-400">
                  {predictions.btts.prediction === 'yes' ? 'Yes' : 'No'}
                </span>
                <span className="text-xs text-white/70">
                  {predictions.btts.confidence.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Confidence Display */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-white/70">Overall Confidence</p>
              {confidence >= 0.9 ? (
                <span className="text-xs">🔥</span>
              ) : confidence >= 0.8 ? (
                <span className="text-xs">⭐</span>
              ) : confidence >= 0.7 ? (
                <span className="text-xs">✅</span>
              ) : (
                <span className="text-xs">⚠️</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-white/70">
                {(confidence * 100).toFixed(1)}%
              </p>
              <span className="text-xs text-white/50">
                {confidence >= 0.9 ? 'Very High' :
                 confidence >= 0.8 ? 'High' :
                 confidence >= 0.7 ? 'Good' :
                 'Moderate'}
              </span>
            </div>
          </div>
          <div className="w-full bg-[#2A2A3C] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                confidence >= 0.9 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                confidence >= 0.8 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                confidence >= 0.7 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                'bg-gradient-to-r from-orange-500 to-orange-400'
              }`}
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>

          {/* Reliability Indicator */}
          <div className="mt-2 text-xs text-white/60">
            {confidence >= 0.9 ? '🎯 Extremely reliable prediction' :
             confidence >= 0.8 ? '📈 Highly reliable prediction' :
             confidence >= 0.7 ? '✨ Good reliability' :
             '⚡ Moderate confidence - consider carefully'}
          </div>
        </div>

        {/* Expandable Probability Breakdown */}
        <div className="mb-4">
          <button
            onClick={() => setShowProbabilities(!showProbabilities)}
            className="flex items-center justify-between w-full p-2 bg-[#2A2A3C]/30 rounded-lg hover:bg-[#2A2A3C]/50 transition-colors"
          >
            <span className="text-xs font-medium text-white/70">📊 Detailed Probabilities</span>
            {showProbabilities ? (
              <ChevronUp className="h-3 w-3 text-white/70" />
            ) : (
              <ChevronDown className="h-3 w-3 text-white/70" />
            )}
          </button>

          {showProbabilities && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-3"
            >
              {/* Match Result Probabilities */}
              {predictions.match_result && predictions.match_result.probabilities && (
                <div className="bg-[#1A1A27]/50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-white/70 mb-2">⚽ Match Result Probabilities</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">{awayTeam} Win</span>
                      <span className="text-xs font-medium text-white">{(predictions.match_result.probabilities[0] * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">Draw</span>
                      <span className="text-xs font-medium text-white">{(predictions.match_result.probabilities[1] * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">{homeTeam} Win</span>
                      <span className="text-xs font-medium text-white">{(predictions.match_result.probabilities[2] * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Over/Under Probabilities */}
              {predictions.over_under && predictions.over_under.probabilities && (
                <div className="bg-[#1A1A27]/50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-white/70 mb-2">📊 Over/Under 2.5 Probabilities</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">Under 2.5</span>
                      <span className="text-xs font-medium text-white">{(predictions.over_under.probabilities[0] * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">Over 2.5</span>
                      <span className="text-xs font-medium text-white">{(predictions.over_under.probabilities[1] * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BTTS Probabilities */}
              {predictions.btts && predictions.btts.probabilities && (
                <div className="bg-[#1A1A27]/50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-white/70 mb-2">🎯 Both Teams to Score Probabilities</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">No</span>
                      <span className="text-xs font-medium text-white">{(predictions.btts.probabilities[0] * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">Yes</span>
                      <span className="text-xs font-medium text-white">{(predictions.btts.probabilities[1] * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
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

export default ProfessionalPredictionCard;

// Re-export the enums for use in other components
export { PredictionCardMode, PredictionCardVariant };

// Export with legacy name for backward compatibility
export { ProfessionalPredictionCard as BasePredictionCard };



