import React from "react";
import { Send, ArrowRight, MessageCircle } from "lucide-react";
import { TELEGRAM_GROUP_URL } from "../../config/socials";

interface Props {
  variant?: "banner" | "card" | "inline";
}

/**
 * Promotes the Telegram group. Three variants:
 * - banner: full-width prominent block (use on homepage / about)
 * - card: smaller card (sidebar / footer area)
 * - inline: just a button (use anywhere)
 */
export function JoinTelegram({ variant = "card" }: Props) {
  if (!TELEGRAM_GROUP_URL) return null;

  if (variant === "inline") {
    return (
      <a
        href={TELEGRAM_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8, textDecoration: "none",
          background: "#229ED9", color: "#fff",
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
          transition: "transform 150ms ease",
          boxShadow: "0 4px 14px rgba(34,158,217,0.25)",
        }}
      >
        <Send size={13} /> Join our Telegram
      </a>
    );
  }

  if (variant === "banner") {
    return (
      <div style={{
        borderRadius: 16, overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #229ED9 0%, #1d8ec5 50%, #0e6fa8 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 8px 32px rgba(34,158,217,0.20)",
      }}>
        <div style={{ padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "1 1 280px" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Send size={22} color="#fff" />
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)", marginBottom: 4,
              }}>
                Join the Community
              </p>
              <h3 style={{
                fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800,
                color: "#fff", lineHeight: 1.2, marginBottom: 4,
              }}>
                Daily picks dropped on Telegram
              </h3>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.75)",
                lineHeight: 1.5,
              }}>
                The day's safest rollover pick goes live every morning. Punters share their codes. Free.
              </p>
            </div>
          </div>
          <a
            href={TELEGRAM_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 22px", borderRadius: 12, textDecoration: "none",
              background: "#fff", color: "#229ED9",
              fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700,
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            Join now <ArrowRight size={15} />
          </a>
        </div>
      </div>
    );
  }

  // card variant
  return (
    <div className="card" style={{
      padding: "18px 20px",
      borderLeft: "3px solid #229ED9",
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <MessageCircle size={18} color="#229ED9" />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
          Get tips on Telegram
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
          Daily auto-posts + community punters
        </p>
      </div>
      <a
        href={TELEGRAM_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "7px 14px", borderRadius: 8, textDecoration: "none",
          background: "#229ED9", color: "#fff",
          fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
        }}
      >
        Join <ArrowRight size={12} />
      </a>
    </div>
  );
}
