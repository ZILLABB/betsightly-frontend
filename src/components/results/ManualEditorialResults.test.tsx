import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ManualEditorialResults } from "./ManualEditorialResults";
import { api } from "../../api/predictions";

jest.mock("../../api/predictions", () => ({
  api: { getManualResults: jest.fn() },
}));
const mockResults = api.getManualResults as jest.Mock;
afterEach(() => jest.clearAllMocks());

test("manual 5 Odds settles separately with exact leg outcome and evidence", async () => {
  mockResults.mockResolvedValue({
    status: "success", manual_editorial: true, official_record_unchanged: true,
    results: [{
      date: "2026-10-13", tier: "5_odds", status: "lost",
      total_odds: 5.43, editorial_manual: true,
      games: [{
        home_team: "Arsenal", away_team: "Lille", market: "home_win",
        kickoff: "2026-10-13T20:00:00Z", status: "lost", odds: 1.43,
        settlement_evidence: {home_score: 0, away_score: 1, provider: "espn"},
      }],
    }],
  });
  render(<ManualEditorialResults />);
  expect(await screen.findByText("Manual prediction results")).toBeInTheDocument();
  expect(screen.getByText("Arsenal vs Lille")).toBeInTheDocument();
  expect(screen.getByText("FT 0–1")).toBeInTheDocument();
  expect(screen.getByText(/not included/i)).toBeInTheDocument();
  expect(screen.getByText(/Lost · Admin-curated/i)).toBeInTheDocument();
});

test("no manual ticket does not falsify model record", async () => {
  mockResults.mockResolvedValue({
    status: "success", manual_editorial: true, results: [],
  });
  render(<ManualEditorialResults />);
  expect(await screen.findByText(/No manually published tickets/i)).toBeInTheDocument();
});
