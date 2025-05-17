import React, { useState, useEffect } from 'react';
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
import { RefreshCw, Clock, Copy, AlertCircle } from 'lucide-react';

interface PredictionsListProps {
  date?: string;
  category?: string;
  onPredictionSelect?: (prediction: Prediction) => void;
  showExplanation?: boolean;
  showGameCode?: boolean;
  maxItems?: number;
}

const ModernPredictionsList: React.FC<PredictionsListProps> = ({
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

  // Function to copy game code to clipboard
  const copyGameCode = (gameCode: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(gameCode)
      .then(() => {
        alert(`Game code copied: ${gameCode}`);
      })
      .catch(err => {
        console.error('Failed to copy game code:', err);
      });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center my-8">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="danger" className="flex flex-col sm:flex-row items-center justify-between p-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3 sm:mt-0"
          onClick={() => loadPredictions()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  // If a specific category is requested, only show that category
  if (category && predictions[category]) {
    return renderPredictionsList(predictions[category], category);
  }

  // Otherwise, show tabs for all categories
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold">Predictions {date ? `for ${formatDate(new Date(date))}` : 'Today'}</h3>
        <Button 
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center"
        >
          {refreshing ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="w-full"
      >
        <Tab eventKey="2_odds" title="2 Odds">
          {renderPredictionsList(predictions['2_odds'] || [], '2_odds')}
        </Tab>
        <Tab eventKey="5_odds" title="5 Odds">
          {renderPredictionsList(predictions['5_odds'] || [], '5_odds')}
        </Tab>
        <Tab eventKey="10_odds" title="10 Odds">
          {renderPredictionsList(predictions['10_odds'] || [], '10_odds')}
        </Tab>
        <Tab eventKey="rollover" title="Rollover">
          {renderPredictionsList(predictions['rollover'] || [], 'rollover')}
        </Tab>
      </Tabs>
    </div>
  );

  // Helper function to render a list of predictions
  function renderPredictionsList(predictionsList: Prediction[], categoryName: string) {
    if (predictionsList.length === 0) {
      return (
        <div className="text-center py-8 space-y-4">
          <p className="text-[var(--muted-foreground)]">No predictions found for {getCategoryDisplayName(categoryName)}.</p>
          <Button 
            variant="default"
            className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Refresh Predictions
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {predictionsList.map(prediction => (
          <Card 
            key={prediction.id}
            className={`h-full transition-all duration-300 hover:shadow-md ${onPredictionSelect ? 'cursor-pointer' : ''}`}
            onClick={() => handlePredictionClick(prediction)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <Badge variant="secondary" className="flex items-center">
                  <Clock size={12} className="mr-1" />
                  {prediction.game.startTime instanceof Date
                    ? prediction.game.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Time N/A'}
                </Badge>
                <Badge variant="primary">{prediction.odds.toFixed(2)}</Badge>
              </div>
              
              <div className="text-center mb-4 space-y-1">
                <div className="font-medium">
                  {typeof prediction.game.homeTeam === 'string'
                    ? prediction.game.homeTeam
                    : prediction.game.homeTeam.name}
                </div>
                <div className="text-[var(--muted-foreground)] text-sm">vs</div>
                <div className="font-medium">
                  {typeof prediction.game.awayTeam === 'string'
                    ? prediction.game.awayTeam
                    : prediction.game.awayTeam.name}
                </div>
                <div className="text-[var(--muted-foreground)] text-xs mt-1">
                  {prediction.game.league}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Prediction:</span> {prediction.predictionType} - {prediction.prediction}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Confidence</span>
                    <span className="font-medium">{prediction.confidence}%</span>
                  </div>
                  <ProgressBar 
                    now={prediction.confidence} 
                    variant={getConfidenceVariant(prediction.confidence)} 
                    height={6}
                  />
                </div>
                
                {showExplanation && prediction.explanation && (
                  <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                    {prediction.explanation}
                  </div>
                )}
                
                {showGameCode && prediction.gameCode && (
                  <div className="mt-3">
                    <Badge 
                      variant="secondary" 
                      className="w-full font-mono text-xs py-1.5 flex justify-between items-center cursor-pointer hover:bg-[var(--muted)]"
                      onClick={(e) => copyGameCode(prediction.gameCode || '', e)}
                    >
                      <span>{prediction.gameCode}</span>
                      <Copy size={12} className="ml-1 opacity-70" />
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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

export default ModernPredictionsList;
