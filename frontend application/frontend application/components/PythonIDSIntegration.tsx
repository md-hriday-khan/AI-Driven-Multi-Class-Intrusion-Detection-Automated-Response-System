import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Activity, Brain, Zap, Target, AlertTriangle, CheckCircle, Server, Database, Cpu, Network } from 'lucide-react';

interface PythonIDSData {
  type?: string; // Added for system messages
  timestamp: string;
  flow_key: string;
  features: number[];
  anomaly_score: number;
  confidence: number;
  is_attack: boolean;
  stats: {
    packets_processed: number;
    flows_active: number;
    attacks_detected: number;
    runtime_seconds: number;
    packets_per_second: number;
    detection_rate: number;
    cpu_usage?: number;
    memory_usage?: number;
  };
}

interface SystemStatus {
  python_ids_running: boolean;
  websocket_connected: boolean;
  last_update: string;
  processing_rate: number;
  memory_usage: number;
  cpu_usage: number;
  models_loaded: boolean;
  available_models: string[];
}

interface AttackFlow {
  id: string;
  timestamp: number;
  source_ip: string;
  dest_ip: string;
  anomaly_score: number;
  confidence: number;
  attack_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'analyzed' | 'blocked' | 'mitigated';
}

const API_BASE_URL = 'http://localhost:8000';

export function PythonIDSIntegration() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    python_ids_running: false,
    websocket_connected: false,
    last_update: '',
    processing_rate: 0,
    memory_usage: 0,
    cpu_usage: 0,
    models_loaded: false,
    available_models: []
  });
  
  const [realtimeData, setRealtimeData] = useState<PythonIDSData[]>([]);
  const [attackFlows, setAttackFlows] = useState<AttackFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<AttackFlow | null>(null);
  const [anomalyHistory, setAnomalyHistory] = useState<any[]>([]);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Feature names matching your backend
  const featureNames = [
    'Avg Packet Size', 'Packet Length Mean', 'Bwd Packet Length Std', 'Packet Length Variance',
    'Bwd Packet Length Max', 'Packet Length Max', 'Packet Length Std', 'Fwd Packet Length Mean',
    'Avg Fwd Segment Size', 'Flow Bytes/s', 'Avg Bwd Segment Size', 'Bwd Packet Length Mean',
    'Fwd Packets/s', 'Flow Packets/s', 'Init Fwd Win Bytes', 'Subflow Fwd Bytes',
    'Fwd Packets Length Total', 'Fwd Act Data Packets', 'Total Fwd Packets', 'Subflow Fwd Packets'
  ];

  // Fetch system status on component mount
  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection for real-time data
  useEffect(() => {
    if (isMonitoring) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [isMonitoring]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('📊 System Status Updated:', {
      processing_rate: systemStatus.processing_rate,
      cpu_usage: systemStatus.cpu_usage,
      memory_usage: systemStatus.memory_usage,
      realtimeDataLength: realtimeData.length,
      anomalyHistoryLength: anomalyHistory.length
    });
  }, [systemStatus.processing_rate, systemStatus.cpu_usage, systemStatus.memory_usage]);

  useEffect(() => {
    console.log('📈 Anomaly History Updated:', anomalyHistory.length, 'points');
  }, [anomalyHistory]);

  useEffect(() => {
    console.log('⚡ Real-time Data Updated:', realtimeData.length, 'flows');
  }, [realtimeData]);

  // Initialize anomaly history with some data
  useEffect(() => {
    if (anomalyHistory.length === 0 && isMonitoring) {
      // Add some initial data points so charts aren't empty
      const initialHistory = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - (10 - i) * 1000,
        anomaly_score: 0.1,
        confidence: 0.7,
        is_attack: 0,
        packets_processed: 0,
        detection_rate: 0,
        packets_per_second: 0
      }));
      setAnomalyHistory(initialHistory);
    }
  }, [isMonitoring]);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status`);
      const data = await response.json();
      setSystemStatus(prev => ({
        ...prev,
        // Only update these specific fields, don't overwrite real-time data
        python_ids_running: data.python_ids_running,
        websocket_connected: data.websocket_connected,
        models_loaded: data.models_loaded,
        available_models: data.available_models,
        // DON'T overwrite processing_rate, cpu_usage, memory_usage from status endpoint
        // These should come from real-time data
      }));
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const connectWebSocket = () => {
    try {
      console.log('🔗 Attempting to connect to WebSocket on port 8000...');
      wsRef.current = new WebSocket('ws://localhost:8000/ws');
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connection established');
        setSystemStatus(prev => ({ 
          ...prev, 
          websocket_connected: true,
          last_update: new Date().toISOString()
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received WebSocket data:', data);
          
          // Add validation before processing
          if (typeof data !== 'object' || data === null) {
            console.error('❌ Invalid WebSocket data format');
            return;
          }
          
          handleRealtimeData(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket data:', error);
          console.log('📨 Raw WebSocket message:', event.data);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setSystemStatus(prev => ({ 
          ...prev, 
          websocket_connected: false 
        }));
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (isMonitoring) {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connectWebSocket();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setSystemStatus(prev => ({ 
          ...prev, 
          websocket_connected: false 
        }));
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setSystemStatus(prev => ({ 
        ...prev, 
        websocket_connected: false 
      }));
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleRealtimeData = (data: any) => {
    console.log('🔄 Processing WebSocket data:', data);
    
    // Handle different message types from backend
    if (data.type === 'connection_established' || data.type === 'stream_started' || data.type === 'stream_stopped') {
      // These are system messages, not data points
      console.log(`📢 System message: ${data.type} - ${data.message}`);
      return;
    }
    
    if (data.type === 'first_data_point') {
      // This is the first data point, process it normally
      console.log('📊 First data point received');
      // Continue to process it as regular data
    }
    
    // Validate that this is a regular data point with the expected structure
    if (!data.stats || data.stats.packets_processed === undefined) {
      console.warn('⚠️ Received incomplete data point:', data);
      return;
    }
    
    // Type guard to ensure it matches PythonIDSData
    const pythonData = data as PythonIDSData;
    
    // Update real-time data buffer
    setRealtimeData(prev => [pythonData, ...prev.slice(0, 99)]);

    // Update system stats from the data - COMPREHENSIVE UPDATE
    setSystemStatus(prev => ({
      ...prev,
      last_update: pythonData.timestamp,
      processing_rate: pythonData.stats.packets_per_second,
      // Use backend CPU/memory if available, otherwise simulate
      cpu_usage: pythonData.stats.cpu_usage || Math.min(100, pythonData.stats.packets_per_second / 5),
      memory_usage: pythonData.stats.memory_usage || Math.min(100, 30 + (pythonData.stats.flows_active / 50) * 40),
      python_ids_running: true, // Ensure this stays true when receiving data
      websocket_connected: true // Ensure this stays true when receiving data
    }));

    // Process attack detection
    if (pythonData.is_attack) {
      console.log('🚨 Attack detected!', pythonData);
      const newAttackFlow: AttackFlow = {
        id: `attack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        source_ip: pythonData.flow_key.split('-')[0]?.split(':')[0] || 'Unknown',
        dest_ip: pythonData.flow_key.split('-')[1]?.split(':')[0] || 'Unknown',
        anomaly_score: pythonData.anomaly_score,
        confidence: pythonData.confidence,
        attack_type: classifyAttackType(pythonData.features, pythonData.anomaly_score),
        severity: getSeverityLevel(pythonData.anomaly_score),
        status: 'detected'
      };

      setAttackFlows(prev => [newAttackFlow, ...prev.slice(0, 49)]);
    }

    // Update anomaly history for charts
    const historyPoint = {
      timestamp: new Date(pythonData.timestamp).getTime(),
      anomaly_score: pythonData.anomaly_score,
      confidence: pythonData.confidence,
      is_attack: pythonData.is_attack ? 1 : 0,
      packets_processed: pythonData.stats.packets_processed,
      detection_rate: pythonData.stats.detection_rate,
      packets_per_second: pythonData.stats.packets_per_second
    };

    setAnomalyHistory(prev => {
      const newHistory = [...prev, historyPoint];
      // Keep only last 50 points
      return newHistory.slice(-50);
    });

    // Update feature importance
    if (pythonData.features && pythonData.features.length >= 20) {
      const maxFeatureValue = Math.max(...pythonData.features.slice(0, 20).map(Math.abs));
      const importance = pythonData.features.slice(0, 20).map((value, index) => ({
        feature: featureNames[index] || `Feature_${index}`,
        value: Math.abs(value),
        normalized: maxFeatureValue > 0 ? Math.abs(value) / maxFeatureValue : 0
      })).sort((a, b) => b.value - a.value).slice(0, 10);

      setFeatureImportance(importance);
    }
  };

  const classifyAttackType = (features: number[], anomalyScore: number): string => {
    if (!features || features.length < 20) return 'Unknown';

    // Use the actual feature indices from your model
    const packetRate = features[12]; // Fwd Packets/s
    const flowBytes = features[9]; // Flow Bytes/s
    const totalPackets = features[18]; // Total Fwd Packets

    if (packetRate > 50 && anomalyScore > 0.8) return 'DDoS';
    if (totalPackets < 10 && flowBytes > 10000) return 'Port Scan';
    if (anomalyScore > 0.7 && flowBytes > 50000) return 'Data Exfiltration';
    if (anomalyScore > 0.6) return 'Brute Force';
    
    return 'Anomalous Traffic';
  };

  const getSeverityLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-red-600 text-white animate-pulse';
      case 'analyzed': return 'bg-yellow-600 text-black';
      case 'blocked': return 'bg-blue-600 text-white';
      case 'mitigated': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const startPythonIDS = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/start-monitoring`, {
        method: 'POST'
      });
      
      const result = await response.json();
      console.log('🚀 Start monitoring response:', result);
      
      if (response.ok) {
        setSystemStatus(prev => ({ ...prev, python_ids_running: true }));
        setIsMonitoring(true);
        console.log('✅ Monitoring started successfully');
      } else {
        console.error('❌ Failed to start monitoring:', result);
      }
    } catch (error) {
      console.error('❌ Error starting monitoring:', error);
      // Fallback: start local monitoring state even if API fails
      setSystemStatus(prev => ({ ...prev, python_ids_running: true }));
      setIsMonitoring(true);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPythonIDS = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/stop-monitoring`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setSystemStatus(prev => ({ ...prev, python_ids_running: false }));
        setIsMonitoring(false);
        console.log('🛑 Monitoring stopped successfully');
      } else {
        console.error('❌ Failed to stop monitoring');
      }
    } catch (error) {
      console.error('❌ Error stopping monitoring:', error);
      // Fallback: stop local monitoring state even if API fails
      setSystemStatus(prev => ({ ...prev, python_ids_running: false }));
      setIsMonitoring(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockIP = async (flow: AttackFlow) => {
    try {
      // This would call your backend to block the IP
      console.log(`🛡️ Blocking IP: ${flow.source_ip}`);
      
      setAttackFlows(prev => prev.map(f => 
        f.id === flow.id ? { ...f, status: 'blocked' } : f
      ));
      setSelectedFlow(prev => prev ? { ...prev, status: 'blocked' } : null);
      
      // You could add an API call here to actually block the IP
      // await fetch(`${API_BASE_URL}/api/block-ip`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ip: flow.source_ip })
      // });
      
    } catch (error) {
      console.error('❌ Error blocking IP:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Alert className={systemStatus.python_ids_running ? 'border-green-600 bg-green-950/20' : 'border-red-600 bg-red-950/20'}>
        <Server className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Python Real-time IDS: {systemStatus.python_ids_running ? 'RUNNING' : 'STOPPED'} | 
            WebSocket: {systemStatus.websocket_connected ? 'CONNECTED' : 'DISCONNECTED'} |
            Models: {systemStatus.models_loaded ? 'LOADED' : 'NOT LOADED'} |
            Last Update: {systemStatus.last_update ? new Date(systemStatus.last_update).toLocaleTimeString() : 'Never'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm">Monitoring:</span>
            <Switch
              checked={isMonitoring}
              disabled={isLoading}
              onCheckedChange={(checked) => {
                if (checked) {
                  startPythonIDS();
                } else {
                  stopPythonIDS();
                }
              }}
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Processing Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{systemStatus.processing_rate.toFixed(1)}</div>
            <p className="text-xs text-blue-200">packets/second</p>
            <Progress value={Math.min(systemStatus.processing_rate / 5, 100)} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Attacks Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{attackFlows.length}</div>
            <p className="text-xs text-red-200">this session</p>
            <Progress value={Math.min(attackFlows.length * 5, 100)} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{systemStatus.cpu_usage.toFixed(1)}%</div>
            <p className="text-xs text-purple-200">system load</p>
            <Progress value={systemStatus.cpu_usage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{systemStatus.memory_usage.toFixed(1)}%</div>
            <p className="text-xs text-green-200">RAM utilization</p>
            <Progress value={systemStatus.memory_usage} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan-400" />
              Anomaly Score Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={anomalyHistory.length > 0 ? anomalyHistory : [{ timestamp: Date.now(), anomaly_score: 0, confidence: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString().slice(0, 5)}
                />
                <YAxis stroke="#9CA3AF" domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="anomaly_score" 
                  stroke="#06B6D4" 
                  fill="#06B6D4" 
                  fillOpacity={0.3}
                  name="Anomaly Score"
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.2}
                  name="Confidence"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Feature Importance (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={featureImportance.length > 0 ? featureImportance : [{ feature: 'No Data', normalized: 0 }]} 
                layout="vertical"
                margin={{ left: 100, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" domain={[0, 1]} stroke="#9CA3AF" />
                <YAxis 
                  dataKey="feature" 
                  type="category" 
                  stroke="#9CA3AF" 
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                  formatter={(value) => [(value as number).toFixed(3), 'Importance']}
                />
                <Bar dataKey="normalized" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Attack Flows and System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-400" />
              Detected Attack Flows
              {attackFlows.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {attackFlows.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {attackFlows.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No attacks detected</p>
                    <p className="text-sm mt-1">Traffic is being monitored...</p>
                  </div>
                ) : (
                  attackFlows.map((flow) => (
                    <div 
                      key={flow.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFlow?.id === flow.id 
                          ? 'border-blue-500 bg-blue-950/20' 
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedFlow(flow)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(flow.severity)}>
                            {flow.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(flow.status)}>
                            {flow.status.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(flow.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-sm mb-2">
                        <div className="font-medium text-orange-400 mb-1">
                          {flow.attack_type}
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>From: <span className="text-red-400">{flow.source_ip}</span></span>
                          <span>To: <span className="text-blue-400">{flow.dest_ip}</span></span>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Score: <span className="text-yellow-400">{flow.anomaly_score.toFixed(3)}</span></span>
                        <span>Confidence: <span className="text-green-400">{(flow.confidence * 100).toFixed(1)}%</span></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedFlow ? (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-400" />
                Attack Flow Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-cyan-400">Flow Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Attack Type:</span>
                      <div className="text-orange-400">{selectedFlow.attack_type}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Severity:</span>
                      <Badge className={getSeverityColor(selectedFlow.severity)}>
                        {selectedFlow.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-400">Source IP:</span>
                      <div className="font-mono text-red-400">{selectedFlow.source_ip}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Destination IP:</span>
                      <div className="font-mono text-blue-400">{selectedFlow.dest_ip}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-green-400">Detection Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Anomaly Score:</span>
                      <span className="text-yellow-400">{selectedFlow.anomaly_score.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="text-green-400">{(selectedFlow.confidence * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Detection Time:</span>
                      <span className="text-purple-400">{new Date(selectedFlow.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <Badge className={getStatusColor(selectedFlow.status)}>
                        {selectedFlow.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleBlockIP(selectedFlow)}
                    disabled={selectedFlow.status === 'blocked'}
                  >
                    {selectedFlow.status === 'blocked' ? 'IP Blocked' : 'Block Source IP'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setAttackFlows(prev => prev.map(f => 
                        f.id === selectedFlow.id ? { ...f, status: 'analyzed' } : f
                      ));
                      setSelectedFlow(prev => prev ? { ...prev, status: 'analyzed' } : null);
                    }}
                  >
                    Mark as Analyzed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-green-400">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monitoring:</span>
                      <Badge variant={isMonitoring ? "default" : "secondary"}>
                        {isMonitoring ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WebSocket:</span>
                      <Badge variant={systemStatus.websocket_connected ? "default" : "secondary"}>
                        {systemStatus.websocket_connected ? 'CONNECTED' : 'DISCONNECTED'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Models Loaded:</span>
                      <Badge variant={systemStatus.models_loaded ? "default" : "secondary"}>
                        {systemStatus.models_loaded ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Flows Processed:</span>
                      <span className="text-cyan-400">{realtimeData.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-blue-400">Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">CPU Usage</span>
                        <span className="text-purple-400">{systemStatus.cpu_usage.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemStatus.cpu_usage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Memory Usage</span>
                        <span className="text-green-400">{systemStatus.memory_usage.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemStatus.memory_usage} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Real-time Data Stream */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-purple-400" />
            Live Data Stream ({realtimeData.length} flows)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {realtimeData.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Waiting for data...</p>
                  <p className="text-sm mt-1">Start monitoring to see real-time traffic</p>
                </div>
              ) : (
                realtimeData.slice(0, 20).map((data, index) => (
                  <div key={index} className="bg-slate-800 p-2 rounded text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{new Date(data.timestamp).toLocaleTimeString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400">Score: {data.anomaly_score.toFixed(3)}</span>
                        {data.is_attack && (
                          <Badge className="bg-red-600 text-white text-xs">ATTACK</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-300 truncate">{data.flow_key}</div>
                    <div className="flex justify-between text-slate-400 text-xs mt-1">
                      <span>PPS: {data.stats.packets_per_second}</span>
                      <span>Flows: {data.stats.flows_active}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}