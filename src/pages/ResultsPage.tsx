import React, { useState } from "react";
import { usePredictionHistory } from "../hooks/usePredictionHistory";
import { api } from "../api/predictions";
import type { CategoryResult } from "../api/predictions";
import { CATEGORIES } from "../types";
import {
  BarChart3, Calendar, Clock, TrendingUp, RefreshCw,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Trophy, Minus,
} from "lucide-react";

const DAY_OPTIONS = [7, 14, 30] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "completed";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 6,
      fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)", letterSpacing: "0.04em", textTransform: "uppercase",
      color: isOk ? "#22c55e" : "#f87171",
      background: isOk ? "rgba(34,197,94,0.10)" : "rgba(248,113,113,0.10)",
      border: `1px solid ${isOk ? "rgba(34,197,94,0.25)" : "rgba(248,113,113,0.25)"}`,
    }}>
      {isOk ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {status}
    </span>
  );
}

function ResultBadge({ result }: { result: string }) {
  const cfg: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    won: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: <CheckCircle2 size={12} /> },
    lost: { color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: <XCircle size={12} /> },
    pending: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: <Clock size={12} /> },
    void: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: <Minus size={12} /> },
  };
  const c = cfg[result] ?? cfg.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 6,
      fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)", textTransform: "uppercase",
      color: c.color, background: c.bg, border: `1px solid ${c.color}33`,
    }}>
      {c.icon} {result}
    </span>
  );
}

/** Expandable result-checker for a single day */
function DayResults({ date }: { date: string }) {
  const [results, setResults] = useState<Record<string, CategoryResult> | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (results) { setOpen(o => !o); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await api.getAccumulatorResults(date);
      setResults(r.categories);
      setOpen(true);
    } catch {
      setError("Could not load results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={load} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7,
        border: "1px solid var(--border)", background: "transparent",
        color: "var(--text-2)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
        cursor: "pointer", transition: "all 180ms ease",
      }}>
        {loading ? <RefreshCw size={13} className="spin" /> : open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {loading ? "Checking..." : open ? "Hide Results" : "Check Results"}
      </button>
      {error && <p style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>{error}</p>}

      {open && results && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {Object.entries(results).map(([catKey, cat]) => {
            const meta = CATEGORIES.find(c => c.key === catKey);
            if (!cat.selected) return null;
            const color = meta?.color ?? "var(--text-3)";

            return (
              <div key={catKey} style={{
                padding: "14px 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.02)", border: `1px solid ${color}22`,
              }}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color }}>
                      {meta?.label ?? catKey}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>
                      {cat.total_odds?.toFixed(2)}x
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#22c55e" }}>{cat.wins}W</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#f87171" }}>{cat.losses}L</span>
                    {(cat.pending ?? 0) > 0 && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#3b82f6" }}>{cat.pending}P</span>
                    )}
                    <ResultBadge result={cat.accumulator_result ?? "pending"} />
                  </div>
                </div>

                {/* Games */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cat.games?.map(g => (
                    <div key={g.fixture_id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
                      flexWrap: "wrap", gap: 6,
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                          {g.home_team} vs {g.away_team}
                        </span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
                          {g.prediction} @ {(g.odds ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {g.home_score != null && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
                            {g.home_score} – {g.away_score}
                          </span>
                        )}
                        <ResultBadge result={g.result} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ResultsPage() {
  const [days, setDays] = useState<number>(14);
  const { data, loading, error, refetch } = usePredictionHistory(days);
  const history = data?.history ?? [];

  const totalDays = history.length;
  const totalPredictions = history.reduce((s, h) => s + h.predictions_generated, 0);
  const totalFixtures = history.reduce((s, h) => s + h.total_fixtures, 0);
  const avgCategories = totalDays > 0
    ? (history.reduce((s, h) => s + Object.values(h.betting_counts).filter(v => v > 0).length, 0) / totalDays).toFixed(1)
    : "0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Track Record</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Results & History</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 6 }}>
          Browse past daily accumulator picks and check actual match results.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {DAY_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: "7px 16px", borderRadius: 8,
              border: `1px solid ${days === d ? "var(--brand)" : "var(--border)"}`,
              background: days === d ? "rgba(59,130,246,0.10)" : "transparent",
              color: days === d ? "var(--brand)" : "var(--text-3)",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 180ms ease",
            }}>{d}d</button>
          ))}
        </div>
        <button onClick={refetch} style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          borderRadius: 8, border: "1px solid var(--border)", background: "transparent",
          color: "var(--text-3)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: "var(--radius-md)",
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)",
        }}>{error}</div>
      )}

      {/* Summary stats */}
      {!loading && totalDays > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Days tracked", value: String(totalDays), icon: <Calendar size={18} color="var(--brand)" /> },
            { label: "Total predictions", value: String(totalPredictions), icon: <TrendingUp size={18} color="var(--green)" /> },
            { label: "Fixtures analyzed", value: String(totalFixtures), icon: <BarChart3 size={18} color="var(--blue)" /> },
            { label: "Avg categories/day", value: avgCategories, icon: <Trophy size={18} color="var(--purple)" /> },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{s.icon}</div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2 }}>{s.value}</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 96, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && totalDays === 0 && (
        <div className="card" style={{ padding: "64px 24px", textAlign: "center" }}>
          <BarChart3 size={48} strokeWidth={1.2} color="var(--text-3)" style={{ margin: "0 auto 20px" }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>
            No prediction history yet
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", maxWidth: 380, margin: "0 auto" }}>
            History will appear here after the first day of predictions is generated. Check back tomorrow!
          </p>
        </div>
      )}

      {/* History cards */}
      {!loading && history.map(day => {
        const activeCats = Object.entries(day.betting_counts).filter(([, v]) => v > 0);
        const totalPicks = activeCats.reduce((s, [, v]) => s + v, 0);
        const isToday = day.prediction_date === new Date().toISOString().slice(0, 10);

        return (
          <div key={day.prediction_date} className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Date + status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Calendar size={16} color="var(--text-3)" />
                <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
                  {formatDate(day.prediction_date)}
                </span>
                {isToday && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                    fontFamily: "var(--font-body)", background: "rgba(59,130,246,0.15)", color: "var(--brand)",
                  }}>TODAY</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusBadge status={day.status} />
                {day.generation_time && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                    {formatTime(day.generation_time)}
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>
              <span><strong style={{ color: "var(--text-2)" }}>{day.total_fixtures}</strong> fixtures</span>
              <span><strong style={{ color: "var(--text-2)" }}>{day.predictions_generated}</strong> predictions</span>
              <span><strong style={{ color: "var(--text-2)" }}>{day.models_used}</strong> models</span>
              {totalPicks > 0 && <span><strong style={{ color: "var(--brand)" }}>{totalPicks}</strong> accumulator picks</span>}
            </div>

            {/* Category badges */}
            {activeCats.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activeCats.map(([key, count]) => {
                  const meta = CATEGORIES.find(c => c.key === key);
                  const color = meta?.color ?? "var(--text-3)";
                  return (
                    <span key={key} style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 6,
                      fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)", color,
                      background: meta?.faint ?? "rgba(255,255,255,0.04)", border: `1px solid ${color}33`,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      {meta?.label ?? key}: {count}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", fontStyle: "italic" }}>
                No accumulator picks generated this day
              </p>
            )}

            {/* Check Results button — only for past days with picks */}
            {activeCats.length > 0 && day.status === "completed" && (
              <DayResults date={day.prediction_date} />
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
