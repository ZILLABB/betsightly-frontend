import React, { useState, useEffect, useRef } from "react";
import type { Prediction } from "../../types";
import { Button } from "../common/Button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "../common/Badge";
import LazyImage from "../common/LazyImage";
import { useBreakpoints } from "../../hooks/useMediaQuery";
import BasePredictionCard from "./BasePredictionCard";
import { safeGet } from "../../utils/nullChecks";
import { formatDate } from "../../lib/utils";
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
  const [showDetails, setShowDetails] = useState(false);
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
    return <div ref={cardRef} className="w-full h-48 bg-[#1A1A27]/50 rounded-lg animate-pulse"></div>;
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
    <div ref={cardRef}>
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

  const historicalSuccess = Math.floor(Math.random() * 40) + 60; // Mock data

  // Use default team logos instead of placeholder.com
  const homeTeamLogo = `/teams/default.png`;
  const awayTeamLogo = `/teams/default.png`;

  // For mobile view with expandable details
  return (
    <div ref={cardRef} className="w-full">
      <div className="relative">
        {/* Use the base prediction card */}
        <BasePredictionCard
          prediction={prediction}
          mode={PredictionCardMode.STANDARD}
          variant={cardVariant}
          showReason={showReason}
          onClick={onClick}
        />

        {/* Team logos overlay for mobile */}
        {isMobile && (
          <div className="absolute top-12 left-0 right-0 flex justify-center items-center">
            <div className="flex items-center bg-[#1A1A27]/80 p-2 rounded-full">
              <div className="text-center mr-3">
                <LazyImage
                  src={homeTeamLogo}
                  alt={String(homeTeamName)}
                  className="w-8 h-8 rounded-full mx-auto"
                  placeholderSrc="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                />
              </div>
              <div className="text-xs font-bold mx-2">VS</div>
              <div className="text-center ml-3">
                <LazyImage
                  src={awayTeamLogo}
                  alt={String(awayTeamName)}
                  className="w-8 h-8 rounded-full mx-auto"
                  placeholderSrc="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                />
              </div>
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-xs h-auto py-1.5 border-[#2A2A3C] hover:bg-[#2A2A3C]/20"
          >
            <div className="flex items-center justify-center w-full">
              {showDetails ? (
                <>
                  <ChevronUp size={14} className="mr-1.5" />
                  <span>Hide Details</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="mr-1.5" />
                  <span>Show More Details</span>
                </>
              )}
            </div>
          </Button>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-[#2A2A3C]/20 p-3 bg-[#1A1A27]/30 rounded-lg">
            <div className="mb-2">
              <p className="text-xs font-medium text-[#A1A1AA] mb-0.5">Historical Performance</p>
              <div className="bg-[#1A1A27]/50 p-1.5 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs">Similar Predictions:</span>
                  <span className="text-xs font-medium">{Math.floor(Math.random() * 50) + 20} matches</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Average Odds:</span>
                  <span className="text-xs font-medium">{(Math.random() * 2 + 1).toFixed(2)}x</span>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <p className="text-xs font-medium text-[#A1A1AA] mb-0.5">Team Form</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1A1A27]/50 p-1.5 rounded-md">
                  <p className="text-xs mb-1">{String(homeTeamName)}</p>
                  <div className="flex space-x-1">
                    {['W', 'L', 'W', 'W', 'D'].map((result, i) => (
                      <span
                        key={i}
                        className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-full
                          ${result === 'W' ? 'bg-green-500/20 text-green-500' :
                            result === 'L' ? 'bg-red-500/20 text-red-500' :
                            'bg-[#F5A623]/20 text-[#F5A623]'}`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-[#1A1A27]/50 p-1.5 rounded-md">
                  <p className="text-xs mb-1">{String(awayTeamName)}</p>
                  <div className="flex space-x-1">
                    {['L', 'W', 'L', 'D', 'W'].map((result, i) => (
                      <span
                        key={i}
                        className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-full
                          ${result === 'W' ? 'bg-green-500/20 text-green-500' :
                            result === 'L' ? 'bg-red-500/20 text-red-500' :
                            'bg-[#F5A623]/20 text-[#F5A623]'}`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default PredictionCard;














