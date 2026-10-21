import { preferredBookableTier, verifiedBookableTierKeys } from "./bookableTiers";

const tier = (code: string, overrides = {}) => ({
  selected: true, games: [{ match_id: "fixture", home_team: "A", away_team: "B" }],
  total_odds: 2.1, booking: {
    status: "active", booking_status: "FULL", readback_validation: "PASSED",
    actionable: true, share_code: code,
  }, ...overrides,
});

test("chooses a currently verified code if 2 Odds was withheld", () => {
  const board = { "2_odds": {selected:false,games:[]}, banker:tier("BK1234"), "5_odds":tier("FIVE54") } as any;
  expect(verifiedBookableTierKeys(board)).toContain("banker");
  expect(preferredBookableTier(board, "2_odds")).toBe("banker");
  expect(preferredBookableTier(board, "5_odds")).toBe("5_odds");
});
test("manual editorial tickets are eligible if fully verified by SportyBet", () => {
  const board = {"2_odds":tier("MANU12", {editorial_manual:true})} as any;
  expect(verifiedBookableTierKeys(board)).toContain("2_odds");
});
test("unverified, nonactionable, expired and missing codes are never advertised", () => {
  const board = {
    banker: tier("OUTDATED",{booking:{status:"expired",share_code:"OUTDATED"}}),
    "2_odds":tier("BAD",{booking:{status:"active",share_code:"BAD",readback_validation:"FAILED"}}),
    "5_odds":tier("", {booking:{status:"active",share_code:""}}),
    "10_odds":tier("SOME10",{booking:{status:"active",share_code:"SOME10",actionable:false}}),
    over_1_5:tier("AB1234",{booking:{status:"active",share_code:"AB1234",booking_status:"PARTIAL"}}),
  } as any;
  expect(verifiedBookableTierKeys(board)).toEqual([]);
});
test("does not classify rollover as a freshly created replacement", () => {
  const board = {rollover:tier("ROLL12")} as any;
  expect(verifiedBookableTierKeys(board)).toEqual([]);
});
