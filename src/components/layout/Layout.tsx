import React from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Link } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"var(--bg)" }}>
      <Header />
      <main style={{ flex:1, maxWidth:1200, margin:"0 auto", width:"100%", padding:"28px 20px 100px" }}>
        {children}
      </main>
      <footer style={{
        borderTop:"1px solid var(--border)",
        padding:"40px 20px 24px",
        marginBottom:60,
      }} className="footer-hidden-mobile">
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <Link to="/" style={{ display:"flex", alignItems:"center", textDecoration:"none" }}>
              <img src="/logo.png" alt="BetSightly" style={{ height:36, width:"auto", objectFit:"contain", mixBlendMode:"screen" }} />
            </Link>
            <p style={{ fontFamily:"var(--font-body)",fontSize:12,color:"var(--text-3)",maxWidth:420,lineHeight:1.6 }}>
              AI-powered sports predictions. For informational purposes only — bet responsibly.
            </p>
          </div>
          <div style={{ borderTop:"1px solid var(--border)",paddingTop:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
            <span style={{ fontFamily:"var(--font-body)",fontSize:12,color:"var(--text-3)" }}>&copy; {new Date().getFullYear()} BetSightly</span>
            <span style={{ fontFamily:"var(--font-body)",fontSize:12,color:"var(--text-3)" }}>Responsible Gambling · 18+</span>
          </div>
        </div>
      </footer>
      <BottomNav />
      <style>{`@media(min-width:768px){.footer-hidden-mobile{display:block!important}}`}</style>
    </div>
  );
}
