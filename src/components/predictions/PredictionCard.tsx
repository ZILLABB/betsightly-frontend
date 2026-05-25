import React from "react";
import type { GamePrediction } from "../../types";
import TeamLogo from "../common/TeamLogo";

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

  // Use whichever odds field is available
  const displayOdds = game.odds ?? game.real_odds ?? game.estimated_odds ?? 0;

  // Use prediction (readable) or fall back to readable_prediction
  const displayPrediction = game.prediction || game.readable_prediction || game.prediction_value || "";

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

      {/* Teams with logos — centered divider dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <TeamLogo teamName={game.home_team} logoUrl={game.home_team_logo} size="sm" animate={false} />
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
            color: "var(--text-1)", minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {game.home_team}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", opacity: 0.5 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.05em" }}>VS</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", opacity: 0.5 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
            color: "var(--text-1)", minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right",
          }}>
            {game.away_team}
          </span>
          <TeamLogo teamName={game.away_team} logoUrl={game.away_team_logo} size="sm" animate={false} />
        </div>
      </div>

      {/* Prediction pill + odds */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 0" }}>
        <div style={{
          background: faint, border: `1px solid ${color}33`, borderRadius: 8,
          padding: "6px 14px", fontFamily: "var(--font-body)", fontSize: 13,
          fontWeight: 600, color, maxWidth: "calc(100% - 90px)",
        }}>
          {displayPrediction}
        </div>
        <div className="odds-value" style={{
          fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700,
          color, flexShrink: 0, letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          {displayOdds.toFixed(2)}
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

      {/* Bottom row: model chip + edge + bookmaker */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {game.model_type && (
          <span style={{
            fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 5, padding: "3px 8px",
          }}>
            {game.model_type}
          </span>
        )}
        {game.edge != null && game.edge > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
            color: "#22c55e", background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.20)", borderRadius: 5,
            padding: "3px 8px",
          }}>
            +{(game.edge * 100).toFixed(1)}% edge
          </span>
        )}
        {game.bookmaker && (
          <span style={{
            fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 500,
            color: "var(--text-3)", marginLeft: "auto",
          }}>
            via {game.bookmaker}
          </span>
        )}
        {game.models_agreed != null && game.models_agreed > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
            color: "var(--text-3)", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.04)", borderRadius: 5,
            padding: "3px 8px",
          }}>
            {game.models_agreed} models agree
          </span>
        )}
      </div>
    </div>
  );
}
