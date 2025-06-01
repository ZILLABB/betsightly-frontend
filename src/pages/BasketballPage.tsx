import React, { useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import {
  Zap,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Calendar,
  Target
} from "lucide-react";
import { getBasketballPredictions, getBasketballModelsStatus, isBasketballSeasonActive } from "../services/basketballApiService";
import type { BasketballPrediction, BasketballModelStatus } from "../types/basketball";
import { useToast } from "../hooks/useToast";
import { formatLocalDateTime } from "../utils/formatters";

// Helper function to safely format date/time
const safeFormatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Time N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Time N/A';
    return typeof date === 'string' ? formatLocalDateTime(date) : dateObj.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Time N/A';
  }
};

const BasketballPage: React.FC = () => {
  // State management
  const [predictions, setPredictions] = useState<BasketballPrediction[]>([]);
  const [modelsStatus, setModelsStatus] = useState<BasketballModelStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [seasonActive, setSeasonActive] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [minConfidence, setMinConfidence] = useState<number>(0.6);

  const { toast } = useToast();

  // Load basketball data
  const loadBasketballData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading basketball data...');

      // Load predictions and models status in parallel
      const [predictionsResponse, modelsResponse, seasonStatus] = await Promise.all([
        getBasketballPredictions({
          date: selectedDate.toISOString().split('T')[0],
          confidence: minConfidence
        }),
        getBasketballModelsStatus(),
        isBasketballSeasonActive()
      ]);

      setPredictions(predictionsResponse.predictions);
      setModelsStatus(modelsResponse);
      setSeasonActive(seasonStatus);

      console.log('Basketball data loaded successfully');
      toast({
        title: 'Basketball data loaded',
        description: `Found ${predictionsResponse.predictions.length} predictions`,
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Error loading basketball data:', error);
      setError('Failed to load basketball data');
      toast({
        title: 'Error loading data',
        description: 'Failed to load basketball predictions',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBasketballData();
    setRefreshing(false);
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadBasketballData();
  }, [selectedDate, minConfidence]);

  // Get status badge for predictions
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

  // Get model status badge
  const getModelStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Activity size={12} className="mr-1" />
            Active
          </Badge>
        );
      case "training":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <RefreshCw size={12} className="mr-1 animate-spin" />
            Training
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertCircle size={12} className="mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <Clock size={12} className="mr-1" />
            Inactive
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center font-clash">
            <Zap size={24} className="mr-2 text-orange-500" />
            NBA Basketball Predictions
          </h1>
          <p className="text-sm text-white/70 font-jakarta">
            AI-powered NBA predictions with advanced analytics
          </p>
        </div>
      </div>

      {/* Season Status Banner */}
      {!seasonActive && (
        <Card variant="surface" hover="none" className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-medium text-amber-400">NBA Season Status</h3>
                <p className="text-xs text-amber-300/70">
                  The NBA season is currently inactive. Predictions may be limited during off-season.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card variant="surface" hover="none" className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10">
                  <Calendar className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white font-jakarta">Date</h3>
                  <p className="text-xs text-white/70 font-jakarta">
                    {selectedDate.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10">
                  <Target className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white font-jakarta">Min Confidence</h3>
                  <p className="text-xs text-white/70 font-jakarta">
                    {(minConfidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

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

      {/* Models Status */}
      {modelsStatus.length > 0 && (
        <Card variant="surface" hover="none" className="overflow-hidden">
          <CardHeader>
            <CardTitle size="md" font="clash" className="text-orange-400">
              Model Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelsStatus.map((model, index) => (
                <div key={index} className="bg-black/20 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{model.model_name}</h4>
                    {getModelStatusBadge(model.status)}
                  </div>
                  <div className="space-y-1 text-sm text-white/70">
                    <p>Accuracy: {(model.accuracy * 100).toFixed(1)}%</p>
                    <p>Predictions Today: {model.predictions_today}</p>
                    <p>Version: {model.version}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      <Card variant="surface" hover="none" className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle size="md" font="clash" className="text-orange-400">
              NBA Predictions
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
              <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
              <p className="text-white/70 text-sm font-jakarta">Loading basketball predictions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-400 text-center mb-2 font-jakarta">{error}</p>
              <Button variant="outline" className="font-jakarta" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-12 border border-orange-500/20 rounded-lg">
              <p className="text-white/70 font-jakarta">
                No basketball predictions available for the selected criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-orange-500/20">
                    <th className="text-left py-3 px-4 text-orange-400 font-medium">Game</th>
                    <th className="text-left py-3 px-4 text-orange-400 font-medium">Prediction</th>
                    <th className="text-left py-3 px-4 text-orange-400 font-medium">League</th>
                    <th className="text-center py-3 px-4 text-orange-400 font-medium">Odds</th>
                    <th className="text-center py-3 px-4 text-orange-400 font-medium">Confidence</th>
                    <th className="text-center py-3 px-4 text-orange-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction) => (
                    <tr key={prediction.id} className="border-b border-orange-500/10 hover:bg-black/30">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {prediction.game.home_team.name}
                          </span>
                          <span className="font-medium text-white">
                            {prediction.game.away_team.name}
                          </span>
                          <span className="text-xs text-white/50">
                            {safeFormatDateTime(prediction.game.start_time)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">{prediction.prediction}</td>
                      <td className="py-3 px-4 text-white/70">{prediction.game.league}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          {prediction.odds.toFixed(2)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-full bg-gray-700/30 rounded-full h-2.5">
                          <div
                            className="bg-orange-500 h-2.5 rounded-full"
                            style={{ width: `${(prediction.confidence * 100).toFixed(0)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-white/50 mt-1 block">
                          {(prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(prediction.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BasketballPage;
