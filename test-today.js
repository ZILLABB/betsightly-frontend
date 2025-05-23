// Test script to check today's games
console.log('Testing API endpoints for today\'s games...');

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];
console.log('Today\'s date:', today);

// Function to fetch data from an endpoint
async function fetchEndpoint(endpoint) {
  try {
    console.log(`Fetching from ${endpoint}...`);
    const response = await fetch(endpoint);
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return null;
  }
}

// Test the daily predictions endpoint
async function testDailyPredictions() {
  const endpoint = `http://localhost:8000/api/predictions/date/${today}`;
  const data = await fetchEndpoint(endpoint);
  
  if (data) {
    console.log('Daily predictions data structure:', Object.keys(data));
    console.log(`Number of predictions for today: ${data.predictions?.length || 0}`);
    
    if (data.predictions && data.predictions.length > 0) {
      console.log('\nExample predictions:');
      data.predictions.slice(0, 3).forEach((pred, index) => {
        console.log(`\nPrediction ${index + 1}:`);
        console.log('Teams:', pred.fixture ? 
          `${pred.fixture.home_team} vs ${pred.fixture.away_team}` : 
          'No fixture data');
        console.log('Prediction:', pred.prediction_type);
        console.log('Odds:', pred.odds);
        console.log('Confidence:', pred.confidence);
      });
    }
  }
}

// Run the test
async function runTest() {
  console.log('=== Testing Daily Predictions ===');
  await testDailyPredictions();
  console.log('\nTest completed!');
}

runTest();
