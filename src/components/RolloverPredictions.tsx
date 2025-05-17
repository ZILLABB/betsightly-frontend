import React, { useState, useEffect } from 'react';
import { getRolloverPredictions } from '../services/apiService';
import { formatDate } from '../utils/dateUtils';
import {
  Spinner,
  Alert,
  Button,
  Card,
  CardContent,
  Badge,
  ProgressBar,
  Accordion,
  AccordionItem
} from '../components/ui';
import { Prediction } from '../types';
import { Copy, Clock, Calendar } from 'lucide-react';
import { cn } from '../utils/cn';

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
      <div className="flex justify-center items-center my-8">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="danger" className="flex flex-col sm:flex-row items-center justify-between p-4">
        <div>{error}</div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 sm:mt-0"
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
      <Alert variant="info" className="p-4">
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
    <div className="space-y-6">
      <Accordion defaultActiveKey={daysWithPredictions[0].toString()} alwaysOpen className="premium-accordion">
        {daysWithPredictions.map(day => (
          <AccordionItem
            key={day}
            eventKey={day.toString()}
            title={
              <div className="flex justify-between items-center w-full pr-2">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 mr-3">
                    <Calendar size={16} className="text-amber-400" />
                  </div>
                  <span className="font-medium text-white">Day {day}: <span className="text-amber-400">{formatDate(dayDates[day])}</span></span>
                </div>
                <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-0">{rolloverPredictions[day].length} Picks</Badge>
              </div>
            }
            className="bg-black/20 border border-amber-500/10 rounded-lg mb-4"
          >
            {rolloverPredictions[day].length > 0 && (
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-white/70">Premium picks for Day {day}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => copyAllGameCodes(rolloverPredictions[day], day, e)}
                  className="flex items-center border-amber-500/30 text-amber-400 hover:bg-black/20 hover:border-amber-500/50"
                >
                  <Copy size={14} className="mr-1.5" />
                  Copy All Game Codes
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rolloverPredictions[day].map(prediction => (
                <Card
                  key={prediction.id}
                  className={cn(
                    "h-full border bg-black/30 shadow-sm hover:shadow-md transition-all duration-300",
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
                          variant={getConfidenceColor(prediction.confidence)}
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
              ))}
            </div>
          </AccordionItem>
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
