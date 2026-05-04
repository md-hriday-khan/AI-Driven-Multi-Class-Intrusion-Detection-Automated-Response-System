import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Activity, Eye, Zap, Globe, Target, Filter, Play, Pause, RotateCw } from 'lucide-react';

interface AttackFlow {
  id: string;
  timestamp: number;
  sourceIP: string;
  targetIP: string;
  sourceCountry: string;
  targetCountry: string;
  attackType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  packetCount: number;
  dataSize: number;
  duration: number;
  status: 'active' | 'blocked' | 'completed';
  coordinates: {
    source: { lat: number; lng: number };
    target: { lat: number; lng: number };
  };
}

interface AttackVisualization {
  flows: AttackFlow[];
  activeConnections: number;
  totalDataTransferred: number;
  attacksBlocked: number;
  uniqueAttackers: number;
}

interface NetworkNode {
  id: string;
  type: 'source' | 'target' | 'router' | 'firewall';
  position: { x: number; y: number };
  label: string;
  status: 'normal' | 'warning' | 'critical';
  connections: string[];
  traffic: number;
}

interface VisualizationSettings {
  showPacketFlows: boolean;
  showGeoLocation: boolean;
  showRealTimeStats: boolean;
  animationSpeed: number;
  filterSeverity: string;
  autoBlock: boolean;
}

export function LiveAttackVisualization() {
  const [visualization, setVisualization] = useState<AttackVisualization>({
    flows: [],
    activeConnections: 0,
    totalDataTransferred: 0,
    attacksBlocked: 0,
    uniqueAttackers: 0
  });
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [settings, setSettings] = useState<VisualizationSettings>({
    showPacketFlows: true,
    showGeoLocation: true,
    showRealTimeStats: true,
    animationSpeed: 1,
    filterSeverity: 'all',
    autoBlock: false
  });
  const [isLive, setIsLive] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<AttackFlow | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize network topology
  useEffect(() => {
    const initialNodes: NetworkNode[] = [
      {
        id: 'firewall_main',
        type: 'firewall',
        position: { x: 400, y: 100 },
        label: 'Main Firewall',
        status: 'normal',
        connections: ['router_dmz', 'internal_network'],
        traffic: 0
      },
      {
        id: 'router_dmz',
        type: 'router',
        position: { x: 200, y: 200 },
        label: 'DMZ Router',
        status: 'normal',
        connections: ['web_server', 'mail_server'],
        traffic: 0
      },
      {
        id: 'internal_network',
        type: 'target',
        position: { x: 600, y: 200 },
        label: 'Internal Network',
        status: 'normal',
        connections: ['database', 'workstations'],
        traffic: 0
      },
      {
        id: 'web_server',
        type: 'target',
        position: { x: 100, y: 300 },
        label: 'Web Server',
        status: 'normal',
        connections: [],
        traffic: 0
      },
      {
        id: 'database',
        type: 'target',
        position: { x: 700, y: 300 },
        label: 'Database',
        status: 'normal',
        connections: [],
        traffic: 0
      }
    ];

    setNetworkNodes(initialNodes);
  }, []);

  // Generate live attack flows
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const attackTypes = ['ddos', 'malware', 'bruteforce', 'botnet', 'exfiltration', 'zeroday'];
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
      const countries = [
        { name: 'US', lat: 39.8283, lng: -98.5795 },
        { name: 'CN', lat: 35.8617, lng: 104.1954 },
        { name: 'RU', lat: 61.5240, lng: 105.3188 },
        { name: 'DE', lat: 51.1657, lng: 10.4515 },
        { name: 'BR', lat: -14.2350, lng: -51.9253 },
        { name: 'IN', lat: 20.5937, lng: 78.9629 }
      ];

      if (Math.random() > 0.3) {
        const sourceCountry = countries[Math.floor(Math.random() * countries.length)];
        const targetCountry = countries[0]; // Assume we're protecting US infrastructure
        
        const newFlow: AttackFlow = {
          id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          targetIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          sourceCountry: sourceCountry.name,
          targetCountry: targetCountry.name,
          attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          packetCount: Math.floor(Math.random() * 10000) + 100,
          dataSize: Math.floor(Math.random() * 1000000) + 1000, // bytes
          duration: Math.floor(Math.random() * 30000) + 1000, // ms
          status: Math.random() > 0.7 ? 'blocked' : 'active',
          coordinates: {
            source: { lat: sourceCountry.lat, lng: sourceCountry.lng },
            target: { lat: targetCountry.lat, lng: targetCountry.lng }
          }
        };

        setVisualization(prev => {
          const updatedFlows = [newFlow, ...prev.flows.slice(0, 99)];
          const activeFlows = updatedFlows.filter(f => f.status === 'active');
          const blockedFlows = updatedFlows.filter(f => f.status === 'blocked');
          const uniqueSources = new Set(updatedFlows.map(f => f.sourceIP));

          return {
            flows: updatedFlows,
            activeConnections: activeFlows.length,
            totalDataTransferred: prev.totalDataTransferred + newFlow.dataSize,
            attacksBlocked: blockedFlows.length,
            uniqueAttackers: uniqueSources.size
          };
        });

        // Update network node status based on attack severity
        if (newFlow.status === 'active') {
          setNetworkNodes(prev => prev.map(node => {
            if (node.type === 'target' || node.type === 'firewall') {
              const severityWeight = getSeverityWeight(newFlow.severity);
              return {
                ...node,
                status: severityWeight >= 3 ? 'critical' : severityWeight >= 2 ? 'warning' : 'normal',
                traffic: node.traffic + newFlow.packetCount
              };
            }
            return node;
          }));
        }
      }

      // Clean up old flows
      setTimeout(() => {
        setVisualization(prev => ({
          ...prev,
          flows: prev.flows.map(flow => 
            Date.now() - flow.timestamp > flow.duration 
              ? { ...flow, status: 'completed' }
              : flow
          )
        }));
      }, 5000);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Canvas animation for network visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw network topology
      networkNodes.forEach(node => {
        // Draw connections
        node.connections.forEach(connectionId => {
          const targetNode = networkNodes.find(n => n.id === connectionId);
          if (targetNode) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(node.position.x, node.position.y);
            ctx.lineTo(targetNode.position.x, targetNode.position.y);
            ctx.stroke();
          }
        });

        // Draw node
        const nodeSize = Math.max(20, Math.min(50, node.traffic / 100));
        ctx.fillStyle = getNodeColor(node.status, node.type);
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, nodeSize, 0, 2 * Math.PI);
        ctx.fill();

        // Draw node label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.position.x, node.position.y + nodeSize + 15);
      });

      // Draw active attack flows
      if (settings.showPacketFlows) {
        visualization.flows.filter(flow => flow.status === 'active').forEach((flow, index) => {
          const progress = ((Date.now() - flow.timestamp) % flow.duration) / flow.duration;
          
          // Find source and target positions (simplified for demo)
          const sourceX = 50;
          const targetX = 750;
          const y = 150 + (index % 10) * 20;
          
          const currentX = sourceX + (targetX - sourceX) * progress;
          
          // Draw packet
          ctx.fillStyle = getSeverityColor(flow.severity);
          ctx.beginPath();
          ctx.arc(currentX, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw trail
          ctx.strokeStyle = getSeverityColor(flow.severity) + '30';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sourceX, y);
          ctx.lineTo(currentX, y);
          ctx.stroke();
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [networkNodes, visualization.flows, settings.showPacketFlows]);

  const getSeverityWeight = (severity: string): number => {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 0;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const getNodeColor = (status: string, type: string) => {
    const baseColors = {
      source: '#64748b',
      target: '#3b82f6',
      router: '#8b5cf6',
      firewall: '#10b981'
    };

    const statusModifiers = {
      normal: '',
      warning: 'dd',
      critical: 'aa'
    };

    return baseColors[type as keyof typeof baseColors] + (statusModifiers[status as keyof typeof statusModifiers] || '');
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-black';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-600 text-white animate-pulse';
      case 'blocked': return 'bg-blue-600 text-white';
      case 'completed': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const resetVisualization = () => {
    setVisualization({
      flows: [],
      activeConnections: 0,
      totalDataTransferred: 0,
      attacksBlocked: 0,
      uniqueAttackers: 0
    });
    setNetworkNodes(prev => prev.map(node => ({
      ...node,
      status: 'normal',
      traffic: 0
    })));
  };

  const filteredFlows = visualization.flows.filter(flow => 
    settings.filterSeverity === 'all' || flow.severity === settings.filterSeverity
  );

  return (
    <div className="space-y-6">
      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Active Attacks</CardTitle>
            <Activity className="h-4 w-4 text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{visualization.activeConnections}</div>
            <p className="text-xs text-red-200">live connections</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Attacks Blocked</CardTitle>
            <Target className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{visualization.attacksBlocked}</div>
            <p className="text-xs text-blue-200">security incidents</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Data Transferred</CardTitle>
            <Globe className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatBytes(visualization.totalDataTransferred)}</div>
            <p className="text-xs text-purple-200">total volume</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900 to-amber-800 border-amber-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">Unique Attackers</CardTitle>
            <Zap className="h-4 w-4 text-amber-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{visualization.uniqueAttackers}</div>
            <p className="text-xs text-amber-200">IP addresses</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Controls */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-cyan-400" />
              Live Attack Visualization
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Live Mode:</span>
                <Switch checked={isLive} onCheckedChange={setIsLive} />
              </div>
              <Button size="sm" variant="outline" onClick={resetVisualization}>
                <RotateCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm">Packet Flows:</span>
              <Switch 
                checked={settings.showPacketFlows} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showPacketFlows: checked }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Geo Location:</span>
              <Switch 
                checked={settings.showGeoLocation} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showGeoLocation: checked }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Real-time Stats:</span>
              <Switch 
                checked={settings.showRealTimeStats} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showRealTimeStats: checked }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Auto Block:</span>
              <Switch 
                checked={settings.autoBlock} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBlock: checked }))}
              />
            </div>
          </div>

          {/* Network Topology Canvas */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="w-full h-auto border border-slate-600 rounded"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* Network Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {networkNodes.map(node => (
              <div key={node.id} className="bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{node.label}</h4>
                  <Badge 
                    className={
                      node.status === 'critical' ? 'bg-red-600 text-white' :
                      node.status === 'warning' ? 'bg-yellow-600 text-black' :
                      'bg-green-600 text-white'
                    }
                  >
                    {node.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400">
                  Type: {node.type}<br />
                  Traffic: {node.traffic.toLocaleString()} packets<br />
                  Connections: {node.connections.length}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attack Flow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Attack Flows</span>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select 
                  value={settings.filterSeverity}
                  onChange={(e) => setSettings(prev => ({ ...prev, filterSeverity: e.target.value }))}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredFlows.slice(0, 20).map((flow) => (
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
                        <Badge className={getSeverityBadgeColor(flow.severity)}>
                          {flow.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusBadgeColor(flow.status)}>
                          {flow.status.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(flow.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-sm mb-2">
                      <div className="font-medium text-orange-400 mb-1">
                        {flow.attackType.toUpperCase()} Attack
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>From: <span className="text-red-400">{flow.sourceIP} ({flow.sourceCountry})</span></span>
                        <span>To: <span className="text-blue-400">{flow.targetIP}</span></span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Packets: {flow.packetCount.toLocaleString()}</span>
                      <span>Size: {formatBytes(flow.dataSize)}</span>
                      <span>Duration: {(flow.duration / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedFlow && (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>Attack Flow Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-cyan-400">Flow Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Flow ID:</span>
                      <div className="font-mono text-cyan-400">{selectedFlow.id}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Attack Type:</span>
                      <div className="text-orange-400">{selectedFlow.attackType.toUpperCase()}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Source IP:</span>
                      <div className="font-mono text-red-400">{selectedFlow.sourceIP}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Target IP:</span>
                      <div className="font-mono text-blue-400">{selectedFlow.targetIP}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Source Country:</span>
                      <div className="text-purple-400">{selectedFlow.sourceCountry}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <Badge className={getStatusBadgeColor(selectedFlow.status)}>
                        {selectedFlow.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-green-400">Traffic Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Packet Count:</span>
                      <span className="text-green-400">{selectedFlow.packetCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Data Size:</span>
                      <span className="text-green-400">{formatBytes(selectedFlow.dataSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-green-400">{(selectedFlow.duration / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Rate:</span>
                      <span className="text-green-400">
                        {formatBytes(selectedFlow.dataSize / (selectedFlow.duration / 1000))}/s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-yellow-400">Geographic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Source Coordinates:</span>
                      <span className="text-yellow-400">
                        {selectedFlow.coordinates.source.lat.toFixed(2)}, {selectedFlow.coordinates.source.lng.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Coordinates:</span>
                      <span className="text-yellow-400">
                        {selectedFlow.coordinates.target.lat.toFixed(2)}, {selectedFlow.coordinates.target.lng.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Distance:</span>
                      <span className="text-yellow-400">
                        {Math.round(Math.random() * 10000 + 1000)} km
                      </span>
                    </div>
                  </div>
                </div>

                {selectedFlow.status === 'active' && (
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Block Attack Flow
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}