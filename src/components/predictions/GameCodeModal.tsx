import React from "react";
import { X } from "lucide-react";
import type { Prediction, BookmakerType } from "../../types";
import { Badge } from "../common/Badge";
import CopyButton from "../common/CopyButton";
import { formatDate } from "../../lib/utils";

interface GameCodeModalProps {
  gameCode: string;
  predictions: Prediction[];
  bookmaker?: BookmakerType;
  isOpen: boolean;
  onClose: () => void;
}

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

const GameCodeModal: React.FC<GameCodeModalProps> = ({
  gameCode,
  predictions,
  bookmaker,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  // Calculate total odds
  const totalOdds = predictions.reduce((sum, p) => sum * p.odds, 1);

  // Count statuses
  const wonCount = predictions.filter(p => p.status === "won").length;
  const lostCount = predictions.filter(p => p.status === "lost").length;
  const pendingCount = predictions.filter(p => p.status === "pending").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="bg-[#1A1A27] rounded-xl border border-[#2A2A3C]/20 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#2A2A3C]/20">
          <div className="flex items-center">
            <h3 className="text-lg font-bold premium-text mr-2">
              {gameCode}
            </h3>
            <CopyButton
              text={gameCode}
              successMessage="Code copied!"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#2A2A3C]/30 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-4 border-b border-[#2A2A3C]/20">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <p className="text-sm text-[#A1A1AA] mb-1">
                Multi-game code with {predictions.length} games
              </p>
              {bookmaker && (
                <div className="flex items-center">
                  <span className="text-xs text-[#A1A1AA] mr-1">Bookmaker:</span>
                  <span className={`text-sm font-medium capitalize ${getBookmakerColor(bookmaker)}`}>
                    {bookmaker}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end">
              <Badge variant="premium" className="mb-1">
                Total Odds: {totalOdds.toFixed(2)}
              </Badge>
              <div className="flex gap-2">
                <Badge variant="success" className="text-xs">
                  {wonCount} Won
                </Badge>
                <Badge variant="danger" className="text-xs">
                  {lostCount} Lost
                </Badge>
                <Badge variant="warning" className="text-xs">
                  {pendingCount} Pending
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Game list */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className="bg-[#1A1A27]/50 p-3 rounded-lg border border-[#2A2A3C]/10"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Badge
                      variant={
                        prediction.status === "won" ? "success" :
                        prediction.status === "lost" ? "danger" :
                        "warning"
                      }
                      className="text-xs px-1.5 py-0.5 uppercase mr-2"
                    >
                      {prediction.status}
                    </Badge>
                    <h4 className="text-sm font-medium">
                      {prediction.game.homeTeam.name} vs {prediction.game.awayTeam.name}
                    </h4>
                  </div>
                  <p className="text-sm font-bold">{prediction.odds.toFixed(2)}x</p>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-[#A1A1AA]">
                    {prediction.game.league} • {formatDate(prediction.game.startTime)}
                  </p>
                  <p className="text-xs font-medium">{prediction.predictionType}</p>
                </div>

                {prediction.description && (
                  <div className="mt-2 pt-2 border-t border-[#2A2A3C]/10">
                    <p className="text-xs text-[#A1A1AA]">{prediction.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A3C]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2A2A3C]/30 hover:bg-[#2A2A3C]/50 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCodeModal;
