import { useEffect, useState } from "react";
import { CATEGORIES } from "../../types";
import { manualRemainingLegsStillEligible } from "../../utils/manualRemainingWindow";
import type { ManualRemainingResponse } from "../../api/predictions";
import BookingCode from "./BookingCode";
import { useFormatOdds } from "../../hooks/useFormatOdds";
import { formatLocalTimeWithZone } from "../../utils/formatters";
import { CheckCircle2, Clock3 } from "lucide-react";

/** An alternative bet—not an amended official publication or a model pick. */
export function ManualRemainingOverview({
  data, loading, error, onRefresh, onFindNearTarget, targetTierLoading,
}: {
  data: ManualRemainingResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onFindNearTarget?: (tier: (typeof CATEGORIES)[number]["key"]) => void;
  targetTierLoading?: (typeof CATEGORIES)[number]["key"] | null;
}) {
  const {formatOdds, oddsSuffix} = useFormatOdds();
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!data?.available) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [data?.available]);
  if (loading && !data) {
    return <p className="manual-remaining__status" role="status"><Clock3 size={14}/> Checking remaining manual games and revalidating new SportyBet codes…</p>;
  }
  if (error && !data) return <p className="manual-remaining__status" role="status">{error}</p>;
  // This is an opt-in feature: before the visitor requests it there is no
  // result to show, not an empty/failed SportyBet response.
  if (!data) return null;
  if (!data.available) return <div className="manual-remaining__status" role="status"
    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 7 }}>
    <strong>No reduced manual slip is verifiably bookable right now.</strong>
    {data.reason && <span>{data.reason}</span>}
    {!!Object.keys(data.tier_reasons ?? {}).length && (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {Object.entries(data.tier_reasons ?? {}).map(([tier, reason]) => (
          <li key={tier}>{CATEGORIES.find(item => item.key === tier)?.label ?? tier}: {reason}</li>
        ))}
      </ul>
    )}
    <button type="button" onClick={onRefresh}>Check again</button>
  </div>;

  const tiers = CATEGORIES
    .filter(meta => {
      const tier = data.tiers[meta.key];
      if (!tier?.selected || !tier.booking?.share_code ||
          !manualRemainingLegsStillEligible(tier.games, nowMs)) return false;
      const expiry = tier.booking.expires_at;
      return !expiry || (Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) > nowMs);
    })
    .map(meta => ({ meta, tier: data.tiers[meta.key]! }));

  if (!tiers.length) return <div className="manual-remaining__status" role="status">
    The last reduced code has reached the 10-minute cutoff or expired.
    <button type="button" onClick={onRefresh}>Recheck remaining games</button>
  </div>;

  return <section className="manual-remaining" aria-label="Remaining manually curated matches">
    <header className="manual-remaining__intro">
      <span className="editorial-overline">MANUAL PICKS · REBOOKED</span>
      <h2>Still-available manual matches</h2>
      <p>Automatically recovered after a published manual match starts or becomes unplaceable. Matches within 10 minutes of kickoff, already started or no longer bookable are excluded from each <strong>new</strong> ticket. The original manual slip and its results remain unchanged.</p>
      {loading && <p role="status">Refreshing exact SportyBet selections…</p>}
      {error && <p role="status">{error}</p>}
    </header>
    <div className="manual-remaining__list">
      {tiers.map(({meta,tier}) => (
        <article key={meta.key} className="manual-remaining__card">
          <div className="manual-remaining__title">
            <div>
              <span className="manual-remaining__tier">{meta.label} · {tier.games.length === 1 ? "remaining single (not original tier odds)" : "reduced manual ticket"}</span>
              <small>{tier.remaining_leg_count} of {tier.original_leg_count} original games · {tier.removed_leg_count} excluded</small>
            </div>
            <span className="manual-remaining__verified"><CheckCircle2 size={14}/> Verified at last check</span>
          </div>
          <ol className="manual-remaining__games">
            {tier.games.map((game,index) => (
              <li key={game.match_id || index}>
                <div className="manual-remaining__teams">
                  <strong>{game.home_team} <span>vs</span> {game.away_team}</strong>
                  <small>{game.kickoff ? formatLocalTimeWithZone(game.kickoff) : "Kickoff pending"}</small>
                </div>
                <div className="manual-remaining__pick">
                  <span>{game.prediction || game.market || "Selection"}</span>
                  <strong>{typeof game.odds === "number" && Number.isFinite(game.odds) ? `${formatOdds(game.odds)}${oddsSuffix}` : "—"}</strong>
                </div>
              </li>
            ))}
          </ol>
          {typeof tier.booking?.actual_sportybet_odds === "number" && (
            <div className="manual-remaining__quoted">
              Verified SportyBet price for this reduced slip:
              <strong>{formatOdds(tier.booking.actual_sportybet_odds)}{oddsSuffix}</strong>
            </div>
          )}
          <BookingCode
            booking={tier.booking}
            category={meta}
            tracking={{
              source: "daily_card",
              tier: meta.key,
              legCount: tier.booking?.booked_leg_count ?? tier.games.length,
              fingerprint: tier.booking?.booking_variant_fingerprint,
            }}
          />
          {(() => {
            const alternative = data.near_target_alternatives?.[meta.key];
            const alternativeEligible = !!alternative?.selected &&
              !!alternative.booking?.share_code &&
              manualRemainingLegsStillEligible(alternative.games, nowMs);
            if (alternativeEligible && alternative) {
              return <div className="manual-remaining__alternative"
                style={{ marginTop: 16, padding: 16, border: "1px solid var(--border)", borderRadius: 12 }}>
                <strong>Separate alternative · closer to original odds</strong>
                <p style={{ margin: "8px 0", color: "var(--text-2)", lineHeight: 1.5 }}>
                  {alternative.remaining_original_leg_count} surviving original picks + {alternative.supplemental_leg_count} additional model-qualified picks.
                  Original target {formatOdds(alternative.target_original_odds)}{oddsSuffix};
                  newly verified SportyBet price {formatOdds(alternative.total_odds)}{oddsSuffix}.
                  This is a different wager, not an amendment or guaranteed replacement.
                </p>
                <ol className="manual-remaining__games">
                  {alternative.games.map((game, index) => <li key={game.match_id || index}>
                    <div className="manual-remaining__teams">
                      <strong>{game.home_team} vs {game.away_team}</strong>
                      <small>{game.supplemental_model_selection ? "Additional model-qualified selection" : "Surviving original selection"}</small>
                    </div>
                    <div className="manual-remaining__pick">
                      <span>{game.prediction || game.market || "Selection"}</span>
                      <strong>{typeof game.odds === "number" ? `${formatOdds(game.odds)}${oddsSuffix}` : "—"}</strong>
                    </div>
                  </li>)}
                </ol>
                <BookingCode booking={alternative.booking} category={meta}
                  tracking={{
                    source: "daily_card",
                    tier: meta.key,
                    legCount: alternative.booking?.booked_leg_count ?? alternative.games.length,
                    fingerprint: alternative.booking?.booking_variant_fingerprint,
                  }}
                />
              </div>;
            }
            return onFindNearTarget ? <div style={{ marginTop: 12 }}>
              <button type="button" disabled={!!targetTierLoading || loading}
                onClick={() => onFindNearTarget(meta.key)}>
                {targetTierLoading === meta.key && loading ? "Checking stronger alternative…" : "Try closer to original odds"}
              </button>
              <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 6 }}>
                Optional. May add different fixtures only with verified bookmaker prices and exact readback. No alternative is shown if none qualifies.
              </p>
            </div> : null;
          })()}
        </article>
      ))}
    </div>
    <p className="manual-remaining__disclaimer">A smaller ticket is a different wager and might not reach the original tier's target odds. The model's calibration and published results do not include these on-demand replacements. 18+ · Bet responsibly.</p>
  </section>;
}
