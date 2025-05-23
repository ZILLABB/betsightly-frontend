/**
 * Test script to examine the prediction API endpoints
 * 
 * This script makes requests to each prediction endpoint and logs the response
 * to help understand the data structure returned by each endpoint.
 */

// Base URL for the API
const API_BASE_URL = 'http://localhost:8000/api';

// Function to make a request to an endpoint and log the response
async function testEndpoint(endpoint, description) {
  console.log(`\n=== Testing ${description} ===`);
  console.log(`Endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Log additional information about the response
    if (Array.isArray(data)) {
      console.log(`Array response with ${data.length} items`);
      if (data.length > 0) {
        console.log('First item sample:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    } else if (typeof data === 'object' && data !== null) {
      console.log('Object response with keys:');
      console.log(Object.keys(data));
      
      // If it's a categories object, show more details
      if (endpoint.includes('categories')) {
        for (const [category, predictions] of Object.entries(data)) {
          console.log(`Category: ${category}, Count: ${Array.isArray(predictions) ? predictions.length : 'N/A'}`);
          if (Array.isArray(predictions) && predictions.length > 0) {
            console.log(`Sample prediction for ${category}:`);
            console.log(JSON.stringify(predictions[0], null, 2));
          }
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error testing ${description}:`, error);
    return null;
  }
}

// Main function to test all endpoints
async function testAllEndpoints() {
  console.log('TESTING PREDICTION API ENDPOINTS\n');
  
  // 1. Test categories endpoint
  await testEndpoint('/predictions/categories', 'Categories Endpoint');
  
  // 2. Test category-specific endpoint
  await testEndpoint('/predictions/category/2_odds', 'Category-Specific Endpoint (2_odds)');
  
  // 3. Test best predictions endpoint
  await testEndpoint('/predictions/best', 'Best Predictions Endpoint');
  
  // 4. Test best predictions for a specific category
  await testEndpoint('/predictions/best/2_odds', 'Best Predictions for Category (2_odds)');
  
  console.log('\nEndpoint testing complete!');
}

// Run the tests
testAllEndpoints();
