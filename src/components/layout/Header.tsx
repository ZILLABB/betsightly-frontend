import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Target, BarChart2, RefreshCw, Settings, Users, Trophy } from "lucide-react";

const NAV = [
  { path:"/", label:"Home", icon:Home },
  { path:"/predictions", label:"Predictions", icon:Target },
  { path:"/worldcup", label:"World Cup", icon:Trophy },
  { path:"/results", label:"Results", icon:BarChart2 },
  { path:"/rollover", label:"Rollover", icon:RefreshCw },
  { path:"/punters", label:"Punters", icon:Users },
  { path:"/settings", label:"Settings", icon:Settings },
];

export function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 8;
          setScrolled(prev => prev === isScrolled ? prev : isScrolled);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (p: string) => location.pathname === p;

  return (
    <>
      <header style={{
        position:"sticky", top:0, zIndex:50,
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        background: scrolled ? "var(--nav-bg-scrolled)" : "var(--nav-bg-top)",
        backdropFilter:"blur(20px)",
        transition:"all 250ms ease",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 20px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", gap:24 }}>
          
          {/* Logo */}
          <Link to="/" style={{ display:"flex", alignItems:"center", textDecoration:"none", flexShrink:0 }}>
            <img
              src="/logo.png"
              alt="BetSightly"
              className="brand-logo"
              style={{ height:44, width:"auto", objectFit:"contain" }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" style={{ display:"flex", alignItems:"center", gap:2, flex:1, justifyContent:"center" }} className="hidden-mobile">
            {NAV.map(({ path, label }) => {
              const active = isActive(path);
              const isWC = path === "/worldcup";
              const activeColor = isWC ? "#fbbf24" : "var(--brand)";
              const activeBg = isWC ? "rgba(251,191,36,0.10)" : "rgba(59,130,246,0.10)";
              return (
                <Link key={path} to={path} style={{
                  padding:"7px 14px", borderRadius:8,
                  fontFamily:"var(--font-body)", fontSize:14, fontWeight:500,
                  textDecoration:"none", transition:"all 180ms ease",
                  color: active ? activeColor : "var(--text-2)",
                  background: active ? activeBg : "transparent",
                }}
                onMouseEnter={e => { if(!active) { (e.currentTarget as HTMLElement).style.color="var(--text-1)"; (e.currentTarget as HTMLElement).style.background="var(--nav-hover)"; }}}
                onMouseLeave={e => { if(!active) { (e.currentTarget as HTMLElement).style.color="var(--text-2)"; (e.currentTarget as HTMLElement).style.background="transparent"; }}}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="show-mobile"
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-1)", padding:6, borderRadius:8 }}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <nav aria-label="Mobile navigation" role="dialog" aria-modal={open} style={{
        position:"fixed", inset:0, zIndex:49,
        background:"var(--nav-overlay)", backdropFilter:"blur(20px)",
        display:"flex", flexDirection:"column", paddingTop:80, paddingLeft:24, paddingRight:24,
        transition:"opacity 250ms ease, transform 250ms ease",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(-8px)",
        pointerEvents: open ? "auto" : "none",
      }}>
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          const isWC = path === "/worldcup";
          const c = isWC ? "#fbbf24" : "var(--brand)";
          const bg = isWC ? "rgba(251,191,36,0.10)" : "rgba(59,130,246,0.10)";
          return (
            <Link key={path} to={path} onClick={() => setOpen(false)} style={{
              display:"flex", alignItems:"center", gap:14,
              padding:"14px 16px", borderRadius:12, textDecoration:"none",
              fontFamily:"var(--font-body)", fontSize:17, fontWeight:500,
              color: active ? c : "var(--text-2)",
              background: active ? bg : "transparent",
              borderLeft: active ? `2px solid ${c}` : "2px solid transparent",
              marginBottom:4,
            }}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) { .hidden-mobile { display:flex !important; } .show-mobile { display:none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display:none !important; } .show-mobile { display:flex !important; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}
