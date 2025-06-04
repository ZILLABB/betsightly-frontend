import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import CopyButton from "../components/common/CopyButton";
import { getPuntersArray, Punter } from "../services/punterService";
import { getLatestBettingCodes, BettingCode } from "../services/bettingCodeService";
import { getBookmakersArray, Bookmaker } from "../services/bookmakerService";
import { formatDate } from "../lib/utils";
import {
  Star,
  Search,
  RefreshCw,
  AlertCircle,
  Award,
  MapPin,
  TrendingUp,
  User,
  ExternalLink,
  Building2,
  Globe,
  Ticket,
  BookmarkCheck,
  Bookmark,
  Users,
  Code,
  Building,
  Crown,
  Zap
} from "lucide-react";

const ExpertsPage: React.FC = () => {
  // Loading states
  const [puntersLoading, setPuntersLoading] = useState<boolean>(true);
  const [codesLoading, setCodesLoading] = useState<boolean>(true);
  const [bookmakersLoading, setBookmakersLoading] = useState<boolean>(true);
  
  // Error states
  const [puntersError, setPuntersError] = useState<string | null>(null);
  const [codesError, setCodesError] = useState<string | null>(null);
  const [bookmakersError, setBookmakersError] = useState<string | null>(null);
  
  // Data states
  const [punters, setPunters] = useState<Punter[]>([]);
  const [bettingCodes, setBettingCodes] = useState<BettingCode[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'punters' | 'codes' | 'bookmakers'>('punters');

  // Search states
  const [puntersSearch, setPuntersSearch] = useState<string>("");
  const [codesSearch, setCodesSearch] = useState<string>("");
  const [bookmakersSearch, setBookmakersSearch] = useState<string>("");
  
  // Favorites
  const [favoritePunters, setFavoritePunters] = useState<number[]>([]);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [favoriteBookmakers, setFavoriteBookmakers] = useState<number[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const favoritePuntersFromStorage = localStorage.getItem("favoritePunters");
    const savedCodesFromStorage = localStorage.getItem("savedBettingCodes");
    const favoriteBookmakersFromStorage = localStorage.getItem("favoriteBookmakers");
    
    if (favoritePuntersFromStorage) {
      setFavoritePunters(JSON.parse(favoritePuntersFromStorage));
    }
    if (savedCodesFromStorage) {
      setSavedCodes(JSON.parse(savedCodesFromStorage));
    }
    if (favoriteBookmakersFromStorage) {
      setFavoriteBookmakers(JSON.parse(favoriteBookmakersFromStorage));
    }
  }, []);

  // Fetch punters
  const fetchPunters = useCallback(async () => {
    try {
      setPuntersLoading(true);
      setPuntersError(null);
      console.log('🔄 Fetching punters...');
      
      const puntersData = await getPuntersArray(20, 0);
      console.log('✅ Punters fetched:', puntersData);
      setPunters(puntersData);
    } catch (err) {
      console.error('❌ Error fetching punters:', err);
      setPuntersError(`Failed to load punters: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPuntersLoading(false);
    }
  }, []);

  // Fetch betting codes
  const fetchBettingCodes = useCallback(async () => {
    try {
      setCodesLoading(true);
      setCodesError(null);
      console.log('🔄 Fetching betting codes...');
      
      const codesData = await getLatestBettingCodes(20, 0);
      console.log('✅ Betting codes fetched:', codesData);
      setBettingCodes(codesData);
    } catch (err) {
      console.error('❌ Error fetching betting codes:', err);
      setCodesError(`Failed to load betting codes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCodesLoading(false);
    }
  }, []);

  // Fetch bookmakers
  const fetchBookmakers = useCallback(async () => {
    try {
      setBookmakersLoading(true);
      setBookmakersError(null);
      console.log('🔄 Fetching bookmakers...');
      
      const bookmakersData = await getBookmakersArray(20, 0);
      console.log('✅ Bookmakers fetched:', bookmakersData);
      setBookmakers(bookmakersData);
    } catch (err) {
      console.error('❌ Error fetching bookmakers:', err);
      setBookmakersError(`Failed to load bookmakers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBookmakersLoading(false);
    }
  }, []);

  // Fetch all data on component mount
  useEffect(() => {
    fetchPunters();
    fetchBettingCodes();
    fetchBookmakers();
  }, [fetchPunters, fetchBettingCodes, fetchBookmakers]);

  // Toggle functions
  const toggleFavoritePunter = useCallback((punterId: number) => {
    setFavoritePunters(prev => {
      const newFavorites = prev.includes(punterId)
        ? prev.filter(id => id !== punterId)
        : [...prev, punterId];
      localStorage.setItem("favoritePunters", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const toggleSavedCode = useCallback((code: string) => {
    setSavedCodes(prev => {
      const newSaved = prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code];
      localStorage.setItem("savedBettingCodes", JSON.stringify(newSaved));
      return newSaved;
    });
  }, []);

  const toggleFavoriteBookmaker = useCallback((bookmakerId: number) => {
    setFavoriteBookmakers(prev => {
      const newFavorites = prev.includes(bookmakerId)
        ? prev.filter(id => id !== bookmakerId)
        : [...prev, bookmakerId];
      localStorage.setItem("favoriteBookmakers", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // Filter functions
  const filteredPunters = punters.filter(punter => {
    if (!puntersSearch) return true;
    const query = puntersSearch.toLowerCase();
    return (
      punter.name.toLowerCase().includes(query) ||
      (punter.nickname && punter.nickname.toLowerCase().includes(query)) ||
      punter.country.toLowerCase().includes(query) ||
      (punter.specialty && punter.specialty.toLowerCase().includes(query))
    );
  });

  const filteredCodes = bettingCodes.filter(code => {
    if (!codesSearch) return true;
    const query = codesSearch.toLowerCase();
    return (
      code.code.toLowerCase().includes(query) ||
      code.punter_name.toLowerCase().includes(query) ||
      (code.bookmaker_name && code.bookmaker_name.toLowerCase().includes(query))
    );
  });

  const filteredBookmakers = bookmakers.filter(bookmaker => {
    if (!bookmakersSearch) return true;
    const query = bookmakersSearch.toLowerCase();
    return (
      bookmaker.name.toLowerCase().includes(query) ||
      bookmaker.country.toLowerCase().includes(query) ||
      (bookmaker.description && bookmaker.description.toLowerCase().includes(query))
    );
  });

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "won": return "success";
      case "lost": return "error";
      case "void": return "outline";
      default: return "warning";
    }
  };

  // Refresh all data
  const refreshAllData = () => {
    fetchPunters();
    fetchBettingCodes();
    fetchBookmakers();
  };

  // Get current search and data based on active tab
  const getCurrentSearch = () => {
    switch (activeTab) {
      case 'punters': return puntersSearch;
      case 'codes': return codesSearch;
      case 'bookmakers': return bookmakersSearch;
      default: return '';
    }
  };

  const setCurrentSearch = (value: string) => {
    switch (activeTab) {
      case 'punters': setPuntersSearch(value); break;
      case 'codes': setCodesSearch(value); break;
      case 'bookmakers': setBookmakersSearch(value); break;
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'punters': return puntersLoading;
      case 'codes': return codesLoading;
      case 'bookmakers': return bookmakersLoading;
      default: return false;
    }
  };

  const getCurrentError = () => {
    switch (activeTab) {
      case 'punters': return puntersError;
      case 'codes': return codesError;
      case 'bookmakers': return bookmakersError;
      default: return null;
    }
  };

  const refreshCurrentTab = () => {
    switch (activeTab) {
      case 'punters': fetchPunters(); break;
      case 'codes': fetchBettingCodes(); break;
      case 'bookmakers': fetchBookmakers(); break;
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'punters' as const,
      label: 'Expert Punters',
      icon: <Crown size={16} />,
      count: filteredPunters.length
    },
    {
      id: 'codes' as const,
      label: 'Betting Codes',
      icon: <Zap size={16} />,
      count: filteredCodes.length
    },
    {
      id: 'bookmakers' as const,
      label: 'Bookmakers',
      icon: <Building size={16} />,
      count: filteredBookmakers.length
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Betting Experts</h1>
          <p className="text-sm text-[#A1A1AA]">
            Discover punters, betting codes, and bookmakers all in one place
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#A1A1AA]" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={getCurrentSearch()}
              onChange={(e) => setCurrentSearch(e.target.value)}
              className="pl-8 pr-3 py-2 bg-[#1A1A27] border border-[#2A2A3C] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F5A623] focus:border-[#F5A623] w-48"
            />
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCurrentTab}
            disabled={getCurrentLoading()}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={getCurrentLoading() ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <Card className="bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg">
        {/* Tab Headers */}
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-1 bg-[#2A2A3C]/20 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#F5A623] text-black'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#2A2A3C]/30'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-black' : 'text-[#F5A623]'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge
                      variant={activeTab === tab.id ? "secondary" : "outline"}
                      className={`ml-1 text-xs ${
                        activeTab === tab.id ? 'bg-black/20 text-black' : ''
                      }`}
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        {/* Tab Content */}
        <CardContent className="p-4 pt-0">
          {/* Error message */}
          {getCurrentError() && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-500 font-medium">Error Loading {activeTab}</p>
                <p className="text-xs text-[#A1A1AA]">{getCurrentError()}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {getCurrentLoading() ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623] mb-4"></div>
              <p className="text-[#A1A1AA]">Loading {activeTab}...</p>
            </div>
          ) : (
            <>
              {/* Punters Tab Content */}
              {activeTab === 'punters' && (
                <>
                  {filteredPunters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredPunters.slice(0, 12).map((punter) => (
                        <div key={punter.id} className="bg-[#2A2A3C]/20 rounded-lg p-4 border border-[#2A2A3C]/30 hover:border-[#F5A623]/30 transition-all duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-[#F5A623]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                {punter.image_url ? (
                                  <img
                                    src={punter.image_url}
                                    alt={punter.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <User size={16} className={`text-[#F5A623] ${punter.image_url ? 'hidden' : ''}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <h4 className="font-semibold text-sm truncate">{punter.name}</h4>
                                  {punter.verified && <Award size={12} className="text-[#F5A623] flex-shrink-0" />}
                                </div>
                                {punter.nickname && (
                                  <p className="text-xs text-[#A1A1AA] truncate">@{punter.nickname}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={() => toggleFavoritePunter(punter.id)}
                            >
                              <Star size={14} className={favoritePunters.includes(punter.id) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#A1A1AA]'} />
                            </Button>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
                              <MapPin size={10} />
                              <span>{punter.country}</span>
                            </div>
                            {punter.specialty && (
                              <div className="flex items-center gap-1 text-xs">
                                <TrendingUp size={10} className="text-[#F5A623]" />
                                <span className="text-[#A1A1AA]">{punter.specialty}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-[#F5A623]">
                                {punter.success_rate ? `${punter.success_rate.toFixed(1)}%` : 'N/A'}
                              </div>
                              <div className="text-xs text-[#A1A1AA]">Success Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-[#F5A623]">
                                {punter.popularity || 0}
                              </div>
                              <div className="text-xs text-[#A1A1AA]">Popularity</div>
                            </div>
                          </div>

                          {punter.bio && (
                            <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-3">
                              {punter.bio}
                            </p>
                          )}

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
                                  <ExternalLink size={12} />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
                      <div className="text-6xl mb-4">👑</div>
                      <h3 className="text-lg font-semibold mb-2">No Punters Found</h3>
                      <p className="text-[#A1A1AA]">
                        {puntersSearch ? 'No punters match your search criteria.' : 'Expert punters will appear here once they join our platform.'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Betting Codes Tab Content */}
              {activeTab === 'codes' && (
                <>
                  {filteredCodes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#2A2A3C]/30 text-left">
                            <th className="p-3 text-sm font-medium">Code</th>
                            <th className="p-3 text-sm font-medium">Punter</th>
                            <th className="p-3 text-sm font-medium">Bookmaker</th>
                            <th className="p-3 text-sm font-medium">Odds</th>
                            <th className="p-3 text-sm font-medium">Status</th>
                            <th className="p-3 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCodes.slice(0, 15).map((code) => (
                            <tr key={code.id} className="border-b border-[#2A2A3C]/10 hover:bg-[#2A2A3C]/10">
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{code.code}</span>
                                  <CopyButton
                                    text={code.code}
                                    successMessage="Copied!"
                                    className="text-xs"
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-sm">{code.punter_name}</td>
                              <td className="p-3 text-sm">{code.bookmaker_name || 'N/A'}</td>
                              <td className="p-3 text-sm">{code.odds ? code.odds.toFixed(2) : 'N/A'}</td>
                              <td className="p-3 text-sm">
                                <Badge
                                  variant={getStatusVariant(code.status)}
                                  className="text-xs px-2 py-1 uppercase"
                                >
                                  {code.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto"
                                  onClick={() => toggleSavedCode(code.code)}
                                >
                                  {savedCodes.includes(code.code) ? (
                                    <BookmarkCheck size={16} className="text-[#F5A623]" />
                                  ) : (
                                    <Bookmark size={16} className="text-[#A1A1AA]" />
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
                      <div className="text-6xl mb-4">⚡</div>
                      <h3 className="text-lg font-semibold mb-2">No Betting Codes Found</h3>
                      <p className="text-[#A1A1AA]">
                        {codesSearch ? 'No betting codes match your search criteria.' : 'Betting codes from our punters will appear here.'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Bookmakers Tab Content */}
              {activeTab === 'bookmakers' && (
                <>
                  {filteredBookmakers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredBookmakers.slice(0, 12).map((bookmaker) => (
                        <div key={bookmaker.id} className="bg-[#2A2A3C]/20 rounded-lg p-4 border border-[#2A2A3C]/30 hover:border-[#F5A623]/30 transition-all duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-[#F5A623]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                {bookmaker.logo_url ? (
                                  <img
                                    src={bookmaker.logo_url}
                                    alt={bookmaker.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <Building2 size={16} className={`text-[#F5A623] ${bookmaker.logo_url ? 'hidden' : ''}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{bookmaker.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
                                  <MapPin size={10} />
                                  <span className="truncate">{bookmaker.country}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={() => toggleFavoriteBookmaker(bookmaker.id)}
                            >
                              <Star size={14} className={favoriteBookmakers.includes(bookmaker.id) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#A1A1AA]'} />
                            </Button>
                          </div>

                          {bookmaker.description && (
                            <p className="text-xs text-[#A1A1AA] line-clamp-3 mb-3">
                              {bookmaker.description}
                            </p>
                          )}

                          {bookmaker.website && (
                            <div className="flex justify-center">
                              <a
                                href={bookmaker.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-[#F5A623] hover:text-[#F5A623]/80 transition-colors"
                              >
                                <Globe size={12} />
                                Visit Website
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          )}

                          <div className="text-xs text-[#A1A1AA] text-center mt-3 pt-3 border-t border-[#2A2A3C]/30">
                            Added {formatDate(new Date(bookmaker.created_at))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#1A1A27]/30 rounded-xl border border-[#2A2A3C]/10">
                      <div className="text-6xl mb-4">🏢</div>
                      <h3 className="text-lg font-semibold mb-2">No Bookmakers Found</h3>
                      <p className="text-[#A1A1AA]">
                        {bookmakersSearch ? 'No bookmakers match your search criteria.' : 'Bookmaker information will appear here.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertsPage;
