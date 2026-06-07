import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User, Award, MapPin, TrendingUp, Star, ChevronLeft,
  Clock, CheckCircle, XCircle, Copy, Flame, Calendar,
  ExternalLink, RefreshCw
} from "lucide-react";
import { getPuntersList, type Punter } from "../services/punterService";
import type { BettingCode } from "../types";

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

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    won: { bg: "rgba(34,197,94,0.12)", color: "var(--green)", label: "Won" },
    lost: { bg: "rgba(248,113,113,0.12)", color: "var(--red)", label: "Lost" },
    pending: { bg: "rgba(255,255,255,0.06)", color: "var(--text-3)", label: "Pending" },
  };
  const c = config[status] || config.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
      fontFamily: "var(--font-mono)", background: c.bg, color: c.color,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: "16px 20px", flex: "1 1 120px", minWidth: 120 }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function PunterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [punter, setPunter] = useState<Punter | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "won" | "lost">("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchPunter = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all punters and find by ID (API doesn't have single punter endpoint with codes)
      const res = await getPuntersList(200, 0);
      const found = res.items.find(p => p.id === Number(id));
      setPunter(found ?? null);
    } catch {
      setPunter(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPunter(); }, [fetchPunter]);

  const handleCopy = (code: string, codeId: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(codeId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleCopyAll = () => {
    if (!punter) return;
    const pending = (punter.betting_codes ?? []).filter(c => c.status === "pending");
    const text = pending.map(c => c.code).join("\n");
    if (text) navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <button onClick={() => navigate("/punters")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontFamily: "var(--font-body)", fontSize: 13 }}>
          <ChevronLeft size={14} /> Back to Punters
        </button>
        <div className="card" style={{ padding: 40, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--surface-2)", animation: "pulse 1.5s ease infinite" }} />
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
      </div>
    );
  }

  if (!punter) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", padding: "60px 20px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-3)" }}>Punter not found</p>
        <button onClick={() => navigate("/punters")} style={{
          padding: "9px 20px", borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: 13,
          fontWeight: 600, color: "var(--text-1)", cursor: "pointer",
        }}>Back to Punters</button>
      </div>
    );
  }

  const codes = punter.betting_codes ?? [];
  const filteredCodes = statusFilter ? codes.filter(c => c.status === statusFilter) : codes;
  const pendingCount = codes.filter(c => c.status === "pending").length;
  const wonCount = punter.total_won ?? 0;
  const lostCount = punter.total_lost ?? 0;
  const totalResolved = wonCount + lostCount;

  // Calculate streak
  const resolved = codes
    .filter(c => c.status === "won" || c.status === "lost")
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  let streak = 0;
  let streakType = "";
  if (resolved.length > 0) {
    streakType = resolved[0].status;
    streak = 1;
    for (let i = 1; i < resolved.length; i++) {
      if (resolved[i].status === streakType) streak++;
      else break;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Back button */}
      <button onClick={() => navigate("/punters")} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-3)", fontFamily: "var(--font-body)", fontSize: 13,
        padding: 0, alignSelf: "flex-start",
      }}>
        <ChevronLeft size={14} /> Back to Punters
      </button>

      {/* Profile header */}
      <div className="card" style={{
        padding: "24px",
        borderTop: punter.verified ? "2px solid var(--brand)" : undefined,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <User size={28} color="var(--brand)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)" }}>{punter.name}</h1>
              {punter.verified && <Award size={18} color="var(--brand)" />}
              {streak >= 2 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  background: streakType === "won" ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)",
                  color: streakType === "won" ? "var(--green)" : "var(--red)",
                }}>
                  <Flame size={12} /> {streak}{streakType === "won" ? "W" : "L"} streak
                </span>
              )}
            </div>
            {punter.nickname && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
                @{punter.nickname}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
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
              {punter.created_at && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
                  background: "var(--surface-2)", padding: "3px 10px", borderRadius: 6,
                }}>
                  <Calendar size={11} /> Joined {new Date(punter.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {punter.bio && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 16 }}>
            {punter.bio}
          </p>
        )}

        {/* Social links */}
        {punter.social_media && Object.keys(punter.social_media).length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(punter.social_media).map(([platform, url]) => (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
                textDecoration: "none", padding: "4px 10px", borderRadius: 6,
                background: "var(--surface-2)",
              }}>
                <ExternalLink size={11} /> {platform}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard
          label="Success Rate"
          value={punter.success_rate ? `${punter.success_rate.toFixed(1)}%` : "—"}
          color={(punter.success_rate ?? 0) >= 50 ? "var(--green)" : "var(--text-2)"}
          sub={totalResolved > 0 ? `${totalResolved} resolved` : undefined}
        />
        <StatCard label="Won" value={String(wonCount)} color="var(--green)" />
        <StatCard label="Lost" value={String(lostCount)} color="var(--red)" />
        <StatCard label="Pending" value={String(pendingCount)} color="var(--brand)" />
        <StatCard label="Total Codes" value={String(codes.length)} color="var(--text-1)" />
      </div>

      {/* Betting codes */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
            Betting Codes ({filteredCodes.length})
          </h3>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                padding: "6px 10px", borderRadius: 6,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-1)",
                cursor: "pointer", outline: "none",
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>

            {/* Copy all pending */}
            {pendingCount > 0 && (
              <button onClick={handleCopyAll} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                fontFamily: "var(--font-mono)", cursor: "pointer",
                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
                color: "var(--brand)",
              }}>
                <Copy size={11} /> Copy All Pending ({pendingCount})
              </button>
            )}

            {/* Refresh */}
            <button onClick={fetchPunter} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 6,
              border: "1px solid var(--border)", background: "transparent",
              cursor: "pointer", color: "var(--text-3)",
            }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {filteredCodes.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", padding: "20px 0", textAlign: "center" }}>
            {statusFilter ? `No ${statusFilter} codes` : "No betting codes yet"}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredCodes.map(c => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 0", borderBottom: "1px solid var(--border)",
              }}>
                <StatusBadge status={c.status} />
                <button
                  onClick={() => handleCopy(c.code, c.id)}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700,
                    color: "var(--brand)", background: "none", border: "none",
                    cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {c.code}
                  <Copy size={11} color={copiedId === c.id ? "var(--green)" : "var(--text-3)"} />
                </button>
                <span style={{ flex: 1 }}>
                  {c.bookmaker_name ? <BookmakerBadge name={c.bookmaker_name} /> : "—"}
                </span>
                {c.odds && (
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                    color: "var(--text-2)", background: "var(--surface-2)",
                    padding: "3px 8px", borderRadius: 4,
                  }}>
                    {c.odds.toFixed(2)}x
                  </span>
                )}
                {c.created_at && (
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>
                    {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  );
}
