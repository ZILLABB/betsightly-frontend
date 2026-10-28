import React from "react";
import { Filter, RefreshCw } from "lucide-react";
import { TeamCrest } from "../common/TeamCrest";
import type {
  GamePrediction,
  RecommendationBoardResponse,
  RecommendationClassification,
} from "../../types";
import { formatKickoffDateTime, formatLeagueName } from "../../utils/formatters";
import "../../styles/recommendation-board.css";

type Props = {
  data: RecommendationBoardResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

type RuntimePick = GamePrediction & {
  bookable?: boolean;
};

const COLORS: Record<RecommendationClassification, string> = {
  STRONG: "var(--green)",
  SUPPORTED: "#38bdf8",
  LEAN: "var(--gold)",
};

const marketFamily = (market?: string) => {
  if (!market) return "Other";
  if (market.includes("dnb")) return "DNB";
  if (market.includes("btts")) return "BTTS";
  if (market.includes("over") || market.includes("under")) {
    return market.includes("home_") || market.includes("away_")
      ? "Team Goals"
      : "Goals";
  }
  if (market.includes("or_") || market.includes("_or_")) return "Double Chance";
  if (["home_win", "away_win", "draw"].includes(market)) return "Match Result";
  return "Other";
};

const isUpcoming = (pick: GamePrediction) => {
  const raw = pick.kickoff || pick.date;
  if (!raw) return false;
  const timestamp = new Date(raw).getTime();
  if (!Number.isFinite(timestamp)) return false;

  return timestamp > Date.now() + 20 * 60 * 1000;
};

const displayedOdds = (pick: GamePrediction) =>
  pick.odds ?? pick.real_odds ?? pick.estimated_odds ?? 0;

export function RecommendationBoard({
  data,
  loading,
  error,
  onRetry,
}: Props) {
  const [classification, setClassification] =
    React.useState<"ALL" | RecommendationClassification>("ALL");
  const [family, setFamily] = React.useState("All markets");
  const [league, setLeague] = React.useState("All leagues");

  // On thin premium days, hiding every unbookable model opinion makes a
  // populated analysis board look empty. Display upcoming football research
  // by default, with a separate opt-in filter for bookmaker availability.
  // An analysed market is NOT an official verified ticket or a share code.
  const [bookableOnly, setBookableOnly] = React.useState(false);
  const [upcomingOnly, setUpcomingOnly] = React.useState(true);

  const leagues = React.useMemo(
    () =>
      Array.from(
        new Set(
          (data?.recommendations ?? []).map(item => item.best_pick.league),
        ),
      ).sort(),
    [data],
  );

  const families = React.useMemo(
    () =>
      Array.from(
        new Set(
          (data?.recommendations ?? []).map(item =>
            marketFamily(item.best_pick.market),
          ),
        ),
      ).sort(),
    [data],
  );

  const shown = React.useMemo(
    () =>
      (data?.recommendations ?? []).filter(item => {
        const pick = item.best_pick as RuntimePick;
        return (
          (classification === "ALL" || item.classification === classification)
          && (family === "All markets" || marketFamily(pick.market) === family)
          && (league === "All leagues" || pick.league === league)
          && (!bookableOnly || pick.bookable === true)
          && (!upcomingOnly || isUpcoming(pick))
        );
      }),
    [
      bookableOnly,
      classification,
      data,
      family,
      league,
      upcomingOnly,
    ],
  );

  const resetAnalysisFilters = () => {
    setClassification("ALL");
    setFamily("All markets");
    setLeague("All leagues");
    setBookableOnly(false);
    setUpcomingOnly(false);
  };

  return (
    <section className="recommendation-board" aria-labelledby="match-board-title">
      <div className="recommendation-board__heading">
        <div>
          <div className="eyebrow">Match intelligence</div>
          <h2 id="match-board-title">Best view by analysed match</h2>
          <p>
            Upcoming match forecasts are shown even when they cannot become official
            SportyBet tickets. Enable the bookable filter to narrow the research;
            only verified codes on published slips are ready for booking.
          </p>
        </div>

        {data?.board?.degraded && (
          <span className="recommendation-board__degraded">
            Partial provider coverage
          </span>
        )}
      </div>

      {data && (
        <div className="recommendation-summary" aria-label="Recommendation summary">
          <span><strong>{data.summary.fixtures_analysed}</strong> analysed</span>
          <span title="Market offered by SportyBet; a separate verified booking code is still required"><strong>{data.summary.sportybet_bookable}</strong> bookmaker markets</span>
          <span className="is-strong"><strong>{data.summary.strong}</strong> strong</span>
          <span className="is-supported"><strong>{data.summary.supported}</strong> supported</span>
          <span className="is-lean"><strong>{data.summary.lean}</strong> lean</span>
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
            {value === "ALL"
              ? "All"
              : value[0] + value.slice(1).toLowerCase()}
          </button>
        ))}

        <select
          aria-label="Market type"
          value={family}
          onChange={event => setFamily(event.target.value)}
        >
          <option>All markets</option>
          {families.map(value => <option key={value}>{value}</option>)}
        </select>

        <select
          aria-label="League"
          value={league}
          onChange={event => setLeague(event.target.value)}
        >
          <option>All leagues</option>
          {leagues.map(value => <option key={value}>{value}</option>)}
        </select>

        <label>
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={event => setUpcomingOnly(event.target.checked)}
          />
          Upcoming only
        </label>

        <label>
          <input
            type="checkbox"
            checked={bookableOnly}
            onChange={event => setBookableOnly(event.target.checked)}
          />
          SportyBet bookable
        </label>

        {(bookableOnly || upcomingOnly) && (
          <button type="button" onClick={resetAnalysisFilters}>
            Show all analysis
          </button>
        )}
      </div>

      {loading ? (
        <div className="recommendation-board__state">
          Analysing today&apos;s fixtures…
        </div>
      ) : error ? (
        <div className="recommendation-board__state">
          <span>{error}</span>
          <button type="button" onClick={onRetry}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : shown.length === 0 ? (
        <div className="recommendation-board__state">
          No upcoming analysed matches fit these filters.
          {(data?.recommendations?.length ?? 0) > 0 && (
            <button type="button" onClick={resetAnalysisFilters}>
              Show all analysis
            </button>
          )}
        </div>
      ) : (
        <div className="recommendation-list">
          {shown.map(item => {
            const pick = item.best_pick;
            const odds = displayedOdds(pick);
            const accent = COLORS[item.classification];

            return (
              <article
                key={item.match_id}
                className="recommendation-row"
                style={{ "--recommendation-accent": accent } as React.CSSProperties}
              >
                <div className="recommendation-row__top">
                  <span>{formatLeagueName(pick.league)}</span>
                  <span>{formatKickoffDateTime(pick.kickoff || pick.date)}</span>
                  <b className={`is-${item.classification.toLowerCase()}`}>
                    {item.classification === "LEAN"
                      ? "Lean"
                      : item.classification[0] +
                        item.classification.slice(1).toLowerCase()}
                  </b>
                </div>

                <div className="recommendation-row__main">
                  <div className="recommendation-row__fixture">
                    <span className="recommendation-row__team">
                      <TeamCrest team={pick.home_team} logo={pick.home_team_logo}
                        national={pick.team_type !== "CLUB"} size="sm"/>
                      <strong>{pick.home_team}</strong>
                    </span>
                    <span>vs</span>
                    <span className="recommendation-row__team">
                      <TeamCrest team={pick.away_team} logo={pick.away_team_logo}
                        national={pick.team_type !== "CLUB"} size="sm"/>
                      <strong>{pick.away_team}</strong>
                    </span>
                  </div>

                  <div className="recommendation-row__pick">
                    <strong>{pick.prediction}</strong>
                    <span>
                      {Math.round(pick.confidence * 100)}% confidence
                      {pick.odds_are_real ? " · SportyBet" : " · estimated price"}
                    </span>
                  </div>

                  <div className="recommendation-row__odds">
                    {odds > 0 ? odds.toFixed(2) : "—"}
                  </div>
                </div>

                <div className="recommendation-row__foot">
                  <span>
                    {item.premium_eligible
                      ? "Model and price candidate · not a verified ticket"
                      : (pick.bookable
                        ? "Bookmaker market reported · not a verified ticket"
                        : "Research only · no verified booking")}
                  </span>

                  {item.alternatives.length > 0 && (
                    <details className="recommendation-alternatives">
                      <summary>
                        {item.alternatives.length} other option
                        {item.alternatives.length === 1 ? "" : "s"}
                      </summary>
                      <div>
                        {item.alternatives.map(option => (
                          <p key={option.selection_id ?? option.market}>
                            <strong>{option.prediction}</strong>
                            <span>
                              {Math.round(option.confidence * 100)}%
                              {" · "}
                              {(option.odds ??
                                option.real_odds ??
                                option.estimated_odds)?.toFixed(2) ?? "—"}
                              {" · "}rank #{option.public_rank}
                            </span>
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
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
