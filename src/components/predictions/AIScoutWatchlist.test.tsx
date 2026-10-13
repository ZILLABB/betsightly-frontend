import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AIScoutWatchlist } from "./AIScoutWatchlist";
import { getAIScoutWatchlist } from "../../api/aiScout";

jest.mock("../../api/aiScout", () => ({ getAIScoutWatchlist: jest.fn() }));
const mockLoad = getAIScoutWatchlist as jest.MockedFunction<typeof getAIScoutWatchlist>;
afterEach(() => jest.clearAllMocks());

const sample = {
  status: "SHADOW_EVIDENCE_ONLY",
  date: "2026-10-13",
  research_only: true,
  candidates: [{
    candidate_id: "a", home: "Home", away: "Away",
    league: "Example League", kickoff: "2026-10-13T16:00:00Z",
    market: "over_1_5", model_probability: .75, price: 1.4,
    real_price: true, publication_allowed: false, bookable: true,
    verdict: "NEEDS_VERIFICATION",
    rationale: "Injuries not confirmed",
    verification_gap: "Independent evidence missing",
    source_urls: ["https://www.espn.com/football/"],
    web_sources_available: true,
    research_only: true, bookmaker_code_verified: false,
  }],
};

test("renders only a clearly labelled, unverified research watchlist", async () => {
  mockLoad.mockResolvedValue(sample);
  render(<AIScoutWatchlist />);
  expect(await screen.findByText("Home vs Away")).toBeInTheDocument();
  expect(screen.getByText(/not official BetSightly selections/i)).toBeInTheDocument();
  expect(screen.getByText(/Additional verification needed/i)).toBeInTheDocument();
  expect(screen.queryByText(/SportyBet booking code/i)).toBeNull();
  expect(screen.getByRole("link", {name: /research source/i}))
    .toHaveAttribute("href", "https://www.espn.com/football/");
});

test("never presents missing or unpublished research as official picks", async () => {
  mockLoad.mockResolvedValue({...sample, status: "NO_API_KEY"});
  const { container } = render(<AIScoutWatchlist />);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(container.querySelector("section")).toBeNull();
});
