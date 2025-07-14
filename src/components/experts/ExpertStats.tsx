import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar,
  DollarSign,
  BarChart3,
  Zap,
  Users,
  Trophy,
  Star,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Badge } from '../common/Badge';
import { cn } from '../../lib/utils';

interface ExpertStatsProps {
  expert: {
    id: number;
    name: string;
    success_rate?: number;
    totalPredictions?: number;
    wonPredictions?: number;
    streak?: number;
    monthlyWins?: number;
    totalEarnings?: number;
    followers?: number;
    averageOdds?: number;
    recentForm?: string;
    achievements?: string[];
    rank?: number;
    badge?: string;
  };
  className?: string;
}

const ExpertStats: React.FC<ExpertStatsProps> = ({ expert, className }) => {
  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
    return `$${amount}`;
  };

  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W': return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case 'L': return <div className="w-3 h-3 rounded-full bg-red-500" />;
      default: return <div className="w-3 h-3 rounded-full bg-yellow-500" />;
    }
  };

  const getSuccessRateColor = (rate?: number) => {
    if (!rate) return 'text-gray-400';
    if (rate >= 80) return 'text-green-400';
    if (rate >= 70) return 'text-amber-400';
    if (rate >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStreakColor = (streak?: number) => {
    if (!streak) return 'text-gray-400';
    if (streak >= 10) return 'text-green-400';
    if (streak >= 5) return 'text-amber-400';
    return 'text-blue-400';
  };

  const statsData = [
    {
      label: 'Success Rate',
      value: `${expert.success_rate?.toFixed(1) || 0}%`,
      icon: <Target className="h-5 w-5" />,
      color: getSuccessRateColor(expert.success_rate),
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Win Streak',
      value: expert.streak?.toString() || '0',
      icon: <Zap className="h-5 w-5" />,
      color: getStreakColor(expert.streak),
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      label: 'Total Predictions',
      value: formatNumber(expert.totalPredictions),
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Monthly Wins',
      value: expert.monthlyWins?.toString() || '0',
      icon: <Trophy className="h-5 w-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'Total Earnings',
      value: formatCurrency(expert.totalEarnings),
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      label: 'Followers',
      value: formatNumber(expert.followers),
      icon: <Users className="h-5 w-5" />,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    },
    {
      label: 'Average Odds',
      value: expert.averageOdds?.toFixed(2) || '0.00',
      icon: <Star className="h-5 w-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      label: 'Rank',
      value: expert.rank ? `#${expert.rank}` : 'Unranked',
      icon: <Award className="h-5 w-5" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Performance Overview */}
      <Card className="bg-gradient-to-br from-[#1A1A27] to-[#0F0F1A] border border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-300 hover:scale-105",
                  stat.bgColor,
                  stat.borderColor
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Form */}
      {expert.recentForm && (
        <Card className="bg-gradient-to-br from-[#1A1A27] to-[#0F0F1A] border border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Form (Last 10 Predictions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {expert.recentForm.split('').slice(-10).map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center gap-1"
                  >
                    {getFormIcon(result)}
                    <span className="text-xs text-white/60">{result}</span>
                  </motion.div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">Form Rating</p>
                <p className="text-lg font-bold text-amber-400">
                  {((expert.recentForm.split('').filter(r => r === 'W').length / expert.recentForm.length) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {expert.achievements && expert.achievements.length > 0 && (
        <Card className="bg-gradient-to-br from-[#1A1A27] to-[#0F0F1A] border border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expert.achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge 
                    variant="outline"
                    className="bg-amber-500/10 text-amber-400 border-amber-500/30 px-3 py-1"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    {achievement}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card className="bg-gradient-to-br from-[#1A1A27] to-[#0F0F1A] border border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Win Rate Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/60">Win Rate</span>
                <span className="text-sm font-medium text-white">
                  {expert.wonPredictions || 0}/{expert.totalPredictions || 0}
                </span>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${expert.success_rate || 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                />
              </div>
            </div>

            {/* Streak Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/60">Current Streak</span>
                <span className="text-sm font-medium text-white">
                  {expert.streak || 0} wins
                </span>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((expert.streak || 0) * 10, 100)}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full"
                />
              </div>
            </div>

            {/* Monthly Performance */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/60">Monthly Performance</span>
                <span className="text-sm font-medium text-white">
                  {expert.monthlyWins || 0}/30 days
                </span>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((expert.monthlyWins || 0) / 30) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.9 }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertStats;
