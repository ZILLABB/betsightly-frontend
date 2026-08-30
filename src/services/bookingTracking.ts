import { API_BASE_URL } from "../config/apiConfig";

export type BookingEvent =
  | "code_generated"
  | "code_validated"
  | "code_displayed"
  | "code_copied"
  | "sportybet_open_clicked"
  | "code_regenerated";

export interface BookingEventContext {
  source: "daily_card" | "generator" | "bookable_now";
  tier?: string;
  legCount?: number;
  fingerprint?: string;
}

/** Best-effort product analytics. Tracking must never block booking. */
export function trackBookingEvent(
  event: BookingEvent,
  context: BookingEventContext,
): void {
  const contentTag = [context.source, context.tier, context.legCount]
    .filter(value => value !== undefined && value !== "")
    .join(":")
    .slice(0, 64);

  void fetch(`${API_BASE_URL}/growth/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event,
      path: window.location.pathname,
      content_tag: contentTag,
      ref: context.fingerprint?.slice(0, 64),
      referrer: document.referrer,
    }),
  }).catch(() => undefined);
}
