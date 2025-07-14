import React, { useState, useEffect, useRef } from "react";
import type { Prediction } from "../../types";
import { useBreakpoints } from "../../hooks/useMediaQuery";
import BasePredictionCard from "./BasePredictionCard";
import { PredictionCardMode, PredictionCardVariant } from "../../utils/predictionUtils";

interface PredictionCardProps {
  prediction: Prediction;
  isPremium?: boolean;
  showReason?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'premium' | 'rollover';
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  isPremium = false,
  showReason = true,
  onClick,
  variant
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useBreakpoints();

  // Set up intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '200px 0px',
      }
    );

    const cardElement = cardRef.current;
    if (cardElement) {
      observer.observe(cardElement);
    }

    return () => {
      if (cardElement) {
        observer.unobserve(cardElement);
      }
    };
  }, []);

  if (!prediction) {
    console.error("PredictionCard received null or undefined prediction");
    return null;
  }

  // If not visible yet and on mobile, render a minimal placeholder
  if (!isVisible && isMobile) {
    return <div ref={cardRef} className="w-full h-48 bg-[var(--color-bg-secondary)]/50 rounded-xl animate-pulse padding-standard"></div>;
  }

  // Determine the card variant
  let cardVariant = PredictionCardVariant.DEFAULT;
  if (variant === 'premium' || isPremium) {
    cardVariant = PredictionCardVariant.PREMIUM;
  } else if (variant === 'rollover') {
    cardVariant = PredictionCardVariant.ROLLOVER;
  }

  // Use the BasePredictionCard for standard display
  const baseCard = (
    <div ref={cardRef} className="prediction-card-container">
      <BasePredictionCard
        prediction={prediction}
        mode={PredictionCardMode.STANDARD}
        variant={cardVariant}
        showReason={showReason}
        onClick={onClick}
      />
    </div>
  );

  // If we don't need to show details, just return the base card
  if (!isMobile) {
    return baseCard;
  }

  // For mobile, we'll add some additional content and expandable details

  // Extract data from prediction with null checks
  const game = safeGet(prediction, 'game', {});

  // Extract team objects and handle them properly
  const homeTeamObj = safeGet(game, 'homeTeam', { name: 'Home Team' });
  const awayTeamObj = safeGet(game, 'awayTeam', { name: 'Away Team' });

  // Extract team names safely
  const homeTeamName = typeof homeTeamObj === 'string' ? homeTeamObj : safeGet(homeTeamObj, 'name', 'Home Team');
  const awayTeamName = typeof awayTeamObj === 'string' ? awayTeamObj : safeGet(awayTeamObj, 'name', 'Away Team');

  // Get historical success from prediction data or use confidence as fallback
  const historicalSuccess = safeGet(prediction, 'historical_success',
    safeGet(prediction, 'confidence', 0) * 100) as number;

  // Get team logos from prediction data or use defaults
  const homeTeamLogo = typeof homeTeamObj === 'object' && homeTeamObj?.logo
    ? homeTeamObj.logo
    : `/teams/default.png`;
  const awayTeamLogo = typeof awayTeamObj === 'object' && awayTeamObj?.logo
    ? awayTeamObj.logo
    : `/teams/default.png`;

  // Simplified return - no unnecessary wrappers
  return (
    <div ref={cardRef} className="prediction-card-container">
      <BasePredictionCard
        prediction={prediction}
        mode={PredictionCardMode.STANDARD}
        variant={cardVariant}
        showReason={showReason}
        onClick={onClick}
      />
    </div>
  );

};

export default PredictionCard;
