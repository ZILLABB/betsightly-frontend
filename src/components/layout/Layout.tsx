import React from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Link } from "react-router-dom";
import { Trophy, Target, Users, BarChart2 } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"var(--bg)" }}>
      <Header />
      <main style={{ flex:1, maxWidth:1200, margin:"0 auto", width:"100%", padding:"28px 20px 28px" }} className="main-area">
        {children}
      </main>

      {/* Footer — only shows on desktop (>=768px) */}
      <footer className="site-footer" style={{
        borderTop:"1px solid var(--border)",
        padding:"32px 20px 24px",
        marginTop: 40,
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:28 }}>
          {/* Top row: logo + nav links */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:32 }} className="footer-grid">
            {/* Brand */}
            <div>
              <Link to="/" style={{ display:"inline-flex", alignItems:"center", textDecoration:"none", marginBottom: 12 }}>
                <img src="/logo.png" alt="BetSightly" className="brand-logo" style={{ height:32, width:"auto", objectFit:"contain" }} />
              </Link>
              <p style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-3)", lineHeight:1.6, maxWidth:320 }}>
                Sports predictions backed by real bookmaker odds and statistical analysis. For informational purposes only.
              </p>
            </div>

            {/* Predictions */}
            <div>
              <h4 style={{ fontFamily:"var(--font-body)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-2)", marginBottom:12 }}>
                Predictions
              </h4>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Link to="/predictions" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Today's Picks</Link>
                <Link to="/predictions/2_odds" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>2 Odds</Link>
                <Link to="/predictions/rollover" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Rollover</Link>
                <Link to="/results" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Results</Link>
              </div>
            </div>

            {/* World Cup */}
            <div>
              <h4 style={{ fontFamily:"var(--font-body)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-2)", marginBottom:12 }}>
                World Cup 2026
              </h4>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Link to="/worldcup" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>All Predictions</Link>
                <Link to="/worldcup" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Groups</Link>
                <Link to="/worldcup" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Accumulators</Link>
                <Link to="/worldcup" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Value Bets</Link>
              </div>
            </div>

            {/* Community */}
            <div>
              <h4 style={{ fontFamily:"var(--font-body)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-2)", marginBottom:12 }}>
                Community
              </h4>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Link to="/punters" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Expert Punters</Link>
                <Link to="/settings" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Settings</Link>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-3)" }}>&copy; {new Date().getFullYear()} BetSightly. All rights reserved.</span>
            <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-3)" }}>Bet Responsibly · 18+</span>
          </div>
        </div>
      </footer>

      <BottomNav />

      <style>{`
        /* Footer hidden on mobile, visible on desktop */
        .site-footer { display: none; }
        @media (min-width: 768px) {
          .site-footer { display: block; }
        }
        /* Main bottom padding: account for bottom nav on mobile */
        @media (max-width: 767px) {
          .main-area { padding-bottom: 100px !important; }
        }
        /* Footer grid: stack on smaller desktops */
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
