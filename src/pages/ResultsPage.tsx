import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3, CheckCircle2, XCircle, Clock, RefreshCw, TrendingUp, Calendar, Trophy,
} from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
import { getTeamFlag, isWcNation, teamInitials, teamColor } from "../data/wcFlags";

function TeamBadge({ team }: { team: string }) {
  if (isWcNation(team)) {
    return (
      <img src={getTeamFlag(team, null, 40)} alt="" style={{ width: 16, height: 11, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <span style={{
      width: 16, height: 11, borderRadius: 2, flexShrink: 0,
      background: teamColor(team), color: "#fff",
      fontSize: 7, fontWeight: 800, fontFamily: "var(--font-mono)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>{teamInitials(team)}</span>
  );
}

function fmtDate(iso: string) {
  const safe = iso.length === 10 ? iso + "T12:00:00Z" : iso;
  return new Date(safe).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

const STATUS: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  won: { color: "var(--green)", bg: "rgba(34,197,94,0.10)", label: "Won", icon: <CheckCircle2 size={12} /> },
  lost: { color: "var(--red)", bg: "rgba(248,113,113,0.10)", label: "Lost", icon: <XCircle size={12} /> },
  pending: { color: "var(--text-3)", bg: "var(--surface-2)", label: "Pending", icon: <Clock size={12} /> },
  void: { color: "var(--text-3)", bg: "var(--surface-2)", label: "Void", icon: <Clock size={12} /> },
};

export function ResultsPage() {
  const { data, loading, error, refetch } = usePredictions();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "won" | "lost" | "pending">("all");

  const chain = data?.accumulators?.rollover?.chain ?? [];

  // Sort newest first (most recent date at top)
  const sortedChain = useMemo(
    () => [...chain].sort((a, b) => b.date.localeCompare(a.date)),
    [chain]
  );
  const filtered = useMemo(
    () => filter === "all" ? sortedChain : sortedChain.filter(d => d.status === filter),
    [sortedChain, filter]
  );

  const stats = useMemo(() => {
    const total = chain.length;
    const won = chain.filter(d => d.status === "won").length;
    const lost = chain.filter(d => d.status === "lost").length;
    const pending = chain.filter(d => d.status === "pending").length;
    const resolved = won + lost;
    const winRate = resolved > 0 ? Math.round((won / resolved) * 100) : 0;
    return { total, won, lost, pending, resolved, winRate };
  }, [chain]);

  async function triggerCheck() {
    setRefreshing(true);
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
      await fetch(`${base}/api/worldcup/check-results`, { method: "POST" });
      await refetch();
    } catch (e) {
      console.error("Results check failed", e);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={14} color="var(--brand)" />
          Results & History
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.1 }}>
          How are we <span className="text-brand-gradient">doing?</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 10, maxWidth: 540, lineHeight: 1.7 }}>
          Live results from the 10-day rollover challenge. Results auto-update every 6 hours;
          you can force a check below.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <div className="card" style={{ padding: "18px 20px", borderLeft: `3px solid var(--brand)` }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total tracked</p>
          <p className="stat-num" style={{ fontSize: 28 }}>{stats.total}</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>days</p>
        </div>
        <div className="card" style={{ padding: "18px 20px", borderLeft: `3px solid var(--green)` }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Won</p>
          <p className="stat-num" style={{ fontSize: 28, color: "var(--green)" }}>{stats.won}</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>days won</p>
        </div>
        <div className="card" style={{ padding: "18px 20px", borderLeft: `3px solid var(--red)` }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Lost</p>
          <p className="stat-num" style={{ fontSize: 28, color: "var(--red)" }}>{stats.lost}</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>days lost</p>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Win rate</p>
          <p className="stat-num" style={{ fontSize: 28, color: stats.winRate >= 60 ? "var(--green)" : "var(--text-1)" }}>{stats.winRate}%</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>of resolved days</p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", padding: 2, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
          {(["all", "won", "lost", "pending"] as const).map(k => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: filter === k ? "var(--surface)" : "transparent",
              color: filter === k ? "var(--brand)" : "var(--text-3)",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              textTransform: "capitalize",
              boxShadow: filter === k ? "var(--shadow-md)" : "none",
            }}>{k}</button>
          ))}
        </div>
        <button onClick={triggerCheck} disabled={refreshing} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--surface)", cursor: refreshing ? "wait" : "pointer",
          color: "var(--text-2)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
        }}>
          <RefreshCw size={12} style={refreshing ? { animation: "spin 0.8s linear infinite" } : undefined} />
          {refreshing ? "Checking..." : "Check now"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: "var(--radius-md)",
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)",
        }}>{error}</div>
      )}

      {/* Day list */}
      {loading && chain.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: 80, opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <Trophy size={28} color="var(--text-3)" style={{ marginBottom: 12 }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", marginBottom: 4 }}>
            {filter === "all" ? "No tracked days yet" : `No ${filter} days yet`}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>
            {filter === "all" ? "The rollover chain populates as matches are scheduled." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(day => {
            const s = STATUS[day.status] || STATUS.pending;
            return (
              <div key={day.day_number} className="card" style={{ padding: "16px 18px", borderLeft: `3px solid ${s.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: s.bg, color: s.color,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 800,
                  }}>{day.day_number}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                      Day {day.day_number}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Calendar size={10} /> {fmtDate(day.date)} · {day.picks.length} pick{day.picks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", borderRadius: 6,
                    background: s.bg, color: s.color,
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{s.icon} {s.label}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--brand)",
                  }}>{day.combined_odds.toFixed(2)}x</span>
                </div>
                <div style={{ paddingLeft: 42, display: "flex", flexDirection: "column", gap: 6 }}>
                  {day.picks.map((p, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", background: "var(--surface-2)", borderRadius: 6,
                    }}>
                      <TeamBadge team={p.home_team} />
                      <TeamBadge team={p.away_team} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)", flex: 1, minWidth: 0 }}>
                        {p.home_team} <span style={{ color: "var(--text-3)" }}>vs</span> {p.away_team}
                      </span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--brand)", fontWeight: 600 }}>
                        {p.prediction}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)",
                        padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)",
                      }}>{p.odds.toFixed(2)}x</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
