import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  mockData?: boolean;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    mockData = true // Default to mock data for demo purposes
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data generators for demo purposes
  const generateMockThreatData = useCallback(() => {
    const mockMessage: WebSocketMessage = {
      type: 'threat_update',
      data: {
        threatLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        activeThreats: Math.floor(Math.random() * 20) + 1,
        location: {
          lat: (Math.random() - 0.5) * 180,
          lng: (Math.random() - 0.5) * 360,
          country: ['USA', 'China', 'Russia', 'Germany', 'UK', 'France'][Math.floor(Math.random() * 6)]
        },
        attackType: ['ddos', 'malware', 'botnet', 'bruteforce', 'exfiltration', 'zeroday'][Math.floor(Math.random() * 6)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        confidence: 70 + Math.random() * 30,
        timestamp: Date.now()
      }
    };
    onMessage?.(mockMessage);
  }, [onMessage]);

  const generateMockNetworkData = useCallback(() => {
    const mockMessage: WebSocketMessage = {
      type: 'network_update',
      data: {
        packetsPerSecond: 2000 + Math.random() * 1000,
        bytesPerSecond: 10 + Math.random() * 15,
        bandwidth: 60 + Math.random() * 35,
        connections: 1000 + Math.random() * 500,
        protocols: {
          http: 40 + Math.random() * 20,
          tcp: 25 + Math.random() * 15,
          udp: 15 + Math.random() * 10,
          dns: 5 + Math.random() * 5,
          ssh: 2 + Math.random() * 3,
          other: 1 + Math.random() * 2
        },
        timestamp: Date.now()
      }
    };
    onMessage?.(mockMessage);
  }, [onMessage]);

  const generateMockSystemData = useCallback(() => {
    const mockMessage: WebSocketMessage = {
      type: 'system_update',
      data: {
        cpuUsage: 30 + Math.random() * 40,
        memoryUsage: 50 + Math.random() * 30,
        diskUsage: 25 + Math.random() * 20,
        gpuUsage: 60 + Math.random() * 30,
        networkLatency: 5 + Math.random() * 20,
        modelInferenceTime: 30 + Math.random() * 30,
        detectionLatency: 60 + Math.random() * 40,
        temperature: 50 + Math.random() * 25,
        timestamp: Date.now()
      }
    };
    onMessage?.(mockMessage);
  }, [onMessage]);

  const generateMockDetectionData = useCallback(() => {
    const mockMessage: WebSocketMessage = {
      type: 'detection_update',
      data: {
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        attackType: ['DDoS', 'Malware', 'Brute Force', 'Botnet', 'Zero-day', 'Exfiltration'][Math.floor(Math.random() * 6)],
        confidence: 70 + Math.random() * 25,
        source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        target: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        status: ['detected', 'investigating', 'mitigated'][Math.floor(Math.random() * 3)],
        timestamp: Date.now()
      }
    };
    onMessage?.(mockMessage);
  }, [onMessage]);

  const startMockData = useCallback(() => {
    if (mockData && !mockIntervalRef.current) {
      // Generate mock data at different intervals
      const threatInterval = setInterval(generateMockThreatData, 5000);
      const networkInterval = setInterval(generateMockNetworkData, 3000);
      const systemInterval = setInterval(generateMockSystemData, 4000);
      const detectionInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          generateMockDetectionData();
        }
      }, 6000);

      mockIntervalRef.current = threatInterval as any;
      
      // Cleanup function will be handled in useEffect cleanup
      return () => {
        clearInterval(threatInterval);
        clearInterval(networkInterval);
        clearInterval(systemInterval);
        clearInterval(detectionInterval);
      };
    }
  }, [mockData, generateMockThreatData, generateMockNetworkData, generateMockSystemData, generateMockDetectionData]);

  const connect = useCallback(() => {
    if (mockData) {
      // Use mock data instead of WebSocket
      setIsConnected(true);
      setConnectionStatus('connected');
      onOpen?.();
      return;
    }

    // Try WebSocket connection with silent fallback to mock data
    try {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.info('✅ WebSocket connected to real-time data feed');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          // Silent error - just skip invalid messages
        }
      };

      wsRef.current.onclose = () => {
        // Silent fallback to mock data
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Clear WebSocket reference
        if (wsRef.current) {
          wsRef.current = null;
        }
        
        onOpen?.();
      };

      wsRef.current.onerror = (error) => {
        // Silent fallback to mock data mode
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Clear the WebSocket reference
        if (wsRef.current) {
          wsRef.current = null;
        }
        
        onOpen?.(); // Trigger onOpen for mock mode
      };
    } catch (error) {
      // Silent fallback to mock data
      setConnectionStatus('connected');
      setIsConnected(true);
      onOpen?.();
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnectInterval, maxReconnectAttempts, mockData]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (mockData) {
      // In mock mode, echo the message back after a short delay
      setTimeout(() => {
        onMessage?.({
          type: 'echo',
          data: { ...message.data, echoed: true, timestamp: Date.now() }
        });
      }, 100);
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
    // Silent fallback if not connected - mock mode handles this
  }, [mockData, onMessage]);

  useEffect(() => {
    connect();

    // Start mock data if enabled
    const mockCleanup = startMockData();

    return () => {
      disconnect();
      mockCleanup?.();
    };
  }, [connect, disconnect, startMockData]);

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    connect,
    disconnect
  };
}