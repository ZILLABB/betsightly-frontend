import React from "react";
import { Filter, RefreshCw } from "lucide-react";
import type {
  RecommendationBoardResponse,
  RecommendationClassification,
} from "../../types";
import { PredictionCard } from "./PredictionCard";
import "../../styles/recommendation-board.css";

type Props = {
  data: RecommendationBoardResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

const COLORS: Record<RecommendationClassification, { color: string; faint: string }> = {
  STRONG: { color: "#10b981", faint: "rgba(16,185,129,.09)" },
  SUPPORTED: { color: "#38bdf8", faint: "rgba(56,189,248,.09)" },
  LEAN: { color: "#f59e0b", faint: "rgba(245,158,11,.09)" },
};

const marketFamily = (market?: string) => {
  if (!market) return "Other";
  if (market.includes("dnb")) return "DNB";
  if (market.includes("btts")) return "BTTS";
  if (market.includes("over") || market.includes("under")) {
    return market.includes("home_") || market.includes("away_")
      ? "Team Goals" : "Goals";
  }
  if (market.includes("or_") || market.includes("_or_")) return "Double Chance";
  if (["home_win", "away_win", "draw"].includes(market)) return "Match Result";
  return "Other";
};

export function RecommendationBoard({ data, loading, error, onRetry }: Props) {
  const [classification, setClassification] = React.useState<"ALL" | RecommendationClassification>("ALL");
  const [family, setFamily] = React.useState("All markets");
  const [league, setLeague] = React.useState("All leagues");
  const [bookableOnly, setBookableOnly] = React.useState(false);

  const leagues = React.useMemo(() => Array.from(new Set(
    (data?.recommendations ?? []).map(item => item.best_pick.league),
  )).sort(), [data]);
  const families = React.useMemo(() => Array.from(new Set(
    (data?.recommendations ?? []).map(item => marketFamily(item.best_pick.market)),
  )).sort(), [data]);
  const shown = React.useMemo(() => (data?.recommendations ?? []).filter(item => (
    (classification === "ALL" || item.classification === classification)
    && (family === "All markets" || marketFamily(item.best_pick.market) === family)
    && (league === "All leagues" || item.best_pick.league === league)
    && (!bookableOnly || Boolean(item.best_pick.bookable))
  )), [bookableOnly, classification, data, family, league]);

  return (
    <section className="recommendation-board" aria-labelledby="match-board-title">
      <div className="recommendation-board__heading">
        <div>
          <div className="eyebrow">Match intelligence</div>
          <h2 id="match-board-title">One best pick for every analysed match</h2>
          <p>
            This wider board includes supported opinions and clearly labelled leans.
            Premium slips still use only the subset that clears their quality rules.
          </p>
        </div>
        {data?.board?.degraded && (
          <span className="recommendation-board__degraded">Partial provider coverage</span>
        )}
      </div>

      {data && (
        <div className="recommendation-summary" aria-label="Recommendation summary">
          <span><strong>{data.summary.fixtures_analysed}</strong> analysed</span>
          <span><strong>{data.summary.recommendations}</strong> recommendations</span>
          <span className="is-strong"><strong>{data.summary.strong}</strong> strong</span>
          <span className="is-supported"><strong>{data.summary.supported}</strong> supported</span>
          <span className="is-lean"><strong>{data.summary.lean}</strong> lean</span>
          <span><strong>{data.summary.no_prediction}</strong> no prediction</span>
        </div>
      )}

      <div className="recommendation-filters" aria-label="Filter match recommendations">
        <Filter size={16} aria-hidden="true" />
        {(["ALL", "STRONG", "SUPPORTED", "LEAN"] as const).map(value => (
          <button
            key={value}
            type="button"
            className={classification === value ? "is-active" : ""}
            onClick={() => setClassification(value)}
          >
            {value === "ALL" ? "All" : value[0] + value.slice(1).toLowerCase()}
          </button>
        ))}
        <select aria-label="Market type" value={family} onChange={event => setFamily(event.target.value)}>
          <option>All markets</option>
          {families.map(value => <option key={value}>{value}</option>)}
        </select>
        <select aria-label="League" value={league} onChange={event => setLeague(event.target.value)}>
          <option>All leagues</option>
          {leagues.map(value => <option key={value}>{value}</option>)}
        </select>
        <label>
          <input type="checkbox" checked={bookableOnly} onChange={event => setBookableOnly(event.target.checked)} />
          SportyBet bookable
        </label>
      </div>

      {loading ? (
        <div className="recommendation-board__state">Analysing today&apos;s fixtures…</div>
      ) : error ? (
        <div className="recommendation-board__state">
          <span>{error}</span>
          <button type="button" onClick={onRetry}><RefreshCw size={14} /> Retry</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="recommendation-board__state">No matches fit these filters.</div>
      ) : (
        <div className="recommendation-grid">
          {shown.map((item, index) => {
            const accent = COLORS[item.classification];
            return (
              <article key={item.match_id} className="recommendation-item">
                <div className={`recommendation-label is-${item.classification.toLowerCase()}`}>
                  <span>{item.classification === "LEAN" ? "Lean" : item.classification[0] + item.classification.slice(1).toLowerCase()}</span>
                  <small>{item.premium_eligible ? "Premium eligible" : "Match board only"}</small>
                </div>
                <PredictionCard
                  game={item.best_pick}
                  color={accent.color}
                  faint={accent.faint}
                  index={index}
                />
                {item.alternatives.length > 0 && (
                  <details className="recommendation-alternatives">
                    <summary>Other BetSightly options ({item.alternatives.length})</summary>
                    <div>
                      {item.alternatives.map(option => (
                        <p key={option.selection_id ?? option.market}>
                          <strong>{option.prediction}</strong>
                          <span>{Math.round(option.confidence * 100)}% · {option.odds?.toFixed(2) ?? "—"} · rank #{option.public_rank}</span>
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="recommendation-board__disclaimer">
        Predictions are estimates, not guarantees. Check the match and market personally before placing any bet.
      </p>
    </section>
  );
}
