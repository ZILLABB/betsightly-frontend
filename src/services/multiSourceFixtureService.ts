/**
 * Multi-Source Fixture Service
 * 
 * This service provides functions for fetching fixtures from multiple data sources,
 * with fallback mechanisms to ensure data availability.
 */

import cache from "../utils/cacheUtils";
import { getApiKey } from "./settingsService";

// Define the fixture interface
export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  status: string;
  source: string;
}

// Define the fixture list interface
export interface FixtureList {
  fixtures: Fixture[];
  count: number;
  source: string;
  date: string;
}

// Define the data source interface
interface DataSource {
  name: string;
  fetchFixtures: (date: string, apiKey?: string) => Promise<Fixture[]>;
  priority: number;
  requiresApiKey: boolean;
}

// Cache keys and TTLs
const CACHE_KEY_PREFIX = 'fixtures_';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Football-Data.org data source
const footballDataSource: DataSource = {
  name: 'Football-Data.org',
  priority: 1, // Highest priority
  requiresApiKey: true,
  fetchFixtures: async (date: string, apiKey?: string): Promise<Fixture[]> => {
    if (!apiKey) {
      throw new Error('API key is required for Football-Data.org');
    }

    try {
      const response = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`, {
        headers: {
          'X-Auth-Token': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Football-Data.org API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.matches.map((match: any) => ({
        id: match.id.toString(),
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        league: match.competition.name,
        matchDate: match.utcDate,
        status: match.status,
        source: 'Football-Data.org'
      }));
    } catch (error) {
      console.error('Error fetching from Football-Data.org:', error);
      throw error;
    }
  }
};

// API-Football data source
const apiFootballSource: DataSource = {
  name: 'API-Football',
  priority: 2,
  requiresApiKey: true,
  fetchFixtures: async (date: string, apiKey?: string): Promise<Fixture[]> => {
    if (!apiKey) {
      throw new Error('API key is required for API-Football');
    }

    try {
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!response.ok) {
        throw new Error(`API-Football API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.response.map((fixture: any) => ({
        id: fixture.fixture.id.toString(),
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        league: fixture.league.name,
        matchDate: fixture.fixture.date,
        status: fixture.fixture.status.long,
        source: 'API-Football'
      }));
    } catch (error) {
      console.error('Error fetching from API-Football:', error);
      throw error;
    }
  }
};

// Open Football Data source (no API key required)
const openFootballSource: DataSource = {
  name: 'Open Football Data',
  priority: 3,
  requiresApiKey: false,
  fetchFixtures: async (date: string): Promise<Fixture[]> => {
    try {
      // Format date for the API (YYYY-MM-DD)
      const formattedDate = date.replace(/-/g, '');
      
      // This is a public API that doesn't require an API key
      const response = await fetch(`https://raw.githubusercontent.com/openfootball/football.json/master/2023-24/${formattedDate}.json`);

      if (!response.ok) {
        throw new Error(`Open Football Data API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Map the data to our fixture format
      return data.matches.map((match: any, index: number) => ({
        id: `open-football-${date}-${index}`,
        homeTeam: match.team1,
        awayTeam: match.team2,
        league: data.name || 'Unknown League',
        matchDate: `${date}T${match.time || '00:00:00'}Z`,
        status: 'SCHEDULED',
        source: 'Open Football Data'
      }));
    } catch (error) {
      console.error('Error fetching from Open Football Data:', error);
      throw error;
    }
  }
};

// Register all data sources
const dataSources: DataSource[] = [
  footballDataSource,
  apiFootballSource,
  openFootballSource
];

/**
 * Fetch fixtures from all available data sources with fallback
 * 
 * @param date Date in YYYY-MM-DD format
 * @param forceRefresh Whether to force a refresh from the API
 * @returns Promise resolving to a FixtureList
 */
export const getFixtures = async (date: string, forceRefresh: boolean = false): Promise<FixtureList> => {
  // Check cache first if not forcing refresh
  const cacheKey = `${CACHE_KEY_PREFIX}${date}`;
  if (!forceRefresh) {
    const cachedData = cache.get<FixtureList>(cacheKey);
    if (cachedData) {
      console.log(`Using cached fixtures for ${date}`);
      return cachedData;
    }
  }

  // Get API key
  const apiKey = await getApiKey();
  
  // Sort data sources by priority
  const sortedSources = [...dataSources].sort((a, b) => a.priority - b.priority);
  
  // Try each data source in order of priority
  let fixtures: Fixture[] = [];
  let sourceUsed = 'None';
  let errors: string[] = [];
  
  for (const source of sortedSources) {
    // Skip sources that require an API key if we don't have one
    if (source.requiresApiKey && !apiKey) {
      errors.push(`${source.name} requires an API key`);
      continue;
    }
    
    try {
      fixtures = await source.fetchFixtures(date, apiKey || undefined);
      sourceUsed = source.name;
      console.log(`Successfully fetched fixtures from ${source.name}`);
      break; // Stop trying sources once we get data
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Create the fixture list
  const fixtureList: FixtureList = {
    fixtures,
    count: fixtures.length,
    source: sourceUsed,
    date
  };
  
  // Cache the result if we have fixtures
  if (fixtures.length > 0) {
    cache.set(cacheKey, fixtureList, CACHE_TTL);
  }
  
  return fixtureList;
};

export default {
  getFixtures
};
