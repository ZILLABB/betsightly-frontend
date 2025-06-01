import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
import TabbedPredictionsCard from "../components/predictions/TabbedPredictionsCard";

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
  const location = useLocation();

  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get initial category from navigation state or default to "2_odds"
  const initialCategory = location.state?.activeCategory || "2_odds";
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

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

      {/* Enhanced Predictions Display */}
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
        <TabbedPredictionsCard
          predictions={predictions}
          showFilters={false}
          initialCategory={initialCategory}
        />
      )}
    </div>
  );
};

export default PredictionsPage;
