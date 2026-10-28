import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PredictionCard } from './PredictionCard';
import type { GamePrediction } from '../../types';

describe('PredictionCard competition context', () => {
  it('shows a compact tournament stage label beside the real competition', () => {
    const game: GamePrediction = {
      fixture_id: 1,
      home_team: 'Ghana',
      away_team: 'Nigeria',
      league: 'Africa Cup of Nations',
      league_slug: 'caf.nations',
      date: '2026-09-20T19:00:00Z',
      kickoff: '2026-09-20T19:00:00Z',
      prediction: 'Over 1.5 Goals',
      prediction_type: 'goals',
      confidence: 0.8,
      odds: 1.3,
      competition_type: 'INTERNATIONAL_TOURNAMENT',
      competition_context_label: 'Quarterfinals · 2nd leg',
    };

    render(<PredictionCard game={game} color="#22c55e" faint="rgba(34,197,94,.1)" />);
    expect(screen.getByText('Africa Cup of Nations')).toBeTruthy();
    expect(screen.getByText(/Quarterfinals · 2nd leg/)).toBeTruthy();
  });

  it('shows a timezone label beside a future kickoff', () => {
    const game: GamePrediction = {
      fixture_id: 2,
      home_team: 'Ghana',
      away_team: 'Nigeria',
      league: 'Africa Cup of Nations',
      date: '2099-09-20T19:00:00Z',
      kickoff: '2099-09-20T19:00:00Z',
      prediction: 'Over 1.5 Goals',
      prediction_type: 'goals',
      confidence: 0.8,
      odds: 1.3,
    };
    render(<PredictionCard game={game} color="#22c55e" faint="rgba(34,197,94,.1)" />);
    expect(screen.getByText(/20 Sept · \d{2}:\d{2} \S+/)).toBeTruthy();
  });
});


describe("Matchday fixture readability", () => {
  const example: GamePrediction = {
    fixture_id: 111,
    home_team: "RC Celta Fortuna",
    away_team: "Tenerife",
    home_team_logo: "https://a.espncdn.com/i/teamlogos/soccer/500/1.png",
    away_team_logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2.png",
    league: "LaLiga 2",
    date: "2099-10-19T19:30:00Z",
    prediction: "Over 1.5 Goals",
    prediction_type: "goals",
    confidence: .77,
    odds: 1.33,
    odds_are_real: true,
    odds_provider: "SportyBet",
    match_info: { home_form: "DDLLW", away_form: "WLLDW" },
  };

  it("makes the versus separation and home/away positions explicit with actual crests", () => {
    const { container } = render(<PredictionCard game={example} color="#ccc" faint="transparent"/>);
    expect(screen.getByText("VS")).toBeTruthy();
    expect(screen.getByLabelText("Home team: RC Celta Fortuna")).toBeTruthy();
    expect(screen.getByLabelText("Away team: Tenerife")).toBeTruthy();
    expect(container.querySelectorAll(".team-crest img")).toHaveLength(2);
  });

  it("labels each team's own last-five results instead of displaying an ambiguous FORM row", () => {
    render(<PredictionCard game={example} color="#ccc" faint="transparent"/>);
    expect(screen.getByText("HOME · LAST 5")).toBeTruthy();
    expect(screen.getByText("AWAY · LAST 5")).toBeTruthy();
    expect(screen.getByLabelText("RC Celta Fortuna last 5 games: draw, draw, loss, loss, win")).toBeTruthy();
    expect(screen.getByLabelText("Tenerife last 5 games: win, loss, loss, draw, win")).toBeTruthy();
  });

  it("distinguishes verified bookmaker odds from the model's confidence estimate", () => {
    render(<PredictionCard game={example} color="#ccc" faint="transparent"/>);
    expect(screen.getByText("OUR SELECTION")).toBeTruthy();
    expect(screen.getByText("BOOKMAKER ODDS")).toBeTruthy();
    expect(screen.getByText("Model estimate · 77%")).toBeTruthy();
    expect(screen.getByText("SportyBet")).toBeTruthy();
  });

  it("never presents a manually curated prediction as model-scored", () => {
    render(<PredictionCard game={{ ...example, editorial_manual: true, odds_are_real: false }} color="#ccc" faint="transparent"/>);
    expect(screen.getByText("Admin-curated · not model-scored")).toBeTruthy();
    expect(screen.getByText("ESTIMATED ODDS")).toBeTruthy();
    expect(screen.getByText("Price not verified")).toBeTruthy();
  });
});

describe("fixture artwork and missing evidence transparency", () => {
  const bareGame: GamePrediction = {
    fixture_id: 7001,
    home_team: "CD Covadonga",
    away_team: "Valladolid",
    league: "Copa del Rey",
    kickoff: "2099-10-28T19:00:00Z",
    date: "2099-10-28T19:00:00Z",
    prediction: "Over 1.5 Goals",
    prediction_type: "goals",
    confidence: 0,
    editorial_manual: true,
    odds: 1.16,
    odds_are_real: true,
    odds_provider: "SportyBet",
  };

  it("renders verified club crests for exact known teams in admin-curated cards", () => {
    const { container } = render(<PredictionCard game={bareGame} color="#ccc" faint="transparent"/>);
    const crests = [...container.querySelectorAll(".team-crest img")];
    expect(crests).toHaveLength(2);
    expect(crests[0].getAttribute("src")).toContain("cdcovadonga.com");
    expect(crests[1].getAttribute("src")).toContain("/95.png");
  });

  it("shows a generic cup mark, never a misleading fabricated league crest", () => {
    const { container } = render(<PredictionCard game={bareGame} color="#ccc" faint="transparent"/>);
    expect(container.querySelector(".editorial-fixture__league svg")).toBeTruthy();
    expect(container.querySelector(".editorial-fixture__league img")).toBeNull();
  });

  it("recovers from a failed league image while keeping its competition label", () => {
    const { container } = render(
      <PredictionCard game={{ ...bareGame, league_logo: "https://example.invalid/cup.png" }} color="#ccc" faint="transparent"/>
    );
    fireEvent.error(container.querySelector(".editorial-fixture__league img")!);
    expect(container.querySelector(".editorial-fixture__league svg")).toBeTruthy();
    expect(screen.getByText("Copa del Rey")).toBeTruthy();
  });

  it("labels absent form data without fabricating recent results or model confidence", () => {
    render(<PredictionCard game={bareGame} color="#ccc" faint="transparent"/>);
    expect(screen.getByText("Recent team form was not supplied for this fixture.")).toBeTruthy();
    expect(screen.getByText("Admin-curated · not model-scored")).toBeTruthy();
    expect(screen.queryByText("HOME · LAST 5")).toBeNull();
  });
});
