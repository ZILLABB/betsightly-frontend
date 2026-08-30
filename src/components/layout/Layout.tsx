import React from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Link } from "react-router-dom";
import { PWAInstallPrompt } from "../common/PWAInstallPrompt";
import { SocialLinks } from "../common/SocialLinks";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell" style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
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
              <Link to="/" className="brand-lockup" style={{ marginBottom: 12 }} aria-label="BetSightly home">
                <span className="brand-image brand-image-footer" aria-hidden="true" />
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

            {/* Leagues */}
            <div>
              <h4 style={{ fontFamily:"var(--font-body)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-2)", marginBottom:12 }}>
                Leagues
              </h4>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Link to="/predictions" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>All Predictions</Link>
                <Link to="/predictions/5_odds" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>5 Odds</Link>
                <Link to="/predictions/10_odds" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>10 Odds</Link>
                <Link to="/predictions/over_1_5" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Over 1.5</Link>
              </div>
            </div>

            {/* About */}
            <div>
              <h4 style={{ fontFamily:"var(--font-body)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-2)", marginBottom:12 }}>
                About
              </h4>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Link to="/about" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>How it works</Link>
                <Link to="/punters" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Expert Punters</Link>
                <Link to="/settings" style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>Settings</Link>
              </div>
            </div>
          </div>

          {/* Responsible gambling banner */}
          <div style={{
            padding: "14px 18px", borderRadius: 10,
            background: "rgba(248,113,113,0.04)",
            border: "1px solid rgba(248,113,113,0.15)",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ fontSize: 18, lineHeight: 1, color: "var(--red)" }}>⚠</span>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
              <strong>18+ only.</strong> Sports betting carries financial risk — only bet what you can afford to lose.
              Predictions are informational and probabilistic. No result is guaranteed.
              If gambling is a problem for you or someone you know, please contact a national helpline.
            </p>
          </div>

          {/* Bottom row */}
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
            <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-3)" }}>&copy; {new Date().getFullYear()} BetSightly · All rights reserved</span>
            <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <SocialLinks size={15} />
              <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text-3)" }}>
                <Link to="/about" style={{ color:"var(--text-3)", textDecoration:"none", marginRight:14 }}>About</Link>
                Bet Responsibly · 18+
              </span>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
      <PWAInstallPrompt />

      <style>{`
        /* Footer hidden on mobile, visible on desktop */
        .site-footer { display: none; }
        @media (min-width: 768px) {
          .site-footer { display: block; }
        }
        /* Main: tight padding on mobile, account for bottom nav */
        @media (max-width: 767px) {
          .main-area {
            padding: 16px 14px 100px !important;
          }
        }
        /* Prevent horizontal overflow from very wide content */
        html, body { overflow-x: hidden; }
        /* Footer grid: stack on smaller desktops */
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
