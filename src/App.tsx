import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { PreferencesProvider } from "./contexts/PreferencesProvider";
import ThemeProvider from "./components/common/ThemeProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Layout } from "./components/layout/Layout";
import { Spinner } from "./components/ui/Spinner";

// HomePage stays eager (always the first paint)
import { HomePage } from "./pages/HomePage";

// Everything else is lazy-loaded for smaller initial bundle
const PredictionsPage = lazy(() => import("./pages/PredictionsPage").then(m => ({ default: m.PredictionsPage })));
const ResultsPage = lazy(() => import("./pages/ResultsPage").then(m => ({ default: m.ResultsPage })));
const RolloverPage = lazy(() => import("./pages/RolloverPage").then(m => ({ default: m.RolloverPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const PuntersPage = lazy(() => import("./pages/PuntersPage"));
const PunterDetailPage = lazy(() => import("./pages/PunterDetailPage"));
const WorldCupPage = lazy(() => import("./pages/WorldCupPage"));
const AboutPage = lazy(() => import("./pages/AboutPage").then(m => ({ default: m.AboutPage })));

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
