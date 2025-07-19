import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, TrendingUp, Star } from 'lucide-react';
import TeamLogo from '../common/TeamLogo';
import { cn } from '../../lib/utils';
import { usePredictions } from '../../contexts/PredictionsContext';
import type { Prediction } from '../../types';

interface FeaturedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  confidence: number;
  odds: number;
  prediction: string;
  status: 'upcoming' | 'live' | 'finished';
}

// Transform prediction to featured match format
const transformPredictionToFeaturedMatch = (prediction: Prediction): FeaturedMatch => {
  const startTime = new Date(prediction.game.startTime);
  return {
    id: prediction.id,
    homeTeam: prediction.game.homeTeam,
    awayTeam: prediction.game.awayTeam,
    league: prediction.game.league,
    date: startTime.toISOString().split('T')[0],
    time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    confidence: Math.round(prediction.confidence * 100),
    odds: prediction.odds,
    prediction: prediction.predictionType,
    status: 'upcoming' as const
  };
};

// Mock featured matches data (fallback)
const mockFeaturedMatches: FeaturedMatch[] = [
  {
    id: '1',
    homeTeam: 'Manchester City',
    awayTeam: 'Arsenal',
    league: 'Premier League',
    date: '2024-01-15',
    time: '16:30',
    confidence: 87,
    odds: 2.1,
    prediction: 'Home Win',
    status: 'upcoming'
  },
  {
    id: '2',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    date: '2024-01-15',
    time: '20:00',
    confidence: 92,
    odds: 1.8,
    prediction: 'Over 2.5 Goals',
    status: 'upcoming'
  },
  {
    id: '3',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    date: '2024-01-16',
    time: '18:30',
    confidence: 85,
    odds: 2.3,
    prediction: 'BTTS Yes',
    status: 'upcoming'
  }
];

interface FeaturedMatchesSectionProps {
  className?: string;
}

const FeaturedMatchesSection: React.FC<FeaturedMatchesSectionProps> = ({
  className = ''
}) => {
  const [featuredMatches, setFeaturedMatches] = useState<FeaturedMatch[]>(mockFeaturedMatches);
  const { allPredictions, loading: contextLoading } = usePredictions();

  // Use data from context instead of making separate API calls
  useEffect(() => {
    console.log('🎯 Processing featured matches from context data...');

    // Get high-confidence predictions from all categories
    const allPredictions_array: Prediction[] = [];
    Object.values(allPredictions).forEach(categoryPredictions => {
      allPredictions_array.push(...categoryPredictions);
    });

    if (allPredictions_array.length > 0) {
      console.log(`🎯 Found ${allPredictions_array.length} total predictions from context`);

      // Filter and sort by confidence, take top 3
      const topPredictions = allPredictions_array
        .filter(p => p.confidence > 0.8) // High confidence only
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      console.log(`🎯 Selected ${topPredictions.length} high-confidence predictions for featured matches`);

      if (topPredictions.length > 0) {
        const transformedMatches = topPredictions.map(transformPredictionToFeaturedMatch);
        setFeaturedMatches(transformedMatches);
      }
    } else {
      console.log('🎯 No predictions available yet, using mock data');
    }
  }, [allPredictions]); // Depend on context data
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
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
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.4
      }
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (confidence >= 80) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (confidence >= 70) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={cn(
        'py-12 md:py-16 bg-gradient-to-b from-gray-900/50 via-black to-gray-900/50',
        className
      )}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          variants={itemVariants}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="text-amber-400" size={24} />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Featured Matches
            </h2>
            <TrendingUp className="text-amber-400" size={24} />
          </div>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Don't miss these high-confidence predictions for today's biggest matches
          </p>
        </motion.div>

        {/* Matches Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuredMatches.map((match, index) => (
            <motion.div
              key={match.id}
              variants={cardVariants}
              whileHover="hover"
              className="group cursor-pointer"
            >
              <div className={cn(
                'relative p-6 rounded-xl border-2 transition-all duration-300',
                'bg-gradient-to-b from-gray-900/80 to-gray-900/40 backdrop-blur-sm',
                'hover:shadow-xl hover:shadow-amber-500/20',
                'border-gray-700 hover:border-amber-500/50'
              )}>
                {/* Match Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-amber-400 font-medium px-2 py-1 bg-amber-500/20 rounded-full">
                    {match.league}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <Calendar size={12} />
                    <span>{match.date}</span>
                  </div>
                </div>

                {/* Teams */}
                <div className="space-y-4 mb-6">
                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TeamLogo teamName={match.homeTeam} size="sm" variant="circle" />
                      <span className="text-white font-semibold">{match.homeTeam}</span>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <div className="w-8 h-px bg-amber-400/50"></div>
                      <span>VS</span>
                      <div className="w-8 h-px bg-amber-400/50"></div>
                    </div>
                    <div className="ml-4 flex items-center gap-1 text-xs text-white/60">
                      <Clock size={12} />
                      <span>{match.time}</span>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TeamLogo teamName={match.awayTeam} size="sm" variant="circle" />
                      <span className="text-white font-semibold">{match.awayTeam}</span>
                    </div>
                  </div>
                </div>

                {/* Prediction Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Prediction:</span>
                    <span className="text-sm font-semibold text-amber-400">{match.prediction}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Odds:</span>
                    <span className="text-sm font-bold text-white">{match.odds}x</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Confidence:</span>
                    <div className={cn(
                      'px-2 py-1 rounded-full text-xs font-bold border',
                      getConfidenceColor(match.confidence)
                    )}>
                      {match.confidence}%
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${match.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Premium Badge */}
                {match.confidence >= 90 && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold rounded-full">
                      <Star size={10} />
                      <span>Premium</span>
                    </div>
                  </div>
                )}

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View More Button */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
          >
            View All Matches
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FeaturedMatchesSection;
