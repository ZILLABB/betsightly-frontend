/**
 * Compact Prediction Card Component
 *
 * This component provides a compact view of a prediction card,
 * suitable for use in lists, rollover displays, and mobile views.
 */

import React from "react";
import type { Prediction } from "../../types";
import BasePredictionCard, {
  PredictionCardMode,
  PredictionCardVariant
} from "./BasePredictionCard";
import { motion } from "framer-motion";
import { cardVariants } from "../../utils/animations";

interface CompactPredictionCardProps {
  // Data
  prediction: Prediction;

  // Display options
  isPremium?: boolean;
  isRollover?: boolean;
  showDate?: boolean;
  showReason?: boolean;
  index?: number;

  // Actions
  onCopy?: () => void;
  onClick?: () => void;

  // Styling
  className?: string;
}

/**
 * Compact Prediction Card Component
 */
const CompactPredictionCard: React.FC<CompactPredictionCardProps> = ({
  // Data
  prediction,

  // Display options
  isPremium = false,
  isRollover = false,
  showDate = false,
  showReason = false,
  index,

  // Actions
  onCopy,
  onClick,

  // Styling
  className = ""
}) => {
  // If prediction is null or missing critical data, show a fallback UI
  if (!prediction || !prediction.game) {
    return (
      <div className="bg-[#1A1A27]/50 p-2 rounded-lg border border-[#2A2A3C]/10 flex flex-col">
        <div className="text-xs text-[var(--muted-foreground)] italic">Data unavailable</div>
      </div>
    );
  }

  // Determine the variant based on props
  let variant = PredictionCardVariant.DEFAULT;

  if (isPremium) {
    variant = PredictionCardVariant.PREMIUM;
  } else if (isRollover) {
    variant = PredictionCardVariant.ROLLOVER;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      variants={cardVariants}
    >
      <BasePredictionCard
        prediction={prediction}
        mode={PredictionCardMode.COMPACT}
        variant={variant}
        showReason={showReason}
        showStats={false}
        showActions={false}
        index={index}
        onCopy={onCopy}
        onClick={onClick}
        className={className}
      />
    </motion.div>
  );
};

export default CompactPredictionCard;
