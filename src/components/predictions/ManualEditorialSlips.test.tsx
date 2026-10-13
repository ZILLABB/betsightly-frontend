import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ManualEditorialSlips } from "./ManualEditorialSlips";
import { getManualEditorial } from "../../api/manualEditorial";

jest.mock("../../api/manualEditorial", () => ({getManualEditorial: jest.fn()}));
const mockLoad = getManualEditorial as jest.MockedFunction<typeof getManualEditorial>;
afterEach(() => jest.clearAllMocks());

test("admin editorial opinion remains distinct from official model and no fake code", async () => {
  mockLoad.mockResolvedValue({
    status: "success", date: "2026-10-13", manual_editorial: true,
    slips: [{
      slip_id: "e1", tier: "2_odds", status: "RESEARCH",
      date: "2026-10-13", note: "Human selected",
      manual_editorial: true, not_model_verified: true,
      legs: [{match_id: "52587", home_team: "Arsenal", away_team: "Lille",
              league: "UEFA", market: "home_win", kickoff: "2026-10-13T20:00:00+01:00"}],
      actual_odds: null,
    }],
  });
  render(<ManualEditorialSlips/>);
  expect(await screen.findByText("Arsenal vs Lille")).toBeInTheDocument();
  expect(screen.getByText(/editorial research · no verified code/i)).toBeInTheDocument();
  expect(screen.queryByText(/Open verified SportyBet slip/i)).toBeNull();
});

test("links only a genuinely actionable, verified manual ticket", async () => {
  mockLoad.mockResolvedValue({
    status: "success", date: "2026-10-13", manual_editorial: true,
    slips: [{
      slip_id: "e1", tier: "2_odds", status: "BOOKED",
      date: "2026-10-13", note: "",
      manual_editorial: true, not_model_verified: true, actual_odds: 2.1,
      legs: [{match_id: "52587", home_team: "Arsenal", away_team: "Lille",
              league: "UEFA", market: "home_win", kickoff: "2026-10-13T20:00:00+01:00",
              odds: 2.1}],
      booking: {actionable: true, share_url: "https://www.sportybet.com/ng/orders/share/ABC123",
                share_code: "ABC123"},
    }],
  });
  render(<ManualEditorialSlips/>);
  expect(await screen.findByRole("link", {name: /Open verified SportyBet slip/i}))
    .toHaveAttribute("href", "https://www.sportybet.com/ng/orders/share/ABC123");
});

test("does not show unpublished or missing research", async () => {
  mockLoad.mockResolvedValue({status: "not_available", date: "2026-10-13",
                               manual_editorial: true, slips: []});
  const {container} = render(<ManualEditorialSlips/>);
  await screen.findByText("marker-only").catch(() => {});
  expect(container.querySelector("section")).toBeNull();
});
