import React from "react";
import { BarChart3 } from "lucide-react";

export function ResultsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Track Record</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Results</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 6 }}>
          Historical performance of our AI predictions.
        </p>
      </div>

      <div className="card" style={{ padding: "64px 24px", textAlign: "center" }}>
        <BarChart3 size={48} strokeWidth={1.2} color="var(--text-3)" style={{ margin: "0 auto 20px" }} />
        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>
          Results history coming soon
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", maxWidth: 340, margin: "0 auto" }}>
          We&apos;re compiling past prediction accuracy. Check back after the first round of picks resolves.
        </p>
      </div>
    </div>
  );
}
