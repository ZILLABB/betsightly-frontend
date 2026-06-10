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
        style={{ width: 32, height: 22, objectFit: "cover", borderRadius: 3, flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <span style={{
      width: 32, height: 22, borderRadius: 4, flexShrink: 0,
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

export function PredictionCard({ game, color, faint, index = 0 }: Props) {
  const pct = Math.round(game.confidence * 100);
  const displayOdds = game.odds ?? game.real_odds ?? game.estimated_odds ?? 0;
  const displayPrediction = game.prediction || game.readable_prediction || game.prediction_value || "";

  const sportyBetUrl = game.bookmaker?.toLowerCase().includes("sportybet")
    ? `https://www.sportybet.com/ng/share/${game.fixture_id}`
    : null;

  return (
    <div
      className="card animate-fade-up"
      style={{
        "--card-accent": color,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        animationDelay: `${index * 50}ms`,
        overflow: "hidden",
      } as React.CSSProperties}
    >
      {/* Top strip — league + date */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px",
        background: "var(--overlay-1)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {game.league_logo && (
            <img
              src={game.league_logo}
              alt=""
              style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 2, opacity: 0.7 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span style={{
            fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)",
          }}>
            {game.league}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
          {new Date(game.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
        </span>
      </div>

      {/* Teams — horizontal layout */}
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Home */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <TeamBadge team={game.home_team} logo={game.home_team_logo} />
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700,
            color: "var(--text-1)", lineHeight: 1.2, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {game.home_team}
          </span>
        </div>

        {/* VS badge */}
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
          color: "var(--text-3)", letterSpacing: "0.1em",
          padding: "3px 8px", borderRadius: 6,
          background: "var(--surface-2)", flexShrink: 0,
        }}>VS</span>

        {/* Away */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0, justifyContent: "flex-end" }}>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700,
            color: "var(--text-1)", lineHeight: 1.2, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right",
          }}>
            {game.away_team}
          </span>
          <TeamBadge team={game.away_team} logo={game.away_team_logo} />
        </div>
      </div>

      {/* Prediction + Odds bar */}
      <div style={{
        margin: "0 16px 14px",
        padding: "10px 14px",
        borderRadius: 10,
        background: faint,
        border: `1px solid ${color}18`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
            color, lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {displayPrediction}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)",
          }}>
            {pct}% confidence
          </span>
        </div>

        {/* Odds pill */}
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 800,
          color, flexShrink: 0, letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          {displayOdds.toFixed(2)}
        </div>
      </div>

      {/* Bottom row: chips + actions */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        padding: "0 16px 12px",
      }}>
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
              letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)",
              background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: 5, padding: "3px 8px",
            }}>
              {label}
            </span>
          ) : null;
        })()}
        {game.edge != null && game.edge > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
            color: "var(--green)", background: "var(--green-faint)",
            border: "1px solid rgba(16,185,129,0.15)", borderRadius: 5,
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
        {sportyBetUrl && (
          <a
            href={sportyBetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700,
              color: "#2DB544", background: "rgba(45,181,68,0.10)",
              border: "1px solid rgba(45,181,68,0.20)", borderRadius: 5,
              padding: "3px 8px", textDecoration: "none",
            }}
          >
            Bet on SportyBet
          </a>
        )}
        <ShareButton
          compact
          text={`${game.home_team} vs ${game.away_team} — ${displayPrediction} @${displayOdds.toFixed(2)} (${pct}% confidence) · BetSightly`}
        />
      </div>
    </div>
  );
}
