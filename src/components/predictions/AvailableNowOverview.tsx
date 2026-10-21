import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CATEGORIES } from "../../types";
import type { AccumulatorResponse, CategoryKey } from "../../types";
import { useFormatOdds } from "../../hooks/useFormatOdds";
import { verifiedBookableTierKeys } from "../../utils/bookableTiers";

/**
 * A new available-now card may only fill some tiers. Make those live tiers
 * discoverable immediately instead of leaving users on an empty old tab.
 * The booking code is only shown when returned with validated bookability.
 */
export function AvailableNowOverview({
  accumulators,
  onSelect,
}: {
  accumulators: AccumulatorResponse["accumulators"];
  onSelect: (key: CategoryKey) => void;
}) {
  const { formatOdds, oddsSuffix } = useFormatOdds();
  const verified = verifiedBookableTierKeys(accumulators);
  if (!verified.length) return null;

  return (
    <section className="available-now-overview" aria-label="Verified currently bookable tickets">
      <div className="available-now-overview__intro">
        <div>
          <span className="editorial-overline">LIVE BOOKMAKER CHECK</span>
          <h2>{verified.length} verified {verified.length === 1 ? "ticket" : "tickets"} available</h2>
          <p>These are fresh replacements, not changes to today's official results record. Only tiers with verified SportyBet codes appear here.</p>
        </div>
      </div>
      <div className="available-now-overview__grid">
        {verified.map(key => {
          const tier = accumulators[key];
          const booking = tier.booking!;
          const meta = CATEGORIES.find(category => category.key === key)!;
          const bookmakerPrice = booking.actual_sportybet_odds;
          return (
            <article className="available-now-overview__ticket" key={key}>
              <div className="available-now-overview__ticket-top">
                <span className="available-now-overview__tier">{meta.label}</span>
                <span className="available-now-overview__verified">
                  <CheckCircle2 size={13} aria-hidden="true" /> Verified at last check
                </span>
              </div>
              <p>{tier.games.length} {tier.games.length === 1 ? "fixture" : "fixtures"} · {tier.editorial_manual ? "Admin-curated" : "Model-selected"}</p>
              <div className="available-now-overview__price">
                <span>SportyBet code</span>
                <code>{booking.share_code}</code>
              </div>
              {typeof bookmakerPrice === "number" && Number.isFinite(bookmakerPrice) && bookmakerPrice > 1 && (
                <p className="available-now-overview__odds">Verified bookmaker quote: <strong>{formatOdds(bookmakerPrice)}{oddsSuffix}</strong></p>
              )}
              <button type="button" onClick={() => onSelect(key)}>
                View matches &amp; copy code <ArrowRight size={15} aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
      <p className="available-now-overview__footnote">
        SportyBet availability and prices can change. Confirm the displayed selections before staking. The original publication is still available for auditing.
      </p>
    </section>
  );
}
