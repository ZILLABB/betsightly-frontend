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

type Acquisition = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string;
  ref: string | null;
};

const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const safeStorage = (storage: Storage, key: string): string => {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = randomId();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return randomId();
  }
};

const visitorId = safeStorage(localStorage, "betsightly_visitor_id");
const sessionId = safeStorage(sessionStorage, "betsightly_session_id");

const acquisition = (): Acquisition => {
  const key = "betsightly_session_acquisition";
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) return JSON.parse(stored) as Acquisition;
  } catch { /* use the current request context */ }
  const params = new URLSearchParams(window.location.search);
  const value: Acquisition = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    referrer: document.referrer,
    ref: params.get("ref"),
  };
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ }
  return value;
};

const productSource = (context: Partial<BookingEventContext>): string => {
  if (context.source === "generator") return "BUILD_SLIP";
  if (context.source === "bookable_now") return "FALLBACK";
  if (window.location.pathname.includes("rollover") || context.tier === "rollover") {
    return "ROLLOVER";
  }
  const tiers: Record<string, string> = {
    banker: "BANKER", two_odds: "TWO_ODDS", "2_odds": "TWO_ODDS",
    five_odds: "FIVE_ODDS", "5_odds": "FIVE_ODDS",
    ten_odds: "TEN_ODDS", "10_odds": "TEN_ODDS", over_1_5: "OVER_1_5",
  };
  if (context.tier && tiers[context.tier]) return tiers[context.tier];
  if (window.location.pathname.includes("build")) return "BUILD_SLIP";
  if (window.location.pathname.includes("prediction")) return "PREDICTIONS";
  return "OTHER";
};

const analyticsUrl = import.meta.env.VITE_ANALYTICS_URL || (
  import.meta.env.DEV ? `${API_BASE_URL}/growth/track` : "/api/growth/track"
);

/** First-party product analytics. It never blocks the action being measured. */
export function trackProductEvent(
  event: ProductEvent,
  context: Partial<BookingEventContext> & Record<string, unknown> = {},
): void {
  const attribution = acquisition();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  void fetch(analyticsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event,
      event_id: randomId(),
      visitor_id: visitorId,
      session_id: sessionId,
      path: window.location.pathname,
      ...attribution,
      tier: context.tier,
      target_odds: context.targetOdds,
      booking_status: context.bookingStatus,
      leg_count: context.legCount,
      actual_odds: context.actualOdds,
      booking_id: context.fingerprint,
      product_source: productSource(context),
      content_tag: context.source,
      timezone,
      screen_width: window.screen?.width,
      screen_height: window.screen?.height,
      client_timestamp: new Date().toISOString(),
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
