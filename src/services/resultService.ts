/**
 * Result Service
 *
 * This file contains functions for fetching prediction results and statistics
 * from our backend.
 */

import { fetchFromBackend } from './api';
import { formatDate } from '../utils/dateUtils';
import type { Prediction } from './fixtureService';

// Types
export interface PredictionResult extends Prediction {
  result: string;
  actualScore?: {
    home: number;
    away: number;
  };
}

export interface ResultsStats {
  totalPredictions: number;
  wonPredictions: number;
  lostPredictions: number;
  pendingPredictions: number;
  successRate: number;
  averageOdds: number;
}

export interface DailyResults {
  date: string;
  predictions: PredictionResult[];
  stats: ResultsStats;
}

/**
 * Fetch prediction results for a specific date
 * @param date The date in YYYY-MM-DD format
 * @returns The prediction results for the date
 */
export async function fetchResultsByDate(date: string): Promise<PredictionResult[]> {
  try {
    const response = await fetchFromBackend(`/results?date=${date}`);

    return response.results || [];
  } catch (error) {
    console.error(`Error fetching results for date ${date}:`, error);
    throw error;
  }
}

/**
 * Fetch prediction results for a date range
 * @param dateFrom Start date in YYYY-MM-DD format
 * @param dateTo End date in YYYY-MM-DD format
 * @returns The prediction results for the date range
 */
export async function fetchResultsByDateRange(dateFrom: string, dateTo: string): Promise<DailyResults[]> {
  try {
    const response = await fetchFromBackend(`/results?dateFrom=${dateFrom}&dateTo=${dateTo}`);

    return response.dailyResults || [];
  } catch (error) {
    console.error(`Error fetching results for date range ${dateFrom} to ${dateTo}:`, error);
    throw error;
  }
}

/**
 * Fetch overall prediction statistics
 * @param dateFrom Optional start date in YYYY-MM-DD format
 * @param dateTo Optional end date in YYYY-MM-DD format
 * @returns The overall prediction statistics
 */
export async function fetchOverallStats(dateFrom?: string, dateTo?: string): Promise<ResultsStats> {
  try {
    let endpoint = '/stats';

    if (dateFrom && dateTo) {
      endpoint += `?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    }

    const response = await fetchFromBackend(endpoint);

    return response.stats || {
      totalPredictions: 0,
      wonPredictions: 0,
      lostPredictions: 0,
      pendingPredictions: 0,
      successRate: 0,
      averageOdds: 0
    };
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    throw error;
  }
}



export default {
  fetchResultsByDate,
  fetchResultsByDateRange,
  fetchOverallStats,
};
