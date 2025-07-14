import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  TrendingUp, 
  Users, 
  Award,
  Star,
  Grid3X3,
  List,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';
import ExpertCard from './ExpertCard';
import ExpertStats from './ExpertStats';
import ExpertFilters from './ExpertFilters';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { cn } from '../../lib/utils';

interface Expert {
  id: number;
  name: string;
  nickname?: string;
  country: string;
  popularity: number;
  specialty?: string;
  success_rate?: number;
  image_url?: string;
  bio?: string;
  verified: boolean;
  rank?: number;
  badge?: string;
  streak?: number;
  monthlyWins?: number;
  totalEarnings?: number;
  followers?: number;
  achievements?: string[];
  recentForm?: string;
  expertise?: string[];
  joinedDate?: string;
  lastActive?: string;
  social_media?: Record<string, string>;
  totalPredictions?: number;
  wonPredictions?: number;
  averageOdds?: number;
}

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

interface ExpertDashboardProps {
  experts: Expert[];
  onExpertSelect?: (expert: Expert) => void;
  onFavoriteToggle?: (expertId: number) => void;
  favoriteExperts?: number[];
  className?: string;
}

const ExpertDashboard: React.FC<ExpertDashboardProps> = ({
  experts,
  onExpertSelect,
  onFavoriteToggle,
  favoriteExperts = [],
  className
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
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

  // Get unique values for filters
  const availableCountries = useMemo(() => 
    [...new Set(experts.map(expert => expert.country))].sort(),
    [experts]
  );

  const availableSpecialties = useMemo(() => 
    [...new Set(experts.map(expert => expert.specialty).filter(Boolean))].sort(),
    [experts]
  );

  // Filter and sort experts
  const filteredExperts = useMemo(() => {
    let filtered = experts.filter(expert => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          expert.name.toLowerCase().includes(searchTerm) ||
          expert.nickname?.toLowerCase().includes(searchTerm) ||
          expert.specialty?.toLowerCase().includes(searchTerm) ||
          expert.country.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Badge filter
      if (filters.badge.length > 0 && !filters.badge.includes(expert.badge || '')) {
        return false;
      }

      // Country filter
      if (filters.country.length > 0 && !filters.country.includes(expert.country)) {
        return false;
      }

      // Specialty filter
      if (filters.specialty.length > 0 && !filters.specialty.includes(expert.specialty || '')) {
        return false;
      }

      // Success rate filter
      const successRate = expert.success_rate || 0;
      if (successRate < filters.minSuccessRate || successRate > filters.maxSuccessRate) {
        return false;
      }

      // Followers filter
      if ((expert.followers || 0) < filters.minFollowers) {
        return false;
      }

      // Verification filter
      if (filters.verified !== null && expert.verified !== filters.verified) {
        return false;
      }

      return true;
    });

    // Sort experts
    filtered.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (filters.sortBy) {
        case 'rank':
          aValue = a.rank || 999;
          bValue = b.rank || 999;
          break;
        case 'success_rate':
          aValue = a.success_rate || 0;
          bValue = b.success_rate || 0;
          break;
        case 'followers':
          aValue = a.followers || 0;
          bValue = b.followers || 0;
          break;
        case 'streak':
          aValue = a.streak || 0;
          bValue = b.streak || 0;
          break;
        case 'earnings':
          aValue = a.totalEarnings || 0;
          bValue = b.totalEarnings || 0;
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [experts, filters]);

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const totalExperts = experts.length;
    const verifiedExperts = experts.filter(e => e.verified).length;
    const avgSuccessRate = experts.reduce((sum, e) => sum + (e.success_rate || 0), 0) / totalExperts;
    const topPerformer = experts.reduce((top, current) => 
      (current.success_rate || 0) > (top.success_rate || 0) ? current : top
    );

    return {
      totalExperts,
      verifiedExperts,
      avgSuccessRate,
      topPerformer,
      filteredCount: filteredExperts.length
    };
  }, [experts, filteredExperts]);

  const handleExpertClick = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowStats(true);
    onExpertSelect?.(expert);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Expert Dashboard</h1>
          <p className="text-white/60">
            Discover and follow the best betting experts on our platform
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A1A27] border border-amber-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{dashboardStats.totalExperts}</div>
            <div className="text-xs text-white/60">Total Experts</div>
          </div>
          <div className="bg-[#1A1A27] border border-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{dashboardStats.verifiedExperts}</div>
            <div className="text-xs text-white/60">Verified</div>
          </div>
          <div className="bg-[#1A1A27] border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{dashboardStats.avgSuccessRate.toFixed(1)}%</div>
            <div className="text-xs text-white/60">Avg Success</div>
          </div>
          <div className="bg-[#1A1A27] border border-purple-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{dashboardStats.filteredCount}</div>
            <div className="text-xs text-white/60">Filtered</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ExpertFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableCountries={availableCountries}
        availableSpecialties={availableSpecialties}
      />

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">
            Showing {filteredExperts.length} of {experts.length} experts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={cn(
              viewMode === 'grid' 
                ? "bg-amber-500 text-black" 
                : "bg-transparent border-amber-500/30 text-amber-400"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(
              viewMode === 'list' 
                ? "bg-amber-500 text-black" 
                : "bg-transparent border-amber-500/30 text-amber-400"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Experts List */}
        <div className={cn("space-y-6", showStats ? "xl:col-span-2" : "xl:col-span-4")}>
          {filteredExperts.length > 0 ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            )}>
              {filteredExperts.map((expert, index) => (
                <motion.div
                  key={expert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ExpertCard
                    expert={expert}
                    onFavorite={onFavoriteToggle}
                    isFavorite={favoriteExperts.includes(expert.id)}
                    onViewProfile={handleExpertClick}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-[#1A1A27] border border-amber-500/20">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">No Experts Found</h3>
                <p className="text-white/60 mb-4">
                  Try adjusting your filters to find more experts
                </p>
                <Button
                  variant="outline"
                  onClick={() => setFilters({
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
                  })}
                  className="bg-transparent border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Expert Stats Panel */}
        <AnimatePresence>
          {showStats && selectedExpert && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="xl:col-span-2"
            >
              <div className="sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Expert Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStats(false)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
                <ExpertStats expert={selectedExpert} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExpertDashboard;
