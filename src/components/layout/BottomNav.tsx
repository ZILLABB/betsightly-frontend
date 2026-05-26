import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Target, BarChart2, RefreshCw, Settings, Users } from "lucide-react";

const NAV = [
  { path:"/", label:"Home", icon:Home },
  { path:"/predictions", label:"Picks", icon:Target },
  { path:"/results", label:"Results", icon:BarChart2 },
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
        background:"rgba(7,7,26,0.97)", backdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        display:"flex", alignItems:"center",
        padding:"8px 0 max(8px, env(safe-area-inset-bottom))",
      }} className="bottom-nav">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} to={path} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              textDecoration:"none", padding:"4px 0", transition:"all 180ms ease",
            }}>
              <div style={{
                width:44, height:28, borderRadius:14,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: active ? "rgba(245,158,11,0.15)" : "transparent",
                transition:"all 200ms ease",
              }}>
                <Icon size={20} style={{ color: active ? "var(--brand)" : "var(--text-3)", transition:"color 200ms ease" }} />
              </div>
              <span style={{
                fontFamily:"var(--font-body)", fontSize:10, fontWeight:600,
                color: active ? "var(--brand)" : "var(--text-3)",
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
