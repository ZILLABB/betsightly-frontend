import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { Card, CardContent } from "../common/Card";
import { Target, Zap, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { isBasketballSeasonActive } from "../../services/basketballApiService";
import { checkAPIHealth } from "../../services/unifiedApiService";

interface SeasonalSportSwitcherProps {
  className?: string;
}

const SeasonalSportSwitcher: React.FC<SeasonalSportSwitcherProps> = ({ className = "" }) => {
  const location = useLocation();
  const [basketballSeasonActive, setBasketballSeasonActive] = useState<boolean>(false);
  const [footballApiHealthy, setFootballApiHealthy] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Check season status and API health
  useEffect(() => {
    const checkSeasonStatus = async () => {
      try {
        setLoading(true);
        const [basketballActive, apiHealthy] = await Promise.all([
          isBasketballSeasonActive(),
          checkAPIHealth()
        ]);
        
        setBasketballSeasonActive(basketballActive);
        setFootballApiHealthy(apiHealthy);
      } catch (error) {
        console.error('Error checking season status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSeasonStatus();
  }, []);

  // Determine current sport based on route
  const getCurrentSport = () => {
    if (location.pathname.includes('/basketball')) return 'basketball';
    if (location.pathname.includes('/predictions')) return 'football';
    return 'home';
  };

  const currentSport = getCurrentSport();

  // Sport options with status
  const sportOptions = [
    {
      key: 'football',
      label: 'Football',
      icon: <Target size={16} />,
      path: '/predictions',
      active: footballApiHealthy,
      status: footballApiHealthy ? 'Available' : 'API Issues',
      color: 'blue',
      description: 'Soccer predictions with live data'
    },
    {
      key: 'basketball',
      label: 'Basketball',
      icon: <Zap size={16} />,
      path: '/basketball',
      active: basketballSeasonActive,
      status: basketballSeasonActive ? 'Season Active' : 'Off-Season',
      color: 'orange',
      description: 'NBA predictions and analytics'
    }
  ];

  if (loading) {
    return (
      <Card variant="surface" hover="none" className={`overflow-hidden ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-white/70">Checking seasons...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="surface" hover="none" className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Sports Available</h3>
          </div>

          {/* Sport Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sportOptions.map((sport) => (
              <Link
                key={sport.key}
                to={sport.path}
                className={`block transition-all duration-200 ${
                  currentSport === sport.key ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    currentSport === sport.key
                      ? `border-${sport.color}-500/50 bg-${sport.color}-500/10`
                      : `border-gray-500/30 bg-black/20 hover:border-${sport.color}-500/30`
                  }`}
                >
                  {/* Sport Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          sport.color === 'blue' ? 'bg-blue-500/10' : 'bg-orange-500/10'
                        }`}
                      >
                        <span
                          className={`${
                            sport.color === 'blue' ? 'text-blue-400' : 'text-orange-400'
                          }`}
                        >
                          {sport.icon}
                        </span>
                      </div>
                      <span className="font-medium text-white">{sport.label}</span>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      className={`${
                        sport.active
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {sport.active ? (
                        <CheckCircle size={10} className="mr-1" />
                      ) : (
                        <AlertCircle size={10} className="mr-1" />
                      )}
                      {sport.status}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-white/60">{sport.description}</p>

                  {/* Current Selection Indicator */}
                  {currentSport === sport.key && (
                    <div className="mt-2 pt-2 border-t border-gray-500/20">
                      <span className="text-xs text-amber-400 font-medium">Currently Viewing</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Season Information */}
          <div className="pt-3 border-t border-gray-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Football API:</span>
                <span className={footballApiHealthy ? 'text-green-400' : 'text-red-400'}>
                  {footballApiHealthy ? 'Healthy' : 'Issues'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">NBA Season:</span>
                <span className={basketballSeasonActive ? 'text-green-400' : 'text-amber-400'}>
                  {basketballSeasonActive ? 'Active' : 'Off-Season'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              asChild
            >
              <Link to="/predictions">
                <Target size={12} className="mr-1" />
                Football
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              asChild
              disabled={!basketballSeasonActive}
            >
              <Link to="/basketball">
                <Zap size={12} className="mr-1" />
                Basketball
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonalSportSwitcher;
