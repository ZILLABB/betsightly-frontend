/**
 * Testing utilities for BetSightly application
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { PredictionsProvider } from '../contexts/PredictionsContext';
import { ToastProvider } from '../hooks/useToast';

// Mock user for testing
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user' as const,
};

// Mock predictions data
export const mockPredictions = [
  {
    id: 'pred-1',
    game: {
      id: 'game-1',
      homeTeam: { id: 'team-1', name: 'Team A', logo: '' },
      awayTeam: { id: 'team-2', name: 'Team B', logo: '' },
      date: new Date(),
      league: 'Premier League',
      sport: 'soccer' as const,
    },
    predictionType: 'Match Result',
    prediction: 'Team A',
    odds: 2.5,
    status: 'pending' as const,
    createdAt: new Date(),
    confidence: 75,
    confidencePct: 0.75,
  },
];

// Mock API responses
export const mockApiResponses = {
  login: {
    user: mockUser,
    access_token: 'mock-jwt-token',
  },
  predictions: {
    categories: {
      '2_odds': mockPredictions,
      '5_odds': mockPredictions,
      '10_odds': mockPredictions,
    },
  },
  fixtures: {
    fixtures: [
      {
        id: 'fixture-1',
        homeTeam: { id: 'team-1', name: 'Team A', logo: '' },
        awayTeam: { id: 'team-2', name: 'Team B', logo: '' },
        date: new Date(),
        league: 'Premier League',
        sport: 'soccer',
        status: 'scheduled',
      },
    ],
    source: 'mock',
  },
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: typeof mockUser | null;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    user = mockUser,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <PreferencesProvider>
          <AuthProvider>
            <ToastProvider>
              <PredictionsProvider>
                {children}
              </PredictionsProvider>
            </ToastProvider>
          </AuthProvider>
        </PreferencesProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock fetch for API calls
export function mockFetch(responses: Record<string, any> = mockApiResponses) {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      const urlStr = url.toString();

      // Login endpoint
      if (urlStr.includes('/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.login),
        } as Response);
      }

      // Predictions endpoint
      if (urlStr.includes('/predictions/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.predictions),
        } as Response);
      }

      // Fixtures endpoint
      if (urlStr.includes('/fixtures') || urlStr.includes('/multi-api/fixtures')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.fixtures),
        } as Response);
      }

      // Default response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });
}

// Mock localStorage
export function mockLocalStorage() {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  return localStorageMock;
}

// Mock window.matchMedia
export function mockMatchMedia() {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });
}

// Test data generators
export function generateMockPrediction(overrides: Partial<typeof mockPredictions[0]> = {}) {
  return {
    ...mockPredictions[0],
    id: `pred-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}

export function generateMockGame(overrides: any = {}) {
  return {
    id: `game-${Math.random().toString(36).substr(2, 9)}`,
    homeTeam: { id: 'team-1', name: 'Team A', logo: '' },
    awayTeam: { id: 'team-2', name: 'Team B', logo: '' },
    date: new Date(),
    league: 'Premier League',
    sport: 'soccer',
    ...overrides,
  };
}

// Accessibility testing helpers
export async function checkAccessibility(container: HTMLElement) {
  const { axe } = await import('jest-axe');
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

// Performance testing helpers
export function measureRenderTime(renderFn: () => void): number {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
}

// Wait for async operations
export function waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function check() {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    }
    
    check();
  });
}

// Export all utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
