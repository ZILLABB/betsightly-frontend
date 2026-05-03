import React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20, textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 72, fontWeight: 700, color: "var(--border)", lineHeight: 1 }}>404</p>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Page not found</h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)" }}>
        That page does not exist.
      </p>
      <Link
        to="/"
        style={{
          padding: "10px 24px",
          borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#000",
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
