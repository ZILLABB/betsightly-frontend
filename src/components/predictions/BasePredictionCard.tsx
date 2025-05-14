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
import {
  PredictionCardMode,
  PredictionCardVariant,
  getOddsClass,
  formatOdds,
  generateReason
} from "../../utils/predictionUtils";

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

  // Extract team names safely
  const homeTeam = typeof homeTeamObj === 'string' ? homeTeamObj : safeGet(homeTeamObj, 'name', 'Home Team') as string;
  const awayTeam = typeof awayTeamObj === 'string' ? awayTeamObj : safeGet(awayTeamObj, 'name', 'Away Team') as string;

  const league = safeGet(game, 'league', 'Unknown League') as string;
  const sport = safeGet(game, 'sport', 'mixed') as string;
  const startTime = safeGet(game, 'startTime', null) as Date | string | null;
  const predictionType = safeGet(prediction, 'predictionType', '') as string;
  const odds = safeGet(prediction, 'odds', 0) as number;
  const status = safeGet(prediction, 'status', 'pending') as string;
  const createdAt = safeGet(prediction, 'createdAt', null) as Date | string | null;
  const explanation = safeGet(prediction, 'explanation', '') as string;
  const description = safeGet(prediction, 'description', '') as string;
  const confidence = safeGet(prediction, 'confidence', 0) as number;
  const gameCode = safeGet(prediction, 'gameCode', '') as string;
  const bookmaker = safeGet(prediction, 'bookmaker', '') as string;

  // Generate a reason if none exists
  const reason = explanation || description || generateReason(predictionType, homeTeam, awayTeam, odds);

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
      <div
        className={`p-2 border rounded-lg ${variantClass} ${className}`}
        onClick={onClick}
      >
        <div className="flex justify-between items-center mb-1">
          {index !== undefined && (
            <Badge variant="outline" className="mr-2 text-xs px-1.5 py-0.5">
              #{index}
            </Badge>
          )}
          <div className="flex items-center">
            <Badge variant={sport === "soccer" ? "info" : "warning"} className="text-xs px-1.5 py-0.5 mr-1">
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </Badge>
            {gameCode && (
              <div className="flex items-center ml-1">
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 mr-1">
                  {String(gameCode)}
                </Badge>
                <CopyButton
                  text={String(gameCode)}
                  successMessage="Code copied!"
                  className="text-xs"
                  onCopy={onCopy}
                />
              </div>
            )}
          </div>
          <Badge variant={statusVariant} className="uppercase text-xs px-1.5 py-0.5">
            {status}
          </Badge>
        </div>

        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-semibold truncate mr-2">
            {homeTeam} vs {awayTeam}
          </div>
          <div className={`text-sm font-bold ${oddsClass}`}>
            {formatOdds(odds)}x
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-[#A1A1AA]">
          <div>{league}</div>
          <div>{safeFormatDate(startTime)}</div>
        </div>

        {showReason && reason && (
          <div className="mt-2 text-xs text-[#A1A1AA] italic">
            "{reason}"
          </div>
        )}
      </div>
    );
  }

  // Standard or detailed mode
  return (
    <Card
      variant={variant === PredictionCardVariant.PREMIUM ? "premium" : "default"}
      className={`w-full ${className}`}
      onClick={onClick}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant={sport === "soccer" ? "info" : "warning"} className="mb-1 text-xs px-1.5 py-0.5">
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </Badge>
            <CardTitle className="text-base">
              {homeTeam} vs {awayTeam}
            </CardTitle>
            <p className="text-xs text-[#A1A1AA]">{league}</p>
          </div>
          <Badge variant={statusVariant} className="uppercase text-xs px-1.5 py-0.5">
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-xs font-medium text-[#A1A1AA]">Prediction</p>
            <p className="text-sm font-semibold">{predictionType}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#A1A1AA]">Odds</p>
            <p className={`text-sm font-bold ${oddsClass}`}>{formatOdds(odds)}x</p>
          </div>
        </div>

        {showStats && (
          <>
            {/* Value Rating */}
            <div className="mb-2">
              <p className="text-xs font-medium text-[#A1A1AA] mb-0.5">Value Rating</p>
              <div className="flex items-center">
                <span className="text-[#F5A623] text-sm">{valueStars}</span>
                <span className="ml-2 text-xs text-[#A1A1AA]">
                  {valueRating >= 4 ? "Excellent Value" :
                   valueRating >= 3 ? "Good Value" :
                   valueRating >= 2 ? "Fair Value" : "Low Value"}
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="mb-2">
              <p className="text-xs font-medium text-[#A1A1AA] mb-0.5">Confidence</p>
              <div className="w-full bg-[#2A2A3C] rounded-full h-2">
                <div
                  className="bg-[#56CCF2] h-2 rounded-full"
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-[#A1A1AA] mt-1">
                <span>Low</span>
                <span>{confidence}%</span>
                <span>High</span>
              </div>
            </div>
          </>
        )}

        {/* Match Time */}
        <div className="flex items-center text-xs text-[#A1A1AA] mb-2">
          <Calendar size={12} className="mr-1" />
          <span>{safeFormatDate(startTime)}</span>
        </div>

        {/* Game Code if available */}
        {gameCode && (
          <div className="flex items-center mb-2">
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 mr-1">
              {gameCode}
            </Badge>
            <CopyButton
              text={gameCode}
              successMessage="Code copied!"
              className="text-xs"
              onCopy={onCopy}
            />
            {bookmaker && (
              <span className="ml-2 text-xs text-[#A1A1AA] capitalize">{bookmaker}</span>
            )}
          </div>
        )}

        {/* Reason/Explanation */}
        {showReason && reason && (
          <div className="mt-2 p-2 bg-[#1A1A27]/50 rounded-md">
            <p className="text-xs text-[#A1A1AA] italic">"{reason}"</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t p-2 text-xs text-[#A1A1AA]">
        <div className="flex justify-between w-full items-center">
          <span className="text-xs">Created: {safeFormatDate(createdAt)}</span>
          {variant === PredictionCardVariant.PREMIUM && (
            <Badge variant="premium" className="text-xs px-1.5 py-0.5">Premium</Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BasePredictionCard;

// Re-export the enums for use in other components
export { PredictionCardMode, PredictionCardVariant };



