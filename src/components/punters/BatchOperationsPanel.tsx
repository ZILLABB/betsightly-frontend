import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Copy, Download, Share2, Trash2, CheckSquare, Square, Filter } from 'lucide-react';
import type { Prediction } from '../../types';
import { formatDate } from '../../lib/utils';

interface BatchOperationsPanelProps {
  selectedCodes: string[];
  allGameCodes: Record<string, Prediction[]>;
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalCodes: number;
}

const BatchOperationsPanel: React.FC<BatchOperationsPanelProps> = ({
  selectedCodes,
  allGameCodes,
  onClearSelection,
  onSelectAll,
  totalCodes
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Copy all selected game codes
  const copySelectedCodes = () => {
    if (selectedCodes.length === 0) return;

    const textToCopy = selectedCodes.join('\n');
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback method
        try {
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
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

  // Copy all selected game details
  const copySelectedDetails = () => {
    if (selectedCodes.length === 0) return;

    const detailsText = selectedCodes.map(code => {
      const predictions = allGameCodes[code] || [];
      const bookmaker = predictions[0]?.bookmaker || 'Unknown';
      const date = predictions[0]?.game?.startTime ? new Date(predictions[0].game.startTime) : new Date();
      const totalOdds = predictions.reduce((product, pred) => product * (pred.odds || 1), 1);
      
      // Format game details
      const gameDetails = predictions.map((pred, index) => {
        const homeTeam = pred?.game?.homeTeam?.name || "Unknown";
        const awayTeam = pred?.game?.awayTeam?.name || "Unknown";
        const predType = pred?.predictionType || "Unknown";
        const odds = pred?.odds?.toFixed(2) || "0.00";
        const league = pred?.game?.league || "Unknown League";
        
        return `  ${index + 1}. ${homeTeam} vs ${awayTeam} - ${predType} (${odds}x) - ${league}`;
      }).join('\n');
      
      return `=== GAME CODE: ${code} ===
Bookmaker: ${bookmaker.toUpperCase()}
Date: ${formatDate(date)}
Total Odds: ${totalOdds.toFixed(2)}x

GAMES:
${gameDetails}
`;
    }).join('\n\n');
    
    const fullText = `${detailsText}\n\nShared from BetSightly - Your Trusted Prediction Platform`;
    
    navigator.clipboard.writeText(fullText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback method
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

  // Export selected codes as CSV
  const exportSelectedAsCSV = () => {
    if (selectedCodes.length === 0) return;
    
    // Create CSV content
    const headers = ['Game Code', 'Bookmaker', 'Date', 'Total Odds', 'Number of Games', 'Win Rate'];
    const rows = selectedCodes.map(code => {
      const predictions = allGameCodes[code] || [];
      const bookmaker = predictions[0]?.bookmaker || 'Unknown';
      const date = predictions[0]?.game?.startTime ? new Date(predictions[0].game.startTime) : new Date();
      const totalOdds = predictions.reduce((product, pred) => product * (pred.odds || 1), 1);
      const numGames = predictions.length;
      
      // Calculate win rate
      const completedGames = predictions.filter(p => p?.status === "won" || p?.status === "lost");
      const wonGames = predictions.filter(p => p?.status === "won");
      const winRate = completedGames.length > 0
        ? Math.round((wonGames.length / completedGames.length) * 100)
        : 'N/A';
      
      return [code, bookmaker, formatDate(date), totalOdds.toFixed(2), numGames, winRate].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `betsightly-game-codes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#1A1A27]/80 p-3 rounded-lg border border-[#2A2A3C]/20 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {selectedCodes.length} selected
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="text-xs px-2 py-1 h-auto"
            title="Select All Codes"
          >
            <CheckSquare size={14} className="mr-1" />
            Select All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="text-xs px-2 py-1 h-auto"
            title="Clear Selection"
            disabled={selectedCodes.length === 0}
          >
            <Square size={14} className="mr-1" />
            Clear
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={copySuccess ? "default" : "outline"}
            size="sm"
            onClick={copySelectedCodes}
            className="text-xs px-2 py-1 h-auto"
            disabled={selectedCodes.length === 0}
          >
            <Copy size={14} className="mr-1" />
            Copy Codes
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copySelectedDetails}
            className="text-xs px-2 py-1 h-auto"
            disabled={selectedCodes.length === 0}
          >
            <Copy size={14} className="mr-1" />
            Copy Details
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportSelectedAsCSV}
            className="text-xs px-2 py-1 h-auto"
            disabled={selectedCodes.length === 0}
          >
            <Download size={14} className="mr-1" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchOperationsPanel;
