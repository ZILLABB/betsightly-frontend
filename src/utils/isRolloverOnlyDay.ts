import type { AccumulatorResponse, CategoryKey } from "../types";

const ORDINARY_TIERS: CategoryKey[] = ["banker", "2_odds", "5_odds", "10_odds", "over_1_5"];

/** Detect a genuine Rollover-only publication, not a missing API payload. */
export function isRolloverOnlyDay(
  accumulators: AccumulatorResponse["accumulators"] | undefined | null,
): boolean {
  if (!accumulators) return false;
  const rollover = accumulators.rollover;
  if (!rollover?.selected || !rollover.games?.length) return false;
  return ORDINARY_TIERS.every(key => {
    const tier = accumulators[key];
    return !tier?.selected || !tier.games?.length;
  });
}
