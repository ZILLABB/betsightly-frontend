import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SlipBuilderPage from "./SlipBuilderPage";
import { api } from "../api/predictions";
import { reviseBuilderSlip } from "../api/builderRevisions";
import { BuilderProvider } from "../contexts/BuilderProvider";
import { BuilderContext } from "../contexts/BuilderContextInstance";

jest.mock("../api/predictions", () => ({
  api: {
    buildSlip: jest.fn(),
    generateBuilderV2: jest.fn(),
  },
}));
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
const generateBuilderV2 = api.generateBuilderV2 as jest.Mock;
const reviseSlip = reviseBuilderSlip as jest.Mock;

const renderBuilder = () =>
  render(
    <BuilderProvider>
      <SlipBuilderPage />
    </BuilderProvider>,
  );

beforeEach(() => {
  buildSlip.mockReset();
  generateBuilderV2.mockReset();
  reviseSlip.mockReset();
  sessionStorage.clear();

  // Existing page tests describe the returned slip through buildSlip mocks.
  // Proxy the V2 request into that same test double so these tests keep
  // asserting page behavior while the real UI now routes Target Odds via V2.
  generateBuilderV2.mockImplementation((payload: any) =>
    buildSlip(
      payload.target_odds,
      payload.horizon === "7_days" ? "week" : payload.horizon,
      false,
    ),
  );
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

test("preview requests a code only after explicit final confirmation", async () => {
  const preview = {
    ...editableSlip(),
    booking: { status: "not_requested", share_code: null,
      lifecycle_status: "awaiting_confirmation", actionable: false },
  };
  buildSlip.mockResolvedValue(preview);
  reviseSlip.mockResolvedValue({
    ...preview, revision: 2,
    booking: { status: "active", share_code: "FINAL10",
      booking_status: "FULL", readback_validation: "PASSED",
      actionable: true },
  });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /10x lower target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 10x slip/i }));

  const confirm = await screen.findByRole("button", {
    name: /confirm slip and get code/i,
  });
  expect(screen.queryByTestId("booking-code")).not.toBeInTheDocument();
  fireEvent.click(confirm);
  expect(reviseSlip).toHaveBeenCalledWith(expect.objectContaining({
    action: "confirm_booking",
    selectionId: undefined,
    fixtureId: "",
  }), expect.any(AbortSignal));
  expect(await screen.findByText("FINAL10")).toBeInTheDocument();
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
  expect(await screen.findByText("reachable")).toBeInTheDocument();
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
    builder_run_id: "run-capped", edit_token: "token-capped", revision: 1,
    best_reachable_combination: {
      original_requested_target: 70, achieved_odds: 43.62,
      selected_selection_ids: [], selected_fixture_ids: [],
      policy_context: { market_cap: 5, team_to_score_cap: 2, under_cap: 2,
        max_legs: 16, market_cap_policy: "builder_target_aware_v1" },
    },
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

test("100x best reachable CTA materializes its stored combination without a target rerun", async () => {
  let finish!: (value: unknown) => void;
  buildSlip.mockResolvedValueOnce({
    status: "unavailable", result_status: "EXPOSURE_CAPPED",
    target: 100, best_reachable: 36.85, optimization_status: "OPTIMAL",
    builder_run_id: "run-100", edit_token: "token-100", revision: 1,
    best_reachable_combination: {
      original_requested_target: 100, achieved_odds: 36.85,
      selected_selection_ids: [], selected_fixture_ids: [],
      policy_context: { market_cap: 5, team_to_score_cap: 2, under_cap: 2,
        max_legs: 16, market_cap_policy: "builder_target_aware_v1" },
    },
  });
  reviseSlip.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /100x high target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 100x slip/i }));
  const cta = await screen.findByRole("button", { name: /build the best reachable 36.85x slip/i });
  fireEvent.click(cta);
  expect(buildSlip).toHaveBeenCalledTimes(1);
  expect(reviseSlip).toHaveBeenCalledWith(expect.objectContaining({
    runId: "run-100", action: "accept_best_reachable", target: 36.85,
  }), expect.any(AbortSignal));
  expect(screen.getByRole("button", { name: /building the best reachable 36.85x combination/i }))
    .toBeDisabled();
  expect(screen.getByRole("button", { name: /build my 100x slip/i })).toBeInTheDocument();
  await act(async () => {
    finish({
      status: "success", target: 100, original_requested_target: 100,
      materialized_best_reachable: true, best_reachable: 36.85,
      odds: 36.85, legs: 0, games: [], builder_run_id: "run-100",
      edit_token: "token-100", revision: 2,
    });
  });
  expect(await screen.findByText("Requested target")).toBeInTheDocument();
  expect(screen.getByText("Best found available")).toBeInTheDocument();
  expect(screen.getAllByText("36.85x").length).toBeGreaterThan(0);
});

test.each([[50, 19.81], [20, 10.57]])(
  "%ix capped result is accepted through its revision without another build",
  async (requested, best) => {
    buildSlip.mockResolvedValue({
      status: "unavailable", result_status: "QUALITY_CAPPED",
      target: requested, best_reachable: best, optimization_status: "OPTIMAL",
      builder_run_id: `run-${requested}`, edit_token: "token", revision: 1,
      best_reachable_combination: {
        original_requested_target: requested, achieved_odds: best,
        selected_selection_ids: [], selected_fixture_ids: [],
        policy_context: { market_cap: requested === 50 ? 4 : 3,
          team_to_score_cap: 2, under_cap: 2, max_legs: 16,
          market_cap_policy: "builder_target_aware_v1" },
      },
    });
    reviseSlip.mockResolvedValue({
      status: "success", target: requested, odds: best, legs: 0, games: [],
      materialized_best_reachable: true, original_requested_target: requested,
      builder_run_id: `run-${requested}`, edit_token: "token", revision: 2,
    });
    renderBuilder();
    fireEvent.click(screen.getByRole("button", {
      name: new RegExp(`^${requested}x`),
    }));
    fireEvent.click(screen.getByRole("button", {
      name: new RegExp(`build my ${requested}x slip`, "i"),
    }));
    fireEvent.click(await screen.findByRole("button", {
      name: new RegExp(`build the best reachable ${best.toFixed(2)}x slip`, "i"),
    }));
    await waitFor(() => expect(reviseSlip).toHaveBeenCalled());
    expect(buildSlip).toHaveBeenCalledTimes(1);
    expect(reviseSlip).toHaveBeenCalledWith(expect.objectContaining({
      action: "accept_best_reachable", target: best,
    }), expect.any(AbortSignal));
  },
);

test("active booking is rendered immediately without pending copy", async () => {
  buildSlip.mockResolvedValue({ status: "success", target: 50, odds: 50.1, legs: 0,
    games: [], booking: { status: "active", share_code: "READY1" } });
  renderBuilder();
  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));
  await screen.findByText("booking");
  expect(screen.queryByText(/code pending/i)).not.toBeInTheDocument();
});

test("terminal best-available result shows the original target and no cascade CTA", async () => {
  buildSlip.mockResolvedValue({
    status: "success", target: 200, original_requested_target: 200,
    target_reached: false, materialized_best_reachable: true,
    result_status: "BEST_AVAILABLE", best_reachable: 121.34,
    odds: 121.34, legs: 15, games: [],
    reason: "200x could not be reached within BetSightly's current safety limits.",
    booking: { status: "active", share_code: "BEST121" },
    board: { ready: true, degraded: true, complete: false },
  });

  renderBuilder();
  fireEvent.change(screen.getByLabelText(/custom target/i), {
    target: { value: "200" },
  });
  fireEvent.click(screen.getByRole("button", { name: /use target/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my 200x slip/i }));

  expect(await screen.findByText("Best available")).toBeInTheDocument();
  expect(screen.getByText("Best available 121.34x slip")).toBeInTheDocument();
  expect(screen.getByText("Requested target")).toBeInTheDocument();
  expect(screen.getAllByText("200x").length).toBeGreaterThan(0);
  expect(screen.getByText(/best found on the current board; a maximum has not been proven/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /build verified/i })).not.toBeInTheDocument();
  expect(reviseSlip).not.toHaveBeenCalled();
});

test("game-count results use a structural heading and show market balance", async () => {
  buildSlip.mockResolvedValue({
    status: "success",
    mode: "game_count",
    requested_game_count: 20,
    delivered_game_count: 20,
    odds: 48.2,
    legs: 20,
    estimated_all_leg_probability: .000001,
    lowest_trust_grade: "A",
    market_distribution: {
      over_1_5: 14,
      over_2_5: 6,
    },
    market_balance: {
      applied: true,
      requested_markets: ["over_1_5", "over_2_5"],
      target_distribution: {
        over_1_5: 10,
        over_2_5: 10,
      },
      delivered_distribution: {
        over_1_5: 14,
        over_2_5: 6,
      },
      shortfalls: {
        over_2_5: 4,
      },
      quality_floor_preserved: true,
      strategy: "even_requested_markets_then_quality_backfill",
    },
    games: [],
    booking: {
      status: "active",
      booking_status: "FULL",
      share_code: "BAL20",
    },
  });

  renderBuilder();

  fireEvent.click(
    screen.getByRole("button", { name: /number of games/i }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /build best 20 games/i }),
  );

  expect(
    await screen.findByText("20 qualifying games"),
  ).toBeInTheDocument();

  expect(screen.getByText("Market mix")).toBeInTheDocument();

  const marketDistribution = screen.getByLabelText("Market distribution");
  expect(marketDistribution).toHaveTextContent("Over 1.5");
  expect(marketDistribution).toHaveTextContent("Over 2.5");

  expect(
    screen.getByText(/Over 2.5 was 4 picks short/i),
  ).toBeInTheDocument();

  expect(screen.getByText("<0.01%")).toBeInTheDocument();
});

test("strongest results lead with strongest picks instead of total odds", async () => {
  buildSlip.mockResolvedValue({
    status: "success",
    mode: "strongest",
    odds: 62.77,
    legs: 30,
    hit_probability: .000001,
    lowest_trust_grade: "A",
    market_distribution: {
      home_over_0_5: 22,
      over_1_5: 8,
    },
    games: [],
    booking: {
      status: "active",
      booking_status: "FULL",
      share_code: "STR30",
    },
  });

  renderBuilder();

  fireEvent.click(
    screen.getByRole("button", { name: /strongest picks/i }),
  );

  fireEvent.change(
    screen.getByLabelText(/maximum strongest picks/i),
    { target: { value: "30" } },
  );

  fireEvent.click(
    screen.getByRole("button", { name: /build strongest 30 picks/i }),
  );

  expect(
    await screen.findByText("30 strongest qualifying picks"),
  ).toBeInTheDocument();

  expect(screen.getByText("Strongest picks ready")).toBeInTheDocument();
  expect(screen.getByText("Market mix")).toBeInTheDocument();
});


test("partial game-count result shows honest market shortfalls and read-only legs", async () => {
  buildSlip.mockResolvedValue({
    ...editableSlip(),
    mode: "game_count",
    editing_supported: false,
    requested_game_count: 50,
    delivered_game_count: 16,
    shortfall: 34,
    odds: 71.005,
    legs: 16,
    estimated_all_leg_probability: .000001,
    lowest_trust_grade: "A",
    market_distribution: {
      over_1_5: 15,
      home_win: 1,
    },
    market_balance: {
      applied: true,
      requested_markets: ["over_1_5", "home_win", "away_win"],
      target_distribution: {
        over_1_5: 17,
        home_win: 17,
        away_win: 16,
      },
      delivered_distribution: {
        over_1_5: 15,
        home_win: 1,
        away_win: 0,
      },
      shortfalls: {
        over_1_5: 2,
        home_win: 16,
        away_win: 16,
      },
      quality_floor_preserved: true,
      strategy: "even_requested_markets_then_quality_backfill",
    },
    market_availability: {
      over_1_5: {
        target: 17,
        raw: 16,
        after_trust_and_policy: 16,
        approved: 16,
        selected: 15,
        shortfall: 2,
        primary_reason: "FIXTURE_OR_TEAM_DIVERSITY",
      },
      home_win: {
        target: 17,
        raw: 1,
        after_trust_and_policy: 1,
        approved: 1,
        selected: 1,
        shortfall: 16,
        primary_reason: "INSUFFICIENT_APPROVED_SELECTIONS",
      },
      away_win: {
        target: 16,
        raw: 0,
        after_trust_and_policy: 0,
        approved: 0,
        selected: 0,
        shortfall: 16,
        primary_reason: "NO_RAW_CANDIDATES",
      },
    },
    booking: {
      status: "active",
      booking_status: "FULL",
      booked_leg_count: 16,
      original_leg_count: 16,
      share_code: "VD5G95",
      readback_validation: "PASSED",
    },
  });

  renderBuilder();

  fireEvent.click(
    screen.getByRole("button", { name: /number of games/i }),
  );

  fireEvent.change(
    screen.getByLabelText(/number of games/i),
    { target: { value: "50" } },
  );

  fireEvent.click(
    screen.getByRole("button", { name: /build best 50 games/i }),
  );

  expect(
    await screen.findByText("16 of 50 qualifying games"),
  ).toBeInTheDocument();

  expect(
    screen.getByText("Best available game count"),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/Lowest selected grade:\s*A/i),
  ).toBeInTheDocument();

  const mix = screen.getByLabelText("Market distribution");

  expect(mix).toHaveTextContent("Over 1.5");
  expect(mix).toHaveTextContent("15 / 17");
  expect(mix).toHaveTextContent("Home Win");
  expect(mix).toHaveTextContent("1 / 17");
  expect(mix).toHaveTextContent("Away Win");
  expect(mix).toHaveTextContent("0 / 16");

  expect(
    screen.getByText(/only 16 of 50 requested games passed/i),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/Away Win: no qualifying candidate was available/i),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/Home Win: only 1 approved selection passed all current gates/i),
  ).toBeInTheDocument();

  expect(screen.getByText("Shortfall")).toBeInTheDocument();
  expect(screen.getByText("34")).toBeInTheDocument();

  expect(screen.getByText("Review this slip")).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: /why this pick/i }),
  ).toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: /safer market/i }),
  ).not.toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: /^replace$/i }),
  ).not.toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: /^lock$/i }),
  ).not.toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: /more leg actions/i }),
  ).not.toBeInTheDocument();

  expect(
    screen.queryByText(/remaining slots were filled only/i),
  ).not.toBeInTheDocument();
});

test("complete game-count result may explain market backfill without calling it partial", async () => {
  buildSlip.mockResolvedValue({
    status: "success",
    mode: "game_count",
    editing_supported: false,
    requested_game_count: 20,
    delivered_game_count: 20,
    shortfall: 0,
    odds: 48.2,
    legs: 20,
    estimated_all_leg_probability: .000001,
    lowest_trust_grade: "A",
    market_distribution: {
      over_1_5: 14,
      over_2_5: 6,
    },
    market_balance: {
      applied: true,
      requested_markets: ["over_1_5", "over_2_5"],
      target_distribution: {
        over_1_5: 10,
        over_2_5: 10,
      },
      delivered_distribution: {
        over_1_5: 14,
        over_2_5: 6,
      },
      shortfalls: {
        over_2_5: 4,
      },
      quality_floor_preserved: true,
      strategy: "even_requested_markets_then_quality_backfill",
    },
    games: [],
    booking: {
      status: "active",
      booking_status: "FULL",
      share_code: "FULL20",
    },
  });

  renderBuilder();

  fireEvent.click(
    screen.getByRole("button", { name: /number of games/i }),
  );

  fireEvent.click(
    screen.getByRole("button", { name: /build best 20 games/i }),
  );

  expect(
    await screen.findByText("20 qualifying games"),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/remaining slots were filled only/i),
  ).toBeInTheDocument();

  expect(
    screen.queryByText(/20 of 20 qualifying games/i),
  ).not.toBeInTheDocument();
});

test("safe broader fill explains requested and fallback picks honestly", async () => {
  buildSlip.mockResolvedValue({
    status: "success",
    mode: "game_count",
    editing_supported: false,
    fill_strategy: "selected_first_then_eligible",
    requested_game_count: 30,
    delivered_game_count: 22,
    requested_market_leg_count: 14,
    fallback_market_leg_count: 8,
    fallback_market_distribution: {
      under_4_5: 3,
      home_or_draw: 5,
    },
    fallback_markets_used: ["home_or_draw", "under_4_5"],
    shortfall: 8,
    odds: 41.2,
    legs: 22,
    estimated_all_leg_probability: .000001,
    lowest_trust_grade: "A",
    market_distribution: {
      over_1_5: 13,
      home_win: 1,
      under_4_5: 3,
      home_or_draw: 5,
    },
    market_balance: {
      applied: true,
      requested_markets: ["over_1_5", "home_win"],
      target_distribution: {
        over_1_5: 15,
        home_win: 15,
      },
      delivered_distribution: {
        over_1_5: 13,
        home_win: 1,
      },
      shortfalls: {
        over_1_5: 2,
        home_win: 14,
      },
      quality_floor_preserved: true,
      strategy: "even_requested_markets_then_quality_backfill_then_eligible",
      fill_strategy: "selected_first_then_eligible",
      requested_market_leg_count: 14,
      fallback_market_leg_count: 8,
      fallback_market_distribution: {
        under_4_5: 3,
        home_or_draw: 5,
      },
      fallback_markets_used: ["home_or_draw", "under_4_5"],
    },
    market_availability: {
      over_1_5: {
        target: 15,
        raw: 14,
        after_trust_and_policy: 14,
        approved: 14,
        selected: 13,
        shortfall: 2,
        primary_reason: "FIXTURE_OR_TEAM_DIVERSITY",
      },
      home_win: {
        target: 15,
        raw: 1,
        after_trust_and_policy: 1,
        approved: 1,
        selected: 1,
        shortfall: 14,
        primary_reason: "INSUFFICIENT_APPROVED_SELECTIONS",
      },
    },
    games: [],
    booking: {
      status: "active",
      booking_status: "FULL",
      share_code: "SAFE22",
      readback_validation: "PASSED",
    },
  });

  renderBuilder();

  fireEvent.click(screen.getByRole("button", { name: /number of games/i }));
  fireEvent.click(screen.getByRole("button", { name: /over 1.5/i }));
  fireEvent.click(
    screen.getByRole("button", {
      name: /fill safely from other eligible markets/i,
    }),
  );
  fireEvent.change(
    screen.getByLabelText(/number of games/i),
    { target: { value: "30" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: /build best 30 games/i }),
  );

  expect(
    await screen.findByText("22 of 30 qualifying games"),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/selected markets produced 14 qualifying picks/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/added 8 picks from other eligible markets/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/stopped at 22 of 30/i),
  ).toBeInTheDocument();

  expect(screen.getByText("Selected-market picks")).toBeInTheDocument();
  expect(screen.getByText("Other eligible picks")).toBeInTheDocument();

  const fallback = screen.getByLabelText("Fallback market distribution");
  expect(fallback).toHaveTextContent("Under 4.5");
  expect(fallback).toHaveTextContent("3");
  expect(fallback).toHaveTextContent("Home / Draw");
  expect(fallback).toHaveTextContent("5");

  const requested = screen.getByLabelText("Market distribution");
  expect(requested).toHaveTextContent("Over 1.5");
  expect(requested).toHaveTextContent("13 / 15");
  expect(requested).toHaveTextContent("Home Win");
  expect(requested).toHaveTextContent("1 / 15");
});

test("safe fill says when selected markets alone were enough", async () => {
  buildSlip.mockResolvedValue({
    status: "success",
    mode: "game_count",
    editing_supported: false,
    fill_strategy: "selected_first_then_eligible",
    requested_game_count: 10,
    delivered_game_count: 10,
    requested_market_leg_count: 10,
    fallback_market_leg_count: 0,
    fallback_market_distribution: {},
    fallback_markets_used: [],
    shortfall: 0,
    odds: 12.4,
    legs: 10,
    estimated_all_leg_probability: .01,
    lowest_trust_grade: "A",
    market_distribution: { over_1_5: 10 },
    market_balance: {
      applied: true,
      requested_markets: ["over_1_5"],
      target_distribution: { over_1_5: 10 },
      delivered_distribution: { over_1_5: 10 },
      shortfalls: {},
      quality_floor_preserved: true,
      strategy: "quality_first",
      fill_strategy: "selected_first_then_eligible",
      requested_market_leg_count: 10,
      fallback_market_leg_count: 0,
      fallback_market_distribution: {},
      fallback_markets_used: [],
    },
    games: [],
    booking: {
      status: "active",
      booking_status: "FULL",
      share_code: "NOFALL",
      readback_validation: "PASSED",
    },
  });

  renderBuilder();

  fireEvent.click(screen.getByRole("button", { name: /number of games/i }));
  fireEvent.click(screen.getByRole("button", { name: /over 1.5/i }));
  fireEvent.click(
    screen.getByRole("button", {
      name: /fill safely from other eligible markets/i,
    }),
  );
  fireEvent.change(
    screen.getByLabelText(/number of games/i),
    { target: { value: "10" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: /build best 10 games/i }),
  );

  expect(
    await screen.findByText("10 qualifying games"),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/selected markets alone filled the requested game count/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Fallback market distribution"),
  ).not.toBeInTheDocument();
});

test("manual selection changes use dedicated recovery instead of the generic unavailable card", () => {
  const context = {
    target: 50,
    horizon: "week",
    slip: {
      status: "SELECTIONS_CHANGED",
      mode: "manual",
      reason:
        "One or more selections are no longer approved and exactly bookable.",
      invalid_selections: [{
        selection_id: "sel-stale",
        reason: "STALE_OR_UNAVAILABLE_SELECTION",
        actions: ["REMOVE", "REPLACE", "SAFER_MARKET"],
      }],
    },
    loading: false,
    recoveringCode: false,
    error: null,
    editingSelectionId: null,
    editingMessage: null,
    editingAction: null,
    revisionFeedback: null,
    chooseTarget: jest.fn(),
    chooseHorizon: jest.fn(),
    build: jest.fn(),
    buildV2: jest.fn(),
    retryBuild: jest.fn(),
    clearSlip: jest.fn(),
    reviseLeg: jest.fn(),
  };

  render(
    <BuilderContext.Provider value={context as any}>
      <SlipBuilderPage />
    </BuilderContext.Provider>,
  );

  fireEvent.click(
    screen.getByRole("button", { name: /pick my games/i }),
  );

  expect(
    screen.getByText(/SportyBet changed your selected slip/i),
  ).toBeInTheDocument();

  expect(
    screen.queryByText(/No qualifying combination is available right now/i),
  ).not.toBeInTheDocument();
});

test("shows complete Builder V2 risk context for a generated slip", async () => {
  const base = editableSlip().games![0];

  const games = [
    {
      ...base,
      selection_id: "risk-a",
      match_id: "risk-a",
      fixture_id: 101,
      league: "Premier League",
      date: "2026-09-28T12:00:00Z",
      selection_probability: .72,
    },
    {
      ...base,
      selection_id: "risk-b",
      match_id: "risk-b",
      fixture_id: 102,
      home_team: "Gamma",
      away_team: "Delta",
      league: "Premier League",
      date: "2026-09-28T14:00:00Z",
      selection_probability: .70,
    },
    {
      ...base,
      selection_id: "risk-c",
      match_id: "risk-c",
      fixture_id: 103,
      home_team: "Roma",
      away_team: "Torino",
      league: "Premier League",
      date: "2026-09-28T16:00:00Z",
      selection_probability: .68,
    },
    {
      ...base,
      selection_id: "risk-d",
      match_id: "risk-d",
      fixture_id: 104,
      home_team: "Sevilla",
      away_team: "Betis",
      league: "LaLiga",
      date: "2026-09-28T18:00:00Z",
      selection_probability: .66,
    },
  ];

  buildSlip.mockResolvedValue({
    ...editableSlip(games),
    target: 50,
    odds: 51.2,
    legs: 4,
    lowest_probability: .66,
    average_probability: .69,
    first_kickoff: "2026-09-28T12:00:00Z",
    last_kickoff: "2026-09-28T18:00:00Z",
    board: {
      board_age_seconds: 185,
      board_complete: true,
      board_degraded: false,
      board_generated_at: "2026-09-28T11:56:55Z",
      sportybet_generated_at: "2026-09-28T11:56:30Z",
    },
  });

  renderBuilder();

  fireEvent.click(
    screen.getByRole("button", { name: /build my 50x slip/i }),
  );

  await screen.findByText("Lowest selected probability");

  expect(
    screen.getByText("Lowest selected probability").parentElement,
  ).toHaveTextContent("66.00%");

  expect(
    screen.getByText("Board freshness").parentElement,
  ).toHaveTextContent("3m old");

  expect(
    screen.getByText("Kickoff window"),
  ).toBeInTheDocument();

  const leagues = screen.getByLabelText("League distribution");

  expect(leagues).toHaveTextContent("Premier League");
  expect(leagues).toHaveTextContent("LaLiga");

  expect(
    screen.getByText(/3 of 4 picks are from Premier League/i),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/Concentration check:/i),
  ).toBeInTheDocument();
});
