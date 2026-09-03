export type AnalyticsEvent =
  | "prediction_viewed" | "rollover_viewed" | "builder_opened"
  | "builder_target_selected" | "builder_generate_requested" | "builder_generated"
  | "booking_code_viewed" | "booking_code_copied" | "sportybet_opened"
  | "fallback_shown" | "alternative_market_used" | "replacement_used"
  | "partial_booking_used" | "replacement_details_opened" | "results_viewed"
  | "telegram_join_clicked";

export type ProductArea = "predictions" | "rollover" | "builder" | "fallback";

export interface AnalyticsProperties {
  product_area?: ProductArea; tier?: string; target_odds?: number;
  booking_status?: string; booking_variant_id?: string; leg_count?: number;
  actual_sportybet_odds?: number;
  replacement_type?: "same_fixture_market" | "replacement_fixture" | "partial";
  replacement_count?: number; failure_category?: string; horizon?: string;
  placement?: string; results_scope?: string; rollover_day?: number;
  chain_id?: string; entry_source?: string;
}

const ALLOWED = new Set<keyof AnalyticsProperties>([
  "product_area", "tier", "target_odds", "booking_status", "booking_variant_id",
  "leg_count", "actual_sportybet_odds", "replacement_type", "replacement_count",
  "failure_category", "horizon", "placement", "results_scope", "rollover_day",
  "chain_id", "entry_source",
]);
export const FORBIDDEN_PROPERTY_NAMES = new Set([
  "share_code", "booking_code", "email", "phone", "raw_ip", "ip", "stake",
  "sportybet_account", "booking_payload", "model_features", "error_message",
]);
const REQUIRED: Partial<Record<AnalyticsEvent, (keyof AnalyticsProperties)[]>> = {
  prediction_viewed: ["product_area"], rollover_viewed: ["product_area"],
  builder_opened: ["product_area"],
  builder_target_selected: ["product_area", "target_odds"],
  builder_generate_requested: ["product_area", "target_odds"],
  builder_generated: ["product_area", "target_odds", "booking_status"],
  booking_code_viewed: ["product_area", "booking_status", "booking_variant_id"],
  booking_code_copied: ["product_area", "booking_status", "booking_variant_id"],
  sportybet_opened: ["product_area", "booking_status", "booking_variant_id"],
  fallback_shown: ["product_area", "failure_category"],
};

export function sanitizeAnalyticsProperties(properties: Record<string, unknown> = {}): AnalyticsProperties {
  const clean: Record<string, string | number> = {};
  Object.entries(properties).forEach(([key, value]) => {
    if (!ALLOWED.has(key as keyof AnalyticsProperties) || FORBIDDEN_PROPERTY_NAMES.has(key) || value == null) return;
    if (typeof value === "string") clean[key] = value.slice(0, 128);
    else if (typeof value === "number" && Number.isFinite(value)) clean[key] = value;
  });
  return clean as AnalyticsProperties;
}

export function validateAnalyticsEvent(event: AnalyticsEvent, properties: AnalyticsProperties): boolean {
  return (REQUIRED[event] || []).every((key) => properties[key] != null);
}
