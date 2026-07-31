import React, { useEffect, useState } from "react";
import { TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { usePredictions } from "../../hooks/usePredictions";
import { api } from "../../api/predictions";

/**
 * Compact accuracy badge for the homepage hero / about page.
 *
 * Sums settled slips across every category rather than the rollover chain
 * alone. The chain is one product of several, and a badge labelled "live
 * track record" that reports only its results misrepresents the site — most
 * visibly right after a chain has had a bad run.
 *
 * Falls back to the chain when no category slips have settled yet, and
 * renders nothing at all until something real exists to report.
 */
export function AccuracyBadge({ compact = false }: { compact?: boolean }) {
  const { data, loading } = usePredictions();
  const chain = data?.accumulators?.rollover?.chain ?? [];
  const [slipStats, setSlipStats] = useState<{ won: number; lost: number } | null>(null);

  useEffect(() => {
    let alive = true;
    api.getLeagueResults(60)
      .then(r => {
        if (!alive) return;
        const s = Object.values(r.summary ?? {});
        if (s.length) {
          setSlipStats({
            won: s.reduce((a, c) => a + c.won, 0),
            lost: s.reduce((a, c) => a + c.lost, 0),
          });
        }
      })
      .catch(() => { /* fall back to the chain below */ });
    return () => { alive = false; };
  }, []);

  const chainWon = chain.filter(d => d.status === "won").length;
  const chainLost = chain.filter(d => d.status === "lost").length;
  const pending = chain.filter(d => d.status === "pending").length;

  const won = slipStats ? slipStats.won + chainWon : chainWon;
  const lost = slipStats ? slipStats.lost + chainLost : chainLost;
  const resolved = won + lost;
  const rate = resolved > 0 ? Math.round((won / resolved) * 100) : null;

  // Nothing settled yet — say nothing rather than publish "0%"
  if (loading || resolved === 0) return null;

  const ratePos = rate !== null && rate >= 50;
  const color = rate === null ? "var(--text-2)" : ratePos ? "var(--green)" : "var(--text-1)";
  const bg = rate === null ? "var(--surface-2)"
    : ratePos ? "rgba(34,197,94,0.10)"
    : "rgba(59,130,246,0.08)";

  if (compact) {
    return (
      <Link to="/results" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 6, textDecoration: "none",
        background: bg, border: `1px solid ${ratePos ? "rgba(34,197,94,0.20)" : "var(--border)"}`,
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color,
      }}>
        <TrendingUp size={11} />
        {rate === null ? "Tracking" : `${rate}% accuracy`}
      </Link>
    );
  }

  return (
    <Link to="/results" style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 18px", borderRadius: 12, textDecoration: "none",
      background: bg, border: `1px solid ${ratePos ? "rgba(34,197,94,0.18)" : "var(--border)"}`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: ratePos ? "rgba(34,197,94,0.15)" : "var(--surface)",
        border: `1px solid ${ratePos ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {rate === null
          ? <Sparkles size={18} color="var(--text-2)" />
          : <TrendingUp size={18} color={color} />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Live track record
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color, marginTop: 2 }}>
          {rate === null
            ? `${pending} day${pending !== 1 ? "s" : ""} pending`
            : `${rate}% accuracy · ${won}W-${lost}L`}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
          {rate === null
            ? "Rollover starting — first results land soon"
            : `over ${resolved} settled slip${resolved !== 1 ? "s" : ""}`}
        </p>
      </div>
    </Link>
  );
}
