import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TrackedErrorBoundary } from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import { initErrorTracking } from './utils/errorTracking';
// Initialize theme manager
import ThemeManager from './utils/themeManager';
// Import providers
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AuthProvider } from './contexts/AuthContext';
import ThemeProvider from './components/common/ThemeProvider';
// Import cache utility
import cache from './utils/cacheUtils';
// Import GlobalErrorHandler
import GlobalErrorHandler from './components/common/GlobalErrorHandler';
// Import ProtectedRoute
import ProtectedRoute from './components/auth/ProtectedRoute';
// Import performance monitoring
import { initPerformanceMonitoring } from './utils/performanceMonitoring';
import PerformanceMonitor from './components/dev/PerformanceMonitor';
// Import update notification
import UpdateNotification from './components/common/UpdateNotification';
// Import resource preloader
import { initResourcePreloading } from './utils/resourcePreloader';

// Import lazy loaded pages
import {
  LazyHomePage,
  LazyMainPage,
  LazyPredictionsPage,
  LazyFixturesPage,
  LazyResultsPage,
  LazyRolloverPage,
  LazyRolloverChallengePage,
  LazyPuntersPage,
  LazyAnalyticsPage,
  LazySettingsPage,
  LazyAdminPage,
  LazyLoginPage,
  LazyNotFoundPage
} from './pages/LazyPages';

// Use environment variable to toggle between old and new pages
const USE_NEW_PAGES = true; // Set to false to use original pages

function App() {
  // Initialize error tracking, theme, performance monitoring, and clear cache
  useEffect(() => {
    initErrorTracking();
    // Initialize theme manager
    ThemeManager.getInstance();
    // Clear cache to ensure fresh data
    cache.clear();
    console.log("Cache cleared on application start");

    // Initialize performance monitoring in development
    if (import.meta.env.DEV) {
      initPerformanceMonitoring();
    }

    // Initialize resource preloading
    initResourcePreloading();
  }, []);

  return (
    <TrackedErrorBoundary>
      <PreferencesProvider>
        <AuthProvider>
          <ThemeProvider>
            <GlobalErrorHandler>
              <Router>
                <Routes>
                  <Route path="/login" element={
                    <TrackedErrorBoundary>
                      <LazyLoginPage />
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        {USE_NEW_PAGES ? <LazyMainPage /> : <LazyHomePage />}
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/predictions" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyPredictionsPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/fixtures" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyFixturesPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/results" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyResultsPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/rollover" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        {USE_NEW_PAGES ? <LazyRolloverChallengePage /> : <LazyRolloverPage />}
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/punters" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyPuntersPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/analytics" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyAnalyticsPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/settings" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazySettingsPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/admin" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <ProtectedRoute requiredRole="admin">
                          <LazyAdminPage />
                        </ProtectedRoute>
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="*" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyNotFoundPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                </Routes>
              </Router>

              {/* Performance Monitor (only in development) */}
              {import.meta.env.DEV && <PerformanceMonitor />}

              {/* Update Notification */}
              <UpdateNotification />
            </GlobalErrorHandler>
          </ThemeProvider>
        </AuthProvider>
      </PreferencesProvider>
    </TrackedErrorBoundary>
  );
}

export default App;
