import { act, renderHook, waitFor } from "@testing-library/react";
import { api } from "../api/predictions";
import { cardActionability, useActionableCard } from "./useActionableCard";

jest.mock("../api/predictions", () => ({
  api: { getBookableNow: jest.fn() },
}));

const category = (kickoff: string, bookingStatus: "active" | "unavailable" = "active") => ({
  selected: true,
  total_odds: 1.8,
  risk_level: "low",
  games: [{
    fixture_id: 1,
    match_id: "1",
    home_team: "Home",
    away_team: "Away",
    league: "Test",
    date: kickoff,
    kickoff,
    prediction: "Over 1.5 Goals",
    prediction_type: "goals",
    confidence: .8,
    odds: 1.3,
  }],
  booking: bookingStatus === "active"
    ? {
        status: "active",
        actionable: true,
        lifecycle_status: "active",
        booking_status: "FULL",
        share_code: "TEST12",
      }
    : {
        status: "unavailable",
        actionable: false,
        booking_status: "UNAVAILABLE",
      },
});

const empty = {
  selected: false,
  total_odds: 0,
  risk_level: "low",
  games: [],
};

test("keeps a future exact-bookable published card actionable", () => {
  const now = Date.parse("2026-10-01T10:00:00Z");
  const future = "2026-10-01T14:00:00Z";

  const result = cardActionability({
    banker: empty,
    "2_odds": category(future),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
    rollover: empty,
  } as any, now);

  expect(result.needsReplacement).toBe(false);
  expect(result.affectedSelections).toBe(0);
});

test("requires replacement inside the kickoff buffer or after booking failure", () => {
  const now = Date.parse("2026-10-01T10:00:00Z");

  const timing = cardActionability({
    banker: empty,
    "2_odds": category("2026-10-01T10:10:00Z"),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
    rollover: empty,
  } as any, now);

  expect(timing.needsReplacement).toBe(true);

  const unavailable = cardActionability({
    banker: empty,
    "2_odds": category("2026-10-01T14:00:00Z", "unavailable"),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
    rollover: empty,
  } as any, now);

  expect(unavailable.needsReplacement).toBe(true);
});

test("uses Available Now for an explicitly unvalidated modern portfolio only", () => {
  const now = Date.parse("2026-10-01T10:00:00Z");
  const base = {
    banker: empty,
    "2_odds": category("2026-10-01T14:00:00Z"),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
    rollover: empty,
  } as any;

  const valid = cardActionability({
    ...base,
    _portfolio: { portfolio_validation: { valid: true } },
  }, now);
  expect(valid.needsReplacement).toBe(false);
  expect(valid.portfolioIntegrityInvalid).toBe(false);

  const nullValidation = cardActionability({
    ...base,
    _portfolio: { portfolio_validation: null },
  }, now);
  expect(nullValidation.needsReplacement).toBe(true);
  expect(nullValidation.portfolioIntegrityInvalid).toBe(true);
  expect(nullValidation.affectedSelections).toBe(0);

  const invalid = cardActionability({
    ...base,
    _portfolio: { portfolio_validation: { valid: false } },
  }, now);
  expect(invalid.needsReplacement).toBe(true);

  // A historical card with no portfolio diagnostics is not retroactively
  // treated as invalid just because that field did not exist then.
  const legacy = cardActionability(base, now);
  expect(legacy.needsReplacement).toBe(false);
});


test("finishes the available-now request instead of getting stuck loading", async () => {
  const staleKickoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const futureKickoff = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  const published = {
    banker: empty,
    "2_odds": category(staleKickoff),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
    rollover: empty,
  } as any;

  const available = {
    banker: empty,
    "2_odds": category(futureKickoff),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
  };

  const getBookableNow = api.getBookableNow as jest.Mock;
  getBookableNow.mockResolvedValueOnce({
    status: "success",
    available: true,
    accumulators: available,
  });

  const { result } = renderHook(() =>
    useActionableCard(published, "2026-10-01"),
  );

  await waitFor(() => {
    expect(getBookableNow).toHaveBeenCalledTimes(1);
    expect(result.current.viewingBookable).toBe(true);
    expect(result.current.bookableLoading).toBe(false);
  });

  expect(result.current.accumulators?.["2_odds"]?.games?.[0]?.kickoff)
    .toBe(futureKickoff);
});


test("shows a human API failure instead of object-object text", async () => {
  const staleKickoff = new Date(
    Date.now() - 60 * 60 * 1000,
  ).toISOString();

  const getBookableNow = api.getBookableNow as jest.Mock;

  getBookableNow.mockRejectedValueOnce(
    Object.assign(
      new Error("availability_temporarily_unavailable"),
      {
        status: 500,
        reason: "availability_temporarily_unavailable",
      },
    ),
  );

  const { result } = renderHook(() =>
    useActionableCard({
      banker: empty,
      "2_odds": category(staleKickoff),
      "5_odds": empty,
      "10_odds": empty,
      over_1_5: empty,
      rollover: empty,
    } as any, "2026-10-01"),
  );

  await waitFor(() =>
    expect(result.current.bookableError).toBe(true),
  );

  expect(result.current.bookable?.reason)
    .not.toContain("[object Object]");

  expect(result.current.bookable?.reason)
    .toMatch(/availability temporarily unavailable/i);
});

test("portfolio replacement keeps the frozen card available and rejects an invalid live response", async () => {
  const futureKickoff = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const published = {
    banker: empty,
    "2_odds": category(futureKickoff),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
    rollover: empty,
    _portfolio: { portfolio_validation: null },
  } as any;
  const getBookableNow = api.getBookableNow as jest.Mock;
  getBookableNow.mockResolvedValueOnce({
    status: "success",
    available: true,
    accumulators: { ...published, _portfolio: undefined },
    _portfolio: { portfolio_validation: { valid: false } },
  });

  const { result } = renderHook(() => useActionableCard(published, "2026-10-04"));

  await waitFor(() => expect(result.current.bookableError).toBe(true));
  expect(result.current.viewingBookable).toBe(false);
  expect(result.current.accumulators).toBe(published);
  expect(result.current.bookable?.reason).toMatch(/portfolio validation/i);
});

test("portfolio replacement swaps only after valid response and View original restores publication", async () => {
  const futureKickoff = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const published = {
    banker: empty,
    "2_odds": category(futureKickoff),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
    rollover: empty,
    _portfolio: { portfolio_validation: null },
  } as any;
  const replacement = {
    banker: empty,
    "2_odds": category(new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()),
    "5_odds": empty,
    "10_odds": empty,
    over_1_5: empty,
  } as any;
  const getBookableNow = api.getBookableNow as jest.Mock;
  getBookableNow.mockResolvedValueOnce({
    status: "success", available: true, accumulators: replacement,
    _portfolio: { portfolio_validation: { valid: true } },
  });

  const { result } = renderHook(() => useActionableCard(published, "2026-10-04"));
  await waitFor(() => expect(result.current.viewingBookable).toBe(true));
  expect(result.current.accumulators?.["2_odds"]?.games[0].kickoff)
    .toBe(replacement["2_odds"].games[0].kickoff);

  act(() => result.current.showPublished());
  await waitFor(() => expect(result.current.viewingPublishedRecord).toBe(true));
  expect(result.current.accumulators).toBe(published);
});
