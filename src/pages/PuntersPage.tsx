import React, { useEffect, useState, useCallback } from "react";
import {
  Users, Search, Star, RefreshCw, Award, MapPin,
  TrendingUp, User, ExternalLink, ChevronLeft, ChevronRight,
  MessageCircle, Send, Bot, Hash, ChevronDown, ChevronUp,
  Clock, CheckCircle, XCircle, Copy
} from "lucide-react";
import { getPuntersList, type Punter } from "../services/punterService";
import type { BettingCode } from "../types";

// ── Stat Pill ───────────────────────────────────────────
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

// ── Betting Code Row ────────────────────────────────────
function CodeRow({ code }: { code: BettingCode }) {
  const [copied, setCopied] = useState(false);
  const statusColor = code.status === "won" ? "var(--green)"
    : code.status === "lost" ? "var(--red)" : "var(--text-3)";
  const StatusIcon = code.status === "won" ? CheckCircle
    : code.status === "lost" ? XCircle : Clock;

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
      <StatusIcon size={13} color={statusColor} style={{ flexShrink: 0 }} />
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
      <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", flex: 1, textAlign: "right" }}>
        {code.bookmaker_name ?? "—"}
      </span>
      {code.odds && (
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
          color: "var(--text-2)", background: "var(--surface-2)",
          padding: "2px 6px", borderRadius: 4,
        }}>
          {code.odds.toFixed(2)}x
        </span>
      )}
    </div>
  );
}

// ── Punter Card ─────────────────────────────────────────
function PunterCard({
  punter, isFav, onToggleFav,
}: {
  punter: Punter; isFav: boolean; onToggleFav: () => void;
}) {
  const [showCodes, setShowCodes] = useState(false);
  const codes = punter.betting_codes ?? [];
  return (
    <div className="card" style={{
      padding: "20px",
      display: "flex", flexDirection: "column", gap: 14,
      borderTop: punter.verified ? "2px solid var(--brand)" : undefined,
      transition: "border-color 200ms ease, box-shadow 200ms ease",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
        }}>
          {punter.image_url ? (
            <img
              src={punter.image_url} alt={punter.name}
              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 12 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <User size={22} color="var(--brand)" />
          )}
        </div>

        {/* Name + badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700,
              color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{punter.name}</p>
            {punter.verified && (
              <Award size={14} color="var(--brand)" style={{ flexShrink: 0 }} />
            )}
          </div>
          {punter.nickname && (
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginTop: 1,
            }}>@{punter.nickname}</p>
          )}
        </div>

        {/* Fav star */}
        <button
          onClick={onToggleFav}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: isFav ? "var(--brand)" : "var(--text-3)",
            transition: "color 180ms ease",
          }}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
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
            background: "rgba(245,158,11,0.08)", padding: "3px 10px", borderRadius: 6,
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
        <StatPill
          label="Success"
          value={punter.success_rate ? `${punter.success_rate.toFixed(1)}%` : "—"}
          color="var(--green)"
        />
        <StatPill
          label="Codes"
          value={String(punter.popularity ?? 0)}
          color="var(--brand)"
        />
        <StatPill
          label="Won"
          value={String(punter.total_won ?? 0)}
          color="var(--green)"
        />
        <StatPill
          label="Lost"
          value={String(punter.total_lost ?? 0)}
          color="var(--red)"
        />
      </div>

      {/* Bio */}
      {punter.bio && (
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)",
          lineHeight: 1.6, display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{punter.bio}</p>
      )}

      {/* Social links */}
      {punter.social_media && Object.keys(punter.social_media).length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(punter.social_media).map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
                textDecoration: "none", padding: "4px 10px", borderRadius: 6,
                background: "var(--surface-2)", transition: "color 180ms ease",
              }}
            >
              <ExternalLink size={11} /> {platform}
            </a>
          ))}
        </div>
      )}

      {/* Betting codes section */}
      {codes.length > 0 && (
        <div>
          <button
            onClick={() => setShowCodes(!showCodes)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "8px 0", background: "none", border: "none",
              cursor: "pointer", color: "var(--text-2)",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
            }}
          >
            <span>{codes.length} Betting Code{codes.length !== 1 ? "s" : ""}</span>
            {showCodes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
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

// ── Telegram Guide ──────────────────────────────────────
function TelegramGuide() {
  const steps = [
    {
      icon: <Bot size={18} color="var(--brand)" />,
      title: "1. Set up the Telegram Bot",
      body: "Create a bot with @BotFather on Telegram. Set TELEGRAM_BOT_TOKEN in your backend .env file.",
    },
    {
      icon: <MessageCircle size={18} color="var(--blue)" />,
      title: "2. Add bot to your group",
      body: "Add the bot to your Telegram group. Set TELEGRAM_GROUP_ID in .env to restrict it to that group.",
    },
    {
      icon: <Send size={18} color="var(--green)" />,
      title: "3. Post betting codes",
      body: "Members post codes in the format shown below. The bot parses them and saves punter + code to the database automatically.",
    },
    {
      icon: <Hash size={18} color="var(--purple)" />,
      title: "4. Punters appear here",
      body: "Each Telegram user who posts a code becomes a punter on this page. Stats update as their codes are resolved.",
    },
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
            Punters are added automatically when they post betting codes in your Telegram group
          </p>
        </div>
      </div>

      {/* Steps */}
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

      {/* Code format */}
      <div style={{
        padding: "16px 20px", borderRadius: 10,
        background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)",
      }}>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--brand)", marginBottom: 10,
        }}>Message Format</p>
        <pre style={{
          fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)",
          lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap",
        }}>
{`Code: ABC123
Odds: 5.50
Bookmaker: Bet365
Date: 26/05/2026  (optional)
Time: 19:30        (optional)`}
        </pre>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
          marginTop: 12, lineHeight: 1.6,
        }}>
          The bot requires <strong style={{ color: "var(--text-2)" }}>Code</strong>,{" "}
          <strong style={{ color: "var(--text-2)" }}>Odds</strong>, and{" "}
          <strong style={{ color: "var(--text-2)" }}>Bookmaker</strong>. Date and Time are optional.
          The sender's Telegram name becomes the punter name.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────
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
  const fetchPunters = useCallback(async (p: number) => {
    setLoading(true);
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

  // Client-side filter + sort
  const filtered = punters
    .filter(p => {
      if (showFavsOnly && !favIds.includes(p.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.nickname?.toLowerCase().includes(q)) ||
          p.country.toLowerCase().includes(q) ||
          (p.specialty?.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "popularity") return (b.popularity ?? 0) - (a.popularity ?? 0);
      if (sortBy === "success_rate") return (b.success_rate ?? 0) - (a.success_rate ?? 0);
      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.ceil(total / perPage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

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
          Discover and follow verified betting experts. Punters are added via our Telegram bot.
        </p>
      </div>

      {/* Controls bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{
          position: "relative", flex: "1 1 200px", maxWidth: 320,
        }}>
          <Search size={14} color="var(--text-3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search punters…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--surface-2)",
              fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-1)",
              outline: "none", transition: "border-color 180ms ease",
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

        {/* Favs toggle */}
        <button
          onClick={() => setShowFavsOnly(!showFavsOnly)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 14px", borderRadius: 8, cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
            border: showFavsOnly ? "1px solid var(--brand)" : "1px solid var(--border)",
            background: showFavsOnly ? "rgba(245,158,11,0.10)" : "var(--surface-2)",
            color: showFavsOnly ? "var(--brand)" : "var(--text-2)",
            transition: "all 180ms ease",
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
            transition: "all 180ms ease",
          }}
          title="Refresh"
        >
          <RefreshCw size={14} style={loading ? { animation: "spin 0.7s linear infinite" } : undefined} />
        </button>
      </div>

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
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16,
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, height: 220 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "var(--surface-2)", animation: "pulse 1.5s ease infinite",
              }} />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          {/* Punter cards grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16,
          }}>
            {filtered.map(p => (
              <PunterCard
                key={p.id}
                punter={p}
                isFav={favIds.includes(p.id)}
                onToggleFav={() => toggleFav(p.id)}
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
                        background: page === num ? "rgba(245,158,11,0.12)" : "transparent",
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
        /* Empty state */
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "48px 20px", textAlign: "center",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Users size={32} color="var(--brand)" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {search || showFavsOnly ? "No punters match your filters" : "No Punters Yet"}
          </h3>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)",
            maxWidth: 420, lineHeight: 1.7, marginBottom: 20,
          }}>
            {search || showFavsOnly
              ? "Try adjusting your search or clearing filters."
              : "Expert punters will appear here once they start sharing betting codes via the Telegram bot."
            }
          </p>
          {(search || showFavsOnly) && (
            <button
              onClick={() => { setSearch(""); setShowFavsOnly(false); }}
              style={{
                padding: "9px 20px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                color: "var(--text-1)", cursor: "pointer",
              }}
            >Clear Filters</button>
          )}
        </div>
      )}

      {/* Telegram setup guide */}
      <TelegramGuide />

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  );
}
