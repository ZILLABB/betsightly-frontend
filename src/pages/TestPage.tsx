import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';

const TestPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Loading...');
  const [fixturesData, setFixturesData] = useState<string>('Click to load fixtures');
  const [predictionsData, setPredictionsData] = useState<string>('Click to load predictions');
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState<boolean>(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState<boolean>(false);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Function to check API health
  const checkApiHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const response = await fetch('http://localhost:8002/api/health');
      const data = await response.json();
      setHealthStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setHealthStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  // Function to load fixtures
  const loadFixtures = async () => {
    setIsLoadingFixtures(true);
    try {
      const response = await fetch('http://localhost:8002/api/multi-api/fixtures');
      const data = await response.json();
      setFixturesData(JSON.stringify(data, null, 2));
    } catch (error) {
      setFixturesData(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingFixtures(false);
    }
  };

  // Function to load predictions
  const loadPredictions = async () => {
    setIsLoadingPredictions(true);
    try {
      const response = await fetch('http://localhost:8002/api/multi-api/predictions/daily');
      const data = await response.json();
      setPredictionsData(JSON.stringify(data, null, 2));
    } catch (error) {
      setPredictionsData(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>

      {/* Health Check Section */}
      <div className="mb-8 p-4 bg-[#1A1A27]/80 rounded-xl border border-[#2A2A3C]/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">API Health Check</h2>
          <Button
            onClick={checkApiHealth}
            disabled={isLoadingHealth}
            variant="outline"
          >
            {isLoadingHealth ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
        <pre className="bg-[#121219] p-4 rounded-lg overflow-auto max-h-40">
          {healthStatus}
        </pre>
      </div>

      {/* Fixtures Section */}
      <div className="mb-8 p-4 bg-[#1A1A27]/80 rounded-xl border border-[#2A2A3C]/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Fixtures Data</h2>
          <Button
            onClick={loadFixtures}
            disabled={isLoadingFixtures}
            variant="outline"
          >
            {isLoadingFixtures ? 'Loading...' : 'Load Fixtures'}
          </Button>
        </div>
        <pre className="bg-[#121219] p-4 rounded-lg overflow-auto max-h-60">
          {fixturesData}
        </pre>
      </div>

      {/* Predictions Section */}
      <div className="mb-8 p-4 bg-[#1A1A27]/80 rounded-xl border border-[#2A2A3C]/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Predictions Data</h2>
          <Button
            onClick={loadPredictions}
            disabled={isLoadingPredictions}
            variant="outline"
          >
            {isLoadingPredictions ? 'Loading...' : 'Load Predictions'}
          </Button>
        </div>
        <pre className="bg-[#121219] p-4 rounded-lg overflow-auto max-h-96">
          {predictionsData}
        </pre>
      </div>
    </div>
  );
};

export default TestPage;
