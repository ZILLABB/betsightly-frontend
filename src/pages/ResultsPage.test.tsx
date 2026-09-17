import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api, type LeagueResultsResponse } from "../api/predictions";
import { ResultsPage } from "./ResultsPage";

jest.mock("../api/predictions", () => ({
  api: {
    getLeagueResults: jest.fn(),
    getCalibration: jest.fn(),
    getPerformance: jest.fn(),
  },
}));

jest.mock("../hooks/useFormatOdds", () => ({
  useFormatOdds: () => ({ formatOdds: (odds: number) => odds.toFixed(2), oddsSuffix: "x" }),
}));

jest.mock("../components/common/SEO", () => ({ SEO: () => null }));

const results: LeagueResultsResponse = {
  status: "success",
  days: 30,
  totals: {
    slips: { won: 1, lost: 1, settled: 2, win_rate: 0.5, staked: 2, returned: 2.1, profit: 0.1, roi: 0.05 },
    picks: { won: 1, lost: 1, settled: 2, win_rate: 0.5, staked: 2, returned: 1.3, profit: -0.7, roi: -0.35 },
    combined_profit: -0.6,
  },
  summary: {
    "2_odds": { unit: "slip", won: 1, lost: 0, settled: 1, win_rate: 1, staked: 1, returned: 2.1, profit: 1.1, roi: 1.1 },
    "5_odds": { unit: "slip", won: 0, lost: 1, settled: 1, win_rate: 0, staked: 1, returned: 0, profit: -1, roi: -1 },
    over_1_5: { unit: "pick", won: 1, lost: 1, settled: 2, win_rate: 0.5, staked: 2, returned: 1.3, profit: -0.7, roi: -0.35 },
  },
  history: [
    {
      archive_id: 1,
      date: "2026-09-08",
      category: "2_odds",
      presentation: "accumulator",
      status: "won",
      total_odds: 2.1,
      hit_probability: 0.52,
      picks: [
        { match_id: "a", home_team: "Alpha", away_team: "Beta", prediction: "Over 1.5 Goals", odds: 1.4, status: "won" },
        { match_id: "b", home_team: "Gamma", away_team: "Delta", prediction: "Home or Draw", odds: 1.5, status: "won" },
      ],
    },
    {
      archive_id: 2,
      date: "2026-09-07",
      category: "5_odds",
      presentation: "accumulator",
      status: "lost",
      total_odds: 5.2,
      hit_probability: 0.19,
      picks: [
        { match_id: "c", home_team: "Losing FC", away_team: "Winners United", prediction: "Home Win", odds: 1.8, status: "lost" },
      ],
    },
    {
      archive_id: 3,
      date: "2026-09-08",
      category: "over_1_5",
      presentation: "singles",
      status: "lost",
      total_odds: 6.04,
      hit_probability: 0.7,
      picks: [
        { match_id: "d", home_team: "Single One", away_team: "Single Two", prediction: "Over 1.5 Goals", odds: 1.3, status: "won" },
        { match_id: "e", home_team: "Single Three", away_team: "Single Four", prediction: "Over 1.5 Goals", odds: 1.4, status: "lost" },
      ],
    },
  ],
  rollover_history: [
    ...[1, 2, 3].map(day => ({
      chain_start_date: "2026-09-01",
      day_number: day,
      date: `2026-09-0${day}`,
      picks: [{ match_id: `r${day}`, match: "Rollover match", home_team: `Home ${day}`, away_team: `Away ${day}`, market: "goals" as const, prediction: "Over 1.5 Goals", odds: 2, confidence: 0.72, status: "won" as const }],
      combined_odds: 2,
      avg_confidence: 0.72,
      status: "won" as const,
    })),
    { chain_start_date: "2026-08-28", day_number: 1, date: "2026-08-28", picks: [{ match_id: "rf", match: "Failed", home_team: "Failed Home", away_team: "Failed Away", market: "goals", prediction: "Under 3.5", odds: 2.1, confidence: 0.7, status: "lost" }], combined_odds: 2.1, avg_confidence: 0.7, status: "lost" },
  ],
  by_date: {},
};

const calibration = {
  status: "success",
  total_legs: 40,
  hit_rate: 0.76,
  avg_predicted: 0.75,
  bias: -0.01,
  buckets: [{ range: "70-80%", low: 0.7, high: 0.8, predicted: 0.75, actual: 0.76, sample: 40 }],
};

const mockedApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.getLeagueResults.mockResolvedValue(results);
  mockedApi.getCalibration.mockResolvedValue(calibration);
  mockedApi.getPerformance.mockResolvedValue({ status: "success", days: 90, summary: results.summary, current_policy: { policy_version: "selection-policy-v1.1", settled_unique_forecasts: 40, settled_slips: 12, readiness: "PROVISIONAL", readiness_label: "Provisional sample" } });
});

async function renderLoaded() {
  render(<ResultsPage />);
  await screen.findByText("Accumulator record");
  await screen.findByLabelText("Alpha vs Beta: Over 1.5 Goals, Won");
}

async function click(element: HTMLElement) {
  await act(async () => {
    await userEvent.click(element);
  });
}

test("shows accumulator totals separately from Over 1.5 singles", async () => {
  await renderLoaded();
  const slips = screen.getByText("Accumulator record").closest("article")!;
  const singles = screen.getByRole("heading", { name: "Over 1.5 singles" }).closest("article")!;
  expect(within(slips).getByText("2")).toBeInTheDocument();
  expect(within(slips).getByText("settled slips")).toBeInTheDocument();
  expect(within(singles).getByText("settled singles")).toBeInTheDocument();
  expect(screen.getByText(/win rates are never combined/i)).toBeInTheDocument();
});

test("renders Over 1.5 as independent singles and never shows combined odds", async () => {
  await renderLoaded();
  expect(screen.getAllByText("Over 1.5 singles").length).toBeGreaterThan(0);
  expect(screen.getByText("Independent selections")).toBeInTheDocument();
  expect(screen.getByText("1 won")).toBeInTheDocument();
  expect(screen.getByText("1 lost")).toBeInTheDocument();
  expect(screen.queryByText("6.04x")).not.toBeInTheDocument();
});

test("labels product performance as accumulator or singles", async () => {
  await renderLoaded();
  expect(screen.getAllByText("Accumulator").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Singles").length).toBeGreaterThan(0);
});

test("range selector requests the selected days and refetches", async () => {
  await renderLoaded();
  expect(mockedApi.getLeagueResults).toHaveBeenCalledWith(30);
  await click(screen.getByRole("button", { name: "7D" }));
  await waitFor(() => expect(mockedApi.getLeagueResults).toHaveBeenCalledWith(7));
});

test("status and product filters narrow the history", async () => {
  await renderLoaded();
  await click(screen.getByRole("button", { name: "Lost" }));
  expect(screen.queryByLabelText("Alpha vs Beta: Over 1.5 Goals, Won")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Losing FC vs Winners United: Home Win, Lost")).toBeInTheDocument();
  await click(screen.getByRole("button", { name: "All" }));
  await click(screen.getByRole("button", { name: "5 Odds" }));
  expect(screen.getByLabelText("Losing FC vs Winners United: Home Win, Lost")).toBeInTheDocument();
  expect(screen.queryByLabelText("Single One vs Single Two: Over 1.5 Goals, Won")).not.toBeInTheDocument();
});

test("accumulator history expands and keeps the losing leg visible", async () => {
  await renderLoaded();
  const losingLeg = screen.getByLabelText("Losing FC vs Winners United: Home Win, Lost");
  const details = losingLeg.closest("details") as HTMLDetailsElement;
  expect(details.open).toBe(false);
  fireEvent.click(details.querySelector("summary")!);
  expect(details.open).toBe(true);
  expect(losingLeg.closest(".result-leg")).toHaveClass("result-leg--lost");
  expect(within(details).getAllByText("Lost").length).toBeGreaterThan(0);
});

test("groups rollover days into successful and failed chains", async () => {
  await renderLoaded();
  await click(screen.getByRole("button", { name: "Rollover chains" }));
  expect(screen.getByText("3 / 3 days won · Chain completed")).toBeInTheDocument();
  expect(screen.getByText("Chain failed on Day 1")).toBeInTheDocument();
  expect(screen.getAllByText(/Started/)).toHaveLength(2);
});

test("calibration shows expected, actual, sample and its distinct window", async () => {
  await renderLoaded();
  expect(screen.getByText("180-day calibration window")).toBeInTheDocument();
  expect(screen.getByText("75%")).toBeInTheDocument();
  expect(screen.getByText("76%")).toBeInTheDocument();
  expect(screen.getByText("40 picks")).toBeInTheDocument();
  expect(screen.getByText("+1 pp")).toBeInTheDocument();
});

test("calibration failure does not break verified results", async () => {
  mockedApi.getCalibration.mockRejectedValue(new Error("offline"));
  await renderLoaded();
  expect(screen.getByText("Accumulator record")).toBeInTheDocument();
  expect(await screen.findByText(/Calibration is unavailable right now/)).toBeInTheDocument();
});

test("refresh action is truthful and refetches without claiming to settle", async () => {
  await renderLoaded();
  const refresh = screen.getByRole("button", { name: "Refresh results" });
  expect(screen.queryByText("Check now")).not.toBeInTheDocument();
  await click(refresh);
  await waitFor(() => expect(mockedApi.getLeagueResults).toHaveBeenCalledTimes(2));
});
