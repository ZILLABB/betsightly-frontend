import React from "react";
import {
  Bell, Moon, Sun, Monitor, Info, BarChart2,
  DollarSign, Globe, RotateCcw, ChevronRight, Check, Mail, HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePreferences } from "../hooks/usePreferences";
import type { ThemeMode, OddsFormat, Currency, Language } from "../contexts/PreferencesTypes";

// ── Primitives ────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: "var(--text-3)", marginBottom: 8, paddingLeft: 4,
      }}>{title}</p>
      <div className="card" style={{ padding: "0 20px" }}>{children}</div>
    </div>
  );
}

function Row({ icon, label, sub, last, children }: {
  icon: React.ReactNode; label: string; sub: string;
  last?: boolean; children?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "15px 0",
      borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, background: "var(--surface-2)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{label}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{sub}</p>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-checked={on}
      role="switch"
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: on ? "var(--brand)" : "var(--surface-3)",
        position: "relative", transition: "background 200ms var(--ease)",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: on ? "#000" : "var(--text-3)",
        position: "absolute", top: 3,
        left: on ? "calc(100% - 21px)" : 3,
        transition: "left 200ms var(--ease), background 200ms var(--ease)",
      }} />
    </button>
  );
}

function Chip<T extends string>({ value, current, label, onChange }: {
  value: T; current: T; label: string; onChange: (v: T) => void;
}) {
  const active = value === current;
  return (
    <button
      onClick={() => onChange(value)}
      style={{
        padding: "6px 13px", borderRadius: 8, border: "none", cursor: "pointer",
        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
        background: active ? "var(--brand)" : "var(--surface-2)",
        color: active ? "#000" : "var(--text-2)",
        transition: "all 180ms var(--ease)",
      }}
    >{label}</button>
  );
}

function Select<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        style={{
          appearance: "none", background: "var(--surface-2)",
          border: "1px solid var(--border)", borderRadius: 8,
          color: "var(--text-1)", fontFamily: "var(--font-body)",
          fontSize: 13, fontWeight: 600, padding: "7px 32px 7px 12px",
          cursor: "pointer", outline: "none",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronRight size={13} color="var(--text-3)" style={{
        position: "absolute", right: 10, top: "50%",
        transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none",
      }} />
    </div>
  );
}

// ── Theme picker ──────────────────────────────────────

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun size={14} /> },
  { value: "dark",  label: "Dark",  icon: <Moon size={14} /> },
  { value: "system",label: "Auto",  icon: <Monitor size={14} /> },
];

function ThemePicker({ current, onChange }: { current: ThemeMode; onChange: (t: ThemeMode) => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {THEME_OPTIONS.map(({ value, label, icon }) => {
        const active = value === current;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 11px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              background: active ? "var(--brand)" : "var(--surface-2)",
              color: active ? "#000" : "var(--text-2)",
              transition: "all 180ms var(--ease)",
            }}
          >
            {icon}{label}
            {active && <Check size={11} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────

export function SettingsPage() {
  const { preferences, updatePreference, resetPreferences } = usePreferences();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 560, margin: "0 auto" }}>

      {/* Header */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Preferences</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, color: "var(--text-1)" }}>
          Settings
        </h1>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <Row
          icon={<Moon size={15} color="var(--blue)" />}
          label="Theme"
          sub="Choose light, dark, or follow your system"
        >
          <ThemePicker
            current={preferences.theme}
            onChange={v => updatePreference("theme", v)}
          />
        </Row>
        <Row
          icon={<BarChart2 size={15} color="var(--green)" />}
          label="Odds format"
          sub="How odds are displayed across the app"
          last
        >
          <div style={{ display: "flex", gap: 5 }}>
            {(["decimal", "fractional", "american"] as OddsFormat[]).map(f => (
              <Chip
                key={f}
                value={f}
                current={preferences.oddsFormat}
                label={f === "decimal" ? "Dec" : f === "fractional" ? "Frac" : "Amer"}
                onChange={v => updatePreference("oddsFormat", v)}
              />
            ))}
          </div>
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row
          icon={<Bell size={15} color="var(--brand)" />}
          label="Push notifications"
          sub="Get alerted when new picks are ready"
          last
        >
          <Toggle
            on={preferences.enableNotifications}
            onChange={v => updatePreference("enableNotifications", v)}
          />
        </Row>
      </Section>

      {/* Regional */}
      <Section title="Regional">
        <Row
          icon={<DollarSign size={15} color="var(--green)" />}
          label="Currency"
          sub="Used for stake and payout displays"
        >
          <Select<Currency>
            value={preferences.currency}
            onChange={v => updatePreference("currency", v)}
            options={[
              { value: "USD", label: "USD — $" },
              { value: "EUR", label: "EUR — €" },
              { value: "GBP", label: "GBP — £" },
              { value: "NGN", label: "NGN — ₦" },
            ]}
          />
        </Row>
        <Row
          icon={<Globe size={15} color="var(--purple)" />}
          label="Language"
          sub="App display language"
          last
        >
          <Select<Language>
            value={preferences.language}
            onChange={v => updatePreference("language", v)}
            options={[
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
              { value: "es", label: "Español" },
              { value: "de", label: "Deutsch" },
            ]}
          />
        </Row>
      </Section>

      {/* About + Support */}
      <Section title="About & support">
        <Link to="/about" style={{ textDecoration: "none", display: "block" }}>
          <Row
            icon={<HelpCircle size={15} color="var(--brand)" />}
            label="How it works"
            sub="Methodology, data sources, FAQ"
          >
            <ChevronRight size={16} color="var(--text-3)" />
          </Row>
        </Link>
        <a href="mailto:support@betsightly.com" style={{ textDecoration: "none", display: "block" }}>
          <Row
            icon={<Mail size={15} color="var(--text-3)" />}
            label="Contact support"
            sub="Bug reports, feedback, league requests"
          >
            <ChevronRight size={16} color="var(--text-3)" />
          </Row>
        </a>
        <Row
          icon={<Info size={15} color="var(--text-3)" />}
          label="BetSightly"
          sub="Sports predictions backed by data"
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>v1.0</span>
        </Row>
        <Row
          icon={<RotateCcw size={15} color="var(--red)" />}
          label="Reset settings"
          sub="Restore all preferences to defaults"
          last
        >
          <button
            onClick={resetPreferences}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)",
              background: "transparent", color: "var(--red)",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 180ms var(--ease)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--red-faint)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Reset
          </button>
        </Row>
      </Section>

      <p style={{
        fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)",
        textAlign: "center", lineHeight: 1.8,
      }}>
        BetSightly is for informational purposes only.<br />
        Please gamble responsibly. 18+ only.
      </p>
    </div>
  );
}
