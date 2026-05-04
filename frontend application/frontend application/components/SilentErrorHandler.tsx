import { useEffect } from 'react';

/**
 * SilentErrorHandler - Completely suppresses all backend connection errors
 * This component wraps all fetch and WebSocket errors to provide a seamless
 * demo experience when backend services are not available.
 */
export function SilentErrorHandler() {
  useEffect(() => {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // List of error messages to suppress
    const suppressedMessages = [
      'Could not connect to backend API',
      'Could not connect to vehicle safety API',
      'No backend services available',
      'Failed to fetch',
      'TypeError: Failed to fetch',
      'NetworkError',
      'net::ERR_CONNECTION_REFUSED',
      'ECONNREFUSED'
    ];
    
    // Override console.error to filter out backend connection errors
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      const shouldSuppress = suppressedMessages.some(msg => 
        message.includes(msg)
      );
      
      if (!shouldSuppress) {
        originalError.apply(console, args);
      }
    };
    
    // Override console.warn to filter out backend connection warnings
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      const shouldSuppress = suppressedMessages.some(msg => 
        message.includes(msg)
      );
      
      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };
    
    // Global unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason?.toString() || '';
      const shouldSuppress = suppressedMessages.some(msg => 
        reason.includes(msg)
      );
      
      if (shouldSuppress) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      const shouldSuppress = suppressedMessages.some(msg => 
        message.includes(msg)
      );
      
      if (shouldSuppress) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    // Cleanup on unmount
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return null;
}
