import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { getPuntersList, Punter } from "../services/punterService";
import { formatDate } from "../lib/utils";
import {
  Star,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Award,
  MapPin,
  TrendingUp,
  User,
  ExternalLink
} from "lucide-react";

const PuntersPage: React.FC = () => {
  // State for punters and loading
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [punters, setPunters] = useState<Punter[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPunters, setTotalPunters] = useState<number>(0);
  const puntersPerPage = 12;

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Favorite punters state
  const [favoritePunters, setFavoritePunters] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Toggle favorite status for a punter
  const toggleFavoritePunter = useCallback((punterId: number) => {
    setFavoritePunters(prevFavorites => {
      const newFavorites = prevFavorites.includes(punterId)
        ? prevFavorites.filter(id => id !== punterId)
        : [...prevFavorites, punterId];

      localStorage.setItem("favoritePunters", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // Load favorite punters from localStorage
  useEffect(() => {
    const favoritesFromStorage = localStorage.getItem("favoritePunters");
    if (favoritesFromStorage) {
      setFavoritePunters(JSON.parse(favoritesFromStorage));
    }
  }, []);

  // Fetch punters with pagination
  const fetchPunters = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const skip = (page - 1) * puntersPerPage;
      const limit = puntersPerPage;

      console.log(`Fetching punters: page ${page}, skip ${skip}, limit ${limit}`);
      const response = await getPuntersList(limit, skip);

      console.log('Fetched punters response:', response);
      console.log(`API returned ${response.items.length} punters`);
      setPunters(response.items);
      setTotalPunters(response.total);

      // Log success for debugging
      if (response.items.length === 0) {
        console.log('✅ API call successful but no punters found in database');
      } else {
        console.log(`✅ API call successful - loaded ${response.items.length} punters`);
      }
    } catch (err) {
      console.error("Error fetching punters:", err);
      setError(`Failed to load punters: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [puntersPerPage]);

  // Fetch punters when page changes
  useEffect(() => {
    fetchPunters(currentPage);
  }, [currentPage, fetchPunters]);

  // Filter and sort punters
  const filteredPunters = punters
    .filter(punter => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          punter.name.toLowerCase().includes(query) ||
          (punter.nickname && punter.nickname.toLowerCase().includes(query)) ||
          punter.country.toLowerCase().includes(query) ||
          (punter.specialty && punter.specialty.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(punter => {
      // Apply country filter
      if (filterCountry !== "all") {
        return punter.country.toLowerCase() === filterCountry.toLowerCase();
      }
      return true;
    })
    .filter(punter => {
      // Apply verified filter
      if (filterVerified !== "all") {
        return filterVerified === "verified" ? punter.verified : !punter.verified;
      }
      return true;
    })
    .filter(punter => {
      // Apply favorites filter
      if (showFavoritesOnly) {
        return favoritePunters.includes(punter.id);
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "popularity") {
        const popularityA = a.popularity || 0;
        const popularityB = b.popularity || 0;
        return sortOrder === "asc" ? popularityA - popularityB : popularityB - popularityA;
      } else if (sortBy === "success_rate") {
        const successA = a.success_rate || 0;
        const successB = b.success_rate || 0;
        return sortOrder === "asc" ? successA - successB : successB - successA;
      } else if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return 0;
    });

  // Calculate total pages
  const totalPages = Math.ceil(totalPunters / puntersPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterCountry("all");
    setFilterVerified("all");
    setShowFavoritesOnly(false);
    setSortBy("popularity");
    setSortOrder("desc");
  };

  // Get unique countries from punters
  const getUniqueCountries = () => {
    const countries = punters.map(punter => punter.country).filter(Boolean);
    return [...new Set(countries)].sort();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Expert Punters</h1>
          <p className="text-sm text-[#A1A1AA]">
            Discover and follow our verified betting experts from around the world
          </p>
        </div>

        {/* Search and filter controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#A1A1AA]" size={16} />
            <input
              type="text"
              placeholder="Search punters..."
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

          {/* Favorites toggle */}
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="flex items-center gap-1"
          >
            <Star size={16} className={showFavoritesOnly ? "fill-current" : ""} />
            Favorites
          </Button>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPunters(currentPage)}
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Country filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-2 text-sm"
                >
                  <option value="all">All Countries</option>
                  {getUniqueCountries().map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Verified filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Verification</label>
                <select
                  value={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.value)}
                  className="w-full bg-[#1A1A27] border border-[#2A2A3C] rounded-lg p-2 text-sm"
                >
                  <option value="all">All Punters</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
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
                  <option value="popularity">Popularity</option>
                  <option value="success_rate">Success Rate</option>
                  <option value="name">Name</option>
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
              onClick={() => fetchPunters(currentPage)}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Punters Card */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        <CardHeader className="p-4">
          <CardTitle className="text-xl flex items-center">
            <span className="bg-[#F5A623]/10 text-[#F5A623] p-1 rounded-md mr-2 text-sm">👑</span>
            Expert Punters
            {filteredPunters.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredPunters.length} {filteredPunters.length === 1 ? 'punter' : 'punters'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623] mb-4"></div>
              <p className="text-[#A1A1AA]">Loading punters...</p>
            </div>
          ) : filteredPunters.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPunters.map((punter) => (
                  <div key={punter.id} className="bg-[#2A2A3C]/20 rounded-lg p-4 border border-[#2A2A3C]/30 hover:border-[#F5A623]/30 transition-all duration-200">
                    {/* Punter Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-[#F5A623]/10 rounded-full flex items-center justify-center">
                          {punter.image_url ? (
                            <img
                              src={punter.image_url}
                              alt={punter.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <User size={20} className={`text-[#F5A623] ${punter.image_url ? 'hidden' : ''}`} />
                        </div>

                        {/* Name and verification */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="font-semibold text-sm truncate">{punter.name}</h3>
                            {punter.verified && (
                              <Award size={14} className="text-[#F5A623] flex-shrink-0" />
                            )}
                          </div>
                          {punter.nickname && (
                            <p className="text-xs text-[#A1A1AA] truncate">@{punter.nickname}</p>
                          )}
                        </div>
                      </div>

                      {/* Favorite button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={() => toggleFavoritePunter(punter.id)}
                      >
                        <Star
                          size={16}
                          className={`${favoritePunters.includes(punter.id) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#A1A1AA]'}`}
                        />
                      </Button>
                    </div>

                    {/* Punter Info */}
                    <div className="space-y-2 mb-3">
                      {/* Country */}
                      <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
                        <MapPin size={12} />
                        <span>{punter.country}</span>
                      </div>

                      {/* Specialty */}
                      {punter.specialty && (
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp size={12} className="text-[#F5A623]" />
                          <span className="text-[#A1A1AA]">{punter.specialty}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Success Rate */}
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#F5A623]">
                          {punter.success_rate ? `${punter.success_rate.toFixed(1)}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-[#A1A1AA]">Success Rate</div>
                      </div>

                      {/* Popularity */}
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#F5A623]">
                          {punter.popularity || 0}
                        </div>
                        <div className="text-xs text-[#A1A1AA]">Popularity</div>
                      </div>
                    </div>

                    {/* Bio */}
                    {punter.bio && (
                      <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-3">
                        {punter.bio}
                      </p>
                    )}

                    {/* Social Media Links */}
                    {punter.social_media && Object.keys(punter.social_media).length > 0 && (
                      <div className="flex gap-2 justify-center">
                        {Object.entries(punter.social_media).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#A1A1AA] hover:text-[#F5A623] transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A2A3C]/20">
                  <div className="text-sm text-[#A1A1AA]">
                    Showing {(currentPage - 1) * puntersPerPage + 1} to {Math.min(currentPage * puntersPerPage, totalPunters)} of {totalPunters} punters
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
              {(searchQuery || filterCountry !== "all" || filterVerified !== "all" || showFavoritesOnly) ? (
                <>
                  <p className="text-[#A1A1AA]">No punters match your current filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">👑</div>
                  <h3 className="text-lg font-semibold mb-2">No Punters Yet</h3>
                  <p className="text-[#A1A1AA] mb-4">
                    Expert punters will appear here once they join our platform and start sharing their expertise.
                  </p>
                  <p className="text-sm text-[#A1A1AA]">
                    The backend is connected and working - we're just waiting for punter data to be added.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPunters(currentPage)}
                    className="mt-4"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Check Again
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PuntersPage;





