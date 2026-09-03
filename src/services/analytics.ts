import { API_BASE_URL } from "../config/apiConfig";
import {
  FORBIDDEN_PROPERTY_NAMES, sanitizeAnalyticsProperties, validateAnalyticsEvent,
  type AnalyticsEvent, type AnalyticsProperties,
} from "./analyticsSchema";
export { sanitizeAnalyticsProperties, validateAnalyticsEvent } from "./analyticsSchema";
export type { AnalyticsEvent, AnalyticsProperties, ProductArea } from "./analyticsSchema";

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
const dualWriteUntil = Date.parse(
  import.meta.env.VITE_ANALYTICS_DUAL_WRITE_UNTIL || "2026-09-17T23:59:59Z",
);
const legacyUrl = import.meta.env.VITE_ANALYTICS_URL || (
  import.meta.env.DEV ? `${API_BASE_URL}/growth/track` : "/api/growth/track"
);
let initialized = false;
type PostHogClient = typeof import("posthog-js").default;
let provider: PostHogClient | null = null;
let providerPromise: Promise<PostHogClient | null> | null = null;

const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const legacyId = (storage: Storage, key: string): string => {
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

const acquisition = () => {
  const key = "betsightly_session_acquisition";
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) return JSON.parse(stored) as Record<string, string | null>;
  } catch { /* attribution is optional */ }
  const params = new URLSearchParams(window.location.search);
  const value = {
    utm_source: params.get("utm_source"), utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"), utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"), referrer: document.referrer,
    ref: params.get("ref"),
  };
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ }
  return value;
};

function loadProvider(): Promise<PostHogClient | null> {
  if (!projectToken) return Promise.resolve(null);
  if (provider) return Promise.resolve(provider);
  if (providerPromise) return providerPromise;
  providerPromise = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(projectToken, {
      api_host: apiHost,
      ui_host: import.meta.env.VITE_POSTHOG_UI_HOST || "https://us.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_performance: false,
      persistence: "localStorage",
      person_profiles: "identified_only",
      respect_dnt: true,
      property_denylist: [...FORBIDDEN_PROPERTY_NAMES],
      loaded: () => undefined,
    });
    initialized = true;
    provider = posthog;
    return posthog;
  }).catch(() => {
    initialized = false;
    // A transient chunk/CSP/network failure must not permanently turn the
    // provider into a no-op for the rest of this SPA session. The next
    // canonical event may retry, while this failure remains non-blocking.
    providerPromise = null;
    return null;
  });
  return providerPromise;
}

function init(): void {
  void loadProvider();
}

function legacyCapture(event: string, properties: AnalyticsProperties): void {
  if (!Number.isFinite(dualWriteUntil) || Date.now() > dualWriteUntil) return;
  const attr = acquisition();
  const visitorId = legacyId(localStorage, "betsightly_visitor_id");
  const sessionId = legacyId(sessionStorage, "betsightly_session_id");
  const contentSource = properties.product_area === "builder" ? "generator" :
    properties.product_area === "fallback" ? "bookable_now" : "daily_card";
  void fetch(legacyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event, event_id: randomId(), visitor_id: visitorId, session_id: sessionId,
      path: window.location.pathname, ...attr, tier: properties.tier,
      target_odds: properties.target_odds, booking_status: properties.booking_status,
      leg_count: properties.leg_count, actual_odds: properties.actual_sportybet_odds,
      booking_id: properties.booking_variant_id,
      product_source: properties.product_area?.toUpperCase(),
      content_tag: contentSource,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_width: window.screen?.width, screen_height: window.screen?.height,
      client_timestamp: new Date().toISOString(), metadata: properties,
    }),
  }).catch(() => undefined);
}

function capture(event: AnalyticsEvent, raw: AnalyticsProperties = {}): void {
  const properties = sanitizeAnalyticsProperties(raw);
  if (!validateAnalyticsEvent(event, properties)) {
    if (import.meta.env.DEV) console.warn(`Analytics event ${event} is missing required properties.`);
    return;
  }
  void loadProvider().then((posthog) => {
    try { posthog?.capture(event, properties); } catch { /* non-blocking */ }
  });
  legacyCapture(event, properties);
}

function pageView(): void {
  void loadProvider().then((posthog) => {
    try { posthog?.capture("$pageview"); } catch { /* non-blocking */ }
  });
  legacyCapture("pageview", {});
}

function identify(userId: string): void {
  if (!userId || userId.length > 128) return;
  void loadProvider().then((posthog) => {
    try { posthog?.identify(userId); } catch { /* non-blocking */ }
  });
}

function reset(): void {
  void loadProvider().then((posthog) => {
    try { posthog?.reset(); } catch { /* non-blocking */ }
  });
}

export const analytics = {
  init,
  capture,
  pageView,
  identify,
  reset,
  isConfigured: () => Boolean(projectToken),
  isDualWriting: () => Number.isFinite(dualWriteUntil) && Date.now() <= dualWriteUntil,
};
