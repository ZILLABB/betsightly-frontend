import React, { lazy, Suspense, type ReactNode } from 'react';
import LoadingFallback from '../components/common/LoadingFallback';

interface LazyLoadOptions {
  fallback?: ReactNode;
  errorBoundary?: boolean;
  loadingMessage?: string;
}

/**
 * Custom error boundary component for lazy loaded components
 */
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error in lazy loaded component:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
          <h3 className="text-red-500 font-medium mb-2">Something went wrong</h3>
          <p className="text-sm text-[#A1A1AA]">
            {this.state.error?.message || 'An error occurred while loading this component.'}
          </p>
          <button
            className="mt-3 px-3 py-1 bg-red-500/20 text-red-500 rounded-md text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
            aria-label="Try loading the component again"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy load a component with suspense and optional error boundary
 * @param factory Function that returns a dynamic import
 * @param options Options for lazy loading
 * @returns Lazy loaded component
 */
export function lazyLoad<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  // Use React.lazy with proper typing
  const LazyComponent = lazy(factory);
  const {
    fallback = <LoadingFallback message={options.loadingMessage} />,
    errorBoundary = true
  } = options;

  // Use React.memo to prevent unnecessary re-renders
  return React.memo(function LazyLoadedComponent(props: any) {
    const Component = () => (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );

    return errorBoundary ? (
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    ) : (
      <Component />
    );
  });
}

export default lazyLoad;












