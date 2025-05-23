// Simple test script to check the API endpoints
console.log('Testing API endpoints for new games...');

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

// Test the categories endpoint
async function testCategoriesEndpoint() {
  const endpoint = 'http://localhost:8000/api/predictions/categories';
  const data = await fetchEndpoint(endpoint);
  
  if (data) {
    console.log('Categories available:', Object.keys(data.categories || {}));
    
    // Check each category
    if (data.categories) {
      for (const [category, categoryData] of Object.entries(data.categories)) {
        console.log(`\nCategory: ${category}`);
        
        if (category === 'rollover' && categoryData.days) {
          console.log(`Days in rollover: ${categoryData.days.length}`);
          
          // Log the first day as an example
          if (categoryData.days.length > 0) {
            const firstDay = categoryData.days[0];
            console.log(`Day ${firstDay.day} has ${firstDay.predictions?.length || 0} predictions`);
            
            // Log the first prediction of the first day as an example
            if (firstDay.predictions && firstDay.predictions.length > 0) {
              const firstPred = firstDay.predictions[0];
              console.log('Example prediction:', {
                teams: `${firstPred.home_team} vs ${firstPred.away_team}`,
                prediction: firstPred.prediction_text,
                odds: firstPred.odds,
                confidence: firstPred.confidence
              });
            }
          }
        } else if (Array.isArray(categoryData)) {
          console.log(`Predictions in ${category}: ${categoryData.length}`);
          
          // Log the first prediction as an example
          if (categoryData.length > 0) {
            const firstPred = categoryData[0];
            console.log('Example prediction:', {
              teams: firstPred.fixture ? 
                `${firstPred.fixture.home_team} vs ${firstPred.fixture.away_team}` : 
                'No fixture data',
              prediction: firstPred.prediction_type,
              odds: firstPred.odds,
              confidence: firstPred.confidence
            });
          }
        }
      }
    }
  }
}

// Test the best predictions endpoint
async function testBestPredictionsEndpoint() {
  const endpoint = 'http://localhost:8000/api/predictions/best';
  const data = await fetchEndpoint(endpoint);
  
  if (data) {
    console.log('\nBest predictions categories:', Object.keys(data));
    
    // Check each category
    for (const [category, predictions] of Object.entries(data)) {
      console.log(`\nCategory: ${category}`);
      console.log(`Predictions: ${predictions.length}`);
      
      // Log the first prediction as an example
      if (predictions.length > 0) {
        const firstPred = predictions[0];
        console.log('Example prediction:', {
          teams: firstPred.fixture ? 
            `${firstPred.fixture.home_team} vs ${firstPred.fixture.away_team}` : 
            'No fixture data',
          prediction: firstPred.prediction_type,
          odds: firstPred.odds,
          confidence: firstPred.confidence
        });
      }
    }
  }
}

// Run the tests
async function runTests() {
  console.log('=== Testing Categories Endpoint ===');
  await testCategoriesEndpoint();
  
  console.log('\n=== Testing Best Predictions Endpoint ===');
  await testBestPredictionsEndpoint();
  
  console.log('\nTests completed!');
}

runTests();
