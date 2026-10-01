import { renderHook, waitFor } from "@testing-library/react";
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
