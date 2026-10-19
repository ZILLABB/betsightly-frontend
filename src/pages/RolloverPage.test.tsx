import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePredictions } from "../hooks/usePredictions";
import { RolloverPage } from "./RolloverPage";

jest.mock("../hooks/usePredictions", () => ({ usePredictions: jest.fn() }));
jest.mock("../hooks/useFormatOdds", () => ({
  useFormatOdds: () => ({ formatOdds: (value: number) => value.toFixed(2), oddsSuffix: "x" }),
}));
jest.mock("../components/common/SEO", () => ({ SEO: () => null }));
jest.mock("../components/predictions/BookingCode", () => () => null);
jest.mock("../components/ui/BrandLoader", () => ({
  BrandLoader: ({ children }: { children: React.ReactNode }) => <div>Loading rollover{children}</div>,
}));

const mockedPredictions = usePredictions as jest.Mock;
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
  expect(screen.getByText(/No active chain published/i)).toBeInTheDocument();
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
  expect(screen.queryByText(/No active chain published/i)).not.toBeInTheDocument();
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

test("an empty feed does not invent Day 1, Day 2 or Day 3 statuses", () => {
  mockedPredictions.mockReturnValue({
    data: emptyData, loading: false, error: null, usingFallback: false,
    lastUpdated: null, refetch: jest.fn(),
  });
  render(<RolloverPage />);
  expect(screen.getByText("No active chain published")).toBeInTheDocument();
  expect(screen.getByText(/won't invent Day 1 selections/i)).toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "Rollover chain progress" })).not.toBeInTheDocument();
  expect(screen.queryByText("Not published")).not.toBeInTheDocument();
});

test("during initial loading the tracker has placeholders instead of false Not published statuses", () => {
  mockedPredictions.mockReturnValue({
    data: null, loading: true, error: null, usingFallback: false,
    lastUpdated: null, refetch: jest.fn(),
  });
  const { container } = render(<RolloverPage />);
  expect(screen.getByRole("status", { name: "Checking rollover chain" })).toBeInTheDocument();
  expect(container.querySelectorAll(".editorial-rollover-tracker-skeleton")).toHaveLength(3);
  expect(screen.queryByRole("list", { name: "Rollover chain progress" })).not.toBeInTheDocument();
  expect(screen.queryByText("No active chain published")).not.toBeInTheDocument();
  expect(screen.queryByText("Not published")).not.toBeInTheDocument();
});

test("published day progress uses verified results and reports only actual stages", () => {
  mockedPredictions.mockReturnValue({
    data: {
      ...emptyData,
      accumulators: {
        rollover: {
          selected: true, target_days: 3,
          chain: [
            { day_number: 1, date: "2026-10-18", status: "won", picks: [], combined_odds: 2.2, avg_confidence: null },
            { day_number: 2, date: "2099-10-20", status: "pending", picks: [], combined_odds: 2.0, avg_confidence: null },
          ],
        },
      },
    },
    loading: false, error: null, usingFallback: false,
    lastUpdated: null, refetch: jest.fn(),
  });
  render(<RolloverPage />);
  const tracker = screen.getByRole("list", { name: "Rollover chain progress" });
  expect(tracker.querySelectorAll("li")).toHaveLength(3);
  expect(tracker.textContent).toContain("Verified win");
  expect(tracker.textContent).toContain("Awaiting final");
  expect(tracker.textContent).toContain("Not published");
  expect(screen.getByText("1 / 3")).toBeInTheDocument();
});
