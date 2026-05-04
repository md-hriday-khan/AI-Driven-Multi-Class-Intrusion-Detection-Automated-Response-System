import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Brain, Cpu, Database, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AIMetric {
  timestamp: number;
  modelAccuracy: number;
  confidenceScore: number;
  detectionRate: number;
  falsePositiveRate: number;
  processingLatency: number;
  modelLoad: number;
}

interface ModelStatus {
  name: string;
  version: string;
  status: 'active' | 'training' | 'offline';
  accuracy: number;
  lastUpdate: Date;
  threatTypes: string[];
}

export function AIMonitoring() {
  const [metrics, setMetrics] = useState<AIMetric[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<AIMetric>({
    timestamp: Date.now(),
    modelAccuracy: 94.7,
    confidenceScore: 87.3,
    detectionRate: 96.2,
    falsePositiveRate: 2.1,
    processingLatency: 45,
    modelLoad: 67.8
  });

  const [models] = useState<ModelStatus[]>([
    {
      name: 'LSTM Threat Detector',
      version: 'v2.3.1',
      status: 'active',
      accuracy: 94.7,
      lastUpdate: new Date(),
      threatTypes: ['DDoS', 'Malware', 'Botnet']
    },
    {
      name: 'Random Forest Classifier',
      version: 'v1.8.4',
      status: 'active',
      accuracy: 91.2,
      lastUpdate: new Date(),
      threatTypes: ['Brute Force', 'Exfiltration']
    },
    {
      name: 'Neural Network Anomaly',
      version: 'v3.1.0',
      status: 'training',
      accuracy: 89.6,
      lastUpdate: new Date(),
      threatTypes: ['Zero-day', 'Advanced Persistent Threats']
    }
  ]);

  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  useEffect(() => {
    // Initialize historical data
    const now = Date.now();
    const initialData: AIMetric[] = [];
    
    for (let i = 60; i >= 0; i--) {
      initialData.push({
        timestamp: now - (i * 60000), // 1 minute intervals
        modelAccuracy: 92 + Math.random() * 6,
        confidenceScore: 80 + Math.random() * 15,
        detectionRate: 94 + Math.random() * 4,
        falsePositiveRate: 1 + Math.random() * 3,
        processingLatency: 30 + Math.random() * 30,
        modelLoad: 50 + Math.random() * 40
      });
    }
    
    setMetrics(initialData);

    // Real-time updates
    const interval = setInterval(() => {
      const newMetric: AIMetric = {
        timestamp: Date.now(),
        modelAccuracy: Math.max(85, Math.min(98, currentMetrics.modelAccuracy + (Math.random() - 0.5) * 2)),
        confidenceScore: Math.max(70, Math.min(95, currentMetrics.confidenceScore + (Math.random() - 0.5) * 4)),
        detectionRate: Math.max(90, Math.min(99, currentMetrics.detectionRate + (Math.random() - 0.5) * 2)),
        falsePositiveRate: Math.max(0.5, Math.min(5, currentMetrics.falsePositiveRate + (Math.random() - 0.5) * 0.5)),
        processingLatency: Math.max(20, Math.min(100, currentMetrics.processingLatency + (Math.random() - 0.5) * 10)),
        modelLoad: Math.max(30, Math.min(90, currentMetrics.modelLoad + (Math.random() - 0.5) * 5))
      };

      setCurrentMetrics(newMetric);
      setMetrics(prev => [...prev.slice(-59), newMetric]);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentMetrics.modelAccuracy, currentMetrics.confidenceScore, currentMetrics.detectionRate, 
      currentMetrics.falsePositiveRate, currentMetrics.processingLatency, currentMetrics.modelLoad]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'training': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Real-time Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.modelAccuracy.toFixed(1)}%</div>
            <Progress value={currentMetrics.modelAccuracy} className="mt-2" />
            <p className="text-xs text-slate-400 mt-1">
              Target: &gt;95%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.confidenceScore.toFixed(1)}%</div>
            <Progress value={currentMetrics.confidenceScore} className="mt-2" />
            <p className="text-xs text-slate-400 mt-1">
              Average confidence in predictions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.detectionRate.toFixed(1)}%</div>
            <Progress value={currentMetrics.detectionRate} className="mt-2" />
            <p className="text-xs text-slate-400 mt-1">
              True positive rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.falsePositiveRate.toFixed(1)}%</div>
            <Progress value={currentMetrics.falsePositiveRate} max={10} className="mt-2" />
            <p className="text-xs text-slate-400 mt-1">
              Target: &lt;5%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Latency</CardTitle>
            <Cpu className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.processingLatency.toFixed(0)}ms</div>
            <Progress value={currentMetrics.processingLatency} max={200} className="mt-2" />
            <p className="text-xs text-slate-400 mt-1">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Load</CardTitle>
            <Database className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.modelLoad.toFixed(1)}%</div>
            <Progress value={currentMetrics.modelLoad} className="mt-2" />
            <p className="text-xs text-slate-400 mt-1">
              System resource utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Model Performance Trends</span>
              <div className="flex gap-2">
                {['1h', '6h', '24h'].map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  stroke="#9CA3AF"
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${formatTimestamp(value as number)}`}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="modelAccuracy" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Accuracy %"
                />
                <Line 
                  type="monotone" 
                  dataKey="detectionRate" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Detection Rate %"
                />
                <Line 
                  type="monotone" 
                  dataKey="falsePositiveRate" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="False Positive %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  stroke="#9CA3AF"
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${formatTimestamp(value as number)}`}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="processingLatency" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  name="Latency (ms)"
                />
                <Area 
                  type="monotone" 
                  dataKey="modelLoad" 
                  stroke="#F59E0B" 
                  fill="#F59E0B"
                  fillOpacity={0.3}
                  name="Load %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Model Status */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>AI Model Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {models.map((model, index) => (
              <Card key={index} className="bg-slate-800 border-slate-600">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{model.name}</CardTitle>
                    <Badge 
                      variant="secondary"
                      className={`${getStatusColor(model.status)} text-white`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(model.status)}
                        {model.status.toUpperCase()}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Version</span>
                    <span>{model.version}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Accuracy</span>
                    <span className="font-medium">{model.accuracy.toFixed(1)}%</span>
                  </div>
                  
                  <div>
                    <Progress value={model.accuracy} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Last Update</span>
                    <span>{model.lastUpdate.toLocaleDateString()}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm text-slate-400 block mb-2">Threat Types</span>
                    <div className="flex flex-wrap gap-1">
                      {model.threatTypes.map((type, typeIndex) => (
                        <Badge key={typeIndex} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Configure
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Retrain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Logs */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Recent Training Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">LSTM Model v2.3.1 - Training Complete</p>
                  <p className="text-sm text-slate-400">Accuracy improved to 94.7% (+2.1%)</p>
                </div>
              </div>
              <span className="text-sm text-slate-400">2 hours ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div>
                  <p className="font-medium">Neural Network Anomaly - Training in Progress</p>
                  <p className="text-sm text-slate-400">Epoch 45/100 - ETA: 3 hours</p>
                </div>
              </div>
              <span className="text-sm text-slate-400">Started 6 hours ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="font-medium">Dataset Update - New Threat Samples</p>
                  <p className="text-sm text-slate-400">Added 15,000 new labeled samples</p>
                </div>
              </div>
              <span className="text-sm text-slate-400">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}