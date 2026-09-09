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
});
