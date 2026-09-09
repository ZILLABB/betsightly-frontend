import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HomePage } from "./HomePage";
import { usePredictions } from "../hooks/usePredictions";

jest.mock("../hooks/usePredictions", () => ({ usePredictions: jest.fn() }));
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
  date: "2026-09-09T18:00:00Z",
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

test("homepage presents Over 1.5 as independent picks, never a multiplied slip", () => {
  render(<HomePage />);
  fireEvent.click(screen.getByRole("button", { name: /Over 1\.5 3 picks/i }));

  expect(screen.getByText("Over 1.5 Singles")).toBeInTheDocument();
  expect(screen.getByText(/3 independent picks · bet separately/)).toBeInTheDocument();
  expect(screen.queryByText("Over 1.5 Accumulator")).not.toBeInTheDocument();
  expect(screen.queryByText(/All 3 legs land about/)).not.toBeInTheDocument();
  expect(screen.queryByText("6.04x")).not.toBeInTheDocument();
  expect(screen.getByText("Independent picks")).toBeInTheDocument();
});
