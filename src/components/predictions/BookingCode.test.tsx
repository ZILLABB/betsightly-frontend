import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { trackBookingEvent } from "../../services/bookingTracking";
import "@testing-library/jest-dom";

import BookingCode from "./BookingCode";
import { CATEGORIES } from "../../types";

jest.mock("../../services/bookingTracking", () => ({
  trackBookingEvent: jest.fn(),
}));

const category = CATEGORIES.find((item) => item.key === "5_odds")!;
const singlesCategory = CATEGORIES.find((item) => item.key === "over_1_5")!;

test("missing booking never promises an automatic code that may not be running", () => {
  const onShowBookable = jest.fn();
  render(<BookingCode category={category} onShowBookable={onShowBookable}/>);
  expect(screen.getByRole("status")).toHaveTextContent("No verified SportyBet code");
  expect(screen.queryByText(/creating sportybet code|update automatically/i)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /show what i can still bet/i }));
  expect(onShowBookable).toHaveBeenCalledTimes(1);
});

test("permanent unavailability does not remain pending", () => {
  render(<BookingCode category={category} booking={{
    status: "unavailable", booking_status: "UNAVAILABLE",
    reason: "Exact selection is not currently offered.",
  }} />);
  expect(screen.getByText("Slip ready, code unavailable")).toBeInTheDocument();
  expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
});

test("active validated code appears immediately", () => {
  render(<BookingCode category={category} booking={{
    status: "active", booking_status: "FULL", share_code: "READY1",
    readback_validation: "PASSED",
  }} />);
  expect(screen.getByText("READY1")).toBeInTheDocument();
  expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
});

test("singles convenience code stays labelled as an accumulator ticket", () => {
  render(<BookingCode category={singlesCategory} booking={{
    status: "active", booking_status: "FULL", share_code: "SINGLE1",
    ticket_type: "accumulator", priced_at: "2026-09-20T19:45:00Z",
  }} />);
  expect(screen.getByText("SportyBet accumulator share-code ticket")).toBeInTheDocument();
  expect(screen.getByText(/underlying picks are intended as separate singles/i))
    .toBeInTheDocument();
  expect(screen.getByText(/Priced at \d{2}:\d{2} \S+\./)).toBeInTheDocument();
});

test.each([
  ["started", "one or more matches have started"],
  ["kickoff_buffer", "within 20 minutes"],
  ["expired", "has expired"],
] as const)("%s code never exposes copy or open actions", (status, message) => {
  const onShowBookable = jest.fn();
  render(<BookingCode category={category} onShowBookable={onShowBookable} booking={{
    status, lifecycle_status: status, actionable: false,
    share_code: "STALE1", share_url: "https://example.test/stale",
  }} />);
  expect(screen.getByText(new RegExp(message, "i"))).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /copy code/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /open sportybet/i })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /show what i can still bet/i }))
    .toBeInTheDocument();
});

test("excluded fixture facts override an unrelated kickoff reason", () => {
  render(<BookingCode category={category} booking={{
    status: "kickoff_buffer", actionable: false,
    reason: "a fixture starts within 20 minutes",
    excluded_legs: [
      { home_team: "Alpha", away_team: "Beta", market: "over_1_5",
        status: "FIXTURE_NOT_FOUND" },
      { home_team: "Gamma", away_team: "Delta", market: "home_or_draw",
        status: "FIXTURE_NOT_FOUND" },
      { home_team: "Epsilon", away_team: "Zeta", market: "under_4_5",
        status: "FIXTURE_NOT_FOUND" },
    ],
  }} />);
  expect(screen.getByText(
    "3 selections could not be matched on the current SportyBet board.",
  )).toBeInTheDocument();
  expect(screen.getAllByText(/fixture unavailable on the current SportyBet board/i))
    .toHaveLength(3);
  expect(screen.queryByText(/FIXTURE_NOT_FOUND/)).not.toBeInTheDocument();
  expect(screen.queryByText(/starts within 20 minutes/i)).not.toBeInTheDocument();
});


test("homepage booking without explicit tracking counts successful copy and SportyBet click", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText },
  });
  const tracker = trackBookingEvent as jest.Mock;
  tracker.mockClear();
  render(<BookingCode category={category} booking={{
    status: "active", booking_status: "FULL", share_code: "READY2",
    share_url: "https://www.sportybet.com/ng/?shareCode=READY2",
    readback_validation: "PASSED",
  }} />);
  fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith("READY2"));
  await waitFor(() => expect(tracker).toHaveBeenCalledWith("booking_code_copied", expect.objectContaining({
    source: "daily_card", tier: category.key, bookingStatus: "FULL",
  })));
  fireEvent.click(screen.getByRole("link", { name: /open sportybet/i }));
  expect(tracker).toHaveBeenCalledWith("sportybet_opened", expect.objectContaining({
    source: "daily_card", tier: category.key, bookingStatus: "FULL",
  }));
});

test("shows an archived verified code for reference but not for bookmaker booking", () => {
  render(<BookingCode category={category} booking={{
    status: "started", lifecycle_status: "started", actionable: false,
    share_code: "OLDXYZ", readback_validation: "PASSED",
    reason: "At least one fixture has started.",
  }}/>);
  expect(screen.getByText("OLDXYZ")).toBeInTheDocument();
  expect(screen.getByText(/reference only; not placeable/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /copy code/i })).toBeNull();
  expect(screen.queryByRole("link", { name: /open sportybet/i })).toBeNull();
});

test("a contradictory saved booking cannot display a placeable share code", () => {
  render(<BookingCode category={category} blockedReason="Ticket leg mismatch" booking={{
    status: "active", lifecycle_status: "active", actionable: true,
    share_code: "WRONG1", readback_validation: "PASSED",
  }}/>);
  expect(screen.getByText("Ticket needs verification")).toBeInTheDocument();
  expect(screen.getByText("Ticket leg mismatch")).toBeInTheDocument();
  expect(screen.queryByText("WRONG1")).toBeNull();
  expect(screen.queryByRole("button", { name: /copy code/i })).toBeNull();
});

test("the backend may retain only a historical reference after clearing actionable code", () => {
  render(<BookingCode category={category} booking={{
    status: "started", lifecycle_status: "started", actionable: false,
    share_code: null, historical_share_code: "ARCH28",
    readback_validation: "PASSED",
  }}/>);
  expect(screen.getByText("ARCH28")).toBeInTheDocument();
  expect(screen.getByText(/reference only; not placeable/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /copy code/i })).toBeNull();
  expect(screen.queryByRole("link", { name: /open sportybet/i })).toBeNull();
});

test("archive reference is hidden if ticket-leg integrity is blocked", () => {
  render(<BookingCode category={category}
    blockedReason="Ticket identity mismatch"
    booking={{ status: "started", actionable: false, share_code: null,
      historical_share_code: "WRONG999", readback_validation: "PASSED" }}/>);
  expect(screen.queryByText("WRONG999")).toBeNull();
  expect(screen.getByText("Ticket identity mismatch")).toBeInTheDocument();
});
