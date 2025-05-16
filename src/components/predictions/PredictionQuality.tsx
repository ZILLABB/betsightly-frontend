import React from "react";
import { Badge } from "../common/Badge";
import { safeGet } from "../../utils/nullChecks";
import type { Prediction } from "../../types";
import QualityMetricsChart from "./QualityMetricsChart";

interface PredictionQualityProps {
  prediction: Prediction;
  showDetails?: boolean;
  className?: string;
}

/**
 * PredictionQuality Component
 *
 * Displays quality metrics for a prediction including:
 * - Quality rating (A+, A, B+, B, C+, C)
 * - Prediction quality percentage
 * - Certainty metrics
 */
const PredictionQuality: React.FC<PredictionQualityProps> = ({
  prediction,
  showDetails = false,
  className = ""
}) => {
  // Extract quality metrics with null checks
  const qualityRating = safeGet(prediction, 'quality_rating', '') as string;
  const predictionQuality = safeGet(prediction, 'prediction_quality', 0) as number;
  const matchResultCertainty = safeGet(prediction, 'match_result_certainty', 0) as number;
  const overUnderCertainty = safeGet(prediction, 'over_under_certainty', 0) as number;
  const bttsCertainty = safeGet(prediction, 'btts_certainty', 0) as number;

  // Extract confidence values with null checks
  const matchResultConfidence = safeGet(prediction, 'match_result_confidence', 0) as number;
  const overUnderConfidence = safeGet(prediction, 'over_under_confidence', 0) as number;
  const bttsConfidence = safeGet(prediction, 'btts_confidence', 0) as number;

  // Determine quality color based on rating or percentage
  const getQualityColor = () => {
    if (qualityRating) {
      switch (qualityRating) {
        case 'A+': return 'bg-green-500/20 text-green-500';
        case 'A': return 'bg-green-400/20 text-green-400';
        case 'B+': return 'bg-blue-500/20 text-blue-500';
        case 'B': return 'bg-blue-400/20 text-blue-400';
        case 'C+': return 'bg-yellow-500/20 text-yellow-500';
        case 'C':
        default: return 'bg-yellow-400/20 text-yellow-400';
      }
    } else if (predictionQuality > 0) {
      if (predictionQuality >= 85) return 'bg-green-500/20 text-green-500';
      if (predictionQuality >= 80) return 'bg-green-400/20 text-green-400';
      if (predictionQuality >= 75) return 'bg-blue-500/20 text-blue-500';
      if (predictionQuality >= 70) return 'bg-blue-400/20 text-blue-400';
      if (predictionQuality >= 65) return 'bg-yellow-500/20 text-yellow-500';
      return 'bg-yellow-400/20 text-yellow-400';
    }

    return 'bg-gray-500/20 text-gray-400';
  };

  // If no quality metrics are available, return null
  if (!qualityRating && predictionQuality <= 0 &&
      matchResultCertainty <= 0 && overUnderCertainty <= 0 && bttsCertainty <= 0) {
    return null;
  }

  // Simple badge display for compact view
  if (!showDetails) {
    return (
      <Badge
        className={`${getQualityColor()} ${className}`}
      >
        {qualityRating || (predictionQuality > 0 ? `${Math.round(predictionQuality)}%` : 'N/A')}
      </Badge>
    );
  }

  // Detailed view with all metrics
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70">Quality Rating:</span>
        <Badge className={getQualityColor()}>
          {qualityRating || (predictionQuality > 0 ? `${Math.round(predictionQuality)}%` : 'N/A')}
        </Badge>
      </div>

      {predictionQuality > 0 && (
        <div className="w-full bg-[#2A2A3C] rounded-full h-1.5 mb-2">
          <div
            className={`h-1.5 rounded-full ${getQualityColor().split(' ')[1]}`}
            style={{ width: `${Math.min(100, predictionQuality)}%` }}
          ></div>
        </div>
      )}

      {/* Quality Metrics Chart */}
      <div className="flex flex-col md:flex-row gap-4 mt-3">
        <div className="flex-1">
          {/* Certainty metrics */}
          {(matchResultCertainty > 0 || overUnderCertainty > 0 || bttsCertainty > 0) && (
            <div className="bg-[#2A2A3C]/50 p-2 rounded-md space-y-1.5">
              <p className="text-xs font-medium text-white/70 mb-1">Prediction Certainty:</p>

              {matchResultCertainty > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs">Match Result:</span>
                  <span className="text-xs font-medium">{(matchResultCertainty * 100).toFixed(1)}%</span>
                </div>
              )}

              {overUnderCertainty > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs">Over/Under:</span>
                  <span className="text-xs font-medium">{(overUnderCertainty * 100).toFixed(1)}%</span>
                </div>
              )}

              {bttsCertainty > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs">BTTS:</span>
                  <span className="text-xs font-medium">{(bttsCertainty * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Confidence metrics */}
          {(matchResultConfidence > 0 || overUnderConfidence > 0 || bttsConfidence > 0) && (
            <div className="bg-[#2A2A3C]/50 p-2 rounded-md space-y-1.5 mt-2">
              <p className="text-xs font-medium text-white/70 mb-1">Confidence Levels:</p>

              {matchResultConfidence > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs">Match Result:</span>
                  <span className="text-xs font-medium">{(matchResultConfidence * 100).toFixed(1)}%</span>
                </div>
              )}

              {overUnderConfidence > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs">Over/Under:</span>
                  <span className="text-xs font-medium">{(overUnderConfidence * 100).toFixed(1)}%</span>
                </div>
              )}

              {bttsConfidence > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs">BTTS:</span>
                  <span className="text-xs font-medium">{(bttsConfidence * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visual chart representation */}
        <div className="flex-1 flex justify-center">
          <QualityMetricsChart prediction={prediction} />
        </div>
      </div>
    </div>
  );
};

export default PredictionQuality;
