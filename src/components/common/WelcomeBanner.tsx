import React, { useEffect, useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "bs_welcome_dismissed_v1";

/**
 * Single-use welcome banner for first-time visitors. Stores a dismiss
 * flag in localStorage so it never shows again to that browser.
 */
export function WelcomeBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setShow(true);
    } catch {
      // localStorage unavailable (private mode etc.) — just don't show
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
    setShow(false);
  };

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden", position: "relative",
      background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(34,197,94,0.08) 100%)",
      border: "1px solid rgba(59,130,246,0.18)",
      padding: "20px 24px 22px",
    }}>
      <button
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        style={{
          position: "absolute", top: 12, right: 12,
          width: 28, height: 28, borderRadius: 8,
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--text-3)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <X size={14} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={17} color="var(--brand)" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>
          Welcome to BetSightly
        </h2>
      </div>

      <p style={{
        fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)",
        lineHeight: 1.7, marginBottom: 14, maxWidth: 720,
      }}>
        We pull live odds from real bookmakers, run them through statistical models,
        and only show you picks where multiple independent signals agree. Daily picks for
        <strong style={{ color: "var(--text-1)" }}> 2 Odds</strong>, <strong style={{ color: "var(--text-1)" }}>5 Odds</strong>,
        <strong style={{ color: "var(--text-1)" }}> 10 Odds</strong>, a <strong style={{ color: "var(--text-1)" }}>10-day rollover challenge</strong>,
        and coverage across <strong style={{ color: "var(--text-1)" }}>47 leagues worldwide</strong>. Free, no signup.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link to="/about" onClick={dismiss} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8, textDecoration: "none",
          background: "var(--brand)", color: "#fff",
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
        }}>
          How it works <ArrowRight size={13} />
        </Link>
        <button onClick={dismiss} style={{
          padding: "8px 16px", borderRadius: 8, cursor: "pointer",
          background: "var(--surface)", border: "1px solid var(--border)",
          color: "var(--text-2)",
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
        }}>
          Got it, take me to the picks
        </button>
      </div>
    </div>
  );
}
