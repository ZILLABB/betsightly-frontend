/**
 * BetSightly Backend Integration Test
 *
 * This script tests all the main API endpoints to ensure proper integration
 * with the BetSightly backend.
 */

// Configuration
const API_BASE_URL = "https://betsightly-backend.onrender.com/api";
const TIMEOUT = 30000; // 30 seconds

// Test endpoints
const ENDPOINTS = {
  HEALTH: "/health/",
  PREDICTIONS_CATEGORIES: "/predictions/categories/",
  PREDICTIONS_BEST: "/predictions/best/",
  BETTING_CODES: "/betting-codes/",
  PUNTERS: "/punters/",
  BOOKMAKERS: "/bookmakers/",
};

// Utility function to make API requests
async function testEndpoint(endpoint, description) {
  console.log(`\n🧪 Testing ${description}`);
  console.log(`📍 Endpoint: ${API_BASE_URL}${endpoint}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`✅ Status: ${response.status} ${response.statusText}`);

    // Check cache headers
    const cacheControl = response.headers.get("cache-control");
    const cacheStatus = response.headers.get("x-cache-status");
    if (cacheControl) console.log(`📦 Cache-Control: ${cacheControl}`);
    if (cacheStatus) console.log(`🎯 Cache Status: ${cacheStatus}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Log response structure
    console.log(
      `📊 Response type: ${Array.isArray(data) ? "Array" : typeof data}`
    );

    if (Array.isArray(data)) {
      console.log(`📈 Array length: ${data.length}`);
      if (data.length > 0) {
        console.log(`🔍 First item keys: ${Object.keys(data[0]).join(", ")}`);
      }
    } else if (typeof data === "object" && data !== null) {
      console.log(`🔍 Object keys: ${Object.keys(data).join(", ")}`);

      // Check for service_used field (indicates backend ML service status)
      if (data.service_used) {
        console.log(`🤖 Service used: ${data.service_used}`);
      }

      // Check for prediction categories
      if (
        data["2_odds"] ||
        data["5_odds"] ||
        data["10_odds"] ||
        data["rollover"]
      ) {
        console.log(`🎯 Prediction categories found:`);
        if (data["2_odds"])
          console.log(`   - 2_odds: ${data["2_odds"].length} predictions`);
        if (data["5_odds"])
          console.log(`   - 5_odds: ${data["5_odds"].length} predictions`);
        if (data["10_odds"])
          console.log(`   - 10_odds: ${data["10_odds"].length} predictions`);
        if (data["rollover"])
          console.log(`   - rollover: ${data["rollover"].length} predictions`);
      }

      // Check for betting codes
      if (data.betting_codes) {
        console.log(`🎫 Betting codes: ${data.betting_codes.length} codes`);
        console.log(
          `📊 Total: ${data.total}, Skip: ${data.skip}, Limit: ${data.limit}`
        );
      }

      // Check for health status
      if (data.status) {
        console.log(`💚 Health status: ${data.status}`);
        if (data.services) {
          console.log(`🔧 Services: ${JSON.stringify(data.services)}`);
        }
      }
    }

    return { success: true, data, status: response.status };
  } catch (error) {
    if (error.name === "AbortError") {
      console.log(`⏰ Request timed out after ${TIMEOUT}ms`);
    } else if (error.message.includes("Failed to fetch")) {
      console.log(`🚫 Network error: Cannot connect to backend`);
      console.log(`   Make sure backend is running on port 8000`);
      console.log(`   Check CORS configuration for frontend origin`);
    } else {
      console.log(`❌ Error: ${error.message}`);
    }

    return { success: false, error: error.message };
  }
}

// Main test function
async function runIntegrationTests() {
  console.log("🚀 BetSightly Backend Integration Test");
  console.log("=====================================");
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  console.log(`⏱️  Timeout: ${TIMEOUT}ms`);

  const results = {};

  // Test health endpoint first
  results.health = await testEndpoint(ENDPOINTS.HEALTH, "Health Check");

  // Test predictions endpoints
  results.categories = await testEndpoint(
    ENDPOINTS.PREDICTIONS_CATEGORIES,
    "Prediction Categories"
  );
  results.best = await testEndpoint(
    ENDPOINTS.PREDICTIONS_BEST,
    "Best Predictions"
  );

  // Test betting codes
  results.bettingCodes = await testEndpoint(
    ENDPOINTS.BETTING_CODES,
    "Betting Codes"
  );

  // Test punters and bookmakers
  results.punters = await testEndpoint(ENDPOINTS.PUNTERS, "Punters");
  results.bookmakers = await testEndpoint(ENDPOINTS.BOOKMAKERS, "Bookmakers");

  // Summary
  console.log("\n📋 Test Summary");
  console.log("===============");

  const successful = Object.values(results).filter((r) => r.success).length;
  const total = Object.keys(results).length;

  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  if (successful === total) {
    console.log(
      "\n🎉 All tests passed! Backend integration is working correctly."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Check the errors above.");
  }

  // Recommendations
  console.log("\n💡 Integration Recommendations:");
  console.log("- Use /predictions/categories/ as the main data source");
  console.log("- Use /predictions/best/ for the main page");
  console.log("- Use /betting-codes/latest/ for punter information");
  console.log("- Respect cache headers for optimal performance");
  console.log("- Handle service_used field to understand data source");
  console.log(
    "- Implement proper error handling for 503 errors (ML models down)"
  );

  return results;
}

// Run the tests
runIntegrationTests().catch(console.error);
