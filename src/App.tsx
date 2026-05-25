import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PreferencesProvider } from "./contexts/PreferencesProvider";
import ThemeProvider from "./components/common/ThemeProvider";
import { Layout } from "./components/layout/Layout";
import { Spinner } from "./components/ui/Spinner";
import { HomePage } from "./pages/HomePage";
import { PredictionsPage } from "./pages/PredictionsPage";
import { ResultsPage } from "./pages/ResultsPage";
import { RolloverPage } from "./pages/RolloverPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function Fallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <Spinner size={32} />
    </div>
  );
}

export default function App() {
  return (
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
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
    </ThemeProvider>
    </PreferencesProvider>
  );
}
