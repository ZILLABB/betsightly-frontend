import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import BookingCode from "./BookingCode";
import { CATEGORIES } from "../../types";

jest.mock("../../services/bookingTracking", () => ({
  trackBookingEvent: jest.fn(),
}));

const category = CATEGORIES.find((item) => item.key === "5_odds")!;

test("genuine pending booking announces automatic creation", () => {
  render(<BookingCode category={category} />);
  expect(screen.getByRole("status")).toHaveTextContent("Creating SportyBet code");
  expect(screen.getByText(/update automatically/i)).toBeInTheDocument();
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
