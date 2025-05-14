import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../common/Tabs";
import { Trophy, Calendar, Filter, Search, X, BookOpen, AlertTriangle } from "lucide-react";
import GameCodeCard from "./GameCodeCard";
import type { Prediction } from "../../types";
import { getPredictions } from "../../services/dataService";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";

interface BestPunterGamesProps {
  className?: string;
}

interface GameCodeGroup {
  gameCode: string;
  bookmaker: string;
  predictions: Prediction[];
  date: Date;
}

const BestPunterGames: React.FC<BestPunterGamesProps> = ({ className = "" }) => {
  const [loading, setLoading] = useState(true);
  const [gameCodeGroups, setGameCodeGroups] = useState<GameCodeGroup[]>([]);
  const [bookmakerFilter, setBookmakerFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">("today");

  // Add search functionality
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [minGames, setMinGames] = useState<number>(0);
  const [maxGames, setMaxGames] = useState<number>(100);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all predictions
        const predictions = await getPredictions();

        // Add null checks
        if (!predictions || !Array.isArray(predictions)) {
          throw new Error("Failed to fetch predictions or received invalid data");
        }

        // Filter predictions with game codes
        const predictionsWithGameCodes = predictions.filter(p => p?.gameCode && p?.bookmaker);

        // Group by game code
        const groupedByCode: Record<string, Prediction[]> = {};

        predictionsWithGameCodes.forEach(prediction => {
          if (!prediction) return; // Skip null predictions

          const gameCode = prediction.gameCode || "";
          const bookmaker = prediction.bookmaker || "";

          if (!gameCode || !bookmaker) return; // Skip if missing critical data

          const key = `${gameCode}-${bookmaker}`;
          if (!groupedByCode[key]) {
            groupedByCode[key] = [];
          }
          groupedByCode[key].push(prediction);
        });

        // Convert to array of game code groups
        const groups = Object.entries(groupedByCode).map(([key, preds]) => {
          const [gameCode, bookmaker] = key.split("-");

          // Use the earliest game date as the group date with null checks
          const validDates = preds
            .filter(p => p?.game?.startTime)
            .map(p => new Date(p.game.startTime).getTime());

          // Default to current date if no valid dates
          const date = validDates.length > 0
            ? new Date(Math.min(...validDates))
            : new Date();

          return {
            gameCode: gameCode || "Unknown",
            bookmaker: bookmaker || "Unknown",
            predictions: preds,
            date
          };
        });

        // Sort by date (newest first)
        groups.sort((a, b) => b.date.getTime() - a.date.getTime());

        setGameCodeGroups(groups);
      } catch (error) {
        console.error("Error fetching game codes:", error);
        setError("Failed to load game codes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter game code groups based on current filters
  const filteredGroups = gameCodeGroups.filter(group => {
    // Apply bookmaker filter
    if (bookmakerFilter !== "all" && group.bookmaker !== bookmakerFilter) {
      return false;
    }

    // Apply date filter
    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const groupDate = new Date(group.date);
      groupDate.setHours(0, 0, 0, 0);
      return groupDate.getTime() === today.getTime();
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return group.date >= weekAgo;
    }

    // Apply search filter if there's a search term
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      const gameCodeMatch = group.gameCode.toLowerCase().includes(searchLower);
      const bookmakerMatch = group.bookmaker.toLowerCase().includes(searchLower);

      // Also search in game details
      const gameDetailsMatch = group.predictions.some(pred => {
        const homeTeam = pred?.game?.homeTeam?.name?.toLowerCase() || "";
        const awayTeam = pred?.game?.awayTeam?.name?.toLowerCase() || "";
        const predType = pred?.predictionType?.toLowerCase() || "";

        return homeTeam.includes(searchLower) ||
               awayTeam.includes(searchLower) ||
               predType.includes(searchLower);
      });

      if (!gameCodeMatch && !bookmakerMatch && !gameDetailsMatch) {
        return false;
      }
    }

    // Apply game count filter
    const gameCount = group.predictions.length;
    if (gameCount < minGames || gameCount > maxGames) {
      return false;
    }

    // All filters passed
    return true;
  });

  // Group by bookmaker for tabs
  const bookmakers = ["all", ...new Set(gameCodeGroups.map(g => g.bookmaker || "unknown"))];

  return (
    <Card className={`w-full bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden ${className}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <CardTitle className="text-lg flex items-center">
            <Trophy size={18} className="mr-2 text-[#F5A623]" />
            Best Punter Games
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filter */}
            <div className="flex items-center">
              <Calendar size={14} className="mr-1 text-[#A1A1AA]" />
              <select
                className="bg-[#1A1A27] border border-[#2A2A3C] rounded text-xs p-1"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as "today" | "week" | "all")}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} className="mr-1" />
              Filters
            </Button>
          </div>
        </div>

        {/* Search and Advanced Filters */}
        <div className="mt-3">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={14} className="text-[#A1A1AA]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 text-sm bg-[#1A1A27] border border-[#2A2A3C] rounded-md focus:outline-none focus:ring-1 focus:ring-[#F5A623] focus:border-[#F5A623]"
              placeholder="Search game codes, teams, or predictions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSearchTerm("")}
              >
                <X size={14} className="text-[#A1A1AA] hover:text-white" />
              </button>
            )}
          </div>

          {/* Advanced Filters - Show when showFilters is true */}
          {showFilters && (
            <div className="mt-3 p-3 bg-[#1A1A27]/50 rounded-lg border border-[#2A2A3C]/10">
              <div className="text-xs font-medium mb-2">Advanced Filters</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A1A1AA] block mb-1">Min Games</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-1 text-xs bg-[#1A1A27] border border-[#2A2A3C] rounded"
                    value={minGames}
                    onChange={(e) => setMinGames(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A1AA] block mb-1">Max Games</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full p-1 text-xs bg-[#1A1A27] border border-[#2A2A3C] rounded"
                    value={maxGames}
                    onChange={(e) => setMaxGames(parseInt(e.target.value) || 100)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
            <AlertTriangle size={16} className="text-red-500 mr-2" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Bookmaker Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex overflow-x-auto pb-1 hide-scrollbar">
            {bookmakers.map(bookmaker => (
              <TabsTrigger
                key={bookmaker}
                value={bookmaker}
                className="text-xs px-3 py-1 capitalize"
                onClick={() => setBookmakerFilter(bookmaker)}
              >
                {bookmaker === "all" ? "All Bookmakers" : bookmaker}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={bookmakerFilter} className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623] mb-3"></div>
                <p className="text-[#A1A1AA]">Loading game codes...</p>
              </div>
            ) : filteredGroups.length > 0 ? (
              <>
                {/* Results Count */}
                <div className="mb-3 flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">
                    {filteredGroups.length} {filteredGroups.length === 1 ? 'Result' : 'Results'}
                  </Badge>

                  {/* Sort Options - Could be implemented in the future */}
                  <div className="text-xs text-[#A1A1AA]">
                    Sorted by: <span className="text-white">Date (Newest)</span>
                  </div>
                </div>

                {/* Game Code Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroups.map((group, index) => (
                    <GameCodeCard
                      key={`${group.gameCode}-${index}`}
                      gameCode={group.gameCode}
                      predictions={group.predictions}
                      bookmaker={group.bookmaker}
                      date={group.date}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
                <BookOpen size={24} className="mx-auto mb-2 text-[#A1A1AA]" />
                <p className="text-[#A1A1AA] mb-1">No game codes found for the selected filters.</p>
                <p className="text-xs text-[#A1A1AA]">Try adjusting your filters or search term.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BestPunterGames;





