import React from "react";
import { AlertCircle, RefreshCw, Calendar, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  type: "empty" | "error" | "no-selection";
  message?: string;
  onRetry?: () => void;
}

export function EmptyState({ type, message, onRetry }: Props) {
  const configs = {
    empty: {
      icon: <Calendar size={40} strokeWidth={1.5} color="var(--text-3)" />,
      title: "No matches for this category today",
      sub: message || "Odds refresh every 6 hours. New matches may appear later today or in the next match day.",
      hint: "Other categories may still have picks. Try checking the World Cup tab — 72 matches with full coverage.",
    },
    error: {
      icon: <AlertCircle size={40} strokeWidth={1.5} color="var(--red)" />,
      title: "Could not load predictions",
      sub: message || "We had trouble reaching the server. Check your connection or try again in a moment.",
      hint: null,
    },
    "no-selection": {
      icon: <Calendar size={40} strokeWidth={1.5} color="var(--text-3)" />,
      title: "No safe picks for this category right now",
      sub: message || "We only show picks when our model is highly confident. Days without safe matches are skipped rather than padded with risky bets.",
      hint: "The Rollover chain auto-skips ahead. Or check World Cup for fixed-schedule picks.",
    },
  };

  const cfg = configs[type];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 24px",
      gap: 16,
      textAlign: "center",
    }}>
      {cfg.icon}
      <div>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-1)",
          marginBottom: 6,
        }}>
          {cfg.title}
        </p>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--text-3)",
          maxWidth: 340,
          lineHeight: 1.6,
        }}>
          {cfg.sub}
        </p>
      </div>
      {type === "error" && onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-2)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
      {cfg.hint && type !== "error" && (
        <div style={{
          marginTop: 8, padding: "10px 16px", borderRadius: 10,
          background: "var(--surface-2)", border: "1px solid var(--border)",
          maxWidth: 380, display: "flex", flexDirection: "column", gap: 8,
        }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
            {cfg.hint}
          </p>
          <Link to="/worldcup" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
            color: "#fbbf24", textDecoration: "none",
          }}>
            <Trophy size={12} /> View World Cup picks <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
