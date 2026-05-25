import React from "react";

export function Spinner({ size=20, color="var(--brand)" }: { size?: number; color?: string }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      border:`2px solid ${color}33`,
      borderTopColor:color,
      animation:"spin 0.7s linear infinite",
      display:"inline-block", flexShrink:0,
    }} />
  );
}
