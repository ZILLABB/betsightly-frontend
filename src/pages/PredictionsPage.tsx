import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePredictions } from "../hooks/usePredictions";
import { CategoryTabs } from "../components/predictions/CategoryTabs";
import { PredictionCard } from "../components/predictions/PredictionCard";
import { EmptyState } from "../components/predictions/EmptyState";
import { AccumulatorSlip } from "../components/predictions/AccumulatorSlip";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { CATEGORIES } from "../types";
import type { CategoryKey } from "../types";

const VALID_KEYS = new Set<string>(CATEGORIES.map(c => c.key));

export function PredictionsPage() {
  const { category } = useParams<{ category?: string }>();
  const initialKey: CategoryKey = category && VALID_KEYS.has(category) ? (category as CategoryKey) : "2_odds";

  const { data, loading, error, refetch } = usePredictions();
  const [activeKey, setActiveKey] = useState<CategoryKey>(initialKey);

  const accumulators = data?.accumulators;
  const activeCat = accumulators?.[activeKey];
  const catMeta = CATEGORIES.find(c => c.key === activeKey)!;

  const oddsMap = accumulators
    ? (Object.fromEntries(CATEGORIES.map(c => [c.key, accumulators[c.key]?.total_odds])) as Partial<Record<CategoryKey, number>>)
    : {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Today&apos;s Picks</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>All Predictions</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 6 }}>
          Browse all accumulator categories for {data?.date ?? "today"}.
        </p>
      </div>

      <CategoryTabs active={activeKey} onChange={setActiveKey} oddsMap={oddsMap} />

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <PredictionCardSkeleton key={i} />)}
        </div>
      ) : !activeCat || !activeCat.selected ? (
        <EmptyState type="no-selection" onRetry={refetch} />
      ) : !activeCat.games?.length ? (
        <EmptyState type="empty" />
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
                {activeCat.games.length} {activeCat.games.length === 1 ? "pick" : "picks"} · {activeCat.risk_level} risk
              </span>
              <div style={{ padding: "4px 12px", borderRadius: 6, background: catMeta.faint, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: catMeta.color }}>
                {activeCat.total_odds.toFixed(2)}x total
              </div>
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
