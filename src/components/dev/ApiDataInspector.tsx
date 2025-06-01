import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";
import { RefreshCw, Eye, Database } from "lucide-react";
import { getAllBestPredictions } from "../../services/unifiedApiService";

const ApiDataInspector: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("=== API DATA INSPECTOR ===");
      const result = await getAllBestPredictions();
      console.log("Raw API Response:", result);
      console.log("Response Type:", typeof result);
      console.log("Response Keys:", Object.keys(result || {}));
      
      if (result && typeof result === 'object') {
        Object.entries(result).forEach(([key, value]) => {
          console.log(`Category "${key}":`, value);
          console.log(`Category "${key}" type:`, typeof value);
          console.log(`Category "${key}" is array:`, Array.isArray(value));
          if (Array.isArray(value)) {
            console.log(`Category "${key}" length:`, value.length);
            if (value.length > 0) {
              console.log(`Category "${key}" first item:`, value[0]);
            }
          }
        });
      }
      
      setData(result);
    } catch (err) {
      console.error("API Inspector Error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-clash flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-400" />
            API Data Inspector
          </h2>
          <p className="text-sm text-white/70 font-jakarta">
            Inspect the raw API response structure
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="font-jakarta"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </>
          )}
        </Button>
      </div>

      <Card variant="surface" hover="none">
        <CardHeader>
          <CardTitle size="md" font="clash" className="text-blue-400 flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Raw API Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-400 mb-4" />
              <p className="text-white/70">Loading API data...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">Error: {error}</div>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-lg border border-blue-500/20">
                <h3 className="text-white font-medium mb-2">Data Structure:</h3>
                <div className="text-sm text-white/70 space-y-1">
                  <div>Type: {typeof data}</div>
                  <div>Keys: {Object.keys(data || {}).join(', ')}</div>
                  <div>Total Categories: {Object.keys(data || {}).length}</div>
                </div>
              </div>

              {Object.entries(data || {}).map(([category, predictions]) => (
                <div key={category} className="bg-black/40 p-4 rounded-lg border border-blue-500/20">
                  <h3 className="text-white font-medium mb-2">Category: {category}</h3>
                  <div className="text-sm text-white/70 space-y-1">
                    <div>Type: {typeof predictions}</div>
                    <div>Is Array: {Array.isArray(predictions) ? 'Yes' : 'No'}</div>
                    {Array.isArray(predictions) && (
                      <>
                        <div>Length: {predictions.length}</div>
                        {predictions.length > 0 && (
                          <div className="mt-2">
                            <div className="text-white/50 text-xs">First Item:</div>
                            <pre className="text-xs text-white/60 bg-black/60 p-2 rounded mt-1 overflow-auto max-h-32">
                              {JSON.stringify(predictions[0], null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                    {!Array.isArray(predictions) && (
                      <div className="mt-2">
                        <div className="text-white/50 text-xs">Value:</div>
                        <pre className="text-xs text-white/60 bg-black/60 p-2 rounded mt-1 overflow-auto max-h-32">
                          {JSON.stringify(predictions, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-black/40 p-4 rounded-lg border border-blue-500/20">
                <h3 className="text-white font-medium mb-2">Full Raw Response:</h3>
                <pre className="text-xs text-white/60 bg-black/60 p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDataInspector;
