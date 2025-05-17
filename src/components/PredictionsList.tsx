import React from 'react';
import PredictionsGrid from './PredictionsGrid';
import type { Prediction } from '../types';

interface PredictionsListProps {
  date?: string;
  category?: string;
  onPredictionSelect?: (prediction: Prediction) => void;
  showExplanation?: boolean;
  showGameCode?: boolean;
  maxItems?: number;
}

// This is a compatibility wrapper that uses the new PredictionsGrid component
const PredictionsList: React.FC<PredictionsListProps> = (props) => {
  return <PredictionsGrid {...props} />;
};



export default PredictionsList;
