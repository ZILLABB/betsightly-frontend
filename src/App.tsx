import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { PreferencesProvider } from './contexts/PreferencesProvider';
import ThemeProvider from './components/common/ThemeProvider';

// Import page components
import HomePage from './pages/HomePage';
import PredictionsPage from './pages/PredictionsPage';
import ResultsPage from './pages/ResultsPage';
import RolloverPage from './pages/RolloverPage';
import PuntersPage from './pages/PuntersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import FixturesPage from './pages/FixturesPage';

function App() {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <Router>
          <Layout>
            {/* Routes */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/rollover" element={<RolloverPage />} />
              <Route path="/punters" element={<PuntersPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </PreferencesProvider>
  );
}

export default App








