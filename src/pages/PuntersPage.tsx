import React, { useEffect, useState, useRef, useCallback } from "react";
// import { Link } from "react-router-dom";
import type { Punter, Prediction, DailyPredictions, BookmakerType, SportType } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/common/Tabs";
import PredictionCard from "../components/predictions/PredictionCard";
import CopyButton from "../components/common/CopyButton";
import GameCodeModal from "../components/predictions/GameCodeModal";
import GameCodeCard from "../components/punters/GameCodeCard";
import VirtualizedList from "../components/common/VirtualizedList";
import GameCodeCardSkeleton from "../components/skeletons/GameCodeCardSkeleton";
import { getPunters, getDailyPredictionsByPunter } from "../services/dataService";
import { formatDate } from "../lib/utils";
import { Search, Filter, Calendar, Trophy, Bookmark, BookmarkCheck, SlidersHorizontal, Copy, Check, CheckSquare, Square, TrendingUp, TrendingDown, Twitter, Instagram, Send } from "lucide-react";
import BatchOperationsPanel from "../components/punters/BatchOperationsPanel";
import { useBreakpoints } from "../hooks/useMediaQuery";

// Helper function to get bookmaker color
const getBookmakerColor = (bookie?: BookmakerType) => {
  switch(bookie) {
    case "bet365": return "text-[#027b5b]";
    case "betway": return "text-[#00b67a]";
    case "1xbet": return "text-[#0085ff]";
    case "22bet": return "text-[#ff4e50]";
    case "sportybet": return "text-[#ff9900]";
    default: return "text-[#F5A623]";
  }
};

const PuntersPage: React.FC = () => {
  const [punters, setPunters] = useState<Punter[]>([]);
  const [selectedPunter, setSelectedPunter] = useState<Punter | null>(null);
  const [dailyPredictions, setDailyPredictions] = useState<DailyPredictions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("today");
  // Remove the unused state variable

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedGameCode, setSelectedGameCode] = useState<string>("");
  const [selectedPredictions, setSelectedPredictions] = useState<Prediction[]>([]);
  const [selectedBookmaker, setSelectedBookmaker] = useState<BookmakerType | undefined>();

  // Filter state
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterBookmaker, setFilterBookmaker] = useState<string>("all");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterMinOdds, setFilterMinOdds] = useState<number>(1);
  const [filterMaxOdds, setFilterMaxOdds] = useState<number>(100);
  const [filterMinWinRate, setFilterMinWinRate] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Saved codes state
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);

  // Batch operations state
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [showSelectionCheckboxes, setShowSelectionCheckboxes] = useState<boolean>(false);

  // Responsive state
  const { isMobile } = useBreakpoints();

  // Function to open modal with game code details
  const openGameCodeModal = (gameCode: string, predictions: Prediction[], bookmaker?: BookmakerType) => {
    setSelectedGameCode(gameCode);
    setSelectedPredictions(predictions);
    setSelectedBookmaker(bookmaker);
    setModalOpen(true);
  };

  // Toggle saved status for a game code
  const toggleSavedCode = useCallback((code: string) => {
    setSavedCodes(prevSavedCodes => {
      const newSavedCodes = prevSavedCodes.includes(code)
        ? prevSavedCodes.filter(c => c !== code)
        : [...prevSavedCodes, code];

      localStorage.setItem("savedGameCodes", JSON.stringify(newSavedCodes));
      return newSavedCodes;
    });
  }, []);

  // Apply filters to game codes
  const applyFilters = (gameCodes: Record<string, Prediction[]>) => {
    let filteredCodes = { ...gameCodes };

    // Filter by bookmaker
    if (filterBookmaker !== "all") {
      filteredCodes = Object.entries(filteredCodes).reduce((filtered, [code, predictions]) => {
        if (predictions[0]?.bookmaker?.toLowerCase() === filterBookmaker.toLowerCase()) {
          filtered[code] = predictions;
        }
        return filtered;
      }, {} as Record<string, Prediction[]>);
    }

    // Filter by sport
    if (filterSport !== "all") {
      filteredCodes = Object.entries(filteredCodes).reduce((filtered, [code, predictions]) => {
        const hasSport = predictions.some(pred => pred.game.sport === filterSport);
        if (hasSport) {
          filtered[code] = predictions;
        }
        return filtered;
      }, {} as Record<string, Prediction[]>);
    }

    // Filter by odds range
    filteredCodes = Object.entries(filteredCodes).reduce((filtered, [code, predictions]) => {
      const totalOdds = predictions.reduce((product, pred) => product * (pred.odds || 1), 1);
      if (totalOdds >= filterMinOdds && totalOdds <= filterMaxOdds) {
        filtered[code] = predictions;
      }
      return filtered;
    }, {} as Record<string, Prediction[]>);

    // Filter by win rate
    if (filterMinWinRate > 0) {
      filteredCodes = Object.entries(filteredCodes).reduce((filtered, [code, predictions]) => {
        // Calculate win rate
        const completedGames = predictions.filter(p => p?.status === "won" || p?.status === "lost");
        const wonGames = predictions.filter(p => p?.status === "won");
        const winRate = completedGames.length > 0
          ? Math.round((wonGames.length / completedGames.length) * 100)
          : 0;

        if (winRate >= filterMinWinRate) {
          filtered[code] = predictions;
        }
        return filtered;
      }, {} as Record<string, Prediction[]>);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredCodes = Object.entries(filteredCodes).reduce((filtered, [code, predictions]) => {
        if (
          code.toLowerCase().includes(query) ||
          predictions.some(pred =>
            pred.game.homeTeam.name.toLowerCase().includes(query) ||
            pred.game.awayTeam.name.toLowerCase().includes(query) ||
            pred.game.league.toLowerCase().includes(query) ||
            pred.predictionType.toLowerCase().includes(query)
          )
        ) {
          filtered[code] = predictions;
        }
        return filtered;
      }, {} as Record<string, Prediction[]>);
    }

    // Filter by saved codes
    if (showSavedOnly) {
      filteredCodes = Object.entries(filteredCodes).reduce((filtered, [code, predictions]) => {
        if (savedCodes.includes(code)) {
          filtered[code] = predictions;
        }
        return filtered;
      }, {} as Record<string, Prediction[]>);
    }

    return filteredCodes;
  };

  // Toggle selection for a game code
  const toggleSelectCode = useCallback((code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  }, []);

  // Select all game codes
  const selectAllCodes = () => {
    const allCodes = Object.keys(groupedByGameCode);
    setSelectedCodes(allCodes);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedCodes([]);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setShowSelectionCheckboxes(prev => !prev);
    if (showSelectionCheckboxes) {
      clearSelections();
    }
  };

  // Render function for virtualized list
  const renderGameCodeCard = useCallback((item: {
    gameCode: string;
    predictions: Prediction[];
    bookmaker: string;
    isSaved: boolean;
    isSelected: boolean;
  }) => {
    const { gameCode, predictions, bookmaker, isSaved, isSelected } = item;

    // Win rate is calculated inside the GameCodeCard component

    return (
      <div className="p-1">
        <GameCodeCard
          key={gameCode}
          gameCode={gameCode}
          predictions={predictions}
          bookmaker={bookmaker}
          date={new Date()}
          isSaved={isSaved}
          isSelected={isSelected}
          onToggleSave={toggleSavedCode}
          onToggleSelect={toggleSelectCode}
          showSuccessRate={true}
          showSelectionCheckbox={showSelectionCheckboxes}
        />
      </div>
    );
  }, [toggleSavedCode, toggleSelectCode, showSelectionCheckboxes]);

  // Reset all filters
  const resetFilters = () => {
    setFilterBookmaker("all");
    setFilterSport("all");
    setFilterMinOdds(1);
    setFilterMaxOdds(100);
    setFilterMinWinRate(0);
    setSearchQuery("");
    setShowSavedOnly(false);
  };

  useEffect(() => {
    const fetchPunters = async () => {
      try {
        setLoading(true);
        const fetchedPunters = await getPunters();
        setPunters(fetchedPunters);

        // Select the first punter by default
        if (fetchedPunters.length > 0 && !selectedPunter) {
          setSelectedPunter(fetchedPunters[0]);
        }

        // Load saved codes from localStorage
        const savedCodesFromStorage = localStorage.getItem("savedGameCodes");
        if (savedCodesFromStorage) {
          setSavedCodes(JSON.parse(savedCodesFromStorage));
        }
      } catch (error) {
        console.error("Error fetching punters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPunters();
  }, [selectedPunter]);

  useEffect(() => {
    const fetchPunterPredictions = async () => {
      if (!selectedPunter) return;

      try {
        setLoading(true);
        const predictions = await getDailyPredictionsByPunter(selectedPunter.id, 7);
        setDailyPredictions(predictions);
      } catch (error) {
        console.error("Error fetching punter predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPunterPredictions();
  }, [selectedPunter]);

  // Get today's predictions
  const todayPredictions = dailyPredictions.length > 0 ? dailyPredictions[0].predictions : [];

  // Group predictions by game code
  const groupedByGameCode = todayPredictions.reduce((acc, prediction) => {
    if (prediction.gameCode) {
      if (!acc[prediction.gameCode]) {
        acc[prediction.gameCode] = [];
      }
      acc[prediction.gameCode].push(prediction);
    }
    return acc;
  }, {} as Record<string, Prediction[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Best Punters</h1>
        <p className="text-sm text-[#A1A1AA]">
          Follow our top punters and their daily predictions with game codes for easy reference.
        </p>
      </div>

      {/* Punter Selection */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        <CardHeader className="p-3">
          <CardTitle className="text-base">Select Punter</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex flex-wrap gap-2">
            {punters.map((punter) => (
              <Button
                key={punter.id}
                variant={selectedPunter?.id === punter.id ? "premium" : "outline"}
                size="sm"
                onClick={() => setSelectedPunter(punter)}
                className="text-xs px-2 py-1"
              >
                {punter.name}
                {punter.verified && " ✓"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Punter Details */}
      {selectedPunter && (
        <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
          <CardHeader className="p-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center">
                {selectedPunter.name}
                {selectedPunter.verified && (
                  <Badge variant="premium" className="ml-2 text-xs px-1.5 py-0.5">Verified</Badge>
                )}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="success" className="text-xs px-1.5 py-0.5">
                  {selectedPunter.winRate.toFixed(1)}% Win Rate
                </Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {selectedPunter.totalPredictions} Predictions
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="text-center p-2 bg-[#1A1A27]/50 rounded-lg">
                <p className="text-xs font-medium text-[#A1A1AA]">Win Rate</p>
                <p className="text-lg font-bold premium-text">{selectedPunter.winRate.toFixed(1)}%</p>
              </div>
              <div className="text-center p-2 bg-[#1A1A27]/50 rounded-lg">
                <p className="text-xs font-medium text-[#A1A1AA]">Total Picks</p>
                <p className="text-lg font-bold">{selectedPunter.totalPredictions}</p>
              </div>
              <div className="text-center p-2 bg-[#1A1A27]/50 rounded-lg">
                <p className="text-xs font-medium text-[#A1A1AA]">Won Picks</p>
                <p className="text-lg font-bold text-[#10B981]">{selectedPunter.wonPredictions}</p>
              </div>
              <div className="text-center p-2 bg-[#1A1A27]/50 rounded-lg">
                <p className="text-xs font-medium text-[#A1A1AA]">Avg. Odds</p>
                <p className="text-lg font-bold">{selectedPunter.averageOdds.toFixed(2)}x</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <p className="text-xs font-medium text-[#A1A1AA]">Specialties:</p>
              {selectedPunter.specialties.map((specialty) => (
                <Badge key={specialty} variant="outline" className="text-xs px-1.5 py-0.5 capitalize">
                  {specialty}
                </Badge>
              ))}
            </div>

            {/* Social Media Links */}
            {selectedPunter.socialMedia && (
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-[#A1A1AA]">Follow:</p>
                <div className="flex gap-2">
                  {selectedPunter.socialMedia.twitter && (
                    <a
                      href={selectedPunter.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-full transition-colors"
                      title="Twitter"
                    >
                      <Twitter size={16} />
                    </a>
                  )}
                  {selectedPunter.socialMedia.instagram && (
                    <a
                      href={selectedPunter.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 text-[#E1306C] rounded-full transition-colors"
                      title="Instagram"
                    >
                      <Instagram size={16} />
                    </a>
                  )}
                  {selectedPunter.socialMedia.telegram && (
                    <a
                      href={selectedPunter.socialMedia.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] rounded-full transition-colors"
                      title="Telegram"
                    >
                      <Send size={16} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Predictions Tabs */}
      {selectedPunter && (
        <Tabs defaultValue="today" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-[#2A2A3C]/30 p-1 rounded-lg">
              <TabsTrigger
                value="today"
                className="px-4 py-2 rounded-md data-[state=active]:bg-[#F5A623] data-[state=active]:text-black"
              >
                Today's Picks
              </TabsTrigger>
              <TabsTrigger
                value="codes"
                className="px-4 py-2 rounded-md data-[state=active]:bg-[#F5A623] data-[state=active]:text-black"
              >
                Game Codes
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="px-4 py-2 rounded-md data-[state=active]:bg-[#F5A623] data-[state=active]:text-black"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          {loading ? (
            <div className="text-center py-16 bg-[#1A1A27]/50 rounded-xl border border-[#2A2A3C]/10">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623] mb-4"></div>
              <p className="text-[#A1A1AA]">Loading predictions...</p>
            </div>
          ) : (
            <>
              {/* Today's Picks Tab */}
              <TabsContent value="today" className="mt-2">
                <div className="bg-[#1A1A27]/80 p-4 rounded-xl border border-[#2A2A3C]/20 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-[#F5A623]/10 text-[#F5A623] p-1 rounded-md mr-2 text-sm">📅</span>
                    Today's Picks by {selectedPunter.name}
                  </h3>

                  {todayPredictions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {todayPredictions.map((prediction) => {

                        return (
                          <div key={prediction.id} className="bg-[#1A1A27]/30 p-2 rounded-xl border border-[#2A2A3C]/10">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5 mr-1">
                                  {prediction.gameCode}
                                </Badge>
                                <CopyButton
                                  text={prediction.gameCode || ""}
                                  successMessage="Code copied!"
                                  className="text-xs"
                                />
                              </div>
                              {prediction.bookmaker && (
                                <span className={`text-xs font-medium capitalize ${getBookmakerColor(prediction.bookmaker)}`}>
                                  {prediction.bookmaker}
                                </span>
                              )}
                            </div>
                            <PredictionCard
                              prediction={prediction}
                              isPremium={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
                      <p className="text-[#A1A1AA]">No predictions available for today.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Game Codes Tab */}
              <TabsContent value="codes" className="mt-2">
                <div className="bg-[#1A1A27]/80 p-4 rounded-xl border border-[#2A2A3C]/20 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="bg-[#F5A623]/10 text-[#F5A623] p-1 rounded-md mr-2 text-sm">🎮</span>
                      Game Codes for Today
                    </h3>

                    <div className="flex items-center gap-2">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#A1A1AA]" size={14} />
                        <input
                          type="text"
                          placeholder="Search codes..."
                          className="w-full pl-8 pr-2 py-1 bg-[#1A1A27] border border-[#2A2A3C] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#F5A623] focus:border-[#F5A623]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Filter Toggle Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        <Filter size={14} className="mr-1" />
                        Filters
                      </Button>

                      {/* Saved Codes Toggle */}
                      <Button
                        variant={showSavedOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowSavedOnly(!showSavedOnly)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        {showSavedOnly ? (
                          <BookmarkCheck size={14} className="mr-1 text-white" />
                        ) : (
                          <Bookmark size={14} className="mr-1" />
                        )}
                        Saved
                      </Button>
                    </div>
                  </div>

                  {/* Filters Panel */}
                  {showFilters && (
                    <div className="mb-4 p-3 bg-[#1A1A27]/50 rounded-lg border border-[#2A2A3C]/20">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Bookmaker Filter */}
                        <div>
                          <label className="block text-xs font-medium mb-1">Bookmaker</label>
                          <select
                            className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-1.5 text-xs"
                            value={filterBookmaker}
                            onChange={(e) => setFilterBookmaker(e.target.value)}
                          >
                            <option value="all">All Bookmakers</option>
                            <option value="bet365">Bet365</option>
                            <option value="betway">Betway</option>
                            <option value="1xbet">1xBet</option>
                            <option value="22bet">22Bet</option>
                            <option value="sportybet">SportyBet</option>
                          </select>
                        </div>

                        {/* Sport Filter */}
                        <div>
                          <label className="block text-xs font-medium mb-1">Sport</label>
                          <select
                            className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-1.5 text-xs"
                            value={filterSport}
                            onChange={(e) => setFilterSport(e.target.value)}
                          >
                            <option value="all">All Sports</option>
                            <option value="soccer">Soccer</option>
                            <option value="basketball">Basketball</option>
                            <option value="mixed">Mixed</option>
                          </select>
                        </div>

                        {/* Odds Range Filter */}
                        <div>
                          <label className="block text-xs font-medium mb-1">Total Odds Range</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-1.5 text-xs"
                              value={filterMinOdds}
                              onChange={(e) => setFilterMinOdds(Number(e.target.value))}
                            />
                            <span className="text-xs">to</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-1.5 text-xs"
                              value={filterMaxOdds}
                              onChange={(e) => setFilterMaxOdds(Number(e.target.value))}
                            />
                          </div>
                        </div>

                        {/* Win Rate Filter */}
                        <div className="md:col-span-3 mt-2">
                          <label className="block text-xs font-medium mb-1">
                            Minimum Win Rate: {filterMinWinRate}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            className="w-full h-2 bg-[#1A1A27] rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
                            value={filterMinWinRate}
                            onChange={(e) => setFilterMinWinRate(Number(e.target.value))}
                          />
                          <div className="flex justify-between text-xs text-[#A1A1AA] mt-1">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="text-xs px-2 py-1 h-auto mr-2"
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Batch Operations Toggle */}
                  <div className="flex justify-end mb-4">
                    <Button
                      variant={showSelectionCheckboxes ? "default" : "outline"}
                      size="sm"
                      onClick={toggleSelectionMode}
                      className="text-xs px-3 py-1 h-auto"
                    >
                      {showSelectionCheckboxes ? (
                        <>
                          <Check size={14} className="mr-1.5" />
                          Exit Selection Mode
                        </>
                      ) : (
                        <>
                          <CheckSquare size={14} className="mr-1.5" />
                          Select Multiple Codes
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Batch Operations Panel */}
                  {showSelectionCheckboxes && (
                    <BatchOperationsPanel
                      selectedCodes={selectedCodes}
                      allGameCodes={groupedByGameCode}
                      onClearSelection={clearSelections}
                      onSelectAll={selectAllCodes}
                      totalCodes={Object.keys(groupedByGameCode).length}
                    />
                  )}

                  {loading ? (
                    // Skeleton loading state
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <GameCodeCardSkeleton
                          key={index}
                          animation="pulse"
                          gameCount={3}
                        />
                      ))}
                    </div>
                  ) : Object.keys(groupedByGameCode).length > 0 ? (
                    <>
                      {/* Apply filters to game codes */}
                      {(() => {
                        const filteredGameCodes = applyFilters(groupedByGameCode);
                        const filteredEntries = Object.entries(filteredGameCodes);

                        if (filteredEntries.length === 0) {
                          return (
                            <div className="text-center py-8 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
                              <p className="text-[#A1A1AA]">No game codes match your current filters.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilters}
                                className="mt-3 text-xs"
                              >
                                Reset Filters
                              </Button>
                            </div>
                          );
                        }

                        // Prepare data for virtualized list
                        const gameCodeItems = filteredEntries.map(([gameCode, predictions]) => {
                          return {
                            gameCode,
                            predictions,
                            bookmaker: predictions[0]?.bookmaker || "unknown",
                            isSaved: savedCodes.includes(gameCode),
                            isSelected: selectedCodes.includes(gameCode)
                          };
                        });

                        // Determine grid layout based on screen size
                        const gridClass = isMobile
                          ? "grid-cols-1"
                          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

                        return (
                          <div className={`grid ${gridClass} gap-3`}>
                            {gameCodeItems.length <= 20 ? (
                              // Regular rendering for small lists
                              gameCodeItems.map((item) => (
                                <div key={item.gameCode} className="p-1">
                                  <GameCodeCard
                                    gameCode={item.gameCode}
                                    predictions={item.predictions}
                                    bookmaker={item.bookmaker}
                                    date={new Date()}
                                    isSaved={item.isSaved}
                                    isSelected={item.isSelected}
                                    onToggleSave={toggleSavedCode}
                                    onToggleSelect={toggleSelectCode}
                                    showSuccessRate={true}
                                    showSelectionCheckbox={showSelectionCheckboxes}
                                  />
                                </div>
                              ))
                            ) : (
                              // Virtualized rendering for large lists
                              <div className="col-span-full">
                                <VirtualizedList
                                  items={gameCodeItems}
                                  height={800}
                                  itemHeight={350}
                                  renderItem={renderGameCodeCard}
                                  className="w-full"
                                  overscan={3}
                                  loading={loading}
                                  loadingComponent={
                                    <div className="p-4 text-center">
                                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
                                      <p className="mt-2 text-sm text-[#A1A1AA]">Loading more game codes...</p>
                                    </div>
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-8 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
                      <p className="text-[#A1A1AA]">No game codes available for today.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-2">
                <div className="bg-[#1A1A27]/80 p-4 rounded-xl border border-[#2A2A3C]/20 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="bg-[#F5A623]/10 text-[#F5A623] p-1 rounded-md mr-2 text-sm">📜</span>
                    Prediction History
                  </h3>

                  {dailyPredictions.length > 0 ? (
                    <div className="space-y-6">
                      {dailyPredictions.slice(1).map((daily, index) => (
                        <div key={index} className="bg-[#1A1A27]/30 p-3 rounded-xl border border-[#2A2A3C]/10">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-base font-semibold">{formatDate(daily.date)}</h4>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {daily.predictions.length} Picks
                            </Badge>
                          </div>

                          {daily.predictions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {daily.predictions.map((prediction) => {

                                return (
                                  <div key={prediction.id} className="bg-[#1A1A27]/50 p-2 rounded-lg border border-[#2A2A3C]/10">
                                    <div className="flex justify-between items-center mb-1">
                                      <p className="text-xs font-medium">
                                        {prediction.game.homeTeam.name} vs {prediction.game.awayTeam.name}
                                      </p>
                                      <Badge
                                        variant={
                                          prediction.status === "won" ? "success" :
                                          prediction.status === "lost" ? "danger" :
                                          "warning"
                                        }
                                        className="text-xs px-1.5 py-0.5 uppercase"
                                      >
                                        {prediction.status}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                      <p className="text-xs">{prediction.predictionType}</p>
                                      <p className="text-xs font-bold">{prediction.odds.toFixed(2)}x</p>
                                    </div>
                                    {prediction.gameCode && (
                                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#2A2A3C]/10">
                                        <div className="flex items-center">
                                          <span className="text-xs text-[#A1A1AA] mr-1">Code:</span>
                                          <span className="text-xs font-medium mr-1">{prediction.gameCode}</span>
                                          <CopyButton
                                            text={prediction.gameCode}
                                            successMessage="Copied!"
                                            className="text-xs"
                                          />
                                        </div>
                                        {prediction.bookmaker && (
                                          <span className={`text-xs font-medium capitalize ${getBookmakerColor(prediction.bookmaker)}`}>
                                            {prediction.bookmaker}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-center text-sm text-[#A1A1AA]">No predictions for this day.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
                      <p className="text-[#A1A1AA]">No prediction history available.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      )}

      {/* Game Code Modal */}
      <GameCodeModal
        gameCode={selectedGameCode}
        predictions={selectedPredictions}
        bookmaker={selectedBookmaker}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default PuntersPage;





