import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../utils/dateUtils';
import {
  Spinner,
  Alert,
  Button,
  Card,
  CardContent,
  Badge,
  ProgressBar,
  Tabs,
  Tab
} from '../components/ui';
import type { Prediction } from '../types';
import {
  getBestPredictionsByCategory,
  getAllBestPredictions,
  setForceRefresh
} from '../services/enhancedApiService';
import { RefreshCw, Clock, Copy, AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { cardVariants, listItemVariants, fadeVariants } from '../utils/animations';
import { cn } from '../lib/utils';

interface PredictionsGridProps {
  date?: string;
  category?: string;
  onPredictionSelect?: (prediction: Prediction) => void;
  showExplanation?: boolean;
  showGameCode?: boolean;
  maxItems?: number;
}

const PredictionsGrid: React.FC<PredictionsGridProps> = ({
  date,
  category,
  onPredictionSelect,
  showExplanation = false,
  showGameCode = false,
  maxItems
}) => {
  const [predictions, setPredictions] = useState<Record<string, Prediction[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(category || '2_odds');

  // Load predictions on component mount or when date/category changes
  useEffect(() => {
    loadPredictions();
  }, [date, category]);

  // Function to load predictions
  const loadPredictions = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // If a specific category is requested, fetch only that category
      if (category) {
        const categoryPredictions = await getBestPredictionsByCategory(category);

        // Create a record with just this category
        const formattedPredictions: Record<string, Prediction[]> = {
          [category]: categoryPredictions
        };

        // Limit number of items if specified
        if (maxItems && formattedPredictions[category].length > maxItems) {
          formattedPredictions[category] = formattedPredictions[category].slice(0, maxItems);
        }

        setPredictions(formattedPredictions);
      } else {
        // Otherwise fetch all categories
        const allPredictions = await getAllBestPredictions();

        // Create a formatted record with all categories
        const formattedPredictions: Record<string, Prediction[]> = {};

        // Convert category names if needed and apply limits
        for (const [cat, preds] of Object.entries(allPredictions)) {
          // Convert frontend category names (2odds) to API format (2_odds) if needed
          const apiCategory = cat.includes('_') ? cat : cat.replace('odds', '_odds');

          formattedPredictions[apiCategory] = preds;

          // Limit number of items if specified
          if (maxItems && formattedPredictions[apiCategory].length > maxItems) {
            formattedPredictions[apiCategory] = formattedPredictions[apiCategory].slice(0, maxItems);
          }
        }

        setPredictions(formattedPredictions);
      }

      // Set active tab if category is specified
      if (category) {
        setActiveTab(category);
      }
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh predictions
  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Set force refresh flag to true
      setForceRefresh(true);

      // Reload predictions
      await loadPredictions();

      // Reset force refresh flag
      setForceRefresh(false);

    } catch (err) {
      console.error('Error refreshing predictions:', err);
      setError('Failed to refresh predictions. Please try again later.');

      // Make sure to reset force refresh flag even on error
      setForceRefresh(false);
    } finally {
      setRefreshing(false);
    }
  };

  // Function to handle prediction selection
  const handlePredictionClick = (prediction: Prediction) => {
    if (onPredictionSelect) {
      onPredictionSelect(prediction);
    }
  };

  // Function to copy game code to clipboard with toast notification
  const copyGameCode = (gameCode: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(gameCode)
      .then(() => {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 animate-in slide-in-from-bottom-5';
        toast.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Game code copied: ${gameCode}</span>
        `;
        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
          toast.classList.add('animate-out', 'slide-out-to-right-5', 'fade-out');
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 3000);
      })
      .catch(err => {
        console.error('Failed to copy game code:', err);

        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 animate-in slide-in-from-bottom-5';
        errorToast.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Failed to copy game code</span>
        `;
        document.body.appendChild(errorToast);

        // Remove error toast after 3 seconds
        setTimeout(() => {
          errorToast.classList.add('animate-out', 'slide-out-to-right-5', 'fade-out');
          setTimeout(() => {
            document.body.removeChild(errorToast);
          }, 300);
        }, 3000);
      });
  };

  // Render loading state
  if (loading) {
    return (
      <motion.div
        className="flex flex-col justify-center items-center my-8 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Spinner size="lg" variant="primary" className="mb-2" />
        <motion.p
          className="text-sm text-[var(--muted-foreground)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Loading predictions...
        </motion.p>
      </motion.div>
    );
  }

  // Render error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Alert variant="danger" className="flex flex-col sm:flex-row items-center justify-between p-4 shadow-md">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 sm:mt-0 hover:bg-red-500/10"
            onClick={() => loadPredictions()}
          >
            <RefreshCw size={14} className="mr-1.5" />
            Try Again
          </Button>
        </Alert>
      </motion.div>
    );
  }

  // If a specific category is requested, only show that category
  if (category && predictions[category]) {
    return renderPredictionsList(predictions[category], category);
  }

  // Otherwise, show tabs for all categories
  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={fadeVariants}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <motion.h3
          className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/70 bg-clip-text text-transparent"
          variants={fadeVariants}
          custom={1}
        >
          Predictions {date ? `for ${formatDate(new Date(date))}` : 'Today'}
        </motion.h3>
        <motion.div variants={fadeVariants} custom={2}>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center shadow-sm hover:shadow transition-all duration-300 border-[var(--primary)]/20 hover:border-[var(--primary)]/40"
          >
            {refreshing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                <span>Refresh</span>
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <motion.div
        variants={fadeVariants}
        custom={3}
        className="rounded-xl overflow-hidden shadow-md border border-[var(--border)]"
      >
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="w-full"
        >
          <Tab
            eventKey="2_odds"
            title={
              <div className="flex items-center space-x-2">
                <CheckCircle size={14} className="text-green-500" />
                <span>2 Odds</span>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`2_odds-${activeTab === '2_odds'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderPredictionsList(predictions['2_odds'] || [], '2_odds')}
              </motion.div>
            </AnimatePresence>
          </Tab>
          <Tab
            eventKey="5_odds"
            title={
              <div className="flex items-center space-x-2">
                <TrendingUp size={14} className="text-blue-500" />
                <span>5 Odds</span>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`5_odds-${activeTab === '5_odds'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderPredictionsList(predictions['5_odds'] || [], '5_odds')}
              </motion.div>
            </AnimatePresence>
          </Tab>
          <Tab
            eventKey="10_odds"
            title={
              <div className="flex items-center space-x-2">
                <Zap size={14} className="text-amber-500" />
                <span>10 Odds</span>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`10_odds-${activeTab === '10_odds'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderPredictionsList(predictions['10_odds'] || [], '10_odds')}
              </motion.div>
            </AnimatePresence>
          </Tab>
          <Tab
            eventKey="rollover"
            title={
              <div className="flex items-center space-x-2">
                <RefreshCw size={14} className="text-purple-500" />
                <span>Rollover</span>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`rollover-${activeTab === 'rollover'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderPredictionsList(predictions['rollover'] || [], 'rollover')}
              </motion.div>
            </AnimatePresence>
          </Tab>
        </Tabs>
      </motion.div>
    </motion.div>
  );

  // Helper function to render a list of predictions
  function renderPredictionsList(predictionsList: Prediction[], categoryName: string) {
    if (predictionsList.length === 0) {
      return (
        <motion.div
          className="text-center py-12 space-y-6 bg-black/20 rounded-xl border border-amber-500/10 p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
            <AlertCircle size={28} className="text-amber-400" />
          </div>
          <p className="text-white/70 text-lg">No predictions found for {getCategoryDisplayName(categoryName)}.</p>
          <Button
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50 transition-all duration-300 py-2.5 px-6 shadow-md hover:shadow-lg"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                <span>Refresh Predictions</span>
              </>
            )}
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="p-6"
        initial="initial"
        animate="animate"
        variants={fadeVariants}
      >
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={fadeVariants}
        >
          {predictionsList.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              variants={listItemVariants}
              custom={index}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <Card
                className={cn(
                  "h-full border bg-black/30 shadow-sm hover:shadow-md transition-all duration-300",
                  onPredictionSelect ? "cursor-pointer" : "",
                  prediction.confidence >= 80 ? "border-green-500/30" :
                  prediction.confidence >= 60 ? "border-blue-500/30" :
                  prediction.confidence >= 40 ? "border-amber-500/30" : "border-red-500/30"
                )}
                onClick={() => handlePredictionClick(prediction)}
              >
                <CardContent className="p-5">
                  {/* Header with time and odds */}
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="outline" className="flex items-center px-2.5 py-1 border-amber-500/20 text-amber-400 bg-black/20">
                      <Clock size={12} className="mr-1.5" />
                      {prediction.game.startTime instanceof Date
                        ? prediction.game.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Time N/A'}
                    </Badge>
                    <Badge
                      className={cn(
                        "px-2.5 py-1 font-medium border-0",
                        prediction.odds > 5
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                      )}
                    >
                      {prediction.odds.toFixed(2)} Odds
                    </Badge>
                  </div>

                  {/* Teams */}
                  <div className="relative bg-black/20 rounded-lg p-4 mb-4 border border-amber-500/10">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="font-medium text-base text-white">
                        {typeof prediction.game.homeTeam === 'string'
                          ? prediction.game.homeTeam
                          : prediction.game.homeTeam.name}
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-xs font-medium text-amber-400">
                        VS
                      </div>
                      <div className="font-medium text-base text-white">
                        {typeof prediction.game.awayTeam === 'string'
                          ? prediction.game.awayTeam
                          : prediction.game.awayTeam.name}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-black/30 text-amber-400 border border-amber-500/10">
                      {prediction.game.league}
                    </div>
                  </div>

                  {/* Prediction details */}
                  <div className="space-y-4">
                    <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                      <div className="text-sm font-medium mb-1 text-amber-400">Prediction</div>
                      <div className="text-base text-white">{prediction.predictionType} - {prediction.prediction}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-white/80">Confidence</span>
                        <span className={cn(
                          "font-bold",
                          prediction.confidence >= 80 ? "text-green-500" :
                          prediction.confidence >= 60 ? "text-blue-500" :
                          prediction.confidence >= 40 ? "text-amber-500" : "text-red-500"
                        )}>
                          {prediction.confidence}%
                        </span>
                      </div>
                      <ProgressBar
                        now={prediction.confidence}
                        variant={getConfidenceVariant(prediction.confidence)}
                        height={8}
                        className="rounded-full"
                      />
                    </div>

                    {showExplanation && prediction.explanation && (
                      <div className="mt-3 text-sm text-white/70 bg-black/20 p-3 rounded-lg border border-amber-500/10">
                        <div className="font-medium mb-1 text-xs text-amber-400">Analysis</div>
                        {prediction.explanation}
                      </div>
                    )}

                    {showGameCode && prediction.gameCode && (
                      <div className="mt-3">
                        <div className="text-xs text-amber-400 mb-1">Game Code</div>
                        <Badge
                          variant="secondary"
                          className="w-full font-mono text-xs py-2 flex justify-between items-center cursor-pointer bg-black/20 hover:bg-black/30 text-white border border-amber-500/10 transition-colors duration-200"
                          onClick={(e) => copyGameCode(prediction.gameCode || '', e)}
                        >
                          <span>{prediction.gameCode}</span>
                          <div className="bg-black/30 p-1 rounded border border-amber-500/10">
                            <Copy size={12} className="text-amber-400" />
                          </div>
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }
};

// Helper function to get display name for category
const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case '2_odds':
      return '2 Odds';
    case '5_odds':
      return '5 Odds';
    case '10_odds':
      return '10 Odds';
    case 'rollover':
      return 'Rollover';
    default:
      return category;
  }
};

// Helper function to get confidence variant
const getConfidenceVariant = (confidence: number): string => {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'info';
  if (confidence >= 40) return 'warning';
  return 'danger';
};

export default PredictionsGrid;
