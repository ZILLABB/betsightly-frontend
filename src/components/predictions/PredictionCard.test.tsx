import React from 'react';
import { render, screen } from '@testing-library/react';
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
