import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HomePage } from "./HomePage";
import { usePredictions } from "../hooks/usePredictions";
import { api } from "../api/predictions";

jest.mock("../hooks/usePredictions", () => ({ usePredictions: jest.fn() }));
jest.mock("../api/predictions", () => ({
  api: {
    getBookableNow: jest.fn(),
    getFixtureCompetitionSchedule: jest.fn().mockResolvedValue({
      status: "success", total: 0, leagues: [],
    }),
  },
}));
jest.mock("react-router-dom", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
jest.mock("../hooks/useFormatOdds", () => ({
  useFormatOdds: () => ({ formatOdds: (odds: number) => odds.toFixed(2), oddsSuffix: "x" }),
}));
jest.mock("../components/common/SEO", () => ({ SEO: () => null }));
jest.mock("../components/common/WelcomeBanner", () => ({ WelcomeBanner: () => null }));
jest.mock("../components/common/JoinTelegram", () => ({ JoinTelegram: () => null }));
jest.mock("../components/common/AccuracyBadge", () => ({ AccuracyBadge: () => null }));
jest.mock("../components/predictions/PredictionCard", () => ({
  PredictionCard: ({ game }: any) => <div>{game.home_team}</div>,
}));
jest.mock("../components/predictions/BookingCode", () => () => null);
jest.mock("../components/ui/BrandLoader", () => ({ BrandLoader: ({ children }: any) => children }));

const mockedPredictions = usePredictions as jest.Mock;
const game = (id: number, confidence = 0.75) => ({
  fixture_id: id,
  home_team: `Home ${id}`,
  away_team: `Away ${id}`,
  league: "Test League",
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  kickoff: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  prediction: "Over 1.5 Goals",
  prediction_type: "goals",
  confidence,
  odds: 1.3,
});

beforeEach(() => {
  mockedPredictions.mockReturnValue({
    loading: false,
    error: null,
    refetch: jest.fn(),
    data: {
      date: "2026-09-09",
      accumulators: {
        banker: { selected: false, games: [], total_odds: 0, risk_level: "low" },
        "2_odds": {
          selected: true, games: [game(1), game(2)], total_odds: 2.12,
          hit_probability: 0.58, risk_level: "low", presentation: "accumulator",
        },
        "5_odds": { selected: false, games: [], total_odds: 0, risk_level: "medium" },
        "10_odds": { selected: false, games: [], total_odds: 0, risk_level: "high" },
        over_1_5: {
          selected: true, games: [game(3, 0.8), game(4, 0.82), game(5, 0.78)],
          total_odds: 6.04, hit_probability: 0.8, risk_level: "low", presentation: "singles",
        },
        rollover: { selected: false, games: [], total_odds: 0, risk_level: "low" },
      },
    },
  });
});

test("homepage preserves accumulator odds and joint-probability copy", () => {
  render(<HomePage />);
  expect(screen.getByText("2 Odds Accumulator")).toBeInTheDocument();
  expect(screen.getByText(/All 2 legs land about/)).toBeInTheDocument();
  expect(screen.getAllByText("2.12x").length).toBeGreaterThan(0);
});

test("homepage presents automated Over Goals as singles, not a multiplied slip", () => {
  render(<HomePage />);
  fireEvent.click(screen.getByRole("button", { name: /Over Goals 3 picks/i }));

  expect(screen.getByText("Over Goals Singles")).toBeInTheDocument();
  expect(screen.getByText(/3 independent picks · bet separately/)).toBeInTheDocument();
  expect(screen.queryByText("Over Goals Accumulator")).not.toBeInTheDocument();
  expect(screen.queryByText(/All 3 legs land about/)).not.toBeInTheDocument();
  expect(screen.queryByText("6.04x")).not.toBeInTheDocument();
  expect(screen.getByText("Independent picks")).toBeInTheDocument();
});


test("manual tickets show Not scored in both homepage metrics, never NaN%", () => {
  const existing = mockedPredictions();
  const manualGames = [game(21), game(22)].map(g => ({
    ...g,
    confidence: undefined,
    editorial_manual: true,
    model_probability_available: false,
  }));
  mockedPredictions.mockReturnValue({
    ...existing,
    data: {
      ...existing.data,
      accumulators: {
        ...existing.data.accumulators,
        "2_odds": {
          ...existing.data.accumulators["2_odds"],
          editorial_manual: true,
          games: manualGames,
          hit_probability: null,
        },
      },
    },
  });

  render(<HomePage />);
  expect(screen.getAllByText("Not scored")).toHaveLength(2);
  expect(screen.getByText("Admin-curated ticket · no model confidence score")).toBeInTheDocument();
  expect(screen.getByText("Not evaluated")).toBeInTheDocument();
  expect(screen.getByText("Bookmaker-verified selections")).toBeInTheDocument();
  expect(screen.queryByText("NaN%")).not.toBeInTheDocument();
  expect(screen.queryByText(/All 2 legs land about/)).not.toBeInTheDocument();
});

test("empty tier shows a neutral top-odds fallback, not 0.00x", () => {
  const current = mockedPredictions();
  mockedPredictions.mockReturnValue({
    ...current,
    data: {
      ...current.data,
      accumulators: {
        ...current.data.accumulators,
        "2_odds": { selected: false, games: [], total_odds: 0 },
      },
    },
  });
  render(<HomePage />);
  expect(screen.queryByText("0.00x")).not.toBeInTheDocument();
  expect(screen.getByText("Top odds")).toBeInTheDocument();
});

test("homepage averages only valid model probabilities, not unscored or malformed values", () => {
  const existing = mockedPredictions();
  mockedPredictions.mockReturnValue({
    ...existing,
    data: {
      ...existing.data,
      accumulators: {
        ...existing.data.accumulators,
        "2_odds": {
          ...existing.data.accumulators["2_odds"],
          games: [
            game(1, 0.8),
            { ...game(2, 0), editorial_manual: true, model_probability_available: false },
            game(3, Number.NaN),
            { ...game(4), confidence: undefined },
          ],
        },
      },
    },
  });
  render(<HomePage />);
  expect(screen.getAllByText("80%")).toHaveLength(2);
  expect(screen.queryByText("NaN%")).not.toBeInTheDocument();
});

test("homepage highlights Champions League based on prepared fixtures only", async () => {
  (api.getFixtureCompetitionSchedule as jest.Mock).mockResolvedValueOnce({
    status: "success",
    total: 19,
    leagues: [{ slug: "uefa.champions", name: "UEFA Champions League", count: 19 }],
  });
  render(<HomePage />);
  expect(await screen.findByText("Champions League week")).toBeInTheDocument();
  expect(screen.getByText(/Picks are published only when they meet/)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Today.s Smart Picks/i })).toBeInTheDocument();
});

test("homepage leaves original hero alone if no reliable event calendar", async () => {
  (api.getFixtureCompetitionSchedule as jest.Mock).mockRejectedValueOnce(new Error("offline"));
  render(<HomePage />);
  await waitFor(() => expect(api.getFixtureCompetitionSchedule).toHaveBeenCalled());
  expect(screen.queryByText(/World Cup fixtures ahead|Champions League week/)).not.toBeInTheDocument();
});
