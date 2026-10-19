import React, { useState } from "react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import { Repeat2, CheckCircle, XCircle, Clock, Circle, Calendar, List, Zap } from "lucide-react";
import { TeamCrest } from "../components/common/TeamCrest";
import { SEO } from "../components/common/SEO";
import BookingCode from "../components/predictions/BookingCode";
import { formatLocalTimeWithZone } from "../utils/formatters";
import "../styles/product-experience.css";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  won: { icon: <CheckCircle size={14} />, color: "var(--green)", bg: "rgba(34,197,94,0.10)", label: "Won" },
  lost: { icon: <XCircle size={14} />, color: "var(--red)", bg: "rgba(248,113,113,0.10)", label: "Lost" },
  pending: { icon: <Clock size={14} />, color: "var(--text-3)", bg: "var(--surface-2)", label: "Pending" },
  void: { icon: <Circle size={14} />, color: "var(--text-3)", bg: "var(--surface-2)", label: "Void" },
};

const MARKET_COLORS: Record<string, { c: string; l: string }> = {
  match_result: { c: "var(--blue)", l: "Result" },
  goals: { c: "var(--green)", l: "Goals" },
  btts: { c: "var(--purple)", l: "BTTS" },
  double_chance: { c: "var(--accent)", l: "DC" },
  dnb: { c: "var(--blue)", l: "DNB" },
  team_goals_home: { c: "var(--green)", l: "Team goals" },
  team_goals_away: { c: "var(--green)", l: "Team goals" },
};

function fmtDate(iso: string) {
  // Force UTC so we don't drift into the next/prev day in local time
  const safe = iso.length === 10 ? iso + "T12:00:00Z" : iso;
  return new Date(safe).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function RolloverPage() {
  const { data, loading, error, usingFallback, lastUpdated, refetch } = usePredictions();
  const [view, setView] = useState<"today" | "all">("today");
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();
  const rollover = data?.accumulators?.rollover;
  const catMeta = CATEGORIES.find(c => c.key === "rollover")!;
  const chain = rollover?.chain ?? [];
  const targetDays = rollover?.target_days ?? 3;
  const completionProbability = rollover?.completion_probability;

  // Stats
  const wonDays = chain.filter(d => d.status === "won").length;
  const lostDays = chain.filter(d => d.status === "lost").length;
  const voidDays = chain.filter(d => d.status === "void").length;
  const pendingDays = chain.filter(d => d.status === "pending").length;
  const isAlive = lostDays === 0 && voidDays === 0;
  const isComplete = chain.length >= targetDays && pendingDays === 0;
  const chainStatus =
    lostDays > 0
      ? "Broken"
      : voidDays > 0
        ? "Ended"
        : isComplete
          ? "Completed"
          : "Active";
  const hasManual = chain.some(day => day.editorial_manual ||
    day.picks.some(pick => pick.editorial_manual));
  const legacyChain = chain.some(day =>
    !day.editorial_manual &&
    day.picks.some(pick => !pick.editorial_manual && pick.safe_tier_eligible !== true),
  );

  // Find today's day slot (first pending day whose date is >= today)
  const today = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
  const todaysDay = isAlive
    ? chain.find(d => d.date >= today && d.status === "pending")
    : undefined;
  const visibleDays = view === "today" ? (todaysDay ? [todaysDay] : []) : chain;

  // Cumulative odds
  const cumOdds = rollover?.cumulative_odds ?? rollover?.total_odds ?? 0;

  return (
    <div className="page-stack rollover-page v3-page v3-rollover" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SEO title="Rollover Challenge" description="3-day rollover challenge using evidence-backed daily picks. Every leg must land for the chain to continue." path="/rollover" />

      <section className="editorial-rollover-overview" aria-labelledby="rollover-title" aria-busy={loading && chain.length === 0}>
        <header className="bs-rollover-hero">
          <div className="bs-rollover-hero__copy">
            <div className="editorial-rollover-eyebrow">
              <span className="editorial-overline">THE DAILY CHALLENGE</span>
              <span className="editorial-rollover-live-status" data-state={chain.length === 0 ? "idle" : chainStatus.toLowerCase()}>
                <span aria-hidden="true" className="editorial-rollover-live-status__dot" />
                {loading && chain.length === 0
                  ? "Checking the board"
                  : error && !usingFallback && chain.length === 0
                    ? "Feed unavailable"
                    : chain.length === 0 ? "Awaiting publication" : `Chain ${chainStatus.toLowerCase()}`}
              </span>
            </div>
            <h1 id="rollover-title">{targetDays}-day rollover</h1>
            <p>One day at a time. Follow published football selections through verified results — without skipping a loss.</p>
            <div className="editorial-rollover-highlights" aria-label="Challenge overview">
              <div><span>Daily target</span><strong>2.0–3.0×</strong></div>
              <div>
                <span>Verified days won</span>
                <strong>{loading && chain.length === 0 ? "—" : `${wonDays} / ${targetDays}`}</strong>
              </div>
            </div>
            <div className="editorial-rollover-hero-foot">
              <span>Actual bookmaker availability determines publication.</span>
              <a href={chain.length ? "#rollover-days" : "/results"}>
                {chain.length ? "See published stages" : "Previous results"} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </header>
        <aside className="editorial-rollover-progress" aria-label="Rollover day progress">
          <div className="editorial-rollover-progress__header">
            <div>
              <span className="editorial-overline">CHAIN TRACKER</span>
              <h2>Matchday progress</h2>
            </div>
            {chain.length > 0 && <span className="editorial-rollover-progress__count">{chain.length} published</span>}
          </div>
          {loading && chain.length === 0 ? (
            <div className="editorial-rollover-tracker-loading" role="status" aria-label="Checking rollover chain">
              {Array.from({ length: targetDays }, (_, index) => (
                <div key={index} aria-hidden="true" className="editorial-rollover-tracker-skeleton">
                  <span/><span/>
                </div>
              ))}
              <p>Checking the latest published stages…</p>
            </div>
          ) : error && !usingFallback && chain.length === 0 ? (
            <div className="editorial-rollover-no-chain" role="status">
              <strong>Stage information unavailable</strong>
              <p>We couldn't verify the chain status. Try again below.</p>
            </div>
          ) : chain.length === 0 ? (
            <div className="editorial-rollover-no-chain" role="status">
              <strong>No active chain published</strong>
              <p>The challenge remains open to qualifying fixtures. We won't invent Day 1 selections to fill the board.</p>
              <a href="/results">Review previous rollover results <span aria-hidden="true">→</span></a>
            </div>
          ) : (
            <ol className="bs-rollover-timeline" aria-label="Rollover chain progress">
              {Array.from({ length: targetDays }, (_, index) => {
                const day = chain.find(item => item.day_number === index + 1);
                const state = day?.status ?? "future";
                const current = day?.status === "pending";
                const statusText = state === "won" ? "Verified win" :
                  state === "lost" ? "Lost · chain ended" :
                  state === "void" ? "Voided" :
                  current ? "Awaiting final" : "Not published";
                return (
                  <li key={index} className={`is-${state}${current ? " is-active" : ""}`}>
                    <span className="bs-rollover-timeline__step" aria-hidden="true">
                      {state === "won" ? <CheckCircle size={17}/> : index + 1}
                    </span>
                    <div>
                      <strong>Day {index + 1}</strong>
                      <small>{statusText}</small>
                      {day && <span className="editorial-rollover-timeline__date">{fmtDate(day.date)}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {chain.length > 0 && <p>Only independently verified finals advance a stage. <a href="/results">Full history →</a></p>}
        </aside>
      </section>

      {/* Compact chain summary */}
      {chain.length > 0 && (
        <section
          className="rollover-summary"
          aria-label="Rollover status summary"
        >
          <div className="rollover-summary__lead">
            <span>{targetDays}-day challenge</span>
            <strong
              className={
                chainStatus === "Active" || chainStatus === "Completed"
                  ? "is-positive"
                  : "is-negative"
              }
            >
              {chainStatus}
            </strong>
            <small>
              {hasManual
                ? "Includes unscored admin-curated picks"
                : legacyChain ? "Previous selection rules" : "Evidence-backed picks"}
            </small>
          </div>

          <dl className="rollover-summary__stats">
            <div>
              <dt>Today</dt>
              <dd>
                {todaysDay
                  ? `${fmtOdds(todaysDay.combined_odds)}${oddsSuffix}`
                  : "—"}
              </dd>
            </div>

            <div>
              <dt>Progress</dt>
              <dd>{wonDays}/{chain.length}</dd>
            </div>

            <div>
              <dt>Today&apos;s picks</dt>
              <dd>{todaysDay?.picks.length ?? "—"}</dd>
            </div>

            <div>
              <dt>Chain chance</dt>
              <dd>
                {completionProbability != null
                  ? `${Math.round(completionProbability * 100)}%`
                  : "—"}
              </dd>
            </div>
          </dl>

          <p>
            {cumOdds > 0
              ? lostDays > 0
                ? `${fmtOdds(cumOdds)}${oddsSuffix} was scheduled across ${chain.length} days.`
                : `${fmtOdds(cumOdds)}${oddsSuffix} compounded only if every scheduled day lands.`
              : `Bookmaker-verified stages generally target 2x–3x. Daily eligibility is evidence-dependent.`}
          </p>
        </section>
      )}

      {error && usingFallback && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
          {lastUpdated && (
            <span> Last updated {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</span>
          )}
        </div>
      )}

      {legacyChain && chain.length > 0 && (
        <div style={{ padding: "11px 14px", borderRadius: 9,
                      background: "var(--gold-faint)", border: "1px solid rgba(245,158,11,0.22)",
                      fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>
          This existing chain was created under the previous rules, so it remains visible as part of the record.
          New chains require each market&apos;s own settled evidence and stay between 2x and 3x.
        </div>
      )}

      {/* Toggle + chain */}
      {loading && chain.length === 0 ? (
        <div className="editorial-rollover-load-inline">
          <BrandLoader variant="compact" message="Loading the rollover chain…" />
        </div>
      ) : error && !usingFallback ? (
        <div className="card" role="alert" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)" }}>
            We couldn’t load the rollover right now.
          </p>
          <button type="button" onClick={() => void refetch()} style={{
            minHeight: 40, marginTop: 14, padding: "8px 16px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--surface-2)",
            color: "var(--text-1)", fontFamily: "var(--font-body)", fontWeight: 700,
            cursor: "pointer",
          }}>Retry</button>
        </div>
      ) : chain.length === 0 ? null : (
        <div id="rollover-days">
          {/* Header + toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>
              {view === "today" ? "Today's pick" : `Full chain (${chain.length} days)`}
            </h2>
            <div style={{ display: "flex", padding: 2, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <button
                onClick={() => setView("today")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  minHeight: 40, padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
                  background: view === "today" ? "var(--surface)" : "transparent",
                  color: view === "today" ? "var(--brand)" : "var(--text-3)",
                  boxShadow: view === "today" ? "var(--shadow-md)" : "none",
                }}
              >
                <Zap size={11} /> Today
              </button>
              <button
                onClick={() => setView("all")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  minHeight: 40, padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
                  background: view === "all" ? "var(--surface)" : "transparent",
                  color: view === "all" ? "var(--brand)" : "var(--text-3)",
                  boxShadow: view === "all" ? "var(--shadow-md)" : "none",
                }}
              >
                <List size={11} /> Full chain
              </button>
            </div>
          </div>

          {/* Days */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visibleDays.length === 0 && (
              <div className="card" style={{ padding: "24px 18px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
                  {lostDays > 0
                    ? "This chain has ended. Open the full chain to review every result; a new challenge starts with the next published card."
                    : "There is no active rollover slot today. We wait when the board cannot reach the target with evidence-backed picks."}
                </p>
                <button type="button" onClick={() => setView("all")} style={{
                  minHeight: 40, marginTop: 12, padding: "8px 14px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--surface-2)",
                  color: "var(--text-1)", fontFamily: "var(--font-body)", fontWeight: 700,
                  cursor: "pointer",
                }}>View full chain</button>
              </div>
            )}
            {visibleDays.map(day => {
              const status = STATUS_CONFIG[day.status] || STATUS_CONFIG.pending;
              const isToday = todaysDay?.date === day.date;

              return (
                <article key={day.day_number}
                  className={`rollover-ticket rollover-ticket--${day.status}${isToday ? " rollover-ticket--today" : ""}`}
                  aria-label={`Day ${day.day_number} rollover ticket`}>
                  <header className="rollover-ticket__header">
                    <div className="rollover-ticket__heading">
                      <span className="rollover-ticket__day-number" aria-hidden="true">{day.day_number}</span>
                      <div>
                        <span className="rollover-ticket__eyebrow">ROLLOVER · DAY {day.day_number}</span>
                        <h3>{isToday ? "Today’s slip" : "Published slip"}</h3>
                        <span className="rollover-ticket__date">
                          <Calendar size={12} aria-hidden="true"/> {fmtDate(day.date)} · {day.picks.length} pick{day.picks.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <span className="rollover-ticket__status" data-state={day.status}>
                      {status.icon}{status.label}
                    </span>
                  </header>

                  <div className="rollover-ticket__overview">
                    <div>
                      <span className="rollover-ticket__metric-label">PUBLISHED SLIP ODDS</span>
                      <strong>{fmtOdds(day.combined_odds)}<small>{oddsSuffix}</small></strong>
                    </div>
                    <p className="rollover-ticket__chance">
                      {day.editorial_manual || day.picks.some(p => p.editorial_manual) ||
                       (day.hit_probability == null && day.avg_confidence == null)
                        ? "Admin-curated / not model scored"
                        : `Estimated chance: ${Math.round((day.hit_probability ?? day.avg_confidence ?? 0) * 100)}%`}
                      <small>Actual bookmaker odds may differ.</small>
                    </p>
                  </div>

                  <ol className="rollover-ticket__legs" aria-label={`Day ${day.day_number} selections`}>
                    {day.picks.map((pick, pi) => {
                      const mkt = MARKET_COLORS[pick.market] || { c: "var(--text-3)", l: pick.market };
                      return (
                        <li className="rollover-ticket__leg" key={`${pick.match_id || "fixture"}-${pi}`}>
                          <div className="rollover-ticket__crests" aria-hidden="true">
                            <TeamCrest size="sm" team={pick.home_team} logo={pick.home_team_logo} national={pick.team_type !== "CLUB"}/>
                            <TeamCrest size="sm" team={pick.away_team} logo={pick.away_team_logo} national={pick.team_type !== "CLUB"}/>
                          </div>
                          <div className="rollover-ticket__leg-content">
                            <div className="rollover-ticket__match">
                              <strong>{pick.home_team}</strong><span>vs</span><strong>{pick.away_team}</strong>
                            </div>
                            <p className="rollover-ticket__selection">
                              <span className="rollover-ticket__market" style={{ color: mkt.c }}>{mkt.l}</span>
                              <span>{pick.prediction}</span>
                            </p>
                            {pick.commence_time && (
                              <span className="rollover-ticket__kickoff">
                                {formatLocalTimeWithZone(pick.commence_time)}
                              </span>
                            )}
                          </div>
                          <div className="rollover-ticket__leg-odds">
                            <strong>{fmtOdds(pick.odds)}{oddsSuffix}</strong>
                            <small>{pick.editorial_manual || pick.confidence == null ? "Unscored" : `${Math.round(pick.confidence * 100)}% est.`}</small>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  {isToday && (
                    <div className="rollover-ticket__booking">
                      <BookingCode
                        booking={rollover?.booking}
                        category={catMeta}
                        tracking={{
                          source: "daily_card",
                          tier: "rollover",
                          legCount: rollover?.booking?.booked_leg_count ?? day.picks.length,
                          fingerprint: rollover?.booking?.booking_variant_fingerprint,
                        }}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Footer note */}
          <aside className="rollover-risk-note" aria-label="Rollover risk information">
            <p>All legs must win for the slip to win. Odds can change; check SportyBet before staking. Manual picks do not affect model calibration. 18+ · Bet responsibly.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
