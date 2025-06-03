/**
 * Detailed Predictions Endpoint Test
 * 
 * This script examines the predictions endpoint structure and data
 */

const API_BASE_URL = 'https://betsightly-backend.onrender.com/api';

async function testPredictionsEndpoint() {
  console.log('🔍 Detailed Predictions Endpoint Analysis');
  console.log('=========================================');
  
  try {
    console.log(`📍 Testing: ${API_BASE_URL}/predictions/categories/`);
    
    const response = await fetch(`${API_BASE_URL}/predictions/categories/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    
    // Check headers
    console.log('\n📦 Response Headers:');
    const cacheControl = response.headers.get('cache-control');
    const cacheStatus = response.headers.get('x-cache-status');
    const serviceUsed = response.headers.get('x-service-used');
    
    if (cacheControl) console.log(`   Cache-Control: ${cacheControl}`);
    if (cacheStatus) console.log(`   X-Cache-Status: ${cacheStatus}`);
    if (serviceUsed) console.log(`   X-Service-Used: ${serviceUsed}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n📊 Response Analysis:');
    console.log(`   Type: ${Array.isArray(data) ? 'Array' : typeof data}`);
    console.log(`   Keys: ${Object.keys(data).join(', ')}`);
    
    // Check for service_used field
    if (data.service_used) {
      console.log(`🤖 Service Used: ${data.service_used}`);
    }
    
    // Analyze each category
    const categories = ['2_odds', '5_odds', '10_odds', 'rollover'];
    
    categories.forEach(category => {
      if (data[category]) {
        console.log(`\n🎯 ${category.toUpperCase()} Category:`);
        console.log(`   Count: ${data[category].length} predictions`);
        
        if (data[category].length > 0) {
          const firstPrediction = data[category][0];
          console.log(`   First Prediction Structure:`);
          console.log(`   Keys: ${Object.keys(firstPrediction).join(', ')}`);
          
          // Show key fields
          if (firstPrediction.fixture) {
            console.log(`   Match: ${firstPrediction.fixture.home_team} vs ${firstPrediction.fixture.away_team}`);
            console.log(`   League: ${firstPrediction.fixture.league}`);
            console.log(`   Date: ${firstPrediction.fixture.match_datetime}`);
          }
          
          if (firstPrediction.prediction) {
            console.log(`   Prediction: ${firstPrediction.prediction}`);
          }
          
          if (firstPrediction.odds) {
            console.log(`   Odds: ${firstPrediction.odds}`);
          }
          
          if (firstPrediction.confidence) {
            console.log(`   Confidence: ${firstPrediction.confidence}%`);
          }
          
          // Show full structure for first prediction
          if (category === '2_odds') {
            console.log(`\n📋 Full First Prediction (${category}):`);
            console.log(JSON.stringify(firstPrediction, null, 2));
          }
        }
      }
    });
    
    // Test best predictions endpoint
    console.log('\n🏆 Testing Best Predictions Endpoint...');
    const bestResponse = await fetch(`${API_BASE_URL}/predictions/best/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`✅ Best Predictions Status: ${bestResponse.status}`);
    
    if (bestResponse.ok) {
      const bestData = await bestResponse.json();
      console.log(`📊 Best Predictions Keys: ${Object.keys(bestData).join(', ')}`);
      
      categories.forEach(category => {
        if (bestData[category]) {
          console.log(`   ${category}: ${bestData[category].length} predictions`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testPredictionsEndpoint();
