import React, { useState, useCallback } from "react";
import { TrendingUp, Shield, Target, RefreshCw, Flame } from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
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
