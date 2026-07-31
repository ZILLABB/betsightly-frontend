import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePredictions } from "../hooks/usePredictions";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { CategoryTabs } from "../components/predictions/CategoryTabs";
import { PredictionCard } from "../components/predictions/PredictionCard";
import { EmptyState } from "../components/predictions/EmptyState";
import { AccumulatorSlip } from "../components/predictions/AccumulatorSlip";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { BrandLoader } from "../components/ui/BrandLoader";
import { CATEGORIES } from "../types";
import type { CategoryKey } from "../types";
import { SEO } from "../components/common/SEO";

const VALID_KEYS = new Set<string>(CATEGORIES.map(c => c.key));

export function PredictionsPage() {
  const { category } = useParams<{ category?: string }>();
  const initialKey: CategoryKey = category && VALID_KEYS.has(category) ? (category as CategoryKey) : "2_odds";

  const { data, loading, error, refetch } = usePredictions();
  const [activeKey, setActiveKey] = useState<CategoryKey>(initialKey);
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  const accumulators = data?.accumulators;
  const activeCat = accumulators?.[activeKey];
  const catMeta = CATEGORIES.find(c => c.key === activeKey)!;

  const oddsMap = accumulators
    ? (Object.fromEntries(CATEGORIES.map(c => [c.key, accumulators[c.key]?.total_odds])) as Partial<Record<CategoryKey, number>>)
    : {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <SEO title="Predictions" description="Today's best football predictions — 2 Odds, 5 Odds, 10 Odds, and Over 1.5 picks backed by real bookmaker odds." path="/predictions" />
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Today&apos;s Picks</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>All Predictions</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 6 }}>
          Every accumulator for {data?.date
            ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
            : "today"} — pick a tier that matches your risk appetite.
        </p>
      </div>

      <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} />

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <BrandLoader message="Building today's accumulators...">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <PredictionCardSkeleton key={i} />)}
          </div>
        </BrandLoader>
      ) : !activeCat || !activeCat.selected ? (
        <EmptyState type="no-selection" onRetry={refetch} />
      ) : !activeCat.games?.length ? (
        <EmptyState type="empty" />
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
                {activeCat.games.length} {activeCat.games.length === 1 ? "pick" : "picks"} · {activeCat.risk_level} risk
              </span>
              <div style={{ padding: "4px 12px", borderRadius: 6, background: catMeta.faint, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: catMeta.color }}>
                {fmtOdds(activeCat.total_odds)}{oddsSuffix} total
              </div>
              {typeof activeCat.hit_probability === "number" && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
                  lands ~{Math.round(activeCat.hit_probability * 100)}% of the time
                </span>
              )}
            </div>
            <AccumulatorSlip
              games={activeCat.games}
              category={catMeta}
              totalOdds={activeCat.total_odds}
              date={data?.date ?? new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {activeCat.games.map((game, i) => (
              <PredictionCard key={game.fixture_id} game={game} color={catMeta.color} faint={catMeta.faint} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
