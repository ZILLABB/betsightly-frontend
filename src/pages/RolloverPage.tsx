import React, { useEffect, useState } from "react";
import { formatLocalDateTime } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Calendar, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { usePredictions } from "../contexts/PredictionsContext";
import PredictionFilters from "../components/predictions/PredictionFilters";

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

const RolloverPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Use the predictions context
  const {
    rolloverPredictions,
    loading,
    error,
    refreshPredictions,
    loadRolloverPredictions
  } = usePredictions();

  // Load rollover predictions when component mounts
  useEffect(() => {
    loadRolloverPredictions(10);
  }, [loadRolloverPredictions]);

  // Handle refresh button click
  const handleRefresh = () => {
    refreshPredictions();
  };

  // Get days with predictions
  const daysWithPredictions = Object.keys(rolloverPredictions).map(Number).sort((a, b) => a - b);

  // Handle day selection
  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">10-Day Rollover Challenge</h1>
        <p className="text-amber-100/80">
          Follow our 10-day rollover challenges where we track a series of premium predictions
          over a 10-day period. See how our expert picks perform over time!
        </p>
      </div>

      {/* Date and Refresh Controls */}
      <Card className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 shadow-lg">
        <CardContent className="p-5">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Rollover Challenge</h3>
                  <p className="text-xs text-white/70">10-day betting strategy</p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
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

      {/* Rollover Data */}
      <Card variant="default" hover="glow" className="shadow-xl overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle size="md" font="clash" className="text-amber-400">
              Rollover Challenge <span className="text-white/70">• Day {selectedDay}</span>
            </CardTitle>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-white/70 font-jakarta">Live Updates</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : Object.keys(rolloverPredictions).length === 0 ? (
            <div className="text-center py-12 border border-amber-500/20 rounded-lg">
              <p className="text-white/70">No rollover predictions available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Day Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {daysWithPredictions.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDaySelect(day)}
                    className={selectedDay === day
                      ? "bg-amber-500 hover:bg-amber-600 text-black font-jakarta"
                      : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 font-jakarta"}
                  >
                    Day {day}
                  </Button>
                ))}
              </div>

              {/* Add PredictionFilters component */}
              <PredictionFilters showCategories={false} className="mb-6" />

              {/* Rollover Predictions Table */}
              <Card variant="surface" hover="glow">
                <CardHeader>
                  <CardTitle size="sm" font="clash" className="text-amber-400">Day {selectedDay} Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-amber-500/20">
                          <th className="text-left py-3 px-4 text-amber-400 font-medium font-jakarta">Match</th>
                          <th className="text-left py-3 px-4 text-amber-400 font-medium font-jakarta">Prediction</th>
                          <th className="text-left py-3 px-4 text-amber-400 font-medium font-jakarta">League</th>
                          <th className="text-center py-3 px-4 text-amber-400 font-medium font-jakarta">Odds</th>
                          <th className="text-center py-3 px-4 text-amber-400 font-medium font-jakarta">Confidence</th>
                          <th className="text-center py-3 px-4 text-amber-400 font-medium font-jakarta">Status</th>
                        </tr>
                      </thead>
                      <tbody className="font-jakarta">
                        {rolloverPredictions[selectedDay]?.map((prediction, index) => (
                          <tr key={index} className="border-b border-amber-500/10 hover:bg-black/30 transition-colors duration-150">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-white">
                                  {typeof prediction.game?.homeTeam === 'object'
                                    ? prediction.game.homeTeam.name
                                    : typeof prediction.game?.homeTeam === 'string'
                                      ? prediction.game.homeTeam
                                      : 'Home Team'}
                                </span>
                                <span className="font-medium text-white">
                                  {typeof prediction.game?.awayTeam === 'object'
                                    ? prediction.game.awayTeam.name
                                    : typeof prediction.game?.awayTeam === 'string'
                                      ? prediction.game.awayTeam
                                      : 'Away Team'}
                                </span>
                                <span className="text-xs text-white/50">
                                  {prediction.game?.startTime ? safeFormatDateTime(prediction.game.startTime) : 'Time N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-white">{prediction.predictionType || 'N/A'}</td>
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
                                  style={{ width: `${prediction.confidence || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-white/50 mt-1 block">
                                {(prediction.confidence || 0).toFixed(0)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                <Clock size={12} className="mr-1" />
                                Pending
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {(!rolloverPredictions[selectedDay] || rolloverPredictions[selectedDay].length === 0) && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-white/50">
                              No predictions available for Day {selectedDay}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolloverPage;
