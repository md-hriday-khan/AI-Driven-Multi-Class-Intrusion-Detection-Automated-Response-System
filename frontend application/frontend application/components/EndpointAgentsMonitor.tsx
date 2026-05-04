import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Monitor, Activity, Shield, Cpu, HardDrive, Wifi, Users, MapPin,
  AlertTriangle, CheckCircle, XCircle, Clock, Zap, Eye, Settings,
  Database, Network, Lock, Smartphone, Server, Router, Brain
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EndpointAgent {
  id: string;
  hostname: string;
  ipAddress: string;
  osType: 'windows' | 'linux' | 'macos' | 'android' | 'ios';
  agentVersion: string;
  lastSeen: Date;
  status: 'online' | 'offline' | 'isolated' | 'compromised' | 'updating';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkActivity: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  autonomousActions: string[];
  behaviorScore: number;
  location: string;
  user: string;
  criticalProcesses: number;
}

interface SensorIntegrity {
  agentId: string;
  sensorType: 'file_monitor' | 'network_monitor' | 'process_monitor' | 'registry_monitor' | 'memory_monitor';
  status: 'healthy' | 'degraded' | 'failed' | 'tampered';
  lastCheck: Date;
  integrity: number;
  alerts: number;
}

interface BehaviorAnalytics {
  agentId: string;
  anomalyScore: number;
  baselineDeviation: number;
  suspiciousActivities: string[];
  userBehavior: {
    loginPatterns: number;
    fileAccess: number;
    networkUsage: number;
    processExecution: number;
  };
  machineLearningModel: string;
  confidenceLevel: number;
}

interface AutonomousResponse {
  id: string;
  agentId: string;
  triggerEvent: string;
  action: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'requires_approval';
  timestamp: Date;
  result?: string;
  humanApprovalRequired: boolean;
}

const EndpointAgentsMonitor: React.FC = () => {
  const [agents, setAgents] = useState<EndpointAgent[]>([]);
  const [sensorData, setSensorData] = useState<SensorIntegrity[]>([]);
  const [behaviorData, setBehaviorData] = useState<BehaviorAnalytics[]>([]);
  const [autonomousResponses, setAutonomousResponses] = useState<AutonomousResponse[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<EndpointAgent | null>(null);
  const [realTimeTracking, setRealTimeTracking] = useState(true);

  // Mock data generation
  useEffect(() => {
    const mockAgents: EndpointAgent[] = [
      {
        id: 'agent-001',
        hostname: 'WS-EXEC-001',
        ipAddress: '192.168.1.100',
        osType: 'windows',
        agentVersion: '3.2.1',
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        status: 'online',
        cpuUsage: 25,
        memoryUsage: 68,
        diskUsage: 45,
        networkActivity: 12,
        threatLevel: 'medium',
        autonomousActions: ['Process Monitoring', 'Network Filtering', 'File Integrity'],
        behaviorScore: 7.2,
        location: 'Building A - Floor 15',
        user: 'john.doe',
        criticalProcesses: 3
      },
      {
        id: 'agent-002',
        hostname: 'SRV-DB-001',
        ipAddress: '10.0.1.50',
        osType: 'linux',
        agentVersion: '3.2.1',
        lastSeen: new Date(Date.now() - 2 * 60 * 1000),
        status: 'online',
        cpuUsage: 85,
        memoryUsage: 92,
        diskUsage: 78,
        networkActivity: 45,
        threatLevel: 'high',
        autonomousActions: ['Database Protection', 'Connection Monitoring', 'Query Analysis'],
        behaviorScore: 8.9,
        location: 'Data Center A',
        user: 'database_service',
        criticalProcesses: 8
      },
      {
        id: 'agent-003',
        hostname: 'LAPTOP-DEV-005',
        ipAddress: '192.168.2.25',
        osType: 'macos',
        agentVersion: '3.1.9',
        lastSeen: new Date(Date.now() - 45 * 60 * 1000),
        status: 'isolated',
        cpuUsage: 15,
        memoryUsage: 32,
        diskUsage: 67,
        networkActivity: 0,
        threatLevel: 'critical',
        autonomousActions: ['Quarantine Mode', 'Threat Containment'],
        behaviorScore: 9.8,
        location: 'Remote - Home Office',
        user: 'sarah.smith',
        criticalProcesses: 1
      }
    ];

    const mockSensorData: SensorIntegrity[] = [
      {
        agentId: 'agent-001',
        sensorType: 'file_monitor',
        status: 'healthy',
        lastCheck: new Date(Date.now() - 5 * 60 * 1000),
        integrity: 98,
        alerts: 0
      },
      {
        agentId: 'agent-001',
        sensorType: 'network_monitor',
        status: 'healthy',
        lastCheck: new Date(Date.now() - 3 * 60 * 1000),
        integrity: 95,
        alerts: 2
      },
      {
        agentId: 'agent-002',
        sensorType: 'process_monitor',
        status: 'degraded',
        lastCheck: new Date(Date.now() - 10 * 60 * 1000),
        integrity: 87,
        alerts: 5
      },
      {
        agentId: 'agent-003',
        sensorType: 'memory_monitor',
        status: 'tampered',
        lastCheck: new Date(Date.now() - 30 * 60 * 1000),
        integrity: 45,
        alerts: 12
      }
    ];

    const mockBehaviorData: BehaviorAnalytics[] = [
      {
        agentId: 'agent-001',
        anomalyScore: 3.2,
        baselineDeviation: 15,
        suspiciousActivities: ['Unusual login time', 'Excessive file access'],
        userBehavior: {
          loginPatterns: 85,
          fileAccess: 120,
          networkUsage: 95,
          processExecution: 78
        },
        machineLearningModel: 'LSTM-Behavior-v2.1',
        confidenceLevel: 92
      },
      {
        agentId: 'agent-002',
        anomalyScore: 8.7,
        baselineDeviation: 45,
        suspiciousActivities: ['Database admin actions outside hours', 'Unusual query patterns', 'High privilege escalation'],
        userBehavior: {
          loginPatterns: 45,
          fileAccess: 220,
          networkUsage: 180,
          processExecution: 156
        },
        machineLearningModel: 'LSTM-Behavior-v2.1',
        confidenceLevel: 97
      }
    ];

    const mockAutonomousResponses: AutonomousResponse[] = [
      {
        id: 'resp-001',
        agentId: 'agent-003',
        triggerEvent: 'Malware signature detected',
        action: 'Isolate endpoint and quarantine files',
        status: 'completed',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        result: 'Successfully isolated endpoint, 3 files quarantined',
        humanApprovalRequired: false
      },
      {
        id: 'resp-002',
        agentId: 'agent-002',
        triggerEvent: 'Suspicious database activity',
        action: 'Restrict database permissions',
        status: 'requires_approval',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        humanApprovalRequired: true
      }
    ];

    setAgents(mockAgents);
    setSensorData(mockSensorData);
    setBehaviorData(mockBehaviorData);
    setAutonomousResponses(mockAutonomousResponses);
  }, []);

  // Real-time updates simulation
  useEffect(() => {
    if (!realTimeTracking) return;

    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        cpuUsage: Math.max(0, Math.min(100, agent.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(0, Math.min(100, agent.memoryUsage + (Math.random() - 0.5) * 5)),
        networkActivity: Math.max(0, agent.networkActivity + (Math.random() - 0.5) * 20),
        lastSeen: agent.status === 'online' ? new Date() : agent.lastSeen
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeTracking]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50 border-green-200';
      case 'offline': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'isolated': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'compromised': return 'text-red-600 bg-red-50 border-red-200';
      case 'updating': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOSIcon = (osType: string) => {
    switch (osType) {
      case 'windows': return <Monitor className="h-4 w-4" />;
      case 'linux': return <Server className="h-4 w-4" />;
      case 'macos': return <Monitor className="h-4 w-4" />;
      case 'android': return <Smartphone className="h-4 w-4" />;
      case 'ios': return <Smartphone className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getSensorStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'tampered': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const agentMetrics = [
    { name: 'Total Agents', value: agents.length },
    { name: 'Online', value: agents.filter(a => a.status === 'online').length },
    { name: 'High Risk', value: agents.filter(a => a.threatLevel === 'high' || a.threatLevel === 'critical').length },
    { name: 'Autonomous Actions', value: autonomousResponses.filter(r => r.status === 'completed').length }
  ];

  const osDistribution = [
    { name: 'Windows', value: agents.filter(a => a.osType === 'windows').length, color: '#8b5cf6' },
    { name: 'Linux', value: agents.filter(a => a.osType === 'linux').length, color: '#06b6d4' },
    { name: 'macOS', value: agents.filter(a => a.osType === 'macos').length, color: '#10b981' },
    { name: 'Mobile', value: agents.filter(a => a.osType === 'android' || a.osType === 'ios').length, color: '#f59e0b' }
  ];

  const performanceTrendData = [
    { time: '00:00', cpu: 15, memory: 45, network: 8 },
    { time: '04:00', cpu: 12, memory: 42, network: 5 },
    { time: '08:00', cpu: 35, memory: 65, network: 25 },
    { time: '12:00', cpu: 42, memory: 72, network: 38 },
    { time: '16:00', cpu: 38, memory: 68, network: 32 },
    { time: '20:00', cpu: 25, memory: 55, network: 18 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Endpoint Agents & Autonomous Systems
          </h2>
          <p className="text-slate-600 mt-2">Real-time monitoring of endpoint agents, sensor integrity, and behavior analytics</p>
          <p className="text-xs text-slate-500 mt-1">Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setRealTimeTracking(!realTimeTracking)}
            variant={realTimeTracking ? 'default' : 'outline'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {realTimeTracking ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-pulse" />
                Live Tracking
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Start Tracking
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Real-time Status */}
      {realTimeTracking && (
        <Alert className="border-green-200 bg-green-50">
          <Activity className="h-4 w-4 text-green-600 animate-pulse" />
          <AlertDescription>
            <span className="font-medium">Real-time tracking active</span> - Monitoring {agents.length} endpoints with autonomous system integration
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {agentMetrics.map((metric, index) => (
          <Card key={index} className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Monitor className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="sensors">Sensor Integrity</TabsTrigger>
          <TabsTrigger value="behavior">Behavior Analytics</TabsTrigger>
          <TabsTrigger value="autonomous">Autonomous Response</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="topology">Network Topology</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agents List */}
            <div className="lg:col-span-2">
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-purple-600" />
                    Endpoint Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {agents.map((agent) => (
                        <div 
                          key={agent.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedAgent?.id === agent.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg">
                                {getOSIcon(agent.osType)}
                              </div>
                              <div>
                                <p className="font-medium">{agent.hostname}</p>
                                <p className="text-sm text-slate-600">{agent.ipAddress} • {agent.user}</p>
                                <p className="text-xs text-slate-500">{agent.location}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge className={getStatusColor(agent.status)}>
                                {agent.status.toUpperCase()}
                              </Badge>
                              <Badge className={getThreatLevelColor(agent.threatLevel)}>
                                {agent.threatLevel.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500">CPU:</span>
                              <div className="flex items-center gap-1 mt-1">
                                <Progress value={agent.cpuUsage} className="h-1 flex-1" />
                                <span>{agent.cpuUsage}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">Memory:</span>
                              <div className="flex items-center gap-1 mt-1">
                                <Progress value={agent.memoryUsage} className="h-1 flex-1" />
                                <span>{agent.memoryUsage}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">Disk:</span>
                              <div className="flex items-center gap-1 mt-1">
                                <Progress value={agent.diskUsage} className="h-1 flex-1" />
                                <span>{agent.diskUsage}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">Network:</span>
                              <div className="flex items-center gap-1 mt-1">
                                <Activity className="h-3 w-3 text-purple-500" />
                                <span>{agent.networkActivity.toFixed(1)}MB/s</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>Last seen: {agent.lastSeen.toLocaleTimeString()}</span>
                            <span>Behavior: {agent.behaviorScore}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Agent Details */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Agent Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAgent ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">System Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Hostname:</span>
                          <span className="font-mono">{selectedAgent.hostname}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">OS Type:</span>
                          <span className="capitalize">{selectedAgent.osType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Agent Version:</span>
                          <span>{selectedAgent.agentVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Critical Processes:</span>
                          <span>{selectedAgent.criticalProcesses}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Autonomous Actions</h4>
                      <div className="space-y-1">
                        {selectedAgent.autonomousActions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>CPU Usage</span>
                            <span>{selectedAgent.cpuUsage}%</span>
                          </div>
                          <Progress value={selectedAgent.cpuUsage} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Memory Usage</span>
                            <span>{selectedAgent.memoryUsage}%</span>
                          </div>
                          <Progress value={selectedAgent.memoryUsage} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Disk Usage</span>
                            <span>{selectedAgent.diskUsage}%</span>
                          </div>
                          <Progress value={selectedAgent.diskUsage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <Monitor className="h-8 w-8 mx-auto mb-2" />
                      <p>Select an agent to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* OS Distribution */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Operating System Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={osDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {osDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {osDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm text-slate-600">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Sensor Integrity Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sensorData.map((sensor, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getSensorStatusIcon(sensor.status)}
                        <div>
                          <p className="font-medium capitalize">{sensor.sensorType.replace('_', ' ')}</p>
                          <p className="text-sm text-slate-600">Agent: {sensor.agentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={sensor.status === 'healthy' ? 'default' : 'destructive'}
                          className={sensor.status === 'healthy' ? 'bg-green-600' : ''}
                        >
                          {sensor.status.toUpperCase()}
                        </Badge>
                        {sensor.alerts > 0 && (
                          <Badge variant="destructive">
                            {sensor.alerts} alerts
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Integrity</span>
                          <span>{sensor.integrity}%</span>
                        </div>
                        <Progress value={sensor.integrity} className="h-2" />
                      </div>
                      <div className="ml-4 text-xs text-slate-500">
                        Last check: {sensor.lastCheck.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Behavior Analytics & AI Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {behaviorData.map((behavior, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Agent: {behavior.agentId}</h4>
                        <p className="text-sm text-slate-600">Model: {behavior.machineLearningModel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={behavior.anomalyScore > 7 ? 'destructive' : behavior.anomalyScore > 4 ? 'secondary' : 'default'}
                          className={behavior.anomalyScore <= 4 ? 'bg-green-600' : ''}
                        >
                          Anomaly: {behavior.anomalyScore}/10
                        </Badge>
                        <Badge variant="outline">
                          Confidence: {behavior.confidenceLevel}%
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Behavior Metrics</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Login Patterns:</span>
                            <span>{behavior.userBehavior.loginPatterns}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>File Access:</span>
                            <span>{behavior.userBehavior.fileAccess}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Network Usage:</span>
                            <span>{behavior.userBehavior.networkUsage}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Process Execution:</span>
                            <span>{behavior.userBehavior.processExecution}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2">Suspicious Activities</h5>
                        <div className="space-y-1">
                          {behavior.suspiciousActivities.map((activity, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              <span>{activity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Baseline Deviation</span>
                        <span>{behavior.baselineDeviation}%</span>
                      </div>
                      <Progress value={behavior.baselineDeviation} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autonomous" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Autonomous Response Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {autonomousResponses.map((response) => (
                  <div key={response.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{response.action}</p>
                        <p className="text-sm text-slate-600">Agent: {response.agentId}</p>
                        <p className="text-xs text-slate-500">Trigger: {response.triggerEvent}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {response.humanApprovalRequired && (
                          <Badge variant="destructive">
                            Approval Required
                          </Badge>
                        )}
                        <Badge 
                          variant={response.status === 'completed' ? 'default' : 
                                  response.status === 'requires_approval' ? 'destructive' : 'secondary'}
                          className={response.status === 'completed' ? 'bg-green-600' : ''}
                        >
                          {response.status.toUpperCase().replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {response.result && (
                      <p className="text-sm text-slate-700 mb-2">{response.result}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Executed: {response.timestamp.toLocaleString()}</span>
                      {response.status === 'requires_approval' && (
                        <Button size="sm" className="h-6 text-xs bg-purple-600 hover:bg-purple-700">
                          Approve Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">System Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="memory" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="network" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topology" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-600" />
                Network Topology & Agent Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    Real-time network topology showing {agents.length} active agents across multiple locations and network segments.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium mb-2">Data Center A</h4>
                    <p className="text-sm text-slate-600">2 critical servers</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">All systems operational</span>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium mb-2">Building A - Floor 15</h4>
                    <p className="text-sm text-slate-600">15 workstations</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">1 medium threat detected</span>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium mb-2">Remote Locations</h4>
                    <p className="text-sm text-slate-600">8 remote workers</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs">1 isolated endpoint</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EndpointAgentsMonitor;