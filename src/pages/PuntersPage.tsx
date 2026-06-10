import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Users, Search, Star, RefreshCw, Award, MapPin,
  TrendingUp, User, ExternalLink, ChevronLeft, ChevronRight,
  MessageCircle, Send, Bot, Hash, ChevronDown, ChevronUp,
  Clock, CheckCircle, XCircle, Copy, Flame, Filter,
  BarChart2, List, Grid, Zap, Calendar
} from "lucide-react";
import { getPuntersList, type Punter } from "../services/punterService";
import type { BettingCode } from "../types";
import { useNavigate } from "react-router-dom";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { SEO } from "../components/common/SEO";
import { BrandLoader } from "../components/ui/BrandLoader";

const BOOKMAKER_INFO: Record<string, { logo: string; color: string; url: string }> = {
  sportybet:  { logo: "https://www.sportybet.com/favicon.ico", color: "#2DB544", url: "https://www.sportybet.com" },
  bet9ja:     { logo: "https://web.bet9ja.com/favicon.ico", color: "#1A5B2C", url: "https://www.bet9ja.com" },
  "1xbet":    { logo: "https://1xbet.com/favicon.ico", color: "#1A6DC0", url: "https://1xbet.com" },
  betking:    { logo: "https://www.betking.com/favicon.ico", color: "#0055A5", url: "https://www.betking.com" },
  betway:     { logo: "https://betway.com/favicon.ico", color: "#00A826", url: "https://betway.com" },
  "22bet":    { logo: "https://22bet.ng/favicon.ico", color: "#1B3E6F", url: "https://22bet.ng" },
  msport:     { logo: "https://www.msport.com/favicon.ico", color: "#E63E2E", url: "https://www.msport.com" },
  nairabet:   { logo: "https://www.nairabet.com/favicon.ico", color: "#006B3F", url: "https://www.nairabet.com" },
  betano:     { logo: "https://www.betano.com/favicon.ico", color: "#D4213D", url: "https://www.betano.com" },
  paripesa:   { logo: "https://paripesa.bet/favicon.ico", color: "#FFB800", url: "https://paripesa.bet" },
};

function BookmakerBadge({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  const bm = BOOKMAKER_INFO[key];
  const initial = name.charAt(0).toUpperCase();

  const content = (
    <>
      {bm ? (
        <img
          src={bm.logo}
          alt={name}
          width={14}
          height={14}
          style={{ borderRadius: 3, objectFit: "contain" }}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}
      <span
        style={{
          display: bm ? "none" : "flex",
          width: 14, height: 14, borderRadius: 3,
          background: bm?.color ?? "var(--surface-2)",
          alignItems: "center", justifyContent: "center",
          fontSize: 8, fontWeight: 700, color: "#fff",
          flexShrink: 0,
        }}
      >{initial}</span>
      {name}
      {bm && <ExternalLink size={9} style={{ opacity: 0.5 }} />}
    </>
  );

  if (bm) {
    return (
      <a
        href={bm.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
          textDecoration: "none",
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
    }}>
      {content}
    </span>
  );
}

// ── Constants ──────────────────────────────────────────────
const AUTO_REFRESH_MS = 60_000; // 60s

// ── Stat Pill ──────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1, minWidth: 60 }}>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700,
        color, lineHeight: 1.2,
      }}>{value}</p>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
        marginTop: 2,
      }}>{label}</p>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    won: { bg: "rgba(34,197,94,0.12)", color: "var(--green)", label: "Won" },
    lost: { bg: "rgba(248,113,113,0.12)", color: "var(--red)", label: "Lost" },
    pending: { bg: "var(--overlay-2)", color: "var(--text-3)", label: "Pending" },
  };
  const c = config[status] || config.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
      fontFamily: "var(--font-mono)", background: c.bg, color: c.color,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: c.color, flexShrink: 0,
      }} />
      {c.label}
    </span>
  );
}

// ── Betting Code Row ───────────────────────────────────────
function CodeRow({ code }: { code: BettingCode }) {
  const [copied, setCopied] = useState(false);
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  const handleCopy = () => {
    navigator.clipboard.writeText(code.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <StatusBadge status={code.status} />
      <button
        onClick={handleCopy}
        title="Copy code"
        style={{
          fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
          color: "var(--brand)", background: "none", border: "none",
          cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4,
        }}
      >
        {code.code}
        <Copy size={10} color={copied ? "var(--green)" : "var(--text-3)"} />
      </button>
      <span style={{ flex: 1, textAlign: "right" }}>
        {code.bookmaker_name ? <BookmakerBadge name={code.bookmaker_name} /> : "—"}
      </span>
      {code.odds && (
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
          color: "var(--text-2)", background: "var(--surface-2)",
          padding: "2px 6px", borderRadius: 4,
        }}>
          {fmtOdds(code.odds)}{oddsSuffix}
        </span>
      )}
    </div>
  );
}

// ── Streak Badge ───────────────────────────────────────────
function StreakBadge({ punter }: { punter: Punter }) {
  const codes = punter.betting_codes ?? [];
  const resolved = codes
    .filter(c => c.status === "won" || c.status === "lost")
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  if (resolved.length < 2) return null;

  let streak = 1;
  const type = resolved[0].status;
  for (let i = 1; i < resolved.length; i++) {
    if (resolved[i].status === type) streak++;
    else break;
  }
  if (streak < 2) return null;

  const isWin = type === "won";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
      fontFamily: "var(--font-mono)",
      background: isWin ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)",
      color: isWin ? "var(--green)" : "var(--red)",
    }}>
      <Flame size={10} /> {streak}{isWin ? "W" : "L"}
    </span>
  );
}

// ── Punter Card ────────────────────────────────────────────
function PunterCard({
  punter, isFav, onToggleFav, viewMode,
}: {
  punter: Punter; isFav: boolean; onToggleFav: () => void; viewMode: "grid" | "list";
}) {
  const [showCodes, setShowCodes] = useState(false);
  const codes = punter.betting_codes ?? [];
  const navigate = useNavigate();

  const handleCopyAll = () => {
    const pending = codes.filter(c => c.status === "pending");
    const text = pending.map(c => c.code).join("\n");
    if (text) navigator.clipboard.writeText(text);
  };

  const pendingCount = codes.filter(c => c.status === "pending").length;

  if (viewMode === "list") {
    // Compact list row
    return (
      <div
        className="card"
        style={{
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
          cursor: "pointer",
        }}
        onClick={() => navigate(`/punters/${punter.id}`)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <User size={16} color="var(--brand)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700,
              color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{punter.name}</p>
            {punter.verified && <Award size={12} color="var(--brand)" />}
            <StreakBadge punter={punter} />
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
            {codes.length} codes · {punter.success_rate?.toFixed(1) ?? 0}% win
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
            color: (punter.success_rate ?? 0) >= 50 ? "var(--green)" : "var(--text-3)",
          }}>{punter.total_won ?? 0}W-{punter.total_lost ?? 0}L</span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: isFav ? "var(--brand)" : "var(--text-3)" }}
          >
            <Star size={14} fill={isFav ? "var(--brand)" : "none"} />
          </button>
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <div className="card" style={{
      padding: "20px",
      display: "flex", flexDirection: "column", gap: 14,
      borderTop: punter.verified ? "2px solid var(--brand)" : undefined,
      transition: "border-color 200ms ease, box-shadow 200ms ease",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, cursor: "pointer",
          }}
          onClick={() => navigate(`/punters/${punter.id}`)}
        >
          <User size={22} color="var(--brand)" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <p
              style={{
                fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700,
                color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden",
                textOverflow: "ellipsis", cursor: "pointer",
              }}
              onClick={() => navigate(`/punters/${punter.id}`)}
            >{punter.name}</p>
            {punter.verified && <Award size={14} color="var(--brand)" style={{ flexShrink: 0 }} />}
            <StreakBadge punter={punter} />
          </div>
          {punter.nickname && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>
              @{punter.nickname}
            </p>
          )}
        </div>

        <button
          onClick={onToggleFav}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: isFav ? "var(--brand)" : "var(--text-3)",
          }}
        >
          <Star size={16} fill={isFav ? "var(--brand)" : "none"} />
        </button>
      </div>

      {/* Info tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
          background: "var(--surface-2)", padding: "3px 10px", borderRadius: 6,
        }}>
          <MapPin size={11} /> {punter.country}
        </span>
        {punter.specialty && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontFamily: "var(--font-body)", fontSize: 11, color: "var(--brand)",
            background: "rgba(59,130,246,0.08)", padding: "3px 10px", borderRadius: 6,
          }}>
            <TrendingUp size={11} /> {punter.specialty}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={{
        display: "flex", gap: 8, padding: "10px 0",
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      }}>
        <StatPill label="Success" value={punter.success_rate ? `${punter.success_rate.toFixed(1)}%` : "—"} color="var(--green)" />
        <StatPill label="Codes" value={String(punter.popularity ?? 0)} color="var(--brand)" />
        <StatPill label="Won" value={String(punter.total_won ?? 0)} color="var(--green)" />
        <StatPill label="Lost" value={String(punter.total_lost ?? 0)} color="var(--red)" />
      </div>

      {/* Betting codes section */}
      {codes.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setShowCodes(!showCodes)}
              style={{
                display: "flex", alignItems: "center", gap: 6, flex: 1,
                padding: "8px 0", background: "none", border: "none",
                cursor: "pointer", color: "var(--text-2)",
                fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              }}
            >
              <span>{codes.length} Betting Code{codes.length !== 1 ? "s" : ""}</span>
              {showCodes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {pendingCount > 0 && (
              <button
                onClick={handleCopyAll}
                title="Copy all pending codes"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  fontFamily: "var(--font-mono)", cursor: "pointer",
                  background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
                  color: "var(--brand)",
                }}
              >
                <Copy size={10} /> Copy All ({pendingCount})
              </button>
            )}
          </div>
          {showCodes && (
            <div style={{ padding: "0 0 4px" }}>
              {codes.map(c => <CodeRow key={c.id} code={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Today's Codes Section ──────────────────────────────────
function TodaysCodes({ punters }: { punters: Punter[] }) {
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();
  const today = new Date().toISOString().slice(0, 10);
  const todayCodes: (BettingCode & { punter_name_display: string })[] = [];

  for (const p of punters) {
    for (const c of p.betting_codes ?? []) {
      if (c.created_at && c.created_at.slice(0, 10) === today) {
        todayCodes.push({ ...c, punter_name_display: p.name });
      }
    }
  }

  if (todayCodes.length === 0) return null;

  // Sort newest first
  todayCodes.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  return (
    <div className="card" style={{
      padding: "20px",
      borderTop: "2px solid rgba(34,197,94,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Zap size={16} color="var(--green)" />
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
          Today's Codes
        </h3>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
          background: "rgba(34,197,94,0.12)", color: "var(--green)",
          padding: "2px 8px", borderRadius: 4,
        }}>{todayCodes.length}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {todayCodes.map(c => (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 0", borderBottom: "1px solid var(--border)",
          }}>
            <StatusBadge status={c.status} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
              color: "var(--brand)",
            }}>{c.code}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", flex: 1,
            }}>
              by <strong style={{ color: "var(--text-2)" }}>{c.punter_name_display}</strong>
              {c.bookmaker_name && <>{" · "}<BookmakerBadge name={c.bookmaker_name} /></>}
            </span>
            {c.odds && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                color: "var(--text-2)", background: "var(--surface-2)",
                padding: "2px 6px", borderRadius: 4,
              }}>
                {fmtOdds(c.odds)}{oddsSuffix}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leaderboard View ───────────────────────────────────────
function LeaderboardTable({ punters }: { punters: Punter[] }) {
  const sorted = [...punters].sort((a, b) => {
    const rateA = a.success_rate ?? 0;
    const rateB = b.success_rate ?? 0;
    if (rateB !== rateA) return rateB - rateA;
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });

  const medals = ["#1", "#2", "#3"];
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "36px 1fr 70px 70px 70px 70px",
        padding: "8px 12px", gap: 8,
        borderBottom: "1px solid var(--border)",
      }}>
        {["#", "Punter", "Rate", "Won", "Lost", "Codes"].map(h => (
          <p key={h} style={{
            fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700,
            color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>{h}</p>
        ))}
      </div>

      {sorted.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "grid", gridTemplateColumns: "36px 1fr 70px 70px 70px 70px",
            padding: "10px 12px", gap: 8, alignItems: "center",
            borderBottom: "1px solid var(--border)",
            cursor: "pointer",
            background: i < 3 ? "rgba(59,130,246,0.03)" : "transparent",
          }}
          onClick={() => navigate(`/punters/${p.id}`)}
        >
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
            color: i < 3 ? "var(--brand)" : "var(--text-3)",
          }}>{i < 3 ? medals[i] : `#${i + 1}`}</span>

          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
              color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{p.name}</p>
            {p.verified && <Award size={11} color="var(--brand)" />}
            <StreakBadge punter={p} />
          </div>

          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
            color: (p.success_rate ?? 0) >= 50 ? "var(--green)" : "var(--text-3)",
          }}>{p.success_rate?.toFixed(1) ?? "0.0"}%</span>

          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--green)" }}>
            {p.total_won ?? 0}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)" }}>
            {p.total_lost ?? 0}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>
            {p.popularity ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Telegram Guide ─────────────────────────────────────────
function TelegramGuide() {
  const steps = [
    { icon: <Bot size={18} color="var(--brand)" />, title: "1. Set up the Telegram Bot", body: "Create a bot with @BotFather. Set TELEGRAM_BOT_TOKEN in your backend .env file." },
    { icon: <MessageCircle size={18} color="var(--blue)" />, title: "2. Add bot to your group", body: "Add the bot to your group. Set TELEGRAM_GROUP_ID in .env." },
    { icon: <Send size={18} color="var(--green)" />, title: "3. Post betting codes", body: "Post codes with punter name, code, odds, and bookmaker. Supports multiple codes per message." },
    { icon: <Hash size={18} color="var(--purple)" />, title: "4. Update results", body: 'Reply to any code message with "Won" or "Lost" to update its status. Stats recalculate automatically.' },
  ];

  return (
    <div className="card" style={{ padding: "24px", borderTop: "2px solid rgba(96,165,250,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Send size={17} color="var(--blue)" />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>How to Add Punters via Telegram</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            Punters are added automatically when codes are posted in your Telegram group
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            padding: "14px 16px", borderRadius: 10,
            background: "var(--surface-2)", border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {step.icon}
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{step.title}</p>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>{step.body}</p>
          </div>
        ))}
      </div>

      {/* Code format examples */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {/* Single code */}
        <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 10 }}>
            Single Code
          </p>
          <pre style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
{`Punter: King Jamz
Code: ABC123
Odds: 5.50
Bookmaker: Sportybet`}
          </pre>
        </div>

        {/* Multiple codes */}
        <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 10 }}>
            Multiple Codes
          </p>
          <pre style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
{`Punter: King Jamz
Code: ABC123
Odds: 5.50
Bookmaker: Sportybet

Code: DEF456
Odds: 3.20
Bookmaker: Bet9ja`}
          </pre>
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 14, lineHeight: 1.6 }}>
        All codes need <strong style={{ color: "var(--text-2)" }}>Punter</strong>,{" "}
        <strong style={{ color: "var(--text-2)" }}>Code</strong>,{" "}
        <strong style={{ color: "var(--text-2)" }}>Odds</strong>, and{" "}
        <strong style={{ color: "var(--text-2)" }}>Bookmaker</strong>.
        Date is saved automatically. Reply "Won" or "Lost" to update a code's status.
      </p>

      {/* Bot commands */}
      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
          Bot Commands
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 4 }}>
          {[
            ["/stats <name>", "Punter performance"],
            ["/leaderboard", "Top punters"],
            ["/today", "All codes posted today"],
            ["/verify <name>", "Verify a punter (admin)"],
            ["/delete <code>", "Remove a code (admin)"],
          ].map(([cmd, desc]) => (
            <div key={cmd} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brand)", whiteSpace: "nowrap" }}>{cmd}</code>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function PuntersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [punters, setPunters] = useState<Punter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [favIds, setFavIds] = useState<number[]>([]);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popularity" | "success_rate" | "name">("popularity");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "leaderboard">("grid");
  const [bookmakerFilter, setBookmakerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "won" | "lost">("");
  const [showFilters, setShowFilters] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const perPage = 12;

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("favoritePunters");
      if (raw) setFavIds(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const toggleFav = useCallback((id: number) => {
    setFavIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("favoritePunters", JSON.stringify(next));
      return next;
    });
  }, []);

  // Fetch punters
  const fetchPunters = useCallback(async (p: number, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await getPuntersList(perPage, (p - 1) * perPage);
      setPunters(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load punters");
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  useEffect(() => { fetchPunters(page); }, [page, fetchPunters]);

  // Auto-refresh
  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      fetchPunters(page, true);
    }, AUTO_REFRESH_MS);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [page, fetchPunters]);

  // Collect unique bookmakers for filter
  const allBookmakers = Array.from(new Set(
    punters.flatMap(p => (p.betting_codes ?? []).map(c => c.bookmaker_name).filter(Boolean))
  )) as string[];

  // Client-side filter + sort
  const filtered = punters
    .filter(p => {
      if (showFavsOnly && !favIds.includes(p.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(
          p.name.toLowerCase().includes(q) ||
          (p.nickname?.toLowerCase().includes(q)) ||
          p.country.toLowerCase().includes(q) ||
          (p.specialty?.toLowerCase().includes(q))
        )) return false;
      }
      if (bookmakerFilter) {
        const hasBm = (p.betting_codes ?? []).some(c => c.bookmaker_name === bookmakerFilter);
        if (!hasBm) return false;
      }
      if (statusFilter) {
        const hasStatus = (p.betting_codes ?? []).some(c => c.status === statusFilter);
        if (!hasStatus) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "popularity") return (b.popularity ?? 0) - (a.popularity ?? 0);
      if (sortBy === "success_rate") return (b.success_rate ?? 0) - (a.success_rate ?? 0);
      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.ceil(total / perPage);
  const hasActiveFilters = search || showFavsOnly || bookmakerFilter || statusFilter;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SEO title="Expert Punters" description="Follow top Nigerian betting experts. Copy their codes for Sportybet, Bet9ja, 1xBet, and more." path="/punters" />

      {/* Page header */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={14} color="var(--brand)" />
          Expert Network
        </div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 10 }}>
          Expert <span className="text-brand-gradient">Punters</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", maxWidth: 480, lineHeight: 1.7 }}>
          Discover and follow verified betting experts. Codes refresh every 60 seconds.
        </p>
      </div>

      {/* Today's codes */}
      {!loading && <TodaysCodes punters={punters} />}

      {/* Controls bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 320 }}>
          <Search size={14} color="var(--text-3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search punters..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--surface-2)",
              fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-1)",
              outline: "none",
            }}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{
            padding: "9px 12px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--surface-2)",
            fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-1)",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="popularity">Sort: Popularity</option>
          <option value="success_rate">Sort: Success Rate</option>
          <option value="name">Sort: Name</option>
        </select>

        {/* View mode toggles */}
        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
          {([
            { mode: "grid" as const, icon: <Grid size={14} /> },
            { mode: "list" as const, icon: <List size={14} /> },
            { mode: "leaderboard" as const, icon: <BarChart2 size={14} /> },
          ]).map(({ mode, icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, border: "none", cursor: "pointer",
                background: viewMode === mode ? "rgba(59,130,246,0.12)" : "var(--surface-2)",
                color: viewMode === mode ? "var(--brand)" : "var(--text-3)",
              }}
              title={mode}
            >{icon}</button>
          ))}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 14px", borderRadius: 8, cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
            border: hasActiveFilters ? "1px solid var(--brand)" : "1px solid var(--border)",
            background: hasActiveFilters ? "rgba(59,130,246,0.10)" : "var(--surface-2)",
            color: hasActiveFilters ? "var(--brand)" : "var(--text-2)",
          }}
        >
          <Filter size={13} />
          Filters
          {hasActiveFilters && (
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--brand)", flexShrink: 0,
            }} />
          )}
        </button>

        {/* Favs toggle */}
        <button
          onClick={() => setShowFavsOnly(!showFavsOnly)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 14px", borderRadius: 8, cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
            border: showFavsOnly ? "1px solid var(--brand)" : "1px solid var(--border)",
            background: showFavsOnly ? "rgba(59,130,246,0.10)" : "var(--surface-2)",
            color: showFavsOnly ? "var(--brand)" : "var(--text-2)",
          }}
        >
          <Star size={13} fill={showFavsOnly ? "var(--brand)" : "none"} />
          Favorites
        </button>

        {/* Refresh */}
        <button
          onClick={() => fetchPunters(page)}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 8,
            border: "1px solid var(--border)", background: "transparent",
            cursor: loading ? "wait" : "pointer", color: "var(--text-3)",
          }}
          title="Refresh"
        >
          <RefreshCw size={14} style={loading ? { animation: "spin 0.7s linear infinite" } : undefined} />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card" style={{
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          {/* Bookmaker filter */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Bookmaker
            </p>
            <select
              value={bookmakerFilter}
              onChange={e => setBookmakerFilter(e.target.value)}
              style={{
                padding: "7px 10px", borderRadius: 6,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-1)",
                cursor: "pointer", outline: "none",
              }}
            >
              <option value="">All Bookmakers</option>
              {allBookmakers.map(bm => <option key={bm} value={bm}>{bm}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Code Status
            </p>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                padding: "7px 10px", borderRadius: 6,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-1)",
                cursor: "pointer", outline: "none",
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setShowFavsOnly(false); setBookmakerFilter(""); setStatusFilter(""); }}
              style={{
                padding: "7px 14px", borderRadius: 6, cursor: "pointer",
                border: "1px solid var(--border)", background: "transparent",
                fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                color: "var(--text-3)", marginTop: 16,
              }}
            >Clear All Filters</button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: "var(--radius-md)",
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          fontFamily: "var(--font-body)", fontSize: 13, color: "var(--red)",
        }}>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <BrandLoader message="Rounding up the punters...">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 14 }} />
            ))}
          </div>
        </BrandLoader>
      ) : viewMode === "leaderboard" ? (
        filtered.length > 0 ? (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <LeaderboardTable punters={filtered} />
          </div>
        ) : (
          <EmptyState search={search} showFavsOnly={showFavsOnly} onClear={() => { setSearch(""); setShowFavsOnly(false); setBookmakerFilter(""); setStatusFilter(""); }} />
        )
      ) : filtered.length > 0 ? (
        <>
          <div style={viewMode === "grid" ? {
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16,
          } : {
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {filtered.map(p => (
              <PunterCard
                key={p.id}
                punter={p}
                isFav={favIds.includes(p.id)}
                onToggleFav={() => toggleFav(p.id)}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 0", borderTop: "1px solid var(--border)",
            }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border)", background: "transparent",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    color: page === 1 ? "var(--text-3)" : "var(--text-1)",
                    opacity: page === 1 ? 0.4 : 1,
                  }}
                ><ChevronLeft size={14} /></button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let num: number;
                  if (totalPages <= 5) num = i + 1;
                  else if (page <= 3) num = i + 1;
                  else if (page >= totalPages - 2) num = totalPages - 4 + i;
                  else num = page - 2 + i;
                  return (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                        border: page === num ? "1px solid var(--brand)" : "1px solid var(--border)",
                        background: page === num ? "rgba(59,130,246,0.12)" : "transparent",
                        color: page === num ? "var(--brand)" : "var(--text-2)",
                        cursor: "pointer",
                      }}
                    >{num}</button>
                  );
                })}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border)", background: "transparent",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    color: page === totalPages ? "var(--text-3)" : "var(--text-1)",
                    opacity: page === totalPages ? 0.4 : 1,
                  }}
                ><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState search={search} showFavsOnly={showFavsOnly} onClear={() => { setSearch(""); setShowFavsOnly(false); setBookmakerFilter(""); setStatusFilter(""); }} />
      )}


      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────
function EmptyState({ search, showFavsOnly, onClear }: { search: string; showFavsOnly: boolean; onClear: () => void }) {
  const hasFilters = search || showFavsOnly;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 20px", textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
      }}>
        <Users size={32} color="var(--brand)" />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        {hasFilters ? "No punters match your filters" : "No Punters Yet"}
      </h3>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)",
        maxWidth: 420, lineHeight: 1.7, marginBottom: 20,
      }}>
        {hasFilters
          ? "Try adjusting your search or clearing filters."
          : "Expert punters will appear here once they start sharing betting codes via the Telegram bot."
        }
      </p>
      {hasFilters && (
        <button onClick={onClear} style={{
          padding: "9px 20px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--surface-2)",
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
          color: "var(--text-1)", cursor: "pointer",
        }}>Clear Filters</button>
      )}
    </div>
  );
}
