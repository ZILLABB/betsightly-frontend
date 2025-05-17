/**
 * Lazy loaded pages for code splitting
 *
 * This file exports lazy loaded versions of all pages to reduce the initial bundle size.
 * Each page is loaded only when needed, improving initial load time.
 */

import { lazyLoad } from '../utils/lazyLoad';

// Lazy load all pages
export const LazyHomePage = lazyLoad(() => import('./HomePage'), {
  loadingMessage: 'Loading Home...'
});

export const LazyMainPage = lazyLoad(() => import('./MainPage'), {
  loadingMessage: 'Loading Home...'
});

export const LazyPredictionsPage = lazyLoad(() => import('./PredictionsPage'), {
  loadingMessage: 'Loading Predictions...'
});

export const LazyFixturesPage = lazyLoad(() => import('./FixturesPage'), {
  loadingMessage: 'Loading Fixtures...'
});

export const LazyResultsPage = lazyLoad(() => import('./ResultsPage'), {
  loadingMessage: 'Loading Results...'
});

export const LazyRolloverPage = lazyLoad(() => import('./RolloverPage'), {
  loadingMessage: 'Loading Rollover...'
});

export const LazyRolloverChallengePage = lazyLoad(() => import('./RolloverChallengePage'), {
  loadingMessage: 'Loading Rollover Challenge...'
});

export const LazyPuntersPage = lazyLoad(() => import('./PuntersPage'), {
  loadingMessage: 'Loading Punters...'
});

export const LazyAnalyticsPage = lazyLoad(() => import('./AnalyticsPage'), {
  loadingMessage: 'Loading Analytics...'
});

export const LazySettingsPage = lazyLoad(() => import('./SettingsPage'), {
  loadingMessage: 'Loading Settings...'
});

export const LazyAdminPage = lazyLoad(() => import('./AdminPage'), {
  loadingMessage: 'Loading Admin Dashboard...'
});

export const LazyLoginPage = lazyLoad(() => import('./LoginPage'), {
  loadingMessage: 'Loading Login...',
  errorBoundary: false // Don't use error boundary for login page
});

export const LazyNotFoundPage = lazyLoad(() => import('./NotFoundPage'), {
  loadingMessage: 'Loading...',
  errorBoundary: false // Don't use error boundary for 404 page
});
