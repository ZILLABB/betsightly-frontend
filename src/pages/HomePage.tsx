import React, { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { pageVariants, fadeVariants, cardVariants } from "../utils/animations";
import type {
  Prediction,
  RolloverGame,
  StatsOverview as StatsOverviewType,
} from "../types";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import DataLoadingIndicator from "../components/common/DataLoadingIndicator";
import { TrackedErrorBoundary } from "../components/common/ErrorBoundary";
import NoDataState from "../components/common/NoDataState";
// Import unified data service
import {
  getPredictionsForDay,
  getActiveRolloverGame,
  getStatsOverview,
  getPredictionsByOddsCategory
} from "../services/unifiedDataService";
import {
  getNextPredictionsForCategory,
  getDailyPredictions as getApiDailyPredictions,
  checkAPIHealth,
  getBestPredictionsByCategory,
  getAllBestPredictions
} from "../services/enhancedApiService";

// Lazy load heavy components
const PredictionCard = lazy(() => import("../components/predictions/PredictionCard"));
const RolloverTracker = lazy(() => import("../components/results/RolloverTracker"));
const StatsOverview = lazy(() => import("../components/results/StatsOverview"));

// Simple loading fallback for lazy components
const ComponentLoadingFallback = () => (
  <div className="animate-pulse bg-[#1A1A27]/50 rounded-lg h-24 w-full"></div>
);

// Interface for prediction combinations
interface PredictionCombination {
  id: string;
  predictions: Prediction[];
  totalOdds: number;
}

const HomePage: React.FC = () => {
  const [todayPredictions, setTodayPredictions] = useState<Prediction[]>([]);
  const [twoOddsCombinations, setTwoOddsCombinations] = useState<PredictionCombination[]>([]);
  const [fiveOddsCombinations, setFiveOddsCombinations] = useState<PredictionCombination[]>([]);
  const [tenOddsCombinations, setTenOddsCombinations] = useState<PredictionCombination[]>([]);
  const [activeRollover, setActiveRollover] = useState<RolloverGame | null>(null);
  const [stats, setStats] = useState<StatsOverviewType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('api');

  // Loading states for category refreshes
  const [refreshing2Odds, setRefreshing2Odds] = useState<boolean>(false);
  const [refreshing5Odds, setRefreshing5Odds] = useState<boolean>(false);
  const [refreshing10Odds, setRefreshing10Odds] = useState<boolean>(false);

  // Function to find combinations of predictions that add up to target odds
  const findCombinations = (
    predictions: Prediction[],
    targetOdds: number,
    tolerance: number = 0.5
  ): PredictionCombination[] => {
    const combinations: PredictionCombination[] = [];
    const maxPredictionsInCombo = targetOdds <= 3 ? 2 : (targetOdds <= 6 ? 3 : 4);

    // Helper function to find combinations recursively
    const findCombosRecursive = (
      remaining: Prediction[],
      current: Prediction[],
      startIndex: number,
      currentOdds: number
    ) => {
      // Check if we have a valid combination
      if (current.length > 0) {
        const totalOdds = current.reduce((total, p) => total * p.odds, 1);
        if (Math.abs(totalOdds - targetOdds) <= tolerance &&
            totalOdds >= targetOdds - tolerance) {
          combinations.push({
            id: `combo-${combinations.length}`,
            predictions: [...current],
            totalOdds
          });
        }
      }

      // Stop if we've reached the max number of predictions for this combo
      if (current.length >= maxPredictionsInCombo) {
        return;
      }

      // Try adding each remaining prediction
      for (let i = startIndex; i < remaining.length; i++) {
        const prediction = remaining[i];
        const newOdds = currentOdds * prediction.odds;

        // Skip if adding this prediction would exceed target by too much
        if (newOdds > targetOdds + tolerance) {
          continue;
        }

        current.push(prediction);
        findCombosRecursive(remaining, current, i + 1, newOdds);
        current.pop();
      }
    };

    // Sort predictions by odds (ascending) to optimize search
    const sortedPredictions = [...predictions].sort((a, b) => a.odds - b.odds);

    // Start the recursive search
    findCombosRecursive(sortedPredictions, [], 0, 1);

    // Sort combinations by how close they are to the target odds
    return combinations
      .sort((a, b) => Math.abs(a.totalOdds - targetOdds) - Math.abs(b.totalOdds - targetOdds))
      .slice(0, 5); // Limit to 5 combinations
  };

  // Function to refresh predictions for a specific odds category
  const refreshCategoryPredictions = async (category: '2_odds' | '5_odds' | '10_odds') => {
    try {
      // Set the appropriate loading state
      if (category === '2_odds') setRefreshing2Odds(true);
      else if (category === '5_odds') setRefreshing5Odds(true);
      else if (category === '10_odds') setRefreshing10Odds(true);

      // Get the best predictions for this category
      console.log(`Fetching best predictions for ${category}...`);
      const bestPredictions = await getBestPredictionsByCategory(category);

      // Log the raw data for debugging
      console.log(`Raw data for ${category}:`, bestPredictions);

      if (bestPredictions && bestPredictions.length > 0) {
        console.log(`Got ${bestPredictions.length} best predictions for ${category}`);

        // Create a combination from the best predictions
        const combo = {
          id: `${category}_combo_${Date.now()}`,
          predictions: bestPredictions,
          totalOdds: category === '2_odds' ? 2.0 : category === '5_odds' ? 5.0 : 10.0,
          confidence: category === '2_odds' ? 0.9 : category === '5_odds' ? 0.8 : 0.7
        };

        // Update the appropriate state based on the category
        if (category === '2_odds') {
          setTwoOddsCombinations([combo]);
        } else if (category === '5_odds') {
          setFiveOddsCombinations([combo]);
        } else if (category === '10_odds') {
          setTenOddsCombinations([combo]);
        }

        // Update the combined predictions list
        setTodayPredictions(prev => {
          // Remove old predictions for this category and add new ones
          const filteredPredictions = prev.filter(p => {
            // Keep predictions that don't match the category's odds range
            if (category === '2_odds') return p.odds > 2.5;
            if (category === '5_odds') return p.odds < 2.5 || p.odds > 7.5;
            if (category === '10_odds') return p.odds < 7.5;
            return true;
          });

          return [...filteredPredictions, ...bestPredictions];
        });
      } else {
        // Fallback to regular category predictions
        console.log(`No best predictions found for ${category}, falling back to regular predictions`);

        // Get the next set of predictions for this category directly from the API
        const response = await getNextPredictionsForCategory(category);
        console.log(`API response for ${category}:`, response);

        if (response && response.length > 0) {
          // Process the API response
          const combos = response.map((combo: any) => ({
            id: combo.id || Math.random().toString(),
            predictions: combo.predictions || [],
            totalOdds: combo.combined_odds || (category === '2_odds' ? 2.0 : category === '5_odds' ? 5.0 : 10.0),
            confidence: combo.combined_confidence || 0.7
          }));

          // Update the appropriate state based on the category
          if (category === '2_odds') {
            setTwoOddsCombinations(combos);
          } else if (category === '5_odds') {
            setFiveOddsCombinations(combos);
          } else if (category === '10_odds') {
            setTenOddsCombinations(combos);
          }

          // Update the combined predictions list
          const allPredictions = combos.flatMap(combo => combo.predictions);

          setTodayPredictions(prev => {
            // Remove old predictions for this category and add new ones
            const filteredPredictions = prev.filter(p => {
              // Keep predictions that don't match the category's odds range
              if (category === '2_odds') return p.odds > 2.5;
              if (category === '5_odds') return p.odds < 2.5 || p.odds > 7.5;
              if (category === '10_odds') return p.odds < 7.5;
              return true;
            });

            return [...filteredPredictions, ...allPredictions];
          });
        }
      }
    } catch (error) {
      console.error(`Error refreshing ${category} predictions:`, error);
    } finally {
      // Clear the loading state
      if (category === '2_odds') setRefreshing2Odds(false);
      else if (category === '5_odds') setRefreshing5Odds(false);
      else if (category === '10_odds') setRefreshing10Odds(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if the API is healthy
        try {
          const healthCheck = await checkAPIHealth();
          console.log('API health check:', healthCheck);

          if (healthCheck.status === 'ok') {
            // API is healthy, fetch predictions directly from the API
            try {
              // First try to get all best predictions
              console.log('Fetching best predictions for all categories...');
              const bestPredictions = await getAllBestPredictions();

              // Log raw data for debugging
              console.log('Raw best predictions data:', bestPredictions);

              if (bestPredictions && Object.keys(bestPredictions).length > 0) {
                console.log('Got best predictions with keys:', Object.keys(bestPredictions));

                // Set data source to API
                setDataSource('api');

                // Process the best predictions - log the keys to debug
                console.log('Best predictions keys:', Object.keys(bestPredictions));

                // Check both formats (with and without underscore)
                const twoPredictions = bestPredictions['2odds'] || bestPredictions['2_odds'] || [];
                const fivePredictions = bestPredictions['5odds'] || bestPredictions['5_odds'] || [];
                const tenPredictions = bestPredictions['10odds'] || bestPredictions['10_odds'] || [];
                const rolloverPredictions = bestPredictions['rollover'] || [];

                console.log('Prediction counts:', {
                  twoPredictions: twoPredictions.length,
                  fivePredictions: fivePredictions.length,
                  tenPredictions: tenPredictions.length,
                  rolloverPredictions: rolloverPredictions.length
                });

                // Remove duplicate predictions based on fixture_id
                const uniqueTwoPredictions = twoPredictions.reduce((unique: any[], prediction: any) => {
                  // Check if we already have a prediction with this fixture_id
                  const exists = unique.find(p => p.game?.id === prediction.game?.id);
                  if (!exists) {
                    // Include all games regardless of start time
                    unique.push(prediction);
                  }
                  return unique;
                }, []);

                console.log(`Filtered ${twoPredictions.length} predictions to ${uniqueTwoPredictions.length} unique upcoming games`);

                // Create combinations from the best predictions
                const twoCombos = uniqueTwoPredictions.length > 0 ? [{
                  id: `2odds_combo_${Date.now()}`,
                  predictions: uniqueTwoPredictions,
                  totalOdds: 2.0,
                  confidence: 0.9
                }] : [];

                // Remove duplicate predictions for 5 odds
                const uniqueFivePredictions = fivePredictions.reduce((unique: any[], prediction: any) => {
                  // Check if we already have a prediction with this fixture_id
                  const exists = unique.find(p => p.game?.id === prediction.game?.id);
                  if (!exists) {
                    // Include all games regardless of start time
                    unique.push(prediction);
                  }
                  return unique;
                }, []);

                console.log(`Filtered ${fivePredictions.length} predictions to ${uniqueFivePredictions.length} unique upcoming games for 5 odds`);

                const fiveCombos = uniqueFivePredictions.length > 0 ? [{
                  id: `5odds_combo_${Date.now()}`,
                  predictions: uniqueFivePredictions,
                  totalOdds: 5.0,
                  confidence: 0.8
                }] : [];

                // Remove duplicate predictions for 10 odds
                const uniqueTenPredictions = tenPredictions.reduce((unique: any[], prediction: any) => {
                  // Check if we already have a prediction with this fixture_id
                  const exists = unique.find(p => p.game?.id === prediction.game?.id);
                  if (!exists) {
                    // Include all games regardless of start time
                    unique.push(prediction);
                  }
                  return unique;
                }, []);

                console.log(`Filtered ${tenPredictions.length} predictions to ${uniqueTenPredictions.length} unique upcoming games for 10 odds`);

                const tenCombos = uniqueTenPredictions.length > 0 ? [{
                  id: `10odds_combo_${Date.now()}`,
                  predictions: uniqueTenPredictions,
                  totalOdds: 10.0,
                  confidence: 0.7
                }] : [];

                // Set the combinations
                setTwoOddsCombinations(twoCombos);
                setFiveOddsCombinations(fiveCombos);
                setTenOddsCombinations(tenCombos);

                // Extract all predictions
                const allPredictions = [
                  ...twoPredictions,
                  ...fivePredictions,
                  ...tenPredictions,
                  ...rolloverPredictions
                ];

                // Set today's predictions
                setTodayPredictions(allPredictions);

                console.log('Processed best predictions:', {
                  twoCombos,
                  fiveCombos,
                  tenCombos,
                  allPredictions
                });
              } else {
                // Fallback to regular predictions API
                console.log('No best predictions found, falling back to regular predictions API');

                // Fetch predictions from the API with categorized=true
                const apiResponse = await getApiDailyPredictions();
                console.log('API response:', apiResponse);

                // Set data source to API
                setDataSource('api');

                // Process the API response
                if (apiResponse && apiResponse.categorized) {
                  // Extract combinations from the API response
                  const twoCombos = (apiResponse.categorized['2_odds'] || []).map((combo: any) => ({
                    id: combo.id,
                    predictions: combo.predictions,
                    totalOdds: combo.combined_odds || 2.0,
                    confidence: combo.combined_confidence || 0.7
                  }));

                  const fiveCombos = (apiResponse.categorized['5_odds'] || []).map((combo: any) => ({
                    id: combo.id,
                    predictions: combo.predictions,
                    totalOdds: combo.combined_odds || 5.0,
                    confidence: combo.combined_confidence || 0.7
                  }));

                  const tenCombos = (apiResponse.categorized['10_odds'] || []).map((combo: any) => ({
                    id: combo.id,
                    predictions: combo.predictions,
                    totalOdds: combo.combined_odds || 10.0,
                    confidence: combo.combined_confidence || 0.7
                  }));

                  // Set the combinations
                  setTwoOddsCombinations(twoCombos);
                  setFiveOddsCombinations(fiveCombos);
                  setTenOddsCombinations(tenCombos);

                  // Extract all predictions
                  const allPredictions = [
                    ...(apiResponse.predictions || []),
                    ...(apiResponse.rollover || [])
                  ];

                  // Set today's predictions
                  setTodayPredictions(allPredictions);
                } else {
                  // Fallback to category-specific endpoints
                  console.log('No categorized predictions found, falling back to category-specific endpoints');

                  // Get best predictions for each category
                  const twoPredictions = await getBestPredictionsByCategory('2_odds');
                  const fivePredictions = await getBestPredictionsByCategory('5_odds');
                  const tenPredictions = await getBestPredictionsByCategory('10_odds');
                  // Try to get rollover predictions if available
                  let rolloverPredictions = [];

                  // Create combinations from the best predictions
                  const twoCombos = twoPredictions.length > 0 ? [{
                    id: `2odds_combo_${Date.now()}`,
                    predictions: twoPredictions,
                    totalOdds: 2.0,
                    confidence: 0.9
                  }] : [];

                  const fiveCombos = fivePredictions.length > 0 ? [{
                    id: `5odds_combo_${Date.now()}`,
                    predictions: fivePredictions,
                    totalOdds: 5.0,
                    confidence: 0.8
                  }] : [];

                  const tenCombos = tenPredictions.length > 0 ? [{
                    id: `10odds_combo_${Date.now()}`,
                    predictions: tenPredictions,
                    totalOdds: 10.0,
                    confidence: 0.7
                  }] : [];

                  // Set the combinations
                  setTwoOddsCombinations(twoCombos);
                  setFiveOddsCombinations(fiveCombos);
                  setTenOddsCombinations(tenCombos);

                  // Extract all predictions
                  const allPredictions = [
                    ...twoPredictions,
                    ...fivePredictions,
                    ...tenPredictions,
                    ...(rolloverPredictions || [])
                  ];

                  // Set today's predictions
                  setTodayPredictions(allPredictions);
                }
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
            // First try to get predictions by odds category
            const predictionsByCategory = await getPredictionsByOddsCategory();

            // Set data source to cache
            setDataSource('cache');

            // Extract and combine all predictions
            const allPredictions = [
              ...(predictionsByCategory["2odds"] || []),
              ...(predictionsByCategory["5odds"] || []),
              ...(predictionsByCategory["10odds"] || [])
            ];

            // Filter predictions with status "pending"
            const pendingPredictions = allPredictions.filter(p => p.status === "pending");
            setTodayPredictions(pendingPredictions);

            // Find combinations for different odds targets
            const twoCombos = findCombinations(pendingPredictions, 2, 0.3);
            const fiveCombos = findCombinations(pendingPredictions, 5, 0.8);
            const tenCombos = findCombinations(pendingPredictions, 10, 1.5);

            setTwoOddsCombinations(twoCombos);
            setFiveOddsCombinations(fiveCombos);
            setTenOddsCombinations(tenCombos);
          } catch (categoryError) {
            console.error("Error fetching predictions by category:", categoryError);

            // Fall back to getting all predictions for today
            try {
              const today = new Date();
              const predictions = await getPredictionsForDay(today);

              // Set data source to cache
              setDataSource('cache');

              // Filter predictions with status "pending"
              const pendingPredictions = predictions.filter(p => p.status === "pending");
              setTodayPredictions(pendingPredictions);

              // Find combinations for different odds targets
              const twoCombos = findCombinations(pendingPredictions, 2, 0.3);
              const fiveCombos = findCombinations(pendingPredictions, 5, 0.8);
              const tenCombos = findCombinations(pendingPredictions, 10, 1.5);

              setTwoOddsCombinations(twoCombos);
              setFiveOddsCombinations(fiveCombos);
              setTenOddsCombinations(tenCombos);
            } catch (predictionError) {
              console.error("Error fetching predictions:", predictionError);
              setError("Failed to load predictions. Please try again later.");
            }
          }
        }

        // Fetch active rollover game
        try {
          const rollover = await getActiveRolloverGame();
          if (rollover) {
            setActiveRollover(rollover);
          }
        } catch (rolloverError) {
          console.error("Error fetching rollover game:", rolloverError);
          // Non-critical error, don't set global error state
        }

        // Fetch stats overview
        try {
          const statsData = await getStatsOverview();
          setStats(statsData);
        } catch (statsError) {
          console.error("Error fetching stats:", statsError);
          // Non-critical error, don't set global error state
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <motion.div
      className="space-y-10"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Hero Section - More Compact */}
      <section className="relative py-12 md:py-16 -mx-4 px-4 overflow-hidden hero-section">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A27] to-[#121219] opacity-80 -z-10 dark:opacity-80 light:opacity-0"></div>
        <div className="absolute inset-0 bg-[url('/src/assets/pattern-grid.png')] bg-repeat opacity-5 -z-10 hero-pattern"></div>
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-[#F5A623]/5 rounded-full blur-[100px] -z-5 hero-glow"></div>
        <div className="premium-glow max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight leading-tight">
            Premium <span className="premium-text">Sports Predictions</span>
          </h1>
          <p className="text-lg md:text-xl text-[#A1A1AA] mb-6 max-w-2xl mx-auto">
            Expert predictions organized by odds categories for better betting strategy
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="premium" size="lg" asChild className="px-6 py-3 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <Link to="/predictions">View All Predictions</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="px-6 py-3 text-base font-semibold rounded-lg border-[#F5A623]/30 hover:bg-[#F5A623]/10 transition-all duration-300">
              <Link to="/rollover">Rollover Challenge</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Today's Odds Categories - Main Section */}
      <section className="relative">
        <div className="absolute top-10 right-0 w-64 h-64 bg-[#F5A623]/5 rounded-full filter blur-3xl -z-10"></div>
        <div className="absolute bottom-10 left-0 w-64 h-64 bg-[#F5A623]/5 rounded-full filter blur-3xl -z-10"></div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
              Today's <span className="premium-text">Predictions</span>
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Browse predictions by odds category for better betting strategy
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="mt-3 md:mt-0 border-[#F5A623]/30 hover:bg-[#F5A623]/10">
            <Link to="/predictions">View All Predictions</Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623] mb-4"></div>
            <p className="text-[#A1A1AA]">Loading today's predictions...</p>
          </div>
        ) : error ? (
          <NoDataState
            title="Unable to Load Predictions"
            message={error}
            showRefresh={true}
            showSettings={true}
            isLoading={loading}
            onRefresh={() => window.location.reload()}
          />
        ) : (
          <div className="space-y-8">
            {/* 2 Odds Section */}
            <div className="bg-[#1A1A27]/80 p-4 rounded-xl border border-[#2A2A3C]/20 shadow-lg light-card-effect">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="bg-[#10B981]/10 text-[#10B981] p-1.5 rounded-lg mr-2 flex items-center justify-center">
                    <span className="text-base">2️⃣</span>
                  </div>
                  <h3 className="text-lg font-bold">2 Odds <span className="text-xs text-[var(--muted-foreground)]">Combinations</span></h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs px-1.5 py-0.5">Safe Bets</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => refreshCategoryPredictions('2_odds')}
                    disabled={refreshing2Odds}
                  >
                    {refreshing2Odds ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#10B981]"></div>
                    ) : (
                      <span className="text-sm">↻</span>
                    )}
                  </Button>
                </div>
              </div>

              {twoOddsCombinations.length > 0 ? (
                <div className="space-y-4">
                  {twoOddsCombinations.slice(0, 3).map((combo) => (
                    <div key={combo.id} className="bg-[#1A1A27]/50 p-3 rounded-xl border border-[#10B981]/20">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-[#10B981] text-sm">
                          {combo.predictions.length} Game Combo
                        </h4>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          Total Odds: {combo.totalOdds.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {combo.predictions.map((prediction, index) => (
                          <motion.div
                            key={prediction.id}
                            custom={index}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            variants={cardVariants}
                          >
                            <TrackedErrorBoundary>
                              <Suspense fallback={<ComponentLoadingFallback />}>
                                <PredictionCard
                                  prediction={prediction}
                                  isPremium={false}
                                />
                              </Suspense>
                            </TrackedErrorBoundary>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#A1A1AA]">No 2 odds combinations available today.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refreshCategoryPredictions('2_odds')}
                    disabled={refreshing2Odds}
                  >
                    {refreshing2Odds ? "Refreshing..." : "Try Different Fixtures"}
                  </Button>
                </div>
              )}
            </div>

            {/* 5 Odds Section */}
            <div className="bg-[#1A1A27]/80 p-4 rounded-xl border border-[#2A2A3C]/20 shadow-lg light-card-effect">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="bg-[#F5A623]/10 text-[#F5A623] p-1.5 rounded-lg mr-2 flex items-center justify-center">
                    <span className="text-base">5️⃣</span>
                  </div>
                  <h3 className="text-lg font-bold">5 Odds <span className="text-xs text-[var(--muted-foreground)]">Combinations</span></h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="text-xs px-1.5 py-0.5">Balanced Risk</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => refreshCategoryPredictions('5_odds')}
                    disabled={refreshing5Odds}
                  >
                    {refreshing5Odds ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#F5A623]"></div>
                    ) : (
                      <span className="text-sm">↻</span>
                    )}
                  </Button>
                </div>
              </div>

              {fiveOddsCombinations.length > 0 ? (
                <div className="space-y-4">
                  {fiveOddsCombinations.slice(0, 2).map((combo) => (
                    <div key={combo.id} className="bg-[#1A1A27]/50 p-3 rounded-xl border border-[#F5A623]/20">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-[#F5A623] text-sm">
                          {combo.predictions.length} Game Combo
                        </h4>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          Total Odds: {combo.totalOdds.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {combo.predictions.map((prediction, index) => (
                          <motion.div
                            key={prediction.id}
                            custom={index}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            variants={cardVariants}
                          >
                            <TrackedErrorBoundary>
                              <Suspense fallback={<ComponentLoadingFallback />}>
                                <PredictionCard
                                  prediction={prediction}
                                  isPremium={prediction.odds > 3.5}
                                />
                              </Suspense>
                            </TrackedErrorBoundary>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#A1A1AA]">No 5 odds combinations available today.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refreshCategoryPredictions('5_odds')}
                    disabled={refreshing5Odds}
                  >
                    {refreshing5Odds ? "Refreshing..." : "Try Different Fixtures"}
                  </Button>
                </div>
              )}
            </div>

            {/* 10 Odds Section */}
            <div className="bg-[#1A1A27]/80 p-4 rounded-xl border border-[#2A2A3C]/20 shadow-lg light-card-effect">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="bg-[#EF4444]/10 text-[#EF4444] p-1.5 rounded-lg mr-2 flex items-center justify-center">
                    <span className="text-base">🔟</span>
                  </div>
                  <h3 className="text-lg font-bold">10 Odds <span className="text-xs text-[var(--muted-foreground)]">Combinations</span></h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="danger" className="text-xs px-1.5 py-0.5">High Reward</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => refreshCategoryPredictions('10_odds')}
                    disabled={refreshing10Odds}
                  >
                    {refreshing10Odds ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#EF4444]"></div>
                    ) : (
                      <span className="text-sm">↻</span>
                    )}
                  </Button>
                </div>
              </div>

              {tenOddsCombinations.length > 0 ? (
                <div className="space-y-4">
                  {tenOddsCombinations.slice(0, 1).map((combo) => (
                    <div key={combo.id} className="bg-[#1A1A27]/50 p-3 rounded-xl border border-[#EF4444]/20">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-[#EF4444] text-sm">
                          {combo.predictions.length} Game Combo
                        </h4>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          Total Odds: {combo.totalOdds.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {combo.predictions.map((prediction, index) => (
                          <motion.div
                            key={prediction.id}
                            custom={index}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            variants={cardVariants}
                          >
                            <TrackedErrorBoundary>
                              <Suspense fallback={<ComponentLoadingFallback />}>
                                <PredictionCard
                                  prediction={prediction}
                                  isPremium={true}
                                />
                              </Suspense>
                            </TrackedErrorBoundary>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#A1A1AA]">No 10 odds combinations available today.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refreshCategoryPredictions('10_odds')}
                    disabled={refreshing10Odds}
                  >
                    {refreshing10Odds ? "Refreshing..." : "Try Different Fixtures"}
                  </Button>
                </div>
              )}
            </div>

            {/* Rollover Section */}
            <div className="bg-[#1A1A27]/80 p-4 rounded-xl border border-[#2A2A3C]/20 shadow-lg light-card-effect">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="bg-[#56CCF2]/10 text-[#56CCF2] p-1.5 rounded-lg mr-2 flex items-center justify-center">
                    <span className="text-base">🔄</span>
                  </div>
                  <h3 className="text-lg font-bold">Rollover <span className="text-xs text-[var(--muted-foreground)]">Challenge</span></h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" className="text-xs px-1.5 py-0.5">Daily Picks</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => refreshCategoryPredictions('rollover')}
                    disabled={refreshing10Odds} // Reuse the same loading state for simplicity
                  >
                    {refreshing10Odds ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#56CCF2]"></div>
                    ) : (
                      <span className="text-sm">↻</span>
                    )}
                  </Button>
                </div>
              </div>

              {activeRollover ? (
                <div className="space-y-4">
                  <div className="bg-[#1A1A27]/50 p-3 rounded-xl border border-[#56CCF2]/20">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-[#56CCF2] text-sm">
                        Day {activeRollover.currentDay || 1} of 10
                      </h4>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        Target Odds: 3.0
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#2A2A3C] rounded-full mb-3">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-[#56CCF2] to-[#2E8BC0]"
                        style={{ width: `${((activeRollover.currentDay || 1) - 1) * 10}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeRollover.predictions?.slice(0, 3).map((prediction, index) => (
                        <motion.div
                          key={prediction.id}
                          custom={index}
                          initial="initial"
                          animate="animate"
                          whileHover="hover"
                          variants={cardVariants}
                        >
                          <TrackedErrorBoundary>
                            <Suspense fallback={<ComponentLoadingFallback />}>
                              <PredictionCard
                                prediction={prediction}
                                isPremium={true}
                                variant="rollover"
                              />
                            </Suspense>
                          </TrackedErrorBoundary>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#2A2A3C]/20 flex justify-between items-center">
                      <div className="text-xs text-[#A1A1AA]">
                        <span className="font-medium">Initial: $100</span>
                      </div>
                      <div className="text-xs text-[#56CCF2]">
                        <span className="font-medium">Current: ${activeRollover.currentAmount?.toFixed(2) || "100.00"}</span>
                      </div>
                      <div className="text-xs text-[#56CCF2]">
                        <span className="font-medium">Projected: ${activeRollover.projectedAmount?.toFixed(2) || "3000.00"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#A1A1AA]">No active rollover challenge available.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    asChild
                  >
                    <Link to="/rollover">View Rollover Page</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
      {/* Stats and Rollover */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Source Indicator */}
        <div className="lg:col-span-2 flex justify-end mb-2">
          <Badge
            variant={dataSource === 'api' ? 'success' : dataSource === 'cache' ? 'warning' : 'danger'}
            className="text-xs"
          >
            Data Source: {dataSource === 'api' ? 'Live API' : dataSource === 'cache' ? 'Cached Data' : 'Mock Data'}
          </Badge>
        </div>

        {stats && (
          <div className="relative bg-[#1A1A27]/80 p-6 rounded-xl border border-[#2A2A3C]/20 shadow-lg overflow-hidden light-card-effect">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10B981] to-[#10B981]/30"></div>
            <div className="absolute top-0 left-0 w-48 h-48 bg-[#10B981]/5 rounded-full filter blur-3xl -z-10"></div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 tracking-tight flex items-center">
              <span className="bg-[#10B981]/10 text-[#10B981] p-2 rounded-lg mr-3">📊</span>
              Performance <span className="text-[#10B981] ml-2">Stats</span>
            </h2>
            <TrackedErrorBoundary>
              <Suspense fallback={<ComponentLoadingFallback />}>
                <StatsOverview stats={stats} />
              </Suspense>
            </TrackedErrorBoundary>
          </div>
        )}

        {activeRollover && (
          <div className="relative bg-[#1A1A27]/80 p-6 rounded-xl border border-[#F5A623]/20 shadow-lg overflow-hidden light-card-effect">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F5A623] to-[#F5A623]/30"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#F5A623]/5 rounded-full filter blur-3xl -z-10"></div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 tracking-tight flex items-center">
              <span className="bg-[#F5A623]/10 text-[#F5A623] p-2 rounded-lg mr-3">🔄</span>
              <span className="premium-text">10-Day</span> Rollover Challenge
            </h2>
            <TrackedErrorBoundary>
              <Suspense fallback={<ComponentLoadingFallback />}>
                <RolloverTracker rolloverGame={activeRollover} />
              </Suspense>
            </TrackedErrorBoundary>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="relative py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A27] to-[#121219] opacity-30 -z-10 rounded-3xl dark:opacity-30 light:opacity-0"></div>
        <div className="absolute inset-0 bg-[url('/src/assets/pattern-grid.png')] bg-repeat opacity-5 -z-10 rounded-3xl hero-pattern"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(240,245,255,0.6)] to-[rgba(248,250,255,0.2)] opacity-0 -z-10 rounded-3xl light:opacity-100 dark:opacity-0"></div>

        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 tracking-tight">
          Why Choose <span className="premium-text">BetSightly</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group relative bg-[#1A1A27]/80 rounded-xl p-4 border border-[#F5A623]/20 shadow-md hover:shadow-lg transition-all duration-300 light-card-effect">
            <div className="w-12 h-12 bg-[#F5A623]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#F5A623]/20 transition-colors duration-300">
              <span className="text-xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center group-hover:premium-text transition-colors duration-300">Expert Predictions</h3>
            <p className="text-[var(--muted-foreground)] text-center text-sm">
              Expert analysis for various sports
            </p>
          </div>

          <div className="group relative bg-[#1A1A27]/80 rounded-xl p-4 border border-[#F5A623]/20 shadow-md hover:shadow-lg transition-all duration-300 light-card-effect">
            <div className="w-12 h-12 bg-[#F5A623]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#F5A623]/20 transition-colors duration-300">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center group-hover:premium-text transition-colors duration-300">Performance Stats</h3>
            <p className="text-[var(--muted-foreground)] text-center text-sm">
              Track prediction performance
            </p>
          </div>

          <div className="group relative bg-[#1A1A27]/80 rounded-xl p-4 border border-[#F5A623]/20 shadow-md hover:shadow-lg transition-all duration-300 light-card-effect">
            <div className="w-12 h-12 bg-[#F5A623]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#F5A623]/20 transition-colors duration-300">
              <span className="text-xl">🔄</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center group-hover:premium-text transition-colors duration-300">10-Day Rollover</h3>
            <p className="text-[var(--muted-foreground)] text-center text-sm">
              Follow our rollover challenge
            </p>
          </div>

          <div className="group relative bg-[#1A1A27]/80 rounded-xl p-4 border border-[#F5A623]/20 shadow-md hover:shadow-lg transition-all duration-300 light-card-effect">
            <div className="w-12 h-12 bg-[#F5A623]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#F5A623]/20 transition-colors duration-300">
              <span className="text-xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center group-hover:premium-text transition-colors duration-300">Odds Categories</h3>
            <p className="text-[var(--muted-foreground)] text-center text-sm">
              2, 5, and 10 odds predictions
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button variant="premium" size="lg" asChild className="px-6 py-3 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <Link to="/predictions">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;





