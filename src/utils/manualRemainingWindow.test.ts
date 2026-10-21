import { manualRemainingLegsStillEligible, MANUAL_REMAINDER_CUTOFF_MS } from "./manualRemainingWindow";

const now = new Date("2026-10-19T12:00:00Z").getTime();
const leg = (minutes: number) => ({ kickoff: new Date(now + minutes*60_000).toISOString() });

test("manual reduced slip keeps 15 minutes before kickoff", () => {
  expect(MANUAL_REMAINDER_CUTOFF_MS).toBe(600_000);
  expect(manualRemainingLegsStillEligible([leg(15),leg(40)], now)).toBe(true);
});

test("manual reduced slip hides code when any leg hits 10-minute boundary", () => {
  expect(manualRemainingLegsStillEligible([leg(10),leg(40)], now)).toBe(false);
  expect(manualRemainingLegsStillEligible([leg(9),leg(40)], now)).toBe(false);
  expect(manualRemainingLegsStillEligible([leg(-1),leg(40)], now)).toBe(false);
});

test("a reduced code without valid kickoff evidence never appears as current", () => {
  expect(manualRemainingLegsStillEligible([{}], now)).toBe(false);
  expect(manualRemainingLegsStillEligible([], now)).toBe(false);
});
