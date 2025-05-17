import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TrackedErrorBoundary } from './components/common/ErrorBoundary';
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
import MainPage from './pages/MainPage';
import RolloverChallengePage from './pages/RolloverChallengePage';

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
    <TrackedErrorBoundary>
      <PreferencesProvider>
        <ThemeProvider>
          <GlobalErrorHandler>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={
                    <TrackedErrorBoundary>
                      {USE_NEW_PAGES ? <MainPage /> : <HomePage />}
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/predictions" element={
                    <TrackedErrorBoundary>
                      <PredictionsPage />
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/results" element={
                    <TrackedErrorBoundary>
                      <ResultsPage />
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/rollover" element={
                    <TrackedErrorBoundary>
                      {USE_NEW_PAGES ? <RolloverChallengePage /> : <RolloverPage />}
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/punters" element={
                    <TrackedErrorBoundary>
                      <PuntersPage />
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/analytics" element={
                    <TrackedErrorBoundary>
                      <AnalyticsPage />
                    </TrackedErrorBoundary>
                  } />
                  <Route path="/settings" element={
                    <TrackedErrorBoundary>
                      <SettingsPage />
                    </TrackedErrorBoundary>
                  } />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            </Router>
          </GlobalErrorHandler>
        </ThemeProvider>
      </PreferencesProvider>
    </TrackedErrorBoundary>
  );
}

export default App;
