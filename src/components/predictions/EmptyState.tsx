import React from "react";
import { AlertCircle, RefreshCw, Calendar } from "lucide-react";

interface Props {
  type: "empty" | "error" | "no-selection";
  message?: string;
  onRetry?: () => void;
}

export function EmptyState({ type, message, onRetry }: Props) {
  const configs = {
    empty: {
      icon: <Calendar size={40} strokeWidth={1.5} color="var(--text-3)" />,
      title: "No predictions today",
      sub: message || "Check back later — predictions refresh each morning.",
    },
    error: {
      icon: <AlertCircle size={40} strokeWidth={1.5} color="var(--red)" />,
      title: "Could not load predictions",
      sub: message || "We had trouble reaching the server.",
    },
    "no-selection": {
      icon: <Calendar size={40} strokeWidth={1.5} color="var(--text-3)" />,
      title: "Not available today",
      sub: message || "No picks were selected for this category today.",
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
    </div>
  );
}
