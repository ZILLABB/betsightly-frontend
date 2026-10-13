import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BuilderWinNotice } from "./BuilderWinNotice";
import { fetchPrivateBuilderWins } from "../../api/visitorWins";
import { existingAnonymousBuilderId } from "../../utils/anonymousIdentity";

jest.mock("../../api/visitorWins", () => ({ fetchPrivateBuilderWins: jest.fn() }));
jest.mock("../../utils/anonymousIdentity", () => ({
  existingAnonymousBuilderId: jest.fn(),
}));
const fetchWins = fetchPrivateBuilderWins as jest.Mock;
const getId = existingAnonymousBuilderId as jest.Mock;
const id = "anon_2f13d9a5-cc88-4aa8-a5e0-1e05a037df60";

const example = {
  status: "success",
  predictions_only: true,
  notifications: [{
    ticket_id: "ticket-a", generated_at: "2026-10-13T07:00:00Z",
    won_at: "2026-10-13T20:00:00Z", prediction_odds: 10.5,
    leg_count: 12, status: "won", wager_confirmed: false,
  }],
};

beforeEach(() => {
  window.localStorage.clear();
  getId.mockReturnValue(id);
  fetchWins.mockResolvedValue(example);
});
afterEach(() => jest.clearAllMocks());

test("alerts only the current browser when its generated prediction won", async () => {
  render(<BuilderWinNotice />);
  expect(await screen.findByText("Your generated prediction won!")).toBeInTheDocument();
  expect(screen.getByText(/10.50x/)).toBeInTheDocument();
  expect(screen.getByText(/not confirmation that you placed a wager/i)).toBeInTheDocument();
  expect(fetchWins).toHaveBeenCalledWith(id);
  expect(screen.queryByText(/you won money/i)).not.toBeInTheDocument();
});

test("dismissal persists so returning visitors aren't nagged twice", async () => {
  const { unmount } = render(<BuilderWinNotice />);
  expect(await screen.findByText("Your generated prediction won!")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Got it"));
  await waitFor(() => expect(
    screen.queryByText("Your generated prediction won!")).toBeNull());
  expect(window.localStorage.getItem("betsightly.private_prediction_wins_seen.v1"))
    .toContain("ticket-a");
  unmount();
  render(<BuilderWinNotice />);
  await waitFor(() => expect(fetchWins).toHaveBeenCalledTimes(2));
  expect(screen.queryByText("Your generated prediction won!")).toBeNull();
});

test("does not generate tracking identifiers for visitors who never built", async () => {
  getId.mockReturnValue(undefined);
  render(<BuilderWinNotice />);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(fetchWins).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("Your winning prediction updates")).toBeNull();
});

test("does not announce losses or incomplete/invalid predictions", async () => {
  fetchWins.mockResolvedValue({
    status: "success", predictions_only: true, notifications: [
      { ...example.notifications[0], status: "lost" },
      { ...example.notifications[0], ticket_id: "ticket-b",
        wager_confirmed: true },
    ],
  });
  render(<BuilderWinNotice />);
  await waitFor(() => expect(fetchWins).toHaveBeenCalled());
  expect(screen.queryByLabelText("Your winning prediction updates")).toBeNull();
});
