import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant="primary", size="md", loading, children, disabled, style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    fontFamily:"var(--font-body)", fontWeight:600, cursor:"pointer",
    border:"none", transition:"all 200ms cubic-bezier(0.4,0,0.2,1)",
    whiteSpace:"nowrap", userSelect:"none",
    opacity: disabled || loading ? 0.55 : 1,
    pointerEvents: disabled || loading ? "none" : "auto",
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize:13, padding:"7px 14px", borderRadius:8 },
    md: { fontSize:14, padding:"10px 20px", borderRadius:10 },
    lg: { fontSize:16, padding:"13px 28px", borderRadius:12 },
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#000", boxShadow:"0 2px 12px rgba(245,158,11,0.35)" },
    secondary: { background:"rgba(255,255,255,0.07)", color:"var(--text-1)", border:"1px solid var(--border)" },
    ghost:     { background:"transparent", color:"var(--text-2)" },
    outline:   { background:"transparent", color:"var(--brand)", border:"1px solid rgba(245,158,11,0.35)" },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} disabled={disabled || loading} {...props}>
      {loading && <span style={{ width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />}
      {children}
    </button>
  );
}
