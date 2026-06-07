interface User {
  id: string;
  email?: string;
  username?: string;
}

export function initErrorTracking(): void {
  // No-op until Sentry or similar is wired up on the frontend
}

export function setUser(_user: User): void {}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) console.error('Error captured:', error, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (import.meta.env.DEV) console.warn(`[${level}]`, message);
}

export function addBreadcrumb(
  _category: string,
  _message: string,
  _data?: Record<string, unknown>
): void {}

export function errorHandler(error: unknown, component?: string): string {
  let errorMessage = 'An unexpected error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
    captureException(error, { component });
  } else if (typeof error === 'string') {
    errorMessage = error;
    captureMessage(error, 'error');
  } else {
    captureException(new Error('Unknown error type'), {
      component,
      errorType: typeof error,
      errorValue: String(error)
    });
  }

  return errorMessage;
}
