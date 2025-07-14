import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Award, 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  MapPin,
  ExternalLink,
  Crown,
  Zap,
  Trophy,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card, CardContent } from '../common/Card';
import { cn } from '../../lib/utils';

interface ExpertCardProps {
  expert: {
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
  };
  onFavorite?: (id: number) => void;
  isFavorite?: boolean;
  onViewProfile?: (id: number) => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({
  expert,
  onFavorite,
  isFavorite = false,
  onViewProfile
}) => {
  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'Elite': return 'from-amber-500 to-yellow-500';
      case 'Pro': return 'from-blue-500 to-cyan-500';
      case 'Rising': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRankIcon = (rank?: number) => {
    if (!rank) return <Target className="h-4 w-4" />;
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank <= 3) return <Trophy className="h-4 w-4 text-amber-500" />;
    if (rank <= 10) return <Award className="h-4 w-4 text-blue-500" />;
    return <Target className="h-4 w-4" />;
  };

  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'L': return <Clock className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-yellow-500" />;
    }
  };

  const formatEarnings = (earnings?: number) => {
    if (!earnings) return '$0';
    if (earnings >= 1000) return `$${(earnings / 1000).toFixed(1)}k`;
    return `$${earnings}`;
  };

  const formatFollowers = (followers?: number) => {
    if (!followers) return '0';
    if (followers >= 1000) return `${(followers / 1000).toFixed(1)}k`;
    return followers.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#1A1A27] via-[#1A1A27] to-[#0F0F1A] border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rank Badge */}
        {expert.rank && expert.rank <= 10 && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 border border-amber-500/30">
              {getRankIcon(expert.rank)}
              <span className="text-xs font-bold text-amber-400">#{expert.rank}</span>
            </div>
          </div>
        )}

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-black/60 backdrop-blur-sm hover:bg-amber-500/20 border border-amber-500/30"
            onClick={() => onFavorite?.(expert.id)}
          >
            <Star 
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite ? "fill-amber-500 text-amber-500" : "text-white/70 hover:text-amber-500"
              )} 
            />
          </Button>
        </div>

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-0.5">
                <div className="w-full h-full rounded-full bg-[#1A1A27] flex items-center justify-center overflow-hidden">
                  {expert.image_url ? (
                    <img
                      src={expert.image_url}
                      alt={expert.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={cn("flex items-center justify-center w-full h-full", expert.image_url ? 'hidden' : '')}>
                    <span className="text-2xl font-bold text-amber-500">
                      {expert.name.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Verification Badge */}
              {expert.verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Name and Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-white truncate">{expert.name}</h3>
                {expert.badge && (
                  <Badge className={cn(
                    "text-xs px-2 py-0.5 bg-gradient-to-r text-white border-0",
                    getBadgeColor(expert.badge)
                  )}>
                    {expert.badge}
                  </Badge>
                )}
              </div>
              
              {expert.nickname && (
                <p className="text-amber-400 text-sm font-medium mb-1">@{expert.nickname}</p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-white/60">
                <MapPin className="h-3 w-3" />
                <span>{expert.country}</span>
                {expert.specialty && (
                  <>
                    <span>•</span>
                    <span>{expert.specialty}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/30 rounded-lg p-3 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-white/60">Success Rate</span>
              </div>
              <div className="text-xl font-bold text-green-400">
                {expert.success_rate?.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-3 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-white/60">Streak</span>
              </div>
              <div className="text-xl font-bold text-amber-400">
                {expert.streak || 0}
              </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-3 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-white/60">Monthly</span>
              </div>
              <div className="text-xl font-bold text-blue-400">
                {expert.monthlyWins || 0}
              </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-3 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-white/60">Followers</span>
              </div>
              <div className="text-xl font-bold text-purple-400">
                {formatFollowers(expert.followers)}
              </div>
            </div>
          </div>

          {/* Recent Form */}
          {expert.recentForm && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/60">Recent Form</span>
              </div>
              <div className="flex gap-1">
                {expert.recentForm.split('').slice(-10).map((result, index) => (
                  <div key={index} className="flex items-center justify-center">
                    {getFormIcon(result)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {expert.bio && (
            <p className="text-sm text-white/70 line-clamp-2 mb-4">
              {expert.bio}
            </p>
          )}

          {/* Expertise Tags */}
          {expert.expertise && expert.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {expert.expertise.slice(0, 3).map((skill, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/30"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              onClick={() => onViewProfile?.(expert.id)}
            >
              View Profile
            </Button>
            
            {expert.social_media && Object.keys(expert.social_media).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="px-3 text-white/60 hover:text-amber-400"
                onClick={() => {
                  const firstSocial = Object.values(expert.social_media!)[0];
                  window.open(firstSocial, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpertCard;
