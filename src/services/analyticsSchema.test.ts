import { sanitizeAnalyticsProperties, validateAnalyticsEvent } from "./analyticsSchema";

test("canonical events enforce required properties", () => {
  expect(validateAnalyticsEvent("builder_generate_requested", { product_area: "builder" })).toBe(false);
  expect(validateAnalyticsEvent("builder_generate_requested", {
    product_area: "builder", target_odds: 50,
  })).toBe(true);
  expect(validateAnalyticsEvent("booking_code_copied", {
    product_area: "predictions", booking_status: "FULL", booking_variant_id: "safe-id",
  })).toBe(true);
});

test("forbidden, free-form and non-finite properties cannot leave the abstraction", () => {
  const clean = sanitizeAnalyticsProperties({
    product_area: "builder", target_odds: 50, share_code: "SECRET",
    email: "person@example.com", error_message: "free form", surprise: "unknown",
    leg_count: Number.NaN,
  });
  expect(clean).toEqual({ product_area: "builder", target_odds: 50 });
  expect(JSON.stringify(clean)).not.toContain("SECRET");
});
