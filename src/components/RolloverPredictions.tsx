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
  Accordion,
  AccordionItem,
  LoadingSpinner
} from '../components/ui';
import { Prediction } from '../types';
import { Copy, Clock, Calendar } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../hooks/useToast';
import { usePredictions } from '../contexts/PredictionsContext';

interface RolloverPredictionsProps {
  days?: number;
  onPredictionSelect?: (prediction: Prediction) => void;
  showExplanation?: boolean;
  showGameCode?: boolean;
  predictions?: Record<number, Prediction[]>;
}

const RolloverPredictions: React.FC<RolloverPredictionsProps> = ({
  days = 10,
  onPredictionSelect,
  showExplanation = false,
  showGameCode = true,
  predictions = {}
}) => {
  // Get predictions from context
  const {
    rolloverPredictions: contextPredictions,
    loading: contextLoading,
    error: contextError,
    loadRolloverPredictions: contextLoadRolloverPredictions
  } = usePredictions();

  const [usingSampleData, setUsingSampleData] = useState<boolean>(false);

  // Determine which predictions to use - props take precedence, then context
  const rolloverPredictions = Object.keys(predictions).length > 0
    ? predictions
    : contextPredictions;

  // Load rollover predictions on component mount or when days changes if no predictions provided
  useEffect(() => {
    if (Object.keys(predictions).length === 0 && Object.keys(contextPredictions).length === 0) {
      contextLoadRolloverPredictions(days);
    }
  }, [days, predictions, contextPredictions, contextLoadRolloverPredictions]);

  // Check if we're using sample data
  useEffect(() => {
    if (Object.keys(rolloverPredictions).length > 0) {
      const firstDay = Object.keys(rolloverPredictions)[0];
      const firstPrediction = rolloverPredictions[Number(firstDay)]?.[0];
      if (firstPrediction &&
          typeof firstPrediction.id === 'string' &&
          firstPrediction.id.startsWith('sample-')) {
        setUsingSampleData(true);
      } else {
        setUsingSampleData(false);
      }
    }
  }, [rolloverPredictions]);

  // Function to load rollover predictions - now just calls the context function
  const loadRolloverPredictions = () => {
    contextLoadRolloverPredictions(days);
  };

  // Function to handle prediction selection
  const handlePredictionClick = (prediction: Prediction) => {
    if (onPredictionSelect) {
      onPredictionSelect(prediction);
    }
  };

  // Get toast notification function
  const { toast } = useToast();

  // Function to copy game code to clipboard
  const copyGameCode = (gameCode: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(gameCode)
      .then(() => {
        toast({
          title: "Game code copied",
          description: gameCode,
          variant: "success",
          duration: 2000
        });
      })
      .catch(err => {
        console.error('Failed to copy game code:', err);
        toast({
          title: "Failed to copy",
          description: "Please try again",
          variant: "error",
          duration: 2000
        });
      });
  };

  // Function to copy all game codes for a day
  const copyAllGameCodes = (predictions: Prediction[], day: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const gameCodes = predictions.map(p => p.gameCode).filter(Boolean).join('\n');

    if (gameCodes) {
      navigator.clipboard.writeText(gameCodes)
        .then(() => {
          toast({
            title: "All game codes copied",
            description: `Day ${day} game codes copied to clipboard`,
            variant: "success",
            duration: 2000
          });
        })
        .catch(err => {
          console.error('Failed to copy game codes:', err);
          toast({
            title: "Failed to copy",
            description: "Please try again",
            variant: "error",
            duration: 2000
          });
        });
    } else {
      toast({
        title: "No game codes available",
        description: "There are no game codes to copy",
        variant: "warning",
        duration: 2000
      });
    }
  };

  // Render loading state
  if (contextLoading) {
    return (
      <div className="flex justify-center items-center my-8">
        <LoadingSpinner size="lg" variant="primary" text="Loading rollover predictions..." />
      </div>
    );
  }

  // Get days with predictions
  const daysWithPredictions = Object.keys(rolloverPredictions)
    .map(Number)
    .sort((a, b) => a - b);

  // If no predictions found
  if (daysWithPredictions.length === 0) {
    return (
      <Alert variant="info" className="p-4 flex flex-col sm:flex-row items-center justify-between">
        <div>No rollover predictions available. Please try again later.</div>
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

  // Render error state
  if (contextError) {
    return (
      <Alert variant="danger" className="flex flex-col sm:flex-row items-center justify-between p-4">
        <div>{contextError}</div>
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
      {usingSampleData && (
        <Alert variant="warning" className="p-4 flex items-center">
          <div className="flex-1">
            <strong>Note:</strong> Using sample data for demonstration purposes. The API did not return actual rollover predictions.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRolloverPredictions()}
            className="ml-4"
          >
            Try Again
          </Button>
        </Alert>
      )}
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
                  key={typeof prediction.id === 'string' ? prediction.id : `prediction-${Math.random()}`}
                  className={cn(
                    "h-full border bg-black/30 shadow-sm hover:shadow-md transition-all duration-300",
                    (prediction.confidence || 0) >= 80 ? "border-green-500/30" :
                    (prediction.confidence || 0) >= 60 ? "border-blue-500/30" :
                    (prediction.confidence || 0) >= 40 ? "border-amber-500/30" : "border-red-500/30"
                  )}
                  onClick={() => handlePredictionClick(prediction)}
                >
                  <CardContent className="p-5">
                    {/* Header with time and odds */}
                    <div className="flex justify-between items-center mb-4">
                      <Badge variant="outline" className="flex items-center px-2.5 py-1 border-amber-500/20 text-amber-400 bg-black/20">
                        <Clock size={12} className="mr-1.5" />
                        {prediction.game && prediction.game.startTime instanceof Date
                          ? prediction.game.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Time N/A'}
                      </Badge>
                      <Badge
                        className={cn(
                          "px-2.5 py-1 font-medium flex items-center justify-center min-w-[80px]",
                          (prediction.odds || 0) > 5
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        )}
                      >
                        {(prediction.odds || 0).toFixed(2)}x
                      </Badge>
                    </div>

                    {/* Teams */}
                    <div className="relative bg-black/20 rounded-lg p-4 mb-4 border border-amber-500/10">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="font-medium text-base text-white">
                          {prediction.game && typeof prediction.game.homeTeam === 'string'
                            ? prediction.game.homeTeam
                            : prediction.game?.homeTeam?.name || 'Home Team'}
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-xs font-medium text-amber-400">
                          VS
                        </div>
                        <div className="font-medium text-base text-white">
                          {prediction.game && typeof prediction.game.awayTeam === 'string'
                            ? prediction.game.awayTeam
                            : prediction.game?.awayTeam?.name || 'Away Team'}
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-black/30 text-amber-400 border border-amber-500/10">
                        {prediction.game?.league || 'Unknown League'}
                      </div>
                    </div>

                    {/* Prediction details */}
                    <div className="space-y-4">
                      <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                        <div className="text-sm font-medium mb-1 text-amber-400">Prediction</div>
                        <div className="text-base text-white">{prediction.predictionType || 'Match Result'} {prediction.prediction ? `- ${prediction.prediction}` : ''}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-white/80">Confidence</span>
                          <span className={cn(
                            "font-bold",
                            (prediction.confidence || 0) >= 80 ? "text-green-500" :
                            (prediction.confidence || 0) >= 60 ? "text-blue-500" :
                            (prediction.confidence || 0) >= 40 ? "text-amber-500" : "text-red-500"
                          )}>
                            {(prediction.confidence || 0).toFixed(1)}%
                          </span>
                        </div>
                        <ProgressBar
                          now={parseFloat((prediction.confidence || 0).toFixed(1))}
                          variant={getConfidenceColor(prediction.confidence || 0)}
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
