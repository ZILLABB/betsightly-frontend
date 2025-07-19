/**
 * Accumulator Debug Component
 * 
 * Manual test to debug the 5_odds and 10_odds issue
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { getTodaysAccumulators, clearAccumulatorsCache } from '../../services/accumulatorsService';
import { usePredictions } from '../../contexts/PredictionsContext';

const AccumulatorDebug: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAccumulators = async () => {
    setLoading(true);
    try {
      console.log('🧪 Manual test: Clearing cache and fetching fresh data...');
      clearAccumulatorsCache();

      // First test raw API
      console.log('🧪 Testing raw API...');
      try {
        const rawResponse = await fetch('http://localhost:8000/api/accumulators/today', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
        });
        console.log('🧪 Raw response status:', rawResponse.status);
        console.log('🧪 Raw response ok:', rawResponse.ok);

        if (!rawResponse.ok) {
          const errorText = await rawResponse.text();
          console.error('🧪 Raw API error:', errorText);
          throw new Error(`HTTP ${rawResponse.status}: ${errorText}`);
        }

        const rawData = await rawResponse.json();
        console.log('🧪 Raw API response:', rawData);
        console.log('🧪 Raw categories:', Object.keys(rawData.accumulators || {}));
      } catch (apiError) {
        console.error('🧪 Raw API failed:', apiError);
        setDebugData({ error: `Raw API Error: ${apiError.message}` });
        setLoading(false);
        return;
      }

      // Then test our service
      console.log('🧪 Testing our service...');
      const data = await getTodaysAccumulators();
      setDebugData(data);

      console.log('🧪 Service result:', data);
      console.log('🧪 Service result keys:', Object.keys(data));
      console.log('🧪 Service result type:', typeof data);

      // Log each category in detail
      Object.entries(data).forEach(([category, predictions]) => {
        console.log(`🧪 ${category}:`, {
          isArray: Array.isArray(predictions),
          length: Array.isArray(predictions) ? predictions.length : 'N/A',
          type: typeof predictions,
          sample: Array.isArray(predictions) && predictions.length > 0 ? predictions[0] : 'No data'
        });
      });

    } catch (error) {
      console.error('🧪 Manual test failed:', error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900/95 border-amber-500/20 max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-400 flex items-center gap-2 text-sm">
          🧪 Accumulator Debug Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button 
          onClick={testAccumulators}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          {loading ? 'Testing...' : 'Test Accumulators API'}
        </Button>

        {debugData && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 font-medium">Debug Results:</div>
            
            {debugData.error ? (
              <div className="text-red-400 text-xs">Error: {debugData.error}</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(debugData).map(([category, predictions]: [string, any]) => (
                  <div key={category} className="border border-gray-700 rounded p-2">
                    <div className="text-amber-400 text-xs font-medium">{category}</div>
                    <div className="text-white text-xs">
                      {Array.isArray(predictions) ? `${predictions.length} predictions` : 'Not an array'}
                    </div>
                    {Array.isArray(predictions) && predictions.length > 0 && (
                      <div className="text-gray-300 text-xs mt-1">
                        Sample: {predictions[0]?.game?.homeTeam} vs {predictions[0]?.game?.awayTeam}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccumulatorDebug;
