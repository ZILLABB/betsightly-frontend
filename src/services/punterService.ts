/**
 * Punter Service
 *
 * This file contains functions for fetching punter data and their predictions
 * from our backend.
 */

import { fetchFromBackend } from './api';
import type { Prediction } from './fixtureService';

// Types
export interface Punter {
  id: number;
  nickname: string;
  winRate: number;
  totalPredictions: number;
  specialties: string[];
  bio?: string;
  avatarUrl?: string;
}

export interface PunterPrediction extends Prediction {
  punterId: number;
  punterNickname: string;
}

/**
 * Fetch all punters
 * @returns A list of all punters
 */
export async function fetchAllPunters(): Promise<Punter[]> {
  try {
    const response = await fetchFromBackend('/punters');

    return response.punters || [];
  } catch (error) {
    console.error('Error fetching all punters:', error);
    throw error;
  }
}

/**
 * Fetch a specific punter by ID
 * @param id The punter ID
 * @returns The punter data
 */
export async function fetchPunterById(id: number): Promise<Punter | null> {
  try {
    const response = await fetchFromBackend(`/punters/${id}`);

    return response.punter || null;
  } catch (error) {
    console.error(`Error fetching punter with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Fetch predictions by a specific punter
 * @param punterId The punter ID
 * @param limit Optional limit on the number of predictions to fetch
 * @returns A list of predictions by the punter
 */
export async function fetchPredictionsByPunter(punterId: number, limit?: number): Promise<PunterPrediction[]> {
  try {
    let endpoint = `/punters/${punterId}/predictions`;

    if (limit) {
      endpoint += `?limit=${limit}`;
    }

    const response = await fetchFromBackend(endpoint);

    return response.predictions || [];
  } catch (error) {
    console.error(`Error fetching predictions for punter with ID ${punterId}:`, error);
    throw error;
  }
}

/**
 * Fetch top punters based on win rate
 * @param limit Optional limit on the number of punters to fetch
 * @returns A list of top punters
 */
export async function fetchTopPunters(limit: number = 10): Promise<Punter[]> {
  try {
    const response = await fetchFromBackend(`/punters/top?limit=${limit}`);

    return response.punters || [];
  } catch (error) {
    console.error(`Error fetching top ${limit} punters:`, error);
    throw error;
  }
}



export default {
  fetchAllPunters,
  fetchPunterById,
  fetchPredictionsByPunter,
  fetchTopPunters,
};
