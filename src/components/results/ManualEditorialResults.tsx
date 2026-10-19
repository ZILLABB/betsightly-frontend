import { useEffect, useState } from "react";
import { TeamCrest } from "../common/TeamCrest";
import { CalendarDays, ChevronDown } from "lucide-react";
import { api, type ManualResultsResponse } from "../../api/predictions";

const title = (value: string) =>
  ({ banker: "Banker", "2_odds": "2 Odds", "5_odds": "5 Odds",
     "10_odds": "10 Odds", over_1_5: "Over Goals", rollover: "Rollover" } as Record<string, string>)[value]
  ?? value.replaceAll("_", " ");

function statusLabel(value: string) {
  return ({ won: "Won", lost: "Lost", void: "Void", pending: "Pending" } as Record<string, string>)[value]
    ?? "Pending";
}
const friendlyDate = (date: string) => new Date(`${date}T12:00:00Z`)
  .toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const oddsText = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 1
    ? `${value.toFixed(2)}x`
    : null;

/** Manual results appear alongside normal history but are never included in
 * the official model totals, ROI, calibration or retraining observations. */
export function ManualEditorialResults({ recent = false }: { recent?: boolean }) {
  const [data, setData] = useState<ManualResultsResponse | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    setError(false);
    api.getManualResults(recent ? 10 : 30)
      .then(result => { if (alive) setData(result); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [recent]);

  return (
    <section className="results-history results-manual" aria-labelledby={recent ? "recent-manual-results-heading" : "manual-results-heading"}>
      <div className="results-history__heading">
        <div>
          <p className="results-kicker">Administrator-curated results</p>
          <h2 id={recent ? "recent-manual-results-heading" : "manual-results-heading"}>{recent ? "Manual picks on recent days" : "Manual prediction results"}</h2>
        </div>
        <p>Every selection is graded from verified final scores. These bets
          are <strong>not included</strong> in the official engine&apos;s accuracy,
          calibration or ROI.</p>
      </div>

      {error ? (
        <div className="results-error" role="alert">
          Manual settlement history is currently unavailable.
        </div>
      ) : data === null ? (
        <p className="results-empty">Loading manual selections…</p>
      ) : !data.results?.length ? (
        <div className="results-empty">
          No manually published tickets are recorded yet.
        </div>
      ) : (
        <div className="history-list">
          {(recent ? data.results.slice(0, 5) : data.results).map((slip, index) => {
            const odds = oddsText(slip.total_odds);
            return (
              <details key={`${slip.date}-${slip.tier}-${index}`}
                className={`history-item history-item--${slip.status} manual-history-item`}>
                <summary>
                  <span className="history-date"><CalendarDays size={14} aria-hidden="true" />{friendlyDate(slip.date)}</span>
                  <span className="history-product">
                    <strong>{title(slip.tier)}</strong>
                    <small>Admin-curated · separate record</small>
                  </span>
                  <span className="history-facts">
                    <span>{slip.games.length} legs</span>
                    {odds && <span>{odds}</span>}
                  </span>
                  <span className={`results-status results-status--${slip.status}`}>
                    {statusLabel(slip.status)} · Admin-curated
                  </span>
                  <ChevronDown className="history-chevron" size={16} aria-hidden="true" />
                </summary>
                <div className="history-legs">
                  {slip.games.map((game, i) => (
                    <div key={`${game.kickoff || i}-${i}`}
                      className={`result-leg result-leg--${game.status}`}>
                      <div className="result-leg__fixture">
                        <div className="result-leg__teams">
                          <TeamCrest team={game.home_team} logo={game.home_team_logo} size="sm"/>
                          <TeamCrest team={game.away_team} logo={game.away_team_logo} size="sm"/>
                          <strong>{game.home_team} vs {game.away_team}</strong>
                        </div>
                        <small>{game.settlement_evidence
                          ? `FT ${game.settlement_evidence.home_score}–${game.settlement_evidence.away_score}`
                          : game.status === "pending" && game.settlement_pending_reason
                            ? game.settlement_pending_reason.replaceAll("_", " ")
                            : "90-minute result"}</small>
                      </div>
                      <div className="result-leg__market">
                        <span>{game.market?.replaceAll("_", " ") ?? "Selection"}</span>
                        {oddsText(game.odds) && <small>{oddsText(game.odds)}</small>}
                      </div>
                      <span className="result-leg__outcome">{statusLabel(game.status)}</span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
