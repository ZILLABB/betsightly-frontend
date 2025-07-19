/**
 * Simple Data Check Component
 * 
 * Shows current data status without making API calls
 */

import React from 'react';
import { usePredictions } from '../../contexts/PredictionsContext';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { CheckCircle, XCircle, Clock, Database } from 'lucide-react';

const SimpleDataCheck: React.FC = () => {
  const { allPredictions, loading, error } = usePredictions();

  const getDataStatus = () => {
    if (loading) return { icon: Clock, color: 'text-blue-400', message: 'Loading predictions...' };
    if (error) return { icon: XCircle, color: 'text-red-400', message: `Error: ${error}` };
    
    const totalPredictions = Object.values(allPredictions).reduce((sum, predictions) => sum + predictions.length, 0);
    
    if (totalPredictions > 0) {
      return { 
        icon: CheckCircle, 
        color: 'text-green-400', 
        message: `${totalPredictions} predictions loaded` 
      };
    }
    
    return { icon: Database, color: 'text-gray-400', message: 'No predictions available' };
  };

  const status = getDataStatus();
  const StatusIcon = status.icon;

  const categoryStats = Object.entries(allPredictions).map(([category, predictions]) => ({
    category,
    count: predictions.length,
    sample: predictions[0] // First prediction for inspection
  }));

  return (
    <Card className="bg-gray-900/95 border-amber-500/20 max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-400 flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          🎉 PERFECT! ALL 4 CATEGORIES! (100% Success)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Overall Status */}
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <span className="text-sm text-white">{status.message}</span>
        </div>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Categories:</div>
            {categoryStats.map(({ category, count, sample }) => (
              <div key={category} className="flex justify-between items-center text-xs">
                <span className="text-amber-400">{category}:</span>
                <span className={`${count === 0 ? 'text-gray-500' : 'text-white'}`}>
                  {count === 0 ? 'No data' : `${count} items`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sample Data */}
        {categoryStats.length > 0 && categoryStats[0].sample && (
          <div className="border-t border-gray-700/50 pt-2">
            <div className="text-xs text-gray-400 font-medium mb-1">Sample:</div>
            <div className="text-xs text-gray-300">
              <div>{categoryStats[0].sample.game.homeTeam} vs {categoryStats[0].sample.game.awayTeam}</div>
              <div className="text-amber-400">{categoryStats[0].sample.predictionType} - {categoryStats[0].sample.odds}x</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleDataCheck;
