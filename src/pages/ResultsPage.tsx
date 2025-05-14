import React, { useEffect, useState, useCallback } from "react";
import type { Prediction, StatsOverview as StatsOverviewType, SportType, PredictionStatus, SportStats, PredictionFilters } from "../types";
import StatsOverview from "../components/results/StatsOverview";
import SportBreakdown from "../components/results/SportBreakdown";
import TrendAnalysis from "../components/results/TrendAnalysis";
import OutcomeAnalysis from "../components/results/OutcomeAnalysis";
import PredictionCard from "../components/predictions/PredictionCard";
import BestPunterGames from "../components/punters/BestPunterGames";
import DateRangePicker from "../components/common/DateRangePicker";
import { Card, CardContent } from "../components/common/Card";
import VirtualizedList from "../components/common/VirtualizedList";
import { useBreakpoints } from "../hooks/useMediaQuery";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Calendar, ChevronDown, Filter, BarChart2, TrendingUp, Clock, AlertCircle, Download, Share2, PieChart } from "lucide-react";
import {
  getPredictionsWithFilters,
  getStatsOverview,
  getSportStats,
  getPredictionsByOddsCategory
} from "../services/dataService";
import { predictionsToCSV, downloadCSV, generatePredictionsPDF, sharePredictions } from "../utils/exportUtils";
import { formatDate } from "../lib/utils";

const ResultsPage: React.FC = () => {
  const [completedPredictions, setCompletedPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<StatsOverviewType | null>(null);
  const [sportStats, setSportStats] = useState<SportStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all" | "custom">("week");
  const [sportFilter, setSportFilter] = useState<SportType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PredictionStatus | "all">("all");
  const [oddsCategory, setOddsCategory] = useState<"all" | "2odds" | "5odds" | "10odds">("all");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"results" | "punterGames">("results");
  const [customStartDate, setCustomStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to 7 days ago
    return date;
  });
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [activeStatsTab, setActiveStatsTab] = useState<"overview" | "trends" | "analysis">("overview");
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const ITEMS_PER_PAGE = isMobile ? 6 : 9;

  // Mock data for trend analysis
  const mockTrendData = [
    { date: '2023-06-01', successRate: 72, totalPredictions: 25 },
    { date: '2023-06-02', successRate: 65, totalPredictions: 20 },
    { date: '2023-06-03', successRate: 58, totalPredictions: 30 },
    { date: '2023-06-04', successRate: 70, totalPredictions: 15 },
    { date: '2023-06-05', successRate: 62, totalPredictions: 22 },
    { date: '2023-06-06', successRate: 68, totalPredictions: 28 },
    { date: '2023-06-07', successRate: 75, totalPredictions: 18 }
  ];

  // Mock data for outcome analysis
  const mockSportBreakdown = [
    { sport: 'soccer', totalPredictions: 120, wonPredictions: 82, lostPredictions: 38, pendingPredictions: 0, successRate: 68.3, averageOdds: 1.85 },
    { sport: 'basketball', totalPredictions: 85, wonPredictions: 52, lostPredictions: 33, pendingPredictions: 0, successRate: 61.2, averageOdds: 2.15 },
    { sport: 'mixed', totalPredictions: 45, wonPredictions: 25, lostPredictions: 20, pendingPredictions: 0, successRate: 55.6, averageOdds: 2.45 }
  ];

  const mockOddsBreakdown = [
    { range: '1.01 - 1.50', totalPredictions: 65, wonPredictions: 50, lostPredictions: 15, pendingPredictions: 0, successRate: 76.9 },
    { range: '1.51 - 2.00', totalPredictions: 85, wonPredictions: 60, lostPredictions: 25, pendingPredictions: 0, successRate: 70.6 },
    { range: '2.01 - 3.00', totalPredictions: 70, wonPredictions: 40, lostPredictions: 30, pendingPredictions: 0, successRate: 57.1 },
    { range: '3.01+', totalPredictions: 30, wonPredictions: 9, lostPredictions: 21, pendingPredictions: 0, successRate: 30.0 }
  ];

  // Handle custom date range change
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setTimeframe("custom");
  };

  // Handle export functions
  const handleExportCSV = () => {
    if (completedPredictions.length === 0) return;

    const csvData = predictionsToCSV(completedPredictions);
    downloadCSV(csvData, `betsightly-predictions-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    if (completedPredictions.length === 0) return;

    generatePredictionsPDF(completedPredictions);
  };

  const handleShare = async () => {
    if (completedPredictions.length === 0) return;

    const success = await sharePredictions(
      completedPredictions,
      `BetSightly Predictions - ${formatDate(new Date())}`
    );

    if (!success) {
      alert("Sharing is not supported on this device or browser.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get stats overview
        try {
          const statsData = await getStatsOverview();
          if (statsData) {
            setStats(statsData);
          } else {
            console.error("Stats data is null or undefined");
          }
        } catch (statsError) {
          console.error("Error fetching stats overview:", statsError);
        }

        // Get sport-specific stats
        try {
          const sportStatsData = await getSportStats();
          if (sportStatsData && Array.isArray(sportStatsData)) {
            setSportStats(sportStatsData);
          } else {
            console.error("Sport stats data is null, undefined, or not an array");
          }
        } catch (sportStatsError) {
          console.error("Error fetching sport stats:", sportStatsError);
        }

        // Reset pagination when filters change
        setPage(1);
        setHasMore(true);

        // Get completed predictions based on timeframe
        let startDate: Date;
        let endDate: Date;

        if (timeframe === "custom") {
          startDate = customStartDate;
          endDate = customEndDate;
        } else {
          endDate = new Date();
          startDate = new Date();

          if (timeframe === "week") {
            startDate.setDate(startDate.getDate() - 7);
          } else if (timeframe === "month") {
            startDate.setMonth(startDate.getMonth() - 1);
          } else {
            startDate.setFullYear(startDate.getFullYear() - 1);
          }
        }

        // Build filters
        const filters: PredictionFilters = {
          dateRange: {
            start: startDate,
            end: endDate,
          }
        };

        // Add sport filter if not "all"
        if (sportFilter !== "all") {
          filters.sport = sportFilter;
        }

        // Add status filter if not "all"
        if (statusFilter !== "all") {
          filters.status = statusFilter;
        }

        // Get predictions by odds category if selected
        if (oddsCategory !== "all") {
          const categorizedPredictions = await getPredictionsByOddsCategory(filters);
          const predictions = categorizedPredictions[oddsCategory] || [];

          // Sort by date (newest first)
          const sortedPredictions = [...predictions].sort((a, b) => {
            return new Date(b.game.startTime).getTime() - new Date(a.game.startTime).getTime();
          });

          setCompletedPredictions(sortedPredictions.slice(0, ITEMS_PER_PAGE));
          setHasMore(sortedPredictions.length > ITEMS_PER_PAGE);
        } else {
          // Get all predictions with filters
          let allPredictions: Prediction[] = [];

          if (statusFilter === "all") {
            // Get won predictions
            const wonPredictions = await getPredictionsWithFilters({
              ...filters,
              status: "won",
            });

            // Get lost predictions
            const lostPredictions = await getPredictionsWithFilters({
              ...filters,
              status: "lost",
            });

            allPredictions = [...wonPredictions, ...lostPredictions];
          } else {
            // Status filter is already applied
            allPredictions = await getPredictionsWithFilters(filters);
          }

          // Sort by date (newest first)
          const sortedPredictions = allPredictions.sort((a, b) => {
            return new Date(b.game.startTime).getTime() - new Date(a.game.startTime).getTime();
          });

          setCompletedPredictions(sortedPredictions.slice(0, ITEMS_PER_PAGE));
          setHasMore(sortedPredictions.length > ITEMS_PER_PAGE);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, sportFilter, statusFilter, oddsCategory, customStartDate, customEndDate]);

  // Load more results
  const handleLoadMore = async () => {
    try {
      setLoading(true);

      // Get completed predictions based on timeframe
      let startDate: Date;
      let endDate: Date;

      if (timeframe === "custom") {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        endDate = new Date();
        startDate = new Date();

        if (timeframe === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === "month") {
          startDate.setMonth(startDate.getMonth() - 1);
        } else {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }
      }

      // Build filters
      const filters: PredictionFilters = {
        dateRange: {
          start: startDate,
          end: endDate,
        }
      };

      // Add sport filter if not "all"
      if (sportFilter !== "all") {
        filters.sport = sportFilter;
      }

      // Add status filter if not "all"
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      let newPredictions: Prediction[] = [];

      // Get predictions by odds category if selected
      if (oddsCategory !== "all") {
        const categorizedPredictions = await getPredictionsByOddsCategory(filters);
        const predictions = categorizedPredictions[oddsCategory] || [];

        // Sort by date (newest first)
        const sortedPredictions = [...predictions].sort((a, b) => {
          return new Date(b.game.startTime).getTime() - new Date(a.game.startTime).getTime();
        });

        const nextPage = page + 1;
        const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        newPredictions = sortedPredictions.slice(startIndex, endIndex);
        setHasMore(endIndex < sortedPredictions.length);
      } else {
        // Get all predictions with filters
        let allPredictions: Prediction[] = [];

        if (statusFilter === "all") {
          // Get won predictions
          const wonPredictions = await getPredictionsWithFilters({
            ...filters,
            status: "won",
          });

          // Get lost predictions
          const lostPredictions = await getPredictionsWithFilters({
            ...filters,
            status: "lost",
          });

          allPredictions = [...wonPredictions, ...lostPredictions];
        } else {
          // Status filter is already applied
          allPredictions = await getPredictionsWithFilters(filters);
        }

        // Sort by date (newest first)
        const sortedPredictions = allPredictions.sort((a, b) => {
          return new Date(b.game.startTime).getTime() - new Date(a.game.startTime).getTime();
        });

        const nextPage = page + 1;
        const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        newPredictions = sortedPredictions.slice(startIndex, endIndex);
        setHasMore(endIndex < sortedPredictions.length);
      }

      // Add new predictions to existing ones
      setCompletedPredictions(prev => [...prev, ...newPredictions]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error("Error loading more data:", error);
      setError("Failed to load more data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center">
            <TrendingUp size={24} className="mr-2 text-[#F5A623]" />
            Results & Performance
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            Track the performance of our predictions over time and see detailed statistics.
          </p>
        </div>

        {/* Tabs for Results and Best Punter Games */}
        <div className="flex space-x-2">
          <Button
            variant={activeTab === "results" ? "premium" : "outline"}
            size="sm"
            onClick={() => setActiveTab("results")}
            className="text-sm px-4 py-1"
          >
            Results
          </Button>
          <Button
            variant={activeTab === "punterGames" ? "premium" : "outline"}
            size="sm"
            onClick={() => setActiveTab("punterGames")}
            className="text-sm px-4 py-1"
          >
            Best Punter Games
          </Button>
        </div>
      </div>

      {activeTab === "results" && (
        <>
          {/* Timeframe Selector */}
          <div className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <Clock size={18} className="mr-2 text-[#F5A623]" />
              <span className="text-sm font-medium">Time Period:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex space-x-2">
                <Button
                  variant={timeframe === "week" ? "premium" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("week")}
                  className="text-xs px-3 py-1"
                >
                  <Calendar size={14} className="mr-1" />
                  Last Week
                </Button>
                <Button
                  variant={timeframe === "month" ? "premium" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("month")}
                  className="text-xs px-3 py-1"
                >
                  <Calendar size={14} className="mr-1" />
                  Last Month
                </Button>
                <Button
                  variant={timeframe === "all" ? "premium" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("all")}
                  className="text-xs px-3 py-1"
                >
                  <Calendar size={14} className="mr-1" />
                  All Time
                </Button>
                <Button
                  variant={timeframe === "custom" ? "premium" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe("custom")}
                  className="text-xs px-3 py-1"
                >
                  <Calendar size={14} className="mr-1" />
                  Custom Range
                </Button>
              </div>

              {timeframe === "custom" && (
                <DateRangePicker
                  startDate={customStartDate}
                  endDate={customEndDate}
                  onRangeChange={handleDateRangeChange}
                />
              )}

              {/* Export Options */}
              <div className="relative ml-auto">
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
                        Share Results
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "results" ? (
        <>
          {/* Stats Overview */}
          {loading ? (
            <div className="text-center py-16 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623] mb-4"></div>
              <p className="text-[#A1A1AA]">Loading statistics...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stats Tabs */}
              <div className="mb-4 flex justify-center">
                <div className="inline-flex bg-[#1A1A27]/50 rounded-lg p-1">
                  <button
                    className={`px-4 py-2 text-sm rounded-md ${activeStatsTab === "overview" ? "bg-[#F5A623] text-black" : "text-white"}`}
                    onClick={() => setActiveStatsTab("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-4 py-2 text-sm rounded-md ${activeStatsTab === "trends" ? "bg-[#F5A623] text-black" : "text-white"}`}
                    onClick={() => setActiveStatsTab("trends")}
                  >
                    Trends
                  </button>
                  <button
                    className={`px-4 py-2 text-sm rounded-md ${activeStatsTab === "analysis" ? "bg-[#F5A623] text-black" : "text-white"}`}
                    onClick={() => setActiveStatsTab("analysis")}
                  >
                    Analysis
                  </button>
                </div>
              </div>

              {/* Stats Content based on active tab */}
              {activeStatsTab === "overview" && (
                <>
                  {/* Stats Overview */}
                  <StatsOverview stats={stats} timeframe={timeframe} />

                  {/* Sport Breakdown */}
                  <SportBreakdown
                    soccerRate={sportStats?.find(s => s.sport === "soccer")?.successRate || 0}
                    basketballRate={sportStats?.find(s => s.sport === "basketball")?.successRate || 0}
                    mixedRate={sportStats?.find(s => s.sport === "mixed")?.successRate || 0}
                    soccerCount={sportStats?.find(s => s.sport === "soccer")?.totalPredictions || 0}
                    basketballCount={sportStats?.find(s => s.sport === "basketball")?.totalPredictions || 0}
                    mixedCount={sportStats?.find(s => s.sport === "mixed")?.totalPredictions || 0}
                  />
                </>
              )}

              {activeStatsTab === "trends" && (
                <TrendAnalysis trends={mockTrendData} timeframe={timeframe} />
              )}

              {activeStatsTab === "analysis" && (
                <OutcomeAnalysis
                  sportBreakdown={mockSportBreakdown}
                  oddsBreakdown={mockOddsBreakdown}
                  timeframe={timeframe}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
              <p className="text-[#A1A1AA]">No statistics available.</p>
            </div>
          )}
        </>
      ) : (
        <BestPunterGames className="mt-4" />
      )}

      {/* Recent Results - Only show in results tab */}
      {activeTab === "results" && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BarChart2 size={20} className="mr-2 text-[#F5A623]" />
              <h2 className="text-xl font-bold">Recent Results</h2>
            </div>

            {/* Odds Category Tabs */}
            <div className="flex space-x-2">
              <Button
                variant={oddsCategory === "all" ? "premium" : "outline"}
                size="sm"
                onClick={() => setOddsCategory("all")}
                className="text-xs px-3 py-1"
              >
                All Odds
              </Button>
              <Button
                variant={oddsCategory === "2odds" ? "premium" : "outline"}
                size="sm"
                onClick={() => setOddsCategory("2odds")}
                className="text-xs px-3 py-1"
              >
                2 Odds
              </Button>
              <Button
                variant={oddsCategory === "5odds" ? "premium" : "outline"}
                size="sm"
                onClick={() => setOddsCategory("5odds")}
                className="text-xs px-3 py-1"
              >
                5 Odds
              </Button>
              <Button
                variant={oddsCategory === "10odds" ? "premium" : "outline"}
                size="sm"
                onClick={() => setOddsCategory("10odds")}
                className="text-xs px-3 py-1"
              >
                10 Odds
              </Button>
            </div>
          </div>

        {error ? (
          <div className="text-center py-12 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
            <div className="flex items-center justify-center mb-3 text-[#EF4444]">
              <AlertCircle size={20} className="mr-2" />
              <p>{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : loading && completedPredictions.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623] mb-3"></div>
            <p className="text-[#A1A1AA]">Loading results...</p>
          </div>
        ) : completedPredictions.length > 0 ? (
          <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {completedPredictions.length} Predictions
                  </Badge>
                  <Badge variant="success" className="text-xs px-2 py-0.5">
                    {completedPredictions.filter(p => p.status === "won").length} Won
                  </Badge>
                  <Badge variant="danger" className="text-xs px-2 py-0.5">
                    {completedPredictions.filter(p => p.status === "lost").length} Lost
                  </Badge>
                </div>

                <div className="flex items-center">
                  <Filter size={14} className="mr-1 text-[#A1A1AA]" />
                  <span className="text-xs text-[#A1A1AA] mr-2">Filter:</span>
                  <div className="flex space-x-1">
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-0.5 h-auto"
                        onClick={() => document.getElementById('sportDropdown')?.classList.toggle('hidden')}
                      >
                        {sportFilter === "all" ? "All Sports" :
                          sportFilter === "soccer" ? "Soccer" :
                          sportFilter === "basketball" ? "Basketball" : "Mixed"}
                        <ChevronDown size={12} className="ml-1" />
                      </Button>
                      <div id="sportDropdown" className="hidden absolute z-10 mt-1 w-32 bg-[#1A1A27] border border-[#2A2A3C] rounded-md shadow-lg">
                        <div className="py-1">
                          <button
                            className={`block px-4 py-2 text-xs w-full text-left hover:bg-[#2A2A3C] ${sportFilter === "all" ? "bg-[#2A2A3C]" : ""}`}
                            onClick={() => {
                              setSportFilter("all");
                              document.getElementById('sportDropdown')?.classList.add('hidden');
                            }}
                          >
                            All Sports
                          </button>
                          <button
                            className={`block px-4 py-2 text-xs w-full text-left hover:bg-[#2A2A3C] ${sportFilter === "soccer" ? "bg-[#2A2A3C]" : ""}`}
                            onClick={() => {
                              setSportFilter("soccer");
                              document.getElementById('sportDropdown')?.classList.add('hidden');
                            }}
                          >
                            Soccer
                          </button>
                          <button
                            className={`block px-4 py-2 text-xs w-full text-left hover:bg-[#2A2A3C] ${sportFilter === "basketball" ? "bg-[#2A2A3C]" : ""}`}
                            onClick={() => {
                              setSportFilter("basketball");
                              document.getElementById('sportDropdown')?.classList.add('hidden');
                            }}
                          >
                            Basketball
                          </button>
                          <button
                            className={`block px-4 py-2 text-xs w-full text-left hover:bg-[#2A2A3C] ${sportFilter === "mixed" ? "bg-[#2A2A3C]" : ""}`}
                            onClick={() => {
                              setSportFilter("mixed");
                              document.getElementById('sportDropdown')?.classList.add('hidden');
                            }}
                          >
                            Mixed
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-0.5 h-auto"
                        onClick={() => document.getElementById('statusDropdown')?.classList.toggle('hidden')}
                      >
                        {statusFilter === "all" ? "All Status" :
                          statusFilter === "won" ? "Won" :
                          statusFilter === "lost" ? "Lost" : "Pending"}
                        <ChevronDown size={12} className="ml-1" />
                      </Button>
                      <div id="statusDropdown" className="hidden absolute z-10 mt-1 w-32 bg-[#1A1A27] border border-[#2A2A3C] rounded-md shadow-lg">
                        <div className="py-1">
                          <button
                            className={`block px-4 py-2 text-xs w-full text-left hover:bg-[#2A2A3C] ${statusFilter === "all" ? "bg-[#2A2A3C]" : ""}`}
                            onClick={() => {
                              setStatusFilter("all");
                              document.getElementById('statusDropdown')?.classList.add('hidden');
                            }}
                          >
                            All Status
                          </button>
                          <button
                            className={`block px-4 py-2 text-xs w-full text-left hover:bg-[#2A2A3C] ${statusFilter === "won" ? "bg-[#2A2A3C]" : ""}`}
                            onClick={() => {
                              setStatusFilter("won");
                              document.getElementById('statusDropdown')?.classList.add('hidden');
                            }}
                          >
                            Won
                          </button>
                          <button
                            className={`block px-4 py-2 text-xs w-full text-left hover:bg-[#2A2A3C] ${statusFilter === "lost" ? "bg-[#2A2A3C]" : ""}`}
                            onClick={() => {
                              setStatusFilter("lost");
                              document.getElementById('statusDropdown')?.classList.add('hidden');
                            }}
                          >
                            Lost
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {completedPredictions.length <= 12 ? (
                // Regular grid for small number of predictions
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {completedPredictions.filter(prediction => prediction && prediction.game).map((prediction) => (
                    <PredictionCard
                      key={prediction.id || `prediction-${Math.random()}`}
                      prediction={prediction}
                      isPremium={prediction.odds > 5}
                      showReason={true}
                    />
                  ))}
                </div>
              ) : (
                // Virtualized list for larger number of predictions
                <div className="w-full">
                  <VirtualizedList
                    items={completedPredictions.filter(prediction => prediction && prediction.game)}
                    height={isMobile ? 600 : isTablet ? 800 : 1000}
                    itemHeight={isMobile ? 450 : 350}
                    renderItem={(prediction) => (
                      <div className="p-2">
                        <PredictionCard
                          key={prediction.id || `prediction-${Math.random()}`}
                          prediction={prediction}
                          isPremium={prediction.odds > 5}
                          showReason={true}
                        />
                      </div>
                    )}
                    className="w-full"
                    overscan={3}
                    scrollRestoration={true}
                  />
                </div>
              )}

              {hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-[#F5A623] mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      "Load More Results"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
            <p className="text-[#A1A1AA]">No predictions found for the selected time period.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default ResultsPage;
