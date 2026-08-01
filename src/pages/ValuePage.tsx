import React, { useEffect, useState } from "react";
import { Scale, Info, Clock } from "lucide-react";
import { SEO } from "../components/common/SEO";
import { BrandLoader } from "../components/ui/BrandLoader";
import { useFormatOdds } from "../hooks/useFormatOdds";
import { api, type ValueBet, type ValueBetsResponse } from "../api/predictions";
import { teamInitials, teamColor } from "../data/wcFlags";

function Crest({ team, logo }: { team: string; logo?: string | null }) {
  if (logo) {
    return <img src={logo} alt="" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }}
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  return (
    <span style={{
      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
      background: teamColor(team), color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 800,
    }}>{teamInitials(team)}</span>
  );
}

const kickoffLabel = (iso: string) => {
  const d = new Date(iso);
  const mins = Math.round((d.getTime() - Date.now()) / 60000);
  if (mins < 0) return "started";
  if (mins < 60) return `in ${mins}m`;
  if (mins < 60 * 24) return `in ${Math.round(mins / 60)}h`;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

export default function ValuePage() {
  const [data, setData] = useState<ValueBetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatOdds: fmtOdds, oddsSuffix } = useFormatOdds();

  useEffect(() => {
    let alive = true;
    api.getValueBets(3)
      .then(r => { if (alive) setData(r); })
      .catch(() => { /* empty state below */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const bets: ValueBet[] = data?.value_bets ?? [];
  const anyPositive = (data?.positive_ev_count ?? 0) > 0;

  return (
    <div className="page-stack" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SEO
        title="Value Bets"
        description="Every pick ranked by how much of your stake the bookmaker keeps, with the fair price shown alongside the quoted one."
        path="/value"
      />

      <div>
        <div className="eyebrow" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <Scale size={14} color="var(--brand)" />
          Pricing
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.1 }}>
          Value <span className="text-brand-gradient">bets</span>
        </h1>
        <p className="page-intro" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", marginTop: 10, maxWidth: 620, lineHeight: 1.7 }}>
          Bets where one bookmaker is offering a better price than the rest of the market agrees is
          fair. We compare every book we can reach{data?.books_compared ? ` — up to ${data.books_compared} on a single match — ` : ", "}
          take the median of their de-vigged views as the true probability, and flag anyone pricing above it.
        </p>
      </div>

      {/* The framing still matters — the edges are real but thin and caveated. */}
      <div className="card" style={{
        padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start",
        borderLeft: `3px solid ${anyPositive ? "var(--green)" : "var(--gold)"}`,
      }}>
        <Info size={16} color={anyPositive ? "var(--green)" : "var(--gold)"} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
            {anyPositive
              ? `${data?.positive_ev_count} bet${data?.positive_ev_count === 1 ? "" : "s"} priced above fair value right now`
              : "Nothing is priced above fair value right now"}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7 }}>
            Sticking to one bookmaker, none of these would exist — a single book takes roughly 9% on
            these leagues, which no set of picks overcomes. Taken across the whole market the margin
            effectively disappears, and the edge is simply one book disagreeing with the other forty.
            {" "}
            <strong style={{ color: "var(--text-1)" }}>
              You have to place the bet at the book named on the row for the edge to exist.
            </strong>
            {" "}
            Two things to know: exchanges quote before commission, which takes 2–5% off a thin edge,
            and the best price on a market is often the one with the smallest maximum stake.
          </p>
        </div>
      </div>

      {loading ? (
        <BrandLoader message="Comparing prices...">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
          </div>
        </BrandLoader>
      ) : bets.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <Scale size={28} color="var(--text-3)" style={{ marginBottom: 12 }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", marginBottom: 4 }}>
            No quoted prices available right now
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)" }}>
            Prices appear a day or two before kickoff.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bets.map((b, i) => {
            const good = b.house_edge <= 4;
            return (
              <div key={`${b.match_id}-${b.market}-${i}`} className="card" style={{
                padding: "14px 16px",
                borderLeft: `3px solid ${b.positive_ev ? "var(--green)" : good ? "var(--brand)" : "var(--border)"}`,
                display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <Crest team={b.home_team} logo={b.home_team_logo} />
                  <Crest team={b.away_team} logo={b.away_team_logo} />
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                    {b.home_team} <span style={{ color: "var(--text-3)" }}>vs</span> {b.away_team}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                    {b.league}
                    <span style={{ opacity: 0.5 }}>·</span>
                    <Clock size={9} /> {kickoffLabel(b.kickoff)}
                  </p>
                </div>

                <div style={{ minWidth: 130 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 700, color: "var(--brand)" }}>
                    {b.prediction}
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>
                    {Math.round(b.confidence * 100)}% likely
                  </p>
                </div>

                <div style={{ textAlign: "right", minWidth: 74 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>
                    {fmtOdds(b.odds)}{oddsSuffix}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                    quoted
                  </p>
                </div>

                <div style={{ textAlign: "right", minWidth: 74 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "var(--text-3)", lineHeight: 1 }}>
                    {b.fair_odds ? `${fmtOdds(b.fair_odds)}${oddsSuffix}` : "—"}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                    fair price
                  </p>
                </div>

                {/* Where to place it. Without the book the edge is unusable. */}
                {b.odds_provider && (
                  <div style={{ minWidth: 108 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                      {b.odds_provider}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 9.5, color: "var(--text-3)", marginTop: 2 }}>
                      best of {b.book_count ?? "?"} books
                      {b.is_exchange ? " · pre-commission" : ""}
                    </p>
                  </div>
                )}

                <div style={{
                  minWidth: 76, textAlign: "right",
                  padding: "5px 10px", borderRadius: 7,
                  background: b.positive_ev ? "rgba(16,185,129,0.12)" : good ? "var(--surface-2)" : "var(--overlay-2)",
                }}>
                  <p style={{
                    fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 800, lineHeight: 1,
                    color: b.positive_ev ? "var(--green)" : good ? "var(--text-1)" : "var(--text-3)",
                  }}>
                    {b.positive_ev ? `+${(b.expected_value * 100).toFixed(1)}%` : `${b.house_edge.toFixed(1)}%`}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 9.5, color: "var(--text-3)", marginTop: 3 }}>
                    {b.positive_ev ? "your edge" : "book keeps"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
