import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Shield, Ban, AlertTriangle, Activity, TrendingUp, Network, Lock, Zap, Eye, Settings, Target, Database, Clock, CheckCircle, XCircle, Play, Pause, RotateCw, Server } from 'lucide-react';

interface ThreatDetection {
  detection_id: string;
  timestamp: string;
  threat_type: string;
  severity: string;
  confidence: number;
  source_ip: string;
  target_ip: string;
  attack_vector: string;
  indicators: string[];
  mitigation_action: string;
  blocked: boolean;
  false_positive_risk: number;
}

interface BlockingRule {
  rule_id: string;
  rule_type: string;
  criteria: any;
  action: string;
  duration: number;
  created_at: string;
  expires_at: string;
  hit_count: number;
  last_triggered: string | null;
}

interface IPSMetrics {
  timestamp: string;
  packets_analyzed: number;
  threats_detected: number;
  threats_blocked: number;
  processing_latency: number;
  throughput_mbps: number;
  cpu_usage: number;
  memory_usage: number;
  active_rules: number;
  blocked_ips: number;
}

export function IntrusionPreventionSystem() {
  const [isActive, setIsActive] = useState(true);
  const [detections, setDetections] = useState<ThreatDetection[]>([]);
  const [blockingRules, setBlockingRules] = useState<BlockingRule[]>([]);
  const [metrics, setMetrics] = useState<IPSMetrics | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<ThreatDetection | null>(null);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  
  // Check backend connection
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5003/api/ips/health', { signal: AbortSignal.timeout(2000) });
        if (response.ok) {
          setBackendConnected(true);
        }
      } catch {
        setBackendConnected(false);
      } finally {
        setConnectionAttempted(true);
      }
    };
    checkBackend();
  }, []);
  
  // Fetch data from backend or use simulation
  useEffect(() => {
    if (!connectionAttempted) return;
    
    const interval = setInterval(async () => {
      if (backendConnected) {
        try {
          // Fetch from backend
          const [detectionsRes, rulesRes, blockedRes, metricsRes] = await Promise.all([
            fetch('http://localhost:5003/api/ips/detections?limit=50').catch(() => null),
            fetch('http://localhost:5003/api/ips/rules?limit=50').catch(() => null),
            fetch('http://localhost:5003/api/ips/blocked-ips').catch(() => null),
            fetch('http://localhost:5003/api/ips/metrics').catch(() => null)
          ]);
          
          if (detectionsRes?.ok) {
            const data = await detectionsRes.json();
            setDetections(data.detections || []);
          }
          if (rulesRes?.ok) {
            const data = await rulesRes.json();
            setBlockingRules(data.rules || []);
          }
          if (blockedRes?.ok) {
            const data = await blockedRes.json();
            setBlockedIPs(data.blocked_ips || []);
          }
          if (metricsRes?.ok) {
            const data = await metricsRes.json();
            if (data.metrics) {
              setMetrics({
                timestamp: data.timestamp,
                packets_analyzed: data.metrics.packets_analyzed,
                threats_detected: data.metrics.threats_detected,
                threats_blocked: data.metrics.threats_blocked,
                processing_latency: data.metrics.performance.processing_latency,
                throughput_mbps: data.metrics.performance.throughput_mbps,
                cpu_usage: data.metrics.performance.cpu_usage,
                memory_usage: data.metrics.performance.memory_usage,
                active_rules: blockingRules.length,
                blocked_ips: blockedIPs.length
              });
            }
          }
        } catch (error) {
          // Fallback to simulation
          generateNewDetection();
          updateMetrics();
          updateBlockingRules();
        }
      } else {
        // Use simulation
        generateNewDetection();
        updateMetrics();
        updateBlockingRules();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [backendConnected, connectionAttempted, blockingRules.length, blockedIPs.length]);

  const generateNewDetection = () => {
    if (Math.random() > 0.7) { // 30% chance of new detection
      const threatTypes = ['ddos', 'port_scan', 'malware', 'brute_force', 'data_exfiltration', 'sql_injection'];
      const severities = ['low', 'medium', 'high', 'critical'];
      const attackVectors = ['signature_match', 'ml_detection', 'behavioral', 'anomaly_detection'];
      const mitigationActions = ['block_ip', 'rate_limit', 'monitor', 'quarantine'];
      
      const sourceIPs = [
        '203.0.113.45', '198.51.100.88', '192.0.2.123', 
        '172.16.0.200', '10.0.0.150', '192.168.1.99'
      ];
      
      const targetIPs = [
        '192.168.1.10', '10.0.0.5', '172.16.0.1',
        '192.168.1.100', '10.0.0.25'
      ];

      const newDetection: ThreatDetection = {
        detection_id: `det_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        threat_type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
        source_ip: sourceIPs[Math.floor(Math.random() * sourceIPs.length)],
        target_ip: targetIPs[Math.floor(Math.random() * targetIPs.length)],
        attack_vector: attackVectors[Math.floor(Math.random() * attackVectors.length)],
        indicators: generateIndicators(),
        mitigation_action: mitigationActions[Math.floor(Math.random() * mitigationActions.length)],
        blocked: Math.random() > 0.3, // 70% blocked
        false_positive_risk: Math.random() * 0.3 // 0-0.3
      };

      setDetections(prev => [newDetection, ...prev.slice(0, 49)]);
      
      // Add to blocked IPs if blocked
      if (newDetection.blocked && newDetection.mitigation_action === 'block_ip') {
        setBlockedIPs(prev => Array.from(new Set([newDetection.source_ip, ...prev])).slice(0, 20));
      }
    }
  };

  const generateIndicators = (): string[] => {
    const possibleIndicators = [
      'High packet rate detected',
      'Suspicious payload pattern',
      'Multiple port connections',
      'Known malware signature',
      'Abnormal data transfer volume',
      'Failed authentication attempts',
      'SQL injection pattern',
      'XSS attack pattern',
      'Buffer overflow attempt',
      'Command injection detected'
    ];
    
    const count = Math.floor(Math.random() * 3) + 1;
    return possibleIndicators.slice(0, count);
  };

  const updateMetrics = () => {
    const newMetrics: IPSMetrics = {
      timestamp: new Date().toISOString(),
      packets_analyzed: Math.floor(Math.random() * 10000) + 50000,
      threats_detected: detections.length,
      threats_blocked: detections.filter(d => d.blocked).length,
      processing_latency: Math.random() * 0.5 + 0.1, // 0.1-0.6 ms
      throughput_mbps: Math.random() * 100 + 500, // 500-600 Mbps
      cpu_usage: Math.random() * 30 + 20, // 20-50%
      memory_usage: Math.random() * 20 + 40, // 40-60%
      active_rules: blockingRules.length,
      blocked_ips: blockedIPs.length
    };

    setMetrics(newMetrics);
  };

  const updateBlockingRules = () => {
    // Occasionally add new rules
    if (Math.random() > 0.8 && blockingRules.length < 20) {
      const ruleTypes = ['ip_block', 'port_block', 'rate_limit', 'pattern_block'];
      const actions = ['block', 'monitor', 'rate_limit'];
      
      const newRule: BlockingRule = {
        rule_id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        rule_type: ruleTypes[Math.floor(Math.random() * ruleTypes.length)],
        criteria: { ip_address: `192.168.1.${Math.floor(Math.random() * 255)}` },
        action: actions[Math.floor(Math.random() * actions.length)],
        duration: Math.floor(Math.random() * 7200) + 1800, // 30min - 2hours
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (Math.floor(Math.random() * 7200) + 1800) * 1000).toISOString(),
        hit_count: Math.floor(Math.random() * 10),
        last_triggered: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null
      };

      setBlockingRules(prev => [newRule, ...prev]);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-black';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getThreatTypeIcon = (threatType: string) => {
    switch (threatType) {
      case 'ddos': return <Zap className="h-4 w-4" />;
      case 'port_scan': return <Eye className="h-4 w-4" />;
      case 'malware': return <AlertTriangle className="h-4 w-4" />;
      case 'brute_force': return <Lock className="h-4 w-4" />;
      case 'data_exfiltration': return <Database className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const toggleSystemStatus = () => {
    setIsActive(!isActive);
  };

  const removeBlockedIP = (ip: string) => {
    setBlockedIPs(prev => prev.filter(blockedIP => blockedIP !== ip));
  };

  const blockIP = (ip: string) => {
    if (!blockedIPs.includes(ip)) {
      setBlockedIPs(prev => [ip, ...prev]);
    }
  };

  // Calculate statistics
  const detectionsByType = detections.reduce((acc, det) => {
    acc[det.threat_type] = (acc[det.threat_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const detectionsBySeverity = detections.reduce((acc, det) => {
    acc[det.severity] = (acc[det.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentMetrics = Array.from({ length: 10 }, (_, i) => ({
    time: new Date(Date.now() - (9 - i) * 30000).toLocaleTimeString(),
    threats: Math.floor(Math.random() * 20) + 5,
    blocked: Math.floor(Math.random() * 15) + 10,
    throughput: Math.random() * 100 + 400
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Intrusion Prevention System
            </h2>
            <Badge className={isActive ? 'bg-green-600' : 'bg-red-600'}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
            {backendConnected ? (
              <Badge className="bg-blue-600">
                <Server className="h-3 w-3 mr-1" />
                Backend Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                Simulation Mode
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleSystemStatus}
            className={`${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isActive ? 'Disable IPS' : 'Enable IPS'}
          </Button>
          
          <Button variant="outline" className="border-slate-600">
            <RotateCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Packets Analyzed</CardTitle>
            <Activity className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.packets_analyzed.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-blue-200">
              {metrics?.throughput_mbps.toFixed(1) || '0'} Mbps throughput
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{detections.length}</div>
            <p className="text-xs text-red-200">
              {detections.filter(d => new Date(d.timestamp) > new Date(Date.now() - 3600000)).length} in last hour
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Threats Blocked</CardTitle>
            <Ban className="h-4 w-4 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {detections.filter(d => d.blocked).length}
            </div>
            <p className="text-xs text-green-200">
              {((detections.filter(d => d.blocked).length / detections.length) * 100 || 0).toFixed(1)}% block rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{blockingRules.length}</div>
            <p className="text-xs text-purple-200">Dynamic blocking rules</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Blocked IPs</CardTitle>
            <Target className="h-4 w-4 text-orange-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{blockedIPs.length}</div>
            <p className="text-xs text-orange-200">Actively blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="detections" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="detections" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Threat Detections
          </TabsTrigger>
          <TabsTrigger value="blocking" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Blocking Rules
          </TabsTrigger>
          <TabsTrigger value="blocked-ips" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Blocked IPs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detections" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detections List */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Recent Threat Detections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {detections.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                          No threat detections
                        </div>
                      ) : (
                        detections.map((detection) => (
                          <div
                            key={detection.detection_id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedDetection?.detection_id === detection.detection_id
                                ? 'border-blue-500 bg-blue-950/20'
                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                            }`}
                            onClick={() => setSelectedDetection(detection)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getThreatTypeIcon(detection.threat_type)}
                                <Badge className={getSeverityColor(detection.severity)}>
                                  {detection.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {detection.threat_type.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {detection.blocked ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-400" />
                                )}
                                <span className="text-xs text-slate-400">
                                  {detection.blocked ? 'BLOCKED' : 'ALLOWED'}
                                </span>
                              </div>
                            </div>

                            <div className="text-sm mb-2">
                              <div className="text-cyan-400 mb-1">
                                {detection.source_ip} → {detection.target_ip}
                              </div>
                              <div className="text-slate-300">
                                {detection.attack_vector} | Confidence: {(detection.confidence * 100).toFixed(1)}%
                              </div>
                              <div className="text-orange-400 text-xs">
                                Action: {detection.mitigation_action}
                              </div>
                            </div>

                            <div className="flex justify-between text-xs text-slate-400">
                              <span>{new Date(detection.timestamp).toLocaleString()}</span>
                              <span>FP Risk: {(detection.false_positive_risk * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Detection Details */}
            <div>
              {selectedDetection ? (
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader>
                    <CardTitle>Detection Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-cyan-400">Threat Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Type:</span>
                            <span>{selectedDetection.threat_type.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Severity:</span>
                            <Badge className={getSeverityColor(selectedDetection.severity)}>
                              {selectedDetection.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Confidence:</span>
                            <span>{(selectedDetection.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Attack Vector:</span>
                            <span>{selectedDetection.attack_vector}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-green-400">Network Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Source IP:</span>
                            <span className="font-mono text-cyan-400">{selectedDetection.source_ip}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target IP:</span>
                            <span className="font-mono text-cyan-400">{selectedDetection.target_ip}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status:</span>
                            <Badge className={selectedDetection.blocked ? 'bg-green-600' : 'bg-red-600'}>
                              {selectedDetection.blocked ? 'BLOCKED' : 'ALLOWED'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-purple-400">Indicators</h4>
                        <div className="space-y-1">
                          {selectedDetection.indicators.map((indicator, index) => (
                            <div key={index} className="text-sm text-slate-300">
                              • {indicator}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-yellow-400">Mitigation</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Action:</span>
                            <span>{selectedDetection.mitigation_action}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">FP Risk:</span>
                            <span>{(selectedDetection.false_positive_risk * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Timestamp:</span>
                            <span>{new Date(selectedDetection.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700"
                          onClick={() => blockIP(selectedDetection.source_ip)}
                        >
                          Block Source IP
                        </Button>
                        <Button variant="outline" className="w-full">
                          Create Custom Rule
                        </Button>
                        <Button variant="outline" className="w-full">
                          Export Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-slate-400">
                      <Eye className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a detection to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="blocking" className="mt-6">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-400" />
                Active Blocking Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {blockingRules.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      No active blocking rules
                    </div>
                  ) : (
                    blockingRules.map((rule) => (
                      <div
                        key={rule.rule_id}
                        className="p-3 rounded-lg border border-slate-700 bg-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{rule.rule_type.toUpperCase()}</Badge>
                            <Badge className="bg-blue-600">{rule.action.toUpperCase()}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-xs text-slate-400">
                              {Math.floor((new Date(rule.expires_at).getTime() - Date.now()) / 60000)}m left
                            </span>
                          </div>
                        </div>

                        <div className="text-sm mb-2">
                          <div className="text-cyan-400 mb-1">
                            Rule ID: {rule.rule_id}
                          </div>
                          <div className="text-slate-300">
                            Criteria: {JSON.stringify(rule.criteria)}
                          </div>
                          <div className="text-orange-400">
                            Hit Count: {rule.hit_count}
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Created: {new Date(rule.created_at).toLocaleString()}</span>
                          <span>
                            Last Triggered: {rule.last_triggered ? new Date(rule.last_triggered).toLocaleString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked-ips" className="mt-6">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-400" />
                Blocked IP Addresses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blockedIPs.length === 0 ? (
                  <div className="col-span-full text-center text-slate-400 py-8">
                    No blocked IP addresses
                  </div>
                ) : (
                  blockedIPs.map((ip, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono text-cyan-400">{ip}</div>
                        <div className="text-xs text-slate-400">
                          Blocked {Math.floor(Math.random() * 60) + 1} min ago
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-950"
                        onClick={() => removeBlockedIP(ip)}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Type Distribution */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Threat Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(detectionsByType).map(([type, count]) => ({
                        name: type.toUpperCase(),
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(detectionsByType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(detectionsBySeverity).map(([severity, count]) => ({
                    severity: severity.toUpperCase(),
                    count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="severity" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="count" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detection Timeline */}
            <Card className="bg-slate-900 border-slate-700 lg:col-span-2">
              <CardHeader>
                <CardTitle>Real-time Threat Detection Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={recentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Area type="monotone" dataKey="threats" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="blocked" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{metrics?.cpu_usage.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={metrics?.cpu_usage || 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{metrics?.memory_usage.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={metrics?.memory_usage || 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Processing Latency</span>
                      <span>{metrics?.processing_latency.toFixed(2) || 0} ms</span>
                    </div>
                    <Progress value={(metrics?.processing_latency || 0) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Throughput Analysis */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Network Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={recentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="throughput" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                      name="Throughput (Mbps)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}