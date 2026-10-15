import {
  applyAnalyticsPreferenceFromUrl, isAnalyticsExcluded, setAnalyticsExcluded,
} from "./internalTraffic";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/settings?betsightly_testing=0");
  applyAnalyticsPreferenceFromUrl();
});

test("activation URL excludes this browser before pageview capture", () => {
  window.history.replaceState({}, "", "/settings?betsightly_testing=1&utm_source=organic#privacy");
  applyAnalyticsPreferenceFromUrl();
  expect(isAnalyticsExcluded()).toBe(true);
  expect(window.localStorage.getItem("betsightly_internal_analytics_excluded_v1")).toBe("1");
  expect(window.sessionStorage.getItem("betsightly_internal_analytics_excluded_v1")).toBe("1");
  expect(window.location.pathname).toBe("/settings");
  expect(window.location.search).toBe("?utm_source=organic");
  expect(window.location.hash).toBe("#privacy");
});

test("exclusion survives navigation and reload on the same browser", () => {
  window.history.replaceState({}, "", "/settings?betsightly_testing=1");
  applyAnalyticsPreferenceFromUrl();
  window.history.replaceState({}, "", "/predictions");
  expect(isAnalyticsExcluded()).toBe(true);
  expect(window.location.search).toBe("");
});

test("restore link resumes counting on this browser only", () => {
  setAnalyticsExcluded(true);
  window.history.replaceState({}, "", "/settings?betsightly_testing=0");
  applyAnalyticsPreferenceFromUrl();
  expect(isAnalyticsExcluded()).toBe(false);
  expect(window.localStorage.getItem("betsightly_internal_analytics_excluded_v1")).toBeNull();
  expect(window.sessionStorage.getItem("betsightly_internal_analytics_excluded_v1")).toBeNull();
  expect(window.location.search).toBe("");
});

test("unknown URL values do not silently change privacy preference", () => {
  setAnalyticsExcluded(true);
  window.history.replaceState({}, "", "/settings?betsightly_testing=maybe");
  applyAnalyticsPreferenceFromUrl();
  expect(isAnalyticsExcluded()).toBe(true);
  expect(window.location.search).toBe("?betsightly_testing=maybe");
});

test("settings toggle applies only to this browser and can be reversed", () => {
  expect(isAnalyticsExcluded()).toBe(false);
  setAnalyticsExcluded(true);
  expect(isAnalyticsExcluded()).toBe(true);
  setAnalyticsExcluded(false);
  expect(isAnalyticsExcluded()).toBe(false);
});
