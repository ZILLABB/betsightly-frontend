import type { 
  Prediction, 
  Fixture, 
  Team, 
  Punter, 
  Bookmaker, 
  BettingCode, 
  StatsOverview,
  SportStats,
  RolloverGame,
  PredictionCategoriesResponse,
  BettingCodesResponse
} from '../types';

// Mock Teams Data
export const mockTeams: Team[] = [
  { id: '1', name: 'Manchester United', logo: '/logos/man-utd.png', form: 'WWLWD' },
  { id: '2', name: 'Liverpool', logo: '/logos/liverpool.png', form: 'WDWWL' },
  { id: '3', name: 'Arsenal', logo: '/logos/arsenal.png', form: 'LWWWW' },
  { id: '4', name: 'Chelsea', logo: '/logos/chelsea.png', form: 'WLWDW' },
  { id: '5', name: 'Manchester City', logo: '/logos/man-city.png', form: 'WWWWW' },
  { id: '6', name: 'Tottenham', logo: '/logos/tottenham.png', form: 'LDWWL' },
  { id: '7', name: 'Newcastle', logo: '/logos/newcastle.png', form: 'WDLWW' },
  { id: '8', name: 'Brighton', logo: '/logos/brighton.png', form: 'LWDWL' },
  { id: '9', name: 'Real Madrid', logo: '/logos/real-madrid.png', form: 'WWWLW' },
  { id: '10', name: 'Barcelona', logo: '/logos/barcelona.png', form: 'WLWWW' },
  { id: '11', name: 'Bayern Munich', logo: '/logos/bayern.png', form: 'WWWWL' },
  { id: '12', name: 'PSG', logo: '/logos/psg.png', form: 'WDWWW' },
];

// Mock Punters Data with Enhanced Profiles
export const mockPunters: Punter[] = [
  {
    id: 1,
    name: 'Alex Thompson',
    nickname: 'The Predictor',
    country: 'UK',
    popularity: 95,
    specialty: 'Premier League',
    success_rate: 78.5,
    image_url: '/avatars/alex.jpg',
    bio: 'Premier League specialist with 5+ years of experience. Known for accurate match result predictions and deep tactical analysis.',
    verified: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    winRate: 78.5,
    totalPredictions: 245,
    wonPredictions: 192,
    averageOdds: 2.8,
    specialties: ['soccer'],
    social_media: {
      twitter: 'https://twitter.com/alexpredictor',
      instagram: 'https://instagram.com/alexpredictor'
    },
    // Enhanced fields for beautiful UI
    rank: 1,
    badge: 'Elite',
    streak: 12,
    monthlyWins: 28,
    totalEarnings: 15420,
    followers: 8500,
    achievements: ['Top Predictor 2024', 'Premier League Expert', '10+ Win Streak'],
    recentForm: 'WWWLWWWWLW',
    expertise: ['Match Result', 'Over/Under', 'Team Analysis'],
    joinedDate: '2023-01-15',
    lastActive: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Maria Santos',
    nickname: 'Goal Hunter',
    country: 'Spain',
    popularity: 88,
    specialty: 'La Liga',
    success_rate: 82.1,
    image_url: '/avatars/maria.jpg',
    bio: 'La Liga expert focusing on over/under predictions. Statistical analysis specialist with proven track record.',
    verified: true,
    created_at: '2023-02-20T14:30:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    winRate: 82.1,
    totalPredictions: 189,
    wonPredictions: 155,
    averageOdds: 3.2,
    specialties: ['soccer'],
    social_media: {
      twitter: 'https://twitter.com/goalhunter',
      youtube: 'https://youtube.com/goalhunter'
    },
    // Enhanced fields
    rank: 2,
    badge: 'Elite',
    streak: 8,
    monthlyWins: 31,
    totalEarnings: 18750,
    followers: 12300,
    achievements: ['La Liga Master', 'Goal Prediction Expert', 'Rising Star 2024'],
    recentForm: 'WWWWLWWWWW',
    expertise: ['Over/Under', 'BTTS', 'Statistical Analysis'],
    joinedDate: '2023-02-20',
    lastActive: '2024-01-15T09:30:00Z'
  },
  {
    id: 3,
    name: 'James Wilson',
    nickname: 'Stats Master',
    country: 'USA',
    popularity: 91,
    specialty: 'Multi-League',
    success_rate: 75.8,
    image_url: '/avatars/james.jpg',
    bio: 'Data-driven predictions across multiple leagues with advanced statistical modeling and machine learning.',
    verified: true,
    created_at: '2023-03-10T09:15:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    winRate: 75.8,
    totalPredictions: 312,
    wonPredictions: 236,
    averageOdds: 2.5,
    specialties: ['soccer', 'basketball'],
    social_media: {
      twitter: 'https://twitter.com/statsmaster',
      linkedin: 'https://linkedin.com/in/jameswilson'
    },
    rank: 3,
    badge: 'Pro',
    streak: 6,
    monthlyWins: 29,
    totalEarnings: 14200,
    followers: 7800,
    achievements: ['Multi-League Expert', 'Data Scientist', 'Statistical Genius'],
    recentForm: 'WLWWWWLWWL',
    expertise: ['Statistical Analysis', 'Multi-League', 'Data Modeling'],
    joinedDate: '2023-03-10',
    lastActive: '2024-01-15T08:45:00Z'
  },
  {
    id: 4,
    name: 'Sophie Chen',
    nickname: 'Asian Football Queen',
    country: 'Singapore',
    popularity: 94,
    specialty: 'Asian Leagues',
    success_rate: 85.7,
    image_url: '/avatars/sophie.jpg',
    bio: 'Asian football leagues specialist with deep cultural insights and market knowledge.',
    verified: true,
    created_at: '2023-01-05T16:20:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    winRate: 85.7,
    totalPredictions: 167,
    wonPredictions: 143,
    averageOdds: 2.9,
    specialties: ['soccer'],
    social_media: {
      twitter: 'https://twitter.com/sophiechen',
      instagram: 'https://instagram.com/asianfootballqueen'
    },
    rank: 2,
    badge: 'Elite',
    streak: 15,
    monthlyWins: 35,
    totalEarnings: 21300,
    followers: 15600,
    achievements: ['Asian League Expert', 'Cultural Analyst', 'Top Female Predictor'],
    recentForm: 'WWWWWWLWWW',
    expertise: ['Asian Leagues', 'Cultural Analysis', 'Market Trends'],
    joinedDate: '2023-01-05',
    lastActive: '2024-01-15T11:15:00Z'
  },
  {
    id: 5,
    name: 'Roberto Silva',
    nickname: 'El Maestro',
    country: 'Brazil',
    popularity: 89,
    specialty: 'South American Football',
    success_rate: 79.8,
    image_url: '/avatars/roberto.jpg',
    bio: 'South American football expert with tactical genius and insider knowledge.',
    verified: true,
    created_at: '2023-04-12T13:45:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    winRate: 79.8,
    totalPredictions: 203,
    wonPredictions: 162,
    averageOdds: 3.1,
    specialties: ['soccer'],
    social_media: {
      twitter: 'https://twitter.com/elmaestro',
      youtube: 'https://youtube.com/elmaestrofootball'
    },
    rank: 4,
    badge: 'Elite',
    streak: 9,
    monthlyWins: 26,
    totalEarnings: 16800,
    followers: 11200,
    achievements: ['South American Expert', 'Copa Libertadores Specialist', 'Tactical Genius'],
    recentForm: 'WWLWWWWLWW',
    expertise: ['South American Leagues', 'Tactical Analysis', 'Player Scouting'],
    joinedDate: '2023-04-12',
    lastActive: '2024-01-15T10:30:00Z'
  },
  {
    id: 6,
    name: 'Emma Johnson',
    nickname: 'The Algorithm',
    country: 'Canada',
    popularity: 83,
    specialty: 'AI Predictions',
    success_rate: 77.2,
    image_url: '/avatars/emma.jpg',
    bio: 'AI and machine learning specialist applying cutting-edge technology to football predictions.',
    verified: true,
    created_at: '2023-06-08T11:30:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    winRate: 77.2,
    totalPredictions: 156,
    wonPredictions: 120,
    averageOdds: 2.7,
    specialties: ['soccer'],
    social_media: {
      twitter: 'https://twitter.com/thealgorithm',
      github: 'https://github.com/emmajohnson'
    },
    rank: 5,
    badge: 'Pro',
    streak: 7,
    monthlyWins: 24,
    totalEarnings: 12400,
    followers: 6800,
    achievements: ['AI Specialist', 'Tech Innovator', 'Algorithm Developer'],
    recentForm: 'WLWWWWLWWL',
    expertise: ['AI Predictions', 'Machine Learning', 'Algorithm Development'],
    joinedDate: '2023-06-08',
    lastActive: '2024-01-15T09:00:00Z'
  }
];

// Mock Bookmakers Data
export const mockBookmakers: Bookmaker[] = [
  {
    id: 1,
    name: 'Bet365',
    country: 'UK',
    website: 'https://bet365.com',
    logo_url: '/bookmakers/bet365.png',
    description: 'Leading online betting platform',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Betway',
    country: 'Malta',
    website: 'https://betway.com',
    logo_url: '/bookmakers/betway.png',
    description: 'Premium sports betting experience',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    name: '1xBet',
    country: 'Cyprus',
    website: 'https://1xbet.com',
    logo_url: '/bookmakers/1xbet.png',
    description: 'Global betting platform',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

// Mock Fixtures Data
export const mockFixtures: Fixture[] = [
  {
    id: 1,
    home_team: 'Manchester United',
    away_team: 'Liverpool',
    league: 'Premier League',
    match_datetime: '2024-01-20T15:00:00Z',
    home_team_form: 'WWLWD',
    away_team_form: 'WDWWL',
    venue: 'Old Trafford',
    status: 'scheduled'
  },
  {
    id: 2,
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    match_datetime: '2024-01-20T17:30:00Z',
    home_team_form: 'LWWWW',
    away_team_form: 'WLWDW',
    venue: 'Emirates Stadium',
    status: 'scheduled'
  },
  {
    id: 3,
    home_team: 'Manchester City',
    away_team: 'Tottenham',
    league: 'Premier League',
    match_datetime: '2024-01-21T14:00:00Z',
    home_team_form: 'WWWWW',
    away_team_form: 'LDWWL',
    venue: 'Etihad Stadium',
    status: 'scheduled'
  },
  {
    id: 4,
    home_team: 'Real Madrid',
    away_team: 'Barcelona',
    league: 'La Liga',
    match_datetime: '2024-01-21T20:00:00Z',
    home_team_form: 'WWWLW',
    away_team_form: 'WLWWW',
    venue: 'Santiago Bernabéu',
    status: 'scheduled'
  },
  {
    id: 5,
    home_team: 'Bayern Munich',
    away_team: 'PSG',
    league: 'Champions League',
    match_datetime: '2024-01-22T20:00:00Z',
    home_team_form: 'WWWWL',
    away_team_form: 'WDWWW',
    venue: 'Allianz Arena',
    status: 'scheduled'
  }
];

// Helper function to generate random dates
const getRandomDate = (daysFromNow: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// Helper function to generate random confidence
const getRandomConfidence = (min: number = 65, max: number = 95) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to generate random odds
const getRandomOdds = (category: '2_odds' | '5_odds' | '10_odds') => {
  switch (category) {
    case '2_odds': return Math.random() * (2.5 - 1.5) + 1.5;
    case '5_odds': return Math.random() * (6.0 - 3.0) + 3.0;
    case '10_odds': return Math.random() * (15.0 - 8.0) + 8.0;
    default: return 2.0;
  }
};

// Mock Predictions Generator
const generateMockPrediction = (
  fixture: Fixture,
  category: '2_odds' | '5_odds' | '10_odds' | 'rollover',
  index: number
): Prediction => {
  const odds = getRandomOdds(category as '2_odds' | '5_odds' | '10_odds');
  const confidence = getRandomConfidence();
  const punter = mockPunters[index % mockPunters.length];

  const predictionTypes = ['match_result', 'over_under', 'btts'] as const;
  const predictionType = predictionTypes[index % predictionTypes.length];

  let prediction = '';
  let reason = '';

  switch (predictionType) {
    case 'match_result':
      const outcomes = ['Home Win', 'Draw', 'Away Win'];
      prediction = outcomes[index % outcomes.length];
      reason = `Based on recent form and head-to-head statistics, ${prediction.toLowerCase()} is the most likely outcome.`;
      break;
    case 'over_under':
      prediction = index % 2 === 0 ? 'Over 2.5 Goals' : 'Under 2.5 Goals';
      reason = `Both teams' scoring patterns suggest ${prediction.toLowerCase()} is probable.`;
      break;
    case 'btts':
      prediction = index % 2 === 0 ? 'Both Teams to Score' : 'Both Teams Not to Score';
      reason = `Analyzing defensive and offensive capabilities indicates ${prediction.toLowerCase()}.`;
      break;
  }

  // Create game object for backward compatibility
  const game = {
    id: fixture.id.toString(),
    homeTeam: {
      id: `team-${fixture.home_team.replace(/\s+/g, '-').toLowerCase()}`,
      name: fixture.home_team
    },
    awayTeam: {
      id: `team-${fixture.away_team.replace(/\s+/g, '-').toLowerCase()}`,
      name: fixture.away_team
    },
    startTime: fixture.match_datetime,
    league: fixture.league,
    venue: fixture.venue,
    status: fixture.status || 'scheduled',
    fixture
  };

  return {
    id: index + 1,
    fixture,
    prediction_type: predictionType,
    prediction,
    odds: Number(odds.toFixed(2)),
    confidence,
    created_at: getRandomDate(-1),
    updated_at: getRandomDate(-1),
    status: index % 4 === 0 ? 'won' : index % 4 === 1 ? 'lost' : 'pending',
    service_used: 'advanced_ml_service',
    quality_rating: confidence > 80 ? 'HIGH' : confidence > 70 ? 'MEDIUM' : 'LOW',
    prediction_quality: confidence,
    match_result_confidence: confidence + Math.random() * 10 - 5,
    over_under_confidence: confidence + Math.random() * 10 - 5,
    btts_confidence: confidence + Math.random() * 10 - 5,
    reason,
    explanation: reason,
    punter,
    punterId: punter.id.toString(),
    bookmaker: 'bet365',
    gameId: fixture.id.toString(),
    game, // Add the game object
    predictionType: prediction,
    createdAt: getRandomDate(-1),
    confidencePct: confidence,
    value: Math.floor(confidence / 20) + 1,
    homeWinPct: predictionType === 'match_result' && prediction === 'Home Win' ? confidence : Math.random() * 40 + 20,
    drawPct: predictionType === 'match_result' && prediction === 'Draw' ? confidence : Math.random() * 30 + 15,
    awayWinPct: predictionType === 'match_result' && prediction === 'Away Win' ? confidence : Math.random() * 40 + 20,
    over25Pct: predictionType === 'over_under' && prediction.includes('Over') ? confidence : Math.random() * 50 + 25,
    under25Pct: predictionType === 'over_under' && prediction.includes('Under') ? confidence : Math.random() * 50 + 25,
    bttsYesPct: predictionType === 'btts' && prediction.includes('Score') ? confidence : Math.random() * 60 + 20,
    bttsNoPct: predictionType === 'btts' && prediction.includes('Not') ? confidence : Math.random() * 60 + 20,
  };
};

// Generate Mock Predictions by Category
export const mock2OddsPredictions: Prediction[] = mockFixtures.slice(0, 8).map((fixture, index) =>
  generateMockPrediction(fixture, '2_odds', index)
);

export const mock5OddsPredictions: Prediction[] = mockFixtures.slice(0, 6).map((fixture, index) =>
  generateMockPrediction(fixture, '5_odds', index + 10)
);

export const mock10OddsPredictions: Prediction[] = mockFixtures.slice(0, 4).map((fixture, index) =>
  generateMockPrediction(fixture, '10_odds', index + 20)
);

export const mockRolloverPredictions: Prediction[] = mockFixtures.slice(0, 3).map((fixture, index) => {
  const prediction = generateMockPrediction(fixture, 'rollover', index + 30);
  return {
    ...prediction,
    rolloverDay: index + 1, // Add rollover day
    gameCode: `ROLL${(index + 1).toString().padStart(2, '0')}` // Add game code
  };
});

// All Mock Predictions Combined
export const mockAllPredictions: Prediction[] = [
  ...mock2OddsPredictions,
  ...mock5OddsPredictions,
  ...mock10OddsPredictions,
  ...mockRolloverPredictions
];

// Mock Betting Codes
export const mockBettingCodes: BettingCode[] = [
  {
    id: 1,
    code: 'MU-LIV-2024-001',
    punter_id: 1,
    punter_name: 'Alex Thompson',
    bookmaker_id: 1,
    bookmaker_name: 'Bet365',
    odds: 2.45,
    event_date: '2024-01-20T15:00:00Z',
    expiry_date: '2024-01-20T14:45:00Z',
    status: 'pending',
    confidence: 85,
    featured: true,
    notes: 'Strong value bet based on recent form analysis',
    created_at: getRandomDate(-2),
    updated_at: getRandomDate(-1),
    punter: mockPunters[0],
    bookmaker: mockBookmakers[0]
  },
  {
    id: 2,
    code: 'ARS-CHE-2024-002',
    punter_id: 2,
    punter_name: 'Maria Santos',
    bookmaker_id: 2,
    bookmaker_name: 'Betway',
    odds: 3.20,
    event_date: '2024-01-20T17:30:00Z',
    expiry_date: '2024-01-20T17:15:00Z',
    status: 'pending',
    confidence: 78,
    featured: true,
    notes: 'Over 2.5 goals prediction with high confidence',
    created_at: getRandomDate(-2),
    updated_at: getRandomDate(-1),
    punter: mockPunters[1],
    bookmaker: mockBookmakers[1]
  },
  {
    id: 3,
    code: 'RM-BAR-2024-003',
    punter_id: 3,
    punter_name: 'James Wilson',
    bookmaker_id: 3,
    bookmaker_name: '1xBet',
    odds: 1.85,
    event_date: '2024-01-21T20:00:00Z',
    expiry_date: '2024-01-21T19:45:00Z',
    status: 'won',
    confidence: 92,
    featured: true,
    notes: 'El Clasico special - Both teams to score',
    created_at: getRandomDate(-3),
    updated_at: getRandomDate(-1),
    punter: mockPunters[2],
    bookmaker: mockBookmakers[2]
  },
  {
    id: 4,
    code: 'MCI-TOT-2024-004',
    punter_id: 1,
    punter_name: 'Alex Thompson',
    bookmaker_id: 1,
    bookmaker_name: 'Bet365',
    odds: 4.50,
    event_date: '2024-01-21T14:00:00Z',
    expiry_date: '2024-01-21T13:45:00Z',
    status: 'lost',
    confidence: 72,
    featured: false,
    notes: 'High odds accumulator bet',
    created_at: getRandomDate(-4),
    updated_at: getRandomDate(-2),
    punter: mockPunters[0],
    bookmaker: mockBookmakers[0]
  }
];

// Mock Stats Overview
export const mockStatsOverview: StatsOverview = {
  totalPredictions: 156,
  wonPredictions: 98,
  lostPredictions: 31,
  pendingPredictions: 27,
  successRate: 76.2,
  averageOdds: 3.4
};

// Mock Sport Stats
export const mockSportStats: SportStats[] = [
  { sport: 'soccer', totalPredictions: 120, successRate: 78.5 },
  { sport: 'basketball', totalPredictions: 24, successRate: 71.2 },
  { sport: 'tennis', totalPredictions: 12, successRate: 83.3 }
];

// Mock Rollover Game
export const mockRolloverGame: RolloverGame = {
  id: 'rollover-2024-001',
  predictions: mockRolloverPredictions,
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-25'),
  successRate: 85.7,
  isActive: true,
  targetOdds: 10.0,
  dailyCombinations: [
    {
      day: 1,
      date: new Date('2024-01-15'),
      predictions: [mockRolloverPredictions[0]],
      combinedOdds: 2.1,
      combinedConfidence: 85,
      status: 'won'
    },
    {
      day: 2,
      date: new Date('2024-01-16'),
      predictions: [mockRolloverPredictions[1]],
      combinedOdds: 1.9,
      combinedConfidence: 78,
      status: 'won'
    },
    {
      day: 3,
      date: new Date('2024-01-17'),
      predictions: [mockRolloverPredictions[2]],
      combinedOdds: 2.3,
      combinedConfidence: 82,
      status: 'pending'
    }
  ]
};

// Mock API Response Structures
export const mockPredictionCategoriesResponse: PredictionCategoriesResponse = {
  "2_odds": mock2OddsPredictions,
  "5_odds": mock5OddsPredictions,
  "10_odds": mock10OddsPredictions,
  "rollover": mockRolloverPredictions,
  service_used: 'advanced_ml_service',
  timestamp: new Date().toISOString()
};



export const mockBettingCodesResponse: BettingCodesResponse = {
  betting_codes: mockBettingCodes,
  total: mockBettingCodes.length,
  skip: 0,
  limit: 20,
  has_more: false
};

// Mock Data Service Functions
export const getMockPredictions = (category?: '2_odds' | '5_odds' | '10_odds' | 'rollover'): Prediction[] => {
  switch (category) {
    case '2_odds': return mock2OddsPredictions;
    case '5_odds': return mock5OddsPredictions;
    case '10_odds': return mock10OddsPredictions;
    case 'rollover': return mockRolloverPredictions;
    default: return mockAllPredictions;
  }
};

export const getMockBestPredictions = (): Prediction[] => {
  // Return a mix of high-confidence predictions from all categories
  return [
    ...mock2OddsPredictions.slice(0, 3),
    ...mock5OddsPredictions.slice(0, 2),
    ...mock10OddsPredictions.slice(0, 1)
  ].sort((a, b) => b.confidence - a.confidence);
};

export const getMockPredictionsByOdds = (minOdds: number, maxOdds: number): Prediction[] => {
  return mockAllPredictions.filter(p => p.odds >= minOdds && p.odds <= maxOdds);
};

export const getMockPredictionsByStatus = (status: 'won' | 'lost' | 'pending'): Prediction[] => {
  return mockAllPredictions.filter(p => p.status === status);
};

export const getMockPredictionsByDate = (date: Date): Prediction[] => {
  const targetDate = date.toISOString().split('T')[0];
  return mockAllPredictions.filter(p =>
    p.fixture.match_datetime.split('T')[0] === targetDate
  );
};

export const getMockAnalyticsData = () => ({
  totalPredictions: mockStatsOverview.totalPredictions,
  successRate: mockStatsOverview.successRate,
  averageOdds: mockStatsOverview.averageOdds,
  winRate: mockStatsOverview.successRate,
  wonPredictions: mockStatsOverview.wonPredictions,
  lostPredictions: mockStatsOverview.lostPredictions,
  pendingPredictions: mockStatsOverview.pendingPredictions,
  sportBreakdown: mockSportStats,
  recentPerformance: [
    { date: '2024-01-15', wins: 8, losses: 2, pending: 3 },
    { date: '2024-01-16', wins: 6, losses: 3, pending: 4 },
    { date: '2024-01-17', wins: 9, losses: 1, pending: 2 },
    { date: '2024-01-18', wins: 7, losses: 2, pending: 5 },
    { date: '2024-01-19', wins: 5, losses: 4, pending: 3 }
  ],
  topPunters: mockPunters.slice(0, 3),
  bestModels: [
    { name: 'Premier League ML', accuracy: 84.2, predictions: 45 },
    { name: 'La Liga Predictor', accuracy: 81.7, predictions: 38 },
    { name: 'Champions League AI', accuracy: 79.3, predictions: 22 }
  ]
});

// Export default mock data object
export const mockData = {
  predictions: {
    all: mockAllPredictions,
    '2_odds': mock2OddsPredictions,
    '5_odds': mock5OddsPredictions,
    '10_odds': mock10OddsPredictions,
    rollover: mockRolloverPredictions,
    best: getMockBestPredictions()
  },
  bettingCodes: mockBettingCodes,
  punters: mockPunters,
  bookmakers: mockBookmakers,
  teams: mockTeams,
  fixtures: mockFixtures,
  stats: mockStatsOverview,
  sportStats: mockSportStats,
  rolloverGame: mockRolloverGame,
  analytics: getMockAnalyticsData()
};
