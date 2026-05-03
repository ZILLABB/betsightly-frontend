import React from "react";
import { usePredictions } from "../hooks/usePredictions";
import { PredictionCard } from "../components/predictions/PredictionCard";
import { EmptyState } from "../components/predictions/EmptyState";
import { PredictionCardSkeleton } from "../components/ui/Skeleton";
import { CATEGORIES } from "../types";
import { Repeat2 } from "lucide-react";

export function RolloverPage() {
  const { data, loading, error, refetch } = usePredictions();
  const rollover = data?.accumulators?.rollover;
  const catMeta = CATEGORIES.find(c => c.key === "rollover")!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: catMeta.faint, border: `1px solid ${catMeta.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Repeat2 size={22} color={catMeta.color} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Multi-day challenge</div>
          <h1 style={{ fontSize: 30, fontWeight: 800 }}>Rollover</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 4 }}>
            Build your bankroll over multiple days with our curated rollover picks.
          </p>
        </div>
      </div>

      {rollover && rollover.selected && (
        <div className="card" style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderLeft: `3px solid ${catMeta.color}` }}>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginBottom: 2 }}>Today&apos;s rollover odds</p>
            <p className="stat-num" style={{ fontSize: 28, color: catMeta.color }}>{rollover.total_odds.toFixed(2)}x</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginBottom: 2 }}>Risk level</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{rollover.risk_level}</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <PredictionCardSkeleton key={i} />)}
        </div>
      ) : !rollover || !rollover.selected ? (
        <EmptyState type="no-selection" message="No rollover picks selected for today." onRetry={refetch} />
      ) : !rollover.games?.length ? (
        <EmptyState type="empty" message="Rollover games will appear here." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {rollover.games.map((game, i) => (
            <PredictionCard key={game.fixture_id} game={game} color={catMeta.color} faint={catMeta.faint} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
