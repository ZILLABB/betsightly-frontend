import { API_BASE_URL } from "../config/apiConfig";

export type ProductEvent =
  | "pageview" | "prediction_viewed" | "rollover_viewed" | "builder_opened"
  | "builder_target_selected" | "builder_generated" | "builder_bookable"
  | "booking_code_generated" | "booking_code_validated" | "booking_code_viewed"
  | "booking_code_copied" | "sportybet_open_clicked" | "fallback_shown"
  | "replacement_used" | "partial_booking_created" | "results_viewed"
  | "telegram_join_clicked" | "replacement_details_opened"
  | "code_generated" | "code_validated" | "code_displayed" | "code_copied"
  | "code_regenerated";

export interface BookingEventContext {
  source: "daily_card" | "generator" | "bookable_now";
  tier?: string;
  legCount?: number;
  fingerprint?: string;
  targetOdds?: number;
  bookingStatus?: string;
  actualOdds?: number;
}

const safeStorage = (storage: Storage, key: string): string => {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return crypto.randomUUID();
  }
};

const visitorId = safeStorage(localStorage, "betsightly_visitor_id");
const sessionId = safeStorage(sessionStorage, "betsightly_session_id");

/** First-party product analytics. It never blocks the action being measured. */
export function trackProductEvent(
  event: ProductEvent,
  context: Partial<BookingEventContext> & Record<string, unknown> = {},
): void {
  const params = new URLSearchParams(window.location.search);
  const eventId = crypto.randomUUID();
  void fetch(`${API_BASE_URL}/growth/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event,
      event_id: eventId,
      visitor_id: visitorId,
      session_id: sessionId,
      path: window.location.pathname,
      referrer: document.referrer,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      ref: context.fingerprint ?? params.get("ref"),
      tier: context.tier,
      target_odds: context.targetOdds,
      booking_status: context.bookingStatus,
      leg_count: context.legCount,
      actual_odds: context.actualOdds,
      content_tag: context.source,
      metadata: Object.fromEntries(
        Object.entries(context).filter(([key]) => ![
          "fingerprint", "tier", "targetOdds", "bookingStatus",
          "legCount", "actualOdds", "source",
        ].includes(key)),
      ),
    }),
  }).catch(() => undefined);
}

export function trackBookingEvent(
  event: ProductEvent,
  context: BookingEventContext,
): void {
  trackProductEvent(event, context);
}
