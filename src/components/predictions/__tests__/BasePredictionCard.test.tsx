import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasePredictionCard, { 
  PredictionCardMode, 
  PredictionCardVariant 
} from '../BasePredictionCard';

// Mock data
const mockPrediction = {
  id: '1',
  game: {
    id: 'game1',
    homeTeam: 'Home Team',
    awayTeam: 'Away Team',
    league: 'Premier League',
    sport: 'soccer',
    startTime: new Date().toISOString(),
  },
  predictionType: 'Home Win',
  odds: 2.5,
  status: 'pending',
  confidence: 75,
  createdAt: new Date().toISOString(),
  category: 'two_odds',
  gameCode: 'ABC123',
  bookmaker: 'Bet365',
  explanation: 'This is a test explanation'
};

// Mock functions
const mockOnClick = jest.fn();
const mockOnCopy = jest.fn();

describe('BasePredictionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in standard mode correctly', () => {
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.STANDARD}
        variant={PredictionCardVariant.DEFAULT}
      />
    );

    // Check that basic information is displayed
    expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument();
    expect(screen.getByText('Premier League')).toBeInTheDocument();
    expect(screen.getByText('Home Win')).toBeInTheDocument();
    expect(screen.getByText('2.5x')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('renders in compact mode correctly', () => {
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.COMPACT}
        variant={PredictionCardVariant.DEFAULT}
      />
    );

    // Check that compact information is displayed
    expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument();
    expect(screen.getByText('Premier League')).toBeInTheDocument();
    expect(screen.getByText('2.5x')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('renders in detailed mode correctly', () => {
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.DETAILED}
        variant={PredictionCardVariant.DEFAULT}
        showReason={true}
        showStats={true}
      />
    );

    // Check that detailed information is displayed
    expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument();
    expect(screen.getByText('Premier League')).toBeInTheDocument();
    expect(screen.getByText('Home Win')).toBeInTheDocument();
    expect(screen.getByText('2.5x')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('This is a test explanation')).toBeInTheDocument();
  });

  it('renders premium variant correctly', () => {
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.STANDARD}
        variant={PredictionCardVariant.PREMIUM}
      />
    );

    // Check that premium badge is displayed
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('renders rollover variant correctly', () => {
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.STANDARD}
        variant={PredictionCardVariant.ROLLOVER}
      />
    );

    // Check basic information for rollover variant
    expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument();
    expect(screen.getByText('Premier League')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.STANDARD}
        variant={PredictionCardVariant.DEFAULT}
        onClick={mockOnClick}
      />
    );

    // Click the card
    await user.click(screen.getByText('Home Team vs Away Team'));
    
    // Check that onClick was called
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('displays game code and copy button when provided', () => {
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.STANDARD}
        variant={PredictionCardVariant.DEFAULT}
        onCopy={mockOnCopy}
      />
    );

    // Check that game code is displayed
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('handles null game data gracefully', () => {
    const predictionWithoutGame = {
      ...mockPrediction,
      game: null
    };

    render(
      <BasePredictionCard 
        prediction={predictionWithoutGame}
        mode={PredictionCardMode.STANDARD}
        variant={PredictionCardVariant.DEFAULT}
      />
    );

    // Check that fallback values are used
    expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument();
    expect(screen.getByText('Unknown League')).toBeInTheDocument();
  });

  it('displays index when provided', () => {
    render(
      <BasePredictionCard 
        prediction={mockPrediction}
        mode={PredictionCardMode.COMPACT}
        variant={PredictionCardVariant.DEFAULT}
        index={5}
      />
    );

    // Check that index is displayed
    expect(screen.getByText('#5')).toBeInTheDocument();
  });
});
