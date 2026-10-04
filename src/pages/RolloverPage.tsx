import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import { Repeat2, CheckCircle, XCircle, Clock, Circle, TrendingUp, Calendar, List, Zap } from "lucide-react";
import { getTeamFlag, isWcNation, teamInitials, teamColor } from "../data/wcFlags";
import { SEO } from "../components/common/SEO";
import BookingCode from "../components/predictions/BookingCode";
import { formatLocalTimeWithZone } from "../utils/formatters";
import { api, type LiveScoresResponse } from "../api/predictions";
import "../styles/product-experience.css";

function TeamBadge({ team, logo }: { team: string; logo?: string | null }) {
  if (isWcNation(team)) {
    return (
      <img
        src={getTeamFlag(team, logo, 40)}
        alt=""
        style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <span style={{
      width: 18, height: 13, borderRadius: 2, flexShrink: 0,
      background: teamColor(team), color: "#fff",
      fontSize: 8, fontWeight: 800, fontFamily: "var(--font-mono)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      letterSpacing: "-0.04em",
    }}>{teamInitials(team)}</span>
  );
}

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

type LiveScore = LiveScoresResponse["scores"][string];

function RolloverMatchState({ score, officialStatus, kickoff }: {
  score?: LiveScore;
  officialStatus?: string;
  kickoff?: string;
}) {
  const settledLabel =
    officialStatus === "won"
      ? "Won"
      : officialStatus === "lost"
        ? "Lost"
        : officialStatus === "void"
          ? "Void"
          : null;

  if (score?.live && score.home_score != null && score.away_score != null) {
    return (
      <span
        aria-label="Live score"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--red)",
        }}
      >
        {score.home_score}?{score.away_score} ? LIVE
        {score.clock ? ` ${score.clock}` : ""}
      </span>
    );
  }

  if (
    score?.finished
    && score.home_score != null
    && score.away_score != null
  ) {
    return (
      <span
        aria-label="Final score"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-2)",
        }}
      >
        {score.home_score}?{score.away_score} ? FT ?{" "}
        {settledLabel ?? "Awaiting settlement"}
      </span>
    );
  }

  if (settledLabel) {
    return (
      <span
        aria-label="Settlement status"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          color: officialStatus === "lost"
            ? "var(--red)"
            : officialStatus === "won"
              ? "var(--green)"
              : "var(--text-3)",
        }}
      >
        {settledLabel}
      </span>
    );
  }

  if (kickoff) {
    const kickoffMs = Date.parse(kickoff);
    const hasStarted =
      Number.isFinite(kickoffMs) && kickoffMs <= Date.now();

    return (
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--text-3)",
        }}
      >
        {hasStarted ? "Awaiting score" : "Upcoming"} ?{" "}
        {formatLocalTimeWithZone(kickoff)}
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        color: "var(--text-3)",
      }}
    >
      Pending
    </span>
  );
}

export function RolloverPage() {
  const {
    data,
    loading,
    error,
    usingFallback,
    lastUpdated,
    refetch,
    refetchSilent = refetch,
  } = usePredictions();
  const [view, setView] = useState<"today" | "all">("today");
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();
  const rollover = data?.accumulators?.rollover;
  const catMeta = CATEGORIES.find(c => c.key === "rollover")!;
  const chain = rollover?.chain ?? [];
  const targetDays = rollover?.target_days ?? 3;
  const completionProbability = rollover?.completion_probability;
  const [scores, setScores] = useState<LiveScoresResponse["scores"]>({});
  const silentRefetchRef = useRef(refetchSilent);

  useEffect(() => {
    silentRefetchRef.current = refetchSilent;
  }, [refetchSilent]);

  const today = new Date(
    Date.now() + 60 * 60 * 1000
  ).toISOString().slice(0, 10);

  // A pending future rollover day must not keep the browser polling all day.
  // Poll settlement/card state only once its WAT calendar day has arrived.
  const shouldPoll = useMemo(
    () =>
      chain.some(
        day =>
          day.date <= today
          && day.picks.some(
            pick =>
              pick.status !== "won"
              && pick.status !== "lost"
              && pick.status !== "void",
          ),
      ),
    [chain, today],
  );

  useEffect(() => {
    if (chain.length === 0) return;

    let active = true;

    const refreshScores = () => {
      void api.getLiveScores()
        .then(response => {
          if (active) setScores(response.scores || {});
        })
        .catch(() => {
          // Live scores are presentation-only. A provider failure must never
          // hide or mutate the persisted rollover chain.
        });
    };

    // Always fetch once. This is important for a visitor opening the page
    // after a match has already settled: they should still see the FT score.
    refreshScores();

    if (!shouldPoll) {
      return () => {
        active = false;
      };
    }

    // The hook may have served its normal five-minute cache. Refresh the
    // backend settlement state immediately without switching the whole page
    // back into its loading skeleton.
    void silentRefetchRef.current();

    const timer = window.setInterval(() => {
      refreshScores();
      void silentRefetchRef.current();
    }, 75_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [chain.length, shouldPoll]);

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
  const legacyChain = chain.some(day =>
    day.picks.some(pick => pick.safe_tier_eligible !== true),
  );

  // Prefer the actual WAT calendar day even after it has settled, so a user
  // returning after full time can still see today's result and score.
  const calendarDay = chain.find(d => d.date === today);
  const nextPendingDay = isAlive
    ? chain.find(d => d.date >= today && d.status === "pending")
    : undefined;
  const todaysDay = calendarDay ?? nextPendingDay;

  // Once an official settlement marks the chain lost, keep all of its legs in
  // view. A user should never have to infer what broke a published challenge.
  const visibleDays =
    lostDays > 0 || view === "all"
      ? chain
      : todaysDay
        ? [todaysDay]
        : [];

  // Cumulative odds
  const cumOdds = rollover?.cumulative_odds ?? rollover?.total_odds ?? 0;

  return (
    <div className="page-stack rollover-page" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SEO title="Rollover Challenge" description="3-day rollover challenge using evidence-backed daily picks. Every leg must land for the chain to continue." path="/rollover" />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: catMeta.faint, border: `1px solid ${catMeta.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Repeat2 size={22} color={catMeta.color} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{targetDays}-day evidence challenge</div>
          <h1 style={{ fontSize: 30, fontWeight: 800 }}>Rollover</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 4, maxWidth: 560, lineHeight: 1.6 }}>
            Each day uses up to six evidence-backed picks to reach 2x–3x.
            Every leg must land for the day to count. If the board cannot support that
            range honestly, the challenge waits instead of adding an unproven pick.
          </p>
        </div>
      </div>

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
              {legacyChain
                ? "Previous selection rules"
                : "Evidence-backed picks"}
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
              : `Targets 2x–3x per qualifying day.`}
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
      {loading ? (
        <BrandLoader message="Loading the rollover chain...">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(i => <PredictionCardSkeleton key={i} />)}
          </div>
        </BrandLoader>
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
      ) : chain.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)" }}>
            No rollover chain yet. A challenge begins when the upcoming board has enough evidence-backed picks.
          </p>
        </div>
      ) : (
        <div>
          {/* Header + toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>
              {lostDays > 0 || view === "all" ? `Full chain (${chain.length} days)` : "Today's pick"}
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
              const isToday = day.date === today;

              return (
                <div
                  key={day.day_number}
                  className="card"
                  style={{
                    padding: "16px 18px",
                    borderLeft: isToday ? `3px solid var(--blue)` : `3px solid ${status.color}`,
                    opacity: day.status === "lost" ? 0.55 : 1,
                  }}
                >
                  {/* Day header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: isToday ? "var(--blue-faint)" : status.bg,
                      color: isToday ? "var(--blue)" : status.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {day.day_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                          Day {day.day_number}
                        </p>
                        {isToday && (
                          <span style={{
                            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, padding: "2px 6px",
                            background: "var(--blue-faint)", color: "var(--blue)", borderRadius: 4,
                            textTransform: "uppercase", letterSpacing: "0.08em",
                          }}>Today</span>
                        )}
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={11} /> {fmtDate(day.date)} · {day.picks.length} pick{day.picks.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {/* Combined odds */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 800, color: catMeta.color, lineHeight: 1 }}>
                        {fmtOdds(day.combined_odds)}{oddsSuffix}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                        lands ~{Math.round((day.hit_probability ?? day.avg_confidence) * 100)}%
                      </p>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 8px", borderRadius: 6,
                      background: status.bg, color: status.color,
                      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                    }}>
                      {status.icon} {status.label}
                    </div>
                  </div>

                  {/* Picks */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 50 }}>
                    {day.picks.map((pick, pi) => {
                      const mkt = MARKET_COLORS[pick.market] || { c: "var(--text-3)", l: pick.market };
                      return (
                        <div key={pi} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 10px", borderRadius: 8,
                          background: "var(--surface-2)",
                        }}>
                          {/* Flags or initials badges */}
                          <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                            <TeamBadge team={pick.home_team} logo={pick.home_team_logo} />
                            <TeamBadge team={pick.away_team} logo={pick.away_team_logo} />
                          </div>
                          {/* Match */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                              {pick.home_team} <span style={{ color: "var(--text-3)" }}>vs</span> {pick.away_team}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                                padding: "1px 5px", borderRadius: 3,
                                background: `color-mix(in srgb, ${mkt.c} 12%, transparent)`,
                                color: mkt.c, letterSpacing: "0.08em", textTransform: "uppercase",
                              }}>{mkt.l}</span>
                              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-2)", fontWeight: 600 }}>
                                {pick.prediction}
                              </span>
                              <RolloverMatchState
                                score={scores[pick.match_id]}
                                officialStatus={pick.status}
                                kickoff={pick.commence_time}
                              />
                            </div>
                          </div>
                          {/* Odds + conf */}
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: catMeta.color, lineHeight: 1 }}>
                              {fmtOdds(pick.odds)}{oddsSuffix}
                            </p>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: pick.confidence >= 0.8 ? "var(--green)" : "var(--brand)", marginTop: 2 }}>
                              {Math.round(pick.confidence * 100)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {isToday && day.status === "pending" && (
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 18, padding: "12px 16px", background: "var(--surface-2)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <TrendingUp size={14} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
              Each day uses the highest-probability combination of up to six evidence-backed picks to land between 2x and 3x.
              No match appears more than once. Every extra leg is another chance to lose, and one
              losing leg ends the chain. Probabilities describe risk; they do not guarantee a return.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
