/**
 * Fixture Service
 *
 * This file contains functions for fetching football fixtures and predictions
 * from the Football Data API and our backend.
 */

import { fetchFootballData, fetchFromBackend } from './api';
import { formatDate } from '../utils/dateUtils';

// Types
export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface Fixture {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string | null;
  lastUpdated: string;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    winner: string | null;
    duration: string;
    fullTime: Score;
    halfTime: Score;
  };
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  };
}

export interface Prediction {
  id: string;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  predictionType: string;
  odds: number;
  confidence: number;
  status: 'pending' | 'won' | 'lost';
  date: string;
  gameCode?: string;
  bookmaker?: string;
}

/**
 * Fetch today's fixtures from the Football Data API
 * @returns A list of fixtures for today
 */
export async function fetchTodayFixtures(): Promise<Fixture[]> {
  try {
    const today = new Date();
    const dateFrom = formatDate(today, 'yyyy-MM-dd');
    const dateTo = formatDate(today, 'yyyy-MM-dd');

    const response = await fetchFootballData(`/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`);

    return response.matches || [];
  } catch (error) {
    console.error('Error fetching today fixtures:', error);
    return [];
  }
}

/**
 * Fetch fixtures for a specific date range
 * @param dateFrom Start date in YYYY-MM-DD format
 * @param dateTo End date in YYYY-MM-DD format
 * @returns A list of fixtures for the date range
 */
export async function fetchFixturesByDateRange(dateFrom: string, dateTo: string): Promise<Fixture[]> {
  try {
    const response = await fetchFootballData(`/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`);

    return response.matches || [];
  } catch (error) {
    console.error(`Error fetching fixtures for date range ${dateFrom} to ${dateTo}:`, error);
    return [];
  }
}

/**
 * Fetch fixtures for a specific competition
 * @param competitionId The competition ID
 * @param dateFrom Optional start date in YYYY-MM-DD format
 * @param dateTo Optional end date in YYYY-MM-DD format
 * @returns A list of fixtures for the competition
 */
export async function fetchFixturesByCompetition(
  competitionId: number,
  dateFrom?: string,
  dateTo?: string
): Promise<Fixture[]> {
  try {
    let endpoint = `/competitions/${competitionId}/matches`;

    if (dateFrom && dateTo) {
      endpoint += `?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    }

    const response = await fetchFootballData(endpoint);

    return response.matches || [];
  } catch (error) {
    console.error(`Error fetching fixtures for competition ${competitionId}:`, error);
    return [];
  }
}

/**
 * Fetch predictions for today's fixtures
 * @param oddsCategory Optional odds category (2, 5, 10)
 * @returns A list of predictions for today's fixtures
 */
export async function fetchTodayPredictions(oddsCategory?: number): Promise<Prediction[]> {
  try {
    const today = formatDate(new Date(), 'yyyy-MM-dd');
    let endpoint = `/predictions?date=${today}`;

    if (oddsCategory) {
      endpoint += `&oddsCategory=${oddsCategory}`;
    }

    const response = await fetchFromBackend(endpoint);

    return response.predictions || [];
  } catch (error) {
    console.error('Error fetching today predictions:', error);
    throw error;
  }
}



export default {
  fetchTodayFixtures,
  fetchFixturesByDateRange,
  fetchFixturesByCompetition,
  fetchTodayPredictions,
};
