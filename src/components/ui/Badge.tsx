import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  faint?: string;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export function Badge({ children, color="var(--brand)", faint="rgba(59,130,246,0.12)", size="sm", style }: BadgeProps) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontFamily:"var(--font-body)", fontWeight:600,
      fontSize: size==="sm" ? 11 : 12,
      letterSpacing:"0.04em", textTransform:"uppercase",
      padding: size==="sm" ? "3px 8px" : "4px 10px",
      borderRadius:99, color, background:faint,
      border:`1px solid ${color}33`,
      ...style,
    }}>
      {children}
    </span>
  );
}
