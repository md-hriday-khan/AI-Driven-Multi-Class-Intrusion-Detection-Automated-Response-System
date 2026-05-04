import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  Plane, Wifi, Brain, Shield, AlertTriangle, Activity, 
  Radio, Satellite, Camera, Navigation, Settings, Target,
  TrendingUp, Database, Lock, Eye, Zap, Users, MapPin
} from 'lucide-react';

interface UAVNode {
  id: string;
  name: string;
  position: { lat: number; lng: number; alt: number };
  status: 'active' | 'warning' | 'compromised' | 'offline';
  sector: 'agriculture' | 'surveillance' | 'delivery' | 'research';
  threats: number;
  confidence: number;
  lastUpdate: Date;
  batteryLevel: number;
  communicationQuality: number;
}

interface ThreatDetection {
  id: string;
  timestamp: Date;
  source_uav: string;
  threat_type: 'jamming' | 'spoofing' | 'hijacking' | 'eavesdropping' | 'dos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  location: { lat: number; lng: number; alt: number };
  affected_nodes: string[];
  ai_analysis: string;
  mitigation_applied: string;
}

interface CollaborativeDetection {
  consensus_score: number;
  participating_uavs: number;
  detection_latency: number;
  false_positive_rate: number;
  coverage_area: number;
}

const uavFleet: UAVNode[] = [
  {
    id: 'UAV-001',
    name: 'AgriScan Alpha',
    position: { lat: 40.7128, lng: -74.0060, alt: 150 },
    status: 'active',
    sector: 'agriculture',
    threats: 0,
    confidence: 97.8,
    lastUpdate: new Date(),
    batteryLevel: 85,
    communicationQuality: 92
  },
  {
    id: 'UAV-002', 
    name: 'SurveillanceHawk Beta',
    position: { lat: 40.7589, lng: -73.9851, alt: 200 },
    status: 'warning',
    sector: 'surveillance',
    threats: 2,
    confidence: 89.3,
    lastUpdate: new Date(),
    batteryLevel: 67,
    communicationQuality: 78
  },
  {
    id: 'UAV-003',
    name: 'DeliveryExpress Gamma',
    position: { lat: 40.7282, lng: -74.0776, alt: 120 },
    status: 'active',
    sector: 'delivery',
    threats: 0,
    confidence: 94.5,
    lastUpdate: new Date(),
    batteryLevel: 92,
    communicationQuality: 88
  },
  {
    id: 'UAV-004',
    name: 'ResearchDrone Delta',
    position: { lat: 40.6892, lng: -74.0445, alt: 180 },
    status: 'compromised',
    sector: 'research',
    threats: 5,
    confidence: 45.2,
    lastUpdate: new Date(),
    batteryLevel: 23,
    communicationQuality: 34
  }
];

export function UAVCollaborativeIDS() {
  const [uavNodes, setUavNodes] = useState<UAVNode[]>(uavFleet);
  const [detections, setDetections] = useState<ThreatDetection[]>([]);
  const [collaborativeMetrics, setCollaborativeMetrics] = useState<CollaborativeDetection>({
    consensus_score: 94.7,
    participating_uavs: 4,
    detection_latency: 1.2,
    false_positive_rate: 2.1,
    coverage_area: 15.7
  });
  const [selectedUAV, setSelectedUAV] = useState<UAVNode | null>(null);
  const [activeThreats, setActiveThreats] = useState(0);

  useEffect(() => {
    // Simulate real-time UAV updates
    const interval = setInterval(() => {
      setUavNodes(prev => prev.map(uav => ({
        ...uav,
        batteryLevel: Math.max(15, uav.batteryLevel - Math.random() * 2),
        communicationQuality: Math.max(30, Math.min(100, uav.communicationQuality + (Math.random() - 0.5) * 10)),
        confidence: Math.max(40, Math.min(100, uav.confidence + (Math.random() - 0.5) * 5)),
        threats: uav.status === 'compromised' ? Math.floor(Math.random() * 8) + 1 : Math.floor(Math.random() * 3),
        lastUpdate: new Date()
      })));

      // Generate collaborative threat detections
      if (Math.random() > 0.7) {
        const threatTypes: Array<'jamming' | 'spoofing' | 'hijacking' | 'eavesdropping' | 'dos'> = 
          ['jamming', 'spoofing', 'hijacking', 'eavesdropping', 'dos'];
        const severities: Array<'low' | 'medium' | 'high' | 'critical'> = 
          ['low', 'medium', 'high', 'critical'];
        
        const sourceUAV = uavFleet[Math.floor(Math.random() * uavFleet.length)];
        const affectedCount = Math.floor(Math.random() * 3) + 1;
        const affectedNodes = uavFleet
          .filter(uav => uav.id !== sourceUAV.id)
          .slice(0, affectedCount)
          .map(uav => uav.id);

        const newDetection: ThreatDetection = {
          id: `THREAT-${Date.now()}`,
          timestamp: new Date(),
          source_uav: sourceUAV.id,
          threat_type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          confidence: 70 + Math.random() * 28,
          location: sourceUAV.position,
          affected_nodes: affectedNodes,
          ai_analysis: getAIAnalysis(),
          mitigation_applied: getMitigationStrategy()
        };

        setDetections(prev => [newDetection, ...prev.slice(0, 19)]);
      }

      // Update collaborative metrics
      setCollaborativeMetrics(prev => ({
        ...prev,
        consensus_score: Math.max(85, Math.min(99, prev.consensus_score + (Math.random() - 0.5) * 3)),
        detection_latency: Math.max(0.5, Math.min(3.0, prev.detection_latency + (Math.random() - 0.5) * 0.3)),
        false_positive_rate: Math.max(0.5, Math.min(5.0, prev.false_positive_rate + (Math.random() - 0.5) * 0.5)),
        coverage_area: Math.max(10, Math.min(25, prev.coverage_area + (Math.random() - 0.5) * 2))
      }));

      // Count active threats
      const totalThreats = uavNodes.reduce((sum, uav) => sum + uav.threats, 0);
      setActiveThreats(totalThreats);
    }, 3000);

    return () => clearInterval(interval);
  }, [uavNodes]);

  const getAIAnalysis = (): string => {
    const analyses = [
      'Deep learning model detected anomalous communication patterns consistent with jamming attack',
      'Neural network identified GPS spoofing signatures in navigation data',
      'AI classifier flagged suspicious control command sequences indicating potential hijacking',
      'Machine learning anomaly detector found irregular network traffic patterns',
      'Ensemble model consensus indicates high probability of coordinated attack'
    ];
    return analyses[Math.floor(Math.random() * analyses.length)];
  };

  const getMitigationStrategy = (): string => {
    const strategies = [
      'Frequency hopping activated, redundant communication channels established',
      'GPS denied environment protocol engaged, switching to inertial navigation',
      'Command validation enhanced, suspicious commands quarantined',
      'Network segmentation applied, isolated compromised nodes',
      'Swarm formation adjusted to minimize attack surface'
    ];
    return strategies[Math.floor(Math.random() * strategies.length)];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'compromised': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
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

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case 'agriculture': return <Camera className="h-4 w-4" />;
      case 'surveillance': return <Eye className="h-4 w-4" />;
      case 'delivery': return <MapPin className="h-4 w-4" />;
      case 'research': return <Brain className="h-4 w-4" />;
      default: return <Plane className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Collaborative IDS for UAV Networks</h2>
          <p className="text-gray-600">AI-powered multi-tier intrusion detection for autonomous drone fleets</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800">
            <Plane className="h-4 w-4 mr-2" />
            {uavNodes.filter(uav => uav.status === 'active').length} Active UAVs
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {activeThreats} Active Threats
          </Badge>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Consensus Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {collaborativeMetrics.consensus_score.toFixed(1)}%
            </div>
            <Progress value={collaborativeMetrics.consensus_score} className="mt-2 h-2" />
            <p className="text-xs text-gray-600 mt-1">Multi-UAV agreement</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Detection Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {collaborativeMetrics.detection_latency.toFixed(1)}s
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Optimal performance</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Coverage Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {collaborativeMetrics.coverage_area.toFixed(1)} km²
            </div>
            <p className="text-xs text-gray-600 mt-1">Protected airspace</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">False Positive Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {collaborativeMetrics.false_positive_rate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Shield className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Industry leading</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fleet-overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="fleet-overview" className="text-gray-700">Fleet Overview</TabsTrigger>
          <TabsTrigger value="threat-detection" className="text-gray-700">Threat Detection</TabsTrigger>
          <TabsTrigger value="ai-analysis" className="text-gray-700">AI Analysis</TabsTrigger>
          <TabsTrigger value="collaboration" className="text-gray-700">Collaboration</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet-overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* UAV Fleet Status */}
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">UAV Fleet Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uavNodes.map((uav) => (
                    <div 
                      key={uav.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedUAV?.id === uav.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedUAV(uav)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(uav.status)}`}></div>
                          <div className="flex items-center gap-2">
                            {getSectorIcon(uav.sector)}
                            <span className="font-medium text-gray-900">{uav.name}</span>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(uav.threats > 3 ? 'high' : uav.threats > 1 ? 'medium' : 'low')}>
                          {uav.threats} threats
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Battery</span>
                          <div className="font-medium text-gray-900">{uav.batteryLevel}%</div>
                          <Progress value={uav.batteryLevel} className="h-1 mt-1" />
                        </div>
                        <div>
                          <span className="text-gray-600">Signal</span>
                          <div className="font-medium text-gray-900">{uav.communicationQuality}%</div>
                          <Progress value={uav.communicationQuality} className="h-1 mt-1" />
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence</span>
                          <div className="font-medium text-gray-900">{uav.confidence.toFixed(1)}%</div>
                          <Progress value={uav.confidence} className="h-1 mt-1" />
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
                  {selectedUAV ? `${selectedUAV.name} Details` : 'Select UAV for Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUAV ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">UAV ID</label>
                        <div className="text-gray-900">{selectedUAV.id}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Sector</label>
                        <div className="flex items-center gap-1">
                          {getSectorIcon(selectedUAV.sector)}
                          <span className="text-gray-900 capitalize">{selectedUAV.sector}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Position</label>
                      <div className="text-gray-900 font-mono text-sm">
                        Lat: {selectedUAV.position.lat.toFixed(4)}°<br/>
                        Lng: {selectedUAV.position.lng.toFixed(4)}°<br/>
                        Alt: {selectedUAV.position.alt}m
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">System Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedUAV.status)}`}></div>
                        <span className="text-gray-900 capitalize">{selectedUAV.status}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Update</label>
                      <div className="text-gray-900">{selectedUAV.lastUpdate.toLocaleString()}</div>
                    </div>

                    {selectedUAV.status === 'compromised' && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          UAV security compromised. Immediate action required.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Plane className="h-8 w-8 mx-auto mb-2" />
                    <p>Click on a UAV to view detailed information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threat-detection" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Real-Time Threat Detections</CardTitle>
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
                          <span className="text-gray-600">Source UAV:</span>
                          <span className="ml-2 text-gray-900">{detection.source_uav}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-2 text-gray-900">{detection.confidence.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="text-gray-600">Affected nodes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detection.affected_nodes.map(nodeId => (
                            <Badge key={nodeId} variant="outline" className="text-xs">
                              {nodeId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="text-gray-600 font-medium">AI Analysis:</span>
                        <p className="text-gray-800 mt-1">{detection.ai_analysis}</p>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Mitigation:</span>
                        <p className="text-green-700 mt-1">{detection.mitigation_applied}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Deep Learning Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">LSTM Anomaly Detector</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Temporal pattern analysis for communication anomalies
                    </div>
                    <Progress value={96.3} className="h-2" />
                    <span className="text-xs text-gray-500">Accuracy: 96.3%</span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">CNN Pattern Classifier</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Signal fingerprinting for attack identification
                    </div>
                    <Progress value={94.8} className="h-2" />
                    <span className="text-xs text-gray-500">Accuracy: 94.8%</span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Ensemble Predictor</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Multi-model consensus for threat prediction
                    </div>
                    <Progress value={98.1} className="h-2" />
                    <span className="text-xs text-gray-500">Accuracy: 98.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">IoT Vulnerability Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Communication Security</span>
                      <Badge className="bg-yellow-500 text-black">MEDIUM</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Encrypted channels with frequency hopping
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Authentication</span>
                      <Badge className="bg-green-500 text-white">HIGH</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Multi-factor authentication with cryptographic keys
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Data Integrity</span>
                      <Badge className="bg-green-500 text-white">HIGH</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Hash-based verification and digital signatures
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Network Segmentation</span>
                      <Badge className="bg-orange-500 text-white">MEDIUM</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Isolated control and data channels
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Collaborative Detection Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900">Participating UAVs</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {collaborativeMetrics.participating_uavs}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-900">Consensus Algorithm</span>
                    </div>
                    <Badge className="bg-green-500 text-white">BYZANTINE FAULT TOLERANT</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Radio className="h-5 w-5 text-green-600" />
                      <span className="text-gray-900">Communication Protocol</span>
                    </div>
                    <Badge className="bg-blue-500 text-white">MESH NETWORK</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-orange-600" />
                      <span className="text-gray-900">Security Level</span>
                    </div>
                    <Badge className="bg-green-500 text-white">AES-256</Badge>
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
                      <span className="text-gray-700">Detection Accuracy</span>
                      <span className="text-gray-900">98.6%</span>
                    </div>
                    <Progress value={98.6} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Network Overhead</span>
                      <span className="text-gray-900">2.1%</span>
                    </div>
                    <Progress value={2.1} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Computational Load</span>
                      <span className="text-gray-900">15.3%</span>
                    </div>
                    <Progress value={15.3} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Energy Efficiency</span>
                      <span className="text-gray-900">87.4%</span>
                    </div>
                    <Progress value={87.4} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-8">
        Real-Time Collaborative IDS for UAV Networks - Created by Md.Hriday Khan
      </div>
    </div>
  );
}