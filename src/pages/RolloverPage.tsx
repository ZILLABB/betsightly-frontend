import React, { useState } from "react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import { Repeat2, CheckCircle, XCircle, Clock, Circle, TrendingUp, Calendar, List, Zap } from "lucide-react";
import { getTeamFlag, isWcNation, teamInitials, teamColor } from "../data/wcFlags";
import { SEO } from "../components/common/SEO";

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
};

function fmtDate(iso: string) {
  // Force UTC so we don't drift into the next/prev day in local time
  const safe = iso.length === 10 ? iso + "T12:00:00Z" : iso;
  return new Date(safe).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function RolloverPage() {
  const { data, loading, error } = usePredictions();
  const [view, setView] = useState<"today" | "all">("today");
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();
  const rollover = data?.accumulators?.rollover;
  const catMeta = CATEGORIES.find(c => c.key === "rollover")!;
  const chain = rollover?.chain ?? [];
  const targetDays = rollover?.target_days ?? 10;

  // Stats
  const wonDays = chain.filter(d => d.status === "won").length;
  const lostDays = chain.filter(d => d.status === "lost").length;
  const completedDays = wonDays + lostDays;
  const pendingDays = chain.length - completedDays;
  const isAlive = lostDays === 0;

  // Find today's day slot (first pending day whose date is >= today)
  const today = new Date().toISOString().slice(0, 10);
  const todaysDay = chain.find(d => d.date >= today && d.status === "pending");

  // Cumulative odds
  const cumOdds = rollover?.cumulative_odds ?? rollover?.total_odds ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <SEO title="Rollover Challenge" description="10-day rollover challenge — daily safest picks from active leagues and the World Cup. All picks must hit for the day to count." path="/rollover" />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: catMeta.faint, border: `1px solid ${catMeta.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Repeat2 size={22} color={catMeta.color} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>10-day safe challenge</div>
          <h1 style={{ fontSize: 30, fontWeight: 800 }}>Rollover</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 4, maxWidth: 560, lineHeight: 1.6 }}>
            Each day has 1–3 safest picks pulled from active leagues + the World Cup.
            All picks on a day must hit for that day to count. Days with no safe matches are skipped.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      {chain.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div className="card" style={{ padding: "18px 20px", borderLeft: `3px solid ${catMeta.color}` }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total payout multiplier</p>
            <p className="stat-num" style={{ fontSize: 32, color: catMeta.color, lineHeight: 1.05 }}>{fmtOdds(cumOdds)}{oddsSuffix}</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>If all {chain.length} days hit</p>
          </div>

          <div className="card" style={{ padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Progress</p>
            <p className="stat-num" style={{ fontSize: 32, color: "var(--text-1)", lineHeight: 1.05 }}>{wonDays}/{chain.length}</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{pendingDays} pending · {lostDays} lost</p>
          </div>

          <div className="card" style={{ padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Chain status</p>
            <p className="stat-num" style={{ fontSize: 22, color: isAlive ? "var(--green)" : "var(--red)", lineHeight: 1.05 }}>
              {isAlive ? (completedDays === chain.length ? "Completed" : "Active") : "Broken"}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>Safest picks only</p>
          </div>

          {todaysDay && (
            <div className="card" style={{ padding: "18px 20px", borderLeft: `3px solid var(--blue)` }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Today's slot</p>
              <p className="stat-num" style={{ fontSize: 22, color: "var(--text-1)", lineHeight: 1.05 }}>{todaysDay.picks.length} pick{todaysDay.picks.length !== 1 ? "s" : ""}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>Combined {todaysDay.combined_odds}x</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {/* Toggle + chain */}
      {loading ? (
        <BrandLoader message="Loading the rollover chain...">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(i => <PredictionCardSkeleton key={i} />)}
          </div>
        </BrandLoader>
      ) : chain.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)" }}>
            No rollover chain yet. The challenge begins when WC matches are scheduled.
          </p>
        </div>
      ) : (
        <div>
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
                  padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
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
                  padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
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
            {(view === "today" && todaysDay ? [todaysDay] : chain).map(day => {
              const status = STATUS_CONFIG[day.status] || STATUS_CONFIG.pending;
              const isToday = todaysDay?.date === day.date;

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
                        avg {Math.round(day.avg_confidence * 100)}% conf
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
                              {pick.commence_time && (
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-3)" }}>
                                  ⏱ {new Date(pick.commence_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                                </span>
                              )}
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
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 18, padding: "12px 16px", background: "var(--surface-2)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <TrendingUp size={14} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
              Each day picks the 1–3 safest matches available — across active club leagues and the World Cup —
              at ≥65% confidence. No match appears more than once. Days with no safe matches are skipped so the
              {" "}{chain.length}-day chain pulls from the next available dates. Lose any single pick on any day and the chain breaks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
