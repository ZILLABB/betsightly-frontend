# BetSightly Frontend-Backend Integration

This document outlines the approach for integrating the frontend with the backend API in the BetSightly application.

## Architecture Overview

The frontend-backend integration follows a layered approach:

1. **API Service Layer** (`enhancedApiService.ts`): Direct communication with the backend API
2. **Unified Data Service Layer** (`unifiedDataService.ts`): Combines API and mock data with fallback mechanisms
3. **UI Components**: Consume the unified data service

This architecture provides several benefits:
- Graceful degradation when the API is unavailable
- Seamless transition from mock data to real API data
- Consistent error handling across the application
- Improved user experience with appropriate loading and error states

## API Service Layer

The API service layer is responsible for direct communication with the backend API. It provides:

- Robust error handling
- Request retries for transient failures
- Request timeouts
- Consistent error reporting
- Type safety for API responses

### Key Components

- `fetchWithRetry`: Enhanced fetch function with retry logic
- `APIError`: Custom error class for API-specific errors
- Type-safe API endpoint functions

## Unified Data Service Layer

The unified data service layer combines data from the API and mock data sources. It:

- Attempts to fetch data from the API first
- Falls back to cached data if the API request fails
- Falls back to mock data if both API and cache fail
- Provides a consistent interface for all data needs
- Handles caching to improve performance

### Key Components

- `checkApiAvailability`: Checks if the API is available
- Data fetching functions with fallback logic
- Cache management

## Error Handling

The application implements a comprehensive error handling strategy:

1. **Component-Level Error Boundaries**: Catch errors in UI components
2. **Global Error Handler**: Catches unhandled errors and API unavailability
3. **API-Level Error Handling**: Handles API-specific errors
4. **User Feedback**: Provides appropriate error messages and recovery options

### Error Types

- **API Errors**: Issues with the API (timeout, server error, etc.)
- **Data Errors**: Issues with the data format or content
- **UI Errors**: Issues with rendering or user interactions

## Loading States

The application provides consistent loading states:

1. **Initial Loading**: When data is first being fetched
2. **Refresh Loading**: When data is being refreshed
3. **Partial Loading**: When some data is available but more is being fetched

The `DataLoadingIndicator` component provides a consistent UI for these states.

## Data Flow

1. User interacts with a component
2. Component calls the unified data service
3. Unified data service attempts to fetch from the API
4. If API fails, falls back to cache or mock data
5. Component receives data and renders accordingly
6. Error boundaries catch any rendering errors

## Implementation Details

### API Service Configuration

```typescript
// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;
```

### Retry Logic

```typescript
// If we have retries left and it's a 5xx error, retry
if (retries > 0 && response.status >= 500) {
  console.warn(`Retrying ${endpoint} after ${response.status} error. Retries left: ${retries}`);
  return fetchWithRetry<T>(endpoint, options, retries - 1, timeout);
}
```

### Fallback Mechanism

```typescript
try {
  // First try to get data from API if it's available
  if (isApiAvailable) {
    // API call...
  }
} catch (error) {
  // Fall back to mock data
}
```

## Best Practices

1. **Always check API availability** before making requests
2. **Provide meaningful error messages** to users
3. **Implement retry logic** for transient failures
4. **Cache responses** to improve performance
5. **Use type-safe interfaces** for API responses
6. **Handle loading states** consistently
7. **Implement error boundaries** at appropriate levels

## Future Improvements

1. **Offline Support**: Store data for offline use
2. **Sync Mechanism**: Sync local changes when online
3. **Request Queuing**: Queue requests when offline
4. **Optimistic Updates**: Update UI before API confirmation
5. **Real-time Updates**: Implement WebSocket for live data

## API Endpoints

| Endpoint | Description | Status |
|----------|-------------|--------|
| `/health` | Check API health | Implemented |
| `/predictions/daily` | Get daily predictions | Implemented |
| `/predictions/:id` | Get prediction by ID | Planned |
| `/predictions/by-category` | Get predictions by category | Implemented |
| `/rollover/active` | Get active rollover game | Planned |
| `/stats/overview` | Get stats overview | Planned |
| `/punters` | Get all punters | Planned |

## Troubleshooting

### API Unavailable

If the API is unavailable, the application will:
1. Show a banner indicating API unavailability
2. Use cached data if available
3. Fall back to mock data if no cache is available
4. Provide a retry button

### Data Format Issues

If the API returns unexpected data formats:
1. Type checking will catch the issue
2. Error will be logged
3. Fallback to cached or mock data
4. Error will be reported to monitoring system
