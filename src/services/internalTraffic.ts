/**
 * Browser-local internal/test traffic exclusion.
 *
 * This does not identify the owner, authorize access, or change betting data.
 * A user can deliberately opt a browser out of first-party product analytics
 * (PostHog and Vercel Analytics). Never use IP filtering for shared carrier IPs.
 *
 * Activation: /settings?betsightly_testing=1
 * Re-enable:  /settings?betsightly_testing=0
 */
const KEY = "betsightly_internal_analytics_excluded_v1";
const QUERY_KEY = "betsightly_testing";
let currentPageExcluded = false;

function getStored(storage: "localStorage" | "sessionStorage"): boolean {
  try {
    return window[storage].getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function store(storage: "localStorage" | "sessionStorage", excluded: boolean): void {
  try {
    if (excluded) window[storage].setItem(KEY, "1");
    else window[storage].removeItem(KEY);
  } catch { /* Browser storage may be disabled in private mode. */ }
}

export function isAnalyticsExcluded(): boolean {
  if (typeof window === "undefined") return false;
  return currentPageExcluded ||
    getStored("localStorage") ||
    getStored("sessionStorage");
}

/** The browser must reload after a settings change to remove mounted trackers. */
export function setAnalyticsExcluded(excluded: boolean): void {
  if (typeof window === "undefined") return;
  currentPageExcluded = excluded;
  store("localStorage", excluded);
  store("sessionStorage", excluded);
}

/** Called before initializing any analytics on the initial page load. */
export function applyAnalyticsPreferenceFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const value = params.get(QUERY_KEY);
  if (value !== "1" && value !== "0") return;
  setAnalyticsExcluded(value === "1");
  params.delete(QUERY_KEY);
  // Do not leave opt-out settings in shared URLs or acquisition attribution.
  const query = params.toString();
  window.history.replaceState(
    window.history.state, "",
    window.location.pathname + (query ? "?" + query : "") + window.location.hash,
  );
}
