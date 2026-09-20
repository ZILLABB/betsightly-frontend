import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import BookingCode from "./BookingCode";
import { CATEGORIES } from "../../types";

jest.mock("../../services/bookingTracking", () => ({
  trackBookingEvent: jest.fn(),
}));

test("a validated partial Over 1.5 code names its eight-leg accumulator and exclusions", () => {
  const category = CATEGORIES.find(item => item.key === "over_1_5")!;
  render(<BookingCode category={category} booking={{
    status: "active", lifecycle_status: "active", actionable: true,
    share_code: "EIGHT8", readback_validation: "PASSED",
    booking_status: "PARTIAL", partial: true,
    ticket_type: "accumulator", original_leg_count: 10,
    booked_leg_count: 8, excluded_leg_count: 2,
    excluded_legs: [
      { match_id: "1", home_team: "Excluded One", away_team: "Other One", market: "over_1_5" },
      { match_id: "2", home_team: "Excluded Two", away_team: "Other Two", market: "over_1_5" },
    ],
  }} />);
  expect(screen.getByText("EIGHT8")).toBeInTheDocument();
  expect(screen.getByText(/Partial SportyBet ticket:/)).toHaveTextContent("8 of 10");
  expect(screen.getByText(/The code contains only the included selections as ONE accumulator/i))
    .toBeInTheDocument();
  expect(screen.getByText(/Not in code: Excluded One vs Other One/i))
    .toBeInTheDocument();
  expect(screen.getByText(/Not in code: Excluded Two vs Other Two/i))
    .toBeInTheDocument();
});
