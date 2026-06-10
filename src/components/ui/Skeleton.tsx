import React from "react";

export function Skeleton({ width="100%", height=16, radius=8, style }: { width?: string|number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width, height, borderRadius:radius, ...style }} />;
}

export function PredictionCardSkeleton() {
  return (
    <div className="card animate-fade-up" style={{ padding: 0, overflow: "hidden" }}>
      {/* Top strip */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "10px 16px",
        background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)",
      }}>
        <Skeleton width={90} height={12} />
        <Skeleton width={50} height={12} />
      </div>

      {/* Teams row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 12px" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <Skeleton width={32} height={22} radius={4} />
          <Skeleton width={90} height={14} />
        </div>
        <Skeleton width={28} height={18} radius={6} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <Skeleton width={90} height={14} />
          <Skeleton width={32} height={22} radius={4} />
        </div>
      </div>

      {/* Prediction bar */}
      <div style={{ margin: "0 16px 14px", padding: "10px 14px", borderRadius: 10, background: "var(--surface-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={10} />
          </div>
          <Skeleton width={50} height={24} radius={6} />
        </div>
      </div>

      {/* Bottom chips */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px" }}>
        <Skeleton width={60} height={20} radius={5} />
        <Skeleton width={75} height={20} radius={5} />
      </div>
    </div>
  );
}
