import { CATEGORIES } from "../types";
import type { AccumulatorResponse, CategoryKey } from "../types";

export type PublishedTiers = AccumulatorResponse["accumulators"];

/** The replacement surface is actionable only if a concrete code exists for its exact legs.
 * The backend has already verified SportyBet readback. We fail closed on any
 * explicit invalid readback/lifecycle information, never showing an invented code. */
export function verifiedBookableTierKeys(board?: PublishedTiers | null): CategoryKey[] {
  if (!board) return [];
  return CATEGORIES
    .map(({ key }) => key)
    .filter(key => key !== "rollover")
    .filter(key => {
      const tier = board[key];
      const booking = tier?.booking;
      if (!tier?.selected || !tier.games?.length || !booking?.share_code) return false;
      if (booking.status !== "active" || booking.actionable === false) return false;
      if (booking.lifecycle_status && booking.lifecycle_status !== "active") return false;
      if (booking.booking_status && !["FULL", "REBUILT_FULL"].includes(booking.booking_status)) return false;
      if (booking.readback_validation && booking.readback_validation !== "PASSED") return false;
      return true;
    });
}

export function preferredBookableTier(
  board: PublishedTiers | null | undefined,
  preferred: CategoryKey = "2_odds",
): CategoryKey {
  const keys = verifiedBookableTierKeys(board);
  return keys.includes(preferred) ? preferred : keys[0] || preferred;
}
