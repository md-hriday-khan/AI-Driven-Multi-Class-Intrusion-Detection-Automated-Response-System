import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  AlertTriangle, Shield, Car, Navigation, MapPin, 
  Phone, Clock, Zap, CheckCircle, XCircle, Pause,
  RotateCcw, Activity, Settings, Target
} from 'lucide-react';

interface VehicleStatus {
  vehicle_id: string;
  operational_state: 'normal' | 'safe_stop' | 'pulled_over' | 'emergency_stopped';
  location: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  };
  safety_systems: {
    emergency_stop_armed: boolean;
    safe_stop_available: boolean;
    pull_over_available: boolean;
    hazard_lights: boolean;
    emergency_brake: boolean;
  };
  threat_assessment: {
    current_level: 'low' | 'medium' | 'high' | 'critical';
    last_updated: string;
    active_countermeasures: number;
  };
}

interface EmergencyResponse {
  success: boolean;
  vehicle_id: string;
  action: string;
  status: string;
  timestamp: string;
  procedure?: {
    [key: string]: string;
  };
  estimated_stop_time?: string;
  emergency_level?: string;
  reason?: string;
  maneuver?: any;
  execution?: any;
  safety_protocols?: string[];
  safety_checks?: string[];
  safety_measures?: string[];
  post_stop_actions?: string[];
}

export function EmergencyControlSystem() {
  const [vehicles, setVehicles] = useState<VehicleStatus[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResponse, setLastResponse] = useState<EmergencyResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    // Check backend connection
    checkBackendConnection();
    
    // Initialize with demo vehicles
    const demoVehicles: VehicleStatus[] = [
      {
        vehicle_id: 'VEH_001',
        operational_state: 'normal',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          speed: 35.5,
          heading: 45
        },
        safety_systems: {
          emergency_stop_armed: true,
          safe_stop_available: true,
          pull_over_available: true,
          hazard_lights: false,
          emergency_brake: false
        },
        threat_assessment: {
          current_level: 'low',
          last_updated: new Date().toISOString(),
          active_countermeasures: 0
        }
      },
      {
        vehicle_id: 'VEH_002',
        operational_state: 'normal',
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          speed: 28.3,
          heading: 120
        },
        safety_systems: {
          emergency_stop_armed: true,
          safe_stop_available: true,
          pull_over_available: true,
          hazard_lights: false,
          emergency_brake: false
        },
        threat_assessment: {
          current_level: 'medium',
          last_updated: new Date().toISOString(),
          active_countermeasures: 1
        }
      },
      {
        vehicle_id: 'VEH_003',
        operational_state: 'safe_stop',
        location: {
          latitude: 40.7282,
          longitude: -74.0776,
          speed: 0,
          heading: 270
        },
        safety_systems: {
          emergency_stop_armed: true,
          safe_stop_available: false,
          pull_over_available: false,
          hazard_lights: true,
          emergency_brake: true
        },
        threat_assessment: {
          current_level: 'high',
          last_updated: new Date().toISOString(),
          active_countermeasures: 3
        }
      }
    ];
    
    setVehicles(demoVehicles);
    setSelectedVehicle('VEH_001');

    // Update vehicle status periodically
    const interval = setInterval(() => {
      updateVehicleStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/health');
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const updateVehicleStatus = async () => {
    if (connectionStatus === 'connected' && selectedVehicle) {
      try {
        const response = await fetch(`http://localhost:5001/api/vehicle/status/${selectedVehicle}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setVehicles(prev => prev.map(vehicle => 
              vehicle.vehicle_id === selectedVehicle 
                ? { ...vehicle, ...data.status }
                : vehicle
            ));
          }
        }
      } catch (error) {
        // Silent fallback to mock mode
      }
    } else {
      // Simulate status updates when backend is not available
      setVehicles(prev => prev.map(vehicle => ({
        ...vehicle,
        location: {
          ...vehicle.location,
          speed: vehicle.operational_state === 'normal' ? 
            Math.max(0, vehicle.location.speed + (Math.random() - 0.5) * 5) : 0
        }
      })));
    }
  };

  const executeSafeStop = async () => {
    if (!selectedVehicle) return;
    
    setIsExecuting(true);
    
    try {
      if (connectionStatus === 'connected') {
        const response = await fetch('http://localhost:5001/api/vehicle/safe-stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_id: selectedVehicle,
            emergency_level: 'medium'
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setLastResponse(data);
          
          // Update vehicle status locally
          setVehicles(prev => prev.map(vehicle => 
            vehicle.vehicle_id === selectedVehicle 
              ? { 
                  ...vehicle, 
                  operational_state: 'safe_stop',
                  safety_systems: {
                    ...vehicle.safety_systems,
                    hazard_lights: true,
                    safe_stop_available: false
                  }
                }
              : vehicle
          ));
        }
      } else {
        // Simulate response when backend is not available
        const simulatedResponse: EmergencyResponse = {
          success: true,
          vehicle_id: selectedVehicle,
          action: 'safe_stop_initiated',
          status: 'executing',
          timestamp: new Date().toISOString(),
          procedure: {
            step_1: 'Activate hazard lights and warning signals',
            step_2: 'Reduce speed gradually to safe velocity',
            step_3: 'Identify safe stopping location',
            step_4: 'Execute controlled deceleration',
            step_5: 'Engage parking brake and safety systems'
          },
          estimated_stop_time: '45-60 seconds',
          emergency_level: 'medium',
          safety_protocols: [
            'Passenger safety verification',
            'Traffic pattern analysis',
            'Emergency service notification',
            'Vehicle diagnostics check'
          ]
        };
        
        setLastResponse(simulatedResponse);
        
        setVehicles(prev => prev.map(vehicle => 
          vehicle.vehicle_id === selectedVehicle 
            ? { 
                ...vehicle, 
                operational_state: 'safe_stop',
                safety_systems: {
                  ...vehicle.safety_systems,
                  hazard_lights: true,
                  safe_stop_available: false
                }
              }
            : vehicle
        ));
      }
    } catch (error) {
      console.error('Safe stop execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const executePullOver = async () => {
    if (!selectedVehicle) return;
    
    setIsExecuting(true);
    
    try {
      if (connectionStatus === 'connected') {
        const response = await fetch('http://localhost:5001/api/vehicle/pull-over', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_id: selectedVehicle,
            reason: 'security_protocol'
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setLastResponse(data);
          
          setVehicles(prev => prev.map(vehicle => 
            vehicle.vehicle_id === selectedVehicle 
              ? { 
                  ...vehicle, 
                  operational_state: 'pulled_over',
                  safety_systems: {
                    ...vehicle.safety_systems,
                    hazard_lights: true,
                    pull_over_available: false
                  }
                }
              : vehicle
          ));
        }
      } else {
        // Simulate response
        const simulatedResponse: EmergencyResponse = {
          success: true,
          vehicle_id: selectedVehicle,
          action: 'pull_over_initiated',
          status: 'executing',
          timestamp: new Date().toISOString(),
          reason: 'security_protocol',
          procedure: {
            step_1: 'Scan for safe roadside location',
            step_2: 'Signal intention to other traffic',
            step_3: 'Check blind spots and mirrors',
            step_4: 'Execute gradual lane change',
            step_5: 'Come to complete stop on shoulder'
          },
          safety_checks: [
            'Shoulder width verification (minimum 8 feet)',
            'Visibility assessment for other drivers',
            'Emergency flasher activation',
            'GPS location logging for assistance'
          ]
        };
        
        setLastResponse(simulatedResponse);
        
        setVehicles(prev => prev.map(vehicle => 
          vehicle.vehicle_id === selectedVehicle 
            ? { 
                ...vehicle, 
                operational_state: 'pulled_over',
                safety_systems: {
                  ...vehicle.safety_systems,
                  hazard_lights: true,
                  pull_over_available: false
                }
              }
            : vehicle
        ));
      }
    } catch (error) {
      console.error('Pull over execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeEmergencyStop = async () => {
    if (!selectedVehicle) return;
    
    setIsExecuting(true);
    
    try {
      if (connectionStatus === 'connected') {
        const response = await fetch('http://localhost:5001/api/vehicle/emergency-stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_id: selectedVehicle,
            threat_level: 'critical'
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setLastResponse(data);
          
          setVehicles(prev => prev.map(vehicle => 
            vehicle.vehicle_id === selectedVehicle 
              ? { 
                  ...vehicle, 
                  operational_state: 'emergency_stopped',
                  location: { ...vehicle.location, speed: 0 },
                  safety_systems: {
                    ...vehicle.safety_systems,
                    hazard_lights: true,
                    emergency_brake: true,
                    emergency_stop_armed: false
                  }
                }
              : vehicle
          ));
        }
      } else {
        // Simulate response
        const simulatedResponse: EmergencyResponse = {
          success: true,
          vehicle_id: selectedVehicle,
          action: 'emergency_stop_executed',
          status: 'executed',
          timestamp: new Date().toISOString(),
          safety_measures: [
            'Hazard lights activated',
            'Horn/alarm sounded',
            'Emergency services alerted',
            'Passenger protection engaged',
            'Traffic warning broadcasted'
          ],
          post_stop_actions: [
            'Vehicle immobilization',
            'Location broadcasting',
            'Emergency responder notification',
            'Incident logging and forensics'
          ]
        };
        
        setLastResponse(simulatedResponse);
        
        setVehicles(prev => prev.map(vehicle => 
          vehicle.vehicle_id === selectedVehicle 
            ? { 
                ...vehicle, 
                operational_state: 'emergency_stopped',
                location: { ...vehicle.location, speed: 0 },
                safety_systems: {
                  ...vehicle.safety_systems,
                  hazard_lights: true,
                  emergency_brake: true,
                  emergency_stop_armed: false
                }
              }
            : vehicle
        ));
      }
    } catch (error) {
      console.error('Emergency stop execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const resetVehicle = () => {
    setVehicles(prev => prev.map(vehicle => 
      vehicle.vehicle_id === selectedVehicle 
        ? { 
            ...vehicle, 
            operational_state: 'normal',
            safety_systems: {
              emergency_stop_armed: true,
              safe_stop_available: true,
              pull_over_available: true,
              hazard_lights: false,
              emergency_brake: false
            }
          }
        : vehicle
    ));
    setLastResponse(null);
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'normal': return 'bg-green-500';
      case 'safe_stop': return 'bg-yellow-500';
      case 'pulled_over': return 'bg-orange-500';
      case 'emergency_stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const selectedVehicleData = vehicles.find(v => v.vehicle_id === selectedVehicle);

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emergency Control System</h2>
          <p className="text-gray-600">Real-time vehicle safety control with automated emergency responses</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            <Activity className="h-4 w-4 mr-2" />
            Backend {connectionStatus}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            <Car className="h-4 w-4 mr-2" />
            {vehicles.length} Vehicles
          </Badge>
        </div>
      </div>

      {/* Connection Status Alert */}
      {connectionStatus === 'disconnected' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Vehicle Safety API not available. Running in simulation mode. Start the vehicle safety server with: 
            <code className="ml-2 px-2 py-1 bg-yellow-100 rounded">python vehicle_safety_api.py</code>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Selection */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Vehicle Fleet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div 
                  key={vehicle.vehicle_id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedVehicle === vehicle.vehicle_id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle.vehicle_id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.operational_state)}`}></div>
                      <span className="font-medium text-gray-900">{vehicle.vehicle_id}</span>
                      <Badge className={getThreatLevelColor(vehicle.threat_assessment.current_level)}>
                        {vehicle.threat_assessment.current_level.toUpperCase()}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {vehicle.operational_state.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Speed:</span>
                      <span className="ml-2 text-gray-900">{vehicle.location.speed.toFixed(1)} mph</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Heading:</span>
                      <span className="ml-2 text-gray-900">{vehicle.location.heading}°</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Emergency Stop:</span>
                      <span className={`ml-2 ${vehicle.safety_systems.emergency_stop_armed ? 'text-green-600' : 'text-red-600'}`}>
                        {vehicle.safety_systems.emergency_stop_armed ? 'Armed' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hazard Lights:</span>
                      <span className={`ml-2 ${vehicle.safety_systems.hazard_lights ? 'text-red-600' : 'text-gray-600'}`}>
                        {vehicle.safety_systems.hazard_lights ? 'Active' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Controls */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Emergency Controls</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVehicleData ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedVehicleData.vehicle_id} Status</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <div className="text-gray-900 font-mono text-xs">
                        {selectedVehicleData.location.latitude.toFixed(4)}, {selectedVehicleData.location.longitude.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Current State:</span>
                      <Badge className={getStatusColor(selectedVehicleData.operational_state)} size="sm">
                        {selectedVehicleData.operational_state.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={executeSafeStop}
                      disabled={isExecuting || !selectedVehicleData.safety_systems.safe_stop_available}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      size="sm"
                    >
                      {isExecuting ? <Clock className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      Safe Stop
                    </Button>
                    
                    <Button
                      onClick={executePullOver}
                      disabled={isExecuting || !selectedVehicleData.safety_systems.pull_over_available}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      size="sm"
                    >
                      {isExecuting ? <Clock className="h-4 w-4" /> : <Navigation className="h-4 w-4" />}
                      Pull Over
                    </Button>
                    
                    <Button
                      onClick={executeEmergencyStop}
                      disabled={isExecuting || !selectedVehicleData.safety_systems.emergency_stop_armed}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      {isExecuting ? <Clock className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      Emergency
                    </Button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={resetVehicle}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isExecuting}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Normal Operation
                    </Button>
                  </div>
                </div>
                
                {/* Safety Systems Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Safety Systems Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Emergency Stop Armed</span>
                      {selectedVehicleData.safety_systems.emergency_stop_armed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Safe Stop Available</span>
                      {selectedVehicleData.safety_systems.safe_stop_available ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pull Over Available</span>
                      {selectedVehicleData.safety_systems.pull_over_available ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hazard Lights</span>
                      {selectedVehicleData.safety_systems.hazard_lights ? (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-red-600">Active</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">Off</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Emergency Brake</span>
                      {selectedVehicleData.safety_systems.emergency_brake ? (
                        <Badge className="bg-red-100 text-red-800" size="sm">Engaged</Badge>
                      ) : (
                        <span className="text-xs text-gray-600">Released</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Car className="h-8 w-8 mx-auto mb-2" />
                <p>Select a vehicle to view controls</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Response */}
      {lastResponse && (
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Last Emergency Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lastResponse.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-900">
                    {lastResponse.action.replace('_', ' ').toUpperCase()}
                  </span>
                  <Badge className={lastResponse.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {lastResponse.status.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(lastResponse.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {lastResponse.procedure && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Execution Procedure:</h4>
                  <div className="space-y-1">
                    {Object.entries(lastResponse.procedure).map(([step, description]) => (
                      <div key={step} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-600 min-w-[60px]">{step.replace('_', ' ')}:</span>
                        <span className="text-gray-800">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {lastResponse.safety_protocols && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Safety Protocols:</h4>
                  <div className="space-y-1">
                    {lastResponse.safety_protocols.map((protocol, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Shield className="h-3 w-3 text-green-600" />
                        <span className="text-gray-800">{protocol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {lastResponse.safety_checks && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Safety Checks:</h4>
                  <div className="space-y-1">
                    {lastResponse.safety_checks.map((check, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-blue-600" />
                        <span className="text-gray-800">{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {lastResponse.estimated_stop_time && (
                <div className="text-sm">
                  <span className="text-gray-600">Estimated completion time:</span>
                  <span className="ml-2 font-medium text-gray-900">{lastResponse.estimated_stop_time}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-gray-500 mt-8">
        Emergency Control System - Vehicle Safety Management - Created by Md.Hriday Khan
      </div>
    </div>
  );
}