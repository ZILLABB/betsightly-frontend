import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SentryErrorBoundary } from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import { initErrorTracking } from './utils/errorTracking';
// Initialize theme manager
import ThemeManager from './utils/themeManager';
// Import PreferencesProvider
import { PreferencesProvider } from './contexts/PreferencesContext';
import ThemeProvider from './components/common/ThemeProvider';
// Import cache utility
import cache from './utils/cacheUtils';
// Import GlobalErrorHandler
import GlobalErrorHandler from './components/common/GlobalErrorHandler';

// Import original pages
import HomePage from './pages/HomePage';
import PredictionsPage from './pages/PredictionsPage';
import ResultsPage from './pages/ResultsPage';
import RolloverPage from './pages/RolloverPage';
import PuntersPage from './pages/PuntersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Import new pages
import NewHomePage from './pages/NewHomePage';
import NewPredictionsPage from './pages/NewPredictionsPage';
import NewRolloverPage from './pages/NewRolloverPage';

// Use environment variable to toggle between old and new pages
const USE_NEW_PAGES = true; // Set to false to use original pages

function App() {
  // Initialize error tracking, theme, and clear cache
  useEffect(() => {
    initErrorTracking();
    // Initialize theme manager
    ThemeManager.getInstance();
    // Clear cache to ensure fresh data
    cache.clear();
    console.log("Cache cleared on application start");
  }, []);

  return (
    <SentryErrorBoundary>
      <PreferencesProvider>
        <ThemeProvider>
          <GlobalErrorHandler>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={
                    <SentryErrorBoundary>
                      {USE_NEW_PAGES ? <NewHomePage /> : <HomePage />}
                    </SentryErrorBoundary>
                  } />
                  <Route path="/predictions" element={
                    <SentryErrorBoundary>
                      {USE_NEW_PAGES ? <NewPredictionsPage /> : <PredictionsPage />}
                    </SentryErrorBoundary>
                  } />
                  <Route path="/results" element={
                    <SentryErrorBoundary>
                      <ResultsPage />
                    </SentryErrorBoundary>
                  } />
                  <Route path="/rollover" element={
                    <SentryErrorBoundary>
                      {USE_NEW_PAGES ? <NewRolloverPage /> : <RolloverPage />}
                    </SentryErrorBoundary>
                  } />
                  <Route path="/punters" element={
                    <SentryErrorBoundary>
                      <PuntersPage />
                    </SentryErrorBoundary>
                  } />
                  <Route path="/analytics" element={
                    <SentryErrorBoundary>
                      <AnalyticsPage />
                    </SentryErrorBoundary>
                  } />
                  <Route path="/settings" element={
                    <SentryErrorBoundary>
                      <SettingsPage />
                    </SentryErrorBoundary>
                  } />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            </Router>
          </GlobalErrorHandler>
        </ThemeProvider>
      </PreferencesProvider>
    </SentryErrorBoundary>
  );
}

export default App;
