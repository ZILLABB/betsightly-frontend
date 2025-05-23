/**
 * Lazy loaded pages for code splitting
 *
 * This file exports lazy loaded versions of all pages to reduce the initial bundle size.
 * Each page is loaded only when needed, improving initial load time.
 */

import { lazyLoad } from '../utils/lazyLoad';

// Lazy load all pages
export const LazyMainPage = lazyLoad(() => import('./MainPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Home...'
});

export const LazyPredictionsPage = lazyLoad(() => import('./PredictionsPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Predictions...'
});

export const LazyFixturesPage = lazyLoad(() => import('./FixturesPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Fixtures...'
});

export const LazyResultsPage = lazyLoad(() => import('./ResultsPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Results...'
});

export const LazyRolloverPage = lazyLoad(() => import('./RolloverPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Rollover...'
});

export const LazyRolloverChallengePage = lazyLoad(() => import('./RolloverChallengePage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Rollover Challenge...'
});

export const LazyPuntersPage = lazyLoad(() => import('./PuntersPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Punters...'
});

export const LazyAnalyticsPage = lazyLoad(() => import('./AnalyticsPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Analytics...'
});

export const LazySettingsPage = lazyLoad(() => import('./SettingsPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Settings...'
});

export const LazyAdminPage = lazyLoad(() => import('./AdminPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Admin Dashboard...'
});

export const LazyLoginPage = lazyLoad(() => import('./LoginPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading Login...',
  errorBoundary: false // Don't use error boundary for login page
});

export const LazyNotFoundPage = lazyLoad(() => import('./NotFoundPage') as Promise<{ default: React.ComponentType<any> }>, {
  loadingMessage: 'Loading...',
  errorBoundary: false // Don't use error boundary for 404 page
});
