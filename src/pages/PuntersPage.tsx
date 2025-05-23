import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import CopyButton from "../components/common/CopyButton";
import { getLatestBettingCodes, BettingCode } from "../services/bettingCodeService";
import { formatDate } from "../lib/utils";
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react";

const PuntersPage: React.FC = () => {
  // State for betting codes and loading
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bettingCodes, setBettingCodes] = useState<BettingCode[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCodes, setTotalCodes] = useState<number>(0);
  const codesPerPage = 10;

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Saved codes state
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);

  // Toggle saved status for a betting code
  const toggleSavedCode = useCallback((code: string) => {
    setSavedCodes(prevSavedCodes => {
      const newSavedCodes = prevSavedCodes.includes(code)
        ? prevSavedCodes.filter(c => c !== code)
        : [...prevSavedCodes, code];

      localStorage.setItem("savedBettingCodes", JSON.stringify(newSavedCodes));
      return newSavedCodes;
    });
  }, []);

  // Load saved codes from localStorage
  useEffect(() => {
    const savedCodesFromStorage = localStorage.getItem("savedBettingCodes");
    if (savedCodesFromStorage) {
      setSavedCodes(JSON.parse(savedCodesFromStorage));
    }
  }, []);

  // Fetch betting codes with pagination
  const fetchBettingCodes = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const skip = (page - 1) * codesPerPage;
      const limit = codesPerPage;

      console.log(`Fetching betting codes: page ${page}, skip ${skip}, limit ${limit}`);
      const codes = await getLatestBettingCodes(limit, skip);

      console.log('Fetched betting codes:', codes);
      setBettingCodes(codes);

      // For now, we'll just set a placeholder total since the API might not return a total count
      setTotalCodes(Math.max(codes.length + skip, totalCodes));
    } catch (err) {
      console.error("Error fetching betting codes:", err);
      setError("Failed to load betting codes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [codesPerPage, totalCodes]);

  // Fetch betting codes when page changes
  useEffect(() => {
    fetchBettingCodes(currentPage);
  }, [currentPage, fetchBettingCodes]);

  // Filter and sort betting codes
  const filteredCodes = bettingCodes
    .filter(code => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          code.code.toLowerCase().includes(query) ||
          code.punter_name.toLowerCase().includes(query) ||
          (code.bookmaker_name && code.bookmaker_name.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(code => {
      // Apply status filter
      if (filterStatus !== "all") {
        return code.status === filterStatus;
      }
      return true;
    })
    .filter(code => {
      // Apply saved filter
      if (showSavedOnly) {
        return savedCodes.includes(code.code);
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "date") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "odds") {
        const oddsA = a.odds || 0;
        const oddsB = b.odds || 0;
        return sortOrder === "asc" ? oddsA - oddsB : oddsB - oddsA;
      }
      return 0;
    });

  // Calculate total pages
  const totalPages = Math.ceil(totalCodes / codesPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setShowSavedOnly(false);
    setSortBy("date");
    setSortOrder("desc");
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "won": return "success";
      case "lost": return "error";
      case "void": return "outline";
      default: return "warning";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Betting Codes</h1>
          <p className="text-sm text-[#A1A1AA]">
            View and manage betting codes from our top punters
          </p>
        </div>

        {/* Search and filter controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#A1A1AA]" size={16} />
            <input
              type="text"
              placeholder="Search codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 bg-[#1A1A27] border border-[#2A2A3C] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F5A623] focus:border-[#F5A623] w-full md:w-auto"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter size={16} />
            Filters
          </Button>

          {/* Saved toggle */}
          <Button
            variant={showSavedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className="flex items-center gap-1"
          >
            {showSavedOnly ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            Saved
          </Button>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBettingCodes(currentPage)}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#F5A623]" />
                Filter Options
              </h3>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="void">Void</option>
                </select>
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-sm font-medium mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-2 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="odds">Odds</option>
                </select>
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-2 text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-500">Error Loading Data</h3>
            <p className="text-sm text-[#A1A1AA]">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBettingCodes(currentPage)}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Betting Codes Card */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        <CardHeader className="p-4">
          <CardTitle className="text-xl flex items-center">
            <span className="bg-[#F5A623]/10 text-[#F5A623] p-1 rounded-md mr-2 text-sm">🎫</span>
            Betting Codes
            {filteredCodes.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredCodes.length} {filteredCodes.length === 1 ? 'code' : 'codes'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623] mb-4"></div>
              <p className="text-[#A1A1AA]">Loading betting codes...</p>
            </div>
          ) : filteredCodes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#2A2A3C]/30 text-left">
                      <th className="p-2 text-sm font-medium">Code</th>
                      <th className="p-2 text-sm font-medium">Punter</th>
                      <th className="p-2 text-sm font-medium">Bookmaker</th>
                      <th className="p-2 text-sm font-medium">Odds</th>
                      <th className="p-2 text-sm font-medium">Event Date</th>
                      <th className="p-2 text-sm font-medium">Status</th>
                      <th className="p-2 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCodes.map((code) => (
                      <tr key={code.id} className="border-b border-[#2A2A3C]/10 hover:bg-[#2A2A3C]/10">
                        <td className="p-2 text-sm">
                          <div className="flex items-center">
                            <span className="font-medium mr-1">{code.code}</span>
                            <CopyButton
                              text={code.code}
                              successMessage="Copied!"
                              className="text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-2 text-sm">{code.punter_name}</td>
                        <td className="p-2 text-sm">{code.bookmaker_name || 'N/A'}</td>
                        <td className="p-2 text-sm">{code.odds ? code.odds.toFixed(2) : 'N/A'}</td>
                        <td className="p-2 text-sm">{code.event_date ? formatDate(new Date(code.event_date)) : 'N/A'}</td>
                        <td className="p-2 text-sm">
                          <Badge
                            variant={getStatusVariant(code.status)}
                            className="text-xs px-1.5 py-0.5 uppercase"
                          >
                            {code.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1 h-auto"
                            onClick={() => toggleSavedCode(code.code)}
                          >
                            {savedCodes.includes(code.code) ? (
                              <BookmarkCheck size={14} className="mr-1 text-[#F5A623]" />
                            ) : (
                              <Bookmark size={14} className="mr-1" />
                            )}
                            {savedCodes.includes(code.code) ? 'Saved' : 'Save'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A2A3C]/20">
                  <div className="text-sm text-[#A1A1AA]">
                    Showing {(currentPage - 1) * codesPerPage + 1} to {Math.min(currentPage * codesPerPage, totalCodes)} of {totalCodes} codes
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 h-8 w-8"
                    >
                      <ChevronLeft size={16} />
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="h-8 w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 h-8 w-8"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
              <p className="text-[#A1A1AA]">No betting codes available.</p>
              {(searchQuery || filterStatus !== "all" || showSavedOnly) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PuntersPage;





