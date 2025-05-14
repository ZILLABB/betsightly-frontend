import {
  errorHandler,
  ErrorSeverity,
  createAsyncErrorHandler
} from '../errorTracking';

describe('errorTracking', () => {
  // Save original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  beforeEach(() => {
    // Mock console methods
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  });

  afterAll(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  });

  describe('errorHandler', () => {
    it('tracks errors with context', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };
      
      errorHandler.trackError(error, context);
      
      // Check that error was logged
      expect(console.error).toHaveBeenCalled();
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('Error tracked:');
      expect((console.error as jest.Mock).mock.calls[0][1]).toBe(error);
      expect((console.error as jest.Mock).mock.calls[0][2]).toBe(context);
    });

    it('logs errors with different severity levels', () => {
      errorHandler.logError('Info message', ErrorSeverity.INFO);
      errorHandler.logError('Warning message', ErrorSeverity.WARNING);
      errorHandler.logError('Error message', ErrorSeverity.ERROR);
      errorHandler.logError('Critical message', ErrorSeverity.CRITICAL);
      
      // Check that messages were logged with appropriate methods
      expect(console.info).toHaveBeenCalled();
      expect((console.info as jest.Mock).mock.calls[0][0]).toContain('INFO');
      expect((console.info as jest.Mock).mock.calls[0][0]).toContain('Info message');
      
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain('WARNING');
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain('Warning message');
      
      expect(console.error).toHaveBeenCalledTimes(2); // Error and Critical both use console.error
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('ERROR');
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('Error message');
      expect((console.error as jest.Mock).mock.calls[1][0]).toContain('CRITICAL');
      expect((console.error as jest.Mock).mock.calls[1][0]).toContain('Critical message');
    });

    it('handles API errors', () => {
      // Test with Error object
      const error1 = new Error('API error');
      const result1 = errorHandler.handleApiError(error1);
      expect(result1).toBe(error1);
      
      // Test with string
      const result2 = errorHandler.handleApiError('String error');
      expect(result2.message).toBe('String error');
      
      // Test with object containing message
      const result3 = errorHandler.handleApiError({ message: 'Object error' });
      expect(result3.message).toBe('Object error');
      
      // Test with object containing error
      const result4 = errorHandler.handleApiError({ error: 'Error field' });
      expect(result4.message).toBe('Error field');
      
      // Test with HTTP error response
      const result5 = errorHandler.handleApiError({ status: 404, statusText: 'Not Found' });
      expect(result5.message).toBe('HTTP Error: 404 Not Found');
      
      // Test with unknown error
      const result6 = errorHandler.handleApiError({});
      expect(result6.message).toBe('An unknown error occurred');
    });

    it('shows errors to the user', () => {
      errorHandler.showErrorToUser('User-facing error');
      
      // Check that error was logged
      expect(console.error).toHaveBeenCalled();
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('[USER NOTIFICATION]');
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('User-facing error');
    });
  });

  describe('createAsyncErrorHandler', () => {
    it('wraps async functions and handles errors', async () => {
      // Mock successful function
      const successFn = jest.fn().mockResolvedValue('success');
      const wrappedSuccess = createAsyncErrorHandler(successFn);
      
      // Call wrapped function
      const result = await wrappedSuccess('arg1', 'arg2');
      
      // Check that original function was called with arguments
      expect(successFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('success');
      
      // Mock error function
      const errorFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const mockErrorHandler = { trackError: jest.fn() };
      const wrappedError = createAsyncErrorHandler(errorFn, mockErrorHandler.trackError);
      
      // Call wrapped function and expect it to throw
      await expect(wrappedError('arg1', 'arg2')).rejects.toThrow('Async error');
      
      // Check that error was tracked
      expect(mockErrorHandler.trackError).toHaveBeenCalled();
      expect(mockErrorHandler.trackError.mock.calls[0][0].message).toBe('Async error');
      expect(mockErrorHandler.trackError.mock.calls[0][1]).toEqual({ args: ['arg1', 'arg2'] });
    });

    it('handles non-Error rejections', async () => {
      // Mock function that rejects with a string
      const stringRejectFn = jest.fn().mockRejectedValue('String rejection');
      const mockErrorHandler = { trackError: jest.fn() };
      const wrappedFn = createAsyncErrorHandler(stringRejectFn, mockErrorHandler.trackError);
      
      // Call wrapped function and expect it to throw
      await expect(wrappedFn()).rejects.toThrow('String rejection');
      
      // Check that error was tracked with standardized Error object
      expect(mockErrorHandler.trackError).toHaveBeenCalled();
      expect(mockErrorHandler.trackError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockErrorHandler.trackError.mock.calls[0][0].message).toBe('String rejection');
    });
  });
});
