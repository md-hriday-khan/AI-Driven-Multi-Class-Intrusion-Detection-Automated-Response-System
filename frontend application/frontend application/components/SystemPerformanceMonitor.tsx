import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Cpu, HardDrive, Activity, Zap, Clock, Database, Server, BarChart } from 'lucide-react';

interface SystemMetric {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  modelInferenceTime: number;
  detectionLatency: number;
  gpuUsage?: number;
}

interface ProcessInfo {
  name: string;
  pid: number;
  cpuPercent: number;
  memoryMB: number;
  status: 'running' | 'sleeping' | 'zombie';
}

export function SystemPerformanceMonitor() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    cpuUsage: 45.2,
    memoryUsage: 67.8,
    diskUsage: 34.1,
    networkLatency: 12.3,
    modelInferenceTime: 45.7,
    detectionLatency: 89.2,
    gpuUsage: 78.5,
    temperature: 62,
    powerConsumption: 350
  });

  const [processes, setProcesses] = useState<ProcessInfo[]>([
    { name: 'threat-detector', pid: 1234, cpuPercent: 15.2, memoryMB: 2048, status: 'running' },
    { name: 'ml-inference', pid: 1235, cpuPercent: 12.8, memoryMB: 4096, status: 'running' },
    { name: 'network-monitor', pid: 1236, cpuPercent: 8.5, memoryMB: 1024, status: 'running' },
    { name: 'response-engine', pid: 1237, cpuPercent: 6.2, memoryMB: 512, status: 'running' },
    { name: 'log-aggregator', pid: 1238, cpuPercent: 3.1, memoryMB: 256, status: 'running' }
  ]);

  const [alertThresholds] = useState({
    cpu: 80,
    memory: 85,
    disk: 90,
    latency: 100,
    temperature: 75
  });

  useEffect(() => {
    // Initialize historical data
    const now = Date.now();
    const initialData: SystemMetric[] = [];
    
    for (let i = 60; i >= 0; i--) {
      initialData.push({
        timestamp: now - (i * 30000), // 30 second intervals
        cpuUsage: 30 + Math.random() * 40,
        memoryUsage: 50 + Math.random() * 30,
        diskUsage: 25 + Math.random() * 20,
        networkLatency: 5 + Math.random() * 20,
        modelInferenceTime: 30 + Math.random() * 30,
        detectionLatency: 60 + Math.random() * 40,
        gpuUsage: 60 + Math.random() * 30
      });
    }
    
    setSystemMetrics(initialData);

    // Real-time updates
    const interval = setInterval(() => {
      const newMetric: SystemMetric = {
        timestamp: Date.now(),
        cpuUsage: Math.max(5, Math.min(95, currentMetrics.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(95, currentMetrics.memoryUsage + (Math.random() - 0.5) * 5)),
        diskUsage: Math.max(10, Math.min(95, currentMetrics.diskUsage + (Math.random() - 0.5) * 2)),
        networkLatency: Math.max(1, currentMetrics.networkLatency + (Math.random() - 0.5) * 5),
        modelInferenceTime: Math.max(10, currentMetrics.modelInferenceTime + (Math.random() - 0.5) * 10),
        detectionLatency: Math.max(20, currentMetrics.detectionLatency + (Math.random() - 0.5) * 15),
        gpuUsage: Math.max(20, Math.min(95, currentMetrics.gpuUsage + (Math.random() - 0.5) * 8))
      };

      setCurrentMetrics(prev => ({
        ...prev,
        ...newMetric,
        temperature: Math.max(35, Math.min(85, prev.temperature + (Math.random() - 0.5) * 3)),
        powerConsumption: Math.max(200, Math.min(500, prev.powerConsumption + (Math.random() - 0.5) * 20))
      }));

      setSystemMetrics(prev => [...prev.slice(-59), newMetric]);

      // Update process information
      setProcesses(prev => prev.map(process => ({
        ...process,
        cpuPercent: Math.max(0.1, process.cpuPercent + (Math.random() - 0.5) * 2),
        memoryMB: Math.max(100, process.memoryMB + Math.floor((Math.random() - 0.5) * 100))
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [currentMetrics.cpuUsage, currentMetrics.memoryUsage, currentMetrics.diskUsage, 
      currentMetrics.networkLatency, currentMetrics.modelInferenceTime, currentMetrics.detectionLatency, currentMetrics.gpuUsage]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (usage: number, threshold: number) => {
    if (usage > threshold) return 'text-red-400';
    if (usage > threshold * 0.8) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressColor = (usage: number, threshold: number) => {
    if (usage > threshold) return 'bg-red-500';
    if (usage > threshold * 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProcessStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'sleeping': return 'bg-yellow-500';
      case 'zombie': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(currentMetrics.cpuUsage, alertThresholds.cpu)}`}>
              {currentMetrics.cpuUsage.toFixed(1)}%
            </div>
            <Progress 
              value={currentMetrics.cpuUsage} 
              className="mt-2 h-3"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>8 cores</span>
              <span>Temp: {currentMetrics.temperature}°C</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(currentMetrics.memoryUsage, alertThresholds.memory)}`}>
              {currentMetrics.memoryUsage.toFixed(1)}%
            </div>
            <Progress 
              value={currentMetrics.memoryUsage} 
              className="mt-2 h-3"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{(currentMetrics.memoryUsage * 0.32).toFixed(1)} GB used</span>
              <span>32 GB total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPU Usage</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(currentMetrics.gpuUsage, 90)}`}>
              {currentMetrics.gpuUsage.toFixed(1)}%
            </div>
            <Progress 
              value={currentMetrics.gpuUsage} 
              className="mt-2 h-3"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>NVIDIA RTX 4090</span>
              <span>24GB VRAM</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Latency</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(currentMetrics.detectionLatency, alertThresholds.latency)}`}>
              {currentMetrics.detectionLatency.toFixed(1)}ms
            </div>
            <div className="mt-2">
              <div className="text-xs text-slate-400 mb-1">
                Model inference: {currentMetrics.modelInferenceTime.toFixed(1)}ms
              </div>
              <Progress 
                value={(currentMetrics.modelInferenceTime / currentMetrics.detectionLatency) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resource Usage */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>System Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={systemMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${formatTimestamp(value as number)}`}
                  formatter={(value: any, name: string) => [
                    `${value.toFixed(1)}%`, 
                    name.charAt(0).toUpperCase() + name.slice(1).replace('Usage', ' Usage')
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpuUsage" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="cpu"
                />
                <Area 
                  type="monotone" 
                  dataKey="memoryUsage" 
                  stackId="2"
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="memory"
                />
                <Area 
                  type="monotone" 
                  dataKey="gpuUsage" 
                  stackId="3"
                  stroke="#F59E0B" 
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name="gpu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Latency */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Performance Latency Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={systemMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${formatTimestamp(value as number)}`}
                  formatter={(value: any, name: string) => [
                    `${value.toFixed(1)}ms`, 
                    name.charAt(0).toUpperCase() + name.slice(1).replace('Time', ' Time').replace('Latency', ' Latency')
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="detectionLatency" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="detection"
                />
                <Line 
                  type="monotone" 
                  dataKey="modelInferenceTime" 
                  stroke="#EC4899" 
                  strokeWidth={2}
                  name="modelInference"
                />
                <Line 
                  type="monotone" 
                  dataKey="networkLatency" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  name="network"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Monitor */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Security Process Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processes.map((process) => (
                <div 
                  key={process.pid}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary" 
                      className={getProcessStatusColor(process.status)}
                    >
                      {process.status}
                    </Badge>
                    <div>
                      <div className="font-medium">{process.name}</div>
                      <div className="text-sm text-slate-400">PID: {process.pid}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm">
                      <span className={getStatusColor(process.cpuPercent, 20)}>
                        {process.cpuPercent.toFixed(1)}% CPU
                      </span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {process.memoryMB} MB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>System Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">System Load</span>
                  </div>
                  <div className="text-lg font-bold">2.45</div>
                  <div className="text-xs text-slate-400">Load average (1m)</div>
                </div>

                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">Disk I/O</span>
                  </div>
                  <div className="text-lg font-bold">156 MB/s</div>
                  <div className="text-xs text-slate-400">Read/Write combined</div>
                </div>

                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium">Power Usage</span>
                  </div>
                  <div className="text-lg font-bold">{currentMetrics.powerConsumption}W</div>
                  <div className="text-xs text-slate-400">Current consumption</div>
                </div>

                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium">Uptime</span>
                  </div>
                  <div className="text-lg font-bold">15d 4h</div>
                  <div className="text-xs text-slate-400">System uptime</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h4 className="font-medium mb-3">Alert Thresholds</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CPU Usage:</span>
                    <span className={currentMetrics.cpuUsage > alertThresholds.cpu ? 'text-red-400' : 'text-slate-400'}>
                      &gt; {alertThresholds.cpu}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage:</span>
                    <span className={currentMetrics.memoryUsage > alertThresholds.memory ? 'text-red-400' : 'text-slate-400'}>
                      &gt; {alertThresholds.memory}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Detection Latency:</span>
                    <span className={currentMetrics.detectionLatency > alertThresholds.latency ? 'text-red-400' : 'text-slate-400'}>
                      &gt; {alertThresholds.latency}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className={currentMetrics.temperature > alertThresholds.temperature ? 'text-red-400' : 'text-slate-400'}>
                      &gt; {alertThresholds.temperature}°C
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}