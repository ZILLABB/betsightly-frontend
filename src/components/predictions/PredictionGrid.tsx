import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter } from 'lucide-react';
import type { Prediction } from '../../types';
import PredictionCard from './PredictionCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';
import PredictionFilters from './PredictionFilters';
import PredictionSorter, { SortField, SortOrder } from './PredictionSorter';
import { Button } from '../ui';
import { PredictionCardMode } from '../../utils/predictionUtils';

interface PredictionGridProps {
  title: string;
  description?: string;
  predictions: Prediction[];
  category: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onPredictionSelect?: (prediction: Prediction) => void;
  maxItems?: number;
  showViewMore?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  className?: string;
}

// Animation variants
const gridVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4
    }
  }
};

const PredictionGrid: React.FC<PredictionGridProps> = ({
  title,
  description,
  predictions,
  category,
  loading = false,
  error = null,
  onRefresh,
  onPredictionSelect,
  maxItems = 3,
  showViewMore = true,
  showFilters = false,
  showSorting = false,
  className = ''
}) => {
  // State for filtered and sorted predictions
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>(predictions);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Update filtered predictions when props change
  useEffect(() => {
    setFilteredPredictions(predictions);
  }, [predictions]);

  // Handle sorting
  const handleSort = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);

    // Sort the predictions
    const sorted = [...filteredPredictions].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Extract the values to compare based on field
      switch (field) {
        case 'odds':
          valueA = a.odds || 0;
          valueB = b.odds || 0;
          break;
        case 'confidence':
          valueA = a.confidence || 0;
          valueB = b.confidence || 0;
          break;
        case 'time':
          valueA = a.game?.startTime ? new Date(a.game.startTime).getTime() : 0;
          valueB = b.game?.startTime ? new Date(b.game.startTime).getTime() : 0;
          break;
        default:
          return 0;
      }

      // Apply sort order
      return order === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFilteredPredictions(sorted);
  };

  // If loading, show spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading predictions..." />
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load predictions"
        message={error}
        onRetry={onRefresh}
      />
    );
  }

  // Process predictions to handle nested structure
  const processedPredictions = React.useMemo(() => {
    // Check if we have the new API format with nested predictions
    if (filteredPredictions.length > 0 && filteredPredictions[0].predictions && Array.isArray(filteredPredictions[0].predictions)) {
      console.log(`Processing ${category} predictions with nested structure`);

      // For 5_odds and 10_odds categories, we need to extract the nested predictions
      if (category === '5_odds' || category === '10_odds') {
        // Extract all nested predictions and add combined data from parent
        const nestedPredictions: Prediction[] = [];

        filteredPredictions.forEach(parentPrediction => {
          if (parentPrediction.predictions && Array.isArray(parentPrediction.predictions)) {
            parentPrediction.predictions.forEach((nestedPred: any) => {
              // Create a new prediction object with data from both parent and nested prediction
              nestedPredictions.push({
                ...nestedPred,
                id: nestedPred.id || `${parentPrediction.id}-${Math.random().toString(36).substring(2, 9)}`,
                combined_odds: parentPrediction.combined_odds,
                combined_confidence: parentPrediction.combined_confidence,
                // Add parent prediction ID for reference
                parentPredictionId: parentPrediction.id
              });
            });
          }
        });

        console.log(`Extracted ${nestedPredictions.length} nested predictions for ${category}`);
        return nestedPredictions;
      }
    }

    // Return original predictions if no nested structure or not 5_odds/10_odds
    return filteredPredictions;
  }, [filteredPredictions, category]);

  // If no predictions, show empty state
  if (!predictions || predictions.length === 0) {
    return (
      <div className="text-center py-12 border border-amber-500/20 rounded-lg bg-black/20">
        <p className="text-white/70">No predictions available for this category.</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md hover:bg-amber-500/20 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  // Determine how many predictions to display based on total count
  const itemsToShow = processedPredictions.length > 3 ?
    Math.min(processedPredictions.length, 6) : // Show up to 6 if we have more than 3
    maxItems; // Otherwise use the default maxItems

  // Limit the number of predictions to display
  const displayPredictions = processedPredictions.slice(0, itemsToShow);

  console.log(`Displaying ${displayPredictions.length} predictions for ${category} (out of ${processedPredictions.length})`);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-400">{title}</h2>
          {description && <p className="text-white/70 mt-1">{description}</p>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          {showSorting && (
            <PredictionSorter onSort={handleSort} />
          )}

          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <Filter size={14} className="mr-1.5" />
              Filters
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="mb-6">
          <PredictionFilters showCategories={true} />
        </div>
      )}

      {/* Predictions Grid - Optimized responsive layout */}
      <motion.div
        className={`grid ${
          displayPredictions.length > 8
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3' // Dense grid for many items
            : displayPredictions.length > 4
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' // Standard grid for moderate items
              : displayPredictions.length > 2
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' // Comfortable grid for few items
                : 'grid-cols-1 md:grid-cols-2 gap-6' // Spacious grid for very few items
        }`}
        variants={gridVariants}
        initial="initial"
        animate="animate"
      >
        {displayPredictions.map((prediction, index) => (
          <motion.div key={prediction.id || `prediction-${index}`} variants={itemVariants}>
            <PredictionCard
              prediction={prediction}
              onClick={onPredictionSelect ? () => onPredictionSelect(prediction) : undefined}
              showExplanation={false}
              showGameCode={false}
              // Always use compact mode for consistency
              mode={PredictionCardMode.COMPACT}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* View More Link */}
      {showViewMore && processedPredictions.length > maxItems && (
        <div className="text-center mt-6">
          <Link
            to={`/predictions/${category}`}
            className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-colors"
          >
            View all {processedPredictions.length} predictions
            <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default PredictionGrid;
