import React from "react";
import type { GamePrediction } from "../../types";

interface Props {
  game: GamePrediction;
  color: string;
  faint: string;
  index?: number;
}

function ConfBar({ value, color }: { value: number; color: string }) {
  const isHigh = value >= 0.75;
  return (
    <div className="conf-bar-track" style={{ flex: 1 }}>
      <div
        className={`conf-bar-fill${isHigh ? " high" : ""}`}
        style={{ width: `${Math.round(value * 100)}%`, background: color, color }}
      />
    </div>
  );
}

export function PredictionCard({ game, color, faint, index = 0 }: Props) {
  const pct = Math.round(game.confidence * 100);
  const isHighConf = game.confidence >= 0.75;

  return (
    <div
      className="card animate-fade-up"
      style={{
        "--card-accent": color,
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        animationDelay: `${index * 60}ms`,
        borderLeft: `3px solid ${color}`,
      } as React.CSSProperties}
    >
      {/* League + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)",
        }}>
          {game.league}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
          {new Date(game.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
        </span>
      </div>

      {/* Teams — centered divider dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
          color: "var(--text-1)", flex: 1, minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {game.home_team}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", opacity: 0.5 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.05em" }}>VS</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", opacity: 0.5 }} />
        </div>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
          color: "var(--text-1)", flex: 1, minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right",
        }}>
          {game.away_team}
        </span>
      </div>

      {/* Prediction pill + odds */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 0" }}>
        <div style={{
          background: faint, border: `1px solid ${color}33`, borderRadius: 8,
          padding: "6px 14px", fontFamily: "var(--font-body)", fontSize: 13,
          fontWeight: 600, color, maxWidth: "calc(100% - 90px)",
        }}>
          {game.readable_prediction}
        </div>
        <div className="odds-value" style={{
          fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700,
          color, flexShrink: 0, letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          {game.estimated_odds.toFixed(2)}
        </div>
      </div>

      {/* Confidence bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ConfBar value={game.confidence} color={color} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
          color: isHighConf ? color : "var(--text-3)", flexShrink: 0,
          minWidth: 36, textAlign: "right",
        }}>
          {pct}%
        </span>
      </div>

      {/* Model chip */}
      <div>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 5, padding: "3px 8px",
        }}>
          {game.model_type}
        </span>
      </div>
    </div>
  );
}
