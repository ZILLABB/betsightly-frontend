import React, { useState } from "react";
import type { GamePrediction, CategoryMeta } from "../../types";
import { Copy, Check, Share2 } from "lucide-react";

interface Props {
  games: GamePrediction[];
  category: CategoryMeta;
  totalOdds: number;
  date: string;
}

/**
 * Generates a shareable text slip for an accumulator.
 */
function generateSlipText(games: GamePrediction[], category: CategoryMeta, totalOdds: number, date: string): string {
  const lines: string[] = [];
  lines.push(`BetSightly ${category.label} Accumulator`);
  lines.push(`${date} | ${category.riskLabel}`);
  lines.push("─".repeat(32));

  for (const g of games) {
    const odds = g.odds ?? g.real_odds ?? g.estimated_odds ?? 0;
    const pred = g.prediction || g.readable_prediction || g.prediction_value || "";
    lines.push(`${g.home_team} vs ${g.away_team}`);
    lines.push(`  ${pred} @ ${odds.toFixed(2)}`);
    lines.push(`  ${g.league} | ${Math.round(g.confidence * 100)}% confidence`);
    lines.push("");
  }

  lines.push("─".repeat(32));
  lines.push(`Total Odds: ${totalOdds.toFixed(2)}x | ${games.length} picks`);
  lines.push("");
  lines.push("Powered by BetSightly AI");

  return lines.join("\n");
}

export function AccumulatorSlip({ games, category, totalOdds, date }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = generateSlipText(games, category, totalOdds, date);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const text = generateSlipText(games, category, totalOdds, date);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BetSightly ${category.label} Accumulator`,
          text,
        });
      } catch {
        // User cancelled share — fine
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={handleCopy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 8,
          border: `1px solid ${copied ? "#22c55e33" : category.color + "33"}`,
          background: copied ? "rgba(34,197,94,0.10)" : category.faint,
          color: copied ? "#22c55e" : category.color,
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 200ms ease",
        }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied!" : "Copy Slip"}
      </button>

      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          onClick={handleShare}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${category.color}33`,
            background: "transparent",
            color: category.color,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
        >
          <Share2 size={15} />
          Share
        </button>
      )}
    </div>
  );
}
