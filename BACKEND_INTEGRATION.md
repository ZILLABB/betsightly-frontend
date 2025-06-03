# BetSightly Frontend-Backend Integration

This document outlines the complete integration between the BetSightly frontend and backend.

## 🚀 Quick Start

### Development Setup
1. Ensure backend is running on `http://localhost:8000`
2. Update `.env` file with correct API URL
3. Run integration test: `node test-backend-integration.js`
4. Start frontend: `npm run dev`

### Production Setup
1. Update `.env.production` with your Render app URL
2. Deploy frontend with production environment variables

## 📡 API Endpoints

### Core Endpoints
- **Health Check**: `GET /api/health/`
- **Prediction Categories**: `GET /api/predictions/categories/` (Main data source)
- **Best Predictions**: `GET /api/predictions/best/` (Main page)
- **Betting Codes**: `GET /api/betting-codes/`
- **Punters**: `GET /api/punters/`
- **Bookmakers**: `GET /api/bookmakers/`

### Data Flow
```
Frontend Components
       ↓
Unified API Service (unifiedApiService.ts)
       ↓
Backend API (BetSightly)
       ↓
ML Models / Database
```

## 🔧 Configuration

### Environment Variables
```bash
# Development
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_CACHE_DURATION=3600000

# Production
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
```

### API Configuration
- **Timeout**: 30 seconds (for ML predictions)
- **Cache**: Respects backend cache headers
- **Error Handling**: Comprehensive error types
- **Rate Limiting**: 1000 requests/hour

## 📊 Data Structures

### Prediction Response
```typescript
interface PredictionCategoriesResponse {
  "2_odds": Prediction[];
  "5_odds": Prediction[];
  "10_odds": Prediction[];
  "rollover": Prediction[];
  service_used?: ServiceUsed;
  timestamp?: string;
}
```

### Betting Code Response
```typescript
interface BettingCodesResponse {
  betting_codes: BettingCode[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}
```

## 🎯 Key Features

### Cache Management
- **Predictions**: 1 hour cache (backend controlled)
- **Betting Codes**: 5 minutes cache
- **Static Data**: 30-60 minutes cache
- **Force Refresh**: Available for development

### Error Handling
- **404**: Endpoint not found
- **429**: Rate limit exceeded
- **500**: Server error
- **502**: External API error
- **503**: ML models unavailable

### Service Detection
The backend returns a `service_used` field indicating data source:
- `cached_predictions`: From cache
- `advanced_ml_service`: Real-time ML
- `basic_prediction_service`: Fallback service
- `fallback_mock_data`: Emergency fallback

## 🔄 Migration Changes

### Updated Files
1. **Environment**: `.env`, `.env.production`
2. **Configuration**: `src/config/apiConfig.ts`
3. **Types**: `src/types.ts`
4. **API Service**: `src/services/unifiedApiService.ts`
5. **Betting Codes**: `src/services/bettingCodeService.ts`

### Breaking Changes
- API endpoints now require trailing slashes
- Prediction data structure updated to match backend
- BettingCode interface updated
- Cache configuration changed

## 🧪 Testing

### Integration Test
```bash
node test-backend-integration.js
```

### Manual Testing
1. Check health endpoint: `curl http://localhost:8000/api/health/`
2. Test predictions: `curl http://localhost:8000/api/predictions/categories/`
3. Test betting codes: `curl http://localhost:8000/api/betting-codes/`

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Backend must allow frontend origin
2. **Timeout Errors**: ML predictions can take 5-10 seconds
3. **503 Errors**: ML models may be unavailable
4. **Cache Issues**: Use force refresh for development

### Debug Steps
1. Check backend health: `/api/health/`
2. Verify CORS configuration
3. Check network tab for request details
4. Review console logs for detailed errors

## 📈 Performance

### Optimization
- Cache headers respected
- Timeout handling for ML predictions
- Retry logic for failed requests
- Loading states for slow endpoints

### Monitoring
- Service status via `service_used` field
- Cache hit/miss via headers
- Response times logged
- Error rates tracked

## 🔮 Future Enhancements

### Planned Features
- Real-time updates via WebSocket
- Advanced filtering for predictions
- User authentication integration
- Enhanced error recovery

### API Evolution
- Additional prediction categories
- More detailed ML model information
- Enhanced betting code features
- Advanced analytics endpoints
