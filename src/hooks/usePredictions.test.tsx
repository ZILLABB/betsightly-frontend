import { act, renderHook, waitFor } from "@testing-library/react";
import { api } from "../api/predictions";
import {
  __resetPredictionsCacheForTests,
  usePredictions,
} from "./usePredictions";

jest.mock("../api/predictions", () => ({
  api: { getTodaysAccumulators: jest.fn() },
}));

const getToday = api.getTodaysAccumulators as jest.Mock;
const response = (date = "2026-09-12") => ({
  status: "success",
  date,
  accumulators: {
    banker: { selected: false, games: [], total_odds: 0, risk_level: "low" },
    "2_odds": { selected: false, games: [], total_odds: 0, risk_level: "low" },
    "5_odds": { selected: false, games: [], total_odds: 0, risk_level: "low" },
    "10_odds": { selected: false, games: [], total_odds: 0, risk_level: "low" },
    over_1_5: { selected: false, games: [], total_odds: 0, risk_level: "low" },
    rollover: { selected: false, games: [], total_odds: 0, risk_level: "low", chain: [] },
  },
});

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2026-09-12T12:00:00Z"));
  sessionStorage.clear();
  __resetPredictionsCacheForTests();
  getToday.mockReset();
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test("uses the last successful same-day response after a network failure", async () => {
  getToday.mockResolvedValueOnce(response());
  const { result } = renderHook(() => usePredictions());
  await waitFor(() => expect(result.current.loading).toBe(false));

  getToday.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  await act(async () => { await result.current.refetch(); });

  expect(result.current.data?.date).toBe("2026-09-12");
  expect(result.current.usingFallback).toBe(true);
  expect(result.current.error).toBe("Showing the last available data while we reconnect.");
  expect(result.current.lastUpdated).not.toBeNull();
});

test("reports an unavailable state when a network failure has no cache", async () => {
  getToday.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  const { result } = renderHook(() => usePredictions());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.data).toBeNull();
  expect(result.current.usingFallback).toBe(false);
  expect(result.current.error).toBe("We couldn’t load the predictions right now.");
  expect(console.warn).toHaveBeenCalledWith("[predictions_fetch_failed]", {
    endpoint: "/leagues/daily-accumulators",
    status: undefined,
    category: "network",
  });
});

test("a retry can recover after the initial request fails", async () => {
  getToday.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValueOnce(response());
  const { result } = renderHook(() => usePredictions());
  await waitFor(() => expect(result.current.error).not.toBeNull());

  await act(async () => { await result.current.refetch(); });

  expect(result.current.error).toBeNull();
  expect(result.current.data?.date).toBe("2026-09-12");
  expect(result.current.usingFallback).toBe(false);
});

test("ignores and clears a previous-day session response", async () => {
  sessionStorage.setItem("betsightly_predictions_same_day_v1", JSON.stringify({
    data: response("2026-09-11"),
    date: "2026-09-11",
    ts: Date.now() - 1_000,
  }));
  getToday.mockRejectedValueOnce(new TypeError("Failed to fetch"));

  const { result } = renderHook(() => usePredictions());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.data).toBeNull();
  expect(result.current.usingFallback).toBe(false);
  expect(sessionStorage.getItem("betsightly_predictions_same_day_v1")).toBeNull();
});

test("clears malformed same-day session data without breaking the fetch", async () => {
  sessionStorage.setItem("betsightly_predictions_same_day_v1", JSON.stringify({
    data: { date: "2026-09-12", accumulators: "invalid" },
    date: "2026-09-12",
    ts: Date.now(),
  }));
  getToday.mockResolvedValueOnce(response());

  const { result } = renderHook(() => usePredictions());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.data?.date).toBe("2026-09-12");
  expect(JSON.parse(sessionStorage.getItem("betsightly_predictions_same_day_v1")!))
    .toMatchObject({ date: "2026-09-12" });
});
