import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Wifi, WifiOff, Activity, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface WebSocketHealth {
  status: 'connected' | 'connecting' | 'disconnected' | 'mock' | 'error';
  lastSeen: Date | null;
  reconnectAttempts: number;
  mockMode: boolean;
  messagesReceived: number;
  uptime: number;
}

export function WebSocketHealthMonitor() {
  const [health, setHealth] = useState<WebSocketHealth>({
    status: 'disconnected',
    lastSeen: null,
    reconnectAttempts: 0,
    mockMode: true,
    messagesReceived: 0,
    uptime: 0
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateHealth = () => {
      // Check if global WebSocket status is available
      if (window.checkWebSocketStatus) {
        const wsStatus = window.checkWebSocketStatus();
        setHealth(prev => ({
          ...prev,
          reconnectAttempts: wsStatus.attempts,
          lastSeen: wsStatus.lastFailure ? new Date(wsStatus.lastFailure) : prev.lastSeen
        }));
      }
    };

    const interval = setInterval(updateHealth, 5000);
    
    // Listen for WebSocket events
    const handleFallback = () => {
      setHealth(prev => ({ ...prev, status: 'mock', mockMode: true }));
    };

    const handleConnected = () => {
      setHealth(prev => ({ ...prev, status: 'connected', mockMode: false, lastSeen: new Date() }));
    };

    window.addEventListener('websocket-fallback', handleFallback);
    window.addEventListener('websocket-connected', handleConnected);

    return () => {
      clearInterval(interval);
      window.removeEventListener('websocket-fallback', handleFallback);
      window.removeEventListener('websocket-connected', handleConnected);
    };
  }, []);

  const getStatusIcon = () => {
    switch (health.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'mock':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const badges = {
      connected: <Badge className="bg-green-100 text-green-800">Connected</Badge>,
      connecting: <Badge className="bg-blue-100 text-blue-800">Connecting...</Badge>,
      mock: <Badge className="bg-yellow-100 text-yellow-800">Mock Data Mode</Badge>,
      error: <Badge className="bg-red-100 text-red-800">Error</Badge>,
      disconnected: <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>
    };
    return badges[health.status] || badges.disconnected;
  };

  const testConnection = async () => {
    setIsRefreshing(true);
    try {
      // Test WebSocket server health
      const response = await fetch('http://localhost:8080/health', { 
        signal: AbortSignal.timeout(5000) 
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ WebSocket server health:', data);
        setHealth(prev => ({ 
          ...prev, 
          status: 'connected', 
          mockMode: false, 
          lastSeen: new Date() 
        }));
      } else {
        console.log('⚠️ WebSocket server returned:', response.status);
        setHealth(prev => ({ ...prev, status: 'error', mockMode: true }));
      }
    } catch (error) {
      console.log('❌ WebSocket server not available, using mock mode');
      console.log('💡 To start WebSocket server: cd websocket-server && node server.js');
      setHealth(prev => ({ ...prev, status: 'mock', mockMode: true }));
    }
    
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <Card className="bg-white border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wifi className="h-4 w-4" />
          WebSocket Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Status</span>
          </div>
          {getStatusBadge()}
        </div>

        {health.mockMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Running in mock data mode - real-time simulation active
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Reconnect Attempts:</span>
            <div className="font-medium">{health.reconnectAttempts}</div>
          </div>
          <div>
            <span className="text-gray-500">Last Seen:</span>
            <div className="font-medium">
              {health.lastSeen ? health.lastSeen.toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>

        <Button 
          onClick={testConnection}
          disabled={isRefreshing}
          size="sm"
          className="w-full"
          variant="outline"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Test Connection
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}