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
import { ToastProvider } from './hooks/useToast';
import { PredictionsProvider } from './contexts/PredictionsContext';
// Import cache utility
import cache from './utils/cacheUtils';
// Import GlobalErrorHandler
import GlobalErrorHandler from './components/common/GlobalErrorHandler';
// Import ProtectedRoute
import ProtectedRoute from './components/auth/ProtectedRoute';
// Import performance monitoring
import { initPerformanceMonitoring } from './utils/performanceMonitoring';
import PerformanceMonitor from './components/dev/PerformanceMonitor';
// Import PWA components
import PWAProvider from './components/common/PWAProvider';
import PWAUpdateNotification from './components/common/PWAUpdateNotification';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import OfflineIndicator from './components/common/OfflineIndicator';
// Import resource preloader
import { initResourcePreloading } from './utils/resourcePreloader';

// Import lazy loaded pages
import {
  LazyMainPage,
  LazyPredictionsPage,
  LazyResultsPage,
  LazyRolloverChallengePage,
  LazyExpertsPage,
  LazyPuntersPage,
  LazyAnalyticsPage,
  LazySettingsPage,
  LazyAdminPage,
  LazyLoginPage,
  LazyNotFoundPage
} from './pages/LazyPages';

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
            <ToastProvider>
              <PredictionsProvider>
                <PWAProvider>
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
                          <LazyMainPage />
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
                        <LazyRolloverChallengePage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/experts" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyExpertsPage />
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

              {/* PWA Components */}
              <PWAUpdateNotification />
              <PWAInstallPrompt />
              <OfflineIndicator />
            </GlobalErrorHandler>
                </PWAProvider>
            </PredictionsProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </PreferencesProvider>
    </TrackedErrorBoundary>
  );
}

export default App;
