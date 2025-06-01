import React, { useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import {
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Database,
  Cpu,
  BarChart3,
  Clock
} from "lucide-react";
import { getBasketballModelsStatus, getBasketballStats } from "../services/basketballApiService";
import type { BasketballModelStatus, BasketballStats } from "../types/basketball";
import { useToast } from "../hooks/useToast";

const BasketballModelsPage: React.FC = () => {
  // State management
  const [modelsStatus, setModelsStatus] = useState<BasketballModelStatus[]>([]);
  const [stats, setStats] = useState<BasketballStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Load models data
  const loadModelsData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading basketball models data...');

      // Load models status and stats in parallel
      const [modelsResponse, statsResponse] = await Promise.all([
        getBasketballModelsStatus(),
        getBasketballStats()
      ]);

      setModelsStatus(modelsResponse);
      setStats(statsResponse);

      console.log('Basketball models data loaded successfully');
      toast({
        title: 'Models data loaded',
        description: `Found ${modelsResponse.length} models`,
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Error loading basketball models data:', error);
      setError('Failed to load basketball models data');
      toast({
        title: 'Error loading data',
        description: 'Failed to load basketball models status',
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
    await loadModelsData();
    setRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    loadModelsData();
  }, []);

  // Get model status badge
  const getModelStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle size={12} className="mr-1" />
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

  // Get performance color based on accuracy
  const getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 0.7) return "text-green-400";
    if (accuracy >= 0.6) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center font-clash">
            <Activity size={24} className="mr-2 text-orange-500" />
            Basketball Models Status
          </h1>
          <p className="text-sm text-white/70 font-jakarta">
            Monitor NBA prediction models performance and health
          </p>
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

      {/* Overall Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="surface" hover="glow" className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10">
                  <TrendingUp className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70">Total Predictions</h3>
                  <p className="text-2xl font-bold text-white">{stats.total_predictions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="surface" hover="glow" className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
                  <BarChart3 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70">Overall Accuracy</h3>
                  <p className={`text-2xl font-bold ${getPerformanceColor(stats.accuracy_overall)}`}>
                    {(stats.accuracy_overall * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="surface" hover="glow" className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10">
                  <Cpu className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70">Active Models</h3>
                  <p className="text-2xl font-bold text-white">{stats.active_models}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="surface" hover="glow" className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10">
                  <Database className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70">Season Status</h3>
                  <p className={`text-lg font-bold ${stats.season_active ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.season_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Models Status */}
      <Card variant="surface" hover="none" className="overflow-hidden">
        <CardHeader>
          <CardTitle size="md" font="clash" className="text-orange-400">
            Model Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
              <p className="text-white/70 text-sm font-jakarta">Loading models status...</p>
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
          ) : modelsStatus.length === 0 ? (
            <div className="text-center py-12 border border-orange-500/20 rounded-lg">
              <p className="text-white/70 font-jakarta">No basketball models found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {modelsStatus.map((model, index) => (
                <div key={index} className="bg-black/20 border border-orange-500/20 rounded-lg p-6">
                  {/* Model Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">{model.model_name}</h4>
                    {getModelStatusBadge(model.status)}
                  </div>

                  {/* Model Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-white/70">League</p>
                      <p className="text-white font-medium">{model.league}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Version</p>
                      <p className="text-white font-medium">{model.version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Accuracy</p>
                      <p className={`font-bold ${getPerformanceColor(model.accuracy)}`}>
                        {(model.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Predictions Today</p>
                      <p className="text-white font-medium">{model.predictions_today}</p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {model.performance_metrics && (
                    <div className="border-t border-orange-500/20 pt-4">
                      <h5 className="text-sm font-medium text-orange-400 mb-2">Performance Metrics</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Precision:</span>
                          <span className="text-white">{(model.performance_metrics.precision * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Recall:</span>
                          <span className="text-white">{(model.performance_metrics.recall * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">F1 Score:</span>
                          <span className="text-white">{(model.performance_metrics.f1_score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">ROI:</span>
                          <span className={`${model.performance_metrics.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(model.performance_metrics.roi * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Training Data Info */}
                  {model.training_data && (
                    <div className="border-t border-orange-500/20 pt-4 mt-4">
                      <h5 className="text-sm font-medium text-orange-400 mb-2">Training Data</h5>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Games Count:</span>
                          <span className="text-white">{model.training_data.games_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Features:</span>
                          <span className="text-white">{model.training_data.features_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Last Training:</span>
                          <span className="text-white">
                            {new Date(model.training_data.last_training_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prediction Types */}
                  <div className="border-t border-orange-500/20 pt-4 mt-4">
                    <h5 className="text-sm font-medium text-orange-400 mb-2">Prediction Types</h5>
                    <div className="flex flex-wrap gap-2">
                      {model.prediction_types.map((type, typeIndex) => (
                        <Badge key={typeIndex} className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-4 pt-4 border-t border-orange-500/20">
                    <p className="text-xs text-white/50">
                      Last updated: {new Date(model.last_updated).toLocaleString()}
                    </p>
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

export default BasketballModelsPage;
