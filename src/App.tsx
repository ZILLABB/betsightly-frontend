import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { PreferencesProvider } from "./contexts/PreferencesProvider";
import ThemeProvider from "./components/common/ThemeProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Layout } from "./components/layout/Layout";
import { Spinner } from "./components/ui/Spinner";
import { HomePage } from "./pages/HomePage";
import { PredictionsPage } from "./pages/PredictionsPage";
import { ResultsPage } from "./pages/ResultsPage";
import { RolloverPage } from "./pages/RolloverPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import PuntersPage from "./pages/PuntersPage";
import PunterDetailPage from "./pages/PunterDetailPage";
import WorldCupPage from "./pages/WorldCupPage";
import { AboutPage } from "./pages/AboutPage";

function Fallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <Spinner size={32} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <PreferencesProvider>
      <ThemeProvider>
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/predictions/:category" element={<PredictionsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/rollover" element={<RolloverPage />} />
            <Route path="/worldcup" element={<WorldCupPage />} />
            <Route path="/punters" element={<PuntersPage />} />
            <Route path="/punters/:id" element={<PunterDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
    </ThemeProvider>
    </PreferencesProvider>
    </ErrorBoundary>
  );
}
