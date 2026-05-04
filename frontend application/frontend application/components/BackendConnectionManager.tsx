import React, { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Server, 
  Wifi, 
  Car, 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Globe,
  Database,
  Zap
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'checking' | 'error';
  lastCheck: Date | null;
  responseTime: number | null;
  error?: string;
  icon: React.ComponentType<any>;
}

interface BackendConnectionState {
  services: ServiceStatus[];
  isConnected: boolean;
  lastUpdate: Date | null;
  autoRetry: boolean;
}

const BackendContext = createContext<{
  state: BackendConnectionState;
  checkAllServices: () => Promise<void>;
  toggleAutoRetry: () => void;
  retryService: (serviceName: string) => Promise<void>;
}>({
  state: {
    services: [],
    isConnected: false,
    lastUpdate: null,
    autoRetry: true
  },
  checkAllServices: async () => {},
  toggleAutoRetry: () => {},
  retryService: async () => {}
});

export const useBackendConnection = () => useContext(BackendContext);

const BACKEND_SERVICES: Omit<ServiceStatus, 'status' | 'lastCheck' | 'responseTime'>[] = [
  {
    name: 'Backend API',
    url: 'http://localhost:5000/api/health',
    icon: Server,
    error: undefined
  },
  {
    name: 'Vehicle Safety API',
    url: 'http://localhost:5001/api/health',
    icon: Car,
    error: undefined
  },
  {
    name: 'WebSocket Server',
    url: 'http://localhost:8080/health',
    icon: Wifi,
    error: undefined
  },
  {
    name: 'Enhanced IDS',
    url: 'http://localhost:8081/health',
    icon: Activity,
    error: undefined
  }
];

async function checkServiceHealth(service: ServiceStatus): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced to 2s
    
    const response = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        ...service,
        status: 'online',
        lastCheck: new Date(),
        responseTime,
        error: undefined
      };
    } else {
      return {
        ...service,
        status: 'error',
        lastCheck: new Date(),
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = 'Service unavailable (using mock data)';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Service unavailable (using mock data)';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Service unavailable (using mock data)';
      } else {
        errorMessage = 'Service unavailable (using mock data)';
      }
    }
    
    // Don't log errors - this is expected in demo mode
    return {
      ...service,
      status: 'offline',
      lastCheck: new Date(),
      responseTime,
      error: errorMessage
    };
  }
}

export function BackendConnectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BackendConnectionState>({
    services: BACKEND_SERVICES.map(service => ({
      ...service,
      status: 'checking',
      lastCheck: null,
      responseTime: null
    })),
    isConnected: false,
    lastUpdate: null,
    autoRetry: false // Disabled by default to prevent console spam in demo mode
  });

  const checkAllServices = async () => {
    setState(prev => ({
      ...prev,
      services: prev.services.map(service => ({ ...service, status: 'checking' }))
    }));

    const results = await Promise.all(
      state.services.map(service => checkServiceHealth(service))
    );

    const onlineServices = results.filter(service => service.status === 'online').length;
    const isConnected = onlineServices > 0;

    setState({
      services: results,
      isConnected,
      lastUpdate: new Date(),
      autoRetry: state.autoRetry
    });

    // Silent mode - all status info is shown in the startup banner and UI
    // No console logs needed here to keep console clean
  };

  const retryService = async (serviceName: string) => {
    const serviceIndex = state.services.findIndex(s => s.name === serviceName);
    if (serviceIndex === -1) return;

    const updatedServices = [...state.services];
    updatedServices[serviceIndex] = { ...updatedServices[serviceIndex], status: 'checking' };
    
    setState(prev => ({ ...prev, services: updatedServices }));

    const result = await checkServiceHealth(state.services[serviceIndex]);
    
    updatedServices[serviceIndex] = result;
    setState(prev => ({ 
      ...prev, 
      services: updatedServices,
      lastUpdate: new Date()
    }));
  };

  const toggleAutoRetry = () => {
    setState(prev => ({ ...prev, autoRetry: !prev.autoRetry }));
  };

  // Initial check and auto-retry logic
  useEffect(() => {
    checkAllServices();
    
    // Disable auto-retry by default to prevent console spam in demo mode
    // Users can enable it manually if they're starting backend services
    const interval = setInterval(() => {
      if (state.autoRetry && state.isConnected) {
        // Only auto-retry if at least one service was previously connected
        checkAllServices();
      }
    }, 60000); // Check every 60 seconds instead of 30

    return () => clearInterval(interval);
  }, [state.autoRetry, state.isConnected]);

  // Silent fetch error handling - no console logs
  useEffect(() => {
    // Don't override fetch - let WebSocketErrorHandler handle it
    // This prevents duplicate wrappers and console messages
  }, []);

  return (
    <BackendContext.Provider value={{ state, checkAllServices, toggleAutoRetry, retryService }}>
      {children}
    </BackendContext.Provider>
  );
}

export function BackendConnectionManager() {
  const { state, checkAllServices, toggleAutoRetry, retryService } = useBackendConnection();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await checkAllServices();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    const badges = {
      online: <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>,
      offline: <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>,
      error: <Badge className="bg-orange-100 text-orange-800 border-orange-200">Error</Badge>,
      checking: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Checking...</Badge>
    };
    return badges[status] || badges.offline;
  };

  const onlineServices = state.services.filter(s => s.status === 'online').length;
  const totalServices = state.services.length;

  return (
    <Card className="bg-white border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>Backend Services</span>
          </div>
          <Badge 
            className={
              state.isConnected 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {onlineServices}/{totalServices} Online
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!state.isConnected && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Backend services unavailable. Using mock data mode for demonstration.
              <br />
              <strong>To start services:</strong> Run <code className="bg-orange-100 px-1 rounded">python start_complete_system.py</code>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {state.services.map((service) => {
            const ServiceIcon = service.icon;
            return (
              <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ServiceIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="font-medium text-sm">{service.name}</span>
                    </div>
                    {service.error && (
                      <p className="text-xs text-red-600 mt-1">{service.error}</p>
                    )}
                    {service.responseTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Response: {service.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(service.status)}
                  {service.status === 'offline' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryService(service.name)}
                      className="h-6 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Auto-retry:</label>
            <Button
              size="sm"
              variant={state.autoRetry ? "default" : "outline"}
              onClick={toggleAutoRetry}
              className="h-6 px-2 text-xs"
            >
              {state.autoRetry ? <Zap className="h-3 w-3" /> : <Zap className="h-3 w-3 text-gray-400" />}
            </Button>
          </div>
          
          <Button
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="h-6 px-3 text-xs"
          >
            {isRefreshing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh All
              </>
            )}
          </Button>
        </div>

        {state.lastUpdate && (
          <p className="text-xs text-gray-500 text-center pt-2 border-t">
            Last updated: {state.lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}