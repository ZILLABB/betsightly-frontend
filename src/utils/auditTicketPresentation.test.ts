import { auditTicketPresentation } from "./auditTicketPresentation";
import type { CategoryData } from "../types";

const makeTier = (count: number, totalOdds: number): CategoryData => ({
  selected: true,
  editorial_manual: true,
  total_odds: totalOdds,
  risk_level: "high",
  games: Array.from({ length: count }, (_, i) => ({
    fixture_id: i + 1,
    match_id: `fixture-${i + 1}`,
    home_team: `Home ${i + 1}`,
    away_team: `Away ${i + 1}`,
    league: "Cup",
    date: "2099-10-28T19:00:00Z",
    prediction: "Over 1.5 Goals",
    prediction_type: "goals",
    confidence: 0,
    odds: 1.2,
  })),
});

test("accepts a consistent published manual slip", () => {
  const tier = makeTier(2, 1.44);
  tier.booking = { status: "active", share_code: "OK123", booking_status: "FULL",
    original_leg_count: 2, booked_leg_count: 2 };
  expect(auditTicketPresentation(tier).valid).toBe(true);
});

test("detects saved 10-pick booking displayed with 13 fixture cards", () => {
  const tier = makeTier(13, 10.51);
  tier.booking = { status: "started", booking_status: "FULL",
    original_leg_count: 10, booked_leg_count: 10 };
  const result = auditTicketPresentation(tier);
  expect(result.valid).toBe(false);
  expect(result.reasons.join(" ")).toMatch(/13 selections/);
  expect(result.reasons.join(" ")).toMatch(/combined price/);
});

test("tolerates bookmaker rounding on manual combined odds", () => {
  const tier = makeTier(10, 6.25);
  // Rounded 1.2x per leg is 6.191736x; this small difference is acceptable.
  expect(auditTicketPresentation(tier).valid).toBe(true);
});

test("singles do not falsely claim to have a combined price", () => {
  const tier = makeTier(3, 10);
  tier.presentation = "singles";
  expect(auditTicketPresentation(tier).valid).toBe(true);
});

test("model estimated accumulator odds are not treated as exact bookmaker readback", () => {
  const tier = makeTier(3, 2.4);
  tier.editorial_manual = false;
  expect(auditTicketPresentation(tier).valid).toBe(true);
});

test("a rebuilt ticket may intentionally have a different original selection count", () => {
  const tier = makeTier(2, 1.44);
  tier.booking = { status: "active", booking_status: "REBUILT_FULL",
    booked_leg_count: 2, original_leg_count: 3 };
  expect(auditTicketPresentation(tier).valid).toBe(true);
});
