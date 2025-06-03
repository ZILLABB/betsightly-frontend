/**
 * Detailed Punters Endpoint Test
 * 
 * This script examines the punters endpoint structure and data
 */

const API_BASE_URL = 'https://betsightly-backend.onrender.com/api';

async function testPuntersEndpoint() {
  console.log('🔍 Detailed Punters Endpoint Analysis');
  console.log('=====================================');
  
  try {
    console.log(`📍 Testing: ${API_BASE_URL}/punters/`);
    
    const response = await fetch(`${API_BASE_URL}/punters/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    
    // Check headers
    console.log('\n📦 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n📊 Response Analysis:');
    console.log(`   Type: ${Array.isArray(data) ? 'Array' : typeof data}`);
    console.log(`   Keys: ${Object.keys(data).join(', ')}`);
    
    // Detailed structure analysis
    if (data.punters && Array.isArray(data.punters)) {
      console.log(`\n👥 Punters Array: ${data.punters.length} punters found`);
      
      if (data.punters.length > 0) {
        console.log('\n🔍 First Punter Structure:');
        const firstPunter = data.punters[0];
        console.log(JSON.stringify(firstPunter, null, 2));
        
        console.log('\n📋 Punter Fields:');
        Object.keys(firstPunter).forEach(key => {
          const value = firstPunter[key];
          const type = typeof value;
          console.log(`   ${key}: ${type} = ${JSON.stringify(value)}`);
        });
      }
      
      // Check pagination info
      if (data.total !== undefined) {
        console.log(`\n📄 Pagination Info:`);
        console.log(`   Total: ${data.total}`);
        console.log(`   Skip: ${data.skip || 0}`);
        console.log(`   Limit: ${data.limit || 'not specified'}`);
        console.log(`   Has More: ${data.has_more || 'not specified'}`);
      }
      
    } else if (Array.isArray(data)) {
      console.log(`\n👥 Direct Array: ${data.length} items`);
      if (data.length > 0) {
        console.log('\n🔍 First Item:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('\n📄 Full Response:');
      console.log(JSON.stringify(data, null, 2));
    }
    
    // Test with pagination parameters
    console.log('\n🔄 Testing with pagination parameters...');
    const paginatedResponse = await fetch(`${API_BASE_URL}/punters/?limit=5&skip=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`✅ Paginated Status: ${paginatedResponse.status}`);
    
    if (paginatedResponse.ok) {
      const paginatedData = await paginatedResponse.json();
      console.log(`📊 Paginated Response Keys: ${Object.keys(paginatedData).join(', ')}`);
      
      if (paginatedData.punters) {
        console.log(`📈 Paginated Punters Count: ${paginatedData.punters.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testPuntersEndpoint();
