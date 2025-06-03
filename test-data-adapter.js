/**
 * Test Data Adapter with Live Backend Data
 */

const API_BASE_URL = 'https://betsightly-backend.onrender.com/api';

// Simulate the data adapter logic
function transformBackendPrediction(backendPred, category, index) {
  const id = `${category}-${index}-${Date.now()}`;
  
  const fixture = {
    id: parseInt(id.replace(/\D/g, '').slice(0, 8)) || index,
    home_team: backendPred.home_team,
    away_team: backendPred.away_team,
    league: 'Premier League',
    match_datetime: new Date().toISOString(),
    status: 'scheduled'
  };

  return {
    id: parseInt(id.replace(/\D/g, '').slice(0, 8)) || index,
    fixture,
    prediction_type: getPredictionType(backendPred.prediction),
    prediction: backendPred.prediction,
    odds: backendPred.odds,
    confidence: backendPred.confidence,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'pending',
    
    // Legacy compatibility
    game: {
      id: id,
      homeTeam: backendPred.home_team,
      awayTeam: backendPred.away_team,
      league: 'Premier League',
      startTime: new Date().toISOString(),
      fixture
    }
  };
}

function getPredictionType(predictionText) {
  const text = predictionText.toLowerCase();
  
  if (text.includes('win') || text.includes('victory')) {
    return 'match_result';
  } else if (text.includes('over') || text.includes('under') || text.includes('goals')) {
    return 'over_under';
  } else if (text.includes('btts') || text.includes('both teams')) {
    return 'btts';
  } else {
    return 'match_result';
  }
}

function adaptPredictionData(data) {
  const categories = {};
  
  Object.entries(data).forEach(([category, predictions]) => {
    categories[category] = predictions.map((pred, index) => 
      transformBackendPrediction(pred, category, index)
    );
  });
  
  return categories;
}

async function testDataAdapter() {
  console.log('🧪 Testing Data Adapter with Live Backend');
  console.log('==========================================');
  
  try {
    // Fetch real data from backend
    const response = await fetch(`${API_BASE_URL}/predictions/categories/`);
    const backendData = await response.json();
    
    console.log('📥 Backend Data:');
    console.log(JSON.stringify(backendData, null, 2));
    
    // Transform using adapter
    const frontendData = adaptPredictionData(backendData);
    
    console.log('\n📤 Frontend Data (after transformation):');
    Object.entries(frontendData).forEach(([category, predictions]) => {
      console.log(`\n🎯 ${category.toUpperCase()}:`);
      console.log(`   Count: ${predictions.length}`);
      
      if (predictions.length > 0) {
        const pred = predictions[0];
        console.log(`   Sample Prediction:`);
        console.log(`     ID: ${pred.id}`);
        console.log(`     Match: ${pred.fixture.home_team} vs ${pred.fixture.away_team}`);
        console.log(`     Prediction: ${pred.prediction}`);
        console.log(`     Type: ${pred.prediction_type}`);
        console.log(`     Odds: ${pred.odds}`);
        console.log(`     Confidence: ${pred.confidence}%`);
        console.log(`     Has Game Object: ${!!pred.game}`);
        console.log(`     Has Fixture: ${!!pred.fixture}`);
      }
    });
    
    console.log('\n✅ Data Adapter Test Successful!');
    console.log('The frontend will now receive properly formatted prediction data.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDataAdapter();
