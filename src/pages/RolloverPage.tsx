import React, { useEffect, useState } from "react";
import type { RolloverGame, Prediction } from "../types";
import RolloverTracker from "../components/results/RolloverTracker";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { format } from "date-fns";
// Import enhanced API service
import {
  getAllBestPredictions,
  getBestPredictionsByCategory,
  checkAPIHealth
} from "../services/enhancedApiService";
// Import data service as fallback
import { getRolloverGames } from "../services/dataService";
import { formatLocalDateTime } from "../utils/formatters";

// Format date in user's local timezone
const formatDate = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const RolloverPage: React.FC = () => {
  const [rolloverGames, setRolloverGames] = useState<RolloverGame[]>([]);
  const [selectedRollover, setSelectedRollover] = useState<RolloverGame | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('cache');
  const [rolloverPredictions, setRolloverPredictions] = useState<Prediction[]>([]);

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
            // API is healthy, fetch rollover predictions directly from the API
            try {
              // First try to get all best predictions
              console.log('Fetching best predictions for rollover...');
              const bestPredictions = await getAllBestPredictions();

              if (bestPredictions && bestPredictions.rollover && bestPredictions.rollover.length > 0) {
                console.log('Got rollover predictions:', bestPredictions.rollover);

                // Filter out duplicate predictions but keep all games regardless of start time
                const uniqueFixtureIds = new Map();

                const filteredPredictions = bestPredictions.rollover.filter(prediction => {
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

                console.log(`Filtered ${bestPredictions.rollover.length} predictions to ${filteredPredictions.length} unique upcoming games`);

                setRolloverPredictions(filteredPredictions);
                setDataSource('api');

                // Create a synthetic rollover game from the predictions
                const today = new Date();
                const endDate = new Date();
                endDate.setDate(today.getDate() + 9); // 10 days including today

                const syntheticGame: RolloverGame = {
                  id: 'current-rollover',
                  title: '10-Day Rollover Challenge',
                  startDate: today,
                  endDate: endDate,
                  isActive: true,
                  startingAmount: 100,
                  currentAmount: 100,
                  targetAmount: 100 * Math.pow(3, 10), // 3x for 10 days
                  days: Array.from({ length: 10 }, (_, i) => ({
                    day: i + 1,
                    date: new Date(today.getTime() + i * 24 * 60 * 60 * 1000),
                    predictions: i === 0 ? bestPredictions.rollover : [],
                    odds: 3.0,
                    status: i === 0 ? 'pending' : 'upcoming',
                    amount: 100 * Math.pow(3, i)
                  }))
                };

                setRolloverGames([syntheticGame]);
                setSelectedRollover(syntheticGame);
              } else {
                // Fall back to specific category endpoint
                console.log('No rollover predictions found in best predictions, trying category endpoint');
                const rolloverData = await getBestPredictionsByCategory('rollover');

                if (rolloverData && rolloverData.length > 0) {
                  console.log('Got rollover predictions from category endpoint:', rolloverData);

                  // Filter out duplicate predictions but keep all games regardless of start time
                  const uniqueFixtureIds = new Map();

                  const filteredPredictions = rolloverData.filter(prediction => {
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

                  console.log(`Filtered ${rolloverData.length} predictions to ${filteredPredictions.length} unique upcoming games`);

                  setRolloverPredictions(filteredPredictions);
                  setDataSource('api');

                  // Create a synthetic rollover game from the predictions
                  const today = new Date();
                  const endDate = new Date();
                  endDate.setDate(today.getDate() + 9); // 10 days including today

                  const syntheticGame: RolloverGame = {
                    id: 'current-rollover',
                    title: '10-Day Rollover Challenge',
                    startDate: today,
                    endDate: endDate,
                    isActive: true,
                    startingAmount: 100,
                    currentAmount: 100,
                    targetAmount: 100 * Math.pow(3, 10), // 3x for 10 days
                    days: Array.from({ length: 10 }, (_, i) => ({
                      day: i + 1,
                      date: new Date(today.getTime() + i * 24 * 60 * 60 * 1000),
                      predictions: i === 0 ? rolloverData : [],
                      odds: 3.0,
                      status: i === 0 ? 'pending' : 'upcoming',
                      amount: 100 * Math.pow(3, i)
                    }))
                  };

                  setRolloverGames([syntheticGame]);
                  setSelectedRollover(syntheticGame);
                } else {
                  throw new Error('No rollover predictions found');
                }
              }
            } catch (apiError) {
              console.error("Error fetching rollover predictions from API:", apiError);
              throw apiError; // Rethrow to trigger fallback
            }
          } else {
            throw new Error('API health check failed');
          }
        } catch (healthError) {
          console.error("API health check failed:", healthError);

          // Fall back to data service
          try {
            console.log('Falling back to data service for rollover games');
            const games = await getRolloverGames();
            setRolloverGames(games);
            setDataSource('cache');

            // Set the active rollover as selected by default
            const activeRollover = games.find(game => game.isActive);
            if (activeRollover) {
              setSelectedRollover(activeRollover);
            } else if (games.length > 0) {
              setSelectedRollover(games[0]);
            }
          } catch (fallbackError) {
            console.error("Error fetching rollover games from data service:", fallbackError);
            setError("Failed to load rollover games. Please try again later.");
          }
        }
      } catch (error) {
        console.error("Unexpected error in fetchData:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">10-Day Rollover Challenge</h1>
        <p className="text-sm text-[#A1A1AA]">
          Follow our 10-day rollover challenges where we track a series of premium predictions
          over a 10-day period. See how our expert picks perform over time!
        </p>
      </div>

      {/* Rollover Selector */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        <CardHeader className="p-3">
          <CardTitle className="text-base">Select Rollover Challenge</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex flex-wrap gap-2">
            {rolloverGames.map((game) => (
              <Button
                key={game.id}
                variant={
                  selectedRollover?.id === game.id ? "premium" : "outline"
                }
                size="sm"
                onClick={() => setSelectedRollover(game)}
                className="text-xs px-2 py-1"
              >
                {formatDate(game.startDate.toString())} - {formatDate(game.endDate.toString())}
                {game.isActive && " (Active)"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Source Indicator */}
      <div className="flex justify-end mb-2">
        <Badge
          variant={dataSource === 'api' ? 'success' : 'warning'}
          className="text-xs"
        >
          Data Source: {dataSource === 'api' ? 'Live API' : 'Cached Data'}
        </Badge>
      </div>

      {/* Selected Rollover */}
      {loading ? (
        <div className="text-center py-6 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#F5A623] mb-2"></div>
          <p className="text-[#A1A1AA]">Loading rollover challenges...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6 bg-[#1A1A27]/50 rounded-xl border border-red-500/20">
          <p className="text-lg font-semibold mb-1 text-red-500">Error Loading Rollover Challenges</p>
          <p className="text-sm text-[#A1A1AA]">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : selectedRollover ? (
        <RolloverTracker rolloverGame={selectedRollover} />
      ) : (
        <div className="text-center py-6 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
          <p className="text-lg font-semibold mb-1">No Rollover Challenges Available</p>
          <p className="text-sm text-[#A1A1AA]">
            There are no rollover challenges available at the moment.
            Please check back later.
          </p>
        </div>
      )}

      {/* How It Works */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        <CardHeader className="p-3">
          <CardTitle className="text-base">How the 10-Day Rollover Challenge Works</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <p className="text-sm">
            Our 10-day rollover challenge is a premium feature that showcases the
            potential of our predictions over a 10-day period. Here's how it works:
          </p>

          <ol className="list-decimal pl-4 space-y-1 text-sm">
            <li>
              <strong>Starting Amount:</strong> We start with a base amount (e.g., $100).
            </li>
            <li>
              <strong>Daily Combos:</strong> Each day, we combine 2-3 games to reach approximately 3.0 total odds.
            </li>
            <li>
              <strong>Rolling Over:</strong> We roll over the winnings from each day's combo to the next.
            </li>
            <li>
              <strong>10-Day Period:</strong> The challenge runs for 10 days, after which we calculate the final return.
            </li>
            <li>
              <strong>Performance Tracking:</strong> We track the success rate throughout the challenge.
            </li>
          </ol>

          <div className="bg-[#F5A623]/5 p-3 rounded-lg border border-[#F5A623]/20">
            <h4 className="text-sm font-semibold mb-1">Example Calculation</h4>
            <p className="text-xs text-[#A1A1AA]">
              Starting with $100, if Day 1's combo has 3.0 total odds and wins,
              we now have $300. Day 2's combo also has around 3.0 odds, and if it wins,
              we now have $900. This balanced approach continues for the 10-day period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolloverPage;


