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

// Import performance monitoring
import { initPerformanceMonitoring } from './utils/performanceMonitoring';
import PerformanceMonitor from './components/dev/PerformanceMonitor';
// Import update notification
import UpdateNotification from './components/common/UpdateNotification';
// Import resource preloader
import { initResourcePreloading } from './utils/resourcePreloader';

// Import lazy loaded pages
import {
  LazyMainPage,
  LazyPredictionsPage,
  LazyBasketballPage,
  LazyBasketballModelsPage,
  LazyFixturesPage,
  LazyResultsPage,
  LazyRolloverChallengePage,
  LazyPuntersPage,
  LazyAnalyticsPage,
  LazySettingsPage,
  LazyLoginPage,
  LazyNotFoundPage
} from './pages/LazyPages';

function App() {
  // Initialize error tracking, theme, and performance monitoring
  useEffect(() => {
    initErrorTracking();
    // Initialize theme manager
    ThemeManager.getInstance();

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
                  <Route path="/basketball" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyBasketballPage />
                      </Layout>
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/basketball/models" element={
                    <TrackedErrorBoundary>
                      <Layout>
                        <LazyBasketballModelsPage />
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
                        <LazyRolloverChallengePage />
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
            </PredictionsProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </PreferencesProvider>
    </TrackedErrorBoundary>
  );
}

export default App;
