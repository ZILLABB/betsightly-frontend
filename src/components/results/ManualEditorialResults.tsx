import { useEffect, useState } from "react";
import { api, type ManualResultsResponse } from "../../api/predictions";

const title = (value: string) =>
  ({ banker: "Banker", "2_odds": "2 Odds", "5_odds": "5 Odds",
     "10_odds": "10 Odds", over_1_5: "Over 1.5" } as Record<string, string>)[value]
  ?? value.replaceAll("_", " ");

function statusLabel(value: string) {
  return ({won:"Won",lost:"Lost",void:"Void",pending:"Pending"} as Record<string,string>)[value]
    ?? "Pending";
}

/** Manual results never enter the official BetSightly model win-rate totals. */
export function ManualEditorialResults({ recent = false }: { recent?: boolean }) {
  const [data, setData] = useState<ManualResultsResponse | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    api.getManualResults(recent ? 10 : 30)
      .then(result => { if (alive) setData(result); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [recent]);

  return (
    <section className="results-history" aria-labelledby="manual-results-heading">
      <div className="results-history__heading">
        <div>
          <p className="results-kicker">Administrator-curated results</p>
          <h2 id="manual-results-heading">{recent ? "Manual picks on recent days" : "Manual prediction results"}</h2>
        </div>
        <p>Every selection is graded from verified final scores. These bets
          are <strong>not included</strong> in the official engine's accuracy,
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
          {(recent ? data.results.slice(0, 5) : data.results).map((slip, index) => (
            <details key={`${slip.date}-${slip.tier}-${index}`}
              className="card" style={{ padding: "16px 20px" }}>
              <summary style={{ cursor: "pointer", display: "flex",
                flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
                <span>
                  <strong>{title(slip.tier)}</strong>
                  <span style={{ color: "var(--text-3)", fontSize: 12, marginLeft: 8 }}>
                    {slip.date} · {slip.games.length} legs ·
                    {slip.total_odds?.toFixed(2)}x
                  </span>
                </span>
                <strong style={{ fontSize: 13 }}>
                  {statusLabel(slip.status)} · Admin-curated
                </strong>
              </summary>
              <div style={{ display: "grid", gap: 10, marginTop: 15 }}>
                {slip.games.map((game, i) => (
                  <div key={`${game.kickoff || i}-${i}`}
                    style={{ borderTop: "1px solid var(--border)", paddingTop: 10,
                      display: "flex", justifyContent: "space-between",
                      alignItems: "start", flexWrap: "wrap", gap: 9 }}>
                    <div style={{ fontSize: 13 }}>
                      <strong>{game.home_team} vs {game.away_team}</strong>
                      <div style={{ color: "var(--text-3)" }}>
                        {game.market?.replaceAll("_", " ")}
                        {game.odds ? ` · ${game.odds.toFixed(2)}x` : ""}
                      </div>
                      {game.status === "pending" && game.settlement_pending_reason &&
                        <small style={{ color: "var(--text-3)" }}>
                          {game.settlement_pending_reason.replaceAll("_", " ")}
                        </small>}
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13 }}>
                      <strong>{statusLabel(game.status)}</strong>
                      {game.settlement_evidence &&
                        <div style={{ color: "var(--text-3)" }}>
                          FT {game.settlement_evidence.home_score}
                          –{game.settlement_evidence.away_score}
                        </div>}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
