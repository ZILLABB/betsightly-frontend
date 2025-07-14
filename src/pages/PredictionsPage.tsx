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
import TabbedPredictionsCard from "../components/predictions/TabbedPredictionsCard";
import { useToast } from "../hooks/useToast";
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

  // Use the predictions context
  const {
    allPredictions: predictions,
    loading,
    refreshing,
    error,
    refreshPredictions,
    loadAllPredictions
  } = usePredictions();

  // Load predictions on component mount
  useEffect(() => {
    loadAllPredictions();
  }, [loadAllPredictions]);

  // Get toast notification function
  const { toast } = useToast();



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

  // Handle prediction selection
  const handlePredictionSelect = (prediction: any) => {
    toast({
      title: "Prediction selected",
      description: `${prediction.game?.homeTeam?.name || prediction.fixture?.home_team || 'Home'} vs ${prediction.game?.awayTeam?.name || prediction.fixture?.away_team || 'Away'}`,
      variant: "info",
      duration: 2000
    });
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

      {/* Predictions Content with Tabbed Interface */}
      {loading ? (
        <Card className="border border-amber-500/20 bg-gradient-to-b from-gray-900 to-black shadow-xl overflow-hidden rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              <p className="text-white/70 text-sm font-jakarta">Loading predictions...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border border-amber-500/20 bg-gradient-to-b from-gray-900 to-black shadow-xl overflow-hidden rounded-xl">
          <CardContent className="p-6 text-center">
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
          </CardContent>
        </Card>
      ) : (
        <TabbedPredictionsCard
          predictions={predictions}
          onPredictionSelect={handlePredictionSelect}
          showFilters={true}
        />
      )}
    </div>
  );
};

export default PredictionsPage;
