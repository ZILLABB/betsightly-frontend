import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { captureException } from '../../utils/errorTracking';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error tracking service
    captureException(error, {
      componentStack: errorInfo.componentStack,
      component: this.constructor.name
    });

    // Show error notification to user
    console.error('An error occurred in the application:', error);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function' && this.state.error) {
          return (this.props.fallback as (error: Error, resetError: () => void) => ReactNode)(this.state.error, this.resetErrorBoundary);
        }
        return this.props.fallback as ReactNode;
      }

      // Default fallback UI
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center my-4">
          <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
          <h2 className="text-lg font-semibold mb-2 text-red-500">Something went wrong</h2>
          <p className="text-sm text-[#A1A1AA] mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {this.state.error && (
            <div className="text-xs text-[#A1A1AA] mb-4 p-2 bg-[#1A1A27] rounded-md max-w-md mx-auto overflow-auto text-left">
              <pre>{this.state.error.message}</pre>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={this.resetErrorBoundary}
            className="mx-auto"
          >
            <RefreshCw size={14} className="mr-1" />
            Try Again
          </Button>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

/**
 * TrackedErrorBoundary component that integrates with our error tracking system
 */
export class TrackedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  handleError = (error: Error, errorInfo: ErrorInfo): void => {
    // Send the error to our tracking system
    captureException(error, {
      componentStack: errorInfo.componentStack,
      component: 'TrackedErrorBoundary'
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  };

  render(): ReactNode {
    return (
      <ErrorBoundary
        onError={this.handleError}
        fallback={this.props.fallback}
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

export default ErrorBoundary;







