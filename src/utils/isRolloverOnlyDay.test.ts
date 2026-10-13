import type { AccumulatorResponse } from "../types";
import { isRolloverOnlyDay } from "./isRolloverOnlyDay";

const card = (rollover = false, others: string[] = []): AccumulatorResponse["accumulators"] => (
  Object.fromEntries(
    ["banker", "2_odds", "5_odds", "10_odds", "over_1_5", "rollover"]
      .map(name => [name, {
        selected: name === "rollover" ? rollover : others.includes(name),
        games: (name === "rollover" ? rollover : others.includes(name))
          ? [{match_id:name}] : [],
      }]),
  ) as unknown as AccumulatorResponse["accumulators"]
);

test("promotes an actual rollover when all other official tiers are withheld", () => {
  expect(isRolloverOnlyDay(card(true))).toBe(true);
});
test("does not claim a rollover is present when it is empty", () => {
  expect(isRolloverOnlyDay(card(false))).toBe(false);
});
test("does not label a populated Banker day as rollover-only", () => {
  expect(isRolloverOnlyDay(card(true, ["banker"]))).toBe(false);
});
test("does not show thin-day notice before data loads", () => {
  expect(isRolloverOnlyDay(undefined)).toBe(false);
});
