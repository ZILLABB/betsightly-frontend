import React, { useState, useEffect, useMemo } from "react";
import type { RolloverGame, Prediction } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { formatDate } from "../../lib/utils";
import CompactPredictionCard from "../predictions/CompactPredictionCard";
import { getRolloverGames } from "../../services/dataService";
import { Button } from "../common/Button";
import { Calendar, TrendingUp, DollarSign, ArrowRight, Clock } from "lucide-react";
import CurrencyDisplay from "../common/CurrencyDisplay";

interface RolloverTrackerProps {
  rolloverGame: RolloverGame;
  isCompact?: boolean; // Add compact mode for homepage display
}

// Interface for daily rollover combinations
interface DailyRolloverCombo {
  date: Date;
  predictions: Prediction[];
  totalOdds: number;
  isToday: boolean;
  day: number; // Day number in the rollover sequence (1-10)
  status: "won" | "lost" | "pending"; // Status of the combo
}

// Interface for rollover progress tracking
interface RolloverProgress {
  currentDay: number; // Current day in the rollover sequence (1-10)
  daysWon: number; // Number of days won
  daysLost: number; // Number of days lost
  daysPending: number; // Number of days pending
  initialAmount: number; // Initial amount (e.g., $100)
  currentAmount: number; // Current amount after applying odds
  projectedAmount: number; // Projected amount if all pending days win
}

const TARGET_ODDS = 3.0; // Target odds for each day's rollover
const ODDS_TOLERANCE = 0.5; // Tolerance for odds matching
const INITIAL_AMOUNT = 100; // Initial amount for rollover ($100)

const RolloverTracker: React.FC<RolloverTrackerProps> = ({
  rolloverGame
}) => {
  const [previousRolloverGames, setPreviousRolloverGames] = useState<RolloverGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);

  // Safely destructure with null checks
  const { predictions = [], startDate, endDate, successRate = 0, isActive = false } = rolloverGame || {};

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group predictions by date and find combinations that add up to target odds
  const dailyRolloverCombos = useMemo(() => {
    // First, group predictions by date
    const predictionsByDate = new Map<string, Prediction[]>();

    predictions.forEach(prediction => {
      const gameDate = new Date(prediction.game.startTime);
      gameDate.setHours(0, 0, 0, 0);
      const dateKey = gameDate.toISOString().split('T')[0];

      if (!predictionsByDate.has(dateKey)) {
        predictionsByDate.set(dateKey, []);
      }

      predictionsByDate.get(dateKey)?.push(prediction);
    });

    // For each date, find combinations that add up to target odds
    const combos: DailyRolloverCombo[] = [];

    // Get all dates in the rollover period
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const dateRange: Date[] = [];

    // Create array of all dates in the rollover period
    const currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process each date in the rollover period
    dateRange.forEach((date, index) => {
      const dateKey = date.toISOString().split('T')[0];
      const isToday = date.getTime() === today.getTime();
      const datePredictions = predictionsByDate.get(dateKey) || [];

      // Find the best combination for this date
      const bestCombo = findBestCombination(datePredictions, TARGET_ODDS, ODDS_TOLERANCE);

      // Determine combo status
      let status: "won" | "lost" | "pending" = "pending";
      if (bestCombo.predictions.length > 0) {
        // If all predictions in the combo are won, the combo is won
        const allWon = bestCombo.predictions.every(p => p.status === "won");
        // If any prediction in the combo is lost, the combo is lost
        const anyLost = bestCombo.predictions.some(p => p.status === "lost");

        if (allWon) status = "won";
        else if (anyLost) status = "lost";
        else status = "pending";
      }

      // Add combo to the list (even if empty for dates with no predictions)
      combos.push({
        date,
        predictions: bestCombo.predictions,
        totalOdds: bestCombo.totalOdds,
        isToday,
        day: index + 1, // Day number in sequence (1-10)
        status
      });
    });

    // Sort by day number (ascending)
    return combos.sort((a, b) => a.day - b.day);
  }, [predictions, today, startDate, endDate]);

  // Get today's combo
  const todayCombo = dailyRolloverCombos.find(combo => combo.isToday);

  // Get previous combos (days before today)
  const previousCombos = dailyRolloverCombos.filter(combo => {
    const comboDate = new Date(combo.date);
    return comboDate < today;
  });

  // Calculate rollover progress
  const calculateRolloverProgress = (): RolloverProgress => {
    const daysWon = dailyRolloverCombos.filter(combo => combo.status === "won").length;
    const daysLost = dailyRolloverCombos.filter(combo => combo.status === "lost").length;
    const daysPending = dailyRolloverCombos.filter(combo => combo.status === "pending").length;

    // Find the current day (first pending day)
    const currentDayCombo = dailyRolloverCombos.find(combo => combo.status === "pending");
    const currentDay = currentDayCombo?.day || daysWon + daysLost + 1;

    // Calculate current amount
    let currentAmount = INITIAL_AMOUNT;
    for (const combo of dailyRolloverCombos) {
      if (combo.status === "won") {
        currentAmount *= combo.totalOdds;
      } else if (combo.status === "lost") {
        // If a day is lost, we reset to the initial amount for the next day
        currentAmount = INITIAL_AMOUNT;
      } else {
        // Stop at the first pending day
        break;
      }
    }

    // Calculate projected amount (if all pending days win)
    let projectedAmount = currentAmount;
    for (const combo of dailyRolloverCombos) {
      if (combo.status === "pending" && combo.totalOdds > 0) {
        projectedAmount *= combo.totalOdds;
      }
    }

    return {
      currentDay,
      daysWon,
      daysLost,
      daysPending,
      initialAmount: INITIAL_AMOUNT,
      currentAmount,
      projectedAmount
    };
  };

  // Get rollover progress
  const rolloverProgress = calculateRolloverProgress();

  // Helper function to find the best combination of predictions that add up to target odds
  function findBestCombination(predictions: Prediction[], targetOdds: number, tolerance: number) {
    // If there's only one prediction, return it
    if (predictions.length === 1) {
      return {
        predictions,
        totalOdds: predictions[0].odds
      };
    }

    // Try all combinations of predictions
    let bestCombo: { predictions: Prediction[], totalOdds: number } = {
      predictions: [],
      totalOdds: 0
    };
    let bestDiff = Number.MAX_VALUE;

    // Helper function to find combinations recursively
    const findCombos = (
      remaining: Prediction[],
      current: Prediction[],
      startIndex: number,
      currentOdds: number
    ) => {
      // Check if we have a valid combination
      if (current.length > 0) {
        const diff = Math.abs(currentOdds - targetOdds);
        if (diff < bestDiff && currentOdds >= targetOdds - tolerance) {
          bestDiff = diff;
          bestCombo = {
            predictions: [...current],
            totalOdds: currentOdds
          };
        }
      }

      // Stop if we've reached 3 predictions
      if (current.length >= 3) {
        return;
      }

      // Try adding each remaining prediction
      for (let i = startIndex; i < remaining.length; i++) {
        const prediction = remaining[i];
        const newOdds = currentOdds * prediction.odds;

        // Skip if adding this prediction would exceed target by too much
        if (newOdds > targetOdds + tolerance * 2) {
          continue;
        }

        current.push(prediction);
        findCombos(remaining, current, i + 1, newOdds);
        current.pop();
      }
    };

    // Sort predictions by odds (ascending) to optimize search
    const sortedPredictions = [...predictions].sort((a, b) => a.odds - b.odds);

    // Start the recursive search
    findCombos(sortedPredictions, [], 0, 1);

    return bestCombo;
  }

  // Fetch previous rollover games
  useEffect(() => {
    const fetchPreviousRolloverGames = async () => {
      try {
        setLoading(true);
        const allRolloverGames = await getRolloverGames();
        const previous = allRolloverGames.filter(game => !game.isActive);
        setPreviousRolloverGames(previous);
      } catch (error) {
        console.error("Error fetching previous rollover games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousRolloverGames();
  }, []);

  return (
    <Card variant="premium" className="w-full premium-card">
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg md:text-xl premium-text">
              10-Day Rollover Challenge
            </CardTitle>
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
          {isActive ? (
            <Badge variant="premium" className="text-xs px-1.5 py-0.5">Active</Badge>
          ) : (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">Completed</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {/* Rollover Progress Tracker */}
        <div className="mb-4 bg-[#1A1A27]/50 p-3 rounded-lg border border-[#F5A623]/20 dark:bg-[#1A1A27]/50 light:bg-[#FFFAF0]/80 light:border-[#F5A623]/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold flex items-center">
              <DollarSign size={16} className="mr-1.5 text-[#F5A623]" />
              Rollover Progress
            </h3>
            <Badge variant="premium" className="text-xs px-2 py-0.5">
              Day {rolloverProgress.currentDay} of 10
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#2A2A3C] rounded-full mb-3 overflow-hidden dark:bg-[#2A2A3C] light:bg-[#F1F5F9]">
            <div
              className="h-full bg-gradient-to-r from-[#F5A623] to-[#F97316]"
              style={{ width: `${(rolloverProgress.currentDay - 1) * 10}%` }}
            ></div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <div className="text-center p-2 bg-[#1A1A27]/70 rounded-lg dark:bg-[#1A1A27]/70 light:bg-white light:shadow-sm">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Initial</p>
              <p className="text-sm font-bold">
                <CurrencyDisplay amount={rolloverProgress.initialAmount} originalCurrency="USD" />
              </p>
            </div>
            <div className="text-center p-2 bg-[#1A1A27]/70 rounded-lg dark:bg-[#1A1A27]/70 light:bg-white light:shadow-sm">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Current</p>
              <p className="text-sm font-bold text-[#F5A623]">
                <CurrencyDisplay amount={rolloverProgress.currentAmount} originalCurrency="USD" />
              </p>
            </div>
            <div className="text-center p-2 bg-[#1A1A27]/70 rounded-lg dark:bg-[#1A1A27]/70 light:bg-white light:shadow-sm">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Projected</p>
              <p className="text-sm font-bold premium-text">
                <CurrencyDisplay amount={rolloverProgress.projectedAmount} originalCurrency="USD" />
              </p>
            </div>
            <div className="text-center p-2 bg-[#1A1A27]/70 rounded-lg dark:bg-[#1A1A27]/70 light:bg-white light:shadow-sm">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Success Rate</p>
              <p className="text-sm font-bold text-green-500">{successRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Days Status */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
              <span className="text-[var(--muted-foreground)]">Won: {rolloverProgress.daysWon}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
              <span className="text-[var(--muted-foreground)]">Lost: {rolloverProgress.daysLost}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[#F5A623] mr-1"></div>
              <span className="text-[var(--muted-foreground)]">Pending: {rolloverProgress.daysPending}</span>
            </div>
          </div>
        </div>

        {/* Today's Rollover Combo */}
        <div className="mb-4">
          <h3 className="text-base font-semibold mb-2 flex items-center">
            <Calendar size={18} className="mr-2 text-[#F5A623]" />
            Today's Rollover Combo <span className="text-xs text-[var(--muted-foreground)] ml-2">Target: {TARGET_ODDS.toFixed(1)} Odds</span>
          </h3>
          {todayCombo ? (
            <div className="bg-[#1A1A27]/30 p-3 rounded-xl border border-[#F5A623]/20 dark:bg-[#1A1A27]/30 light:bg-[#FFFAF0]/50 light:border-[#F5A623]/20">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <Badge variant="premium" className="mr-2 text-xs px-2 py-0.5">
                    Day {rolloverProgress.currentDay}
                  </Badge>
                  <h4 className="text-xs font-semibold text-[#F5A623]">
                    {todayCombo.predictions.length} Game Combo
                  </h4>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-[var(--muted-foreground)] mr-2">Total:</span>
                  <Badge variant="premium" className="text-xs px-2 py-0.5">
                    {todayCombo.totalOdds.toFixed(2)}x
                  </Badge>
                </div>
              </div>

              {/* Compact Game Cards */}
              <div className="space-y-2">
                {todayCombo.predictions.map((prediction, index) => (
                  <CompactPredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    index={index + 1}
                    showReason={true}
                  />
                ))}
              </div>

              {/* Betting Amount */}
              <div className="mt-3 pt-3 border-t border-[#2A2A3C]/20 dark:border-[#2A2A3C]/20 light:border-[#F5A623]/10 flex justify-between items-center">
                <div className="flex items-center text-xs text-[var(--muted-foreground)]">
                  <ArrowRight size={14} className="mr-1.5 text-[#F5A623]" />
                  <span>Bet Amount: </span>
                  <span className="ml-1 font-semibold text-[var(--foreground)]">
                    <CurrencyDisplay amount={rolloverProgress.currentAmount} originalCurrency="USD" />
                  </span>
                </div>
                <div className="flex items-center text-xs text-[var(--muted-foreground)]">
                  <TrendingUp size={14} className="mr-1.5 text-green-500" />
                  <span>Potential Return: </span>
                  <span className="ml-1 font-semibold text-green-500">
                    <CurrencyDisplay
                      amount={rolloverProgress.currentAmount * todayCombo.totalOdds}
                      originalCurrency="USD"
                    />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <Clock size={24} className="mx-auto mb-2 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">No predictions for today in this rollover challenge.</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Check back later for today's selections.</p>
            </div>
          )}
        </div>

        {/* Previous Rollover Combos */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-semibold flex items-center">
              <TrendingUp size={18} className="mr-2 text-[#F5A623]" />
              Previous Days
            </h3>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {previousCombos.length} of 10 Days
            </Badge>
          </div>

          {previousCombos.length > 0 ? (
            <div className="space-y-3">
              {previousCombos.map((combo) => (
                <div
                  key={combo.date.toISOString()}
                  className={`bg-[#1A1A27]/30 p-3 rounded-xl border dark:bg-[#1A1A27]/30 light:bg-white light:shadow-sm ${
                    combo.status === "won"
                      ? "border-green-500/20"
                      : combo.status === "lost"
                        ? "border-red-500/20"
                        : "border-[#2A2A3C]/10 light:border-[#E2E8F0]/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Badge
                        variant={
                          combo.status === "won"
                            ? "success"
                            : combo.status === "lost"
                              ? "destructive"
                              : "outline"
                        }
                        className="mr-2 text-xs px-2 py-0.5"
                      >
                        Day {combo.day}
                      </Badge>
                      <h4 className="text-xs font-semibold">
                        {formatDate(combo.date)}
                      </h4>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-[var(--muted-foreground)] mr-2">{combo.predictions.length} Games</span>
                      <Badge
                        variant={
                          combo.status === "won"
                            ? "success"
                            : combo.status === "lost"
                              ? "destructive"
                              : "outline"
                        }
                        className="text-xs px-2 py-0.5"
                      >
                        {combo.totalOdds.toFixed(2)}x
                      </Badge>
                    </div>
                  </div>

                  {/* Compact Game Cards */}
                  <div className="space-y-2">
                    {combo.predictions.map((prediction, index) => (
                      <CompactPredictionCard
                        key={prediction.id}
                        prediction={prediction}
                        index={index + 1}
                        showReason={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
              <Clock size={24} className="mx-auto mb-2 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">No previous days in this rollover challenge yet.</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">This is the first day of the challenge.</p>
            </div>
          )}
        </div>

        {/* Previous Rollover Challenges */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-semibold flex items-center">
              <span className="bg-[#F5A623]/10 text-[#F5A623] p-1 rounded-md mr-2 text-sm">🏆</span>
              Previous Rollover Challenges
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrevious(!showPrevious)}
              className="text-xs px-2 py-1 border-[#F5A623]/30 hover:bg-[#F5A623]/10"
            >
              {showPrevious ? "Hide" : "Show"}
            </Button>
          </div>

          {showPrevious && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loading ? (
                <div className="text-center py-3 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm col-span-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#F5A623] mb-1"></div>
                  <p className="text-sm text-[var(--muted-foreground)]">Loading previous rollover challenges...</p>
                </div>
              ) : previousRolloverGames.length > 0 ? (
                previousRolloverGames.map((game) => (
                  <div key={game.id} className="bg-[#1A1A27]/30 p-3 rounded-xl border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <h4 className="text-sm font-semibold">Rollover Challenge</h4>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {formatDate(game.startDate)} - {formatDate(game.endDate)}
                        </p>
                      </div>
                      <Badge variant={game.successRate > 70 ? "success" : "outline"} className="text-xs px-1.5 py-0.5">
                        {game.successRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {game.predictions.length} predictions, {game.predictions.filter(p => p.status === "won").length} won
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10 dark:bg-[#1A1A27]/30 light:bg-white light:border-[#E2E8F0]/50 light:shadow-sm col-span-2">
                  <p className="text-sm text-[var(--muted-foreground)]">No previous rollover challenges found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 border border-[#F5A623]/20 rounded-lg bg-[#F5A623]/5 dark:bg-[#F5A623]/5 light:bg-[#FFFAF0]/80">
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <DollarSign size={16} className="mr-1.5 text-[#F5A623]" />
            How the 10-Day Rollover Challenge Works
          </h4>
          <div className="space-y-2">
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-xs mr-2 mt-0.5">1</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                We start with <CurrencyDisplay amount={INITIAL_AMOUNT} originalCurrency="USD" /> and select games each day that combine to approximately {TARGET_ODDS.toFixed(1)}x odds.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-xs mr-2 mt-0.5">2</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                When a day's combo wins, we roll over the entire amount (initial stake + winnings) to the next day.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-xs mr-2 mt-0.5">3</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                If a day's combo loses, we reset to the initial ${INITIAL_AMOUNT} and continue the challenge.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-xs mr-2 mt-0.5">4</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                The goal is to complete all 10 days successfully, potentially turning <CurrencyDisplay amount={INITIAL_AMOUNT} originalCurrency="USD" /> into <CurrencyDisplay amount={Math.pow(TARGET_ODDS, 10) * INITIAL_AMOUNT} originalCurrency="USD" />!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RolloverTracker;



