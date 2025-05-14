import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import type { Prediction, BookmakerType } from "../../types";
import { formatDate } from "../../lib/utils";
import { Calendar, Trophy, Copy, ChevronDown, ChevronUp, Check, ExternalLink, Bookmark, BookmarkCheck, CheckSquare, Square, MoreHorizontal, Twitter, Instagram, Send } from "lucide-react";
import CopyButton from "../common/CopyButton";
import { Button } from "../common/Button";
import { useBreakpoints } from "../../hooks/useMediaQuery";

interface GameCodeCardProps {
  gameCode: string;
  predictions: Prediction[];
  bookmaker: string | BookmakerType;
  date: Date;
  isSaved?: boolean;
  isSelected?: boolean;
  onToggleSave?: (code: string) => void;
  onToggleSelect?: (code: string) => void;
  showSuccessRate?: boolean;
  showSelectionCheckbox?: boolean;
}

const GameCodeCard: React.FC<GameCodeCardProps> = ({
  gameCode,
  predictions,
  bookmaker,
  date,
  isSaved = false,
  isSelected = false,
  onToggleSave,
  onToggleSelect,
  showSuccessRate = true,
  showSelectionCheckbox = false
}) => {
  const [showAllGames, setShowAllGames] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(isSaved);
  const [selected, setSelected] = useState(isSelected);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isMobile, isTablet } = useBreakpoints();

  // Calculate total odds - use multiplication for accumulative odds
  const totalOdds = predictions.reduce((product, pred) => product * (pred.odds || 1), 1);

  // Count sports with null checks
  const sportCounts = predictions.reduce((counts, pred) => {
    const sport = pred?.game?.sport || "unknown";
    counts[sport] = (counts[sport] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  // Get primary sport (most common)
  const primarySport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "mixed";

  // Calculate win rate if any games are completed
  const completedGames = predictions.filter(p => p?.status === "won" || p?.status === "lost");
  const wonGames = predictions.filter(p => p?.status === "won");
  const winRate = completedGames.length > 0
    ? Math.round((wonGames.length / completedGames.length) * 100)
    : null;

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    if (onToggleSave) {
      onToggleSave(gameCode);
    }
  };

  // Handle selection toggle
  const handleSelectionToggle = () => {
    const newSelected = !selected;
    setSelected(newSelected);
    if (onToggleSelect) {
      onToggleSelect(gameCode);
    }
  };

  // Function to copy all game details
  const copyAllGameDetails = () => {
    // Format the game details with better structure
    const gameDetails = predictions.map((pred, index) => {
      const homeTeamObj = pred?.game?.homeTeam;
      const awayTeamObj = pred?.game?.awayTeam;
      const homeTeam = typeof homeTeamObj === 'string' ? homeTeamObj : (homeTeamObj?.name || "Unknown");
      const awayTeam = typeof awayTeamObj === 'string' ? awayTeamObj : (awayTeamObj?.name || "Unknown");
      const predType = pred?.predictionType || "Unknown";
      const odds = pred?.odds?.toFixed(2) || "0.00";
      const league = pred?.game?.league || "Unknown League";

      return `${index + 1}. ${homeTeam} vs ${awayTeam} - ${predType} (${odds}x) - ${league}`;
    }).join('\n');

    // Create a well-formatted text block
    const fullText = `
=== GAME CODE: ${gameCode} ===
Bookmaker: ${bookmaker.toUpperCase()}
${predictions[0]?.punter ? `Punter: ${predictions[0].punter.name}` : ''}
Date: ${formatDate(date)}
Total Odds: ${totalOdds.toFixed(2)}x
Sports: ${Object.entries(sportCounts).map(([sport, count]) => `${sport} (${count})`).join(', ')}

GAMES:
${gameDetails}

Shared from BetSightly - Your Trusted Prediction Platform
`.trim();

    // Copy to clipboard with better error handling and feedback
    navigator.clipboard.writeText(fullText)
      .then(() => {
        setCopySuccess(true);
        // Show a toast or notification
        setTimeout(() => setCopySuccess(false), 2000);

        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = `Game details for code ${gameCode} copied to clipboard`;
        document.body.appendChild(announcement);

        // Remove the announcement after it's been read
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 3000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback method for browsers that don't support clipboard API
        try {
          const textArea = document.createElement('textarea');
          textArea.value = fullText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy method failed:', fallbackErr);
          alert('Could not copy to clipboard. Please try again or copy manually.');
        }
      });
  };

  return (
    <Card className="w-full bg-[#1A1A27]/80 border border-[#2A2A3C]/20 shadow-lg overflow-hidden hover:border-[#F5A623]/30 transition-colors">
      {/* Enhanced Header with Prominent Game Code */}
      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-[#1A1A27] to-[#2A2A3C]/50">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {showSelectionCheckbox && (
                  <button
                    onClick={handleSelectionToggle}
                    className="p-1 rounded-full hover:bg-[#2A2A3C]/30 transition-colors"
                    title={selected ? "Deselect this code" : "Select this code"}
                  >
                    {selected ? (
                      <CheckSquare size={16} className="text-[#F5A623]" />
                    ) : (
                      <Square size={16} className="text-[#A1A1AA] hover:text-[#F5A623]" />
                    )}
                  </button>
                )}

                <Badge
                  variant={primarySport === "soccer" ? "info" : "warning"}
                  className="text-xs px-1.5 py-0.5"
                >
                  {typeof bookmaker === 'string' ? bookmaker.toUpperCase() : bookmaker}
                </Badge>

                {showSuccessRate && winRate !== null && (
                  <Badge
                    variant={winRate > 50 ? "success" : "danger"}
                    className="text-xs px-2 py-0.5"
                  >
                    {winRate}% Win
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleBookmarkToggle}
                  className="p-1 rounded-full hover:bg-[#2A2A3C]/30 transition-colors"
                  title={isBookmarked ? "Remove from saved codes" : "Save this code"}
                >
                  {isBookmarked ? (
                    <BookmarkCheck size={16} className="text-[#F5A623]" />
                  ) : (
                    <Bookmark size={16} className="text-[#A1A1AA] hover:text-[#F5A623]" />
                  )}
                </button>
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-1 rounded-full hover:bg-[#2A2A3C]/30 transition-colors md:hidden"
                  title="More options"
                >
                  <MoreHorizontal size={16} className="text-[#A1A1AA]" />
                </button>
              </div>
            </div>

            {/* Prominent Game Code with Copy Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 bg-[#2A2A3C]/30 p-2 rounded-md border border-[#F5A623]/20">
              <div className="flex flex-col mb-2 sm:mb-0">
                <CardTitle className="text-base mr-2 premium-text font-mono tracking-wider">{gameCode}</CardTitle>
                {predictions[0]?.punter && (
                  <div className="mt-1">
                    <div className="text-xs text-[#A1A1AA] flex items-center">
                      <Trophy size={10} className="mr-1 text-[#F5A623]" />
                      <span>By: <span className="text-[#F5A623]">{predictions[0].punter.name}</span></span>
                    </div>

                    {/* Social Media Links */}
                    {predictions[0].punter.socialMedia && (
                      <div className="flex gap-1 mt-1">
                        {predictions[0].punter.socialMedia.twitter && (
                          <a
                            href={predictions[0].punter.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-full transition-colors"
                            title="Twitter"
                          >
                            <Twitter size={12} />
                          </a>
                        )}
                        {predictions[0].punter.socialMedia.instagram && (
                          <a
                            href={predictions[0].punter.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 text-[#E1306C] rounded-full transition-colors"
                            title="Instagram"
                          >
                            <Instagram size={12} />
                          </a>
                        )}
                        {predictions[0].punter.socialMedia.telegram && (
                          <a
                            href={predictions[0].punter.socialMedia.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] rounded-full transition-colors"
                            title="Telegram"
                          >
                            <Send size={12} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <CopyButton
                  text={gameCode}
                  successMessage="Code copied!"
                  className="bg-[#F5A623]/10 hover:bg-[#F5A623]/20 text-[#F5A623] p-1 rounded-md transition-colors"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-0.5 h-auto border-[#F5A623]/30 hover:bg-[#F5A623]/10"
                  onClick={() => window.open(`https://${bookmaker.toLowerCase()}.com/search?query=${gameCode}`, '_blank')}
                >
                  <ExternalLink size={12} className={isMobile ? "" : "mr-1"} />
                  {!isMobile && <span>Open</span>}
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="mt-2 p-2 bg-[#2A2A3C]/50 rounded-md border border-[#2A2A3C]/20 md:hidden">
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto border-[#2A2A3C] hover:bg-[#2A2A3C]/20 justify-start"
                    onClick={copyAllGameDetails}
                  >
                    <Copy size={14} className="mr-1.5" />
                    <span>Copy All Details</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto border-[#2A2A3C] hover:bg-[#2A2A3C]/20 justify-start"
                    onClick={() => window.open(`https://${bookmaker.toLowerCase()}.com/search?query=${gameCode}`, '_blank')}
                  >
                    <ExternalLink size={14} className="mr-1.5" />
                    <span>Open on {bookmaker}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-xs text-[#A1A1AA]">
            <Calendar size={12} className="mr-1" />
            {formatDate(date)}
          </div>

          <div className="flex items-center text-xs">
            <Trophy size={12} className="mr-1 text-[#F5A623]" />
            <span className="font-medium premium-text">{totalOdds.toFixed(2)}x</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(sportCounts).map(([sport, count]) => (
            <Badge
              key={sport}
              variant="outline"
              className="text-xs px-1.5 py-0.5"
            >
              {sport.charAt(0).toUpperCase() + sport.slice(1)}: {count}
            </Badge>
          ))}

          <Badge
            variant="outline"
            className="text-xs px-1.5 py-0.5"
          >
            {predictions.length} Games
          </Badge>
        </div>

        {/* Game list (compact) with "Copy All" button */}
        <div className="mt-3 pt-3 border-t border-[#2A2A3C]/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div className="text-xs font-medium">Games in this code:</div>

            {/* Enhanced Copy All Button */}
            <Button
              variant={copySuccess ? "default" : "outline"}
              size="sm"
              onClick={copyAllGameDetails}
              className={`text-xs px-3 py-1 h-auto w-full sm:w-auto ${
                copySuccess
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/10"
              }`}
            >
              <div className="flex items-center justify-center w-full">
                {copySuccess ? (
                  <>
                    <Check size={14} className="mr-1.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1.5" />
                    <span>{isMobile ? "Copy All" : "Copy All Game Details"}</span>
                  </>
                )}
              </div>
            </Button>
          </div>

          {/* Enhanced Streamlined game list */}
          <div className="bg-[#1A1A27]/50 rounded-md border border-[#2A2A3C]/20 overflow-hidden">
            <div className={`${!showAllGames && predictions.length > 5 ? "max-h-[200px] overflow-y-auto" : ""}`}>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full text-xs">
                  <thead className="bg-[#2A2A3C]/30">
                    <tr>
                      <th className="py-1.5 px-2 text-left font-medium text-[#A1A1AA]">#</th>
                      <th className="py-1.5 px-2 text-left font-medium text-[#A1A1AA]">Match</th>
                      <th className="py-1.5 px-2 text-left font-medium text-[#A1A1AA]">Prediction</th>
                      <th className="py-1.5 px-2 text-right font-medium text-[#A1A1AA]">Odds</th>
                      <th className="py-1.5 px-2 text-center font-medium text-[#A1A1AA]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllGames ? predictions : predictions.slice(0, 5)).map((prediction, index) => {
                      // Null checks for prediction data
                      const homeTeamObj = prediction?.game?.homeTeam;
                      const awayTeamObj = prediction?.game?.awayTeam;
                      const homeTeam = typeof homeTeamObj === 'string' ? homeTeamObj : (homeTeamObj?.name || "Unknown");
                      const awayTeam = typeof awayTeamObj === 'string' ? awayTeamObj : (awayTeamObj?.name || "Unknown");
                      const odds = prediction?.odds?.toFixed(2) || "0.00";
                      const status = prediction?.status || "pending";
                      const predType = prediction?.predictionType || "Unknown";

                      return (
                        <tr
                          key={`desktop-${index}`}
                          className="border-b border-[#2A2A3C]/10 last:border-0 hover:bg-[#2A2A3C]/10 transition-colors"
                        >
                          <td className="py-1.5 px-2 text-[#A1A1AA]">{index + 1}</td>
                          <td className="py-1.5 px-2 truncate max-w-[120px]">
                            {homeTeam} vs {awayTeam}
                          </td>
                          <td className="py-1.5 px-2 truncate max-w-[80px]">{predType}</td>
                          <td className="py-1.5 px-2 text-right font-medium">
                            <span className={`${
                              status === "won" ? "text-green-500" :
                              status === "lost" ? "text-red-500" :
                              "text-[#F5A623]"
                            }`}>
                              {odds}x
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <div className="inline-flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                status === "won" ? "bg-green-500" :
                                status === "lost" ? "bg-red-500" :
                                "bg-[#F5A623]"
                              }`}></div>
                              <span className={`text-xs ${
                                status === "won" ? "text-green-500" :
                                status === "lost" ? "text-red-500" :
                                "text-[#F5A623]"
                              }`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {(showAllGames ? predictions : predictions.slice(0, 5)).map((prediction, index) => {
                  // Null checks for prediction data
                  const homeTeamObj = prediction?.game?.homeTeam;
                  const awayTeamObj = prediction?.game?.awayTeam;
                  const homeTeam = typeof homeTeamObj === 'string' ? homeTeamObj : (homeTeamObj?.name || "Unknown");
                  const awayTeam = typeof awayTeamObj === 'string' ? awayTeamObj : (awayTeamObj?.name || "Unknown");
                  const odds = prediction?.odds?.toFixed(2) || "0.00";
                  const status = prediction?.status || "pending";
                  const predType = prediction?.predictionType || "Unknown";

                  return (
                    <div
                      key={`mobile-${index}`}
                      className="p-2 border-b border-[#2A2A3C]/10 last:border-0"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-[#A1A1AA] text-xs mr-2">{index + 1}.</span>
                          <span className="font-medium text-xs">{homeTeam} vs {awayTeam}</span>
                        </div>
                        <div className={`text-xs font-medium ${
                          status === "won" ? "text-green-500" :
                          status === "lost" ? "text-red-500" :
                          "text-[#F5A623]"
                        }`}>
                          {odds}x
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-[#A1A1AA]">{predType}</div>
                        <div className="inline-flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            status === "won" ? "bg-green-500" :
                            status === "lost" ? "bg-red-500" :
                            "bg-[#F5A623]"
                          }`}></div>
                          <span className={`text-xs ${
                            status === "won" ? "text-green-500" :
                            status === "lost" ? "text-red-500" :
                            "text-[#F5A623]"
                          }`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Show more/less button for games */}
          {predictions.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllGames(!showAllGames)}
              className="w-full mt-3 text-xs h-auto py-1.5 border-[#2A2A3C] hover:bg-[#2A2A3C]/20"
            >
              <div className="flex items-center justify-center w-full">
                {showAllGames ? (
                  <>
                    <ChevronUp size={14} className="mr-1.5" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} className="mr-1.5" />
                    <span>Show All {predictions.length} Games</span>
                  </>
                )}
              </div>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCodeCard;




