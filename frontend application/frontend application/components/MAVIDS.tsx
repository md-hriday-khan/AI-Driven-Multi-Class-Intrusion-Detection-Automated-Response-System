import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  Plane, Radio, Brain, Shield, AlertTriangle, Activity, 
  Zap, Database, Cpu, Monitor, Settings, Target,
  TrendingUp, Wifi, Router, Lock, Eye, Users, MapPin
} from 'lucide-react';

interface MAVLinkMessage {
  id: string;
  timestamp: Date;
  messageType: string;
  sourceSystem: number;
  targetSystem: number;
  payload: any;
  anomalyScore: number;
  classification: 'normal' | 'suspicious' | 'malicious';
}

interface UAVTelemetry {
  uav_id: string;
  position: { lat: number; lng: number; alt: number };
  velocity: { x: number; y: number; z: number };
  attitude: { roll: number; pitch: number; yaw: number };
  battery: number;
  gps_satellites: number;
  signal_strength: number;
  flight_mode: string;
  armed: boolean;
  last_update: Date;
}

interface ThreatDetection {
  id: string;
  timestamp: Date;
  threat_type: 'command_injection' | 'telemetry_spoofing' | 'dos_attack' | 'replay_attack' | 'hijacking';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  affected_uav: string;
  mavlink_messages: string[];
  ml_prediction: string;
  countermeasure: string;
}

interface MLModel {
  name: string;
  type: 'anomaly_detection' | 'classification' | 'clustering';
  accuracy: number;
  last_trained: Date;
  status: 'active' | 'training' | 'offline';
  resource_usage: number;
}

const mavidsModels: MLModel[] = [
  {
    name: 'LSTM Anomaly Detector',
    type: 'anomaly_detection',
    accuracy: 96.8,
    last_trained: new Date(),
    status: 'active',
    resource_usage: 23.5
  },
  {
    name: 'Random Forest Classifier',
    type: 'classification',
    accuracy: 94.2,
    last_trained: new Date(),
    status: 'active',
    resource_usage: 15.7
  },
  {
    name: 'K-Means Clustering',
    type: 'clustering',
    accuracy: 89.1,
    last_trained: new Date(),
    status: 'training',
    resource_usage: 18.3
  }
];

export function MAVIDS() {
  const [mavlinkMessages, setMavlinkMessages] = useState<MAVLinkMessage[]>([]);
  const [uavTelemetry, setUavTelemetry] = useState<UAVTelemetry[]>([]);
  const [detections, setDetections] = useState<ThreatDetection[]>([]);
  const [models, setModels] = useState<MLModel[]>(mavidsModels);
  const [systemMetrics, setSystemMetrics] = useState({
    messages_processed: 0,
    anomalies_detected: 0,
    response_time: 0.0,
    resource_efficiency: 0.0,
    uptime: 0
  });
  const [selectedUAV, setSelectedUAV] = useState<string>('');

  useEffect(() => {
    // Initialize demo UAVs
    const demoUAVs: UAVTelemetry[] = [
      {
        uav_id: 'MAV_001',
        position: { lat: 40.7128, lng: -74.0060, alt: 150 },
        velocity: { x: 2.5, y: 1.2, z: 0.1 },
        attitude: { roll: 0.5, pitch: 2.1, yaw: 45.0 },
        battery: 85,
        gps_satellites: 12,
        signal_strength: 92,
        flight_mode: 'AUTO',
        armed: true,
        last_update: new Date()
      },
      {
        uav_id: 'MAV_002',
        position: { lat: 40.7589, lng: -73.9851, alt: 200 },
        velocity: { x: 3.1, y: -0.8, z: 0.3 },
        attitude: { roll: -1.2, pitch: 1.8, yaw: 120.0 },
        battery: 67,
        gps_satellites: 10,
        signal_strength: 78,
        flight_mode: 'GUIDED',
        armed: true,
        last_update: new Date()
      },
      {
        uav_id: 'MAV_003',
        position: { lat: 40.7282, lng: -74.0776, alt: 180 },
        velocity: { x: 1.8, y: 2.3, z: -0.2 },
        attitude: { roll: 0.8, pitch: -0.5, yaw: 270.0 },
        battery: 34,
        gps_satellites: 8,
        signal_strength: 45,
        flight_mode: 'RTL',
        armed: false,
        last_update: new Date()
      }
    ];
    
    setUavTelemetry(demoUAVs);
    setSelectedUAV('MAV_001');
  }, []);

  useEffect(() => {
    // Simulate real-time MAVLink message processing
    const interval = setInterval(() => {
      // Generate MAVLink messages
      const messageTypes = ['HEARTBEAT', 'ATTITUDE', 'GPS_RAW_INT', 'MISSION_ITEM', 'COMMAND_LONG'];
      const newMessage: MAVLinkMessage = {
        id: Date.now().toString(),
        timestamp: new Date(),
        messageType: messageTypes[Math.floor(Math.random() * messageTypes.length)],
        sourceSystem: Math.floor(Math.random() * 3) + 1,
        targetSystem: 255,
        payload: {
          sequence: Math.floor(Math.random() * 1000),
          component_id: 1,
          command: Math.floor(Math.random() * 100)
        },
        anomalyScore: Math.random(),
        classification: Math.random() > 0.85 ? 'suspicious' : 'normal'
      };

      setMavlinkMessages(prev => [newMessage, ...prev.slice(0, 49)]);

      // Update UAV telemetry
      setUavTelemetry(prev => prev.map(uav => ({
        ...uav,
        position: {
          lat: uav.position.lat + (Math.random() - 0.5) * 0.001,
          lng: uav.position.lng + (Math.random() - 0.5) * 0.001,
          alt: Math.max(50, uav.position.alt + (Math.random() - 0.5) * 10)
        },
        velocity: {
          x: uav.velocity.x + (Math.random() - 0.5) * 0.5,
          y: uav.velocity.y + (Math.random() - 0.5) * 0.5,
          z: uav.velocity.z + (Math.random() - 0.5) * 0.2
        },
        battery: Math.max(10, uav.battery - Math.random() * 2),
        signal_strength: Math.max(30, Math.min(100, uav.signal_strength + (Math.random() - 0.5) * 10)),
        last_update: new Date()
      })));

      // Generate threat detections
      if (Math.random() > 0.7) {
        const threatTypes: Array<'command_injection' | 'telemetry_spoofing' | 'dos_attack' | 'replay_attack' | 'hijacking'> = 
          ['command_injection', 'telemetry_spoofing', 'dos_attack', 'replay_attack', 'hijacking'];
        const severities: Array<'low' | 'medium' | 'high' | 'critical'> = 
          ['low', 'medium', 'high', 'critical'];

        const newDetection: ThreatDetection = {
          id: `THREAT-${Date.now()}`,
          timestamp: new Date(),
          threat_type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          confidence: 70 + Math.random() * 28,
          affected_uav: `MAV_00${Math.floor(Math.random() * 3) + 1}`,
          mavlink_messages: [newMessage.id],
          ml_prediction: getMLPrediction(),
          countermeasure: getCountermeasure()
        };

        setDetections(prev => [newDetection, ...prev.slice(0, 19)]);
      }

      // Update system metrics
      setSystemMetrics(prev => ({
        messages_processed: prev.messages_processed + 1,
        anomalies_detected: prev.anomalies_detected + (newMessage.classification !== 'normal' ? 1 : 0),
        response_time: Math.max(0.1, Math.min(2.0, prev.response_time + (Math.random() - 0.5) * 0.1)),
        resource_efficiency: Math.max(70, Math.min(98, prev.resource_efficiency + (Math.random() - 0.5) * 2)),
        uptime: prev.uptime + 3
      }));

      // Update ML models
      setModels(prev => prev.map(model => ({
        ...model,
        accuracy: Math.max(85, Math.min(99, model.accuracy + (Math.random() - 0.5) * 1)),
        resource_usage: Math.max(10, Math.min(40, model.resource_usage + (Math.random() - 0.5) * 2))
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getMLPrediction = (): string => {
    const predictions = [
      'LSTM model detected temporal anomaly in command sequence',
      'Random Forest classified message pattern as potentially malicious',
      'Clustering algorithm identified deviation from normal telemetry baseline',
      'Ensemble model consensus indicates high threat probability',
      'Deep learning detector found suspicious payload characteristics'
    ];
    return predictions[Math.floor(Math.random() * predictions.length)];
  };

  const getCountermeasure = (): string => {
    const measures = [
      'Command validation enhanced, suspicious commands quarantined',
      'Telemetry verification activated, backup sensors engaged',
      'Rate limiting applied, connection throttling enabled',
      'Message replay detection active, sequence validation enforced',
      'Emergency protocols triggered, safe mode activated'
    ];
    return measures[Math.floor(Math.random() * measures.length)];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'malicious': return 'bg-red-100 text-red-800';
      case 'suspicious': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlightModeColor = (mode: string) => {
    switch (mode) {
      case 'AUTO': return 'bg-green-500';
      case 'GUIDED': return 'bg-blue-500';
      case 'RTL': return 'bg-orange-500';
      case 'LAND': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const selectedUAVData = uavTelemetry.find(uav => uav.uav_id === selectedUAV);

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MAVIDS - Micro Air Vehicle Intrusion Detection System</h2>
          <p className="text-gray-600">Machine learning-based IDS for UAV MAVLink protocol security</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800">
            <Plane className="h-4 w-4 mr-2" />
            {uavTelemetry.length} UAVs Active
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {detections.length} Threats
          </Badge>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Messages Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {systemMetrics.messages_processed.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Real-time processing</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {systemMetrics.response_time.toFixed(2)}ms
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Zap className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Ultra low latency</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Resource Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {systemMetrics.resource_efficiency.toFixed(1)}%
            </div>
            <Progress value={systemMetrics.resource_efficiency} className="mt-2 h-2" />
            <span className="text-xs text-gray-600">Lightweight deployment</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">System Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.floor(systemMetrics.uptime / 3600)}h {Math.floor((systemMetrics.uptime % 3600) / 60)}m
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Shield className="h-3 w-3 text-purple-600" />
              <span className="text-xs text-purple-600">High availability</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="uav-fleet" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="uav-fleet" className="text-gray-700">UAV Fleet</TabsTrigger>
          <TabsTrigger value="mavlink-monitor" className="text-gray-700">MAVLink Monitor</TabsTrigger>
          <TabsTrigger value="ml-models" className="text-gray-700">ML Models</TabsTrigger>
          <TabsTrigger value="threat-detection" className="text-gray-700">Threat Detection</TabsTrigger>
          <TabsTrigger value="lightweight-deployment" className="text-gray-700">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="uav-fleet" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">UAV Fleet Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uavTelemetry.map((uav) => (
                    <div 
                      key={uav.uav_id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedUAV === uav.uav_id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedUAV(uav.uav_id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getFlightModeColor(uav.flight_mode)}`}></div>
                          <span className="font-medium text-gray-900">{uav.uav_id}</span>
                          <Badge variant="outline" className="text-xs">
                            {uav.flight_mode}
                          </Badge>
                        </div>
                        <Badge className={uav.armed ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                          {uav.armed ? 'ARMED' : 'DISARMED'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Battery</span>
                          <div className="font-medium text-gray-900">{uav.battery.toFixed(0)}%</div>
                          <Progress value={uav.battery} className="h-1 mt-1" />
                        </div>
                        <div>
                          <span className="text-gray-600">Signal</span>
                          <div className="font-medium text-gray-900">{uav.signal_strength}%</div>
                          <Progress value={uav.signal_strength} className="h-1 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected UAV Details */}
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">
                  {selectedUAVData ? `${selectedUAVData.uav_id} Telemetry` : 'Select UAV'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUAVData ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Position</label>
                      <div className="text-gray-900 font-mono text-sm">
                        Lat: {selectedUAVData.position.lat.toFixed(6)}°<br/>
                        Lng: {selectedUAVData.position.lng.toFixed(6)}°<br/>
                        Alt: {selectedUAVData.position.alt.toFixed(1)}m
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Velocity</label>
                      <div className="text-gray-900 font-mono text-sm">
                        X: {selectedUAVData.velocity.x.toFixed(2)} m/s<br/>
                        Y: {selectedUAVData.velocity.y.toFixed(2)} m/s<br/>
                        Z: {selectedUAVData.velocity.z.toFixed(2)} m/s
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Attitude</label>
                      <div className="text-gray-900 font-mono text-sm">
                        Roll: {selectedUAVData.attitude.roll.toFixed(1)}°<br/>
                        Pitch: {selectedUAVData.attitude.pitch.toFixed(1)}°<br/>
                        Yaw: {selectedUAVData.attitude.yaw.toFixed(1)}°
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">GPS Satellites</label>
                        <div className="text-gray-900">{selectedUAVData.gps_satellites}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Last Update</label>
                        <div className="text-gray-900 text-xs">{selectedUAVData.last_update.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Plane className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a UAV to view telemetry details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mavlink-monitor" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Real-Time MAVLink Message Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {mavlinkMessages.map((message) => (
                    <div key={message.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getClassificationColor(message.classification)}>
                            {message.classification.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-gray-900">{message.messageType}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Source System:</span>
                          <span className="ml-2 text-gray-900">{message.sourceSystem}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Anomaly Score:</span>
                          <span className="ml-2 text-gray-900">{message.anomalyScore.toFixed(3)}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Payload:</span>
                        <pre className="text-xs text-gray-800 mt-1 bg-white p-2 rounded border">
                          {JSON.stringify(message.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml-models" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Machine Learning Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.map((model, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{model.name}</h4>
                        <Badge className={model.status === 'active' ? 'bg-green-500 text-white' : 
                                       model.status === 'training' ? 'bg-blue-500 text-white' : 
                                       'bg-gray-500 text-white'}>
                          {model.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 text-gray-900 capitalize">{model.type.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Accuracy:</span>
                          <span className="ml-2 text-gray-900">{model.accuracy.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Resource Usage</span>
                          <span className="text-gray-900">{model.resource_usage.toFixed(1)}%</span>
                        </div>
                        <Progress value={model.resource_usage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Lightweight Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Edge Computing</span>
                      <Badge className="bg-green-500 text-white">ENABLED</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      On-device ML inference for real-time processing
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Model Compression</span>
                      <Badge className="bg-blue-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Quantization and pruning for resource efficiency
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Adaptive Sampling</span>
                      <Badge className="bg-purple-500 text-white">OPTIMIZED</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Dynamic message sampling based on threat level
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Power Management</span>
                      <Badge className="bg-orange-500 text-white">EFFICIENT</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Battery-aware processing with duty cycling
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threat-detection" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">MAVLink Threat Detection Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {detections.map((detection) => (
                    <div key={detection.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(detection.severity)}>
                            {detection.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-gray-900 capitalize">
                            {detection.threat_type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {detection.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Affected UAV:</span>
                          <span className="ml-2 text-gray-900">{detection.affected_uav}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-2 text-gray-900">{detection.confidence.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="text-gray-600 font-medium">ML Prediction:</span>
                        <p className="text-gray-800 mt-1">{detection.ml_prediction}</p>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Countermeasure:</span>
                        <p className="text-green-700 mt-1">{detection.countermeasure}</p>
                      </div>
                    </div>
                  ))}
                  
                  {detections.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Shield className="h-8 w-8 mx-auto mb-2" />
                      <p>No threats detected. MAVLink protocol secure.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lightweight-deployment" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Deployment Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900">Processing Unit</span>
                    </div>
                    <Badge className="bg-blue-500 text-white">ARM Cortex-A7</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-600" />
                      <span className="text-gray-900">Memory Usage</span>
                    </div>
                    <Badge className="bg-green-500 text-white">&lt; 128MB</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <span className="text-gray-900">Power Consumption</span>
                    </div>
                    <Badge className="bg-orange-500 text-white">&lt; 2W</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-900">Real-time OS</span>
                    </div>
                    <Badge className="bg-purple-500 text-white">RTOS Compatible</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Detection Latency</span>
                      <span className="text-gray-900">&lt; 10ms</span>
                    </div>
                    <Progress value={95} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Throughput</span>
                      <span className="text-gray-900">1000+ msg/sec</span>
                    </div>
                    <Progress value={88} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Accuracy</span>
                      <span className="text-gray-900">96.8%</span>
                    </div>
                    <Progress value={96.8} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Resource Efficiency</span>
                      <span className="text-gray-900">92.3%</span>
                    </div>
                    <Progress value={92.3} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-8">
        MAVIDS: Micro Air Vehicle Intrusion Detection System - Created by Md.Hriday Khan
      </div>
    </div>
  );
}