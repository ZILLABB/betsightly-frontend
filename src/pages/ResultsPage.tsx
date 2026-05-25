import React, { useState } from "react";
import { usePredictionHistory } from "../hooks/usePredictionHistory";
import { CATEGORIES } from "../types";
import { BarChart3, Calendar, Clock, TrendingUp, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const DAY_OPTIONS = [7, 14, 30] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "completed";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: isOk ? "#22c55e" : "#f87171",
        background: isOk ? "rgba(34,197,94,0.10)" : "rgba(248,113,113,0.10)",
        border: `1px solid ${isOk ? "rgba(34,197,94,0.25)" : "rgba(248,113,113,0.25)"}`,
      }}
    >
      {isOk ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {status}
    </span>
  );
}

export function ResultsPage() {
  const [days, setDays] = useState<number>(14);
  const { data, loading, error, refetch } = usePredictionHistory(days);

  const history = data?.history ?? [];

  // Summary stats
  const totalDays = history.length;
  const totalPredictions = history.reduce((s, h) => s + h.predictions_generated, 0);
  const totalFixtures = history.reduce((s, h) => s + h.total_fixtures, 0);
  const avgCategories =
    totalDays > 0
      ? (
          history.reduce((s, h) => {
            const active = Object.values(h.betting_counts).filter(v => v > 0).length;
            return s + active;
          }, 0) / totalDays
        ).toFixed(1)
      : "0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Track Record
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Prediction History</h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--text-3)",
            marginTop: 6,
          }}
        >
          Browse past daily accumulator picks and generation stats.
        </p>
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Days selector */}
        <div style={{ display: "flex", gap: 6 }}>
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: `1px solid ${days === d ? "var(--brand)" : "var(--border)"}`,
                background: days === d ? "rgba(245,158,11,0.10)" : "transparent",
                color: days === d ? "var(--brand)" : "var(--text-3)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 180ms ease",
              }}
            >
              {d}d
            </button>
          ))}
        </div>

        <button
          onClick={refetch}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-3)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--red)",
          }}
        >
          {error}
        </div>
      )}

      {/* Summary stats */}
      {!loading && totalDays > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Days tracked", value: String(totalDays), icon: <Calendar size={18} color="var(--brand)" /> },
            { label: "Total predictions", value: String(totalPredictions), icon: <TrendingUp size={18} color="var(--green)" /> },
            { label: "Fixtures analyzed", value: String(totalFixtures), icon: <BarChart3 size={18} color="var(--blue)" /> },
            { label: "Avg categories/day", value: avgCategories, icon: <Clock size={18} color="var(--purple)" /> },
          ].map(s => (
            <div
              key={s.label}
              className="card"
              style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--text-1)",
                    lineHeight: 1.2,
                  }}
                >
                  {s.value}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="card skeleton"
              style={{ height: 96, borderRadius: "var(--radius-lg)" }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && totalDays === 0 && (
        <div
          className="card"
          style={{ padding: "64px 24px", textAlign: "center" }}
        >
          <BarChart3
            size={48}
            strokeWidth={1.2}
            color="var(--text-3)"
            style={{ margin: "0 auto 20px" }}
          />
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-1)",
              marginBottom: 8,
            }}
          >
            No prediction history yet
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-3)",
              maxWidth: 380,
              margin: "0 auto",
            }}
          >
            History will appear here after the first day of predictions is generated.
            Check back tomorrow!
          </p>
        </div>
      )}

      {/* History cards */}
      {!loading &&
        history.map(day => {
          const activeCats = Object.entries(day.betting_counts).filter(
            ([, v]) => v > 0,
          );
          const totalPicks = activeCats.reduce((s, [, v]) => s + v, 0);

          return (
            <div
              key={day.prediction_date}
              className="card"
              style={{
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Date + status row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={16} color="var(--text-3)" />
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text-1)",
                    }}
                  >
                    {formatDate(day.prediction_date)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusBadge status={day.status} />
                  {day.generation_time && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-3)",
                      }}
                    >
                      {formatTime(day.generation_time)}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--text-3)",
                }}
              >
                <span>
                  <strong style={{ color: "var(--text-2)" }}>{day.total_fixtures}</strong> fixtures
                </span>
                <span>
                  <strong style={{ color: "var(--text-2)" }}>{day.predictions_generated}</strong> predictions
                </span>
                <span>
                  <strong style={{ color: "var(--text-2)" }}>{day.models_used}</strong> models
                </span>
                {totalPicks > 0 && (
                  <span>
                    <strong style={{ color: "var(--brand)" }}>{totalPicks}</strong> accumulator picks
                  </span>
                )}
              </div>

              {/* Category badges */}
              {activeCats.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {activeCats.map(([key, count]) => {
                    const meta = CATEGORIES.find(c => c.key === key);
                    const color = meta?.color ?? "var(--text-3)";
                    const label = meta?.label ?? key;
                    return (
                      <span
                        key={key}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "var(--font-body)",
                          color,
                          background: meta?.faint ?? "rgba(255,255,255,0.04)",
                          border: `1px solid ${color}33`,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: color,
                            flexShrink: 0,
                          }}
                        />
                        {label}: {count}
                      </span>
                    );
                  })}
                </div>
              )}

              {activeCats.length === 0 && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--text-3)",
                    fontStyle: "italic",
                  }}
                >
                  No accumulator picks generated this day
                </p>
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
