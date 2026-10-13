import React from "react";
import { ExternalLink, SearchCheck } from "lucide-react";

type ScoutVerdict = "RESEARCH_PRIORITY" | "NEEDS_VERIFICATION" | "NO_ADDITIONAL_EVIDENCE";
type ScoutCandidate = {
  candidate_id: string;
  home: string;
  away: string;
  league: string;
  kickoff: string;
  market: string;
  model_probability: number;
  price: number;
  real_price: boolean;
  publication_allowed: boolean;
  bookable: boolean;
  verdict: ScoutVerdict;
  rationale: string;
  verification_gap: string;
  source_urls: string[];
  web_sources_available: boolean;
  research_only: true;
  bookmaker_code_verified: false;
};
type ScoutResponse = {
  status: string;
  date?: string;
  candidates?: ScoutCandidate[];
  research_only: boolean;
  official_predictions_unchanged?: boolean;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://betsightly-api.onrender.com/api";

/** AI Scout has no booking action and never appears inside an official tier. */
export function AIScoutWatchlist() {
  const [report, setReport] = React.useState<ScoutResponse | null>(null);
  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/leagues/ai-scout/watchlist`, {
      signal: controller.signal, headers: { Accept: "application/json" },
    })
      .then(res => res.ok ? res.json() as Promise<ScoutResponse> : null)
      .then(data => { if (!controller.signal.aborted) setReport(data); })
      .catch(() => { /* Optional research must not interrupt official cards */ });
    return () => controller.abort();
  }, []);

  const candidates = report?.status === "SHADOW_EVIDENCE_ONLY"
    ? (report.candidates ?? []).filter(c => c.research_only === true
      && c.bookmaker_code_verified === false)
    : [];

  if (!candidates.length) return null;

  return (
    <section className="card" aria-label="AI Scout research watchlist" style={{
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13,
    }}>
      <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
        <SearchCheck size={20} color="var(--gold)" aria-hidden="true" />
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--text-1)", margin: 0 }}>
            AI Scout · Research watchlist
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-2)", marginTop: 6 }}>
            A second opinion on today's modelled fixtures. These are <strong>not official
            BetSightly selections</strong>, not verified SportyBet tickets, and must not
            be mistaken for bookmaker-ready codes. Research does not guarantee an outcome.
          </p>
        </div>
      </div>
      {candidates.map(c => (
        <article key={c.candidate_id} style={{
          borderTop: "1px solid var(--border)", paddingTop: 12,
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
            <strong style={{ fontSize: 14, color: "var(--text-1)" }}>
              {c.home} vs {c.away}
            </strong>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>
              {c.league} · {c.market}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
            {c.verdict === "RESEARCH_PRIORITY"
              ? "Research priority — not approved for betting"
              : c.verdict === "NEEDS_VERIFICATION"
                ? "Additional verification needed"
                : "No additional verified evidence"}
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-2)" }}>
            {c.rationale}
          </p>
          {c.verification_gap && (
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              Evidence gap: {c.verification_gap}
            </p>
          )}
          {c.source_urls?.length ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {c.source_urls.slice(0, 3).map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "var(--gold)" }}>
                  Research source <ExternalLink size={11} style={{ display: "inline" }} />
                </a>
              ))}
            </div>
          ) : (
            <small style={{ color: "var(--text-3)" }}>
              No independently linked web sources captured.
            </small>
          )}
        </article>
      ))}
    </section>
  );
}
