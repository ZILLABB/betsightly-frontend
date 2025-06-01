import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { Badge } from "../common/Badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Server } from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig";

interface ApiEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  description: string;
}

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  responseTime: number;
  statusCode?: number;
  error?: string;
}

const ApiStatusChecker: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  // Define key endpoints to test
  const endpoints: ApiEndpoint[] = [
    { name: 'Health Check', url: '/health', method: 'GET', description: 'Basic API health' },
    { name: 'Detailed Health', url: '/health/detailed', method: 'GET', description: 'Detailed system status' },
    { name: 'API Readiness', url: '/health/ready', method: 'GET', description: 'API readiness probe' },
    { name: 'API Liveness', url: '/health/live', method: 'GET', description: 'API liveness probe' },
    { name: 'Football Predictions', url: '/predictions/best', method: 'GET', description: 'Best football predictions' },
    { name: 'Basketball Predictions', url: '/basketball-predictions', method: 'GET', description: 'NBA predictions' },
    { name: 'Basketball Models', url: '/basketball-models/status', method: 'GET', description: 'Basketball model status' },
    { name: 'Enhanced Predictions', url: '/predictions/enhanced', method: 'GET', description: 'AI-enhanced predictions' },
  ];

  const testEndpoint = async (endpoint: ApiEndpoint): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;

      return {
        endpoint: endpoint.name,
        status: response.ok ? 'success' : 'error',
        responseTime,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        endpoint: endpoint.name,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    // Initialize results with pending status
    const initialResults = endpoints.map(endpoint => ({
      endpoint: endpoint.name,
      status: 'pending' as const,
      responseTime: 0,
    }));
    setResults(initialResults);

    // Test each endpoint
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      const result = await testEndpoint(endpoint);
      
      setResults(prev => prev.map((r, index) => 
        index === i ? result : r
      ));

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTesting(false);
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

  const getStatusBadge = (result: TestResult) => {
    switch (result.status) {
      case 'success':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {result.statusCode} - {result.responseTime}ms
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Error
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Testing...
          </Badge>
        );
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const avgResponseTime = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-clash flex items-center">
            <Server className="h-5 w-5 mr-2 text-blue-400" />
            API Status Checker
          </h2>
          <p className="text-sm text-white/70 font-jakarta">
            Test connectivity to backend API endpoints
          </p>
          <p className="text-xs text-white/50 font-jakarta mt-1">
            Backend URL: {API_BASE_URL}
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={testing}
          className="font-jakarta"
        >
          {testing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test All Endpoints
            </>
          )}
        </Button>
      </div>

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="surface" hover="none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{endpoints.length}</div>
              <div className="text-sm text-white/70">Total Endpoints</div>
            </CardContent>
          </Card>
          <Card variant="surface" hover="none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{successCount}</div>
              <div className="text-sm text-white/70">Successful</div>
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
              <div className="text-2xl font-bold text-blue-400">{avgResponseTime}ms</div>
              <div className="text-sm text-white/70">Avg Response</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      <Card variant="surface" hover="none">
        <CardHeader>
          <CardTitle size="md" font="clash" className="text-blue-400">
            Endpoint Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mx-auto mb-4">
                <Server className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Ready to Test</h3>
              <p className="text-white/70 mb-4">
                Click "Test All Endpoints" to check the connectivity to your backend API.
              </p>
              <p className="text-sm text-white/50">
                Make sure your backend server is running at {API_BASE_URL.replace('/api', '')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => {
                const endpoint = endpoints[index];
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-blue-500/20">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium text-white">{result.endpoint}</div>
                        <div className="text-sm text-white/70">{endpoint.description}</div>
                        <div className="text-xs text-white/50">{endpoint.method} {endpoint.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(result)}
                      {result.error && (
                        <div className="text-xs text-red-400 max-w-xs truncate" title={result.error}>
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Troubleshooting Tips */}
      <Card variant="surface" hover="none">
        <CardHeader>
          <CardTitle size="sm" font="clash" className="text-amber-400">
            Troubleshooting Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0"></div>
              <div>
                <strong>CORS Errors:</strong> Make sure your backend allows requests from this origin ({window.location.origin})
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0"></div>
              <div>
                <strong>Connection Refused:</strong> Verify your backend server is running on the correct port
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0"></div>
              <div>
                <strong>Slow Responses:</strong> Check your backend performance and database connections
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0"></div>
              <div>
                <strong>404 Errors:</strong> Verify the API endpoints exist and are correctly implemented
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiStatusChecker;
