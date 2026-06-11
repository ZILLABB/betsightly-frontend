import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Trophy, Calendar, Zap, ChevronDown, ChevronUp, Target,
  BarChart2, Filter, Users, Layers, ArrowRight, TrendingUp
} from "lucide-react";
import {
  getWCPredictions, getWCValueBets, getWCGroups, getWCAccumulators,
  type WCPrediction, type WCValueBet, type WCGroup, type WCAccumulator,
} from "../services/worldcupService";
import { SEO } from "../components/common/SEO";
import { BrandLoader } from "../components/ui/BrandLoader";
import { getTeamFlag } from "../data/wcFlags";

// ── Helpers ────────────────────────────────────────────────
// Use UTC for date keys (avoids timezone drift where 23:00 UTC becomes next-day locally)
const dateKey = (iso: string) => iso.slice(0, 10);
const fmtDate = (iso: string) => {
  // If just a date (YYYY-MM-DD), append T12:00:00Z so timezone doesn't shift it
  const safe = iso.length === 10 ? iso + "T12:00:00Z" : iso;
  return new Date(safe).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
};
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const daysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

const RISK: Record<string, { bg: string; c: string }> = {
  very_low: { bg: "var(--green-faint)", c: "var(--green)" },
  low: { bg: "var(--green-faint)", c: "var(--green)" },
  medium: { bg: "var(--gold-faint)", c: "var(--gold)" },
  high: { bg: "var(--red-faint)", c: "var(--red)" },
};

const MKT_COLORS: Record<string, string> = {
  match_result: "var(--gold)", goals: "var(--green)", btts: "var(--blue)", double_chance: "var(--purple)",
};
const MKT_LABELS: Record<string, string> = {
  match_result: "Result", goals: "Goals", btts: "BTTS", double_chance: "DC",
};

// ── Confidence Ring ────────────────────────────────────────
function ConfRing({ value, size = 40, color }: { value: number; size?: number; color: string }) {
  const pct = Math.round(value * 100);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <span style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-mono)", fontSize: size > 36 ? 11 : 9, fontWeight: 700, color,
      }}>{pct}</span>
    </div>
  );
}

// ── Probability Bar ────────────────────────────────────────
function ProbBar({ h, d, a }: { h: number; d: number; a: number }) {
  return (
    <div style={{ display: "flex", gap: 2, height: 4, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ flex: h, background: "var(--green)", minWidth: 2, transition: "flex 300ms" }} />
      <div style={{ flex: d, background: "var(--track)", minWidth: 2, transition: "flex 300ms" }} />
      <div style={{ flex: a, background: "var(--red)", minWidth: 2, transition: "flex 300ms" }} />
    </div>
  );
}

// ── Market Tag ─────────────────────────────────────────────
function MktTag({ market }: { market: string }) {
  const c = MKT_COLORS[market] || "var(--text-3)";
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700,
      padding: "1px 5px", borderRadius: 3, letterSpacing: "0.08em",
      background: `color-mix(in srgb, ${c} 10%, transparent)`, color: c, textTransform: "uppercase",
    }}>{MKT_LABELS[market] || market}</span>
  );
}

// ── Match Card ─────────────────────────────────────────────
function MatchCard({ p }: { p: WCPrediction }) {
  const [open, setOpen] = useState(false);
  const risk = RISK[p.risk_level] || RISK.medium;
  const tips = p.top_tips ?? [{ tip: p.prediction, market: p.prediction_market || "match_result", confidence: p.confidence }];

  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, overflow: "hidden",
      border: "1px solid var(--border)",
      transition: "border-color 200ms, box-shadow 200ms",
    }}>
      <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        {/* Time + group */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
            {fmtTime(p.commence_time)} · {fmtDate(p.commence_time)}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, padding: "1px 6px",
            borderRadius: 3, background: risk.bg, color: risk.c, textTransform: "uppercase",
          }}>{p.risk_level.replace("_", " ")}</span>
        </div>

        {/* Teams row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {/* Home */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <img src={getTeamFlag(p.home_team, p.home_team_logo, 80)} alt="" style={{ width: 28, height: 20, flexShrink: 0, objectFit: "cover", borderRadius: 3 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2 }} title={p.home_team}>{p.home_team}</p>
              {p.best_odds.home_win && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>@{p.best_odds.home_win}</span>}
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-3)", flexShrink: 0 }}>VS</span>
          {/* Away */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
            <div style={{ textAlign: "right", minWidth: 0, flex: 1 }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2 }} title={p.away_team}>{p.away_team}</p>
              {p.best_odds.away_win && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>@{p.best_odds.away_win}</span>}
            </div>
            <img src={getTeamFlag(p.away_team, p.away_team_logo, 80)} alt="" style={{ width: 28, height: 20, flexShrink: 0, objectFit: "cover", borderRadius: 3 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>

        {/* Prob bar */}
        <ProbBar h={p.probabilities.home_win} d={p.probabilities.draw} a={p.probabilities.away_win} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--green)" }}>{Math.round(p.probabilities.home_win * 100)}%</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-3)" }}>{Math.round(p.probabilities.draw * 100)}%</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--red)" }}>{Math.round(p.probabilities.away_win * 100)}%</span>
        </div>

        {/* Best pick — one clear recommendation per game */}
        {tips[0] && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10,
            background: "var(--gold-faint)",
            border: "1px solid rgba(245,158,11,0.18)",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)",
                }}>Best pick</span>
                <MktTag market={tips[0].market} />
              </div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                color: "var(--text-1)", lineHeight: 1.3,
              }}>{tips[0].tip}</p>
            </div>
            <ConfRing value={tips[0].confidence} size={38} color={tips[0].confidence >= 0.6 ? "var(--green)" : "var(--gold)"} />
          </div>
        )}

        {/* Secondary options — collapsed by default */}
        {tips.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600,
              color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {open ? "Hide details" : `${tips.length - 1} more option${tips.length > 2 ? "s" : ""} + stats`}
            </span>
          </div>
        )}
        {tips.length <= 1 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 6, opacity: 0.3 }}>
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        )}
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--border)" }}>
          {/* Other tips */}
          {tips.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 12 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                Other options
              </p>
              {tips.slice(1).map((tip, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                  borderRadius: 8, background: "var(--overlay-1)",
                }}>
                  <MktTag market={tip.market} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--text-2)", flex: 1 }}>{tip.tip}</span>
                  <ConfRing value={tip.confidence} size={28} color={tip.confidence >= 0.6 ? "var(--green)" : "var(--gold)"} />
                </div>
              ))}
            </div>
          )}
          {/* Goals stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, padding: "12px 0" }}>
            {[
              { l: "Exp. Goals", v: p.goals.expected_total.toFixed(1) },
              { l: "Over 2.5", v: `${Math.round(p.goals.over_2_5_prob * 100)}%` },
              { l: "Over 1.5", v: `${Math.round(p.goals.over_1_5_prob * 100)}%` },
              { l: "BTTS", v: `${Math.round(p.goals.btts_prob * 100)}%` },
            ].map(s => (
              <div key={s.l} style={{ textAlign: "center", padding: "8px 4px", background: "var(--overlay-1)", borderRadius: 8 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{s.v}</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "var(--text-3)", marginTop: 2 }}>{s.l}</p>
              </div>
            ))}
          </div>
          {/* Value bets */}
          {p.value_bets.length > 0 && (
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--green)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Value Bets
              </p>
              {p.value_bets.map((vb, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "5px 8px", borderRadius: 6, marginBottom: 3,
                  background: "var(--green-faint)", border: "1px solid rgba(16,185,129,0.12)",
                }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-1)" }}>{vb.bet}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>@{vb.odds}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--green)" }}>+{(vb.edge * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Group Card ─────────────────────────────────────────────
function GroupCard({ name, group }: { name: string; group: WCGroup }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, overflow: "hidden",
      border: "1px solid var(--border)",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        background: "rgba(245,158,11,0.04)", borderBottom: "1px solid var(--border)",
      }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800,
          color: "var(--gold)", width: 28, textAlign: "center",
        }}>
          {name}
        </span>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {group.teams.map(t => (
            <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <img src={getTeamFlag(t.name, t.logo, 40)} alt="" style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-2)" }}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Matches */}
      <div style={{ padding: "8px 12px" }}>
        {group.matches.map(p => (
          <div key={p.match_id} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 6px",
            borderBottom: "1px solid var(--divider)",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", width: 40, flexShrink: 0 }}>
              {fmtDate(p.commence_time).slice(0, 6)}
            </span>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--text-1)", flex: 1 }}>
              {p.home_team} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>vs</span> {p.away_team}
            </p>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <MktTag market={p.prediction_market || "match_result"} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "var(--gold)", marginTop: 2 }}>{p.prediction}</p>
            </div>
            <ConfRing value={p.confidence} size={28} color={p.confidence >= 0.6 ? "var(--green)" : "var(--gold)"} />
          </div>
        ))}
        {group.matches.length === 0 && <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", padding: 10 }}>TBD</p>}
      </div>
    </div>
  );
}

// ── Accumulator Slip ───────────────────────────────────────
function AccuSlip({ label, accu, color }: { label: string; accu: WCAccumulator; color: string }) {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, overflow: "hidden",
      border: "1px solid var(--border)",
    }}>
      {/* Header — betting slip style */}
      <div style={{
        padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${color}08`, borderBottom: `2px solid ${color}30`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: color,
            boxShadow: `0 0 8px ${color}60`,
          }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{accu.label}</span>
        </div>
        <div style={{
          padding: "4px 12px", borderRadius: 6,
          background: `${color}15`, border: `1px solid ${color}30`,
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, color }}>{accu.total_odds}x</span>
        </div>
      </div>
      {/* Picks */}
      <div style={{ padding: "6px 0" }}>
        {accu.picks.map((pick, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 18px",
            borderBottom: i < accu.picks.length - 1 ? "1px solid var(--divider)" : "none",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
              color: "var(--text-3)", width: 18, textAlign: "center",
            }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                {pick.home_team} vs {pick.away_team}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <MktTag market={pick.market} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color }}>{pick.tip}</span>
              </div>
            </div>
            <ConfRing value={pick.confidence} size={32} color={pick.confidence >= 0.6 ? "var(--green)" : color} />
          </div>
        ))}
      </div>
      {accu.picks.length === 0 && (
        <p style={{ padding: "20px 18px", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>
          No picks available for this tier
        </p>
      )}
    </div>
  );
}

// ── Value Bet Row ──────────────────────────────────────────
function VBRow({ vb }: { vb: WCValueBet }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 0", borderBottom: "1px solid var(--divider)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        color: "var(--green)", background: "var(--green-faint)",
        padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
      }}>+{(vb.edge * 100).toFixed(1)}%</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{vb.bet}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)" }}>{vb.match}</p>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>@{vb.odds}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ██  MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function WorldCupPage() {
  const [predictions, setPredictions] = useState<WCPrediction[]>([]);
  const [valueBets, setValueBets] = useState<WCValueBet[]>([]);
  const [groups, setGroups] = useState<Record<string, WCGroup>>({});
  const [accumulators, setAccumulators] = useState<Record<string, WCAccumulator>>({});
  const [accuDate, setAccuDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as "matches" | "groups" | "accumulators" | "value") || "matches";
  const [tab, setTabState] = useState<"matches" | "groups" | "accumulators" | "value">(initialTab);
  const setTab = (t: "matches" | "groups" | "accumulators" | "value") => {
    setTabState(t);
    if (t === "matches") setSearchParams({});
    else setSearchParams({ tab: t });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [preds, vbs, grps, accu] = await Promise.all([
          getWCPredictions(), getWCValueBets(0.02),
          getWCGroups().catch(() => ({})),
          getWCAccumulators().catch(() => ({ date: "", accumulators: {} })),
        ]);
        setPredictions(preds); setValueBets(vbs);
        setGroups(grps); setAccumulators(accu.accumulators || {}); setAccuDate(accu.date || "");
      } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, []);

  const uniqueDates = useMemo(() => Array.from(new Set(predictions.map(p => p.commence_time.slice(0, 10)))).sort(), [predictions]);

  const filtered = useMemo(() => predictions.filter(p => {
    if (dateFilter && !p.commence_time.startsWith(dateFilter)) return false;
    if (riskFilter && p.risk_level !== riskFilter) return false;
    return true;
  }), [predictions, dateFilter, riskFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, WCPrediction[]> = {};
    for (const p of filtered) { const d = p.commence_time.slice(0, 10); (g[d] ??= []).push(p); }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const stats = useMemo(() => ({
    total: predictions.length,
    highConf: predictions.filter(p => p.confidence >= 0.5).length,
    valueBets: predictions.filter(p => p.value_bets?.length > 0).length,
    avgConf: predictions.length ? Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length * 100) : 0,
  }), [predictions]);

  const firstMatch = predictions[0]?.commence_time || "2026-06-11T19:00:00Z";
  const days = daysUntil(firstMatch);

  if (loading) return (
    <BrandLoader message="Analyzing World Cup fixtures...">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 14 }} />)}
      </div>
    </BrandLoader>
  );

  if (error) return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <Trophy size={40} color="var(--text-3)" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>World Cup Data Not Available</h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", maxWidth: 360, margin: "0 auto" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SEO title="World Cup 2026" description="FIFA World Cup 2026 predictions — match analysis, group standings, accumulators, and value bets for USA, Mexico & Canada." path="/worldcup" />

      {/* ── Hero ───────────────────────────────────────── */}
      <div style={{
        borderRadius: 18, overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #1a1a3e 0%, #0d1b2a 40%, #162232 100%)",
        border: "1px solid rgba(255,215,0,0.10)",
      }}>
        {/* Tri-host accent — Canada red, USA blue, Mexico green (We Are 26) */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent 2%, #e63946 25%, #3a86ff 50%, #2a9d8f 75%, transparent 98%)" }} />
        <div style={{ padding: "28px 28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
            <img
              src="/wc26-emblem-dark.svg"
              alt="FIFA World Cup 26"
              style={{ height: 84, width: "auto", flexShrink: 0, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5))" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#fbbf24" }}>
                  FIFA World Cup 26 · We Are 26
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                USA · Mexico · Canada
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                48 teams · {stats.total} matches analyzed · Real bookmaker odds
              </p>
            </div>
          </div>
          <div style={{
            padding: "14px 24px", borderRadius: 14, textAlign: "center",
            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,215,0,0.12)",
          }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "#fbbf24", lineHeight: 1 }}>{days}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              days to go
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.15)",
        }}>
          {[
            { v: String(stats.total), l: "Matches" },
            { v: String(stats.highConf), l: "High Conf" },
            { v: String(stats.valueBets), l: "Value Bets" },
            { v: `${stats.avgConf}%`, l: "Avg Conf" },
          ].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: "center", padding: "12px 8px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, color: "#fff" }}>{s.v}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 2, background: "var(--surface)", borderRadius: 10, padding: 3, border: "1px solid var(--border)" }}>
          {([
            { k: "matches" as const, l: "Predictions", ic: <Target size={12} /> },
            { k: "groups" as const, l: "Groups", ic: <Users size={12} /> },
            { k: "accumulators" as const, l: "Accas", ic: <Layers size={12} /> },
            { k: "value" as const, l: "Value", ic: <Zap size={12} /> },
          ]).map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8,
              border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              background: tab === t.k ? "var(--gold-faint)" : "transparent",
              color: tab === t.k ? "var(--gold)" : "var(--text-3)",
              transition: "all 150ms",
            }}>
              {t.ic} {t.l}
            </button>
          ))}
        </div>

        {tab === "matches" && (
          <button onClick={() => setShowFilters(!showFilters)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8,
            cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
            border: (dateFilter || riskFilter) ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
            background: (dateFilter || riskFilter) ? "var(--gold-faint)" : "transparent",
            color: (dateFilter || riskFilter) ? "var(--gold)" : "var(--text-3)",
          }}>
            <Filter size={12} /> Filters
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && tab === "matches" && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{
            padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: 12,
            color: "var(--text-1)", cursor: "pointer", outline: "none",
          }}>
            <option value="">All Dates</option>
            {uniqueDates.map(d => <option key={d} value={d}>{fmtDate(d + "T00:00:00Z")}</option>)}
          </select>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{
            padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: 12,
            color: "var(--text-1)", cursor: "pointer", outline: "none",
          }}>
            <option value="">All Risk</option>
            <option value="very_low">Very Low</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {(dateFilter || riskFilter) && (
            <button onClick={() => { setDateFilter(""); setRiskFilter(""); }} style={{
              padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)",
              background: "transparent", fontFamily: "var(--font-body)", fontSize: 11,
              color: "var(--text-3)", cursor: "pointer",
            }}>Clear</button>
          )}
        </div>
      )}

      {/* ── Tab Content ─────────────────────────────────── */}
      {tab === "matches" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {grouped.map(([date, matches]) => (
            <div key={date}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "4px 0" }}>
                <Calendar size={12} color="var(--gold)" />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                  {fmtDate(date + "T00:00:00Z")}
                </h3>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>{matches.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 12 }}>
                {matches.map(p => <MatchCard key={p.match_id} p={p} />)}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>No matches for these filters.</p>}
        </div>
      )}

      {tab === "groups" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 14 }}>
          {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([name, g]) => (
            <GroupCard key={name} name={name} group={g} />
          ))}
        </div>
      )}

      {tab === "accumulators" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {accuDate && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
              Picks for <strong style={{ color: "var(--text-1)" }}>{fmtDate(accuDate + "T00:00:00Z")}</strong>
            </p>
          )}
          {Object.entries(accumulators).map(([key, accu]) => {
            // AccuSlip builds hex-alpha suffixes (`${color}08`), so these stay literal hex
            const colors: Record<string, string> = { safe: "#22c55e", moderate: "#f59e0b", bold: "#f87171" };
            return <AccuSlip key={key} label={key} accu={accu} color={colors[key] || "#f59e0b"} />;
          })}
          {Object.keys(accumulators).length === 0 && <p style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>No upcoming match days.</p>}
        </div>
      )}

      {tab === "value" && (
        <div style={{
          background: "var(--surface)", borderRadius: 14, padding: "18px 20px",
          border: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Zap size={14} color="var(--green)" />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Value Bets</h3>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)", background: "var(--green-faint)", padding: "2px 8px", borderRadius: 4 }}>{valueBets.length}</span>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5 }}>
            Where our model probability beats the bookmaker implied probability.
          </p>
          {valueBets.slice(0, 20).map((vb, i) => <VBRow key={i} vb={vb} />)}
          {valueBets.length === 0 && <p style={{ textAlign: "center", color: "var(--text-3)", padding: 20 }}>No value bets at current threshold.</p>}
        </div>
      )}
    </div>
  );
}
