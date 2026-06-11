import React, { useState, useCallback, useEffect } from "react";
import { TrendingUp, Zap, Shield, Target, RefreshCw, ArrowRight, Flame } from "lucide-react";
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
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import { SEO } from "../components/common/SEO";
import type { CategoryKey } from "../types";

function StatBubble({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card" style={{
      "--card-accent": color,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flex: 1,
      minWidth: 140,
    } as React.CSSProperties}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${color}10`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p className="stat-num" style={{ fontSize: 22, lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{label}</p>
      </div>
    </div>
  );
}

// ── World Cup Banner ───────────────────────────────────
function WorldCupBanner() {
  const [picks, setPicks] = useState<WCPrediction[]>([]);

  useEffect(() => {
    getWCPredictions(0.5)
      .then(preds => {
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
    <div className="animate-fade-up" style={{
      borderRadius: 16, overflow: "hidden", position: "relative",
      background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)",
      border: "1px solid var(--border)",
    }}>
      {/* Subtle gold accent line */}
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.5), rgba(245,158,11,0.3), transparent)" }} />

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src="/wc26-emblem-dark.svg"
              alt=""
              className="show-on-dark"
              style={{ height: 52, width: "auto", flexShrink: 0, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <img
              src="/wc26-emblem.png"
              alt=""
              className="show-on-light"
              style={{ height: 52, width: "auto", flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)",
              }}>FIFA World Cup 2026</span>
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(18px, 3.5vw, 24px)",
              fontWeight: 800, color: "var(--text-1)", lineHeight: 1.2, marginBottom: 4,
            }}>
              {daysToGo > 0 ? (
                <>{daysToGo} day{daysToGo !== 1 ? "s" : ""} until kickoff</>
              ) : (
                <>The World Cup is here!</>
              )}
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
              48 teams · Real bookmaker odds
            </p>
            </div>
          </div>

          <Link to="/worldcup" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, textDecoration: "none",
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.20)",
            color: "var(--gold)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
            transition: "all 150ms ease",
          }}>
            View Picks <ArrowRight size={12} />
          </Link>
        </div>

        {/* Top picks strip */}
        {picks.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 8,
          }}>
            {picks.map(p => (
              <Link to="/worldcup" key={p.match_id} style={{
                padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                background: "var(--overlay-1)", border: "1px solid var(--border)",
                transition: "background 150ms ease", display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)" }}>
                    {new Date(p.commence_time).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                    color: p.confidence >= 0.6 ? "var(--green)" : "var(--gold)",
                  }}>
                    {Math.round(p.confidence * 100)}%
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <img
                      src={getTeamFlag(p.home_team, p.home_team_logo, 40)}
                      alt=""
                      style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
                      {p.home_team}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <img
                      src={getTeamFlag(p.away_team, p.away_team_logo, 40)}
                      alt=""
                      style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
                      {p.away_team}
                    </span>
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gold)", fontWeight: 600 }}>
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

// ── Loading State — branded logo loader + skeleton grid ──
function LoadingState() {
  return (
    <BrandLoader message="Fetching today's predictions...">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ animationDelay: `${i * 80}ms` }}>
            <PredictionCardSkeleton />
          </div>
        ))}
      </div>
    </BrandLoader>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SEO path="/" />
      <WelcomeBanner />
      <WorldCupBanner />

      {/* Live track record + Telegram CTA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
        <AccuracyBadge />
        <JoinTelegram variant="card" />
      </div>

      {/* Hero — cleaner */}
      <div className="glow-bg" style={{ textAlign: "center", padding: "12px 0 0", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 20, height: 1, background: "linear-gradient(90deg, transparent, var(--brand))" }} />
          {data?.date
            ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
            : new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          <div style={{ width: 20, height: 1, background: "linear-gradient(90deg, var(--brand), transparent)" }} />
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5.5vw, 46px)", fontWeight: 800, lineHeight: 1.08, marginBottom: 10 }}>
          Today&apos;s{" "}
          <span className="text-brand-gradient">Smart Picks</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
          Curated accumulators backed by real bookmaker odds and statistical analysis.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatBubble label="Picks today" value={loading ? "—" : String(totalGames)} icon={<Target size={17} color="var(--brand)" />} color="var(--brand)" />
        <StatBubble label="Confidence" value={loading ? "—" : `${avgConf}%`} icon={<Shield size={17} color="var(--green)" />} color="var(--green)" />
        <StatBubble label="Top odds" value={loading ? "—" : `${fmtOdds(activeCat?.total_odds ?? 0)}${oddsSuffix}`} icon={<TrendingUp size={17} color="var(--blue)" />} color="var(--blue)" />
        <StatBubble label="Categories" value={String(CATEGORIES.length)} icon={<Flame size={17} color="var(--gold)" />} color="var(--gold)" />
      </div>

      {/* Tabs + content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} />

        {/* Category header */}
        {!loading && activeCat && (
          <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: catMeta.color, letterSpacing: "-0.02em" }}>
                {catMeta.label} Accumulator
              </h2>
              {activeCat.reason && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  {activeCat.reason}
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                padding: "5px 14px", borderRadius: 8,
                background: catMeta.faint, border: `1px solid ${catMeta.color}20`,
                fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700,
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
                  width: 34, height: 34, borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  cursor: "pointer", color: "var(--text-3)",
                  transition: "all 180ms ease",
                }}
              >
                <RefreshCw size={13} style={spinning ? { animation: "spin 0.5s ease" } : undefined} />
              </button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: "var(--radius-md)",
            background: "var(--red-faint)", border: "1px solid rgba(248,113,113,0.15)",
            fontFamily: "var(--font-body)", fontSize: 12, color: "var(--red)",
          }}>
            {error}
          </div>
        )}

        {/* Cards grid */}
        {loading ? (
          <LoadingState />
        ) : !activeCat || !activeCat.selected ? (
          <EmptyState type="no-selection" />
        ) : !activeCat.games?.length ? (
          <EmptyState type="empty" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
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
