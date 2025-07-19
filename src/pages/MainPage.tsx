import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  LoadingSpinner,
  ErrorDisplay,
  Spinner
} from '../components/ui';
import EnhancedLoadingSpinner from '../components/common/EnhancedLoadingSpinner';
import FootballLoader from '../components/common/FootballLoader';
import { PredictionCardSkeleton } from '../components/common/SkeletonLoader';
import {
  RefreshCw,
  Filter
} from 'lucide-react';
import TabbedPredictionsCard from '../components/predictions/TabbedPredictionsCard';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import TestimonialsSection from '../components/home/TestimonialsSection';

import FeaturedMatchesSection from '../components/home/FeaturedMatchesSection';
import PullToRefresh from '../components/common/PullToRefresh';
import { useToast } from '../hooks/useToast';
import { usePredictions } from '../contexts/PredictionsContext';
import SimpleDataCheck from '../components/debug/SimpleDataCheck';
import AccumulatorDebug from '../components/debug/AccumulatorDebug';
import DirectApiTest from '../components/debug/DirectApiTest';

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const MainPage: React.FC = () => {
  // Get predictions data and actions from context
  const {
    allPredictions: predictions,
    loading,
    refreshing,
    error,
    refreshPredictions,
    loadAllPredictions
  } = usePredictions();

  // Debug: Log predictions state changes
  useEffect(() => {
    console.log("🏠 MainPage: predictions changed:", predictions);
    console.log("🏠 MainPage: Categories in state:", Object.keys(predictions));
    Object.entries(predictions).forEach(([cat, preds]) => {
      console.log(`🏠 MainPage: ${cat} has ${preds.length} predictions`);
    });
  }, [predictions]);

  // Local state for UI controls
  const [showFilters, setShowFilters] = useState(false);

  // Load all predictions on component mount (only once)
  useEffect(() => {
    console.log("🏠 MainPage: Loading predictions (ONCE)...");
    loadAllPredictions();

    // Manual test after a delay
    setTimeout(async () => {
      console.log("🏠 MainPage: Manual test after 3 seconds...");
      try {
        const response = await fetch('http://localhost:8000/api/accumulators/today');
        const data = await response.json();
        console.log("🏠 MainPage: Direct API test result:", data);
        console.log("🏠 MainPage: Categories available:", Object.keys(data.accumulators || {}));
      } catch (error) {
        console.error("🏠 MainPage: Direct API test failed:", error);
      }
    }, 3000);
  }, []); // Empty dependency array to run only once




  // Helper functions moved to TabbedPredictionsCard component

  // Toast notification system
  const { toast } = useToast();

  // Handle refresh
  const handleRefresh = async () => {
    try {
      toast({
        title: "Refreshing predictions",
        description: "Getting the latest data...",
        variant: "info",
        duration: 2000
      });

      // Use the refreshPredictions function from context
      await refreshPredictions();

      toast({
        title: "Predictions refreshed",
        description: "All prediction data has been updated",
        variant: "success",
        duration: 3000
      });
    } catch (err) {
      console.error('Error refreshing predictions:', err);
      toast({
        title: "Error refreshing predictions",
        description: "Please try again later",
        variant: "error",
        duration: 5000
      });
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = (prediction: any) => {
    toast({
      title: "Prediction selected",
      description: `${prediction.game?.homeTeam?.name || 'Home'} vs ${prediction.game?.awayTeam?.name || 'Away'}`,
      variant: "info",
      duration: 2000
    });
  };



  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      className="min-h-screen"
      enabled={!loading && !refreshing}
    >


      <motion.div
        className="w-full space-y-8 md:space-y-12 pb-16"
        initial="initial"
        animate="animate"
        variants={pageVariants}
      >
        {/* Hero Section */}
        <section className="w-full bg-[var(--background)] pt-4">
          <div className="container mx-auto container-padding">
            <HeroSection />
          </div>
        </section>

        {/* Debug Components (temporary) */}
        <section className="container mx-auto container-padding">
          <div className="flex justify-end gap-4">
            <SimpleDataCheck />
            <AccumulatorDebug />
          </div>
        </section>



        {/* Controls Section */}
        <section className="container mx-auto container-padding mt-8 md:mt-12">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
            Today's <span className="text-primary-400">Premium Predictions</span>
          </h2>
          <div className="flex items-center gap-2 md:gap-3 mt-3 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10 text-xs md:text-sm"
            >
              <Filter size={14} className="mr-1.5" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10 text-xs md:text-sm"
            >
              {refreshing ? (
                <>
                  <Spinner size="sm" variant="primary" className="mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="container mx-auto container-padding card-spacing">
            <div className="flex flex-col items-center justify-center section-padding">
              <FootballLoader
                size="lg"
                text="Loading football predictions..."
              />
            </div>
            {/* Skeleton cards for better perceived performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PredictionCardSkeleton count={6} />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <ErrorDisplay
            title="Failed to load predictions"
            message={error}
            onRetry={handleRefresh}
            retryText="Refresh Predictions"
          />
        )}

        {/* Tabbed Predictions Card */}
        {!loading && !error && (
          <TabbedPredictionsCard
            predictions={predictions}
            onPredictionSelect={handlePredictionSelect}
            showFilters={showFilters}
          />
        )}
      </section>

      {/* Featured Matches Section */}
      <FeaturedMatchesSection />

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-4 md:py-8 mt-4 md:mt-8">
        <StatsSection />
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-4 md:py-8 mt-4 md:mt-8">
        <TestimonialsSection />
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-4 md:py-8 mt-4 md:mt-8">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl md:rounded-2xl p-6 md:p-12 shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-black mb-3 md:mb-4">Ready to Elevate Your Betting Game?</h2>
            <p className="text-black/80 text-base md:text-lg mb-6 md:mb-8">
              Join thousands of users who trust our predictions for their daily betting decisions.
            </p>
            <Button
              size="lg"
              className="bg-black text-primary-400 hover:bg-[var(--muted)] transition-colors duration-300 px-6 md:px-8 py-2 md:py-3 text-base md:text-lg"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
    </PullToRefresh>
  );
};

export default MainPage;
