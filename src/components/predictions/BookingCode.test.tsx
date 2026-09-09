import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import BookingCode from "./BookingCode";
import { CATEGORIES } from "../../types";

jest.mock("../../services/bookingTracking", () => ({
  trackBookingEvent: jest.fn(),
}));

const category = CATEGORIES.find((item) => item.key === "5_odds")!;
const singlesCategory = CATEGORIES.find((item) => item.key === "over_1_5")!;

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
