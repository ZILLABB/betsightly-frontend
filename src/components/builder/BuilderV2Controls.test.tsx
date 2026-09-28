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
    fill_strategy: "strict_selected_markets",
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


test("labels the unfiltered market choice as all eligible markets", () => {
  render(
    <BuilderContext.Provider value={makeContext() as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  expect(
    screen.getByRole("button", { name: /all eligible markets/i }),
  ).toBeInTheDocument();

  expect(
    screen.queryByRole("button", { name: /^all trusted$/i }),
  ).not.toBeInTheDocument();
});

test("game-count safe fill serializes selected-first eligible fallback", async () => {
  const buildV2 = jest.fn();

  render(
    <BuilderContext.Provider value={makeContext({ buildV2 }) as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /number of games/i }));
  fireEvent.click(screen.getByRole("button", { name: /over 1.5/i }));

  const safeFill = screen.getByRole("button", {
    name: /fill safely from other eligible markets/i,
  });
  fireEvent.click(safeFill);

  expect(safeFill).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(screen.getByRole("button", { name: /build best 20 games/i }));

  await waitFor(() =>
    expect(buildV2).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "game_count",
        game_count: 20,
        markets: ["over_1_5"],
        fill_strategy: "selected_first_then_eligible",
      }),
    ),
  );
});

test("fill strategy is shown only when game count has selected markets", () => {
  render(
    <BuilderContext.Provider value={makeContext() as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  expect(
    screen.queryByRole("group", { name: /fill strategy/i }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /number of games/i }));

  expect(
    screen.queryByRole("group", { name: /fill strategy/i }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /home win/i }));

  expect(
    screen.getByRole("group", { name: /fill strategy/i }),
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: /selected markets only/i }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("game-count quick values match the original V2 1-50 shortcuts", () => {
  render(
    <BuilderContext.Provider value={makeContext() as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /number of games/i }));

  for (const value of [5, 10, 15, 20, 30, 40, 50]) {
    expect(
      screen.getByRole("button", { name: new RegExp(`^${value}$`) }),
    ).toBeInTheDocument();
  }
});

test("advanced include and exclude filters serialize to Builder V2", async () => {
  const buildV2 = jest.fn();

  render(
    <BuilderContext.Provider value={makeContext({ buildV2 }) as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByText(/advanced filters/i));

  fireEvent.change(screen.getByLabelText(/include leagues/i), {
    target: { value: "Premier League, LaLiga" },
  });
  fireEvent.change(screen.getByLabelText(/exclude leagues/i), {
    target: { value: "Friendly, league-slug" },
  });
  fireEvent.change(screen.getByLabelText(/exclude fixtures/i), {
    target: { value: "fx-1, fx-2" },
  });
  fireEvent.change(screen.getByLabelText(/exclude teams/i), {
    target: { value: "Arsenal, team-99" },
  });

  fireEvent.click(screen.getByRole("button", { name: /build my 50x slip/i }));

  await waitFor(() =>
    expect(buildV2).toHaveBeenCalledWith(
      expect.objectContaining({
        include_leagues: ["Premier League", "LaLiga"],
        exclude_leagues: ["Friendly", "league-slug"],
        exclude_fixture_ids: ["fx-1", "fx-2"],
        exclude_team_ids: ["Arsenal", "team-99"],
        require_bookable: true,
      }),
    ),
  );
});

test("reset filters clears original V2 include and exclude controls", () => {
  render(
    <BuilderContext.Provider value={makeContext() as any}>
      <BuilderV2Controls />
    </BuilderContext.Provider>,
  );

  fireEvent.click(screen.getByText(/advanced filters/i));

  const include = screen.getByLabelText(/include leagues/i);
  const fixtures = screen.getByLabelText(/exclude fixtures/i);

  fireEvent.change(include, { target: { value: "Premier League" } });
  fireEvent.change(fixtures, { target: { value: "fx-1" } });

  fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

  expect(include).toHaveValue("");
  expect(fixtures).toHaveValue("");
});
