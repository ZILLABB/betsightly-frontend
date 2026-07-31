import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3, CheckCircle2, XCircle, Clock, RefreshCw, Calendar, Trophy, MinusCircle,
} from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { getTeamFlag, isWcNation, teamInitials, teamColor } from "../data/wcFlags";
import { SEO } from "../components/common/SEO";
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import { api, type LeagueResultsResponse, type SettledSlip, type CalibrationResponse } from "../api/predictions";

function TeamBadge({ team }: { team: string }) {
  if (isWcNation(team)) {
    return (
      <img src={getTeamFlag(team, null, 40)} alt="" style={{ width: 16, height: 11, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <span style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
      background: teamColor(team), color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-mono)", fontSize: 7, fontWeight: 800,
    }}>{teamInitials(team)}</span>
  );
}

const STATUS: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  won: { color: "var(--green)", bg: "rgba(16,185,129,0.10)", label: "Won", icon: <CheckCircle2 size={11} /> },
  lost: { color: "var(--red)", bg: "rgba(248,113,113,0.10)", label: "Lost", icon: <XCircle size={11} /> },
  pending: { color: "var(--text-3)", bg: "var(--overlay-2)", label: "Pending", icon: <Clock size={11} /> },
  void: { color: "var(--text-3)", bg: "var(--overlay-2)", label: "Void", icon: <MinusCircle size={11} /> },
};

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

const catMeta = (key: string) => CATEGORIES.find(c => c.key === key);
const catLabel = (key: string) => catMeta(key)?.label ?? key;
const catColor = (key: string) => catMeta(key)?.color ?? "var(--brand)";

export function ResultsPage() {
  const { data, loading, error, refetch } = usePredictions();
  const [refreshing, setRefreshing] = useState(false);
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();
  const [tab, setTab] = useState<"categories" | "rollover">("categories");
  const [filter, setFilter] = useState<"all" | "won" | "lost" | "pending">("all");

  const [league, setLeague] = useState<LeagueResultsResponse | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(true);
  const [calib, setCalib] = useState<CalibrationResponse | null>(null);

  useEffect(() => {
    let alive = true;
    api.getLeagueResults(30)
      .then(r => { if (alive) setLeague(r); })
      .catch(() => { /* section renders its own empty state */ })
      .finally(() => { if (alive) setLeagueLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    api.getCalibration(180)
      .then(r => { if (alive) setCalib(r); })
      .catch(() => { /* section hides itself when there is no sample */ });
    return () => { alive = false; };
  }, []);

  const chain = data?.accumulators?.rollover?.chain ?? [];

  const sortedChain = useMemo(
    () => [...chain].sort((a, b) => b.date.localeCompare(a.date)),
    [chain]
  );
  const filteredChain = useMemo(
    () => filter === "all" ? sortedChain : sortedChain.filter(d => d.status === filter),
    [sortedChain, filter]
  );

  const slips = useMemo(() => {
    const all = league?.history ?? [];
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    return filter === "all" ? sorted : sorted.filter(s => s.status === filter);
  }, [league, filter]);

  const chainStats = useMemo(() => {
    const won = chain.filter(d => d.status === "won").length;
    const lost = chain.filter(d => d.status === "lost").length;
    const resolved = won + lost;
    return { total: chain.length, won, lost, resolved, winRate: resolved ? Math.round(won / resolved * 100) : 0 };
  }, [chain]);

  const overall = useMemo(() => {
    const s = league?.summary ?? {};
    const won = Object.values(s).reduce((a, c) => a + c.won, 0);
    const lost = Object.values(s).reduce((a, c) => a + c.lost, 0);
    const profit = Object.values(s).reduce((a, c) => a + c.profit, 0);
    const settled = won + lost;
    return { won, lost, settled, winRate: settled ? Math.round(won / settled * 100) : 0, profit };
  }, [league]);

  async function triggerCheck() {
    setRefreshing(true);
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || "https://betsightly-api.onrender.com/api").replace(/\/api\/?$/, "");
      await fetch(`${base}/api/leagues/check-results`, { method: "POST" });
      await refetch();
      const fresh = await api.getLeagueResults(30);
      setLeague(fresh);
    } catch {
      /* leave the UI as-is; the spinner stops below */
    } finally {
      setRefreshing(false);
    }
  }

  const showingCategories = tab === "categories";

  return (
    <div className="page-stack" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <SEO title="Results" description="Settled results for every BetSightly category — banker, 2 odds, 5 odds, 10 odds, over 1.5 and the rollover chain." path="/results" />

      <div>
        <div className="eyebrow" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={14} color="var(--brand)" />
          Track Record
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.1 }}>
          Every pick, <span className="text-brand-gradient">settled in public</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 10, maxWidth: 560, lineHeight: 1.7 }}>
          Every slip we publish is archived the day it goes out and graded against final scores —
          wins and losses both stay on the board. Profit assumes a flat 1 unit on each slip.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", padding: 3, background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--border)", width: "fit-content" }}>
        {([["categories", "All categories"], ["rollover", "Rollover chain"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer",
            background: tab === k ? "var(--surface)" : "transparent",
            color: tab === k ? "var(--brand)" : "var(--text-3)",
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
            boxShadow: tab === k ? "var(--shadow-md)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {showingCategories ? (
          <>
            <div className="card" style={{ padding: "18px 20px", borderLeft: "3px solid var(--brand)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Settled slips</p>
              <p className="stat-num" style={{ fontSize: 28 }}>{overall.settled}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>last 30 days</p>
            </div>
            <div className="card" style={{ padding: "18px 20px", borderLeft: "3px solid var(--green)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Won</p>
              <p className="stat-num" style={{ fontSize: 28, color: "var(--green)" }}>{overall.won}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>slips</p>
            </div>
            <div className="card" style={{ padding: "18px 20px", borderLeft: "3px solid var(--red)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Lost</p>
              <p className="stat-num" style={{ fontSize: 28, color: "var(--red)" }}>{overall.lost}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>slips</p>
            </div>
            <div className="card" style={{ padding: "18px 20px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Profit</p>
              <p className="stat-num" style={{ fontSize: 28, color: overall.profit > 0 ? "var(--green)" : overall.profit < 0 ? "var(--red)" : "var(--text-1)" }}>
                {overall.profit > 0 ? "+" : ""}{overall.profit.toFixed(2)}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>units · 1 per slip</p>
            </div>
          </>
        ) : (
          <>
            <div className="card" style={{ padding: "18px 20px", borderLeft: "3px solid var(--brand)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total tracked</p>
              <p className="stat-num" style={{ fontSize: 28 }}>{chainStats.total}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>days</p>
            </div>
            <div className="card" style={{ padding: "18px 20px", borderLeft: "3px solid var(--green)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Won</p>
              <p className="stat-num" style={{ fontSize: 28, color: "var(--green)" }}>{chainStats.won}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>days won</p>
            </div>
            <div className="card" style={{ padding: "18px 20px", borderLeft: "3px solid var(--red)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Lost</p>
              <p className="stat-num" style={{ fontSize: 28, color: "var(--red)" }}>{chainStats.lost}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>days lost</p>
            </div>
            <div className="card" style={{ padding: "18px 20px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Win rate</p>
              <p className="stat-num" style={{ fontSize: 28, color: chainStats.winRate >= 60 ? "var(--green)" : "var(--text-1)" }}>{chainStats.winRate}%</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>of resolved days</p>
            </div>
          </>
        )}
      </div>

      {/* Per-category performance */}
      {showingCategories && league && Object.keys(league.summary).length > 0 && (
        <div className="card" style={{ padding: "18px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            By category
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {CATEGORIES.filter(c => c.key !== "rollover").map(c => {
              const s = league.summary[c.key];
              if (!s || !s.settled) return null;
              return (
                <div key={c.key} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface-2)", border: `1px solid ${c.color}22` }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: c.color, marginBottom: 6 }}>{c.label}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>
                    {Math.round(s.win_rate * 100)}%
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>
                    {s.won}W · {s.lost}L
                  </p>
                  <p style={{
                    fontFamily: "var(--font-mono)", fontSize: 11, marginTop: 4,
                    color: s.profit > 0 ? "var(--green)" : s.profit < 0 ? "var(--red)" : "var(--text-3)",
                  }}>
                    {s.profit > 0 ? "+" : ""}{s.profit.toFixed(2)}u · ROI {(s.roi * 100).toFixed(0)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calibration — the only real test of a stated probability */}
      {showingCategories && calib && calib.total_legs >= 10 && (
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Are our percentages honest?
            </p>
            {calib.bias !== null && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: Math.abs(calib.bias) <= 0.05 ? "var(--green)" : "var(--gold)" }}>
                {Math.abs(calib.bias) <= 0.05
                  ? "well calibrated"
                  : calib.bias > 0 ? `over-confident by ${(calib.bias * 100).toFixed(1)}pts` : `under-confident by ${(-calib.bias * 100).toFixed(1)}pts`}
              </p>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
            When we say 70%, does it happen 70% of the time? Measured across {calib.total_legs} settled
            picks. The grey bar is what we promised; the coloured bar is what actually happened.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {calib.buckets.filter(b => b.sample > 0).map(b => {
              const actual = b.actual ?? 0;
              const ok = Math.abs(actual - b.predicted) <= 0.08;
              return (
                <div key={b.range}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>{b.range}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                      {Math.round(actual * 100)}% actual · {b.sample} pick{b.sample !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* promised */}
                  <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden", marginBottom: 3 }}>
                    <div style={{ width: `${b.predicted * 100}%`, height: "100%", background: "var(--text-3)", opacity: 0.45 }} />
                  </div>
                  {/* actual */}
                  <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
                    <div style={{ width: `${actual * 100}%`, height: "100%", background: ok ? "var(--green)" : "var(--gold)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* ── Category slips ── */}
      {showingCategories && (
        leagueLoading ? (
          <BrandLoader message="Settling the books...">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
            </div>
          </BrandLoader>
        ) : slips.length === 0 ? (
          <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
            <Trophy size={28} color="var(--text-3)" style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", marginBottom: 4 }}>
              {filter === "all" ? "No settled slips yet" : `No ${filter} slips`}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>
              {filter === "all"
                ? "Today's slips are archived as they publish, and graded once the matches finish."
                : "Try a different filter."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {slips.map((slip: SettledSlip, idx) => {
              const s = STATUS[slip.status] || STATUS.pending;
              const color = catColor(slip.category);
              return (
                <div key={`${slip.date}-${slip.category}-${idx}`} className="card" style={{ padding: "16px 18px", borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 7,
                      background: `${color}18`, color,
                      fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 800,
                    }}>{catLabel(slip.category)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={10} /> {fmtDate(slip.date)} · {slip.picks.length} leg{slip.picks.length !== 1 ? "s" : ""}
                        {slip.hit_probability ? ` · ${Math.round(slip.hit_probability * 100)}% expected` : ""}
                      </p>
                    </div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 8px", borderRadius: 6,
                      background: s.bg, color: s.color,
                      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>{s.icon} {s.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color }}>
                      {fmtOdds(slip.total_odds)}{oddsSuffix}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {slip.picks.map((p, i) => {
                      const ls = STATUS[p.status] || STATUS.pending;
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "7px 10px", background: "var(--surface-2)", borderRadius: 6,
                          borderLeft: `2px solid ${ls.color}`,
                        }}>
                          <TeamBadge team={p.home_team} />
                          <TeamBadge team={p.away_team} />
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)", flex: 1, minWidth: 0 }}>
                            {p.home_team} <span style={{ color: "var(--text-3)" }}>vs</span> {p.away_team}
                          </span>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color, fontWeight: 600 }}>
                            {p.prediction}
                          </span>
                          {p.odds != null && (
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)",
                              padding: "2px 6px", borderRadius: 4, background: "var(--overlay-2)",
                            }}>{fmtOdds(p.odds)}{oddsSuffix}</span>
                          )}
                          <span style={{ color: ls.color, display: "inline-flex" }}>{ls.icon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Rollover chain ── */}
      {!showingCategories && (
        loading && chain.length === 0 ? (
          <BrandLoader message="Settling the books...">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
            </div>
          </BrandLoader>
        ) : filteredChain.length === 0 ? (
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
            {filteredChain.map(day => {
              const s = STATUS[day.status] || STATUS.pending;
              return (
                <div key={`${day.date}-${day.day_number}`} className="card" style={{ padding: "16px 18px", borderLeft: `3px solid ${s.color}` }}>
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
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--brand)" }}>
                      {fmtOdds(day.combined_odds)}{oddsSuffix}
                    </span>
                  </div>
                  <div style={{ paddingLeft: 42, display: "flex", flexDirection: "column", gap: 6 }}>
                    {day.picks.map((p, i) => {
                      const ls = STATUS[p.status || "pending"] || STATUS.pending;
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 10px", background: "var(--surface-2)", borderRadius: 6,
                          borderLeft: `2px solid ${ls.color}`,
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
                            padding: "2px 6px", borderRadius: 4, background: "var(--overlay-2)",
                          }}>{fmtOdds(p.odds)}{oddsSuffix}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
