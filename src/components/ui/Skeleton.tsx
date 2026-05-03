import React from "react";

export function Skeleton({ width="100%", height=16, radius=8, style }: { width?: string|number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width, height, borderRadius:radius, ...style }} />;
}

export function PredictionCardSkeleton() {
  return (
    <div className="card" style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <Skeleton width={100} height={13} />
        <Skeleton width={70} height={20} radius={99} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center", padding:"8px 0" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <Skeleton width={48} height={48} radius={99} />
          <Skeleton width={80} height={12} />
        </div>
        <Skeleton width={32} height={20} />
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <Skeleton width={48} height={48} radius={99} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <Skeleton width={70} height={11} />
          <Skeleton width={140} height={16} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
          <Skeleton width={40} height={11} />
          <Skeleton width={60} height={24} />
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <Skeleton width={80} height={11} />
          <Skeleton width={30} height={11} />
        </div>
        <Skeleton height={5} radius={99} />
      </div>
    </div>
  );
}
