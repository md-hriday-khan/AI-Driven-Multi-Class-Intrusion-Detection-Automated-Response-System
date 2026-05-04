import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, Brain, Zap, Target, AlertTriangle, CheckCircle, Server, Database, Cpu, Network, Shield, Eye, TrendingUp, TrendingDown, RotateCw, Settings, Bell, Clock } from 'lucide-react';

interface AIMetrics {
  timestamp: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confidence: number;
  latency: number;
  drift_score: number;
  calibration_error: number;
}

interface Anomaly {
  id: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_components: string[];
  root_cause: string;
  confidence: number;
  mitigation_applied: boolean;
  recommended_actions: string[];
}

interface SecurityThreat {
  id: string;
  timestamp: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  confidence: number;
  indicators: string[];
  mitigation_status: string;
}

interface SystemHealth {
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number;
  disk_io: number;
  network_io: number;
  prediction_throughput: number;
  error_rate: number;
  health_score: number;
}

export function AIMonitoringDashboard() {
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [adaptiveLearningActive, setAdaptiveLearningActive] = useState(true);
  const [autoMitigationEnabled, setAutoMitigationEnabled] = useState(true);
  
  // Data states
  const [aiMetrics, setAiMetrics] = useState<AIMetrics[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [securityThreats, setSecurityThreats] = useState<SecurityThreat[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu_usage: 0,
    memory_usage: 0,
    gpu_usage: 0,
    disk_io: 0,
    network_io: 0,
    prediction_throughput: 0,
    error_rate: 0,
    health_score: 0
  });
  
  // Performance metrics
  const [modelPerformance, setModelPerformance] = useState({
    accuracy_trend: 0,
    drift_detected: false,
    confidence_degradation: false,
    calibration_status: 'good'
  });
  
  // Feature importance and explanations
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time AI metrics
      const newMetric: AIMetrics = {
        timestamp: new Date().toISOString(),
        accuracy: 0.85 + Math.random() * 0.1,
        precision: 0.82 + Math.random() * 0.12,
        recall: 0.88 + Math.random() * 0.08,
        f1_score: 0.85 + Math.random() * 0.1,
        confidence: 0.75 + Math.random() * 0.2,
        latency: 0.02 + Math.random() * 0.03,
        drift_score: Math.random() * 0.3,
        calibration_error: Math.random() * 0.05
      };
      
      setAiMetrics(prev => [...prev.slice(-49), newMetric]);
      
      // Simulate system health
      setSystemHealth({
        cpu_usage: 40 + Math.random() * 30,
        memory_usage: 50 + Math.random() * 25,
        gpu_usage: 60 + Math.random() * 20,
        disk_io: Math.random() * 40,
        network_io: Math.random() * 30,
        prediction_throughput: 80 + Math.random() * 40,
        error_rate: Math.random() * 0.05,
        health_score: 0.7 + Math.random() * 0.25
      });
      
      // Occasionally generate anomalies
      if (Math.random() < 0.1) {
        generateRandomAnomaly();
      }
      
      // Occasionally generate security threats
      if (Math.random() < 0.05) {
        generateRandomThreat();
      }
      
      // Update performance trends
      updateModelPerformance();
      
    }, 5000);

    // Initialize feature importance data
    generateFeatureImportanceData();

    return () => clearInterval(interval);
  }, []);

  const generateRandomAnomaly = () => {
    const anomalyTypes = ['accuracy_degradation', 'latency_spike', 'confidence_drop', 'drift_detected', 'resource_exhaustion'];
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const components = ['model', 'inference_engine', 'data_pipeline', 'feature_extractor'];
    
    const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    const newAnomaly: Anomaly = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      description: getAnomalyDescription(type, severity),
      affected_components: [components[Math.floor(Math.random() * components.length)]],
      root_cause: getRootCause(type),
      confidence: 0.6 + Math.random() * 0.3,
      mitigation_applied: autoMitigationEnabled && (severity === 'high' || severity === 'critical'),
      recommended_actions: getRecommendedActions(type)
    };
    
    setAnomalies(prev => [newAnomaly, ...prev.slice(0, 19)]);
  };

  const generateRandomThreat = () => {
    const threatTypes = ['adversarial_inputs', 'model_extraction', 'data_poisoning', 'inference_attacks', 'resource_exhaustion'];
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const sources = ['192.168.1.100', '10.0.0.25', '172.16.0.50', '203.0.113.15'];
    
    const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    const newThreat: SecurityThreat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      threat_type: type,
      severity,
      source: sources[Math.floor(Math.random() * sources.length)],
      target: 'model_inference',
      confidence: 0.5 + Math.random() * 0.4,
      indicators: getThreatIndicators(type),
      mitigation_status: Math.random() > 0.5 ? 'detected' : 'mitigated'
    };
    
    setSecurityThreats(prev => [newThreat, ...prev.slice(0, 14)]);
  };

  const generateFeatureImportanceData = () => {
    const features = [
      'Flow Duration', 'Total Fwd Packets', 'Total Bwd Packets', 'Packet Length Mean',
      'Flow Bytes/s', 'Flow Packets/s', 'Flow IAT Mean', 'Fwd Header Length',
      'PSH Flag Count', 'URG Flag Count', 'SYN Flag Count', 'ACK Flag Count',
      'Down/Up Ratio', 'Average Packet Size', 'Fwd Packets/s', 'Active Mean'
    ];
    
    const importanceData = features.map(feature => ({
      feature,
      importance: Math.random() * 0.8 + 0.2,
      contribution: (Math.random() - 0.5) * 2,
      stability: Math.random() * 0.5 + 0.5
    })).sort((a, b) => b.importance - a.importance);
    
    setFeatureImportance(importanceData);
  };

  const updateModelPerformance = () => {
    if (aiMetrics.length > 10) {
      const recentMetrics = aiMetrics.slice(-10);
      const olderMetrics = aiMetrics.slice(-20, -10);
      
      if (olderMetrics.length > 0) {
        const recentAccuracy = recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / recentMetrics.length;
        const olderAccuracy = olderMetrics.reduce((sum, m) => sum + m.accuracy, 0) / olderMetrics.length;
        
        setModelPerformance({
          accuracy_trend: recentAccuracy - olderAccuracy,
          drift_detected: recentMetrics.some(m => m.drift_score > 0.2),
          confidence_degradation: recentMetrics.some(m => m.confidence < 0.6),
          calibration_status: recentMetrics.some(m => m.calibration_error > 0.03) ? 'poor' : 'good'
        });
      }
    }
  };

  const getAnomalyDescription = (type: string, severity: string): string => {
    const descriptions: Record<string, string> = {
      accuracy_degradation: `Model accuracy dropped below threshold (${severity} impact)`,
      latency_spike: `Inference latency increased significantly (${severity} impact)`,
      confidence_drop: `Model confidence scores degraded (${severity} impact)`,
      drift_detected: `Data drift detected in feature distributions (${severity} impact)`,
      resource_exhaustion: `System resources approaching limits (${severity} impact)`
    };
    return descriptions[type] || `Unknown anomaly type: ${type}`;
  };

  const getRootCause = (type: string): string => {
    const causes: Record<string, string> = {
      accuracy_degradation: 'data_distribution_shift',
      latency_spike: 'resource_bottleneck',
      confidence_drop: 'model_uncertainty',
      drift_detected: 'feature_distribution_change',
      resource_exhaustion: 'high_load'
    };
    return causes[type] || 'unknown';
  };

  const getRecommendedActions = (type: string): string[] => {
    const actions: Record<string, string[]> = {
      accuracy_degradation: ['Retrain model with recent data', 'Adjust detection thresholds', 'Review feature importance'],
      latency_spike: ['Scale up infrastructure', 'Optimize model', 'Enable load balancing'],
      confidence_drop: ['Update training data', 'Recalibrate model', 'Enable ensemble methods'],
      drift_detected: ['Update reference data', 'Retrain model', 'Adjust feature weights'],
      resource_exhaustion: ['Scale resources', 'Implement rate limiting', 'Optimize processing']
    };
    return actions[type] || ['Manual investigation required'];
  };

  const getThreatIndicators = (type: string): string[] => {
    const indicators: Record<string, string[]> = {
      adversarial_inputs: ['Extreme feature values', 'Unusual input patterns'],
      model_extraction: ['High request frequency', 'Systematic querying'],
      data_poisoning: ['Suspicious feedback patterns', 'Label inconsistencies'],
      inference_attacks: ['Repeated similar queries', 'Privacy probing'],
      resource_exhaustion: ['High CPU usage', 'Memory exhaustion']
    };
    return indicators[type] || ['Unknown indicators'];
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

  const getHealthStatus = (score: number) => {
    if (score > 0.8) return { status: 'Excellent', color: 'text-green-400' };
    if (score > 0.6) return { status: 'Good', color: 'text-blue-400' };
    if (score > 0.4) return { status: 'Warning', color: 'text-yellow-400' };
    return { status: 'Critical', color: 'text-red-400' };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            AI Monitoring & Observability Control Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <span className="text-sm">Performance Monitoring</span>
              </div>
              <Switch
                checked={monitoringActive}
                onCheckedChange={setMonitoringActive}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-sm">Adaptive Learning</span>
              </div>
              <Switch
                checked={adaptiveLearningActive}
                onCheckedChange={setAdaptiveLearningActive}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm">Auto-Mitigation</span>
              </div>
              <Switch
                checked={autoMitigationEnabled}
                onCheckedChange={setAutoMitigationEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">System Health</CardTitle>
            <Activity className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(systemHealth.health_score * 100).toFixed(1)}%</div>
            <p className={`text-xs ${getHealthStatus(systemHealth.health_score).color}`}>
              {getHealthStatus(systemHealth.health_score).status}
            </p>
            <Progress 
              value={systemHealth.health_score * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Model Accuracy</CardTitle>
            {modelPerformance.accuracy_trend > 0 ? 
              <TrendingUp className="h-4 w-4 text-green-300" /> :
              <TrendingDown className="h-4 w-4 text-red-300" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {aiMetrics.length > 0 ? (aiMetrics[aiMetrics.length - 1].accuracy * 100).toFixed(1) : '0.0'}%
            </div>
            <p className={`text-xs ${modelPerformance.accuracy_trend > 0 ? 'text-green-300' : 'text-red-300'}`}>
              {modelPerformance.accuracy_trend > 0 ? '+' : ''}{(modelPerformance.accuracy_trend * 100).toFixed(2)}% trend
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Active Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{anomalies.length}</div>
            <p className="text-xs text-purple-200">
              {anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Security Threats</CardTitle>
            <Shield className="h-4 w-4 text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{securityThreats.length}</div>
            <p className="text-xs text-red-200">
              {securityThreats.filter(t => t.mitigation_status === 'detected').length} unmitigated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="explainability" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Explainability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Resource Usage */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>System Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{systemHealth.cpu_usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={systemHealth.cpu_usage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{systemHealth.memory_usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={systemHealth.memory_usage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>GPU Usage</span>
                      <span>{systemHealth.gpu_usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={systemHealth.gpu_usage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Prediction Throughput</span>
                      <span>{systemHealth.prediction_throughput.toFixed(0)} pred/s</span>
                    </div>
                    <Progress value={(systemHealth.prediction_throughput / 150) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Performance Trends */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Model Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aiMetrics.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString().slice(0, 5)}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} name="Accuracy" />
                    <Line type="monotone" dataKey="confidence" stroke="#3B82F6" strokeWidth={2} name="Confidence" />
                    <Line type="monotone" dataKey="latency" stroke="#F59E0B" strokeWidth={2} name="Latency (x10)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detailed Performance Metrics */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Performance Metrics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={aiMetrics.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString().slice(0, 5)}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Area type="monotone" dataKey="accuracy" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="precision" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="recall" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Drift Detection */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Data Drift Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className={modelPerformance.drift_detected ? 'border-red-600 bg-red-950/20' : 'border-green-600 bg-green-950/20'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>
                          Drift Status: {modelPerformance.drift_detected ? 'DETECTED' : 'NORMAL'}
                        </span>
                        <Badge className={modelPerformance.drift_detected ? 'bg-red-600' : 'bg-green-600'}>
                          {modelPerformance.drift_detected ? 'Action Required' : 'Stable'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 text-cyan-400">Calibration Status</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={modelPerformance.calibration_status === 'good' ? 'bg-green-600' : 'bg-orange-600'}>
                          {modelPerformance.calibration_status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 text-purple-400">Confidence Health</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={modelPerformance.confidence_degradation ? 'bg-red-600' : 'bg-green-600'}>
                          {modelPerformance.confidence_degradation ? 'DEGRADED' : 'HEALTHY'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={aiMetrics.slice(-20)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#9CA3AF"
                        tickFormatter={(value) => new Date(value).toLocaleTimeString().slice(0, 5)}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip />
                      <Line type="monotone" dataKey="drift_score" stroke="#EF4444" strokeWidth={2} name="Drift Score" />
                      <Line type="monotone" dataKey="calibration_error" stroke="#F59E0B" strokeWidth={2} name="Calibration Error" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anomaly List */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Detected Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {anomalies.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        No anomalies detected
                      </div>
                    ) : (
                      anomalies.map((anomaly) => (
                        <div 
                          key={anomaly.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAnomaly?.id === anomaly.id 
                              ? 'border-blue-500 bg-blue-950/20' 
                              : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                          }`}
                          onClick={() => setSelectedAnomaly(anomaly)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(anomaly.severity)}>
                                {anomaly.severity.toUpperCase()}
                              </Badge>
                              {anomaly.mitigation_applied && (
                                <Badge className="bg-green-600 text-white">
                                  MITIGATED
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(anomaly.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="text-sm mb-2">
                            <div className="font-medium text-orange-400 mb-1">
                              {anomaly.type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="text-slate-300">{anomaly.description}</div>
                          </div>

                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Root Cause: <span className="text-yellow-400">{anomaly.root_cause}</span></span>
                            <span>Confidence: <span className="text-green-400">{(anomaly.confidence * 100).toFixed(1)}%</span></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Anomaly Details */}
            {selectedAnomaly && (
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle>Anomaly Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-3 text-cyan-400">Anomaly Information</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Type:</span>
                          <div className="text-orange-400">{selectedAnomaly.type.replace(/_/g, ' ')}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Severity:</span>
                          <Badge className={getSeverityColor(selectedAnomaly.severity)}>
                            {selectedAnomaly.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-slate-400">Root Cause:</span>
                          <div className="text-yellow-400">{selectedAnomaly.root_cause}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Confidence:</span>
                          <div className="text-green-400">{(selectedAnomaly.confidence * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-3 text-green-400">Affected Components</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnomaly.affected_components.map((component, index) => (
                          <Badge key={index} variant="secondary">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-3 text-purple-400">Recommended Actions</h4>
                      <ul className="space-y-1 text-sm">
                        {selectedAnomaly.recommended_actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          // Simulate mitigation
                          setAnomalies(prev => prev.map(a => 
                            a.id === selectedAnomaly.id ? { ...a, mitigation_applied: true } : a
                          ));
                          setSelectedAnomaly(prev => prev ? { ...prev, mitigation_applied: true } : null);
                        }}
                        disabled={selectedAnomaly.mitigation_applied}
                      >
                        {selectedAnomaly.mitigation_applied ? 'Mitigation Applied' : 'Apply Mitigation'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          // Simulate dismissal
                          setAnomalies(prev => prev.filter(a => a.id !== selectedAnomaly.id));
                          setSelectedAnomaly(null);
                        }}
                      >
                        Dismiss Anomaly
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Threats */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  Security Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {securityThreats.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        No security threats detected
                      </div>
                    ) : (
                      securityThreats.map((threat) => (
                        <div 
                          key={threat.id}
                          className="p-3 rounded-lg border border-slate-700 bg-slate-800"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(threat.severity)}>
                                {threat.severity.toUpperCase()}
                              </Badge>
                              <Badge className={threat.mitigation_status === 'mitigated' ? 'bg-green-600' : 'bg-orange-600'}>
                                {threat.mitigation_status.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(threat.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="text-sm mb-2">
                            <div className="font-medium text-red-400 mb-1">
                              {threat.threat_type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Source: <span className="text-red-400">{threat.source}</span></span>
                              <span>Target: <span className="text-blue-400">{threat.target}</span></span>
                            </div>
                          </div>

                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Confidence: <span className="text-green-400">{(threat.confidence * 100).toFixed(1)}%</span></span>
                            <span>Indicators: {threat.indicators.length}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Threat Analysis */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Threat Analysis Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Threat Type Distribution */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-cyan-400">Threat Type Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            securityThreats.reduce((acc, threat) => {
                              acc[threat.threat_type] = (acc[threat.threat_type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(securityThreats.reduce((acc, threat) => {
                            acc[threat.threat_type] = (acc[threat.threat_type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Mitigation Status */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-green-400">Mitigation Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-green-400">
                          {securityThreats.filter(t => t.mitigation_status === 'mitigated').length}
                        </div>
                        <div className="text-xs text-slate-400">Mitigated</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-orange-400">
                          {securityThreats.filter(t => t.mitigation_status === 'detected').length}
                        </div>
                        <div className="text-xs text-slate-400">Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="explainability" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Importance */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Global Feature Importance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={featureImportance.slice(0, 10)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9CA3AF" />
                    <YAxis dataKey="feature" type="category" stroke="#9CA3AF" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="importance" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Contributions */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Feature Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={featureImportance.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="feature" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="contribution" fill={(entry: any) => entry.contribution > 0 ? '#10B981' : '#EF4444'} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Model Calibration */}
            <Card className="bg-slate-900 border-slate-700 lg:col-span-2">
              <CardHeader>
                <CardTitle>Model Calibration Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-cyan-400">Calibration Score</h4>
                    <div className="text-2xl font-bold text-white">
                      {aiMetrics.length > 0 ? (1 - aiMetrics[aiMetrics.length - 1].calibration_error).toFixed(3) : '0.000'}
                    </div>
                    <p className="text-xs text-slate-400">Higher is better</p>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-purple-400">Confidence Reliability</h4>
                    <div className="text-2xl font-bold text-white">
                      {modelPerformance.calibration_status === 'good' ? '95.2%' : '78.3%'}
                    </div>
                    <p className="text-xs text-slate-400">Prediction confidence accuracy</p>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-green-400">Explanation Coverage</h4>
                    <div className="text-2xl font-bold text-white">92.7%</div>
                    <p className="text-xs text-slate-400">Predictions with explanations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}