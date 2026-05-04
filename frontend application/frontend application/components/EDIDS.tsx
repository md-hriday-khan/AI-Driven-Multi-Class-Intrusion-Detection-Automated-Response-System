import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  Network, Shield, Brain, Zap, Activity, Target, 
  AlertTriangle, CheckCircle, Radio, Satellite, Cpu,
  BarChart3, TrendingUp, Database, Lock, Settings,
  Wifi, Router, Globe, Monitor, Server
} from 'lucide-react';

interface SwarmNode {
  id: string;
  name: string;
  type: 'leader' | 'follower' | 'scout' | 'relay';
  status: 'active' | 'standby' | 'compromised' | 'isolated';
  position: { x: number; y: number; z: number };
  detectionAccuracy: number;
  computationalLoad: number;
  communicationRange: number;
  energyLevel: number;
  threats: AttackDetection[];
}

interface AttackDetection {
  id: string;
  type: 'jamming' | 'spoofing' | 'dos' | 'mitm' | 'replay' | 'injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  source: string;
  target: string;
  fingerprint: string;
  countermeasure: string;
}

interface DistributedMetrics {
  overall_accuracy: number;
  false_positive_rate: number;
  detection_latency: number;
  network_overhead: number;
  scalability_score: number;
  consensus_time: number;
}

interface SwarmFormation {
  formation_type: 'mesh' | 'star' | 'ring' | 'tree' | 'hybrid';
  coverage_area: number;
  redundancy_level: number;
  fault_tolerance: number;
  communication_efficiency: number;
}

const swarmNodes: SwarmNode[] = [
  {
    id: 'NODE-001',
    name: 'Alpha Leader',
    type: 'leader',
    status: 'active',
    position: { x: 0, y: 0, z: 100 },
    detectionAccuracy: 98.7,
    computationalLoad: 65.2,
    communicationRange: 500,
    energyLevel: 94,
    threats: []
  },
  {
    id: 'NODE-002',
    name: 'Beta Follower',
    type: 'follower',
    status: 'active',
    position: { x: 200, y: 150, z: 95 },
    detectionAccuracy: 96.3,
    computationalLoad: 42.1,
    communicationRange: 400,
    energyLevel: 87,
    threats: []
  },
  {
    id: 'NODE-003',
    name: 'Gamma Scout',
    type: 'scout',
    status: 'active',
    position: { x: -150, y: 200, z: 110 },
    detectionAccuracy: 94.8,
    computationalLoad: 38.7,
    communicationRange: 350,
    energyLevel: 82,
    threats: []
  },
  {
    id: 'NODE-004',
    name: 'Delta Relay',
    type: 'relay',
    status: 'compromised',
    position: { x: 100, y: -180, z: 85 },
    detectionAccuracy: 67.2,
    computationalLoad: 89.4,
    communicationRange: 200,
    energyLevel: 34,
    threats: []
  },
  {
    id: 'NODE-005',
    name: 'Epsilon Follower',
    type: 'follower',
    status: 'standby',
    position: { x: -100, y: -100, z: 105 },
    detectionAccuracy: 97.1,
    computationalLoad: 23.6,
    communicationRange: 450,
    energyLevel: 96,
    threats: []
  }
];

export function EDIDS() {
  const [nodes, setNodes] = useState<SwarmNode[]>(swarmNodes);
  const [distributedMetrics, setDistributedMetrics] = useState<DistributedMetrics>({
    overall_accuracy: 98.6,
    false_positive_rate: 1.4,
    detection_latency: 0.8,
    network_overhead: 3.2,
    scalability_score: 95.7,
    consensus_time: 1.2
  });
  const [swarmFormation, setSwarmFormation] = useState<SwarmFormation>({
    formation_type: 'hybrid',
    coverage_area: 25.6,
    redundancy_level: 85.3,
    fault_tolerance: 92.1,
    communication_efficiency: 89.7
  });
  const [allDetections, setAllDetections] = useState<AttackDetection[]>([]);
  const [selectedNode, setSelectedNode] = useState<SwarmNode | null>(null);

  useEffect(() => {
    // Simulate distributed detection system
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => {
        const updatedNode = {
          ...node,
          detectionAccuracy: node.status === 'compromised' ? 
            Math.max(40, node.detectionAccuracy - Math.random() * 5) :
            Math.min(99, node.detectionAccuracy + (Math.random() - 0.5) * 2),
          computationalLoad: node.status === 'compromised' ?
            Math.min(95, node.computationalLoad + Math.random() * 10) :
            Math.max(20, node.computationalLoad + (Math.random() - 0.5) * 10),
          energyLevel: Math.max(10, node.energyLevel - Math.random() * 2),
          threats: []
        };

        // Generate attack detections
        if (Math.random() > 0.6) {
          const attackTypes: Array<'jamming' | 'spoofing' | 'dos' | 'mitm' | 'replay' | 'injection'> = 
            ['jamming', 'spoofing', 'dos', 'mitm', 'replay', 'injection'];
          const severities: Array<'low' | 'medium' | 'high' | 'critical'> = 
            ['low', 'medium', 'high', 'critical'];

          const newDetection: AttackDetection = {
            id: `DET-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            confidence: 70 + Math.random() * 28,
            timestamp: new Date(),
            source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            target: node.id,
            fingerprint: generateAttackFingerprint(),
            countermeasure: generateCountermeasure()
          };

          updatedNode.threats = [newDetection];
          setAllDetections(prev => [newDetection, ...prev.slice(0, 49)]);
        }

        return updatedNode;
      }));

      // Update distributed metrics
      setDistributedMetrics(prev => ({
        ...prev,
        overall_accuracy: Math.max(95, Math.min(99.5, prev.overall_accuracy + (Math.random() - 0.5) * 1)),
        false_positive_rate: Math.max(0.5, Math.min(3.0, prev.false_positive_rate + (Math.random() - 0.5) * 0.3)),
        detection_latency: Math.max(0.3, Math.min(2.0, prev.detection_latency + (Math.random() - 0.5) * 0.2)),
        network_overhead: Math.max(1.0, Math.min(8.0, prev.network_overhead + (Math.random() - 0.5) * 0.5)),
        scalability_score: Math.max(90, Math.min(98, prev.scalability_score + (Math.random() - 0.5) * 2)),
        consensus_time: Math.max(0.5, Math.min(3.0, prev.consensus_time + (Math.random() - 0.5) * 0.3))
      }));

      // Update swarm formation metrics
      setSwarmFormation(prev => ({
        ...prev,
        coverage_area: Math.max(20, Math.min(35, prev.coverage_area + (Math.random() - 0.5) * 2)),
        redundancy_level: Math.max(75, Math.min(95, prev.redundancy_level + (Math.random() - 0.5) * 3)),
        fault_tolerance: Math.max(85, Math.min(98, prev.fault_tolerance + (Math.random() - 0.5) * 2)),
        communication_efficiency: Math.max(80, Math.min(95, prev.communication_efficiency + (Math.random() - 0.5) * 2))
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const generateAttackFingerprint = (): string => {
    const patterns = [
      'Pattern: Frequency hopping disruption detected',
      'Signature: GPS timestamp manipulation identified',
      'Anomaly: Unexpected control command sequence',
      'Indicator: Network traffic volume spike',
      'Behavior: Abnormal authentication attempts'
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  const generateCountermeasure = (): string => {
    const measures = [
      'Adaptive frequency allocation activated',
      'Redundant navigation systems engaged',
      'Command validation protocols enhanced',
      'Traffic shaping and rate limiting applied',
      'Multi-factor authentication enforced'
    ];
    return measures[Math.floor(Math.random() * measures.length)];
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'leader': return <Shield className="h-4 w-4" />;
      case 'follower': return <Radio className="h-4 w-4" />;
      case 'scout': return <Target className="h-4 w-4" />;
      case 'relay': return <Router className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'standby': return 'bg-blue-500';
      case 'compromised': return 'bg-red-500';
      case 'isolated': return 'bg-gray-500';
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

  const getAttackTypeIcon = (type: string) => {
    switch (type) {
      case 'jamming': return <Radio className="h-4 w-4" />;
      case 'spoofing': return <Globe className="h-4 w-4" />;
      case 'dos': return <Zap className="h-4 w-4" />;
      case 'mitm': return <Network className="h-4 w-4" />;
      case 'replay': return <Activity className="h-4 w-4" />;
      case 'injection': return <Database className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const activeNodes = nodes.filter(node => node.status === 'active').length;
  const compromisedNodes = nodes.filter(node => node.status === 'compromised').length;
  const totalThreats = allDetections.length;

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">E-DIDS: Exhaustive Distributed Intrusion Detection System</h2>
          <p className="text-gray-600">Advanced distributed framework for UAV swarm security with 98.6% accuracy</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-800">
            <Network className="h-4 w-4 mr-2" />
            {activeNodes} Active Nodes
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {totalThreats} Threats Detected
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Detection Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {distributedMetrics.overall_accuracy.toFixed(1)}%
            </div>
            <Progress value={distributedMetrics.overall_accuracy} className="mt-2 h-3" />
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Industry leading performance</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Computational Overhead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {distributedMetrics.network_overhead.toFixed(1)}%
            </div>
            <Progress value={distributedMetrics.network_overhead} className="mt-2 h-3" />
            <div className="flex items-center gap-1 mt-2">
              <Cpu className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Low resource usage</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Scalability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {distributedMetrics.scalability_score.toFixed(1)}%
            </div>
            <Progress value={distributedMetrics.scalability_score} className="mt-2 h-3" />
            <div className="flex items-center gap-1 mt-2">
              <BarChart3 className="h-3 w-3 text-purple-600" />
              <span className="text-xs text-purple-600">Excellent scalability</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="swarm-overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="swarm-overview" className="text-gray-700">Swarm Overview</TabsTrigger>
          <TabsTrigger value="attack-detection" className="text-gray-700">Attack Detection</TabsTrigger>
          <TabsTrigger value="distributed-algorithm" className="text-gray-700">Algorithms</TabsTrigger>
          <TabsTrigger value="performance" className="text-gray-700">Performance</TabsTrigger>
          <TabsTrigger value="formation" className="text-gray-700">Formation</TabsTrigger>
        </TabsList>

        <TabsContent value="swarm-overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Swarm Nodes */}
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Swarm Nodes Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nodes.map((node) => (
                    <div 
                      key={node.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedNode?.id === node.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></div>
                          <div className="flex items-center gap-2">
                            {getNodeTypeIcon(node.type)}
                            <span className="font-medium text-gray-900">{node.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {node.type.toUpperCase()}
                          </Badge>
                        </div>
                        <Badge className={node.threats.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {node.threats.length} threats
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Detection Accuracy</span>
                          <div className="font-medium text-gray-900">{node.detectionAccuracy.toFixed(1)}%</div>
                          <Progress value={node.detectionAccuracy} className="h-1 mt-1" />
                        </div>
                        <div>
                          <span className="text-gray-600">Energy Level</span>
                          <div className="font-medium text-gray-900">{node.energyLevel.toFixed(0)}%</div>
                          <Progress value={node.energyLevel} className="h-1 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Node Details */}
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">
                  {selectedNode ? `${selectedNode.name} Details` : 'Select Node for Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Node ID</label>
                        <div className="text-gray-900">{selectedNode.id}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <div className="flex items-center gap-1">
                          {getNodeTypeIcon(selectedNode.type)}
                          <span className="text-gray-900 capitalize">{selectedNode.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Position</label>
                      <div className="text-gray-900 font-mono text-sm">
                        X: {selectedNode.position.x}m, Y: {selectedNode.position.y}m, Z: {selectedNode.position.z}m
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Communication Range</label>
                        <div className="text-gray-900">{selectedNode.communicationRange}m</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Computational Load</label>
                        <div className="text-gray-900">{selectedNode.computationalLoad.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedNode.status)}`}></div>
                        <span className="text-gray-900 capitalize">{selectedNode.status}</span>
                      </div>
                    </div>

                    {selectedNode.status === 'compromised' && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Node compromised. Implementing isolation protocols.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Network className="h-8 w-8 mx-auto mb-2" />
                    <p>Click on a node to view detailed information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attack-detection" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Real-Time Attack Detection Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {allDetections.map((detection) => (
                    <div key={detection.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getAttackTypeIcon(detection.type)}
                          <Badge className={getSeverityColor(detection.severity)}>
                            {detection.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-gray-900 capitalize">
                            {detection.type.replace('_', ' ')} Attack
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {detection.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Source:</span>
                          <span className="ml-2 text-gray-900 font-mono">{detection.source}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Target:</span>
                          <span className="ml-2 text-gray-900">{detection.target}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-2 text-gray-900">{detection.confidence.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Detection ID:</span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">{detection.id}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="text-gray-600 font-medium">Attack Fingerprint:</span>
                        <p className="text-gray-800 mt-1">{detection.fingerprint}</p>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Countermeasure Applied:</span>
                        <p className="text-green-700 mt-1">{detection.countermeasure}</p>
                      </div>
                    </div>
                  ))}
                  
                  {allDetections.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Shield className="h-8 w-8 mx-auto mb-2" />
                      <p>No threats detected. System operating normally.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributed-algorithm" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Detection Algorithms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Consensus-Based Detection</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Byzantine fault-tolerant consensus for distributed decision making
                    </div>
                    <Progress value={97.2} className="h-2" />
                    <span className="text-xs text-gray-500">Reliability: 97.2%</span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Multi-Layer Classification</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Ensemble learning with multiple attack type classifiers
                    </div>
                    <Progress value={94.8} className="h-2" />
                    <span className="text-xs text-gray-500">Accuracy: 94.8%</span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Anomaly Correlation</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Cross-node anomaly correlation for attack confirmation
                    </div>
                    <Progress value={91.5} className="h-2" />
                    <span className="text-xs text-gray-500">Correlation: 91.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Distributed Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900">Processing Model</span>
                    </div>
                    <Badge className="bg-blue-500 text-white">EDGE COMPUTING</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-green-600" />
                      <span className="text-gray-900">Communication Protocol</span>
                    </div>
                    <Badge className="bg-green-500 text-white">MESH TOPOLOGY</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-900">Learning Method</span>
                    </div>
                    <Badge className="bg-purple-500 text-white">FEDERATED LEARNING</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-orange-600" />
                      <span className="text-gray-900">Security Level</span>
                    </div>
                    <Badge className="bg-orange-500 text-white">END-TO-END ENCRYPTED</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Detection Accuracy</span>
                      <span className="text-gray-900">{distributedMetrics.overall_accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={distributedMetrics.overall_accuracy} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">False Positive Rate</span>
                      <span className="text-gray-900">{distributedMetrics.false_positive_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={distributedMetrics.false_positive_rate} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Detection Latency</span>
                      <span className="text-gray-900">{distributedMetrics.detection_latency.toFixed(1)}s</span>
                    </div>
                    <Progress value={(distributedMetrics.detection_latency / 3) * 100} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Consensus Time</span>
                      <span className="text-gray-900">{distributedMetrics.consensus_time.toFixed(1)}s</span>
                    </div>
                    <Progress value={(distributedMetrics.consensus_time / 3) * 100} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">Active Nodes</span>
                    <span className="text-lg font-bold text-green-600">{activeNodes}/{nodes.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">Compromised Nodes</span>
                    <span className="text-lg font-bold text-red-600">{compromisedNodes}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">Total Threats</span>
                    <span className="text-lg font-bold text-orange-600">{totalThreats}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">System Status</span>
                    <Badge className={compromisedNodes > 0 ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}>
                      {compromisedNodes > 0 ? 'DEGRADED' : 'OPTIMAL'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="formation" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Swarm Formation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900">Formation Type</span>
                    </div>
                    <Badge className="bg-blue-500 text-white capitalize">
                      {swarmFormation.formation_type}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Coverage Area</span>
                      <span className="text-gray-900">{swarmFormation.coverage_area.toFixed(1)} km²</span>
                    </div>
                    <Progress value={(swarmFormation.coverage_area / 40) * 100} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Redundancy Level</span>
                      <span className="text-gray-900">{swarmFormation.redundancy_level.toFixed(1)}%</span>
                    </div>
                    <Progress value={swarmFormation.redundancy_level} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Fault Tolerance</span>
                      <span className="text-gray-900">{swarmFormation.fault_tolerance.toFixed(1)}%</span>
                    </div>
                    <Progress value={swarmFormation.fault_tolerance} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Communication Efficiency</span>
                      <span className="text-gray-900">{swarmFormation.communication_efficiency.toFixed(1)}%</span>
                    </div>
                    <Progress value={swarmFormation.communication_efficiency} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Adaptive Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Dynamic Reconfiguration</span>
                      <Badge className="bg-green-500 text-white">ENABLED</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Automatic formation adjustment based on threat landscape
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Load Balancing</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Distributed computational load across available nodes
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Self-Healing Network</span>
                      <Badge className="bg-green-500 text-white">OPERATIONAL</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Automatic isolation and replacement of compromised nodes
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Energy Optimization</span>
                      <Badge className="bg-blue-500 text-white">OPTIMIZING</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Battery-aware task allocation and duty cycling
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-8">
        E-DIDS: Exhaustive Distributed Intrusion Detection System - Created by Md.Hriday Khan
      </div>
    </div>
  );
}