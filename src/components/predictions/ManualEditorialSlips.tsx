import React from "react";
import { ClipboardCheck, ExternalLink } from "lucide-react";
import { getManualEditorial } from "../../api/manualEditorial";

type ManualLeg = {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  market: string;
  kickoff: string;
  odds?: number;
};

type ManualSlip = {
  slip_id: string;
  tier: string;
  status: "BOOKED" | "RESEARCH";
  date: string;
  note: string;
  legs: ManualLeg[];
  manual_editorial: true;
  not_model_verified: true;
  actual_odds: number | null;
  booking?: { actionable?: boolean; share_url?: string; share_code?: string; };
};

type Feed = {
  status: string;
  date: string;
  manual_editorial: boolean;
  slips: ManualSlip[];
};

const label = (tier: string) => ({
  banker: "Banker", "2_odds": "2 Odds", "5_odds": "5 Odds",
  "10_odds": "10 Odds", over_1_5: "Over 1.5",
}[tier] ?? tier.replaceAll("_", " "));

/** An optional, separate editorial feed. Never counted as model predictions. */
export function ManualEditorialSlips() {
  const [data, setData] = React.useState<Feed | null>(null);
  React.useEffect(() => {
    let active = true;
    getManualEditorial<Feed>()
      .then(value => { if (active) setData(value); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const slips = data?.status === "success" ? data.slips || [] : [];
  if (!slips.length) return null;

  return (
    <section className="card" style={{ padding: "20px", display: "grid", gap: 16 }}
      aria-label="Admin curated football selections">
      <div>
        <div className="eyebrow">Manual prediction desk</div>
        <h2 style={{ fontSize: 21, fontWeight: 800, margin: "5px 0 7px" }}>
          Today's editor-selected football picks
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
          Selected by an administrator, separately from BetSightly's statistical
          model and official results record. Editorial opinions carry no
          model-validated success probability or guarantee.
          Only full SportyBet-readback tickets receive a booking link.
        </p>
      </div>
      {slips.map(slip => {
        const booked = slip.status === "BOOKED"
          && slip.booking?.actionable === true
          && Boolean(slip.booking.share_code && slip.booking.share_url);
        return (
          <article key={slip.slip_id} style={{
            borderTop: "1px solid var(--border)", paddingTop: 14,
            display: "grid", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <strong style={{ fontSize: 15 }}>
                {label(slip.tier)} · {slip.legs.length} match{slip.legs.length === 1 ? "" : "es"}
              </strong>
              <span style={{ color: booked ? "var(--gold)" : "var(--text-3)",
                fontSize: 12, fontWeight: 700 }}>
                {booked ? "Complete code verified" : "Editorial research · no verified code"}
              </span>
            </div>
            {slip.legs.map((leg, i) => (
              <div key={leg.match_id || i} style={{ display: "flex",
                justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                fontSize: 13, color: "var(--text-2)" }}>
                <span>{leg.home_team} vs {leg.away_team}</span>
                <strong style={{ color: "var(--text-1)" }}>
                  {leg.market.replaceAll("_", " ")}
                  {booked && typeof leg.odds === "number" ? ` · ${leg.odds.toFixed(2)}x` : ""}
                </strong>
              </div>
            ))}
            {slip.note && (
              <p style={{ color: "var(--text-3)", fontSize: 12, margin: 0 }}>
                Editor's note: {slip.note}
              </p>
            )}
            {booked && (
              <a href={slip.booking!.share_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 7,
                  fontSize: 13, color: "var(--gold)", fontWeight: 700 }}>
                <ClipboardCheck size={16}/> Open verified SportyBet slip
                <ExternalLink size={13} />
              </a>
            )}
          </article>
        );
      })}
    </section>
  );
}
