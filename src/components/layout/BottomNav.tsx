import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Target, Users, Settings } from "lucide-react";

/* WC 2026 tab shows the official emblem instead of a generic trophy icon —
   white variant in dark theme, black in light. Accepts the same size/style
   props the lucide icons get so the NAV map stays uniform. */

const NAV = [
  { path:"/", label:"Home", icon:Home },
  { path:"/predictions", label:"Picks", icon:Target },
  { path:"/rollover", label:"Rollover", icon:RefreshCw },
  { path:"/punters", label:"Punters", icon:Users },
  { path:"/settings", label:"Settings", icon:Settings },
];

export function BottomNav() {
  const location = useLocation();
  const isActive = (p: string) => location.pathname === p;

  return (
    <>
      <nav style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:50,
        background:"var(--nav-overlay)", backdropFilter:"blur(20px)",
        borderTop:"1px solid var(--border)",
        display:"flex", alignItems:"center",
        padding:"8px 0 max(8px, env(safe-area-inset-bottom))",
      }} className="bottom-nav">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          const isWC = false;
          const activeColor = isWC ? "#f59e0b" : "var(--brand)";
          const activeBg = isWC ? "rgba(245,158,11,0.12)" : "var(--brand-faint)";
          return (
            <Link key={path} to={path} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              textDecoration:"none", padding:"4px 0", transition:"all 180ms ease",
            }}>
              <div style={{
                width:44, height:28, borderRadius:14,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: active ? activeBg : "transparent",
                transition:"all 200ms ease",
              }}>
                <Icon size={20} style={{ color: active ? activeColor : "var(--text-3)", transition:"color 200ms ease" }} />
              </div>
              <span style={{
                fontFamily:"var(--font-body)", fontSize:10, fontWeight:600,
                color: active ? activeColor : "var(--text-3)",
                letterSpacing:"0.03em",
                transition:"color 200ms ease",
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
      <style>{`
        @media (min-width: 768px) { .bottom-nav { display:none !important; } }
      `}</style>
    </>
  );
}
