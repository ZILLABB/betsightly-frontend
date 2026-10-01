import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecommendationBoard } from "./RecommendationBoard";
import type { RecommendationBoardResponse } from "../../types";

const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const game = (id: number, prediction: string, league: string) => ({
  fixture_id: id,
  match_id: String(id),
  home_team: `Home ${id}`,
  away_team: `Away ${id}`,
  league,
  date: future,
  kickoff: future,
  prediction,
  prediction_type: "goals",
  market: prediction === "Home Win" ? "home_win" : "over_1_5",
  confidence: .72,
  odds: 1.4,
  bookable: id === 1,
  public_rank: 1,
});

const data: RecommendationBoardResponse = {
  status: "success",
  date: "2099-09-10",
  timezone: "WAT",
  summary: {
    fixtures_analysed: 3,
    raw_market_candidates: 8,
    recommendations: 2,
    strong: 1,
    supported: 0,
    lean: 1,
    no_prediction: 1,
    premium_eligible: 1,
    sportybet_bookable: 1,
  },
  market_distribution: { over_1_5: 1, home_win: 1 },
  recommendations: [
    {
      match_id: "1",
      classification: "STRONG",
      premium_eligible: true,
      safe_tier_eligible: true,
      best_pick: game(1, "Over 1.5 Goals", "Alpha"),
      alternatives: [{ ...game(11, "Home Win", "Alpha"), public_rank: 2 }],
      raw_candidate_count: 3,
      public_candidate_count: 2,
    },
    {
      match_id: "2",
      classification: "LEAN",
      premium_eligible: false,
      safe_tier_eligible: false,
      best_pick: game(2, "Home Win", "Beta"),
      alternatives: [],
      raw_candidate_count: 2,
      public_candidate_count: 1,
    },
  ],
  no_prediction: [
    {
      match_id: "3",
      home_team: "H",
      away_team: "A",
      league: "Beta",
      reason: "NO_CREDIBLE_PUBLIC_MARKET",
    },
  ],
};

describe("RecommendationBoard", () => {
  it("defaults to upcoming SportyBet-bookable recommendations", () => {
    render(
      <RecommendationBoard
        data={data}
        loading={false}
        error={null}
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByText("Home 1")).toBeTruthy();
    expect(screen.queryByText("Home 2")).toBeNull();

    expect(
      screen.getByLabelText("Upcoming only"),
    ).toBeChecked();

    expect(
      screen.getByLabelText("SportyBet bookable"),
    ).toBeChecked();
  });

  it("can reveal the wider analysis without turning every match into a large card", () => {
    render(
      <RecommendationBoard
        data={data}
        loading={false}
        error={null}
        onRetry={jest.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Show all analysis" }),
    );

    expect(screen.getByText("Home 2")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Lean" }),
    );

    expect(screen.getByText("Home Win")).toBeTruthy();
    expect(screen.queryByText("Over 1.5 Goals")).toBeNull();
  });
});
