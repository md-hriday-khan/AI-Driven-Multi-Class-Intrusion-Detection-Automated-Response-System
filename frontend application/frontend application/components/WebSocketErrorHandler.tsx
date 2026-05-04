import { useEffect } from 'react';

declare global {
  interface Window {
    checkWebSocketStatus?: () => {
      attempts: number;
      lastFailure: number;
      isHealthy: boolean;
    };
  }
}

export function WebSocketErrorHandler() {
  useEffect(() => {
    // Enhanced global WebSocket error handler with silent fallback
    const originalWebSocket = window.WebSocket;
    
    // Track connection attempts and failures globally
    let globalConnectionAttempts = new Map<string, number>();
    let globalLastFailureTime = new Map<string, number>();
    let hasLoggedDemoMode = false;
    
    window.WebSocket = class extends originalWebSocket {
      private wsUrl: string;
      
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        
        this.wsUrl = url.toString();
        const currentAttempts = globalConnectionAttempts.get(this.wsUrl) || 0;
        globalConnectionAttempts.set(this.wsUrl, currentAttempts + 1);
        
        // Silent error handler - only log once
        this.addEventListener('error', (event) => {
          const timestamp = Date.now();
          globalLastFailureTime.set(this.wsUrl, timestamp);
          
          // Only log demo mode message once
          if (!hasLoggedDemoMode && currentAttempts === 0) {
            console.info('🎭 WebSocket services not available - using simulated real-time data');
            hasLoggedDemoMode = true;
          }
          
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('websocket-fallback', {
            detail: { 
              reason: 'connection_failed', 
              timestamp, 
              url: this.wsUrl,
              attempts: currentAttempts + 1,
              mockMode: true
            }
          }));
          
          // Prevent the error from bubbling up to avoid console spam
          event.stopPropagation();
          event.preventDefault();
        });
        
        this.addEventListener('close', (event) => {
          // Silent fallback - no console warnings
          if (event.code !== 1000) {
            // Dispatch fallback event
            window.dispatchEvent(new CustomEvent('websocket-fallback', {
              detail: { 
                reason: 'connection_closed', 
                code: event.code, 
                timestamp: Date.now(),
                url: this.wsUrl,
                mockMode: true
              }
            }));
          }
        });
        
        this.addEventListener('open', () => {
          console.info(`✅ WebSocket real-time feed connected: ${this.wsUrl}`);
          globalConnectionAttempts.set(this.wsUrl, 0); // Reset on successful connection
          
          // Dispatch success event
          window.dispatchEvent(new CustomEvent('websocket-connected', {
            detail: { 
              timestamp: Date.now(),
              url: this.wsUrl
            }
          }));
        });
      }
    };
    
    // Add global connection status checker
    window.checkWebSocketStatus = () => {
      const totalAttempts = Array.from(globalConnectionAttempts.values()).reduce((sum, attempts) => sum + attempts, 0);
      const lastFailures = Array.from(globalLastFailureTime.values());
      const mostRecentFailure = lastFailures.length > 0 ? Math.max(...lastFailures) : 0;
      
      return {
        attempts: totalAttempts,
        lastFailure: mostRecentFailure,
        isHealthy: totalAttempts < 5 && (Date.now() - mostRecentFailure) > 30000
      };
    };
    
    // Global fetch error handler for backend API - completely silent
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error) {
        const url = args[0];
        if (typeof url === 'string' && (url.includes('localhost:5000') || url.includes('localhost:5001'))) {
          // Completely silent - no console messages at all
          // Just dispatch event for components to handle gracefully
          window.dispatchEvent(new CustomEvent('backend-api-error', {
            detail: { 
              error: 'Service unavailable', 
              timestamp: Date.now(),
              url,
              mockMode: true
            }
          }));
        }
        throw error;
      }
    };
    
    return () => {
      // Restore original implementations on cleanup
      window.WebSocket = originalWebSocket;
      window.fetch = originalFetch;
      delete window.checkWebSocketStatus;
    };
  }, []);
  
  return null;
}