import { analytics, type AnalyticsEvent, type AnalyticsProperties } from "./analytics";

export type ProductEvent = AnalyticsEvent;

export interface BookingEventContext {
  source: "daily_card" | "generator" | "bookable_now";
  tier?: string;
  legCount?: number;
  fingerprint?: string;
  targetOdds?: number;
  bookingStatus?: string;
  actualOdds?: number;
  failure_category?: string;
  replacement_type?: "same_fixture_market" | "replacement_fixture" | "partial";
  replacement_count?: number;
}

/** First-party product analytics. It never blocks the action being measured. */
export function trackProductEvent(
  event: ProductEvent,
  context: Partial<BookingEventContext> & AnalyticsProperties = {},
): void {
  const product_area = context.product_area || (
    context.source === "generator" ? "builder" :
    context.source === "bookable_now" ? "fallback" :
    context.tier === "rollover" || window.location.pathname.includes("rollover")
      ? "rollover" : "predictions"
  );
  analytics.capture(event, {
    ...context,
    product_area,
    tier: context.tier,
    target_odds: context.target_odds ?? context.targetOdds,
    booking_status: context.booking_status ?? context.bookingStatus,
    booking_variant_id: context.booking_variant_id ?? context.fingerprint,
    leg_count: context.leg_count ?? context.legCount,
    actual_sportybet_odds: context.actual_sportybet_odds ?? context.actualOdds,
  });
}

export function trackBookingEvent(
  event: ProductEvent,
  context: BookingEventContext,
): void {
  trackProductEvent(event, context);
}
