import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TrackedErrorBoundary } from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import { initErrorTracking } from './utils/errorTracking';
import ThemeManager from './utils/themeManager';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AuthProvider } from './contexts/AuthContext';
import ThemeProvider from './components/common/ThemeProvider';
import { ToastProvider } from './hooks/useToast';
import { PredictionsProvider } from './contexts/PredictionsContext';
import GlobalErrorHandler from './components/common/GlobalErrorHandler';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PWAProvider from './components/common/PWAProvider';
import PWAUpdateNotification from './components/common/PWAUpdateNotification';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import OfflineIndicator from './components/common/OfflineIndicator';

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
  useEffect(() => {
    initErrorTracking();
    ThemeManager.getInstance();
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
