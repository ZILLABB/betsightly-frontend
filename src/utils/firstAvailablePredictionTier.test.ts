import type { AccumulatorResponse } from "../types";
import { firstAvailablePredictionTier } from "./firstAvailablePredictionTier";

const cards = (
  available: Partial<Record<"banker" | "2_odds" | "5_odds" | "10_odds" | "over_1_5" | "rollover", boolean>>,
): AccumulatorResponse["accumulators"] => Object.fromEntries(
  ["banker", "over_1_5", "2_odds", "5_odds", "10_odds", "rollover"].map(key => [
    key,
    {
      selected: Boolean(available[key as keyof typeof available]),
      games: available[key as keyof typeof available] ? [{ match_id: key }] : [],
      total_odds: 0,
      risk_level: "low",
    },
  ]),
) as unknown as AccumulatorResponse["accumulators"];

test("defaults to Banker when 2 Odds is withheld but Banker is published", () => {
  expect(firstAvailablePredictionTier(cards({ banker: true, over_1_5: true })))
    .toBe("banker");
});

test("keeps 2 Odds when that product has a real published selection", () => {
  expect(firstAvailablePredictionTier(cards({ banker: true, "2_odds": true })))
    .toBe("2_odds");
});

test("defaults to Over 1.5 if Banker and 2 Odds are empty", () => {
  expect(firstAvailablePredictionTier(cards({ over_1_5: true })))
    .toBe("over_1_5");
});

test("returns original choice when all products are unavailable", () => {
  expect(firstAvailablePredictionTier(cards({}))).toBe("2_odds");
});

test("does not change preference before predictions finish loading", () => {
  expect(firstAvailablePredictionTier(undefined, "5_odds")).toBe("5_odds");
});

test("retains the selected active product when populated", () => {
  expect(firstAvailablePredictionTier(cards({ banker: true, "5_odds": true }), "5_odds"))
    .toBe("5_odds");
});
