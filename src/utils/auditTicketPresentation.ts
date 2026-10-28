import type { CategoryData } from "../types";

export interface TicketPresentationAudit {
  valid: boolean;
  reasons: string[];
  displayedLegCount: number;
  legOddsProduct: number | null;
}

/**
 * A public accumulator must not suggest that its headline price or booked
 * leg count refers to a different set of selections. The archived publication
 * is never mutated; this only flags contradictory snapshot data.
 *
 * Odds are rounded per leg for display, so tolerate modest rounding drift.
 * Only audit manual bookmaker tickets for displayed price parity: model
 * products may use independent estimated prices.
 */
export function auditTicketPresentation(tier?: CategoryData): TicketPresentationAudit {
  const games = tier?.games ?? [];
  const reasons: string[] = [];
  const booking = tier?.booking;
  const isFullBooking = booking?.booking_status === "FULL" ||
    booking?.booking_status === "REBUILT_FULL";

  if (tier?.selected && isFullBooking &&
      booking?.booked_leg_count != null && booking.booked_leg_count !== games.length) {
    reasons.push(
      `This ticket lists ${games.length} selections, but the saved booking confirms ${booking.booked_leg_count}.`,
    );
  }

  // Only original FULL bookings have a one-to-one correspondence with the
  // published selection list. A rebuilt ticket can contain replacements.
  if (tier?.selected && booking?.booking_status === "FULL" &&
      booking?.original_leg_count != null && booking.original_leg_count !== games.length) {
    reasons.push(
      `The publication contains ${games.length} selections, but the booking snapshot records ${booking.original_leg_count}.`,
    );
  }

  const legPrices = games.map(game => game.odds ?? game.real_odds ?? game.estimated_odds);
  const allLegsPriced = legPrices.length > 0 &&
    legPrices.every(odd => typeof odd === "number" && Number.isFinite(odd) && odd > 1);
  const product = allLegsPriced
    ? legPrices.reduce((value, odd) => value * Number(odd), 1)
    : null;

  if (tier?.selected && tier?.editorial_manual === true &&
      tier.presentation !== "singles" && product !== null &&
      typeof tier.total_odds === "number" && tier.total_odds > 1) {
    const relativeDifference = Math.abs(product - tier.total_odds) / tier.total_odds;
    if (relativeDifference > 0.08) {
      reasons.push(
        "The combined price does not match the displayed selection prices. Verify the saved bookmaker ticket.",
      );
    }
  }

  return { valid: reasons.length === 0, reasons, displayedLegCount: games.length, legOddsProduct: product };
}
