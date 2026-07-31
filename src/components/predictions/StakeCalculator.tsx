import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { useFormatOdds } from "../../hooks/useFormatOdds";

/**
 * Stake input with the returns worked out alongside.
 *
 * Deliberately shows the expected return next to the potential one. A slip
 * paying 8x looks like the better bet until you see that it lands 9% of the
 * time, at which point staking on it is plainly worse than the 2x that lands
 * half the time. Showing only the payout would hide exactly the number that
 * decides whether a bet is worth placing.
 */
export function StakeCalculator({
  totalOdds,
  hitProbability,
  color,
}: {
  totalOdds: number;
  hitProbability?: number;
  color: string;
}) {
  const [stake, setStake] = useState<string>("10");
  const { oddsSuffix } = useFormatOdds();

  const amount = Math.max(0, parseFloat(stake) || 0);
  const potential = amount * totalOdds;
  const profit = potential - amount;
  // Long-run value per stake, not the headline payout
  const expected = hitProbability != null ? potential * hitProbability : null;
  const edge = expected != null && amount > 0 ? expected - amount : null;

  return (
    <div className="card" style={{ padding: "16px 18px", borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Calculator size={14} color={color} />
        <span style={{
          fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Stake calculator
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)" }}>Stake</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={1}
            value={stake}
            onChange={e => setStake(e.target.value)}
            aria-label="Stake amount"
            style={{
              width: 110, padding: "9px 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--surface-2)",
              color: "var(--text-1)", fontFamily: "var(--font-mono)",
              fontSize: 15, fontWeight: 700,
            }}
          />
        </label>

        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>
            Returns if it lands
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
            {potential.toFixed(2)}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>
            +{profit.toFixed(2)} profit at {totalOdds.toFixed(2)}{oddsSuffix}
          </p>
        </div>

        {expected != null && (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>
              Average over many tries
            </p>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 800, lineHeight: 1,
              color: edge != null && edge >= 0 ? "var(--green)" : "var(--text-2)",
            }}>
              {expected.toFixed(2)}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>
              lands {Math.round((hitProbability ?? 0) * 100)}% of the time
              {edge != null && ` · ${edge >= 0 ? "+" : ""}${edge.toFixed(2)}`}
            </p>
          </div>
        )}
      </div>

      {edge != null && edge < 0 && (
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--text-3)",
          marginTop: 14, lineHeight: 1.6,
        }}>
          Staked repeatedly at these odds this slip loses about{" "}
          <strong style={{ color: "var(--text-2)" }}>{Math.abs(edge).toFixed(2)}</strong> per{" "}
          {amount.toFixed(0)} over the long run — the bookmaker&apos;s margin. Shorter slips
          give up less of it.
        </p>
      )}
    </div>
  );
}
