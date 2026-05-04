import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Server, 
  Wifi, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Terminal,
  Play
} from 'lucide-react';

interface ConnectionStatus {
  backend_api: boolean;
  vehicle_safety: boolean;
  websocket_main: boolean;
  websocket_ids: boolean;
  database: boolean;
  lastCheck: Date;
  errors: string[];
}

export function SystemConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    backend_api: false,
    vehicle_safety: false,
    websocket_main: false,
    websocket_ids: false,
    database: false,
    lastCheck: new Date(),
    errors: []
  });

  const [isChecking, setIsChecking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const checkConnections = async () => {
    setIsChecking(true);
    const errors: string[] = [];
    const newStatus: Partial<ConnectionStatus> = {};

    // Check Backend API
    try {
      const response = await fetch('http://localhost:5000/api/health', { 
        signal: AbortSignal.timeout(3000) 
      });
      newStatus.backend_api = response.ok;
      if (!response.ok) {
        errors.push(`Backend API returned ${response.status}`);
      }
    } catch (error) {
      newStatus.backend_api = false;
      errors.push('Backend API: Connection failed');
    }

    // Check Vehicle Safety API
    try {
      const response = await fetch('http://localhost:5001/api/health', { 
        signal: AbortSignal.timeout(3000) 
      });
      newStatus.vehicle_safety = response.ok;
      if (!response.ok) {
        errors.push(`Vehicle Safety API returned ${response.status}`);
      }
    } catch (error) {
      newStatus.vehicle_safety = false;
      errors.push('Vehicle Safety API: Connection failed');
    }

    // Check WebSocket Main (via HTTP health check)
    try {
      const response = await fetch('http://localhost:8080/health', { 
        signal: AbortSignal.timeout(3000) 
      });
      newStatus.websocket_main = response.ok;
    } catch (error) {
      newStatus.websocket_main = false;
      errors.push('WebSocket Server: Connection failed');
    }

    // Check Enhanced IDS WebSocket
    try {
      const response = await fetch('http://localhost:8081/health', { 
        signal: AbortSignal.timeout(3000) 
      });
      newStatus.websocket_ids = response.ok;
    } catch (error) {
      newStatus.websocket_ids = false;
      errors.push('Enhanced IDS: Connection failed');
    }

    // Check Database (simulated - would need backend endpoint)
    newStatus.database = newStatus.backend_api; // Assume DB is working if backend API works

    setStatus({
      ...status,
      ...newStatus,
      lastCheck: new Date(),
      errors
    });

    setIsChecking(false);
  };

  useEffect(() => {
    checkConnections();
    
    // Auto-check every 30 seconds
    const interval = setInterval(checkConnections, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const services = [
    { 
      name: 'Backend API', 
      status: status.backend_api, 
      icon: Server, 
      port: '5000',
      command: 'python backend_api_server.py'
    },
    { 
      name: 'Vehicle Safety', 
      status: status.vehicle_safety, 
      icon: Server, 
      port: '5001',
      command: 'python vehicle_safety_api.py'
    },
    { 
      name: 'WebSocket Server', 
      status: status.websocket_main, 
      icon: Wifi, 
      port: '8080',
      command: 'cd websocket-server && node server.js'
    },
    { 
      name: 'Enhanced IDS', 
      status: status.websocket_ids, 
      icon: Wifi, 
      port: '8081',
      command: 'python enhanced_ids_dataset_integration.py'
    },
    { 
      name: 'Database', 
      status: status.database, 
      icon: Database, 
      port: 'SQLite',
      command: 'Managed by Backend API'
    }
  ];

  const onlineServices = services.filter(s => s.status).length;
  const totalServices = services.length;
  const isSystemHealthy = onlineServices >= 2; // At least backend API and one other service

  return (
    <Card className="bg-white border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <span>System Connection Status</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              className={
                isSystemHealthy 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-red-100 text-red-800 border-red-200"
              }
            >
              {onlineServices}/{totalServices} Online
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={checkConnections}
              disabled={isChecking}
              className="h-6 px-2"
            >
              {isChecking ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isSystemHealthy && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p>Some backend services are offline. The system will use mock data where needed.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="h-6 text-xs"
                  >
                    <Terminal className="h-3 w-3 mr-1" />
                    {showInstructions ? 'Hide' : 'Show'} Setup Instructions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/README_COMPLETE_SETUP.md', '_blank')}
                    className="h-6 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Full Guide
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showInstructions && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-600" />
                Quick Start Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-black rounded-lg p-3 text-green-400 font-mono text-xs">
                <div className="mb-2 text-green-300"># Quick Start (Recommended):</div>
                <div className="mb-1"># Windows:</div>
                <div className="mb-2">START_BACKEND.bat</div>
                <div className="mb-1"># Linux/macOS:</div>
                <div>./START_BACKEND.sh</div>
              </div>
              
              <div className="bg-black rounded-lg p-3 text-green-400 font-mono text-xs">
                <div className="mb-2 text-green-300"># Or use Python script:</div>
                <div>python START_BACKEND_SERVICES.py</div>
              </div>

              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Prerequisites:</strong> Python 3.8+ (Node.js optional for WebSocket)</p>
                <p>• <strong>Minimum:</strong> Just run START_BACKEND to enable core features</p>
                <p>• <strong>Note:</strong> WebSocket servers are optional extras</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-3">
          {services.map((service) => {
            const ServiceIcon = service.icon;
            return (
              <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ServiceIcon className="h-4 w-4 text-gray-600" />
                    {service.status ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{service.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        :{service.port}
                      </Badge>
                    </div>
                    {!service.status && (
                      <p className="text-xs text-gray-600 mt-1 font-mono">
                        {service.command}
                      </p>
                    )}
                  </div>
                </div>
                
                <Badge 
                  className={
                    service.status 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {service.status ? 'Online' : 'Offline'}
                </Badge>
              </div>
            );
          })}
        </div>

        {status.errors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-3">
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">Connection Errors:</p>
                <ul className="space-y-1 text-xs">
                  {status.errors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between pt-3 border-t text-xs text-gray-500">
          <span>Last checked: {status.lastCheck.toLocaleTimeString()}</span>
          <span>Auto-refresh: 30s</span>
        </div>
      </CardContent>
    </Card>
  );
}