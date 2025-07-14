import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Star, 
  TrendingUp, 
  Users, 
  Award,
  Globe,
  Target,
  Zap,
  ChevronDown
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card, CardContent } from '../common/Card';
import { cn } from '../../lib/utils';

interface FilterOptions {
  search: string;
  badge: string[];
  country: string[];
  specialty: string[];
  minSuccessRate: number;
  maxSuccessRate: number;
  minFollowers: number;
  verified: boolean | null;
  sortBy: 'rank' | 'success_rate' | 'followers' | 'streak' | 'earnings';
  sortOrder: 'asc' | 'desc';
}

interface ExpertFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableCountries: string[];
  availableSpecialties: string[];
  className?: string;
}

const ExpertFilters: React.FC<ExpertFiltersProps> = ({
  filters,
  onFiltersChange,
  availableCountries,
  availableSpecialties,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const badgeOptions = ['Elite', 'Pro', 'Rising', 'Rookie'];
  const sortOptions = [
    { value: 'rank', label: 'Rank', icon: <Award className="h-4 w-4" /> },
    { value: 'success_rate', label: 'Success Rate', icon: <Target className="h-4 w-4" /> },
    { value: 'followers', label: 'Followers', icon: <Users className="h-4 w-4" /> },
    { value: 'streak', label: 'Streak', icon: <Zap className="h-4 w-4" /> },
    { value: 'earnings', label: 'Earnings', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      badge: [],
      country: [],
      specialty: [],
      minSuccessRate: 0,
      maxSuccessRate: 100,
      minFollowers: 0,
      verified: null,
      sortBy: 'rank',
      sortOrder: 'asc'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.badge.length > 0) count++;
    if (filters.country.length > 0) count++;
    if (filters.specialty.length > 0) count++;
    if (filters.minSuccessRate > 0 || filters.maxSuccessRate < 100) count++;
    if (filters.minFollowers > 0) count++;
    if (filters.verified !== null) count++;
    return count;
  };

  const toggleArrayFilter = (array: string[], value: string) => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
          <input
            type="text"
            placeholder="Search experts by name, nickname, or specialty..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-[#1A1A27] border border-amber-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-[#1A1A27] border-amber-500/20 text-white hover:bg-amber-500/10 hover:border-amber-500/40 px-4 py-3"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getActiveFiltersCount() > 0 && (
            <Badge className="ml-2 bg-amber-500 text-black text-xs px-2 py-0.5">
              {getActiveFiltersCount()}
            </Badge>
          )}
          <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", isExpanded && "rotate-180")} />
        </Button>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [FilterOptions['sortBy'], FilterOptions['sortOrder']];
              updateFilters({ sortBy, sortOrder });
            }}
            className="appearance-none bg-[#1A1A27] border border-amber-500/20 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          >
            {sortOptions.map(option => (
              <React.Fragment key={option.value}>
                <option value={`${option.value}-asc`}>
                  {option.label} (Low to High)
                </option>
                <option value={`${option.value}-desc`}>
                  {option.label} (High to Low)
                </option>
              </React.Fragment>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-[#1A1A27] border border-amber-500/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Badge Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Badge Level
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {badgeOptions.map(badge => (
                        <Button
                          key={badge}
                          variant={filters.badge.includes(badge) ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateFilters({ badge: toggleArrayFilter(filters.badge, badge) })}
                          className={cn(
                            "text-xs",
                            filters.badge.includes(badge)
                              ? "bg-amber-500 text-black border-amber-500"
                              : "bg-transparent border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          )}
                        >
                          {badge}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Country Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Country
                    </label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {availableCountries.map(country => (
                        <label key={country} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.country.includes(country)}
                            onChange={() => updateFilters({ country: toggleArrayFilter(filters.country, country) })}
                            className="rounded border-amber-500/30 bg-transparent text-amber-500 focus:ring-amber-500/50"
                          />
                          <span className="text-sm text-white/70">{country}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Specialty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Specialty
                    </label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {availableSpecialties.map(specialty => (
                        <label key={specialty} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.specialty.includes(specialty)}
                            onChange={() => updateFilters({ specialty: toggleArrayFilter(filters.specialty, specialty) })}
                            className="rounded border-amber-500/30 bg-transparent text-amber-500 focus:ring-amber-500/50"
                          />
                          <span className="text-sm text-white/70">{specialty}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Success Rate Range */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Success Rate Range
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-white/60">Min: {filters.minSuccessRate}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filters.minSuccessRate}
                          onChange={(e) => updateFilters({ minSuccessRate: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60">Max: {filters.maxSuccessRate}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filters.maxSuccessRate}
                          onChange={(e) => updateFilters({ maxSuccessRate: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Minimum Followers */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Minimum Followers
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minFollowers || ''}
                      onChange={(e) => updateFilters({ minFollowers: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#0F0F1A] border border-amber-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Verification Status */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Verification Status
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="verified"
                          checked={filters.verified === null}
                          onChange={() => updateFilters({ verified: null })}
                          className="text-amber-500 focus:ring-amber-500/50"
                        />
                        <span className="text-sm text-white/70">All</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="verified"
                          checked={filters.verified === true}
                          onChange={() => updateFilters({ verified: true })}
                          className="text-amber-500 focus:ring-amber-500/50"
                        />
                        <span className="text-sm text-white/70">Verified Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="verified"
                          checked={filters.verified === false}
                          onChange={() => updateFilters({ verified: false })}
                          className="text-amber-500 focus:ring-amber-500/50"
                        />
                        <span className="text-sm text-white/70">Unverified Only</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-amber-500/20">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  
                  <div className="text-sm text-white/60">
                    {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.badge.map(badge => (
            <Badge
              key={`badge-${badge}`}
              variant="outline"
              className="bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
              onClick={() => updateFilters({ badge: filters.badge.filter(b => b !== badge) })}
            >
              {badge} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          
          {filters.country.map(country => (
            <Badge
              key={`country-${country}`}
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
              onClick={() => updateFilters({ country: filters.country.filter(c => c !== country) })}
            >
              {country} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          
          {filters.specialty.map(specialty => (
            <Badge
              key={`specialty-${specialty}`}
              variant="outline"
              className="bg-green-500/10 text-green-400 border-green-500/30 cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
              onClick={() => updateFilters({ specialty: filters.specialty.filter(s => s !== specialty) })}
            >
              {specialty} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertFilters;
