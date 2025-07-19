/**
 * Direct API Test Component
 * 
 * Bypasses all services to test direct API connection
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';

const DirectApiTest: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDirectApi = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🔬 Direct API Test: Starting...');
      
      const url = 'http://localhost:8000/api/accumulators/today';
      console.log('🔬 Testing URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('🔬 Response status:', response.status);
      console.log('🔬 Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔬 Response data:', data);
      
      setTestResult({
        success: true,
        status: response.status,
        categories: Object.keys(data.accumulators || {}),
        totalGames: data.summary?.total_games_in_accumulators || 0,
        successRate: data.summary?.success_rate || '0%',
        data: data
      });
      
    } catch (error) {
      console.error('🔬 Direct API test failed:', error);
      setTestResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-test on mount
  useEffect(() => {
    testDirectApi();
  }, []);

  return (
    <Card className="bg-gray-900/95 border-amber-500/20 max-w-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-400 flex items-center gap-2 text-sm">
          🔬 Direct API Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button 
          onClick={testDirectApi}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full"
        >
          {loading ? 'Testing...' : 'Test Direct API'}
        </Button>

        {testResult && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 font-medium">Test Results:</div>
            
            {testResult.success ? (
              <div className="space-y-2">
                <div className="text-green-400 text-xs">✅ API Connection Successful!</div>
                <div className="text-white text-xs">Status: {testResult.status}</div>
                <div className="text-white text-xs">Categories: {testResult.categories.join(', ')}</div>
                <div className="text-white text-xs">Total Games: {testResult.totalGames}</div>
                <div className="text-white text-xs">Success Rate: {testResult.successRate}</div>
                
                <div className="border border-gray-700 rounded p-2 max-h-32 overflow-y-auto">
                  <div className="text-xs text-gray-300">
                    <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-red-400 text-xs">❌ API Connection Failed</div>
                <div className="text-red-300 text-xs">Error: {testResult.error}</div>
                {testResult.stack && (
                  <div className="border border-red-700 rounded p-2 max-h-32 overflow-y-auto">
                    <div className="text-xs text-red-200">
                      <pre>{testResult.stack}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectApiTest;
