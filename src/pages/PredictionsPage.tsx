import React, { useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import {
  Calendar,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp
} from "lucide-react";
import { usePredictions } from "../contexts/PredictionsContext";
import type { Prediction } from "../types";
import PredictionFilters from "../components/predictions/PredictionFilters";
import { formatLocalDateTime } from "../utils/formatters";

// Helper function to safely format date/time
const safeFormatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Time N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Time N/A';
    return typeof date === 'string' ? formatLocalDateTime(date) : dateObj.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Time N/A';
  }
};

const PredictionsPage: React.FC = () => {
  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Use the predictions context
  const {
    bestPredictions: predictions,
    loading,
    refreshing,
    error,
    refreshPredictions,
    loadBestPredictions
  } = usePredictions();

  // Load predictions on component mount
  useEffect(() => {
    loadBestPredictions();
  }, [loadBestPredictions]);

  // Log predictions and active category for debugging
  useEffect(() => {
    console.log('Active Category:', activeCategory);
    console.log('Available Predictions:', predictions);
  }, [activeCategory, predictions]);

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // Note: In a real implementation, we would fetch predictions for the selected date
    // For now, we'll just use the current predictions
  };

  // Handle refresh button click
  const handleRefresh = () => {
    refreshPredictions();
  };

  // Define category display names
  const categoryNames: Record<string, string> = {
    '2_odds': 'Safe Bets (2-3x)',
    '5_odds': 'Balanced Risk (4-6x)',
    '10_odds': 'High Reward (7-12x)',
    'rollover': 'Daily Rollover',
    // Add API response format keys as well
    '2odds': 'Safe Bets (2-3x)',
    '5odds': 'Balanced Risk (4-6x)',
    '10odds': 'High Reward (7-12x)'
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle size={12} className="mr-1" />
            Won
          </Badge>
        );
      case "lost":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle size={12} className="mr-1" />
            Lost
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center font-clash">
            <TrendingUp size={24} className="mr-2 text-amber-500" />
            AI Predictions
          </h1>
          <p className="text-sm text-white/70 font-jakarta">
            Advanced machine learning predictions with high accuracy rates
          </p>
        </div>
      </div>

      {/* Date and Filter Bar */}
      <Card variant="surface" hover="none" className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white font-jakarta">Date</h3>
                  <p className="text-xs text-white/70 font-jakarta">Select prediction date</p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              className="font-jakarta"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <PredictionFilters
        showCategories={true}
        onCategoryChange={setActiveCategory}
        selectedCategory={activeCategory}
      />

      {/* Predictions Content */}
      <Card variant="surface" hover="none" className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle size="md" font="clash" className="text-amber-400">
              {categoryNames[activeCategory] || 'All Predictions'}
            </CardTitle>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-white/70 font-jakarta">Live Updates</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              <p className="text-white/70 text-sm font-jakarta">Loading predictions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-400 text-center mb-2 font-jakarta">{error}</p>
              <Button
                variant="outline"
                className="font-jakarta"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : Object.keys(predictions).length === 0 ? (
            <div className="text-center py-12 border border-amber-500/20 rounded-lg">
              <p className="text-white/70 font-jakarta">No predictions available for the selected date.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(predictions)
                .filter(([category]) => {
                  // Convert activeCategory to match the API response format
                  const formattedActiveCategory = activeCategory === '2_odds' ? '2_odds' :
                                                 activeCategory === '5_odds' ? '5_odds' :
                                                 activeCategory === '10_odds' ? '10_odds' :
                                                 activeCategory === 'rollover' ? 'rollover' : 'all';

                  return formattedActiveCategory === 'all' || category === formattedActiveCategory;
                })
                .map(([categoryKey, categoryPredictions]) => (
                <div key={categoryKey} className="bg-black/20 border border-amber-500/20 rounded-lg overflow-hidden">
                  <div className="bg-black/30 p-4 border-b border-amber-500/20">
                    <h3 className="text-xl font-bold text-amber-400">{categoryNames[categoryKey as keyof typeof categoryNames] || categoryKey}</h3>
                    {categoryPredictions.length > 0 && categoryPredictions[0].combined_odds && (
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Combined Odds: {categoryPredictions[0].combined_odds.toFixed(2)}
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Confidence: {(categoryPredictions[0].combined_confidence || 0) * 100}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-amber-500/20">
                          <th className="text-left py-3 px-4 text-amber-400 font-medium">Match</th>
                          <th className="text-left py-3 px-4 text-amber-400 font-medium">Prediction</th>
                          <th className="text-left py-3 px-4 text-amber-400 font-medium">League</th>
                          <th className="text-center py-3 px-4 text-amber-400 font-medium">Odds</th>
                          <th className="text-center py-3 px-4 text-amber-400 font-medium">Confidence</th>
                          <th className="text-center py-3 px-4 text-amber-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryPredictions.length > 0 && categoryPredictions[0].predictions ? (
                          // New API format with nested predictions
                          categoryPredictions[0].predictions.map((prediction: any, index: number) => {
                            const fixture = prediction.fixture;

                            // Format prediction text
                            let predictionText = '';
                            if (prediction.prediction_type === 'match_result') {
                              if (prediction.match_result_pred === 'home') {
                                predictionText = `${fixture.home_team} to win`;
                              } else if (prediction.match_result_pred === 'draw') {
                                predictionText = 'Draw';
                              } else {
                                predictionText = `${fixture.away_team} to win`;
                              }
                            } else if (prediction.prediction_type === 'over_under') {
                              predictionText = `${prediction.over_under_pred === 'over' ? 'Over' : 'Under'} 2.5 goals`;
                            } else if (prediction.prediction_type === 'btts') {
                              predictionText = `BTTS: ${prediction.btts_pred === 'yes' ? 'Yes' : 'No'}`;
                            }

                            return (
                              <tr key={index} className="border-b border-amber-500/10 hover:bg-black/30">
                                <td className="py-3 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-white">{fixture.home_team}</span>
                                    <span className="font-medium text-white">{fixture.away_team}</span>
                                    <span className="text-xs text-white/50">
                                      {fixture.start_time || 'Time N/A'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-white">{predictionText}</td>
                                <td className="py-3 px-4 text-white/70">{fixture.league_name}</td>
                                <td className="py-3 px-4 text-center">
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                    {prediction.odds.toFixed(2)}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="w-full bg-gray-700/30 rounded-full h-2.5">
                                    <div
                                      className="bg-amber-500 h-2.5 rounded-full"
                                      style={{ width: `${(prediction.confidence * 100).toFixed(0)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-white/50 mt-1 block">
                                    {(prediction.confidence * 100).toFixed(0)}%
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {getStatusBadge(prediction.status || 'pending')}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          // Old API format
                          categoryPredictions.map((prediction: any) => (
                            <tr key={prediction.id} className="border-b border-amber-500/10 hover:bg-black/30">
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-white">{prediction.game?.homeTeam?.name || 'Home Team'}</span>
                                  <span className="font-medium text-white">{prediction.game?.awayTeam?.name || 'Away Team'}</span>
                                  <span className="text-xs text-white/50">
                                    {prediction.game?.startTime ? safeFormatDateTime(prediction.game.startTime) : 'Time N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-white">{prediction.predictionType}</td>
                              <td className="py-3 px-4 text-white/70">{prediction.game?.league || 'Unknown League'}</td>
                              <td className="py-3 px-4 text-center">
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                  {prediction.odds?.toFixed(2) || '0.00'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="w-full bg-gray-700/30 rounded-full h-2.5">
                                  <div
                                    className="bg-amber-500 h-2.5 rounded-full"
                                    style={{ width: `${prediction.confidence || prediction.confidencePct || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-white/50 mt-1 block">
                                  {(prediction.confidence || prediction.confidencePct || 0).toFixed(0)}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getStatusBadge(prediction.status)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionsPage;
