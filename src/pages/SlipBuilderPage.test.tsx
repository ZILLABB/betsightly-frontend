import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SlipBuilderPage from "./SlipBuilderPage";
import { api } from "../api/predictions";
import { BuilderProvider } from "../contexts/BuilderProvider";

jest.mock("../api/predictions", () => ({ api: { buildSlip: jest.fn() } }));
jest.mock("../components/common/SEO", () => ({ SEO: () => null }));
jest.mock("../components/ui/BrandLoader", () => ({ BrandLoader: () => <span>loading</span> }));
jest.mock("../components/predictions/PredictionCard", () => ({ PredictionCard: ({ game }: any) => <div>{game.home_team} v {game.away_team}</div> }));
jest.mock("../components/predictions/BookingCode", () => () => <div>booking</div>);
jest.mock("../services/bookingTracking", () => ({ trackProductEvent: jest.fn() }));

const buildSlip = api.buildSlip as jest.Mock;

const renderBuilder = () =>
  render(
    <BuilderProvider>
      <SlipBuilderPage />
    </BuilderProvider>,
  );

beforeEach(() => {
  buildSlip.mockReset();
  sessionStorage.clear();
});
test("prevents duplicate builds while a request is in flight", () => {
  buildSlip.mockReturnValue(new Promise(() => undefined));
 renderBuilder();
  const button = screen.getByRole("button", { name: /build my 50x slip/i });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(buildSlip).toHaveBeenCalledTimes(1);
});

test("shows evidence, break-even context and the responsible staking warning", async () => {
  buildSlip.mockResolvedValue({
    status: "success", target: 50, odds: 52.2, legs: 1,
    hit_probability: .61, lowest_trust_grade: "A", average_trust_score: 88,
    booking: { status: "active", booking_status: "FULL" },
    games: [{ fixture_id: 1, home_team: "Alpha", away_team: "Beta", league: "Test", date: "2026-09-04", prediction: "Over 1.5", prediction_type: "over_1_5", confidence: .72, trust: { score: 88, evidence_state: "SUPPORTED" } }],
  });
renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));
  await waitFor(() => expect(screen.getByText("Your 52.20x slip")).toBeInTheDocument());
  expect(screen.getByText("Bookmaker break-even")).toBeInTheDocument();
  expect(screen.getByText(/Review every match and market yourself/)).toBeInTheDocument();
  expect(screen.getByText("Strong evidence")).toBeInTheDocument();
});
