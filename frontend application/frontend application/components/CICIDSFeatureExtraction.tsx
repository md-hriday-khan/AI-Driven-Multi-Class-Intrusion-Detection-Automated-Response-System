import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { Activity, Zap, Network, Clock, FileText, TrendingUp, Cpu, Database } from 'lucide-react';

interface NetworkFlow {
  id: string;
  timestamp: number;
  srcIP: string;
  dstIP: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  duration: number;
  srcBytes: number;
  dstBytes: number;
  srcPackets: number;
  dstPackets: number;
  tcpFlags: string;
  urgentPackets: number;
  features: CICIDSFeatures;
}

interface CICIDSFeatures {
  // Flow Duration Features
  flowDuration: number;
  
  // Flow IAT (Inter Arrival Time) Features
  flowIATMean: number;
  flowIATStd: number;
  flowIATMax: number;
  flowIATMin: number;
  
  // Forward IAT Features
  fwdIATTotal: number;
  fwdIATMean: number;
  fwdIATStd: number;
  fwdIATMax: number;
  fwdIATMin: number;
  
  // Backward IAT Features
  bwdIATTotal: number;
  bwdIATMean: number;
  bwdIATStd: number;
  bwdIATMax: number;
  bwdIATMin: number;
  
  // Packet Size Features
  pktSizeAvg: number;
  pktSizeStd: number;
  pktSizeVar: number;
  
  // TCP Flag Features
  finFlagCount: number;
  synFlagCount: number;
  rstFlagCount: number;
  pshFlagCount: number;
  ackFlagCount: number;
  urgFlagCount: number;
  
  // Packet Length Features
  totalLengthFwdPackets: number;
  totalLengthBwdPackets: number;
  fwdPacketLengthMax: number;
  fwdPacketLengthMin: number;
  fwdPacketLengthMean: number;
  fwdPacketLengthStd: number;
  
  // Bulk Features
  bulkRateAvg: number;
  
  // Subflow Features
  subflowFwdPackets: number;
  subflowFwdBytes: number;
  subflowBwdPackets: number;
  subflowBwdBytes: number;
  
  // Active/Idle Features
  activeMean: number;
  activeStd: number;
  activeMax: number;
  activeMin: number;
  idleMean: number;
  idleStd: number;
  idleMax: number;
  idleMin: number;
}

interface FeatureStats {
  totalFlows: number;
  featuresExtracted: number;
  processingRate: number;
  avgExtractionTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export function CICIDSFeatureExtraction() {
  const [flows, setFlows] = useState<NetworkFlow[]>([]);
  const [stats, setStats] = useState<FeatureStats>({
    totalFlows: 0,
    featuresExtracted: 0,
    processingRate: 0,
    avgExtractionTime: 0,
    memoryUsage: 0,
    cpuUsage: 0
  });
  const [selectedFlow, setSelectedFlow] = useState<NetworkFlow | null>(null);
  const [processingQueue, setProcessingQueue] = useState<number>(0);

  // Generate mock CIC-IDS features
  const generateCICIDSFeatures = (flow: Partial<NetworkFlow>): CICIDSFeatures => {
    const duration = flow.duration || Math.random() * 10000;
    const srcBytes = flow.srcBytes || Math.random() * 50000;
    const dstBytes = flow.dstBytes || Math.random() * 50000;
    const srcPackets = flow.srcPackets || Math.floor(Math.random() * 100) + 1;
    const dstPackets = flow.dstPackets || Math.floor(Math.random() * 100) + 1;

    return {
      flowDuration: duration,
      
      // Flow IAT Features
      flowIATMean: duration / (srcPackets + dstPackets),
      flowIATStd: Math.random() * 1000,
      flowIATMax: Math.random() * 5000,
      flowIATMin: Math.random() * 10,
      
      // Forward IAT Features
      fwdIATTotal: duration * 0.6,
      fwdIATMean: (duration * 0.6) / srcPackets,
      fwdIATStd: Math.random() * 800,
      fwdIATMax: Math.random() * 3000,
      fwdIATMin: Math.random() * 5,
      
      // Backward IAT Features
      bwdIATTotal: duration * 0.4,
      bwdIATMean: (duration * 0.4) / dstPackets,
      bwdIATStd: Math.random() * 600,
      bwdIATMax: Math.random() * 2000,
      bwdIATMin: Math.random() * 8,
      
      // Packet Size Features
      pktSizeAvg: (srcBytes + dstBytes) / (srcPackets + dstPackets),
      pktSizeStd: Math.random() * 500,
      pktSizeVar: Math.random() * 250000,
      
      // TCP Flag Features
      finFlagCount: Math.floor(Math.random() * 5),
      synFlagCount: Math.floor(Math.random() * 3) + 1,
      rstFlagCount: Math.floor(Math.random() * 2),
      pshFlagCount: Math.floor(Math.random() * 10),
      ackFlagCount: Math.floor(Math.random() * 20) + 5,
      urgFlagCount: Math.floor(Math.random() * 2),
      
      // Packet Length Features
      totalLengthFwdPackets: srcBytes,
      totalLengthBwdPackets: dstBytes,
      fwdPacketLengthMax: Math.random() * 1500,
      fwdPacketLengthMin: Math.random() * 100,
      fwdPacketLengthMean: srcBytes / srcPackets,
      fwdPacketLengthStd: Math.random() * 400,
      
      // Bulk Features
      bulkRateAvg: (srcBytes + dstBytes) / duration,
      
      // Subflow Features
      subflowFwdPackets: srcPackets,
      subflowFwdBytes: srcBytes,
      subflowBwdPackets: dstPackets,
      subflowBwdBytes: dstBytes,
      
      // Active/Idle Features
      activeMean: Math.random() * 1000,
      activeStd: Math.random() * 500,
      activeMax: Math.random() * 2000,
      activeMin: Math.random() * 100,
      idleMean: Math.random() * 5000,
      idleStd: Math.random() * 2000,
      idleMax: Math.random() * 10000,
      idleMin: Math.random() * 500
    };
  };

  // Generate mock network flow
  const generateNetworkFlow = (): NetworkFlow => {
    const protocols = ['TCP', 'UDP', 'ICMP'];
    const srcBytes = Math.random() * 50000;
    const dstBytes = Math.random() * 50000;
    const srcPackets = Math.floor(Math.random() * 100) + 1;
    const dstPackets = Math.floor(Math.random() * 100) + 1;
    const duration = Math.random() * 10000;

    const flow: Partial<NetworkFlow> = {
      id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      srcIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      dstIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      srcPort: Math.floor(Math.random() * 65535),
      dstPort: Math.floor(Math.random() * 65535),
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      duration,
      srcBytes,
      dstBytes,
      srcPackets,
      dstPackets,
      tcpFlags: 'PSH,ACK',
      urgentPackets: Math.floor(Math.random() * 3)
    };

    return {
      ...flow,
      features: generateCICIDSFeatures(flow)
    } as NetworkFlow;
  };

  useEffect(() => {
    // Initialize with some flows
    const initialFlows = Array.from({ length: 20 }, () => generateNetworkFlow());
    setFlows(initialFlows);

    // Real-time flow generation and feature extraction
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        const newFlow = generateNetworkFlow();
        
        // Simulate processing queue
        setProcessingQueue(prev => prev + 1);
        
        setTimeout(() => {
          setFlows(prev => [newFlow, ...prev.slice(0, 49)]);
          setProcessingQueue(prev => Math.max(0, prev - 1));
          
          // Update stats
          setStats(prev => ({
            totalFlows: prev.totalFlows + 1,
            featuresExtracted: prev.featuresExtracted + 83, // 83 CIC-IDS features
            processingRate: Math.round((Math.random() * 500 + 1000) * 100) / 100,
            avgExtractionTime: Math.round((Math.random() * 5 + 2) * 100) / 100,
            memoryUsage: Math.round((Math.random() * 20 + 60) * 100) / 100,
            cpuUsage: Math.round((Math.random() * 30 + 40) * 100) / 100
          }));
        }, Math.random() * 1000 + 500); // Simulate processing time
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'TCP': return 'bg-blue-600 text-white';
      case 'UDP': return 'bg-green-600 text-white';
      case 'ICMP': return 'bg-yellow-600 text-black';
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Prepare chart data
  const flowRateData = flows.slice(0, 20).map((flow, index) => ({
    time: new Date(flow.timestamp).toLocaleTimeString().slice(0, 5),
    rate: flow.features.bulkRateAvg,
    packets: flow.srcPackets + flow.dstPackets
  }));

  const featureDistributionData = selectedFlow ? [
    { name: 'Flow Duration', value: selectedFlow.features.flowDuration / 100 },
    { name: 'Packet Size Avg', value: selectedFlow.features.pktSizeAvg / 10 },
    { name: 'IAT Mean', value: selectedFlow.features.flowIATMean / 10 },
    { name: 'Bulk Rate', value: selectedFlow.features.bulkRateAvg / 1000 },
    { name: 'Active Mean', value: selectedFlow.features.activeMean / 100 }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Flows</CardTitle>
            <Network className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalFlows.toLocaleString()}</div>
            <p className="text-xs text-blue-200">flows processed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Features Extracted</CardTitle>
            <FileText className="h-4 w-4 text-emerald-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.featuresExtracted.toLocaleString()}</div>
            <p className="text-xs text-emerald-200">CIC-IDS features</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900 to-amber-800 border-amber-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">Processing Rate</CardTitle>
            <Zap className="h-4 w-4 text-amber-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.processingRate}</div>
            <p className="text-xs text-amber-200">flows/sec</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Queue Size</CardTitle>
            <Clock className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{processingQueue}</div>
            <p className="text-xs text-purple-200">pending flows</p>
          </CardContent>
        </Card>
      </div>

      {/* System Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              Extraction Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">CPU Usage</span>
                <span className="text-sm font-medium">{stats.cpuUsage}%</span>
              </div>
              <Progress value={stats.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Memory Usage</span>
                <span className="text-sm font-medium">{stats.memoryUsage}%</span>
              </div>
              <Progress value={stats.memoryUsage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">{stats.avgExtractionTime}ms</div>
                <div className="text-xs text-slate-400">Avg Extraction Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">83</div>
                <div className="text-xs text-slate-400">Features per Flow</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Flow Rate Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={flowRateData}>
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
                <Line type="monotone" dataKey="rate" stroke="#06B6D4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Network Flows Table */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            Network Flows with CIC-IDS Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {flows.map((flow) => (
                <div 
                  key={flow.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedFlow?.id === flow.id 
                      ? 'border-blue-500 bg-blue-950/20' 
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedFlow(flow)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getProtocolColor(flow.protocol)}>
                        {flow.protocol}
                      </Badge>
                      <span className="font-mono text-sm text-slate-300">{flow.id}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(flow.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Source:</span>
                      <div className="font-mono text-cyan-400">{flow.srcIP}:{flow.srcPort}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Destination:</span>
                      <div className="font-mono text-orange-400">{flow.dstIP}:{flow.dstPort}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Duration:</span>
                      <div className="text-green-400">{formatDuration(flow.features.flowDuration)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Packets:</span>
                      <div className="text-purple-400">{flow.srcPackets + flow.dstPackets}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex gap-4">
                      <span className="text-slate-400">Bytes: {formatBytes(flow.srcBytes + flow.dstBytes)}</span>
                      <span className="text-slate-400">Rate: {flow.features.bulkRateAvg.toFixed(2)} B/ms</span>
                      <span className="text-slate-400">IAT: {flow.features.flowIATMean.toFixed(2)}ms</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      83 features
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Flow Details */}
      {selectedFlow && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              CIC-IDS Feature Analysis - {selectedFlow.id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feature Categories */}
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-blue-400">Duration & Timing Features</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>Flow Duration: <span className="text-cyan-400">{selectedFlow.features.flowDuration.toFixed(2)}ms</span></div>
                    <div>Flow IAT Mean: <span className="text-cyan-400">{selectedFlow.features.flowIATMean.toFixed(2)}ms</span></div>
                    <div>Forward IAT Mean: <span className="text-cyan-400">{selectedFlow.features.fwdIATMean.toFixed(2)}ms</span></div>
                    <div>Backward IAT Mean: <span className="text-cyan-400">{selectedFlow.features.bwdIATMean.toFixed(2)}ms</span></div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-green-400">Packet Features</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>Packet Size Avg: <span className="text-green-400">{selectedFlow.features.pktSizeAvg.toFixed(2)} B</span></div>
                    <div>Packet Size Std: <span className="text-green-400">{selectedFlow.features.pktSizeStd.toFixed(2)} B</span></div>
                    <div>Fwd Packet Len Max: <span className="text-green-400">{selectedFlow.features.fwdPacketLengthMax.toFixed(2)} B</span></div>
                    <div>Fwd Packet Len Mean: <span className="text-green-400">{selectedFlow.features.fwdPacketLengthMean.toFixed(2)} B</span></div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-yellow-400">TCP Flag Features</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>SYN: <span className="text-yellow-400">{selectedFlow.features.synFlagCount}</span></div>
                    <div>ACK: <span className="text-yellow-400">{selectedFlow.features.ackFlagCount}</span></div>
                    <div>PSH: <span className="text-yellow-400">{selectedFlow.features.pshFlagCount}</span></div>
                    <div>FIN: <span className="text-yellow-400">{selectedFlow.features.finFlagCount}</span></div>
                    <div>RST: <span className="text-yellow-400">{selectedFlow.features.rstFlagCount}</span></div>
                    <div>URG: <span className="text-yellow-400">{selectedFlow.features.urgFlagCount}</span></div>
                  </div>
                </div>
              </div>

              {/* Feature Visualization */}
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Feature Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={featureDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar dataKey="value" fill="#06B6D4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-purple-400">Statistical Features</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bulk Rate Average:</span>
                      <span className="text-purple-400">{selectedFlow.features.bulkRateAvg.toFixed(2)} B/ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Mean:</span>
                      <span className="text-purple-400">{selectedFlow.features.activeMean.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Idle Mean:</span>
                      <span className="text-purple-400">{selectedFlow.features.idleMean.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subflow Fwd Packets:</span>
                      <span className="text-purple-400">{selectedFlow.features.subflowFwdPackets}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}