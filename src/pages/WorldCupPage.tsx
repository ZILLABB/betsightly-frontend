import React, { useEffect, useState, useMemo } from "react";
import {
  Trophy, Calendar, TrendingUp, Shield, Zap, ChevronDown,
  ChevronUp, Target, BarChart2, Clock, Filter, Star
} from "lucide-react";
import { getWCPredictions, getWCValueBets, type WCPrediction, type WCValueBet } from "../services/worldcupService";

// ── Helpers ────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function daysUntil(iso: string) {
  const now = new Date();
  const target = new Date(iso);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

const RISK_COLORS: Record<string, string> = {
  low: "var(--green)", medium: "var(--brand)", high: "var(--red)",
};

// ── Countdown Banner ───────────────────────────────────────
function CountdownBanner({ firstMatch }: { firstMatch: string }) {
  const days = daysUntil(firstMatch);
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(96,165,250,0.08) 100%)",
      border: "1px solid rgba(245,158,11,0.2)",
      borderRadius: 16, padding: "24px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 16,
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Trophy size={20} color="var(--brand)" />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)" }}>
            FIFA World Cup 2026
          </h2>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
          USA, Mexico & Canada · June 11 – July 19, 2026 · 48 teams · 104 matches
        </p>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "12px 20px", borderRadius: 12,
        background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 800, color: "var(--brand)", lineHeight: 1 }}>
            {days}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {days === 1 ? "Day" : "Days"} to go
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Probability Bar ────────────────────────────────────────
function ProbBar({ probs }: { probs: { home_win: number; draw: number; away_win: number } }) {
  const h = Math.round(probs.home_win * 100);
  const d = Math.round(probs.draw * 100);
  const a = 100 - h - d;
  return (
    <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", height: 6, width: "100%" }}>
      <div style={{ width: `${h}%`, background: "var(--green)", transition: "width 300ms" }} title={`Home ${h}%`} />
      <div style={{ width: `${d}%`, background: "var(--text-3)", transition: "width 300ms" }} title={`Draw ${d}%`} />
      <div style={{ width: `${a}%`, background: "var(--red)", transition: "width 300ms" }} title={`Away ${a}%`} />
    </div>
  );
}

// ── Match Card ─────────────────────────────────────────────
function MatchCard({ pred }: { pred: WCPrediction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{
      padding: 0, overflow: "hidden",
      borderLeft: `3px solid ${RISK_COLORS[pred.risk_level] || "var(--border)"}`,
    }}>
      {/* Main row */}
      <div
        style={{ padding: "16px 18px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Date + time */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={11} color="var(--text-3)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
              {formatDate(pred.commence_time)} · {formatTime(pred.commence_time)}
            </span>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
            padding: "2px 8px", borderRadius: 4, textTransform: "uppercase",
            background: `${RISK_COLORS[pred.risk_level]}15`,
            color: RISK_COLORS[pred.risk_level],
          }}>
            {pred.risk_level} risk
          </span>
        </div>

        {/* Teams */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            {pred.home_team_logo && (
              <img src={pred.home_team_logo} alt="" style={{ width: 32, height: 32, marginBottom: 4 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              {pred.home_team}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
              {pred.best_odds.home_win ? `@${pred.best_odds.home_win}` : ""}
            </p>
          </div>

          <div style={{ textAlign: "center", flexShrink: 0, padding: "0 8px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", marginBottom: 2 }}>VS</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
              {pred.best_odds.draw ? `Draw @${pred.best_odds.draw}` : ""}
            </p>
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            {pred.away_team_logo && (
              <img src={pred.away_team_logo} alt="" style={{ width: 32, height: 32, marginBottom: 4 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              {pred.away_team}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
              {pred.best_odds.away_win ? `@${pred.best_odds.away_win}` : ""}
            </p>
          </div>
        </div>

        {/* Prob bar */}
        <ProbBar probs={pred.probabilities} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)" }}>{Math.round(pred.probabilities.home_win * 100)}%</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>{Math.round(pred.probabilities.draw * 100)}%</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--red)" }}>{Math.round(pred.probabilities.away_win * 100)}%</span>
        </div>

        {/* Prediction */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 12, padding: "10px 14px", borderRadius: 8,
          background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={14} color="var(--brand)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              {pred.prediction}
            </span>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
            color: pred.confidence >= 0.5 ? "var(--green)" : "var(--brand)",
          }}>
            {Math.round(pred.confidence * 100)}%
          </span>
        </div>

        {/* Expand arrow */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          {expanded ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: "0 18px 16px",
          borderTop: "1px solid var(--border)",
        }}>
          {/* Goals */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "12px 0" }}>
            {[
              { label: "Exp. Goals", value: pred.goals.expected_total.toFixed(1), color: "var(--text-1)" },
              { label: "Over 2.5", value: `${Math.round(pred.goals.over_2_5_prob * 100)}%`, color: pred.goals.over_2_5_prob > 0.5 ? "var(--green)" : "var(--text-3)" },
              { label: "Over 1.5", value: `${Math.round(pred.goals.over_1_5_prob * 100)}%`, color: pred.goals.over_1_5_prob > 0.6 ? "var(--green)" : "var(--text-3)" },
              { label: "BTTS", value: `${Math.round(pred.goals.btts_prob * 100)}%`, color: pred.goals.btts_prob > 0.5 ? "var(--green)" : "var(--text-3)" },
            ].map(s => (
              <div key={s.label} style={{
                flex: "1 1 70px", textAlign: "center", padding: "8px 6px",
                background: "var(--surface-2)", borderRadius: 8,
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Value bets */}
          {pred.value_bets.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700,
                color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: 8,
              }}>
                <Zap size={10} style={{ display: "inline", verticalAlign: "middle" }} /> Value Bets
              </p>
              {pred.value_bets.map((vb, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 10px", borderRadius: 6, marginBottom: 4,
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)",
                }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-1)" }}>
                    {vb.bet}
                  </span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
                      @{vb.odds}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--green)" }}>
                      +{(vb.edge * 100).toFixed(1)}% edge
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Data quality */}
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            {pred.data_quality.home_has_wc_data && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 4 }}>
                {pred.home_team}: {pred.data_quality.home_wc_matches} WC matches
              </span>
            )}
            {pred.data_quality.away_has_wc_data && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 4 }}>
                {pred.away_team}: {pred.data_quality.away_wc_matches} WC matches
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Value Bet Card ─────────────────────────────────────────
function ValueBetRow({ vb }: { vb: WCValueBet }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
        color: "var(--green)", background: "rgba(34,197,94,0.10)",
        padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
      }}>+{(vb.edge * 100).toFixed(1)}%</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
          {vb.bet}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
          {vb.match} · {formatDate(vb.commence_time)}
        </p>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--brand)" }}>
        @{vb.odds}
      </span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function WorldCupPage() {
  const [predictions, setPredictions] = useState<WCPrediction[]>([]);
  const [valueBets, setValueBets] = useState<WCValueBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState<"matches" | "value">("matches");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [preds, vbs] = await Promise.all([
          getWCPredictions(),
          getWCValueBets(0.02),
        ]);
        setPredictions(preds);
        setValueBets(vbs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Unique dates for filter
  const uniqueDates = useMemo(() => {
    const dates = new Set(predictions.map(p => p.commence_time.slice(0, 10)));
    return Array.from(dates).sort();
  }, [predictions]);

  // Filtered predictions
  const filtered = useMemo(() => {
    return predictions.filter(p => {
      if (dateFilter && !p.commence_time.startsWith(dateFilter)) return false;
      if (riskFilter && p.risk_level !== riskFilter) return false;
      return true;
    });
  }, [predictions, dateFilter, riskFilter]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, WCPrediction[]> = {};
    for (const p of filtered) {
      const date = p.commence_time.slice(0, 10);
      if (!groups[date]) groups[date] = [];
      groups[date].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const highConf = predictions.filter(p => p.confidence >= 0.5).length;
    const withValue = predictions.filter(p => p.value_bets.length > 0).length;
    const avgConf = predictions.length > 0
      ? predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length
      : 0;
    return { total: predictions.length, highConf, withValue, avgConf };
  }, [predictions]);

  const firstMatch = predictions[0]?.commence_time || "2026-06-11T19:00:00Z";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ height: 120, borderRadius: 16, background: "var(--surface-2)", animation: "pulse 1.5s ease infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ height: 240, animation: "pulse 1.5s ease infinite" }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <Trophy size={48} color="var(--text-3)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>World Cup Data Not Available</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", maxWidth: 400, margin: "0 auto", lineHeight: 1.7 }}>
          {error}. The prediction engine needs to be initialized on the backend first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Countdown */}
      <CountdownBanner firstMatch={firstMatch} />

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Matches", value: String(stats.total), color: "var(--text-1)" },
          { label: "High Confidence", value: String(stats.highConf), color: "var(--green)" },
          { label: "Value Bets", value: String(stats.withValue), color: "var(--brand)" },
          { label: "Avg Confidence", value: `${Math.round(stats.avgConf * 100)}%`, color: "var(--blue)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: "1 1 100px", padding: "14px 18px", minWidth: 100 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", borderRadius: 8, padding: 3 }}>
          {([
            { key: "matches" as const, label: "Match Predictions", icon: <Target size={13} /> },
            { key: "value" as const, label: "Value Bets", icon: <Zap size={13} /> },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                background: tab === t.key ? "rgba(245,158,11,0.12)" : "transparent",
                color: tab === t.key ? "var(--brand)" : "var(--text-3)",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        {tab === "matches" && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              border: (dateFilter || riskFilter) ? "1px solid var(--brand)" : "1px solid var(--border)",
              background: (dateFilter || riskFilter) ? "rgba(245,158,11,0.10)" : "var(--surface-2)",
              color: (dateFilter || riskFilter) ? "var(--brand)" : "var(--text-2)",
            }}
          >
            <Filter size={13} /> Filters
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && tab === "matches" && (
        <div className="card" style={{
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase" }}>Date</p>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
                background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: 12,
                color: "var(--text-1)", cursor: "pointer", outline: "none",
              }}
            >
              <option value="">All Dates</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{formatDate(d + "T00:00:00Z")}</option>
              ))}
            </select>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase" }}>Risk</p>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              style={{
                padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
                background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: 12,
                color: "var(--text-1)", cursor: "pointer", outline: "none",
              }}
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          {(dateFilter || riskFilter) && (
            <button
              onClick={() => { setDateFilter(""); setRiskFilter(""); }}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)",
                background: "transparent", fontFamily: "var(--font-body)", fontSize: 12,
                color: "var(--text-3)", cursor: "pointer", marginTop: 14,
              }}
            >Clear</button>
          )}
        </div>
      )}

      {/* Content */}
      {tab === "matches" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {groupedByDate.map(([date, matches]) => (
            <div key={date}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                padding: "8px 0", borderBottom: "1px solid var(--border)",
              }}>
                <Calendar size={14} color="var(--brand)" />
                <h3 style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                  {formatDate(date + "T00:00:00Z")}
                </h3>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)",
                  background: "var(--surface-2)", padding: "2px 8px", borderRadius: 4,
                }}>
                  {matches.length} match{matches.length !== 1 ? "es" : ""}
                </span>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14,
              }}>
                {matches.map(p => <MatchCard key={p.match_id} pred={p} />)}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)" }}>
                No matches for selected filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Value Bets Tab */
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Zap size={16} color="var(--green)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
              Best Value Bets
            </h3>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11, background: "rgba(34,197,94,0.12)",
              color: "var(--green)", padding: "2px 8px", borderRadius: 4,
            }}>{valueBets.length}</span>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.6 }}>
            Bets where our model finds a positive edge over bookmaker odds. Higher edge = more value.
          </p>
          {valueBets.length > 0 ? (
            valueBets.slice(0, 20).map((vb, i) => <ValueBetRow key={i} vb={vb} />)
          ) : (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: 20 }}>
              No value bets found at current threshold.
            </p>
          )}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  );
}
