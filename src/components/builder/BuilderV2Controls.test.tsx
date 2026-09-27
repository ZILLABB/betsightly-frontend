import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BuilderV2Controls } from "./BuilderV2Controls";
import { BuilderContext } from "../../contexts/BuilderContextInstance";
import { api } from "../../api/predictions";

jest.mock("../../api/predictions", () => ({
  api: {
    getBuilderV2Candidates: jest.fn(),
  },
}));

const getCandidates = api.getBuilderV2Candidates as jest.Mock;

const makeContext = (overrides: Record<string, unknown> = {}) => ({
  target: 50,
  horizon: "week",
  slip: null,
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
  clearSlip: jest.fn(),
  reviseLeg: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  getCandidates.mockReset();
});

test("game-count mode sends count, market and 3-day horizon", async () => {
  const buildV2 = jest.fn();
  const context = makeContext({ buildV2, horizon: "3_days" });

  render(
    <BuilderContext.Provider value={context as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /number of games/i }));
  fireEvent.change(screen.getByLabelText(/number of games/i), { target: { value: "50" } });
  fireEvent.click(screen.getByRole("button", { name: /over 1.5/i }));
  fireEvent.click(screen.getByRole("button", { name: /build best 50 games/i }));

  await waitFor(() => expect(buildV2).toHaveBeenCalledWith(expect.objectContaining({
    mode: "game_count",
    game_count: 50,
    horizon: "3_days",
    markets: ["over_1_5"],
    require_bookable: true,
  })));
});

test("manual mode books only selected approved IDs", async () => {
  const buildV2 = jest.fn();
  getCandidates.mockResolvedValue({
    status: "success",
    candidate_count: 1,
    candidates: [{
      selection_id: "sel-1",
      match_id: "m1",
      fixture_id: 1,
      home_team: "Alpha",
      away_team: "Beta",
      league: "Test League",
      date: "2099-01-01",
      prediction: "Over 1.5",
      prediction_type: "goals",
      market: "over_1_5",
      confidence: .76,
      odds: 1.45,
      trust_grade: "A",
      recommended_for_fixture: true,
    }],
  });

  render(
    <BuilderContext.Provider value={makeContext({ buildV2 }) as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /pick my games/i }));
  fireEvent.click(screen.getByRole("button", { name: /browse approved games/i }));
  const candidate = await screen.findByRole("button", { name: /alpha v beta/i });
  fireEvent.click(candidate);
  fireEvent.click(screen.getByRole("button", { name: /build 1 selected game/i }));

  expect(buildV2).toHaveBeenCalledWith(expect.objectContaining({
    mode: "manual",
    selection_ids: ["sel-1"],
    horizon: "7_days",
  }));
});

test("default target mode uses Builder V2 with the 7-day horizon", async () => {
  const buildV2 = jest.fn();

  render(
    <BuilderContext.Provider value={makeContext({ buildV2 }) as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(
    screen.getByRole("button", { name: /build my 50x slip/i }),
  );

  await waitFor(() =>
    expect(buildV2).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "target_odds",
        target_odds: 50,
        horizon: "7_days",
        require_bookable: true,
      }),
    ),
  );
});

test("manual mode replaces a previous market from the same fixture", async () => {
  const buildV2 = jest.fn();

  getCandidates.mockResolvedValue({
    status: "success",
    candidate_count: 2,
    candidates: [
      {
        selection_id: "sel-over",
        match_id: "same-match",
        fixture_id: 101,
        home_team: "Alpha",
        away_team: "Beta",
        league: "Test League",
        date: "2099-01-01",
        prediction: "Over 1.5",
        prediction_type: "goals",
        market: "over_1_5",
        confidence: .78,
        odds: 1.45,
        trust_grade: "A",
        recommended_for_fixture: true,
      },
      {
        selection_id: "sel-under",
        match_id: "same-match",
        fixture_id: 101,
        home_team: "Alpha",
        away_team: "Beta",
        league: "Test League",
        date: "2099-01-01",
        prediction: "Under 4.5",
        prediction_type: "goals",
        market: "under_4_5",
        confidence: .82,
        odds: 1.30,
        trust_grade: "A",
        recommended_for_fixture: false,
      },
    ],
  });

  render(
    <BuilderContext.Provider value={makeContext({ buildV2 }) as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /pick my games/i }));
  fireEvent.click(screen.getByRole("button", { name: /browse approved games/i }));

  const fixtureOptions = await screen.findAllByRole(
    "button",
    { name: /alpha v beta/i },
  );

  fireEvent.click(fixtureOptions[0]);
  fireEvent.click(fixtureOptions[1]);

  fireEvent.click(
    screen.getByRole("button", { name: /build 1 selected game/i }),
  );

  expect(buildV2).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: "manual",
      selection_ids: ["sel-under"],
      horizon: "7_days",
    }),
  );
});

test("advanced trust control uses project segmented buttons and resets cleanly", async () => {
  const buildV2 = jest.fn();

  render(
    <BuilderContext.Provider value={makeContext({ buildV2 }) as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByText(/advanced filters/i));

  const aOnly = screen.getByRole("button", { name: /a only/i });
  fireEvent.click(aOnly);

  expect(aOnly).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("1")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

  expect(
    screen.getByRole("button", { name: /a or b/i }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("custom target clears its draft after applying it", () => {
  const chooseTarget = jest.fn();

  render(
    <BuilderContext.Provider value={makeContext({ chooseTarget }) as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  const input = screen.getByLabelText(/custom target/i);

  fireEvent.change(input, { target: { value: "125" } });
  fireEvent.click(screen.getByRole("button", { name: /use target/i }));

  expect(chooseTarget).toHaveBeenCalledWith(125);
  expect(input).toHaveValue(null);
});

test("game count explains that multiple selected markets are balanced", () => {
  render(
    <BuilderContext.Provider value={makeContext() as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /number of games/i }));
  fireEvent.click(screen.getByRole("button", { name: /over 1.5/i }));
  fireEvent.click(screen.getByRole("button", { name: /over 2.5/i }));

  expect(
    screen.getByText(/balance these markets as evenly as quality/i),
  ).toBeInTheDocument();
});
