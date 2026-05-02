import React, { useState, useEffect, useRef } from "react";
import type { Prediction } from "../../types";
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

  // Render a placeholder until visible (lazy loading)
  if (!isVisible) {
    return <div ref={cardRef} className="w-full h-48 bg-[var(--color-bg-secondary)]/50 rounded-xl animate-pulse"></div>;
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

  return baseCard;
};

export default PredictionCard;
