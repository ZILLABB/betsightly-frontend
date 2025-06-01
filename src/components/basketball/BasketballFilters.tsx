import React, { useState } from "react";
import { Button } from "../common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { Filter, X, Calendar, Target, TrendingUp, DollarSign } from "lucide-react";
import type { BasketballFilters } from "../../types/basketball";

interface BasketballFiltersProps {
  filters: BasketballFilters;
  onFiltersChange: (filters: BasketballFilters) => void;
  className?: string;
}

const BasketballFiltersComponent: React.FC<BasketballFiltersProps> = ({
  filters,
  onFiltersChange,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Prediction type options
  const predictionTypes = [
    { value: 'moneyline', label: 'Moneyline', description: 'Win/Loss predictions' },
    { value: 'spread', label: 'Point Spread', description: 'Margin of victory' },
    { value: 'total', label: 'Over/Under', description: 'Total points scored' },
    { value: 'player_props', label: 'Player Props', description: 'Individual player stats' }
  ];

  // League options
  const leagues = [
    { value: 'NBA', label: 'NBA', description: 'National Basketball Association' },
    { value: 'WNBA', label: 'WNBA', description: 'Women\'s National Basketball Association' },
    { value: 'G-League', label: 'G-League', description: 'NBA G League' },
    { value: 'NCAA', label: 'NCAA', description: 'College Basketball' }
  ];

  // Season options
  const seasons = [
    { value: 'regular', label: 'Regular Season' },
    { value: 'playoffs', label: 'Playoffs' },
    { value: 'preseason', label: 'Preseason' }
  ];

  // Handle filter changes
  const handleFilterChange = (key: keyof BasketballFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <Card variant="surface" hover="none" className={`overflow-hidden ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-orange-400" />
            <CardTitle size="sm" font="jakarta" className="text-orange-400">
              Basketball Filters
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* League Filter */}
          <div>
            <label className="text-xs text-white/70 mb-1 block">League</label>
            <select
              value={filters.league || ''}
              onChange={(e) => handleFilterChange('league', e.target.value || undefined)}
              className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="">All Leagues</option>
              {leagues.map((league) => (
                <option key={league.value} value={league.value}>
                  {league.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prediction Type Filter */}
          <div>
            <label className="text-xs text-white/70 mb-1 block">Type</label>
            <select
              value={filters.prediction_type || ''}
              onChange={(e) => handleFilterChange('prediction_type', e.target.value || undefined)}
              className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="">All Types</option>
              {predictionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Min Confidence */}
          <div>
            <label className="text-xs text-white/70 mb-1 block">Min Confidence</label>
            <select
              value={filters.min_confidence || ''}
              onChange={(e) => handleFilterChange('min_confidence', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="">Any</option>
              <option value="0.5">50%+</option>
              <option value="0.6">60%+</option>
              <option value="0.7">70%+</option>
              <option value="0.8">80%+</option>
              <option value="0.9">90%+</option>
            </select>
          </div>

          {/* Value Bets Only */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={filters.value_bets_only || false}
                onChange={(e) => handleFilterChange('value_bets_only', e.target.checked || undefined)}
                className="rounded border-orange-500/20 bg-black/30 text-orange-500 focus:ring-orange-500/50"
              />
              <span>Value Bets Only</span>
            </label>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-orange-500/20">
            {/* Season Filter */}
            <div>
              <label className="text-xs text-white/70 mb-2 block flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Season
              </label>
              <div className="grid grid-cols-3 gap-2">
                {seasons.map((season) => (
                  <button
                    key={season.value}
                    onClick={() => handleFilterChange('season', 
                      filters.season === season.value ? undefined : season.value
                    )}
                    className={`px-3 py-2 text-xs rounded border transition-all ${
                      filters.season === season.value
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-gray-500/30 bg-black/20 text-white/70 hover:border-orange-500/30'
                    }`}
                  >
                    {season.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Odds Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/70 mb-1 block flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Min Odds
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={filters.min_odds || ''}
                  onChange={(e) => handleFilterChange('min_odds', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="1.0"
                  className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-1 block flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Max Odds
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={filters.max_odds || ''}
                  onChange={(e) => handleFilterChange('max_odds', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="10.0"
                  className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Team Filter */}
            <div>
              <label className="text-xs text-white/70 mb-1 block flex items-center">
                <Target className="h-3 w-3 mr-1" />
                Team
              </label>
              <input
                type="text"
                value={filters.team || ''}
                onChange={(e) => handleFilterChange('team', e.target.value || undefined)}
                placeholder="Search team name..."
                className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs text-white/70 mb-2 block flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.date_range?.start || ''}
                  onChange={(e) => handleFilterChange('date_range', {
                    ...filters.date_range,
                    start: e.target.value
                  })}
                  className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
                />
                <input
                  type="date"
                  value={filters.date_range?.end || ''}
                  onChange={(e) => handleFilterChange('date_range', {
                    ...filters.date_range,
                    end: e.target.value
                  })}
                  className="w-full px-2 py-1 text-xs bg-black/30 border border-orange-500/20 rounded text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-3 border-t border-orange-500/20">
            <div className="flex flex-wrap gap-2">
              {filters.league && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  League: {filters.league}
                </Badge>
              )}
              {filters.prediction_type && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Type: {predictionTypes.find(t => t.value === filters.prediction_type)?.label}
                </Badge>
              )}
              {filters.min_confidence && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Min Confidence: {(filters.min_confidence * 100).toFixed(0)}%
                </Badge>
              )}
              {filters.value_bets_only && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Value Bets Only
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BasketballFiltersComponent;
