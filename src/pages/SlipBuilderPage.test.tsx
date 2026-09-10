import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

test("explains DNB pushes and shows target-hit probability", async () => {
  buildSlip.mockResolvedValue({
    status: "success",
    target: 50,
    odds: 52.2,
    legs: 2,
    hit_probability: .31,
    target_hit_probability: .36,
    no_loss_probability: .44,
    push_survival_probability: .13,
    dnb_leg_count: 1,
    lowest_trust_grade: "A",
    games: [],
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));
  await waitFor(() => expect(screen.getByText("Target hit chance")).toBeInTheDocument());
  expect(screen.getByText("36.00%")).toBeInTheDocument();
  const explainer = screen.getByText((_, element) =>
    element?.classList.contains("builder-explainer") === true,
  );
  expect(explainer).toHaveTextContent(/A draw on that leg voids it at 1.00x/i);
  expect(explainer).toHaveTextContent(/All-win chance: 31.00%/i);
  expect(explainer).toHaveTextContent(/No-loss chance: 44.00%/i);
});

test("labels a below-target trustworthy result as quality capped", async () => {
  buildSlip.mockResolvedValue({
    status: "unavailable", result_status: "QUALITY_CAPPED", target: 70,
    best_reachable: 43.62,
    reason: "Reaching 70x would require selections that fail quality rules.",
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /70x high target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 70x slip/i }));
  await waitFor(() => expect(screen.getByText(/70x isn’t supported/)).toBeInTheDocument());
  expect(screen.getByRole("button", { name: /43.62x slip/i })).toBeInTheDocument();
});

test("shows board refreshing as a controlled retry state", async () => {
  buildSlip.mockResolvedValue({
    status: "unavailable", target: 50, reason: "board_refreshing",
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));
  await waitFor(() => expect(screen.getByText(/preparing the latest fixture board/i))
    .toBeInTheDocument());
  expect(screen.getByText(/not a CORS error/i)).toBeInTheDocument();
  expect(screen.queryByText(/isn’t supported by the current board/i))
    .not.toBeInTheDocument();
});

test.each([10, 20, 30, 50, 70, 100])("selects and submits the %ix target", async (target) => {
  buildSlip.mockResolvedValue({ status: "unavailable", target });
  renderBuilder();
  const band = target <= 20 ? "lower target" : target <= 50 ? "balanced" : "high target";
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${target}x ${band}$`, "i") }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`build my ${target}x slip`, "i") }));
  await waitFor(() => expect(buildSlip).toHaveBeenCalledWith(target, "week", false));
});

test("switches between today and seven-day windows", async () => {
  buildSlip.mockResolvedValue({ status: "unavailable", target: 50 });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /today only/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));
  await waitFor(() => expect(buildSlip).toHaveBeenCalledWith(50, "today", false));
});

test("best reachable CTA submits its exact target and disables while loading", async () => {
  let finish!: (value: unknown) => void;
  buildSlip
    .mockResolvedValueOnce({ status: "unavailable", result_status: "EXPOSURE_CAPPED",
      target: 100, best_reachable: 6.06, optimization_status: "OPTIMAL" })
    .mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /100x high target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 100x slip/i }));
  const cta = await screen.findByRole("button", { name: /build verified 6.06x slip/i });
  fireEvent.click(cta);
  expect(buildSlip).toHaveBeenLastCalledWith(6.06, "week", false);
  expect(cta).toBeDisabled();
  await act(async () => {
    finish({ status: "success", target: 6.06, odds: 6.1, legs: 0, games: [] });
  });
});

test("active booking is rendered immediately without pending copy", async () => {
  buildSlip.mockResolvedValue({ status: "success", target: 50, odds: 50.1, legs: 0,
    games: [], booking: { status: "active", share_code: "READY1" } });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));
  await screen.findByText("booking");
  expect(screen.queryByText(/code pending/i)).not.toBeInTheDocument();
});
