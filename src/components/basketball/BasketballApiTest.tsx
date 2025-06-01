import React, { useState } from "react";
import { Button } from "../common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { Play, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { 
  getBasketballPredictions, 
  getBasketballModelsStatus, 
  isBasketballSeasonActive,
  getBasketballStats 
} from "../../services/basketballApiService";
import { 
  getEnhancedPredictions,
  getLivePredictions 
} from "../../services/enhancedPredictionService";
import { 
  checkAPIHealth,
  getDetailedHealthStatus,
  checkAPIReadiness,
  checkAPILiveness 
} from "../../services/unifiedApiService";

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const BasketballApiTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, data?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      } else {
        return [...prev, { name, status, message, data }];
      }
    });
  };

  const runAllTests = async () => {
    setRunning(true);
    setTests([]);

    const testCases = [
      {
        name: 'Basic API Health',
        test: async () => {
          const result = await checkAPIHealth();
          return { success: result, data: result };
        }
      },
      {
        name: 'API Readiness',
        test: async () => {
          const result = await checkAPIReadiness();
          return { success: result, data: result };
        }
      },
      {
        name: 'API Liveness',
        test: async () => {
          const result = await checkAPILiveness();
          return { success: result, data: result };
        }
      },
      {
        name: 'Detailed Health Status',
        test: async () => {
          const result = await getDetailedHealthStatus();
          return { success: !!result, data: result };
        }
      },
      {
        name: 'Basketball Season Status',
        test: async () => {
          const result = await isBasketballSeasonActive();
          return { success: true, data: result };
        }
      },
      {
        name: 'Basketball Predictions',
        test: async () => {
          const result = await getBasketballPredictions({ limit: 5 });
          return { success: !!result, data: result };
        }
      },
      {
        name: 'Basketball Models Status',
        test: async () => {
          const result = await getBasketballModelsStatus();
          return { success: Array.isArray(result), data: result };
        }
      },
      {
        name: 'Basketball Stats',
        test: async () => {
          const result = await getBasketballStats();
          return { success: !!result, data: result };
        }
      },
      {
        name: 'Enhanced Predictions',
        test: async () => {
          const result = await getEnhancedPredictions({ explanations: true });
          return { success: !!result, data: result };
        }
      },
      {
        name: 'Live Predictions',
        test: async () => {
          const result = await getLivePredictions({ limit: 5 });
          return { success: Array.isArray(result), data: result };
        }
      }
    ];

    for (const testCase of testCases) {
      updateTest(testCase.name, 'pending', 'Running...');
      
      try {
        const result = await testCase.test();
        updateTest(
          testCase.name, 
          result.success ? 'success' : 'error',
          result.success ? 'Test passed' : 'Test failed',
          result.data
        );
      } catch (error) {
        updateTest(
          testCase.name, 
          'error',
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-400 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Pass</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fail</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Running</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const pendingCount = tests.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-clash">API Integration Test</h2>
          <p className="text-sm text-white/70 font-jakarta">
            Test all basketball and enhanced prediction API endpoints
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={running}
          className="font-jakarta"
        >
          {running ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {/* Test Summary */}
      {tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="surface" hover="none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{tests.length}</div>
              <div className="text-sm text-white/70">Total Tests</div>
            </CardContent>
          </Card>
          <Card variant="surface" hover="none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{successCount}</div>
              <div className="text-sm text-white/70">Passed</div>
            </CardContent>
          </Card>
          <Card variant="surface" hover="none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{errorCount}</div>
              <div className="text-sm text-white/70">Failed</div>
            </CardContent>
          </Card>
          <Card variant="surface" hover="none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
              <div className="text-sm text-white/70">Running</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      {tests.length > 0 && (
        <Card variant="surface" hover="none">
          <CardHeader>
            <CardTitle size="md" font="clash" className="text-orange-400">
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-orange-500/20">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium text-white">{test.name}</div>
                      <div className="text-sm text-white/70">{test.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(test.status)}
                    {test.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-orange-400 hover:text-orange-300">
                          Data
                        </summary>
                        <pre className="mt-2 p-2 bg-black/40 rounded text-white/80 text-xs overflow-auto max-w-md">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {tests.length === 0 && (
        <Card variant="surface" hover="none">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mx-auto mb-4">
              <Play className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Ready to Test</h3>
            <p className="text-white/70 mb-4">
              Click "Run All Tests" to verify that all API endpoints are working correctly.
              This will test basketball predictions, enhanced features, and health monitoring.
            </p>
            <p className="text-sm text-white/50">
              Make sure your backend API server is running at http://localhost:8000
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BasketballApiTest;
