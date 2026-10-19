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
  data, loading, error, onRefresh,
}: {
  data: ManualRemainingResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const {formatOdds, oddsSuffix} = useFormatOdds();
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!data?.available) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [data?.available]);
  if (loading) {
    return <p className="manual-remaining__status" role="status"><Clock3 size={14}/> Checking remaining manual games and revalidating new SportyBet codes…</p>;
  }
  if (error) return <p className="manual-remaining__status" role="status">{error}</p>;
  // This is an opt-in feature: before the visitor requests it there is no
  // result to show, not an empty/failed SportyBet response.
  if (!data) return null;
  if (!data.available) return <div className="manual-remaining__status" role="status">
    No reduced manual slip is verifiably bookable right now.
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
      <p>Matches within 10 minutes of kickoff, already started or no longer bookable were removed from these <strong>new</strong> tickets. Each new code represents only the matches shown below. The original manual slip and its results remain unchanged.</p>
    </header>
    <div className="manual-remaining__list">
      {tiers.map(({meta,tier}) => (
        <article key={meta.key} className="manual-remaining__card">
          <div className="manual-remaining__title">
            <div>
              <span className="manual-remaining__tier">{meta.label} · reduced manual ticket</span>
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
        </article>
      ))}
    </div>
    <p className="manual-remaining__disclaimer">A smaller ticket is a different wager and might not reach the original tier's target odds. The model's calibration and published results do not include these on-demand replacements. 18+ · Bet responsibly.</p>
  </section>;
}
