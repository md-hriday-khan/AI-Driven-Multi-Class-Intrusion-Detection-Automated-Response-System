import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, Activity, AlertTriangle, Eye, Target, Lock, Network, Zap, 
  Database, FileCheck, Users, Clock, CheckCircle, XCircle, AlertOctagon,
  Brain, Cpu, Globe, Server, HardDrive, Smartphone, Router, Monitor
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface XDREvent {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: 'endpoint' | 'network' | 'email' | 'cloud' | 'identity';
  eventType: string;
  description: string;
  affectedAssets: string[];
  status: 'active' | 'investigating' | 'contained' | 'resolved';
  correlationId?: string;
  ioc: string[];
  mitreTactic: string;
  automatedActions: string[];
}

interface ThreatHunting {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'scheduled';
  findings: number;
  riskScore: number;
  createdBy: string;
  lastRun: Date;
}

interface ResponseAction {
  id: string;
  action: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  target: string;
  executionTime: Date;
  result?: string;
  automatedBy: string;
}

const ExtendedDetectionResponse: React.FC = () => {
  const [xdrEvents, setXdrEvents] = useState<XDREvent[]>([]);
  const [threatHunts, setThreatHunts] = useState<ThreatHunting[]>([]);
  const [responseActions, setResponseActions] = useState<ResponseAction[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<XDREvent | null>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState(false);

  // Mock data generation
  useEffect(() => {
    const mockEvents: XDREvent[] = [
      {
        id: 'xdr-001',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        severity: 'critical',
        source: 'endpoint',
        eventType: 'Malware Execution',
        description: 'Suspicious process execution detected on endpoint WS-2024-001',
        affectedAssets: ['WS-2024-001', 'DC-MAIN-01'],
        status: 'investigating',
        correlationId: 'corr-001',
        ioc: ['hash:a1b2c3d4e5f6', 'ip:192.168.1.100'],
        mitreTactic: 'T1055 - Process Injection',
        automatedActions: ['Isolate Endpoint', 'Collect Forensics']
      },
      {
        id: 'xdr-002',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        severity: 'high',
        source: 'network',
        eventType: 'Lateral Movement',
        description: 'Abnormal network traffic pattern indicating potential lateral movement',
        affectedAssets: ['VLAN-100', 'VLAN-200'],
        status: 'contained',
        correlationId: 'corr-001',
        ioc: ['ip:10.0.0.45', 'port:4444'],
        mitreTactic: 'T1021 - Remote Services',
        automatedActions: ['Block Traffic', 'Alert SOC']
      },
      {
        id: 'xdr-003',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        severity: 'medium',
        source: 'email',
        eventType: 'Phishing Attempt',
        description: 'Suspicious email with malicious attachment detected',
        affectedAssets: ['user@company.com'],
        status: 'resolved',
        ioc: ['email:attacker@evil.com', 'hash:x1y2z3a4b5c6'],
        mitreTactic: 'T1566 - Phishing',
        automatedActions: ['Quarantine Email', 'Block Sender']
      }
    ];

    const mockHunts: ThreatHunting[] = [
      {
        id: 'hunt-001',
        name: 'Advanced Persistent Threat Hunt',
        description: 'Hunting for APT indicators in network traffic and endpoint logs',
        status: 'active',
        findings: 3,
        riskScore: 8.5,
        createdBy: 'Threat Hunter Team',
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'hunt-002',
        name: 'Insider Threat Detection',
        description: 'Behavioral analysis for potential insider threats',
        status: 'completed',
        findings: 1,
        riskScore: 6.2,
        createdBy: 'Security Analytics',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    const mockActions: ResponseAction[] = [
      {
        id: 'action-001',
        action: 'Isolate Endpoint',
        status: 'completed',
        target: 'WS-2024-001',
        executionTime: new Date(Date.now() - 8 * 60 * 1000),
        result: 'Successfully isolated endpoint from network',
        automatedBy: 'XDR Engine'
      },
      {
        id: 'action-002',
        action: 'Block Malicious IP',
        status: 'executing',
        target: '192.168.1.100',
        executionTime: new Date(Date.now() - 5 * 60 * 1000),
        automatedBy: 'Firewall Controller'
      }
    ];

    setXdrEvents(mockEvents);
    setThreatHunts(mockHunts);
    setResponseActions(mockActions);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'endpoint': return <Monitor className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'email': return <Users className="h-4 w-4" />;
      case 'cloud': return <Globe className="h-4 w-4" />;
      case 'identity': return <Lock className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4 text-red-500 animate-pulse" />;
      case 'investigating': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'contained': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const xdrMetrics = [
    { name: 'Active Incidents', value: xdrEvents.filter(e => e.status === 'active').length },
    { name: 'Mean Time to Detect', value: '4.2m', unit: '' },
    { name: 'Mean Time to Respond', value: '12.8m', unit: '' },
    { name: 'Auto-Contained', value: `${Math.round((responseActions.filter(a => a.status === 'completed').length / responseActions.length) * 100)}%`, unit: '' }
  ];

  const detectionTrendData = [
    { hour: '00:00', endpoints: 15, network: 8, email: 3, cloud: 2 },
    { hour: '04:00', endpoints: 12, network: 6, email: 1, cloud: 1 },
    { hour: '08:00', endpoints: 25, network: 15, email: 8, cloud: 4 },
    { hour: '12:00', endpoints: 22, network: 12, email: 6, cloud: 3 },
    { hour: '16:00', endpoints: 30, network: 18, email: 10, cloud: 5 },
    { hour: '20:00', endpoints: 20, network: 10, email: 4, cloud: 2 }
  ];

  const responseTimeData = [
    { name: 'Detection', time: 4.2 },
    { name: 'Analysis', time: 8.5 },
    { name: 'Containment', time: 12.8 },
    { name: 'Eradication', time: 28.5 },
    { name: 'Recovery', time: 45.2 }
  ];

  const coverageRadarData = [
    { subject: 'Endpoints', coverage: 95, fullMark: 100 },
    { subject: 'Network', coverage: 88, fullMark: 100 },
    { subject: 'Email', coverage: 92, fullMark: 100 },
    { subject: 'Cloud', coverage: 78, fullMark: 100 },
    { subject: 'Identity', coverage: 85, fullMark: 100 },
    { subject: 'Applications', coverage: 82, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Extended Detection & Response (XDR)
          </h2>
          <p className="text-slate-600 mt-2">Unified security platform with automated threat detection and response</p>
          <p className="text-xs text-slate-500 mt-1">Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setCorrelationAnalysis(!correlationAnalysis)}
            variant={correlationAnalysis ? 'default' : 'outline'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            {correlationAnalysis ? 'Stop Analysis' : 'Run Correlation'}
          </Button>
        </div>
      </div>

      {/* Real-time Correlation Alert */}
      {correlationAnalysis && (
        <Alert className="border-purple-200 bg-purple-50">
          <Brain className="h-4 w-4 text-purple-600 animate-pulse" />
          <AlertDescription>
            <div className="space-y-2">
              <span className="font-medium">AI Correlation Engine Active</span>
              <p className="text-sm">Cross-referencing events across all security domains for threat pattern identification...</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {xdrMetrics.map((metric, index) => (
          <Card key={index} className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}{metric.unit}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main XDR Dashboard */}
      <Tabs defaultValue="incidents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="hunting">Threat Hunting</TabsTrigger>
          <TabsTrigger value="response">Response Actions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="forensics">Forensics</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Incidents */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Active Security Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {xdrEvents.map((event) => (
                      <div 
                        key={event.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedEvent?.id === event.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(event.source)}
                            <span className="font-medium">{event.eventType}</span>
                            {event.correlationId && (
                              <Badge variant="outline" className="text-xs">
                                Correlated
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(event.status)}
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{event.description}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Assets: {event.affectedAssets.length}</span>
                          <span>{event.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-purple-600 font-medium">MITRE: {event.mitreTactic}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Incident Details */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Incident Timeline & Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEvent ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Event Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Event ID:</span>
                          <span className="font-mono">{selectedEvent.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Source:</span>
                          <span className="capitalize">{selectedEvent.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Status:</span>
                          <Badge variant="outline">{selectedEvent.status}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Indicators of Compromise</h4>
                      <div className="space-y-1">
                        {selectedEvent.ioc.map((indicator, index) => (
                          <div key={index} className="text-xs font-mono bg-gray-100 p-2 rounded">
                            {indicator}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Automated Actions</h4>
                      <div className="space-y-1">
                        {selectedEvent.automatedActions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Affected Assets</h4>
                      <div className="space-y-1">
                        {selectedEvent.affectedAssets.map((asset, index) => (
                          <Badge key={index} variant="secondary" className="mr-2">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <Eye className="h-8 w-8 mx-auto mb-2" />
                      <p>Select an incident to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hunting" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Threat Hunting Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatHunts.map((hunt) => (
                  <div key={hunt.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{hunt.name}</h4>
                        <p className="text-sm text-slate-600">{hunt.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={hunt.status === 'active' ? 'default' : 'secondary'}
                          className={hunt.status === 'active' ? 'bg-green-600' : ''}
                        >
                          {hunt.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          Risk: {hunt.riskScore}/10
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-4">
                        <span>Findings: {hunt.findings}</span>
                        <span>By: {hunt.createdBy}</span>
                      </div>
                      <span>Last Run: {hunt.lastRun.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Automated Response Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {responseActions.map((action) => (
                  <div key={action.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          action.status === 'completed' ? 'bg-green-100' :
                          action.status === 'executing' ? 'bg-yellow-100' :
                          action.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {action.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                           action.status === 'executing' ? <Activity className="h-4 w-4 text-yellow-600 animate-spin" /> :
                           action.status === 'failed' ? <XCircle className="h-4 w-4 text-red-600" /> :
                           <Clock className="h-4 w-4 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{action.action}</p>
                          <p className="text-sm text-slate-600">Target: {action.target}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={action.status === 'completed' ? 'default' : 'secondary'}
                        className={action.status === 'completed' ? 'bg-green-600' : ''}
                      >
                        {action.status.toUpperCase()}
                      </Badge>
                    </div>
                    {action.result && (
                      <p className="text-sm text-slate-700 mt-2">{action.result}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>Automated by: {action.automatedBy}</span>
                      <span>{action.executionTime.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detection Trends */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Detection Trends (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={detectionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="endpoints" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="network" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="email" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="cloud" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Incident Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="time" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Security Coverage Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={coverageRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar 
                      name="Coverage" 
                      dataKey="coverage" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forensics" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                Digital Forensics & Evidence Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    Automated forensics collection active for incident {selectedEvent?.id || 'xdr-001'}. 
                    Evidence chain maintained with cryptographic integrity.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium mb-2">Memory Dumps</h4>
                    <p className="text-sm text-slate-600">3 artifacts collected</p>
                    <Progress value={100} className="mt-2 h-2" />
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium mb-2">Network Captures</h4>
                    <p className="text-sm text-slate-600">150MB captured</p>
                    <Progress value={75} className="mt-2 h-2" />
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-medium mb-2">File System Evidence</h4>
                    <p className="text-sm text-slate-600">25 files collected</p>
                    <Progress value={90} className="mt-2 h-2" />
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

export default ExtendedDetectionResponse;