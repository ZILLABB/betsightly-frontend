/**
 * Test Betting Codes Error - Debug the 500 error
 */

const API_BASE_URL = 'https://betsightly-backend.onrender.com/api';

async function testBettingCodesError() {
  console.log('🔍 Debugging Betting Codes 500 Error');
  console.log('====================================');
  
  const endpoints = [
    '/betting-codes/',
    '/betting-codes/latest/',
    '/betting-codes/?limit=10&skip=0'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${API_BASE_URL}${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Try to get error details
        const errorText = await response.text();
        console.log(`Error Response Body: ${errorText}`);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.log('Error JSON:', JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.log('Error response is not JSON');
        }
      } else {
        const data = await response.json();
        console.log('Success Response:', JSON.stringify(data, null, 2));
      }
      
    } catch (error) {
      console.log(`Network Error: ${error.message}`);
    }
  }
  
  // Test if the issue is database-related by checking other endpoints
  console.log('\n🔍 Testing Related Endpoints:');
  
  const relatedEndpoints = [
    '/punters/',
    '/bookmakers/',
    '/health/'
  ];
  
  for (const endpoint of relatedEndpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      console.log(`${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${endpoint}: Network Error ❌`);
    }
  }
}

testBettingCodesError();
