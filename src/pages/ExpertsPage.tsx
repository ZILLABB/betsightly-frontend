import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import CopyButton from "../components/common/CopyButton";
import ExpertDashboard from "../components/experts/ExpertDashboard";
import { getPuntersArray, Punter } from "../services/punterService";
import { getLatestBettingCodes, BettingCode } from "../services/bettingCodeService";
import { getBookmakersArray, Bookmaker } from "../services/bookmakerService";
import { mockPunters } from "../data/mockData";
import { formatDate } from "../lib/utils";
import { pageVariants } from "../utils/animations";
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
  Zap,
  Sparkles,
  Target
} from "lucide-react";

const ExpertsPage: React.FC = () => {
  // Main state - use mock data directly since we're not running backend
  const [experts, setExperts] = useState<Punter[]>(mockPunters);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Legacy states for betting codes and bookmakers tabs
  const [bettingCodes, setBettingCodes] = useState<BettingCode[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [codesLoading, setCodesLoading] = useState<boolean>(true);
  const [bookmakersLoading, setBookmakersLoading] = useState<boolean>(true);
  const [codesError, setCodesError] = useState<string | null>(null);
  const [bookmakersError, setBookmakersError] = useState<string | null>(null);

  // Tab state - default to experts for the beautiful new interface
  const [activeTab, setActiveTab] = useState<'experts' | 'codes' | 'bookmakers'>('experts');

  // Search states for legacy tabs
  const [codesSearch, setCodesSearch] = useState<string>("");
  const [bookmakersSearch, setBookmakersSearch] = useState<string>("");

  // Favorites
  const [favoriteExperts, setFavoriteExperts] = useState<number[]>([]);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [favoriteBookmakers, setFavoriteBookmakers] = useState<number[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const favoriteExpertsFromStorage = localStorage.getItem("favoriteExperts");
    const savedCodesFromStorage = localStorage.getItem("savedBettingCodes");
    const favoriteBookmakersFromStorage = localStorage.getItem("favoriteBookmakers");

    if (favoriteExpertsFromStorage) {
      setFavoriteExperts(JSON.parse(favoriteExpertsFromStorage));
    }
    if (savedCodesFromStorage) {
      setSavedCodes(JSON.parse(savedCodesFromStorage));
    }
    if (favoriteBookmakersFromStorage) {
      setFavoriteBookmakers(JSON.parse(favoriteBookmakersFromStorage));
    }
  }, []);

  // Since we're using mock data, we don't need to fetch experts
  // But we'll keep the fetch functions for betting codes and bookmakers

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

  // Fetch data for legacy tabs on component mount
  useEffect(() => {
    fetchBettingCodes();
    fetchBookmakers();
  }, [fetchBettingCodes, fetchBookmakers]);

  // Toggle functions
  const toggleFavoriteExpert = useCallback((expertId: number) => {
    setFavoriteExperts(prev => {
      const newFavorites = prev.includes(expertId)
        ? prev.filter(id => id !== expertId)
        : [...prev, expertId];
      localStorage.setItem("favoriteExperts", JSON.stringify(newFavorites));
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

  // Filter functions for legacy tabs

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
      id: 'experts' as const,
      label: 'Expert Dashboard',
      icon: <Sparkles size={16} />,
      count: experts.length,
      description: 'Discover top betting experts'
    },
    {
      id: 'codes' as const,
      label: 'Betting Codes',
      icon: <Zap size={16} />,
      count: filteredCodes.length,
      description: 'Latest betting codes'
    },
    {
      id: 'bookmakers' as const,
      label: 'Bookmakers',
      icon: <Building size={16} />,
      count: filteredBookmakers.length,
      description: 'Trusted bookmakers'
    }
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1A1A27] via-[#1A1A27] to-[#0F0F1A] border border-amber-500/20 rounded-2xl p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Crown className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Betting Experts Hub
              </h1>
              <p className="text-lg text-white/70">
                Connect with top-tier betting experts, access exclusive codes, and discover trusted bookmakers
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-black/20 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{experts.length}</div>
              <div className="text-sm text-white/60">Expert Analysts</div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-blue-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {experts.filter(e => e.verified).length}
              </div>
              <div className="text-sm text-white/60">Verified Experts</div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {(experts.reduce((sum, e) => sum + (e.success_rate || 0), 0) / experts.length).toFixed(1)}%
              </div>
              <div className="text-sm text-white/60">Avg Success Rate</div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">24/7</div>
              <div className="text-sm text-white/60">Live Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-[#1A1A27] border border-amber-500/20 rounded-xl p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-lg text-left transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg'
                  : 'bg-[#0F0F1A] border border-amber-500/10 text-white hover:border-amber-500/30 hover:bg-amber-500/5'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-black/20'
                    : 'bg-amber-500/10'
                }`}>
                  <span className={activeTab === tab.id ? 'text-black' : 'text-amber-500'}>
                    {tab.icon}
                  </span>
                </div>
                <div>
                  <h3 className={`font-semibold ${
                    activeTab === tab.id ? 'text-black' : 'text-white'
                  }`}>
                    {tab.label}
                  </h3>
                  <p className={`text-sm ${
                    activeTab === tab.id ? 'text-black/70' : 'text-white/60'
                  }`}>
                    {tab.description}
                  </p>
                </div>
              </div>

              {tab.count > 0 && (
                <Badge
                  className={`absolute top-2 right-2 ${
                    activeTab === tab.id
                      ? 'bg-black/20 text-black border-black/20'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {tab.count}
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[600px]">

        {/* Experts Dashboard Tab */}
        {activeTab === 'experts' && (
          <ExpertDashboard
            experts={experts}
            onExpertSelect={(expert) => {
              console.log('Selected expert:', expert);
            }}
            onFavoriteToggle={toggleFavoriteExpert}
            favoriteExperts={favoriteExperts}
          />
        )}

        {/* Legacy Tabs with Error Handling */}
        {(activeTab === 'codes' || activeTab === 'bookmakers') && (
          <Card className="bg-[#1A1A27] border border-amber-500/20">
            <CardContent className="p-6">
              {/* Error message */}
              {getCurrentError() && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-500 font-medium">Error Loading {activeTab}</p>
                    <p className="text-xs text-white/60">{getCurrentError()}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {getCurrentLoading() ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500/30 border-t-amber-500 mb-4"></div>
                  <p className="text-white/60">Loading {activeTab}...</p>
                </div>
              ) : (
                <>
                  {/* Betting Codes Tab Content */}
                  {activeTab === 'codes' && (
                    <>
                      {/* Search for codes */}
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Search betting codes..."
                            value={codesSearch}
                            onChange={(e) => setCodesSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#0F0F1A] border border-amber-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                        </div>
                      </div>

                      {filteredCodes.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-[#0F0F1A] border-b border-amber-500/20">
                                <th className="p-4 text-left text-sm font-medium text-amber-400">Code</th>
                                <th className="p-4 text-left text-sm font-medium text-amber-400">Expert</th>
                                <th className="p-4 text-left text-sm font-medium text-amber-400">Bookmaker</th>
                                <th className="p-4 text-left text-sm font-medium text-amber-400">Odds</th>
                                <th className="p-4 text-left text-sm font-medium text-amber-400">Status</th>
                                <th className="p-4 text-left text-sm font-medium text-amber-400">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredCodes.slice(0, 15).map((code) => (
                                <tr key={code.id} className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                        {code.code}
                                      </span>
                                      <CopyButton
                                        text={code.code}
                                        successMessage="Code copied!"
                                        className="text-xs"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-4 text-sm text-white">{code.punter_name}</td>
                                  <td className="p-4 text-sm text-white/70">{code.bookmaker_name || 'N/A'}</td>
                                  <td className="p-4">
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                      {code.odds ? code.odds.toFixed(2) : 'N/A'}
                                    </Badge>
                                  </td>
                                  <td className="p-4">
                                    <Badge
                                      variant={getStatusVariant(code.status)}
                                      className="text-xs px-2 py-1 uppercase"
                                    >
                                      {code.status}
                                    </Badge>
                                  </td>
                                  <td className="p-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="p-2 h-auto hover:bg-amber-500/10"
                                      onClick={() => toggleSavedCode(code.code)}
                                    >
                                      {savedCodes.includes(code.code) ? (
                                        <BookmarkCheck size={16} className="text-amber-500" />
                                      ) : (
                                        <Bookmark size={16} className="text-white/60" />
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-[#0F0F1A] rounded-xl border border-amber-500/10">
                          <div className="text-6xl mb-4">⚡</div>
                          <h3 className="text-lg font-semibold text-white mb-2">No Betting Codes Found</h3>
                          <p className="text-white/60">
                            {codesSearch ? 'No betting codes match your search criteria.' : 'Betting codes from our experts will appear here.'}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Bookmakers Tab Content */}
                  {activeTab === 'bookmakers' && (
                    <>
                      {/* Search for bookmakers */}
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Search bookmakers..."
                            value={bookmakersSearch}
                            onChange={(e) => setBookmakersSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#0F0F1A] border border-amber-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                        </div>
                      </div>

                      {filteredBookmakers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredBookmakers.slice(0, 12).map((bookmaker) => (
                            <motion.div
                              key={bookmaker.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ y: -5 }}
                              className="bg-[#0F0F1A] border border-amber-500/20 rounded-lg p-6 hover:border-amber-500/40 transition-all duration-300"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                    {bookmaker.logo_url ? (
                                      <img
                                        src={bookmaker.logo_url}
                                        alt={bookmaker.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <Building2 size={20} className={`text-amber-500 ${bookmaker.logo_url ? 'hidden' : ''}`} />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-1">{bookmaker.name}</h4>
                                    <div className="flex items-center gap-1 text-xs text-white/60">
                                      <MapPin size={12} />
                                      <span>{bookmaker.country}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 h-auto hover:bg-amber-500/10"
                                  onClick={() => toggleFavoriteBookmaker(bookmaker.id)}
                                >
                                  <Star size={16} className={favoriteBookmakers.includes(bookmaker.id) ? 'fill-amber-500 text-amber-500' : 'text-white/60'} />
                                </Button>
                              </div>

                              {bookmaker.description && (
                                <p className="text-sm text-white/70 line-clamp-3 mb-4">
                                  {bookmaker.description}
                                </p>
                              )}

                              {bookmaker.website && (
                                <div className="flex justify-center">
                                  <a
                                    href={bookmaker.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20 hover:border-amber-500/40"
                                  >
                                    <Globe size={16} />
                                    Visit Website
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              )}

                              <div className="text-xs text-white/50 text-center mt-4 pt-4 border-t border-amber-500/20">
                                Added {formatDate(new Date(bookmaker.created_at))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-[#0F0F1A] rounded-xl border border-amber-500/10">
                          <div className="text-6xl mb-4">🏢</div>
                          <h3 className="text-lg font-semibold text-white mb-2">No Bookmakers Found</h3>
                          <p className="text-white/60">
                            {bookmakersSearch ? 'No bookmakers match your search criteria.' : 'Trusted bookmaker information will appear here.'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default ExpertsPage;
