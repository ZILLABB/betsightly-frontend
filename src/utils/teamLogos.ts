/**
 * Football Team Logos and Data
 * 
 * Comprehensive system for managing team logos, colors, and metadata
 */

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  league: string;
  country: string;
}

// Premier League Teams
export const PREMIER_LEAGUE_TEAMS: Record<string, TeamInfo> = {
  'arsenal': {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    logo: 'https://assets.stickpng.com/images/584a9b3bb080d7616d298777.png',
    primaryColor: '#DC143C',
    secondaryColor: '#FFD700',
    league: 'Premier League',
    country: 'England'
  },
  'chelsea': {
    id: 'chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    logo: 'https://assets.stickpng.com/images/584a9b53b080d7616d298778.png',
    primaryColor: '#034694',
    secondaryColor: '#FFFFFF',
    league: 'Premier League',
    country: 'England'
  },
  'liverpool': {
    id: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    logo: 'https://assets.stickpng.com/images/584a9b47b080d7616d298776.png',
    primaryColor: '#C8102E',
    secondaryColor: '#FFD700',
    league: 'Premier League',
    country: 'England'
  },
  'manchester-city': {
    id: 'manchester-city',
    name: 'Manchester City',
    shortName: 'MCI',
    logo: 'https://assets.stickpng.com/images/584a9b2fb080d7616d298775.png',
    primaryColor: '#6CABDD',
    secondaryColor: '#FFFFFF',
    league: 'Premier League',
    country: 'England'
  },
  'manchester-united': {
    id: 'manchester-united',
    name: 'Manchester United',
    shortName: 'MUN',
    logo: 'https://assets.stickpng.com/images/584a9b3eb080d7616d298774.png',
    primaryColor: '#DA020E',
    secondaryColor: '#FFD700',
    league: 'Premier League',
    country: 'England'
  },
  'tottenham': {
    id: 'tottenham',
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    logo: 'https://assets.stickpng.com/images/584a9b33b080d7616d298773.png',
    primaryColor: '#132257',
    secondaryColor: '#FFFFFF',
    league: 'Premier League',
    country: 'England'
  }
};

// La Liga Teams
export const LA_LIGA_TEAMS: Record<string, TeamInfo> = {
  'real-madrid': {
    id: 'real-madrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    logo: 'https://assets.stickpng.com/images/584a9b09b080d7616d298770.png',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FFD700',
    league: 'La Liga',
    country: 'Spain'
  },
  'barcelona': {
    id: 'barcelona',
    name: 'FC Barcelona',
    shortName: 'BAR',
    logo: 'https://assets.stickpng.com/images/584a9b1bb080d7616d298771.png',
    primaryColor: '#A50044',
    secondaryColor: '#004D98',
    league: 'La Liga',
    country: 'Spain'
  },
  'atletico-madrid': {
    id: 'atletico-madrid',
    name: 'Atlético Madrid',
    shortName: 'ATM',
    logo: 'https://assets.stickpng.com/images/584a9b23b080d7616d298772.png',
    primaryColor: '#CE3524',
    secondaryColor: '#FFFFFF',
    league: 'La Liga',
    country: 'Spain'
  }
};

// Serie A Teams
export const SERIE_A_TEAMS: Record<string, TeamInfo> = {
  'juventus': {
    id: 'juventus',
    name: 'Juventus',
    shortName: 'JUV',
    logo: 'https://assets.stickpng.com/images/584a9ad5b080d7616d29876f.png',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    league: 'Serie A',
    country: 'Italy'
  },
  'ac-milan': {
    id: 'ac-milan',
    name: 'AC Milan',
    shortName: 'MIL',
    logo: 'https://assets.stickpng.com/images/584a9ae5b080d7616d29876e.png',
    primaryColor: '#FB090B',
    secondaryColor: '#000000',
    league: 'Serie A',
    country: 'Italy'
  },
  'inter-milan': {
    id: 'inter-milan',
    name: 'Inter Milan',
    shortName: 'INT',
    logo: 'https://assets.stickpng.com/images/584a9af1b080d7616d29876d.png',
    primaryColor: '#0068A8',
    secondaryColor: '#000000',
    league: 'Serie A',
    country: 'Italy'
  }
};

// Bundesliga Teams
export const BUNDESLIGA_TEAMS: Record<string, TeamInfo> = {
  'bayern-munich': {
    id: 'bayern-munich',
    name: 'Bayern Munich',
    shortName: 'BAY',
    logo: 'https://assets.stickpng.com/images/584a9ac9b080d7616d29876c.png',
    primaryColor: '#DC052D',
    secondaryColor: '#0066B2',
    league: 'Bundesliga',
    country: 'Germany'
  },
  'borussia-dortmund': {
    id: 'borussia-dortmund',
    name: 'Borussia Dortmund',
    shortName: 'BVB',
    logo: 'https://assets.stickpng.com/images/584a9abdb080d7616d29876b.png',
    primaryColor: '#FDE100',
    secondaryColor: '#000000',
    league: 'Bundesliga',
    country: 'Germany'
  },
  'rb-leipzig': {
    id: 'rb-leipzig',
    name: 'RB Leipzig',
    shortName: 'RBL',
    logo: 'https://assets.stickpng.com/images/5a1c3c7e4ac6f00ff8ae3c2e.png',
    primaryColor: '#DC143C',
    secondaryColor: '#FFFFFF',
    league: 'Bundesliga',
    country: 'Germany'
  }
};

// Ligue 1 Teams
export const LIGUE_1_TEAMS: Record<string, TeamInfo> = {
  'psg': {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    logo: 'https://assets.stickpng.com/images/584a9b63b080d7616d298779.png',
    primaryColor: '#004170',
    secondaryColor: '#DC143C',
    league: 'Ligue 1',
    country: 'France'
  },
  'marseille': {
    id: 'marseille',
    name: 'Olympique Marseille',
    shortName: 'OM',
    logo: 'https://assets.stickpng.com/images/584a9b6fb080d7616d29877a.png',
    primaryColor: '#009BDF',
    secondaryColor: '#FFFFFF',
    league: 'Ligue 1',
    country: 'France'
  }
};

// Combine all teams
export const ALL_TEAMS: Record<string, TeamInfo> = {
  ...PREMIER_LEAGUE_TEAMS,
  ...LA_LIGA_TEAMS,
  ...SERIE_A_TEAMS,
  ...BUNDESLIGA_TEAMS,
  ...LIGUE_1_TEAMS
};

// Team name variations and aliases for better matching
export const TEAM_ALIASES: Record<string, string> = {
  // Arsenal variations
  'arsenal fc': 'arsenal',
  'the gunners': 'arsenal',
  
  // Chelsea variations
  'chelsea fc': 'chelsea',
  'the blues': 'chelsea',
  
  // Liverpool variations
  'liverpool fc': 'liverpool',
  'the reds': 'liverpool',
  
  // Manchester City variations
  'man city': 'manchester-city',
  'manchester city fc': 'manchester-city',
  'city': 'manchester-city',
  
  // Manchester United variations
  'man united': 'manchester-united',
  'manchester united fc': 'manchester-united',
  'united': 'manchester-united',
  'man utd': 'manchester-united',
  
  // Tottenham variations
  'tottenham hotspur': 'tottenham',
  'spurs': 'tottenham',
  'thfc': 'tottenham',
  
  // Real Madrid variations
  'real madrid cf': 'real-madrid',
  'madrid': 'real-madrid',
  
  // Barcelona variations
  'fc barcelona': 'barcelona',
  'barca': 'barcelona',
  
  // Atletico Madrid variations
  'atletico madrid': 'atletico-madrid',
  'atleti': 'atletico-madrid',
  
  // Juventus variations
  'juventus fc': 'juventus',
  'juve': 'juventus',
  
  // AC Milan variations
  'milan': 'ac-milan',
  'ac milan': 'ac-milan',
  
  // Inter Milan variations
  'inter': 'inter-milan',
  'internazionale': 'inter-milan',
  
  // Bayern Munich variations
  'bayern': 'bayern-munich',
  'fc bayern munich': 'bayern-munich',
  
  // Borussia Dortmund variations
  'dortmund': 'borussia-dortmund',
  'bvb': 'borussia-dortmund',

  // PSG variations
  'paris saint-germain': 'psg',
  'paris sg': 'psg',
  'paris': 'psg',

  // Marseille variations
  'olympique marseille': 'marseille',
  'om': 'marseille',

  // RB Leipzig variations
  'leipzig': 'rb-leipzig',
  'red bull leipzig': 'rb-leipzig'
};

/**
 * Get team information by name (with fuzzy matching)
 */
export const getTeamInfo = (teamName: string): TeamInfo | null => {
  if (!teamName) return null;
  
  const normalizedName = teamName.toLowerCase().trim();
  
  // Direct match
  if (ALL_TEAMS[normalizedName]) {
    return ALL_TEAMS[normalizedName];
  }
  
  // Alias match
  if (TEAM_ALIASES[normalizedName]) {
    return ALL_TEAMS[TEAM_ALIASES[normalizedName]];
  }
  
  // Partial match
  const teamKeys = Object.keys(ALL_TEAMS);
  const partialMatch = teamKeys.find(key => 
    key.includes(normalizedName) || normalizedName.includes(key)
  );
  
  if (partialMatch) {
    return ALL_TEAMS[partialMatch];
  }
  
  return null;
};

/**
 * Get team logo URL with multiple fallback sources
 */
export const getTeamLogo = (teamName: string): string => {
  const teamInfo = getTeamInfo(teamName);
  return teamInfo?.logo || generateFallbackLogo(teamName);
};

/**
 * Get alternative logo sources for better reliability
 */
export const getAlternativeLogos = (teamName: string): string[] => {
  const teamInfo = getTeamInfo(teamName);
  if (!teamInfo) return [];

  const alternatives: string[] = [];

  // Add primary logo
  if (teamInfo.logo) {
    alternatives.push(teamInfo.logo);
  }

  // Add alternative sources based on team
  const teamId = teamInfo.id;
  const logobaseUrl = `https://logoeps.com/wp-content/uploads/2013/03/vector-${teamId}-logo.png`;
  const wikimediaUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/`;

  // Add some common alternative sources
  alternatives.push(
    `https://img.icons8.com/color/96/${teamId}-fc.png`,
    `https://www.thesportsdb.com/images/media/team/badge/${teamId}.png`
  );

  return alternatives;
};

/**
 * Generate a fallback logo using team initials
 */
export const generateFallbackLogo = (teamName: string): string => {
  if (!teamName) return '';
  
  const initials = teamName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  // Generate a simple SVG logo with team initials
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#1A1A27" stroke="#F59E0B" stroke-width="2"/>
      <text x="20" y="26" text-anchor="middle" fill="#F59E0B" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Get team primary color
 */
export const getTeamColor = (teamName: string): string => {
  const teamInfo = getTeamInfo(teamName);
  return teamInfo?.primaryColor || '#F59E0B';
};

/**
 * Get popular teams for display
 */
export const getPopularTeams = (): TeamInfo[] => {
  return [
    ALL_TEAMS['manchester-city'],
    ALL_TEAMS['arsenal'],
    ALL_TEAMS['liverpool'],
    ALL_TEAMS['chelsea'],
    ALL_TEAMS['manchester-united'],
    ALL_TEAMS['tottenham'],
    ALL_TEAMS['real-madrid'],
    ALL_TEAMS['barcelona'],
    ALL_TEAMS['atletico-madrid'],
    ALL_TEAMS['bayern-munich'],
    ALL_TEAMS['borussia-dortmund'],
    ALL_TEAMS['rb-leipzig'],
    ALL_TEAMS['juventus'],
    ALL_TEAMS['ac-milan'],
    ALL_TEAMS['inter-milan'],
    ALL_TEAMS['psg'],
    ALL_TEAMS['marseille']
  ].filter(Boolean);
};

export default {
  ALL_TEAMS,
  TEAM_ALIASES,
  getTeamInfo,
  getTeamLogo,
  getTeamColor,
  generateFallbackLogo,
  getPopularTeams
};
