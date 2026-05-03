import React from "react";
import { Settings, Bell, Moon, Info } from "lucide-react";

function Row({ icon, label, sub, children }: { icon: React.ReactNode; label: string; sub: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{label}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{sub}</p>
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Preferences</div>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Settings</h1>
      </div>

      <div className="card" style={{ padding: "0 22px" }}>
        <Row icon={<Bell size={16} color="var(--brand)" />} label="Notifications" sub="Get notified when new picks are ready">
          <div style={{ width: 40, height: 22, borderRadius: 11, background: "var(--surface-3)", position: "relative", cursor: "not-allowed", opacity: 0.5 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--text-3)", position: "absolute", top: 2, left: 2 }} />
          </div>
        </Row>
        <Row icon={<Moon size={16} color="var(--blue)" />} label="Dark mode" sub="Always on — optimised for night viewing">
          <div style={{ width: 40, height: 22, borderRadius: 11, background: "var(--brand-faint)", border: "1px solid var(--border-brand)", position: "relative" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--brand)", position: "absolute", top: 2, right: 2 }} />
          </div>
        </Row>
        <Row icon={<Info size={16} color="var(--text-3)" />} label="About BetSightly" sub="v1.0 · AI-powered sports predictions">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>v1.0</span>
        </Row>
      </div>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", textAlign: "center", lineHeight: 1.8 }}>
        BetSightly is for informational purposes only.<br />
        Please gamble responsibly. 18+ only.
      </p>
    </div>
  );
}
