import React, { useEffect, useState, useCallback } from "react";
import type { DailyPredictions, Prediction } from "../types";
import PredictionsList from "../components/predictions/PredictionsList";
import { Button } from "../components/common/Button";
import { Card, CardContent } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import DataLoadingIndicator from "../components/common/DataLoadingIndicator";
import { TrackedErrorBoundary } from "../components/common/ErrorBoundary";
import { formatDate } from "../lib/utils";
import { predictionsToCSV, downloadCSV, generatePredictionsPDF, sharePredictions } from "../utils/exportUtils";
import { Download, RefreshCw } from "lucide-react";
import DatePicker from "../components/common/DatePicker";
import OfflineStatusBar from "../components/common/OfflineStatusBar";
// Import enhanced API service
import {
  getAllBestPredictions,
  getBestPredictionsByCategory,
  checkAPIHealth
} from "../services/enhancedApiService";
// Import unified data service as fallback
import {
  getPredictionsForDay,
  getDailyPredictions
} from "../services/unifiedDataService";

const PredictionsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);

  // Use offline-first data fetching with error handling
  const [dailyPredictions, setDailyPredictions] = useState<DailyPredictions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('cache');

  // Function to check if data is stale (older than 1 hour)
  const checkIfDataIsStale = useCallback(() => {
    if (!lastUpdated) return true;

    const now = new Date();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const timeDiff = now.getTime() - lastUpdated.getTime();

    if (timeDiff > oneHour) {
      setIsStale(true);
      return true;
    }

    setIsStale(false);
    return false;
  }, [lastUpdated]);

  // Function to fetch predictions
  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      // First check if the API is healthy
      try {
        const healthCheck = await checkAPIHealth();
        console.log('API health check:', healthCheck);

        if (healthCheck.status === 'ok') {
          // API is healthy, fetch predictions directly from the API
          try {
            // Get today's date
            const today = new Date();
            console.log("Fetching best predictions for today:", formatDate(today));

            // First try to get all best predictions
            const bestPredictions = await getAllBestPredictions();
            console.log('Got best predictions:', bestPredictions);

            if (bestPredictions && Object.keys(bestPredictions).length > 0) {
              // Create a DailyPredictions object for today
              const dailyPrediction: DailyPredictions = {
                date: today,
                predictions: Object.values(bestPredictions).flat()
              };

              // Set today's predictions
              setDailyPredictions([dailyPrediction]);
              const now = new Date();
              setLastUpdated(now);
              setIsStale(false);
              setDataSource('api');

              // Now try to fetch more days in the background
              try {
                // For now, we only have today's predictions from the API
                // In the future, we could fetch predictions for other days
                console.log('Only today\'s predictions are available from the API');
              } catch (moreError) {
                console.warn("Could not fetch additional days, but today's data is available:", moreError);
              }
            } else {
              throw new Error('No best predictions found');
            }
          } catch (apiError) {
            console.error("Error fetching predictions from API:", apiError);
            throw apiError; // Rethrow to trigger fallback
          }
        } else {
          throw new Error('API health check failed');
        }
      } catch (healthError) {
        console.error("API health check failed:", healthError);

        // Fall back to unified data service
        try {
          // Always try to fetch today's predictions first for the most up-to-date data
          const today = new Date();
          console.log("Falling back to unified data service for today:", formatDate(today));

          try {
            // Try to get today's predictions directly
            const todayPredictions = await getPredictionsForDay(today);

            // Create a DailyPredictions object for today
            const dailyPrediction: DailyPredictions = {
              date: today,
              predictions: todayPredictions
            };

            // Set today's predictions
            setDailyPredictions([dailyPrediction]);
            const now = new Date();
            setLastUpdated(now);
            setIsStale(false);
            setDataSource('cache');

            // Now try to fetch more days in the background
            try {
              const allPredictions = await getDailyPredictions(10);

              // Ensure all dates are Date objects
              const processedPredictions = allPredictions.map(dp => ({
                ...dp,
                date: dp.date instanceof Date ? dp.date : new Date(dp.date)
              }));

              // Only update if we got more predictions than just today
              if (processedPredictions.length > 1) {
                setDailyPredictions(processedPredictions);
              }
            } catch (moreError) {
              console.warn("Could not fetch additional days, but today's data is available:", moreError);
            }
          } catch (todayError) {
            console.error("Failed to fetch today's predictions directly:", todayError);

            // Fall back to getting all predictions
            try {
              // Try to fetch daily predictions for the last 10 days
              const predictions = await getDailyPredictions(10);

              // Ensure all dates are Date objects
              const processedPredictions = predictions.map(dp => ({
                ...dp,
                date: dp.date instanceof Date ? dp.date : new Date(dp.date)
              }));

              setDailyPredictions(processedPredictions);
              const now = new Date();
              setLastUpdated(now);
              setIsStale(false);
              setDataSource('cache');
            } catch (allError) {
              console.error("Failed to fetch all predictions:", allError);
              setFetchError(new Error("Failed to load predictions. Please try again later."));
            }
          }
        } catch (fallbackError) {
          console.error("Fallback to unified data service failed:", fallbackError);
          setFetchError(new Error("Failed to load predictions. Please try again later."));
        }
      }
    } catch (error) {
      console.error("Unexpected error in fetchPredictions:", error);
      setFetchError(new Error("An unexpected error occurred. Please try again later."));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Check if data is stale periodically
  useEffect(() => {
    // Check initially
    checkIfDataIsStale();

    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkIfDataIsStale();
    }, 60000); // 1 minute

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [lastUpdated, checkIfDataIsStale]);

  // Refresh function - just use fetchPredictions directly
  const refreshData = fetchPredictions;

  // Update data source if data is stale
  useEffect(() => {
    if (isStale || fetchError) {
      setDataSource('cache');
    }
  }, [isStale, fetchError]);

  // Handle export functions
  const handleExportCSV = () => {
    if (selectedPredictions.length === 0) return;

    const csvData = predictionsToCSV(selectedPredictions);
    downloadCSV(csvData, `betsightly-predictions-${formatDate(selectedDate)}.csv`);
  };

  const handleExportPDF = () => {
    if (selectedPredictions.length === 0) return;

    generatePredictionsPDF(selectedPredictions);
  };

  const handleShare = async () => {
    if (selectedPredictions.length === 0) return;

    const success = await sharePredictions(
      selectedPredictions,
      `BetSightly Predictions - ${formatDate(selectedDate)}`
    );

    if (!success) {
      alert("Sharing is not supported on this device or browser.");
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshData();
  };

  // Handle clicks outside the export dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportOptions && !target.closest('.export-dropdown-container')) {
        setShowExportOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportOptions]);

  // Get predictions for the selected date and filter out duplicates
  const selectedPredictions = React.useMemo(() => {
    // Get all predictions for the selected date
    const allPredictions = (dailyPredictions || []).find(
      (dp) => {
        // Ensure dp.date is a Date object
        const dpDate = dp.date instanceof Date ? dp.date : new Date(dp.date);
        return formatDate(dpDate) === formatDate(selectedDate);
      }
    )?.predictions || [];

    // Create a map to track unique fixture IDs
    const uniqueFixtureIds = new Map();

    // Filter out duplicates but keep all games regardless of start time
    return allPredictions.filter(prediction => {
      // Check if we've already seen this fixture ID
      const fixtureId = prediction.game?.id;
      const isDuplicate = fixtureId && uniqueFixtureIds.has(fixtureId);

      // If it's not a duplicate, add it to our map and keep it
      if (fixtureId && !isDuplicate) {
        uniqueFixtureIds.set(fixtureId, true);
        return true;
      }

      return false;
    });
  }, [dailyPredictions, selectedDate]);

  // Get unique dates from daily predictions and ensure they are Date objects
  const dates = (dailyPredictions || []).map((dp) => {
    // Ensure date is a Date object
    return dp.date instanceof Date ? dp.date : new Date(dp.date);
  });

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">Advanced ML Predictions</h1>
        <p className="text-amber-100/80">
          Exclusive AI-powered predictions using advanced machine learning models (XGBoost, LightGBM, Neural Networks)
        </p>
      </div>

      {/* Date Selector */}
      <Card className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 shadow-lg">
        <CardContent className="p-5">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
                  <DatePicker
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    minDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)} // 30 days ago
                    maxDate={new Date()} // Today
                  />
                </div>
              </div>

              <div className="h-6 border-r border-amber-500/20 mx-2"></div>

              <div className="flex flex-wrap gap-2">
                {dates.slice(0, 5).map((date) => (
                  <Button
                    key={date.toISOString()}
                    variant={
                      formatDate(date) === formatDate(selectedDate)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedDate(date)}
                    className={
                      formatDate(date) === formatDate(selectedDate)
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                        : "border-amber-500/20 text-amber-400 hover:bg-black/20 hover:border-amber-500/40"
                    }
                  >
                    {formatDate(date)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1 border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predictions List */}
      <Card className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/20 shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-400">
              Advanced ML Picks <span className="text-white/70">• {formatDate(selectedDate)}</span>
            </h2>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-white/70">Live Updates</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 bg-black/20 rounded-xl border border-amber-500/10">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-white/70 text-lg">Loading premium predictions...</p>
            </div>
          ) : fetchError ? (
            <div className="text-center py-16 bg-black/20 rounded-xl border border-red-500/20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <RefreshCw size={28} className="text-red-400" />
              </div>
              <p className="text-xl font-semibold mb-2 text-red-400">Error Loading Predictions</p>
              <p className="text-white/70 mb-6 max-w-md mx-auto">
                {fetchError.message || "Failed to load predictions. Please try again later."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={handleRefresh}
              >
                <RefreshCw size={14} className="mr-1.5" />
                Retry
              </Button>
            </div>
          ) : selectedPredictions.length === 0 ? (
            <div className="text-center py-16 bg-black/20 rounded-xl border border-amber-500/10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
                <RefreshCw size={28} className="text-amber-400" />
              </div>
              <p className="text-xl font-semibold mb-2 text-amber-400">No Predictions Available</p>
              <p className="text-white/70 mb-6">
                There are no predictions available for {formatDate(selectedDate)}.
                Please select another date or check back later.
              </p>
              <Button
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50"
                onClick={() => setSelectedDate(new Date())}
              >
                View Today's Predictions
              </Button>
            </div>
          ) : (
            <TrackedErrorBoundary>
              <div className="bg-black/30 rounded-xl p-6 border border-amber-500/10">
                <PredictionsList
                  predictions={selectedPredictions}
                  title=""
                  showFilters={false}
                />
              </div>
            </TrackedErrorBoundary>
          )}
        </CardContent>
      </Card>

      {/* Advanced ML Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                <path d="M12 12v5"></path>
                <path d="M8 12v5"></path>
                <path d="M16 12v5"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-amber-400 mb-2">XGBoost Model</h3>
            <p className="text-white/70 mb-4">
              Our XGBoost model is trained on over 100,000 matches for superior match result predictions
            </p>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50 w-full"
              onClick={handleRefresh}
            >
              Refresh Predictions
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M12 2H2v10h10V2Z"></path>
                <path d="M22 12h-4v4h4v-4Z"></path>
                <path d="M12 8h4v4h-4V8Z"></path>
                <path d="M17 16v4h-4v-4h4Z"></path>
                <path d="M12 12v4"></path>
                <path d="M7 12v8"></path>
                <path d="M2 12v8"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-amber-400 mb-2">LightGBM Model</h3>
            <p className="text-white/70 mb-4">
              Our LightGBM model specializes in BTTS (Both Teams To Score) predictions with high accuracy
            </p>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50 w-full"
              onClick={handleExportCSV}
            >
              Export Predictions
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-amber-400 mb-2">Neural Networks</h3>
            <p className="text-white/70 mb-4">
              Our Neural Network models excel at predicting over/under goals with calibrated confidence scores
            </p>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50 w-full"
              onClick={handleRefresh}
            >
              Refresh Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictionsPage;





