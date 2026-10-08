import { CATEGORIES } from "../types";
import type { AccumulatorResponse, CategoryKey } from "../types";

/**
 * Pick an actually populated official tier for the first visit.
 *
 * An empty 2 Odds card used to be the default even when today's Banker and
 * Over 1.5 were already published. This helper only changes the automatic
 * default; explicit URL categories and manual tab choices remain authoritative.
 */
export function firstAvailablePredictionTier(
  accumulators: AccumulatorResponse["accumulators"] | null | undefined,
  preferred: CategoryKey = "2_odds",
): CategoryKey {
  if (!accumulators) return preferred;

  const hasGames = (key: CategoryKey): boolean => {
    const tier = accumulators[key];
    return Boolean(tier?.selected && tier.games?.length);
  };

  if (hasGames(preferred)) return preferred;
  return CATEGORIES.find(({ key }) => hasGames(key))?.key ?? preferred;
}
