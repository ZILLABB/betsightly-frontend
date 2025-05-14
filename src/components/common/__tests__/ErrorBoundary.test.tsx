import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary, { TrackedErrorBoundary } from '../ErrorBoundary';
import { errorHandler } from '../../../utils/errorTracking';

// Mock the error handler
jest.mock('../../../utils/errorTracking', () => ({
  errorHandler: {
    trackError: jest.fn(),
    showErrorToUser: jest.fn()
  },
  ErrorSeverity: {
    ERROR: 'error'
  }
}));

// Component that throws an error
const ErrorComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders fallback UI when there is an error', () => {
    // We need to mock the console.error to prevent the test output from being cluttered
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom fallback</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('calls onError when there is an error', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('resets error state when reset button is clicked', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <ErrorComponent shouldThrow={true} />
          ) : (
            <div>Error resolved</div>
          )}
          <button onClick={() => setShouldThrow(false)}>Fix error</button>
        </ErrorBoundary>
      );
    };
    
    render(<TestComponent />);
    
    // First we see the error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Click the reset button
    await user.click(screen.getByText('Try Again'));
    
    // Now we should see the fixed component
    expect(screen.getByText('Error resolved')).toBeInTheDocument();
  });
});

describe('TrackedErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks errors with the error handler', () => {
    render(
      <TrackedErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </TrackedErrorBoundary>
    );

    expect(errorHandler.trackError).toHaveBeenCalled();
  });

  it('calls onError when provided', () => {
    const onError = jest.fn();
    
    render(
      <TrackedErrorBoundary onError={onError}>
        <ErrorComponent shouldThrow={true} />
      </TrackedErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });
});
