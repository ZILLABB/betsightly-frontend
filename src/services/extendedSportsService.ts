import { captureException, addBreadcrumb } from '../utils/errorTracking';
import cache from '../utils/cacheUtils';
import type {
  Game,
  SportType,
  DataSourceType,
  Team
} from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  VERY_LONG: 86400    // 24 hours
};

// API Error class
export class APIError extends Error {
  status: number;
  endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

/**
 * Enhanced fetch function with error handling, retries, and timeouts
 */
async function fetchWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  retries: number = MAX_RETRIES,
  timeout: number = API_TIMEOUT
): Promise<T> {
  // Add breadcrumb for error tracking
  addBreadcrumb('api', `Fetching ${endpoint}`, { retries, timeout });

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      signal: controller.signal
    });

    // Clear timeout
    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `API error: ${response.status}`;

      // If we have retries left and it's a 5xx error, retry
      if (retries > 0 && response.status >= 500) {
        console.warn(`Retrying ${endpoint} after ${response.status} error. Retries left: ${retries}`);
        return fetchWithRetry<T>(endpoint, options, retries - 1, timeout);
      }

      throw new APIError(errorMessage, response.status, endpoint);
    }

    return await response.json() as T;
  } catch (error) {
    // Clear timeout
    clearTimeout(timeoutId);

    // Handle abort error (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (retries > 0) {
        console.warn(`Retrying ${endpoint} after timeout. Retries left: ${retries}`);
        return fetchWithRetry<T>(endpoint, options, retries - 1, timeout);
      }
      throw new APIError(`Request timeout for ${endpoint}`, 408, endpoint);
    }

    // Rethrow API errors
    if (error instanceof APIError) {
      throw error;
    }

    // Handle other errors
    console.error(`Error fetching from ${endpoint}:`, error);
    captureException(error as Error, { endpoint });
    throw new APIError(`Failed to fetch from ${endpoint}: ${(error as Error).message}`, 0, endpoint);
  }
}

/**
 * Get football leagues
 */
export const getFootballLeagues = async (): Promise<Array<{ id: string; name: string; country: string }>> => {
  const cacheKey = 'extended_football_leagues';
  const cachedData = cache.get<Array<{ id: string; name: string; country: string }>>(cacheKey);

  if (cachedData) {
    console.log('Cache hit: football leagues');
    return cachedData;
  }

  try {
    const data = await fetchWithRetry<{ leagues: Array<{ id: string; name: string; country: string }> }>('/extended-sports/football/leagues');
    
    // Cache the result
    cache.set(cacheKey, data.leagues, CACHE_TTL.VERY_LONG);
    return data.leagues;
  } catch (error) {
    console.error('Error fetching football leagues:', error);
    throw error;
  }
};

/**
 * Get football seasons
 */
export const getFootballSeasons = async (): Promise<string[]> => {
  const cacheKey = 'extended_football_seasons';
  const cachedData = cache.get<string[]>(cacheKey);

  if (cachedData) {
    console.log('Cache hit: football seasons');
    return cachedData;
  }

  try {
    const data = await fetchWithRetry<{ seasons: string[] }>('/extended-sports/football/seasons');
    
    // Cache the result
    cache.set(cacheKey, data.seasons, CACHE_TTL.VERY_LONG);
    return data.seasons;
  } catch (error) {
    console.error('Error fetching football seasons:', error);
    throw error;
  }
};

/**
 * Get football matches
 */
export const getFootballMatches = async (
  leagueCode?: string,
  season: string = '23/24',
  startDate?: string,
  endDate?: string
): Promise<Game[]> => {
  const cacheKey = `extended_football_matches_${leagueCode || 'all'}_${season}_${startDate || 'none'}_${endDate || 'none'}`;
  const cachedData = cache.get<Game[]>(cacheKey);

  if (cachedData) {
    console.log(`Cache hit: football matches for ${leagueCode || 'all leagues'}`);
    return cachedData;
  }

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (leagueCode) params.append('league_code', leagueCode);
    if (season) params.append('season', season);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const endpoint = `/extended-sports/football/matches?${params.toString()}`;
    const data = await fetchWithRetry<{ matches: any[] }>(endpoint);
    
    // Map to Game interface
    const games: Game[] = data.matches.map(match => ({
      id: match.id,
      sport: 'soccer' as SportType,
      homeTeam: {
        id: `${match.home_team.replace(/\s+/g, '_').toLowerCase()}`,
        name: match.home_team,
        logo: ''
      },
      awayTeam: {
        id: `${match.away_team.replace(/\s+/g, '_').toLowerCase()}`,
        name: match.away_team,
        logo: ''
      },
      startTime: new Date(match.match_date),
      league: match.league,
      homeScore: match.home_score,
      awayScore: match.away_score,
      status: match.status.toLowerCase() === 'finished' ? 'finished' : 
              match.status.toLowerCase() === 'live' ? 'live' : 'scheduled',
      source: 'football-data-uk' as DataSourceType
    }));
    
    // Cache the result
    cache.set(cacheKey, games, CACHE_TTL.MEDIUM);
    return games;
  } catch (error) {
    console.error('Error fetching football matches:', error);
    throw error;
  }
};

/**
 * Get basketball teams
 */
export const getBasketballTeams = async (): Promise<Team[]> => {
  const cacheKey = 'extended_basketball_teams';
  const cachedData = cache.get<Team[]>(cacheKey);

  if (cachedData) {
    console.log('Cache hit: basketball teams');
    return cachedData;
  }

  try {
    const data = await fetchWithRetry<{ teams: any[] }>('/extended-sports/basketball/teams');
    
    // Map to Team interface
    const teams: Team[] = data.teams.map(team => ({
      id: `nba_${team.id}`,
      name: team.name,
      logo: ''
    }));
    
    // Cache the result
    cache.set(cacheKey, teams, CACHE_TTL.VERY_LONG);
    return teams;
  } catch (error) {
    console.error('Error fetching basketball teams:', error);
    throw error;
  }
};

/**
 * Get basketball games
 */
export const getBasketballGames = async (
  startDate?: string,
  endDate?: string,
  teamIds?: number[]
): Promise<Game[]> => {
  const cacheKey = `extended_basketball_games_${startDate || 'none'}_${endDate || 'none'}_${teamIds?.join('-') || 'none'}`;
  const cachedData = cache.get<Game[]>(cacheKey);

  if (cachedData) {
    console.log('Cache hit: basketball games');
    return cachedData;
  }

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (teamIds) {
      teamIds.forEach(id => params.append('team_ids', id.toString()));
    }

    const endpoint = `/extended-sports/basketball/games?${params.toString()}`;
    const data = await fetchWithRetry<{ games: any[] }>(endpoint);
    
    // Map to Game interface
    const games: Game[] = data.games.map(game => ({
      id: game.id,
      sport: 'basketball' as SportType,
      homeTeam: {
        id: `nba_${game.data.home_team_id}`,
        name: game.home_team,
        logo: ''
      },
      awayTeam: {
        id: `nba_${game.data.away_team_id}`,
        name: game.away_team,
        logo: ''
      },
      startTime: new Date(game.match_date),
      league: game.league,
      homeScore: game.home_score,
      awayScore: game.away_score,
      status: game.status.toLowerCase() === 'finished' ? 'finished' : 
              game.status.toLowerCase() === 'live' ? 'live' : 'scheduled',
      source: 'balldontlie' as DataSourceType
    }));
    
    // Cache the result
    cache.set(cacheKey, games, CACHE_TTL.MEDIUM);
    return games;
  } catch (error) {
    console.error('Error fetching basketball games:', error);
    throw error;
  }
};

export default {
  getFootballLeagues,
  getFootballSeasons,
  getFootballMatches,
  getBasketballTeams,
  getBasketballGames
};
