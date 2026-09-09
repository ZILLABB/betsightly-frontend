import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AccuracyBadge } from "./AccuracyBadge";
import { api } from "../../api/predictions";

jest.mock("react-router-dom", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
jest.mock("../../api/predictions", () => ({
  api: { getLeagueResults: jest.fn() },
}));

const getLeagueResults = api.getLeagueResults as jest.Mock;

beforeEach(() => getLeagueResults.mockReset());

test("labels 68W and 79L as a 46% 60-day accumulator slip win rate", async () => {
  getLeagueResults.mockResolvedValue({
    summary: {
      over_1_5: { unit: "pick", won: 90, lost: 10 },
      "2_odds": { unit: "slip", won: 68, lost: 79 },
    },
    totals: { slips: { won: 68, lost: 79, settled: 147 } },
  });

  render(<AccuracyBadge />);

  expect(await screen.findByText("46% accumulator slip win rate · 68W-79L"))
    .toBeInTheDocument();
  expect(screen.getByText("147 settled accumulator slips · last 60 days"))
    .toBeInTheDocument();
  expect(screen.queryByText(/accuracy/i)).not.toBeInTheDocument();
});

test("compact badge remains explicit about slip-level results", async () => {
  getLeagueResults.mockResolvedValue({
    summary: { banker: { unit: "slip", won: 1, lost: 1 } },
  });
  render(<AccuracyBadge compact />);
  expect(await screen.findByText("50% slip win rate")).toBeInTheDocument();
});
