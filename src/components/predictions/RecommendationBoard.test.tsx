import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecommendationBoard } from "./RecommendationBoard";
import type { RecommendationBoardResponse } from "../../types";

const game = (id: number, prediction: string, league: string) => ({
  fixture_id: id,
  match_id: String(id),
  home_team: `Home ${id}`,
  away_team: `Away ${id}`,
  league,
  date: "2099-09-10T18:00:00Z",
  kickoff: "2099-09-10T18:00:00Z",
  prediction,
  prediction_type: "goals",
  market: prediction === "Home Win" ? "home_win" : "over_1_5",
  confidence: .72,
  odds: 1.4,
  bookable: id === 1,
  public_rank: 1,
});

const data: RecommendationBoardResponse = {
  status: "success", date: "2099-09-10", timezone: "WAT",
  summary: {
    fixtures_analysed: 3, raw_market_candidates: 8, recommendations: 2,
    strong: 1, supported: 0, lean: 1, no_prediction: 1,
    premium_eligible: 1, sportybet_bookable: 1,
  },
  market_distribution: { over_1_5: 1, home_win: 1 },
  recommendations: [
    {
      match_id: "1", classification: "STRONG", premium_eligible: true,
      safe_tier_eligible: true, best_pick: game(1, "Over 1.5 Goals", "Alpha"),
      alternatives: [{ ...game(11, "Home Win", "Alpha"), public_rank: 2 }],
      raw_candidate_count: 3, public_candidate_count: 2,
    },
    {
      match_id: "2", classification: "LEAN", premium_eligible: false,
      safe_tier_eligible: false, best_pick: game(2, "Home Win", "Beta"),
      alternatives: [], raw_candidate_count: 2, public_candidate_count: 1,
    },
  ],
  no_prediction: [{ match_id: "3", home_team: "H", away_team: "A", league: "Beta", reason: "NO_CREDIBLE_PUBLIC_MARKET" }],
};

describe("RecommendationBoard", () => {
  it("shows the broad board summary, strength labels and alternatives", () => {
    render(<RecommendationBoard data={data} loading={false} error={null} onRetry={jest.fn()} />);
    expect(screen.getByText("3", { selector: "strong" })).toBeTruthy();
    expect(screen.getAllByText("Strong").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lean").length).toBeGreaterThan(0);
    expect(screen.getByText(/Other BetSightly options/)).toBeTruthy();
    expect(screen.getByText(/Check the match and market personally/)).toBeTruthy();
  });

  it("filters by classification and SportyBet bookability", () => {
    render(<RecommendationBoard data={data} loading={false} error={null} onRetry={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Lean" }));
    expect(screen.getByText("Home Win")).toBeTruthy();
    expect(screen.queryByText("Over 1.5 Goals")).toBeNull();
    fireEvent.click(screen.getByLabelText("SportyBet bookable"));
    expect(screen.getByText("No matches fit these filters.")).toBeTruthy();
  });
});
