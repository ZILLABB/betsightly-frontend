import React from "react";
import type { GamePrediction } from "../../types";
import { getTeamFlag, isWcNation, teamInitials, teamColor } from "../../data/wcFlags";
import { ShareButton } from "../common/ShareButton";

function TeamBadge({ team, logo }: { team: string; logo?: string | null }) {
  if (isWcNation(team)) {
    return (
      <img
        src={getTeamFlag(team, logo, 80)}
        alt=""
        style={{ width: 28, height: 20, objectFit: "cover", borderRadius: 3, flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <span style={{
      width: 28, height: 20, borderRadius: 3, flexShrink: 0,
      background: teamColor(team), color: "#fff",
      fontSize: 10, fontWeight: 800, fontFamily: "var(--font-mono)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      letterSpacing: "-0.04em",
    }}>{teamInitials(team)}</span>
  );
}

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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {game.league_logo && (
            <img
              src={game.league_logo}
              alt=""
              style={{ width: 16, height: 16, objectFit: "contain", borderRadius: 2, opacity: 0.8 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span style={{
            fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)",
          }}>
            {game.league}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
          {new Date(game.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
        </span>
      </div>

      {/* Teams — stacked layout (badges flex shrink to 0, names get to wrap) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TeamBadge team={game.home_team} logo={game.home_team_logo} />
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700,
            color: "var(--text-1)", lineHeight: 1.25, flex: 1, minWidth: 0,
            wordBreak: "break-word",
          }}>
            {game.home_team}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", opacity: 0.4 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em" }}>VS</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", opacity: 0.4 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TeamBadge team={game.away_team} logo={game.away_team_logo} />
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700,
            color: "var(--text-1)", lineHeight: 1.25, flex: 1, minWidth: 0,
            wordBreak: "break-word",
          }}>
            {game.away_team}
          </span>
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

      {/* Bottom row: pick-source chip + value + bookmaker.
          Internal identifiers (worldcup_ensemble, club_odds, ...) are mapped
          to user-facing labels — raw model names must never reach the UI. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {(() => {
          const MODEL_LABELS: Record<string, string> = {
            worldcup_ensemble: "AI Pick",
            ensemble: "AI Pick",
            club_odds: "Market Pick",
            odds_implied: "Market Pick",
          };
          const label = game.model_type ? MODEL_LABELS[game.model_type] : undefined;
          return label ? (
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 5, padding: "3px 8px",
            }}>
              {label}
            </span>
          ) : null;
        })()}
        {game.edge != null && game.edge > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
            color: "#22c55e", background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.20)", borderRadius: 5,
            padding: "3px 8px",
          }}>
            +{(game.edge * 100).toFixed(1)}% value
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
        <ShareButton
          compact
          text={`${game.home_team} vs ${game.away_team} — ${displayPrediction} @${displayOdds.toFixed(2)} (${pct}% confidence) · BetSightly`}
        />
      </div>
    </div>
  );
}
