import React, { useState, useCallback } from "react";
import { TrendingUp, Zap, Shield, Target, RefreshCw } from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";
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

export function HomePage() {
  const { data, loading, error, refetch } = usePredictions();
  const [activeKey, setActiveKey] = useState<CategoryKey>("2_odds");
  const [spinning, setSpinning] = useState(false);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* Hero */}
      <div className="glow-bg" style={{ textAlign: "center", padding: "16px 0 0", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 24, height: 1, background: "linear-gradient(90deg, transparent, var(--brand))" }} />
          AI-Powered · {data?.date ?? new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          <div style={{ width: 24, height: 1, background: "linear-gradient(90deg, var(--brand), transparent)" }} />
        </div>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 52px)", fontWeight: 800, lineHeight: 1.08, marginBottom: 16 }}>
          Today&apos;s{" "}
          <span className="text-brand-gradient">Smart Picks</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-2)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          Curated accumulators powered by machine-learning models trained on thousands of matches.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatBubble label="Picks today" value={loading ? "—" : String(totalGames)} icon={<Target size={19} color="var(--brand)" />} color="var(--brand)" />
        <StatBubble label="Confidence" value={loading ? "—" : `${avgConf}%`} icon={<Shield size={19} color="var(--green)" />} color="var(--green)" />
        <StatBubble label="Top odds" value={loading ? "—" : `${(activeCat?.total_odds ?? 0).toFixed(2)}x`} icon={<TrendingUp size={19} color="var(--blue)" />} color="var(--blue)" />
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
                {activeCat.total_odds.toFixed(2)}x
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
