import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePredictions } from "../hooks/usePredictions";
import { RolloverPage } from "./RolloverPage";
import { api } from "../api/predictions";

jest.mock("../hooks/usePredictions", () => ({ usePredictions: jest.fn() }));
jest.mock("../hooks/useFormatOdds", () => ({
  useFormatOdds: () => ({ formatOdds: (value: number) => value.toFixed(2), oddsSuffix: "x" }),
}));
jest.mock("../api/predictions", () => ({
  api: { getLiveScores: jest.fn() },
}));
jest.mock("../components/common/SEO", () => ({ SEO: () => null }));
jest.mock("../components/predictions/BookingCode", () => () => null);
jest.mock("../components/ui/BrandLoader", () => ({
  BrandLoader: ({ children }: { children: React.ReactNode }) => <div>Loading rollover{children}</div>,
}));

const mockedPredictions = usePredictions as jest.Mock;
afterEach(() => jest.restoreAllMocks());
const emptyData = {
  date: "2026-09-12",
  accumulators: {
    rollover: { selected: false, chain: [], target_days: 3 },
  },
};

test("shows the genuine empty state only after a successful API response", () => {
  mockedPredictions.mockReturnValue({
    data: emptyData, loading: false, error: null, usingFallback: false,
    lastUpdated: Date.now(), refetch: jest.fn(),
  });
  render(<RolloverPage />);
  expect(screen.getByText(/No rollover chain yet/i)).toBeInTheDocument();
  expect(screen.queryByText(/couldn’t load the rollover/i)).not.toBeInTheDocument();
});

test("does not claim the chain is empty when the API failed without cache", () => {
  const refetch = jest.fn();
  mockedPredictions.mockReturnValue({
    data: null, loading: false, error: "We couldn’t load the predictions right now.",
    usingFallback: false, lastUpdated: null, refetch,
  });
  render(<RolloverPage />);
  expect(screen.getByText(/We couldn’t load the rollover right now/i)).toBeInTheDocument();
  expect(screen.queryByText(/No rollover chain yet/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
});

test("renders cached rollover data with a compact reconnect warning", () => {
  mockedPredictions.mockReturnValue({
    data: emptyData, loading: false,
    error: "Showing the last available data while we reconnect.",
    usingFallback: true, lastUpdated: new Date("2026-09-12T10:30:00Z").getTime(),
    refetch: jest.fn(),
  });
  render(<RolloverPage />);
  expect(screen.getByText(/Showing the last available data while we reconnect/i))
    .toBeInTheDocument();
  expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  expect(screen.getByText(/No rollover chain yet/i)).toBeInTheDocument();
});

const liveDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
const liveData = {
  date: liveDate,
  accumulators: {
    rollover: {
      selected: true, target_days: 3, completion_probability: 0.42,
      chain: [{ day_number: 1, date: liveDate, status: "pending", combined_odds: 2.1,
        avg_confidence: 0.72, hit_probability: 0.72,
        picks: [{ match_id: "match-live", match: "Home vs Away", home_team: "Home", away_team: "Away",
          market: "goals", prediction: "Over 1.5 Goals", odds: 1.5, confidence: 0.72,
          commence_time: "2026-10-03T16:00:00Z", status: "pending" }],
      }],
    },
  },
};

test("renders live scores separately from the persisted pending settlement state", async () => {
  jest.spyOn(api, "getLiveScores").mockResolvedValue({
    status: "success", count: 1, leagues: [], scores: {
      "match-live": { home_score: 1, away_score: 1, state: "in", state_label: "In play", clock: "67'", live: true, finished: false },
    },
  });
  mockedPredictions.mockReturnValue({
    data: liveData, loading: false, error: null, usingFallback: false,
    lastUpdated: Date.now(), refetch: jest.fn(),
  });
  render(<RolloverPage />);
  expect(await screen.findByLabelText("Live score")).toHaveTextContent("1–1 · LIVE 67'");
});

test("shows final score as awaiting settlement instead of inferring an official result", async () => {
  jest.spyOn(api, "getLiveScores").mockResolvedValue({
    status: "success", count: 1, leagues: [], scores: {
      "match-live": { home_score: 1, away_score: 0, state: "post", state_label: "Final", live: false, finished: true },
    },
  });
  mockedPredictions.mockReturnValue({
    data: liveData, loading: false, error: null, usingFallback: false,
    lastUpdated: Date.now(), refetch: jest.fn(),
  });
  render(<RolloverPage />);
  expect(await screen.findByLabelText("Final score")).toHaveTextContent("1–0 · FT · Awaiting settlement");
});

test("polls only the read-only score/card endpoints and cleans up the interval", async () => {
  const setIntervalSpy = jest.spyOn(window, "setInterval");
  const clearIntervalSpy = jest.spyOn(window, "clearInterval");
  const refetch = jest.fn();
  jest.spyOn(api, "getLiveScores").mockResolvedValue({ status: "success", count: 0, leagues: [], scores: {} });
  mockedPredictions.mockReturnValue({
    data: liveData, loading: false, error: null, usingFallback: false,
    lastUpdated: Date.now(), refetch,
  });
  const { unmount } = render(<RolloverPage />);
  expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 75_000);
  await waitFor(() => expect(api.getLiveScores).toHaveBeenCalled());
  expect(refetch).toHaveBeenCalled();
  unmount();
  expect(clearIntervalSpy).toHaveBeenCalled();
});

test("uses backend settlement status after FT and keeps a broken chain visible", async () => {
  jest.spyOn(api, "getLiveScores").mockResolvedValue({
    status: "success", count: 1, leagues: [], scores: {
      "match-live": { home_score: 1, away_score: 0, state: "post", state_label: "Final", live: false, finished: true },
    },
  });
  const settled = JSON.parse(JSON.stringify(liveData));
  settled.accumulators.rollover.chain[0].status = "lost";
  settled.accumulators.rollover.chain[0].picks[0].status = "lost";
  // A later unresolved leg keeps the read-only score refresh active while the
  // backend-persisted loss controls the chain status.
  settled.accumulators.rollover.chain[0].picks.push({
    ...settled.accumulators.rollover.chain[0].picks[0],
    match_id: "match-pending", status: "pending", home_team: "Later", away_team: "Fixture",
  });
  mockedPredictions.mockReturnValue({
    data: settled, loading: false, error: null, usingFallback: false,
    lastUpdated: Date.now(), refetch: jest.fn(),
  });
  render(<RolloverPage />);
  expect(await screen.findByLabelText("Final score")).toHaveTextContent("1–0 · FT");
  expect(screen.queryByText(/Awaiting settlement/i)).not.toBeInTheDocument();
  expect(screen.getByText("Lost")).toBeInTheDocument();
  expect(screen.getByText(/Full chain \(1 days\)/)).toBeInTheDocument();
});
