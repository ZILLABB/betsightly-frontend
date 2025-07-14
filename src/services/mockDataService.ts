import type { 
  Prediction, 
  PredictionCategoriesResponse, 
  BettingCodesResponse,
  StatsOverview,
  ApiResponse,
  PaginatedResponse
} from '../types';

import {
  mockData,
  mockPredictionCategoriesResponse,
  mockBettingCodesResponse,
  getMockPredictions,
  getMockBestPredictions,
  getMockPredictionsByOdds,
  getMockPredictionsByStatus,
  getMockPredictionsByDate,
  getMockAnalyticsData
} from '../data/mockData';

// Mock API delay to simulate real network requests
const MOCK_DELAY = 800;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Service Class
export class MockDataService {
  private static instance: MockDataService;
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isUsingMockData(): boolean {
    return this.isEnabled;
  }

  // Predictions API
  async getPredictionCategories(): Promise<ApiResponse<PredictionCategoriesResponse>> {
    await delay(MOCK_DELAY);
    return {
      data: mockPredictionCategoriesResponse,
      message: 'Mock predictions retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  async getBestPredictions(): Promise<ApiResponse<Prediction[]>> {
    await delay(MOCK_DELAY);
    return {
      data: getMockBestPredictions(),
      message: 'Mock best predictions retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  async getPredictionsByCategory(category: '2_odds' | '5_odds' | '10_odds' | 'rollover'): Promise<ApiResponse<Prediction[]>> {
    await delay(MOCK_DELAY);
    return {
      data: getMockPredictions(category),
      message: `Mock ${category} predictions retrieved successfully`,
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  async getPredictionsByOdds(minOdds: number, maxOdds: number): Promise<ApiResponse<Prediction[]>> {
    await delay(MOCK_DELAY);
    return {
      data: getMockPredictionsByOdds(minOdds, maxOdds),
      message: 'Mock predictions by odds retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  async getPredictionsByStatus(status: 'won' | 'lost' | 'pending'): Promise<ApiResponse<Prediction[]>> {
    await delay(MOCK_DELAY);
    return {
      data: getMockPredictionsByStatus(status),
      message: `Mock ${status} predictions retrieved successfully`,
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  async getPredictionsByDate(date: Date): Promise<ApiResponse<Prediction[]>> {
    await delay(MOCK_DELAY);
    return {
      data: getMockPredictionsByDate(date),
      message: 'Mock predictions by date retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  // Betting Codes API
  async getBettingCodes(): Promise<ApiResponse<BettingCodesResponse>> {
    await delay(MOCK_DELAY);
    return {
      data: mockBettingCodesResponse,
      message: 'Mock betting codes retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  // Analytics API
  async getAnalyticsDashboard(): Promise<ApiResponse<any>> {
    await delay(MOCK_DELAY);
    return {
      data: getMockAnalyticsData(),
      message: 'Mock analytics data retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  async getStatsOverview(): Promise<ApiResponse<StatsOverview>> {
    await delay(MOCK_DELAY);
    return {
      data: mockData.stats,
      message: 'Mock stats overview retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  // Punters API
  async getPunters(): Promise<ApiResponse<any[]>> {
    await delay(MOCK_DELAY);
    return {
      data: mockData.punters,
      message: 'Mock punters retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  // Teams API
  async getTeams(): Promise<ApiResponse<any[]>> {
    await delay(MOCK_DELAY);
    return {
      data: mockData.teams,
      message: 'Mock teams retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  // Rollover API
  async getRolloverGame(): Promise<ApiResponse<any>> {
    await delay(MOCK_DELAY);
    return {
      data: mockData.rolloverGame,
      message: 'Mock rollover game retrieved successfully',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  // Health Check API
  async getHealthCheck(): Promise<ApiResponse<any>> {
    await delay(200); // Shorter delay for health check
    return {
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0-mock',
        services: {
          database: 'healthy',
          ml_models: 'healthy',
          cache: 'healthy'
        }
      },
      message: 'Mock service is healthy',
      status: 'success',
      service_used: 'fallback_mock_data',
      cache_status: 'MISS',
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  getAllMockData() {
    return mockData;
  }

  refreshMockData() {
    // Simulate data refresh by returning the same data with updated timestamps
    console.log('Mock data refreshed');
    return Promise.resolve(true);
  }
}

// Export singleton instance
export const mockDataService = MockDataService.getInstance();

// Export convenience functions
export const useMockData = () => mockDataService.isUsingMockData();
export const enableMockData = () => mockDataService.setEnabled(true);
export const disableMockData = () => mockDataService.setEnabled(false);

// Export mock data for direct access
export { mockData } from '../data/mockData';
