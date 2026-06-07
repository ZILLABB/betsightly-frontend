import React, { useState, useCallback, useEffect } from "react";
import { TrendingUp, Zap, Shield, Target, RefreshCw, Trophy, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { getWCPredictions, type WCPrediction } from "../services/worldcupService";
import { getTeamFlag } from "../data/wcFlags";
import { WelcomeBanner } from "../components/common/WelcomeBanner";
import { JoinTelegram } from "../components/common/JoinTelegram";
import { AccuracyBadge } from "../components/common/AccuracyBadge";
import { CategoryTabs } from "../components/predictions/CategoryTabs";
import { PredictionCard } from "../components/predictions/PredictionCard";
import { EmptyState } from "../components/predictions/EmptyState";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { CATEGORIES } from "../types";
import type { CategoryKey } from "../types";

function StatBubble({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card" style={{
      "--card-accent": color,
      padding: "20px 22px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      flex: 1,
      minWidth: 140,
      borderTop: `2px solid ${color}22`,
    } as React.CSSProperties}>
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: `${color}15`,
        border: `1px solid ${color}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 0 20px ${color}10, inset 0 0 12px ${color}08`,
      }}>
        {icon}
      </div>
      <div>
        <p className="stat-num" style={{ fontSize: 24, lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{label}</p>
      </div>
    </div>
  );
}

// ── World Cup Banner ───────────────────────────────────────
function WorldCupBanner() {
  const [picks, setPicks] = useState<WCPrediction[]>([]);

  useEffect(() => {
    getWCPredictions(0.5)
      .then(preds => {
        // Get next 3 upcoming matches with highest confidence
        const now = new Date().toISOString();
        const upcoming = preds
          .filter(p => p.commence_time >= now)
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);
        setPicks(upcoming.length ? upcoming : preds.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const daysToGo = Math.max(0, Math.ceil((new Date("2026-06-11T19:00:00Z").getTime() - Date.now()) / 86400000));

  return (
    <div style={{
      borderRadius: 20, overflow: "hidden", position: "relative",
      background: "linear-gradient(135deg, #1a1a3e 0%, #0d1b2a 50%, #1b2838 100%)",
      border: "1px solid rgba(255,215,0,0.12)",
    }}>
      {/* Gold accent line */}
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #fbbf24, #d97706, transparent)" }} />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Trophy size={16} color="#fbbf24" />
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase", color: "#fbbf24",
              }}>FIFA World Cup 2026</span>
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(20px, 4vw, 28px)",
              fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 6,
            }}>
              {daysToGo > 0 ? (
                <>{daysToGo} day{daysToGo !== 1 ? "s" : ""} until kickoff</>
              ) : (
                <>The World Cup is here!</>
              )}
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              72 matches analyzed · 48 teams · Real bookmaker odds
            </p>
          </div>

          <Link to="/worldcup" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, textDecoration: "none",
            background: "linear-gradient(135deg, #fbbf24, #d97706)",
            color: "#000", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
            transition: "transform 150ms ease, box-shadow 150ms ease",
            boxShadow: "0 4px 20px rgba(251,191,36,0.25)",
          }}>
            View Predictions <ArrowRight size={14} />
          </Link>
        </div>

        {/* Top picks strip */}
        {picks.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}>
            {picks.map(p => (
              <Link to="/worldcup" key={p.match_id} style={{
                padding: "12px 14px", borderRadius: 10, textDecoration: "none",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                transition: "background 150ms ease", display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {new Date(p.commence_time).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                    color: p.confidence >= 0.6 ? "#22c55e" : "#fbbf24",
                  }}>
                    {Math.round(p.confidence * 100)}%
                  </span>
                </div>
                {/* Teams stacked with flags */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <img
                      src={getTeamFlag(p.home_team, p.home_team_logo, 40)}
                      alt=""
                      style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
                      {p.home_team}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.3)", paddingLeft: 6 }}>vs</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <img
                      src={getTeamFlag(p.away_team, p.away_team_logo, 40)}
                      alt=""
                      style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
                      {p.away_team}
                    </span>
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>
                  {p.prediction}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HomePage() {
  const { data, loading, error, refetch } = usePredictions();
  const [activeKey, setActiveKey] = useState<CategoryKey>("2_odds");
  const [spinning, setSpinning] = useState(false);
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  const accumulators = data?.accumulators;
  const activeCat = accumulators?.[activeKey];
  const catMeta = CATEGORIES.find(c => c.key === activeKey)!;

  const oddsMap = accumulators
    ? Object.fromEntries(
        CATEGORIES.map(c => [c.key, accumulators[c.key]?.total_odds])
      ) as Partial<Record<CategoryKey, number>>
    : {};

  const totalGames = accumulators
    ? CATEGORIES.reduce((s, c) => s + (accumulators[c.key]?.games?.length ?? 0), 0)
    : 0;

  const avgConf = activeCat?.games?.length
    ? Math.round(activeCat.games.reduce((s, g) => s + g.confidence, 0) / activeCat.games.length * 100)
    : 0;

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    refetch();
    setTimeout(() => setSpinning(false), 700);
  }, [refetch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* First-visit welcome banner — dismisses to localStorage */}
      <WelcomeBanner />

      {/* World Cup Banner */}
      <WorldCupBanner />

      {/* Live track record + Telegram CTA — side by side on desktop, stacked on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <AccuracyBadge />
        <JoinTelegram variant="card" />
      </div>

      {/* Hero */}
      <div className="glow-bg" style={{ textAlign: "center", padding: "16px 0 0", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 24, height: 1, background: "linear-gradient(90deg, transparent, var(--brand))" }} />
          {data?.date
            ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
            : new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          <div style={{ width: 24, height: 1, background: "linear-gradient(90deg, var(--brand), transparent)" }} />
        </div>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 52px)", fontWeight: 800, lineHeight: 1.08, marginBottom: 16 }}>
          Today&apos;s{" "}
          <span className="text-brand-gradient">Smart Picks</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-2)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          Curated accumulators backed by real bookmaker odds and statistical analysis.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatBubble label="Picks today" value={loading ? "—" : String(totalGames)} icon={<Target size={19} color="var(--brand)" />} color="var(--brand)" />
        <StatBubble label="Confidence" value={loading ? "—" : `${avgConf}%`} icon={<Shield size={19} color="var(--green)" />} color="var(--green)" />
        <StatBubble label="Top odds" value={loading ? "—" : `${fmtOdds(activeCat?.total_odds ?? 0)}${oddsSuffix}`} icon={<TrendingUp size={19} color="var(--blue)" />} color="var(--blue)" />
        <StatBubble label="Categories" value={String(CATEGORIES.length)} icon={<Zap size={19} color="var(--purple)" />} color="var(--purple)" />
      </div>

      {/* Tabs + content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} />

        {/* Category header */}
        {!loading && activeCat && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: catMeta.color, letterSpacing: "-0.02em" }}>
                {catMeta.label} Accumulator
              </h2>
              {activeCat.reason && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
                  {activeCat.reason}
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                padding: "6px 16px", borderRadius: 8,
                background: catMeta.faint, border: `1px solid ${catMeta.color}33`,
                fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700,
                color: catMeta.color, letterSpacing: "-0.02em",
              }}>
                {fmtOdds(activeCat.total_odds)}{oddsSuffix}
              </div>
              <button
                onClick={handleRefresh}
                title="Refresh predictions"
                className="refresh-btn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36, borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  cursor: "pointer", color: "var(--text-3)",
                  transition: "all 180ms ease",
                }}
              >
                <RefreshCw size={14} style={spinning ? { animation: "spin 0.5s ease" } : undefined} />
              </button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: "var(--radius-md)",
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
            fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)",
          }}>
            {error}
          </div>
        )}

        {/* Cards grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <PredictionCardSkeleton key={i} />)}
          </div>
        ) : !activeCat || !activeCat.selected ? (
          <EmptyState type="no-selection" />
        ) : !activeCat.games?.length ? (
          <EmptyState type="empty" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {activeCat.games.map((game, i) => (
              <PredictionCard
                key={game.fixture_id}
                game={game}
                color={catMeta.color}
                faint={catMeta.faint}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
