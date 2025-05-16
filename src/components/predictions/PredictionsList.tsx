import React, { useState, useCallback } from "react";
import type { Prediction, SportType, PredictionStatus } from "../../types";
import PredictionCard from "./PredictionCard";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import VirtualizedList from "../common/VirtualizedList";
import { useBreakpoints } from "../../hooks/useMediaQuery";
import { motion } from "framer-motion";
import { listItemVariants, fadeVariants } from "../../utils/animations";
import QualityFilter from "./QualityFilter";
import SortSelector from "./SortSelector";

interface PredictionsListProps {
  predictions: Prediction[];
  title?: string;
  showFilters?: boolean;
}

const PredictionsList: React.FC<PredictionsListProps> = ({
  predictions,
  title = "Today's Predictions",
  showFilters = true,
}) => {
  const [sportFilter, setSportFilter] = useState<SportType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PredictionStatus | "all">("all");
  const [qualityFilter, setQualityFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"time" | "odds" | "quality">("time");
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = isMobile ? 5 : 10;

  // Apply filters with null checks
  const filteredPredictions = predictions.filter((prediction) => {
    // Skip invalid predictions
    if (!prediction || !prediction.game) {
      return false;
    }

    if (sportFilter !== "all" && prediction.game.sport !== sportFilter) {
      return false;
    }
    if (statusFilter !== "all" && prediction.status !== statusFilter) {
      return false;
    }
    // Apply quality filter
    if (qualityFilter !== null && prediction.quality_rating !== qualityFilter) {
      return false;
    }
    return true;
  });

  // Sort predictions based on selected sort criteria
  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    if (sortBy === "time") {
      const aTime = a?.game?.startTime ? new Date(a.game.startTime).getTime() : 0;
      const bTime = b?.game?.startTime ? new Date(b.game.startTime).getTime() : 0;
      return aTime - bTime;
    } else if (sortBy === "odds") {
      const aOdds = a?.odds || 0;
      const bOdds = b?.odds || 0;
      return bOdds - aOdds; // Higher odds first
    } else if (sortBy === "quality") {
      // Sort by quality rating (A+ > A > B+ > B > C+ > C)
      const qualityRankMap: Record<string, number> = {
        "A+": 6, "A": 5, "B+": 4, "B": 3, "C+": 2, "C": 1
      };

      // Get quality values with fallbacks
      const aQualityRating = a?.quality_rating || "";
      const bQualityRating = b?.quality_rating || "";

      // If both have quality ratings, compare them
      if (aQualityRating && bQualityRating) {
        return (qualityRankMap[bQualityRating] || 0) - (qualityRankMap[aQualityRating] || 0);
      }

      // If only one has a quality rating, prioritize it
      if (aQualityRating && !bQualityRating) return -1;
      if (!aQualityRating && bQualityRating) return 1;

      // If neither has a quality rating, fall back to prediction quality percentage
      const aPredictionQuality = a?.prediction_quality || 0;
      const bPredictionQuality = b?.prediction_quality || 0;
      return bPredictionQuality - aPredictionQuality; // Higher quality first
    }

    // Default to time sorting
    const aTime = a?.game?.startTime ? new Date(a.game.startTime).getTime() : 0;
    const bTime = b?.game?.startTime ? new Date(b.game.startTime).getTime() : 0;
    return aTime - bTime;
  });

  // Calculate stats
  const totalPredictions = predictions.length;
  const wonPredictions = predictions.filter((p) => p.status === "won").length;
  const lostPredictions = predictions.filter((p) => p.status === "lost").length;
  const pendingPredictions = predictions.filter((p) => p.status === "pending").length;

  const successRate = totalPredictions > 0
    ? ((wonPredictions / (wonPredictions + lostPredictions)) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex gap-2 mt-2">
            <Badge variant="default">{totalPredictions} Predictions</Badge>
            <Badge variant="success">{wonPredictions} Won</Badge>
            <Badge variant="danger">{lostPredictions} Lost</Badge>
            <Badge variant="warning">{pendingPredictions} Pending</Badge>
            <Badge variant="premium">{successRate}% Success</Badge>
          </div>
        </div>

        {/* Sort Selector */}
        <SortSelector
          sortBy={sortBy}
          onSortChange={setSortBy}
          className="mt-2 md:mt-0"
        />

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <div className="space-x-1">
              <Button
                size="sm"
                variant={sportFilter === "all" ? "default" : "outline"}
                onClick={() => setSportFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={sportFilter === "soccer" ? "default" : "outline"}
                onClick={() => setSportFilter("soccer")}
              >
                Soccer
              </Button>
              <Button
                size="sm"
                variant={sportFilter === "basketball" ? "default" : "outline"}
                onClick={() => setSportFilter("basketball")}
              >
                Basketball
              </Button>
              <Button
                size="sm"
                variant={sportFilter === "mixed" ? "default" : "outline"}
                onClick={() => setSportFilter("mixed")}
              >
                Mixed
              </Button>
            </div>

            <div className="space-x-1">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All Status
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "won" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("won")}
              >
                Won
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "lost" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("lost")}
              >
                Lost
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "pending" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
            </div>

            <div className="mt-2">
              <QualityFilter
                selectedQuality={qualityFilter}
                onSelectQuality={setQualityFilter}
              />
            </div>
          </div>
        )}
      </div>

      {sortedPredictions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">No predictions found matching your filters.</p>
        </div>
      ) : (
        <>
          {sortedPredictions.length <= 10 ? (
            // Regular grid for small number of predictions with modern styling
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="initial"
              animate="animate"
              variants={fadeVariants}
            >
              {sortedPredictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  custom={index}
                  variants={listItemVariants}
                >
                  <PredictionCard
                    prediction={prediction}
                    isPremium={prediction.odds > 5}
                    showReason={true}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Virtualized list for larger number of predictions with modern styling
            <div className="w-full">
              <VirtualizedList
                items={sortedPredictions}
                height={isMobile ? 600 : isTablet ? 800 : 1000}
                itemHeight={isMobile ? 450 : 350}
                renderItem={(prediction, index) => (
                  <motion.div
                    className="p-2"
                    custom={index}
                    initial="initial"
                    animate="animate"
                    variants={listItemVariants}
                  >
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      isPremium={prediction.odds > 5}
                      showReason={true}
                    />
                  </motion.div>
                )}
                className="w-full"
                overscan={3}
                scrollRestoration={true}
              />
            </div>
          )}

          {/* Load more button for mobile */}
          {isMobile && sortedPredictions.length > ITEMS_PER_PAGE * page && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-3 py-1"
                onClick={() => setPage(prev => prev + 1)}
              >
                Load More Predictions
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionsList;
