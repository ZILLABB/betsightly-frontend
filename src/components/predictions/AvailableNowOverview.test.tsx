import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AvailableNowOverview } from "./AvailableNowOverview";

jest.mock("../../hooks/useFormatOdds", () => ({
  useFormatOdds: () => ({ formatOdds: (v: number) => v.toFixed(2), oddsSuffix: "x" }),
}));

const future = (code: string, editorial_manual = false) => ({
  selected: true, editorial_manual, risk_level: "low", total_odds: 2.05,
  games: [{ fixture_id: 1, match_id: "1", home_team: "Home", away_team: "Away", odds: 1.4 }],
  booking: { status: "active", booking_status: "FULL", readback_validation: "PASSED",
    actionable: true, share_code: code, actual_sportybet_odds: 2.03 },
});

test("shows verified tiers and share codes from the fresh card, even if 2 Odds is empty", () => {
  const onSelect = jest.fn();
  render(<AvailableNowOverview accumulators={{
    banker: future("LIVE42"),
    "2_odds": { selected:false, games:[], total_odds:0, risk_level:"low" },
    "5_odds": { selected:false, games:[], total_odds:0, risk_level:"medium" },
    "10_odds": { selected:false, games:[], total_odds:0, risk_level:"high" },
    over_1_5: { selected:false, games:[], total_odds:0, risk_level:"low" },
    rollover: { selected:false, games:[], total_odds:0, risk_level:"low" },
  } as any} onSelect={onSelect} />);
  expect(screen.getByRole("heading", {name:/1 verified ticket available/i})).toBeInTheDocument();
  expect(screen.getByText("LIVE42")).toBeInTheDocument();
  expect(screen.getByText(/Verified bookmaker quote:/)).toBeInTheDocument();
  expect(screen.getByText("2.03x")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {name:/view matches & copy code/i}));
  expect(onSelect).toHaveBeenCalledWith("banker");
});
test("manual category with valid exact bookmaker code is visible but not model-scored", () => {
  render(<AvailableNowOverview accumulators={{
    "2_odds":future("MANUAL",true),
  } as any} onSelect={jest.fn()} />);
  expect(screen.getByText("MANUAL")).toBeInTheDocument();
  expect(screen.getByText(/Admin-curated/)).toBeInTheDocument();
});
test("never displays invalid or missing codes as verified", () => {
  const {container} = render(<AvailableNowOverview accumulators={{
    "2_odds": {...future("BAD"), booking:{status:"invalid", share_code:"BAD"}},
  } as any} onSelect={jest.fn()}/>);
  expect(container).toBeEmptyDOMElement();
});
