import React from "react";
import { CATEGORIES } from "../../types";
import type { AccumulatorResponse, CategoryMeta, GamePrediction } from "../../types";
import { useFormatOdds } from "../../hooks/useFormatOdds";
import type { LiveScore } from "./PredictionCard";

interface Props {
  accumulators: AccumulatorResponse["accumulators"];
  scores?: Record<string, LiveScore>;
  onOpen: (key: CategoryMeta["key"]) => void;
}

const time = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    });
  } catch { return ""; }
};

/**
 * Every tier for the day on one screen.
 *
 * The tab bar shows one slip at a time, which is right for studying a single
 * one and wrong for the question people actually arrive with — what is on
 * today, and which of these do I want. Answering that used to mean clicking
 * five tabs and holding the numbers in your head.
 *
 * Deliberately compact: kick-off, pick, confidence and price per leg, with the
 * tier's own headline figures. It is a summary to choose from, not a
 * replacement for the tier view, so each block links through to the detail.
 */
export function AllSlips({ accumulators, scores = {}, onOpen }: Props) {
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  const tiers = CATEGORIES
    .map(meta => ({ meta, cat: accumulators?.[meta.key] }))
    .filter(t => t.cat?.selected && (t.cat?.games?.length ?? 0) > 0);

  if (!tiers.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {tiers.map(({ meta, cat }) => {
        const singles = cat!.presentation === "singles";
        const games: GamePrediction[] = cat!.games ?? [];
        const hit = cat!.hit_probability;

        return (
          <div key={meta.key} className="card" style={{
            padding: 0, overflow: "hidden",
            borderLeft: `3px solid ${meta.color}`,
          }}>
            <button
              onClick={() => onOpen(meta.key)}
              style={{
                width: "100%", background: "transparent", border: 0, cursor: "pointer",
                padding: "12px 16px", display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                textAlign: "left",
              }}
            >
              <span style={{
                fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700,
                color: meta.color,
              }}>
                {meta.label}
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
                  color: "var(--text-3)", marginLeft: 8,
                }}>
                  {games.length} {games.length === 1 ? "pick" : "picks"}
                  {singles ? " · bet separately" : ""}
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {!singles && (
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                    color: meta.color, background: meta.faint,
                    padding: "3px 10px", borderRadius: 6,
                  }}>
                    {fmtOdds(cat!.total_odds)}{oddsSuffix}
                  </span>
                )}
                {typeof hit === "number" && (
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>
                    {singles ? "each ~" : "lands ~"}{Math.round(hit * 100)}%
                  </span>
                )}
              </span>
            </button>

            <div style={{ borderTop: "1px solid var(--border)" }}>
              {games.map((g, i) => {
                const score = scores[g.match_id];
                const live = score && (score.live || score.finished) && score.home_score != null;
                return (
                  <div key={g.fixture_id ?? i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 16px", flexWrap: "wrap",
                    borderTop: i ? "1px solid var(--border)" : undefined,
                  }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 11,
                      color: live ? "var(--text-2)" : "var(--text-3)",
                      minWidth: 46, flexShrink: 0,
                    }}>
                      {live ? `${score!.home_score}–${score!.away_score}` : time(g.kickoff || g.date)}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: 12.5,
                      color: "var(--text-1)", flex: 1, minWidth: 150,
                    }}>
                      {g.home_team} <span style={{ color: "var(--text-3)" }}>v</span> {g.away_team}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                      color: meta.color, minWidth: 120,
                    }}>
                      {g.prediction || g.readable_prediction}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)",
                      minWidth: 34, textAlign: "right",
                    }}>
                      {Math.round((g.confidence ?? 0) * 100)}%
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                      color: "var(--text-1)", minWidth: 62, textAlign: "right",
                    }}>
                      {fmtOdds(g.odds ?? 0)}{oddsSuffix}
                      {/* Whether the price is a real quote matters — half the
                          card is our own estimate and a user comparing against
                          a bookmaker needs to know which is which. */}
                      {!g.odds_are_real && (
                        <span style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 500 }}> est.</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
