import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import { Spinner, Alert, Button, Card, Badge, ProgressBar, Tabs, Tab } from 'react-bootstrap';
import { Prediction } from '../types';
import {
  getBestPredictionsByCategory,
  getAllBestPredictions,
  setForceRefresh
} from '../services/enhancedApiService';

interface PredictionsListProps {
  date?: string;
  category?: string;
  onPredictionSelect?: (prediction: Prediction) => void;
  showExplanation?: boolean;
  showGameCode?: boolean;
  maxItems?: number;
}

const PredictionsList: React.FC<PredictionsListProps> = ({
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
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="danger">
        {error}
        <Button
          variant="outline-danger"
          size="sm"
          className="ms-3"
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
    <div className="predictions-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Predictions {date ? `for ${formatDate(new Date(date))}` : 'Today'}</h3>
        <Button
          variant="outline-primary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || '2_odds')}
        className="mb-4"
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
        <div className="text-center my-4">
          <p className="text-muted">No predictions found for {getCategoryDisplayName(categoryName)}.</p>
          <Button
            variant="primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Predictions'}
          </Button>
        </div>
      );
    }

    return (
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        {predictionsList.map(prediction => (
          <div key={prediction.id} className="col">
            <Card
              className="h-100 prediction-card"
              onClick={() => handlePredictionClick(prediction)}
              style={{ cursor: onPredictionSelect ? 'pointer' : 'default' }}
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Badge bg="secondary">
                    {prediction.game.startTime instanceof Date
                      ? prediction.game.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Time N/A'}
                  </Badge>
                  <Badge bg="primary">{prediction.odds.toFixed(2)}</Badge>
                </div>

                <div className="text-center mb-3">
                  <div className="team home-team mb-1">
                    {typeof prediction.game.homeTeam === 'string'
                      ? prediction.game.homeTeam
                      : prediction.game.homeTeam.name}
                  </div>
                  <div className="versus">vs</div>
                  <div className="team away-team mt-1">
                    {typeof prediction.game.awayTeam === 'string'
                      ? prediction.game.awayTeam
                      : prediction.game.awayTeam.name}
                  </div>
                  <div className="league mt-1 text-muted small">
                    {prediction.game.league}
                  </div>
                </div>

                <div className="prediction-details">
                  <div className="prediction-type mb-1">
                    <strong>Prediction:</strong> {prediction.predictionType} - {prediction.prediction}
                  </div>

                  <div className="confidence mb-2">
                    <div className="d-flex justify-content-between">
                      <small>Confidence</small>
                      <small>{prediction.confidence}%</small>
                    </div>
                    <ProgressBar
                      now={prediction.confidence}
                      variant={getConfidenceColor(prediction.confidence)}
                    />
                  </div>

                  {showExplanation && prediction.explanation && (
                    <div className="explanation mt-3">
                      <small className="text-muted">{prediction.explanation}</small>
                    </div>
                  )}

                  {showGameCode && prediction.gameCode && (
                    <div className="game-code mt-2">
                      <Badge
                        bg="secondary"
                        className="w-100 text-monospace"
                        onClick={(e) => copyGameCode(prediction.gameCode || '', e)}
                        style={{ cursor: 'pointer' }}
                      >
                        {prediction.gameCode}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
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

// Helper function to get confidence color
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'info';
  if (confidence >= 40) return 'warning';
  return 'danger';
};

export default PredictionsList;
