import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SlipBuilderPage from "./SlipBuilderPage";
import { api } from "../api/predictions";
import { reviseBuilderSlip } from "../api/builderRevisions";
import { BuilderProvider } from "../contexts/BuilderProvider";

jest.mock("../api/predictions", () => ({ api: { buildSlip: jest.fn() } }));
jest.mock("../api/builderRevisions", () => ({
  reviseBuilderSlip: jest.fn(),
}));
jest.mock("../components/common/SEO", () => ({ SEO: () => null }));
jest.mock("../components/ui/BrandLoader", () => ({ BrandLoader: () => <span>loading</span> }));
jest.mock("../components/predictions/PredictionCard", () => ({ PredictionCard: ({ game }: any) => <div>{game.home_team} v {game.away_team}</div> }));
jest.mock("../components/predictions/BookingCode", () => ({ booking }: any) => (
  <div><span>booking</span>{booking?.share_code && <span data-testid="booking-code">{booking.share_code}</span>}</div>
));
jest.mock("../services/bookingTracking", () => ({ trackProductEvent: jest.fn() }));

const buildSlip = api.buildSlip as jest.Mock;
const reviseSlip = reviseBuilderSlip as jest.Mock;

const renderBuilder = () =>
  render(
    <BuilderProvider>
      <SlipBuilderPage />
    </BuilderProvider>,
  );

beforeEach(() => {
  buildSlip.mockReset();
  reviseSlip.mockReset();
  sessionStorage.clear();
});

const editableSlip = (games: any[] = [{
  selection_id: "leg-a", match_id: "match-a", fixture_id: 1,
  home_team: "Alpha", away_team: "Beta", league: "Test",
  date: "2026-09-10", prediction: "Over 1.5", prediction_type: "goals",
  market: "over_1_5", confidence: .78, evidence_adjusted_probability: .74,
  real_odds: 1.5, odds: 1.5, public_rank: 1,
  trust: { score: 88, evidence_state: "SUPPORTED", evidence_level: "strong", lower_reliability_bound: .70 },
}]) => ({
  status: "success" as const, target: 10, odds: 10.1, legs: games.length,
  hit_probability: .2, lowest_trust_grade: "A" as const,
  builder_run_id: "run-1", edit_token: "token-token-token-token-token-token",
  revision: 1, locked_selection_ids: [], games,
  booking: { status: "active" as const, share_code: "OLD123", booking_status: "FULL" as const },
});

test("shows every editable leg action with accessible button alternatives", async () => {
  buildSlip.mockResolvedValue(editableSlip());
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  await screen.findByRole("button", { name: /why this pick/i });
  expect(screen.getByRole("button", { name: /safer market/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^replace$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^lock$/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /more leg actions/i }));
  expect(screen.getByRole("button", { name: /don't use this game/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /remove and rebuild/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /why this pick/i }));
  expect(screen.getByText(/conservative builder probability/i)).toBeInTheDocument();
});

test("qualifies a verified maximum when the provider board is degraded", async () => {
  buildSlip.mockResolvedValue({
    ...editableSlip(), status: "unavailable", result_status: "QUALITY_CAPPED",
    best_reachable: 8.4, optimization_status: "OPTIMAL",
    board: { ready: true, degraded: true, complete: false, fixture_count: 387,
      successful_league_count: 99, requested_league_count: 116,
      failed_league_count: 17 },
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  expect(await screen.findByText(/verified maximum on the current board/i)).toBeInTheDocument();
  expect(screen.getByText(/some competitions were unavailable/i)).toBeInTheDocument();
});

test("hides the old code immediately and shows only the verified revision code", async () => {
  let finish!: (value: unknown) => void;
  buildSlip.mockResolvedValue(editableSlip());
  reviseSlip.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  await screen.findByTestId("booking-code");
  fireEvent.click(screen.getByRole("button", { name: /^replace$/i }));
  expect(screen.queryByTestId("booking-code")).not.toBeInTheDocument();
  await act(async () => finish({
    ...editableSlip(), revision: 2,
    booking: { status: "active", share_code: "NEW456", booking_status: "FULL" },
  }));
  expect(await screen.findByText("NEW456")).toBeInTheDocument();
  expect(screen.queryByText("OLD123")).not.toBeInTheDocument();
});

test("Replace keeps the slip visible then swaps exactly one different fixture", async () => {
  const gameA = editableSlip().games![0];
  const gameB = { ...gameA, selection_id: "leg-b", match_id: "match-b",
    fixture_id: 2, home_team: "Gamma", away_team: "Delta" };
  const gameC = { ...gameA, selection_id: "leg-c", match_id: "match-c",
    fixture_id: 3, home_team: "Roma", away_team: "Torino" };
  let finish!: (value: unknown) => void;
  buildSlip.mockResolvedValue(editableSlip([gameA, gameB]));
  reviseSlip.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  const replace = await screen.findAllByRole("button", { name: /^replace$/i });
  fireEvent.click(replace[0]);
  expect(screen.getByText("Alpha v Beta")).toBeInTheDocument();
  expect(screen.getByText("Gamma v Delta")).toBeInTheDocument();
  expect(screen.getByText(/Finding a different game/i)).toBeInTheDocument();
  expect(reviseSlip).toHaveBeenCalledWith(expect.objectContaining({
    action: "replace_selection", selectionId: "leg-a", fixtureId: "match-a",
  }), expect.any(AbortSignal));
  await act(async () => finish({
    ...editableSlip([gameC, gameB]), revision: 2,
    change_summary: { action: "replace_selection", removed: [gameA],
      added: [gameC], old_odds: 10.1, new_odds: 10.3 },
    booking: { status: "active", share_code: "NEW789",
      booking_status: "FULL", readback_validation: "PASSED" },
  }));
  await screen.findByText("Roma v Torino");
  await waitFor(() =>
    expect(screen.queryByText("Alpha v Beta")).not.toBeInTheDocument(),
  );
  expect(screen.getByText("Gamma v Delta")).toBeInTheDocument();
  expect(screen.getByText(/Game replaced/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Leg 0[12]/i)).toHaveLength(2);
});

test("rejects a same-fixture market response and keeps the old card", async () => {
  const old = editableSlip().games![0];
  const sameFixture = { ...old, selection_id: "leg-alt",
    market: "under_4_5", prediction: "Under 4.5" };
  buildSlip.mockResolvedValue(editableSlip([old]));
  reviseSlip.mockResolvedValue({
    ...editableSlip([sameFixture]), revision: 2,
    change_summary: { action: "replace_selection", removed: [old],
      added: [sameFixture] },
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  fireEvent.click(await screen.findByRole("button", { name: /^replace$/i }));
  expect(await screen.findByText(/No suitable replacement found/i))
    .toBeInTheDocument();
  expect(screen.getByText("Alpha v Beta")).toBeInTheDocument();
});

test("failed Replace keeps both cards and reports local no-change", async () => {
  const gameA = editableSlip().games![0];
  const gameB = { ...gameA, selection_id: "leg-b", match_id: "match-b",
    fixture_id: 2, home_team: "Gamma", away_team: "Delta" };
  buildSlip.mockResolvedValue(editableSlip([gameA, gameB]));
  reviseSlip.mockResolvedValue({
    ...editableSlip([gameA, gameB]), revision_status: "no_change",
    action_error: "No different approved fixture is available.",
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  fireEvent.click((await screen.findAllByRole("button", { name: /^replace$/i }))[0]);
  expect(await screen.findByText(/No suitable replacement found/i))
    .toBeInTheDocument();
  expect(screen.getByText("Alpha v Beta")).toBeInTheDocument();
  expect(screen.getByText("Gamma v Delta")).toBeInTheDocument();
});

test("lock state persists in the atomically returned revision", async () => {
  buildSlip.mockResolvedValue(editableSlip());
  reviseSlip.mockResolvedValue({
    ...editableSlip(), revision: 2, locked_selection_ids: ["leg-a"],
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  fireEvent.click(await screen.findByRole("button", { name: /^lock$/i }));
  expect(await screen.findByRole("button", { name: /^unlock$/i })).toBeInTheDocument();
});

test("an older edit response cannot overwrite a newer revision", async () => {
  const gameB = { ...editableSlip().games![0], selection_id: "leg-b", match_id: "match-b", fixture_id: 2, home_team: "Gamma" };
  let first!: (value: unknown) => void;
  let second!: (value: unknown) => void;
  buildSlip.mockResolvedValue(editableSlip([editableSlip().games![0], gameB]));
  reviseSlip
    .mockReturnValueOnce(new Promise((resolve) => { first = resolve; }))
    .mockReturnValueOnce(new Promise((resolve) => { second = resolve; }));
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  const replace = await screen.findAllByRole("button", { name: /^replace$/i });
  fireEvent.click(replace[0]);
  fireEvent.click(replace[1]);
  await act(async () => second(editableSlip([{ ...gameB, home_team: "Newest" }] )));
  await screen.findByText(/Newest v Beta/i);
  await act(async () => first(editableSlip([{ ...gameB, home_team: "Obsolete" }] )));
  expect(screen.queryByText(/Obsolete v Beta/i)).not.toBeInTheDocument();
  expect(screen.getByText(/Newest v Beta/i)).toBeInTheDocument();
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

test("does not offer an unusable CTA below the public 2x minimum", async () => {
  buildSlip.mockResolvedValue({
    status: "unavailable", result_status: "QUALITY_CAPPED", target: 10,
    best_reachable: 1.18, optimization_status: "OPTIMAL",
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  expect(await screen.findByText(/below the Builder’s 2x minimum/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /build verified 1.18x/i }))
    .not.toBeInTheDocument();
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

test("uses horizon-aware board refresh copy", async () => {
  buildSlip.mockResolvedValue({
    status: "unavailable", target: 50, reason: "board_refreshing",
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /today only/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));
  expect(await screen.findByText(/Today’s board is being evaluated/i)).toBeInTheDocument();
  expect(screen.queryByText(/weekly predictions/i)).not.toBeInTheDocument();
});

test("turns a network failure into a clean retry state without losing choices", async () => {
  buildSlip.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValueOnce({ status: "unavailable", target: 100 });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /100x high target/i }));
  fireEvent.click(screen.getByRole("button", { name: /today only/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 100x slip/i }));
  expect(await screen.findByText(/could not reach the prediction service/i)).toBeInTheDocument();
  expect(screen.queryByText(/Failed to fetch/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^try again$/i }));
  await waitFor(() => expect(buildSlip).toHaveBeenLastCalledWith(100, "today", false));
});

test("times out an edit, clears pending state, and preserves the original slip", async () => {
  jest.useFakeTimers();
  buildSlip.mockResolvedValue(editableSlip());
  reviseSlip.mockImplementation((_input, signal: AbortSignal) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));
  await screen.findByTestId("booking-code");
  fireEvent.click(screen.getByRole("button", { name: /^lock$/i }));
  expect(screen.getByRole("button", { name: /^lock$/i })).toBeDisabled();
  await act(async () => { jest.advanceTimersByTime(20_000); });
  expect(await screen.findByText(/original slip was kept; try again/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^lock$/i })).toBeEnabled();
  expect(screen.getByTestId("booking-code")).toHaveTextContent("OLD123");
  jest.useRealTimers();
});

test.each([10, 20, 30, 50, 70, 100])("selects and submits the %ix target", async (target) => {
  buildSlip.mockResolvedValue({ status: "unavailable", target });
  renderBuilder();
  const band = target <= 20 ? "lower target" : target <= 50 ? "balanced" : "high target";
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${target}x ${band}$`, "i") }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`build my ${target}x slip`, "i") }));
  await waitFor(() => expect(buildSlip).toHaveBeenCalledWith(target, "week", false));
});

test("accepts a bounded custom target up to 200x", async () => {
  buildSlip.mockResolvedValue({ status: "unavailable", target: 125 });
  renderBuilder();
  fireEvent.change(screen.getByLabelText(/custom target/i), { target: { value: "125" } });
  fireEvent.click(screen.getByRole("button", { name: /use target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 125x slip/i }));
  await waitFor(() => expect(buildSlip).toHaveBeenCalledWith(125, "week", false));
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
