import type { Game, Prediction, RolloverGame, SportType, StatsOverview, Punter, BookmakerType } from "../types";
import { getDaysArray } from "../lib/utils";

// Generate detailed reasons for predictions
const generatePredictionReason = (
  predictionType: string,
  homeTeam: string,
  awayTeam: string,
  odds: number,
  sport: SportType
): string => {
  // Different reason templates based on prediction type
  const homeWinReasons = [
    `${homeTeam} has won 4 of their last 5 home games, making them strong favorites.`,
    `${awayTeam} has a poor away record this season, giving ${homeTeam} the edge.`,
    `${homeTeam} has key players returning from injury, strengthening their lineup.`,
    `Historical head-to-head stats favor ${homeTeam} when playing at home.`,
    `${homeTeam}'s recent form has been exceptional with 3 consecutive wins.`
  ];

  const awayWinReasons = [
    `${awayTeam} has been excellent on the road, winning their last 3 away games.`,
    `${homeTeam} is missing several key players due to injuries and suspensions.`,
    `${awayTeam} has dominated recent meetings between these teams.`,
    `${awayTeam}'s counter-attacking style is perfect against ${homeTeam}'s defensive weaknesses.`,
    `${homeTeam} has been struggling with consistency at home this season.`
  ];

  const drawReasons = [
    `Both teams have drawn 3 of their last 5 matches, suggesting another tight contest.`,
    `${homeTeam} and ${awayTeam} are evenly matched with similar form and quality.`,
    `Historical meetings between these teams have often ended in draws.`,
    `Both teams have strong defenses but struggle to convert chances.`,
    `With key players missing on both sides, a draw is the most likely outcome.`
  ];

  const overGoalsReasons = [
    `Both teams have scored in 80% of their recent matches, suggesting goals at both ends.`,
    `${homeTeam} and ${awayTeam} both play attacking styles with defensive vulnerabilities.`,
    `The last 5 meetings between these teams averaged 3.2 goals per game.`,
    `${homeTeam}'s home games this season have averaged 3.5 goals.`,
    `Both teams need a win and will likely adopt attacking approaches.`
  ];

  const underGoalsReasons = [
    `Both teams have strong defensive records with 4 clean sheets in their last 6 games.`,
    `${homeTeam} and ${awayTeam} both play cautious, defensive styles.`,
    `The last 3 meetings between these teams have all had under 2.5 goals.`,
    `Key attacking players are missing for both sides, limiting offensive threats.`,
    `Weather conditions favor a low-scoring affair with limited goal opportunities.`
  ];

  const bttsReasons = [
    `Both teams have scored in 85% of their matches this season.`,
    `${homeTeam} scores consistently at home but has defensive weaknesses.`,
    `${awayTeam} has found the net in their last 7 away games.`,
    `Historical meetings show both teams scoring in 4 of the last 5 encounters.`,
    `Both teams have strong attacking options but struggle defensively.`
  ];

  // Select reason based on prediction type
  let reasons: string[];
  if (predictionType.includes("Home Win")) {
    reasons = homeWinReasons;
  } else if (predictionType.includes("Away Win")) {
    reasons = awayWinReasons;
  } else if (predictionType.includes("Draw")) {
    reasons = drawReasons;
  } else if (predictionType.includes("Over")) {
    reasons = overGoalsReasons;
  } else if (predictionType.includes("Under")) {
    reasons = underGoalsReasons;
  } else if (predictionType.includes("Both Teams to Score")) {
    reasons = bttsReasons;
  } else {
    // Default reasons for other prediction types
    reasons = [
      `Statistical analysis shows high probability for this outcome.`,
      `Value bet based on current odds (${odds.toFixed(2)}).`,
      `${predictionType} has a high success rate in this league.`,
      `Team matchup analysis indicates this as the most likely outcome.`,
      `Recent form and historical data support this prediction.`
    ];
  }

  // Add sport-specific context to some reasons
  if (sport === "soccer" && Math.random() > 0.7) {
    reasons.push(`${homeTeam}'s possession-based style should control the tempo of this match.`);
    reasons.push(`${awayTeam}'s defensive organization will be tested against ${homeTeam}'s attacking threats.`);
  } else if (sport === "basketball" && Math.random() > 0.7) {
    reasons.push(`${homeTeam}'s three-point shooting efficiency gives them the edge in this matchup.`);
    reasons.push(`${awayTeam}'s fast-break offense could exploit ${homeTeam}'s transition defense.`);
  }

  // Use a deterministic approach based on the teams and prediction type
  const seed = (homeTeam.length + awayTeam.length + predictionType.length) % reasons.length;
  return reasons[seed];
};

// Mock Teams
const teams = {
  soccer: [
    { id: "s1", name: "Arsenal", logo: "/teams/arsenal.png" },
    { id: "s2", name: "Manchester United", logo: "/teams/man-utd.png" },
    { id: "s3", name: "Liverpool", logo: "/teams/liverpool.png" },
    { id: "s4", name: "Chelsea", logo: "/teams/chelsea.png" },
    { id: "s5", name: "Manchester City", logo: "/teams/man-city.png" },
    { id: "s6", name: "Tottenham", logo: "/teams/tottenham.png" },
    { id: "s7", name: "Real Madrid", logo: "/teams/real-madrid.png" },
    { id: "s8", name: "Barcelona", logo: "/teams/barcelona.png" },
  ],
  basketball: [
    { id: "b1", name: "LA Lakers", logo: "/teams/lakers.png" },
    { id: "b2", name: "Boston Celtics", logo: "/teams/celtics.png" },
    { id: "b3", name: "Chicago Bulls", logo: "/teams/bulls.png" },
    { id: "b4", name: "Miami Heat", logo: "/teams/heat.png" },
    { id: "b5", name: "Golden State Warriors", logo: "/teams/warriors.png" },
    { id: "b6", name: "Brooklyn Nets", logo: "/teams/nets.png" },
  ],
};

// Mock Leagues
const leagues = {
  soccer: ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"],
  basketball: ["NBA", "EuroLeague", "NCAA"],
};

// Mock Punters
const generatePunters = (): Punter[] => {
  return [
    // Nigerian Punters
    {
      id: "punter-1",
      name: "Sporting King",
      winRate: 78.5,
      totalPredictions: 320,
      wonPredictions: 251,
      averageOdds: 1.95,
      specialties: ["soccer"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/sportingking",
        instagram: "https://instagram.com/sportingking",
        telegram: "https://t.me/sportingking"
      }
    },
    {
      id: "punter-2",
      name: "BetMaster",
      winRate: 75.3,
      totalPredictions: 405,
      wonPredictions: 305,
      averageOdds: 2.2,
      specialties: ["soccer", "basketball"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/betmaster",
        instagram: "https://instagram.com/betmaster",
        telegram: "https://t.me/betmaster"
      }
    },
    {
      id: "punter-3",
      name: "Mr. Bayo",
      winRate: 72.7,
      totalPredictions: 275,
      wonPredictions: 200,
      averageOdds: 2.5,
      specialties: ["soccer"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/mrbayo",
        telegram: "https://t.me/mrbayo"
      }
    },
    {
      id: "punter-4",
      name: "Ekiti Pikin",
      winRate: 71.2,
      totalPredictions: 245,
      wonPredictions: 174,
      averageOdds: 2.15,
      specialties: ["soccer", "basketball"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/ekitipikin",
        instagram: "https://instagram.com/ekitipikin"
      }
    },
    {
      id: "punter-5",
      name: "BetKing",
      winRate: 69.8,
      totalPredictions: 360,
      wonPredictions: 251,
      averageOdds: 2.4,
      specialties: ["soccer"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/betking",
        telegram: "https://t.me/betking"
      }
    },
    // UK Punters
    {
      id: "punter-6",
      name: "The Wizard",
      winRate: 76.5,
      totalPredictions: 420,
      wonPredictions: 321,
      averageOdds: 1.85,
      specialties: ["soccer"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/thewizard",
        instagram: "https://instagram.com/thewizard",
        telegram: "https://t.me/thewizard"
      }
    },
    {
      id: "punter-7",
      name: "The Professor",
      winRate: 74.3,
      totalPredictions: 385,
      wonPredictions: 286,
      averageOdds: 2.1,
      specialties: ["soccer", "basketball"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/theprofessor",
        instagram: "https://instagram.com/theprofessor"
      }
    },
    {
      id: "punter-8",
      name: "The Tipster",
      winRate: 71.7,
      totalPredictions: 295,
      wonPredictions: 211,
      averageOdds: 2.3,
      specialties: ["soccer"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/thetipster",
        telegram: "https://t.me/thetipster"
      }
    },
    {
      id: "punter-9",
      name: "Stats Queen",
      winRate: 70.2,
      totalPredictions: 345,
      wonPredictions: 242,
      averageOdds: 1.95,
      specialties: ["basketball"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/statsqueen",
        instagram: "https://instagram.com/statsqueen"
      }
    },
    {
      id: "punter-10",
      name: "The Oracle",
      winRate: 68.8,
      totalPredictions: 310,
      wonPredictions: 213,
      averageOdds: 2.6,
      specialties: ["soccer", "basketball"],
      verified: true,
      socialMedia: {
        twitter: "https://twitter.com/theoracle",
        instagram: "https://instagram.com/theoracle",
        telegram: "https://t.me/theoracle"
      }
    }
  ];
};

// Generate random games
const generateGames = (count: number, sport: SportType): Game[] => {
  const games: Game[] = [];
  const sportTeams = sport === "mixed"
    ? [...teams.soccer, ...teams.basketball]
    : teams[sport as "soccer" | "basketball"];

  const sportLeagues = sport === "mixed"
    ? [...leagues.soccer, ...leagues.basketball]
    : leagues[sport as "soccer" | "basketball"];

  for (let i = 0; i < count; i++) {
    // Get two random teams
    const homeTeamIndex = Math.floor(Math.random() * sportTeams.length);
    let awayTeamIndex = Math.floor(Math.random() * sportTeams.length);

    // Make sure home and away teams are different
    while (awayTeamIndex === homeTeamIndex) {
      awayTeamIndex = Math.floor(Math.random() * sportTeams.length);
    }

    const homeTeam = sportTeams[homeTeamIndex];
    const awayTeam = sportTeams[awayTeamIndex];

    // Random start time within the next 24 hours
    const startTime = new Date();
    startTime.setHours(
      startTime.getHours() + Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );

    // Random league
    const league = sportLeagues[Math.floor(Math.random() * sportLeagues.length)];

    // Random status
    const statuses = ["scheduled", "live", "finished"];
    const status = statuses[Math.floor(Math.random() * statuses.length)] as "scheduled" | "live" | "finished";

    // Scores for finished or live games
    let homeScore, awayScore;
    if (status !== "scheduled") {
      homeScore = Math.floor(Math.random() * 5);
      awayScore = Math.floor(Math.random() * 5);
    }

    games.push({
      id: `game-${sport}-${i}`,
      sport: sport === "mixed"
        ? (Math.random() > 0.5 ? "soccer" : "basketball")
        : sport,
      homeTeam,
      awayTeam,
      startTime,
      league,
      venue: `${homeTeam.name} Stadium`,
      homeScore,
      awayScore,
      status,
    });
  }

  return games;
};

// Generate predictions for games
const generatePredictions = (games: Game[], punters: Punter[]): Prediction[] => {
  const predictions: Prediction[] = [];
  const predictionTypes = [
    "Home Win",
    "Away Win",
    "Draw",
    "Over 2.5 Goals",
    "Under 2.5 Goals",
    "Both Teams to Score",
    "Clean Sheet",
    "First Half Goals",
  ];

  // Available bookmakers
  const bookmakers: BookmakerType[] = ["bet365", "betway", "1xbet", "22bet", "sportybet"];

  // Generate game codes - some codes will have multiple games
  const generateGameCode = (game: Game, index: number, bookmaker: BookmakerType): string => {
    const homeInitial = game.homeTeam.name.charAt(0);
    const awayInitial = game.awayTeam.name.charAt(0);
    const date = new Date(game.startTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const bookmakerCode = bookmaker.substring(0, 3).toUpperCase();

    // For testing purposes, make some codes have multiple games
    // Every 5th game will share a code with the next 5-15 games
    if (index % 5 === 0) {
      return `${bookmakerCode}-MULTI${day}${month}-${Math.floor(index / 5) + 1}`;
    }

    // Every 3rd game will share a code with 2-3 other games
    if (index % 3 === 0) {
      return `${bookmakerCode}-${homeInitial}${awayInitial}${day}${month}-${Math.floor(index / 3) + 1}`;
    }

    return `${bookmakerCode}-${homeInitial}${awayInitial}${day}${month}-${index + 1}`;
  };

  games.forEach((game, index) => {
    // Random prediction type
    const predictionType = predictionTypes[Math.floor(Math.random() * predictionTypes.length)];

    // Random odds between 1.2 and 10.0
    const odds = 1.2 + Math.random() * 8.8;

    // Status based on game status
    let status = "pending";
    if (game.status === "finished") {
      status = Math.random() > 0.6 ? "won" : "lost"; // 60% win rate for finished games
    }

    // Random creation date in the past week
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7));

    // Assign a punter based on the game's sport
    const eligiblePunters = punters.filter(p =>
      p.specialties.includes(game.sport as SportType) ||
      p.specialties.includes("mixed")
    );

    const punter = eligiblePunters[Math.floor(Math.random() * eligiblePunters.length)];

    // Assign a random bookmaker
    const bookmaker = bookmakers[Math.floor(Math.random() * bookmakers.length)];

    // Generate a game code with bookmaker info
    const gameCode = generateGameCode(game, index, bookmaker);

    predictions.push({
      id: `pred-${index}`,
      gameId: game.id,
      game,
      predictionType,
      odds,
      status: status as "won" | "lost" | "pending",
      createdAt,
      description: generatePredictionReason(predictionType, game.homeTeam.name, game.awayTeam.name, odds, game.sport),
      gameCode,
      punterId: punter?.id,
      punter,
      bookmaker
    });
  });

  return predictions;
};

// Generate rollover games
const generateRolloverGames = (predictions: Prediction[]): RolloverGame[] => {
  const rolloverGames: RolloverGame[] = [];

  // Get dates for the last 10 days
  const dates = getDaysArray(10);

  for (let i = 0; i < 3; i++) {
    const startDate = dates[Math.floor(Math.random() * dates.length)];
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 10);

    // Get random predictions for this rollover game
    const gamePredictions = predictions
      .sort(() => 0.5 - Math.random())
      .slice(0, 5 + Math.floor(Math.random() * 5));

    // Calculate success rate
    const completedPredictions = gamePredictions.filter(p => p.status !== "pending");
    const wonPredictions = completedPredictions.filter(p => p.status === "won");
    const successRate = completedPredictions.length > 0
      ? (wonPredictions.length / completedPredictions.length) * 100
      : 0;

    rolloverGames.push({
      id: `rollover-${i}`,
      predictions: gamePredictions,
      startDate,
      endDate,
      successRate,
      isActive: i === 0, // First one is active
    });
  }

  return rolloverGames;
};

// Generate stats overview
const generateStatsOverview = (predictions: Prediction[]): StatsOverview => {
  const totalPredictions = predictions.length;
  const wonPredictions = predictions.filter(p => p.status === "won").length;
  const lostPredictions = predictions.filter(p => p.status === "lost").length;
  const pendingPredictions = predictions.filter(p => p.status === "pending").length;

  const successRate = (wonPredictions / (wonPredictions + lostPredictions)) * 100 || 0;

  const totalOdds = predictions.reduce((sum, pred) => sum + pred.odds, 0);
  const averageOdds = totalOdds / totalPredictions || 0;

  return {
    totalPredictions,
    wonPredictions,
    lostPredictions,
    pendingPredictions,
    successRate,
    averageOdds,
  };
};

// Generate all mock data
export const generateMockData = () => {
  // Generate games for each sport
  const soccerGames = generateGames(15, "soccer");
  const basketballGames = generateGames(10, "basketball");
  const mixedGames = generateGames(5, "mixed");

  const allGames = [...soccerGames, ...basketballGames, ...mixedGames];

  // Generate punters
  const punters = generatePunters();

  // Generate predictions
  const predictions = generatePredictions(allGames, punters);

  // Generate rollover games
  const rolloverGames = generateRolloverGames(predictions);

  // Generate stats
  const statsOverview = generateStatsOverview(predictions);

  return {
    games: allGames,
    predictions,
    rolloverGames,
    statsOverview,
    punters,
  };
};

// Export mock data
export const mockData = generateMockData();
