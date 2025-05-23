import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { usePredictions } from '../../contexts/PredictionsContext';
import { Button, Input, Badge } from '../ui';

interface PredictionFiltersProps {
  showCategories?: boolean;
  className?: string;
  onCategoryChange?: (category: string) => void;
  selectedCategory?: string;
}

const PredictionFilters: React.FC<PredictionFiltersProps> = ({
  showCategories = true,
  className = '',
  onCategoryChange,
  selectedCategory
}) => {
  const { filters, setFilter, resetFilters, allPredictions } = usePredictions();
  const [expanded, setExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.searchQuery);

  // Available categories from the predictions data
  const categories = Object.keys(allPredictions);

  // Make sure 'rollover' is included in categories if it exists in the context
  useEffect(() => {
    if (allPredictions && !categories.includes('rollover') &&
        Object.keys(allPredictions).length > 0) {
      console.log('Categories available:', categories);
    }
  }, [allPredictions, categories]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // Apply search filter when user submits the search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('searchQuery', searchValue);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchValue('');
    setFilter('searchQuery', '');
  };

  // Handle category selection
  const handleCategorySelect = (category: string | null) => {
    console.log('Selected category:', category);
    setFilter('category', category);

    // Call the onCategoryChange prop if provided
    if (onCategoryChange && category !== null) {
      onCategoryChange(category);
    }
  };

  // Handle odds range change
  const handleOddsChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFilter(type === 'min' ? 'minOdds' : 'maxOdds', numValue);
    }
  };

  // Handle confidence change
  const handleConfidenceChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFilter('minConfidence', numValue);
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.category !== null,
    filters.minOdds > defaultFilters.minOdds,
    filters.maxOdds < defaultFilters.maxOdds,
    filters.minConfidence > defaultFilters.minConfidence,
    filters.searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <div className={`bg-black/20 border border-amber-500/20 rounded-lg p-4 ${className}`}>
      {/* Header with toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Filter size={18} className="text-amber-400 mr-2" />
          <h3 className="text-lg font-medium text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-white/70 hover:text-white"
        >
          {expanded ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </Button>
      </div>

      {/* Search bar - always visible */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search teams, leagues, predictions..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-10 pr-10 bg-black/30 border-amber-500/20 text-white"
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
          {searchValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Expanded filters */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Categories */}
          {showCategories && categories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white/70 mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={`cursor-pointer ${
                    (selectedCategory === 'all' || filters.category === null)
                      ? 'bg-amber-500/30 text-amber-400 border-amber-500/50'
                      : 'bg-black/30 text-white/70 border-white/20 hover:border-amber-500/30 hover:text-amber-400'
                  }`}
                  onClick={() => handleCategorySelect(null)}
                >
                  All
                </Badge>
                {categories.map(category => (
                  <Badge
                    key={category}
                    className={`cursor-pointer ${
                      (selectedCategory === category || filters.category === category)
                        ? 'bg-amber-500/30 text-amber-400 border-amber-500/50'
                        : 'bg-black/30 text-white/70 border-white/20 hover:border-amber-500/30 hover:text-amber-400'
                    }`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {formatCategoryName(category)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Odds Range */}
          <div>
            <h4 className="text-sm font-medium text-white/70 mb-2">Odds Range</h4>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1.0"
                max="100.0"
                step="0.1"
                value={filters.minOdds}
                onChange={(e) => handleOddsChange('min', e.target.value)}
                className="w-20 bg-black/30 border-amber-500/20 text-white"
              />
              <span className="text-white/70">to</span>
              <Input
                type="number"
                min="1.0"
                max="100.0"
                step="0.1"
                value={filters.maxOdds}
                onChange={(e) => handleOddsChange('max', e.target.value)}
                className="w-20 bg-black/30 border-amber-500/20 text-white"
              />
            </div>
          </div>

          {/* Minimum Confidence */}
          <div>
            <h4 className="text-sm font-medium text-white/70 mb-2">Minimum Confidence</h4>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="5"
                value={filters.minConfidence}
                onChange={(e) => handleConfidenceChange(e.target.value)}
                className="w-20 bg-black/30 border-amber-500/20 text-white"
              />
              <span className="text-white/70">%</span>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              disabled={activeFilterCount === 0}
            >
              <SlidersHorizontal size={14} className="mr-1.5" />
              Reset Filters
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Helper function to format category names
const formatCategoryName = (category: string): string => {
  switch (category) {
    case '2_odds':
      return '2 Odds';
    case '5_odds':
      return '5 Odds';
    case '10_odds':
      return '10 Odds';
    case 'rollover':
      return 'Rollover';
    default:
      return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

// Default filter values for reference
const defaultFilters = {
  category: null,
  minOdds: 1.0,
  maxOdds: 10.0,
  minConfidence: 0,
  searchQuery: '',
};

export default PredictionFilters;
