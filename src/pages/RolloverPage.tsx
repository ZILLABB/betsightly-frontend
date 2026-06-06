import React, { useState } from "react";
import { usePredictions } from "../hooks/usePredictions";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { CATEGORIES } from "../types";
import { Repeat2, CheckCircle, XCircle, Clock, Circle, TrendingUp, Calendar, List, Zap } from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  won: { icon: <CheckCircle size={14} />, color: "var(--green)", bg: "rgba(34,197,94,0.10)", label: "Won" },
  lost: { icon: <XCircle size={14} />, color: "var(--red)", bg: "rgba(248,113,113,0.10)", label: "Lost" },
  pending: { icon: <Clock size={14} />, color: "var(--text-3)", bg: "var(--surface-2)", label: "Pending" },
  void: { icon: <Circle size={14} />, color: "var(--text-3)", bg: "var(--surface-2)", label: "Void" },
};

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function RolloverPage() {
  const { data, loading, error } = usePredictions();
  const [view, setView] = useState<"today" | "all">("today");
  const rollover = data?.accumulators?.rollover;
  const catMeta = CATEGORIES.find(c => c.key === "rollover")!;
  const chain = rollover?.chain ?? [];
  const targetDays = rollover?.target_days ?? 10;

  // Calculate progress
  const wonDays = chain.filter(d => d.status === "won").length;
  const lostDays = chain.filter(d => d.status === "lost").length;
  const completedDays = wonDays + lostDays;
  const pendingDays = chain.length - completedDays;
  const isAlive = lostDays === 0;

  // Find today's pick (first pending)
  const today = new Date().toISOString().slice(0, 10);
  const todaysPick = chain.find(d => d.date >= today && d.status === "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: catMeta.faint, border: `1px solid ${catMeta.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Repeat2 size={22} color={catMeta.color} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>10-day challenge</div>
          <h1 style={{ fontSize: 30, fontWeight: 800 }}>Rollover</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 4, maxWidth: 540, lineHeight: 1.6 }}>
            One carefully-picked bet per day at 1.5–3.0 odds. Win every day for 10 days to multiply your stake by ~100x.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      {rollover && rollover.selected && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {/* Cumulative odds */}
          <div className="card" style={{ padding: "18px 20px", borderLeft: `3px solid ${catMeta.color}` }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total payout multiplier</p>
            <p className="stat-num" style={{ fontSize: 32, color: catMeta.color, lineHeight: 1.05 }}>{(rollover.cumulative_odds ?? rollover.total_odds).toFixed(2)}x</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>If all {targetDays} days win</p>
          </div>

          {/* Progress */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Progress</p>
            <p className="stat-num" style={{ fontSize: 32, color: "var(--text-1)", lineHeight: 1.05 }}>{wonDays}/{targetDays}</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{pendingDays} pending, {lostDays} lost</p>
          </div>

          {/* Status */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Chain status</p>
            <p className="stat-num" style={{ fontSize: 22, color: isAlive ? "var(--green)" : "var(--red)", lineHeight: 1.05 }}>
              {isAlive ? (completedDays === targetDays ? "Completed" : "Active") : "Broken"}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{rollover.risk_level}</p>
          </div>

          {/* Today's pick */}
          {todaysPick && (
            <div className="card" style={{ padding: "18px 20px", borderLeft: `3px solid var(--blue)` }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Today's pick</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{todaysPick.prediction}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>@{todaysPick.odds} · Day {todaysPick.day_number}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {/* 10-day chain */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <PredictionCardSkeleton key={i} />)}
        </div>
      ) : chain.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)" }}>
            No rollover chain available yet. The challenge will begin when matches are scheduled.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>
              {view === "today" ? "Today's pick" : `The ${targetDays}-day chain`}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
                {targetDays}× wins → {(rollover?.cumulative_odds ?? rollover?.total_odds ?? 0).toFixed(0)}× payout
              </p>
              {/* View toggle */}
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
          </div>

          {/* Compact chain list — filtered by view */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(view === "today"
              ? chain.filter(d => d.date >= today && d.status === "pending").slice(0, 1)
              : chain
            ).map((day, idx, arr) => {
              // Find original index for cum odds calculation
              const origIdx = chain.findIndex(c => c.date === day.date);
              const status = STATUS_CONFIG[day.status] || STATUS_CONFIG.pending;
              const todayIdx = chain.findIndex(d => d.date >= today && d.status === "pending");
              const isToday = day.date >= today && day.status === "pending" && origIdx === todayIdx;

              // Cumulative odds up to this day (using original index)
              let cum = 1;
              for (let i = 0; i <= origIdx; i++) cum *= chain[i].odds;

              return (
                <div
                  key={day.day_number}
                  className="card"
                  style={{
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    borderLeft: isToday ? `3px solid var(--blue)` : `3px solid ${status.color}`,
                    opacity: day.status === "lost" ? 0.6 : 1,
                  }}
                >
                  {/* Day number */}
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

                  {/* Match + prediction */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {day.match}
                      </p>
                      {isToday && (
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, padding: "2px 6px",
                          background: "var(--blue-faint)", color: "var(--blue)", borderRadius: 4,
                          textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>Today</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {day.market && (() => {
                        const MKT: Record<string, { c: string; l: string }> = {
                          match_result: { c: "var(--blue)", l: "Result" },
                          goals: { c: "var(--green)", l: "Goals" },
                          btts: { c: "var(--purple)", l: "BTTS" },
                          double_chance: { c: "var(--accent)", l: "DC" },
                        };
                        const m = MKT[day.market] || { c: "var(--text-3)", l: day.market };
                        return (
                          <span style={{
                            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                            padding: "1px 5px", borderRadius: 3,
                            background: `color-mix(in srgb, ${m.c} 12%, transparent)`,
                            color: m.c, letterSpacing: "0.08em", textTransform: "uppercase",
                          }}>{m.l}</span>
                        );
                      })()}
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>
                        {day.prediction}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                        <Calendar size={10} /> {fmtDate(day.date)}
                      </span>
                    </div>
                  </div>

                  {/* Odds */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: catMeta.color }}>
                      {day.odds.toFixed(2)}x
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                      cum {cum.toFixed(1)}x
                    </p>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", borderRadius: 6,
                    background: status.bg, color: status.color,
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    flexShrink: 0,
                  }}>
                    {status.icon} {status.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 18, padding: "12px 16px", background: "var(--surface-2)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <TrendingUp size={14} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
              Each day's pick is selected from World Cup matches at 1.5–3.0 odds based on highest confidence.
              Lose any single day and the chain breaks. The {(rollover?.cumulative_odds ?? rollover?.total_odds ?? 0).toFixed(0)}× multiplier is the payout if every day wins.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
