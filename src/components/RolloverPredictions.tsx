import React, { useState, useEffect } from 'react';
import { getRolloverPredictions } from '../services/apiService';
import { formatDate } from '../utils/dateUtils';
import { Spinner, Alert, Button, Card, Badge, ProgressBar, Accordion } from 'react-bootstrap';
import { Prediction } from '../types';

interface RolloverPredictionsProps {
  days?: number;
  onPredictionSelect?: (prediction: Prediction) => void;
  showExplanation?: boolean;
  showGameCode?: boolean;
}

const RolloverPredictions: React.FC<RolloverPredictionsProps> = ({
  days = 10,
  onPredictionSelect,
  showExplanation = false,
  showGameCode = true
}) => {
  const [rolloverPredictions, setRolloverPredictions] = useState<Record<number, Prediction[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load rollover predictions on component mount
  useEffect(() => {
    loadRolloverPredictions();
  }, [days]);

  // Function to load rollover predictions
  const loadRolloverPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const predictionsData = await getRolloverPredictions(days);
      setRolloverPredictions(predictionsData);
    } catch (err) {
      console.error('Error loading rollover predictions:', err);
      setError('Failed to load rollover predictions. Please try again later.');
    } finally {
      setLoading(false);
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

  // Function to copy all game codes for a day
  const copyAllGameCodes = (predictions: Prediction[], day: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const gameCodes = predictions.map(p => p.gameCode).filter(Boolean).join('\n');
    
    if (gameCodes) {
      navigator.clipboard.writeText(gameCodes)
        .then(() => {
          alert(`All game codes for Day ${day} copied!`);
        })
        .catch(err => {
          console.error('Failed to copy game codes:', err);
        });
    } else {
      alert('No game codes available to copy.');
    }
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
          onClick={() => loadRolloverPredictions()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  // Get days with predictions
  const daysWithPredictions = Object.keys(rolloverPredictions)
    .map(Number)
    .sort((a, b) => a - b);

  // If no predictions found
  if (daysWithPredictions.length === 0) {
    return (
      <Alert variant="info">
        No rollover predictions available. Please try again later.
      </Alert>
    );
  }

  // Calculate dates for each day
  const today = new Date();
  const dayDates = daysWithPredictions.reduce((acc, day) => {
    const date = new Date(today);
    date.setDate(date.getDate() + day - 1);
    acc[day] = date;
    return acc;
  }, {} as Record<number, Date>);

  return (
    <div className="rollover-predictions">
      <h3 className="mb-4">10-Day Rollover Challenge</h3>
      
      <Accordion defaultActiveKey={daysWithPredictions[0].toString()} alwaysOpen>
        {daysWithPredictions.map(day => (
          <Accordion.Item key={day} eventKey={day.toString()}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100 me-3">
                <span>Day {day}: {formatDate(dayDates[day])}</span>
                <Badge bg="primary">{rolloverPredictions[day].length} Predictions</Badge>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              {rolloverPredictions[day].length > 0 && (
                <div className="mb-3">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={(e) => copyAllGameCodes(rolloverPredictions[day], day, e)}
                  >
                    Copy All Game Codes
                  </Button>
                </div>
              )}
              
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {rolloverPredictions[day].map(prediction => (
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
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

// Helper function to get confidence color
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'info';
  if (confidence >= 40) return 'warning';
  return 'danger';
};

export default RolloverPredictions;
