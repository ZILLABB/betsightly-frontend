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

  // Local state for UI controls
  const [showFilters, setShowFilters] = useState(false);

  // Load all predictions on component mount (only once)
  useEffect(() => {
    loadAllPredictions();
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




        {/* Controls Section */}
        <section className="container mx-auto container-padding mt-8 md:mt-12">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              className="text-2xl md:text-3xl font-semibold">
            Today's{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--brand-400), var(--brand-600))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent"
            }}>
              Premium Predictions
            </span>
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
        <div
          className="rounded-2xl p-8 md:p-14 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--brand-500) 0%, var(--brand-700) 100%)",
            boxShadow: "0 8px 40px rgba(245,158,11,0.35)",
          }}
        >
          {/* Decorative ring */}
          <div className="absolute inset-0 opacity-10"
            style={{ background: "radial-gradient(circle at 70% 30%, white 0%, transparent 70%)" }} />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2
              className="text-2xl md:text-4xl font-bold mb-3 md:mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--surface-0)", letterSpacing: "var(--tracking-tight)" }}
            >
              Ready to Elevate Your Betting Game?
            </h2>
            <p className="text-base md:text-lg mb-6 md:mb-8" style={{ color: "rgba(0,0,0,0.7)" }}>
              Join thousands of users who trust our AI-powered predictions every day.
            </p>
            <Button
              size="lg"
              className="font-semibold px-8 py-3"
              style={{ background: "var(--surface-0)", color: "var(--brand-400)" }}
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
