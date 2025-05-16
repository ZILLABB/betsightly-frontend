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
      <div>
        <h1 className="text-3xl font-bold mb-2">Predictions</h1>
        <p className="text-muted-foreground">
          Browse our expert predictions for various sports. Filter by date, sport, and status.
        </p>
      </div>

      {/* Date Selector and Export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="mr-2">
                <DatePicker
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  minDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)} // 30 days ago
                  maxDate={new Date()} // Today
                />
              </div>
              <div className="h-6 border-r border-[#2A2A3C] mx-2"></div>
              <div className="flex flex-wrap gap-2">
                {dates.map((date) => (
                  <Button
                    key={date.toISOString()}
                    variant={
                      formatDate(date) === formatDate(selectedDate)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatDate(date)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="relative ml-auto mt-2 md:mt-0 export-dropdown-container">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="text-xs px-3 py-1"
              >
                <Download size={14} className="mr-1" />
                Export
              </Button>

              {showExportOptions && (
                <div className="absolute right-0 mt-1 w-40 bg-[#1A1A27] border border-[#2A2A3C] rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-[#2A2A3C]"
                      onClick={handleExportCSV}
                    >
                      Export as CSV
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-[#2A2A3C]"
                      onClick={handleExportPDF}
                    >
                      Export as PDF
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-[#2A2A3C]"
                      onClick={handleShare}
                    >
                      Share Predictions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Status Bar */}
      <OfflineStatusBar
        lastUpdated={lastUpdated}
        isStale={isStale}
        onRefresh={handleRefresh}
        isRefreshing={loading}
      />

      {/* Data Source Indicator */}
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Data"}
        </Button>
        <Badge
          variant={dataSource === 'api' ? 'success' : 'warning'}
          className="text-xs"
        >
          Data Source: {dataSource === 'api' ? 'Live API' : 'Cached Data'}
        </Badge>
      </div>

      {/* Predictions List */}
      {loading ? (
        <div className="text-center py-12 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
          <DataLoadingIndicator
            isLoading={true}
            loadingMessage="Loading predictions..."
            size="lg"
          />
        </div>
      ) : fetchError ? (
        <div className="text-center py-12 bg-[#1A1A27]/50 rounded-xl border border-red-500/20">
          <DataLoadingIndicator
            isLoading={false}
            error={fetchError.message || "Failed to load predictions. Please try again later."}
            size="lg"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleRefresh}
          >
            <RefreshCw size={14} className="mr-1" />
            Retry
          </Button>
        </div>
      ) : (
        <TrackedErrorBoundary>
          <PredictionsList
            predictions={selectedPredictions}
            title={`Predictions for ${formatDate(selectedDate)}`}
            showFilters={true}
          />
        </TrackedErrorBoundary>
      )}

      {/* No Predictions Message */}
      {!loading && !fetchError && selectedPredictions.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-[#1A1A27]/50">
          <p className="text-xl font-semibold mb-2">No Predictions Available</p>
          <p className="text-muted-foreground">
            There are no predictions available for {formatDate(selectedDate)}.
            Please select another date or check back later.
          </p>
        </div>
      )}

      {/* Premium Banner */}
      <div className="premium-card p-8 text-center">
        <h2 className="text-2xl font-bold premium-text mb-4">
          Get Premium Predictions
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Unlock access to our premium predictions with higher accuracy and
          detailed analysis. Follow our expert picks and improve your success rate.
        </p>
        <Button variant="premium" size="lg">
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
};

export default PredictionsPage;





