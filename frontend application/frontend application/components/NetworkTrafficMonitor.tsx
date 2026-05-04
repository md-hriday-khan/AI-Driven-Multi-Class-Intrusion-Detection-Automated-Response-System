import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Network, Activity, Wifi, HardDrive, Upload, Download } from 'lucide-react';

interface NetworkMetric {
  timestamp: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  bandwidth: number;
  connections: number;
}

interface ProtocolData {
  name: string;
  value: number;
  color: string;
}

export function NetworkTrafficMonitor() {
  const [metrics, setMetrics] = useState<NetworkMetric[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    packetsPerSecond: 2450,
    bytesPerSecond: 15.7, // MB/s
    bandwidth: 73.2, // % utilization
    connections: 1247,
    inboundTraffic: 8.4, // MB/s
    outboundTraffic: 7.3 // MB/s
  });

  const [protocolDistribution, setProtocolDistribution] = useState<ProtocolData[]>([
    { name: 'HTTP/HTTPS', value: 45.2, color: '#3B82F6' },
    { name: 'TCP', value: 28.7, color: '#10B981' },
    { name: 'UDP', value: 15.8, color: '#F59E0B' },
    { name: 'DNS', value: 6.1, color: '#8B5CF6' },
    { name: 'SSH', value: 2.9, color: '#EF4444' },
    { name: 'Other', value: 1.3, color: '#6B7280' }
  ]);

  const [timeRange, setTimeRange] = useState('5m');

  useEffect(() => {
    // Initialize historical data
    const now = Date.now();
    const initialData: NetworkMetric[] = [];
    
    for (let i = 60; i >= 0; i--) {
      initialData.push({
        timestamp: now - (i * 5000), // 5 second intervals
        packetsPerSecond: 2000 + Math.random() * 1000,
        bytesPerSecond: 10 + Math.random() * 10,
        bandwidth: 60 + Math.random() * 30,
        connections: 1000 + Math.random() * 500
      });
    }
    
    setMetrics(initialData);

    // Real-time updates via simulated WebSocket
    const interval = setInterval(() => {
      const newMetric: NetworkMetric = {
        timestamp: Date.now(),
        packetsPerSecond: Math.max(500, currentMetrics.packetsPerSecond + (Math.random() - 0.5) * 200),
        bytesPerSecond: Math.max(1, currentMetrics.bytesPerSecond + (Math.random() - 0.5) * 2),
        bandwidth: Math.max(10, Math.min(95, currentMetrics.bandwidth + (Math.random() - 0.5) * 5)),
        connections: Math.max(100, currentMetrics.connections + Math.floor((Math.random() - 0.5) * 50))
      };

      setCurrentMetrics(prev => ({
        ...prev,
        packetsPerSecond: newMetric.packetsPerSecond,
        bytesPerSecond: newMetric.bytesPerSecond,
        bandwidth: newMetric.bandwidth,
        connections: newMetric.connections,
        inboundTraffic: Math.max(0.1, prev.inboundTraffic + (Math.random() - 0.5) * 1),
        outboundTraffic: Math.max(0.1, prev.outboundTraffic + (Math.random() - 0.5) * 1)
      }));

      setMetrics(prev => [...prev.slice(-59), newMetric]);

      // Update protocol distribution occasionally
      if (Math.random() > 0.9) {
        setProtocolDistribution(prev => prev.map(protocol => ({
          ...protocol,
          value: Math.max(0.5, protocol.value + (Math.random() - 0.5) * 2)
        })));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentMetrics.packetsPerSecond, currentMetrics.bytesPerSecond, currentMetrics.bandwidth, currentMetrics.connections]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} MB/s`;
  };

  const formatPackets = (packets: number) => {
    return `${packets.toLocaleString()} pps`;
  };

  const exportPcapData = () => {
    // Generate mock PCAP data with proper headers
    const pcapData = {
      metadata: {
        filename: `network_capture_${new Date().toISOString().split('T')[0]}.pcap`,
        timestamp: new Date().toISOString(),
        duration: '1 hour',
        total_packets: currentMetrics.packetsPerSecond * 3600,
        total_bytes: currentMetrics.bytesPerSecond * 1024 * 1024 * 3600,
        protocols: protocolDistribution,
        capture_interface: 'eth0',
        filter: 'all traffic'
      },
      packets: metrics.slice(-100).map((metric, index) => ({
        packet_id: index + 1,
        timestamp: metric.timestamp,
        source_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        dest_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        protocol: ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS'][Math.floor(Math.random() * 5)],
        source_port: Math.floor(Math.random() * 65535),
        dest_port: Math.floor(Math.random() * 65535),
        packet_size: Math.floor(Math.random() * 1500) + 64,
        flags: ['SYN', 'ACK', 'FIN', 'RST'][Math.floor(Math.random() * 4)],
        payload_preview: 'GET /api/data HTTP/1.1...'
      })),
      statistics: {
        packet_rate_avg: currentMetrics.packetsPerSecond,
        bandwidth_utilization: currentMetrics.bandwidth,
        top_talkers: [
          { ip: '192.168.1.100', bytes: 1024000, packets: 500 },
          { ip: '192.168.1.101', bytes: 896000, packets: 420 },
          { ip: '192.168.1.102', bytes: 745000, packets: 380 }
        ]
      }
    };

    // Create downloadable PCAP file (JSON format for demo)
    const dataStr = JSON.stringify(pcapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pcapData.metadata.filename.replace('.pcap', '.json');
    link.click();
    URL.revokeObjectURL(url);

    // Also create a CSV summary for analysis
    const csvData = pcapData.packets.map(packet => ({
      'Packet ID': packet.packet_id,
      'Timestamp': new Date(packet.timestamp).toISOString(),
      'Source IP': packet.source_ip,
      'Destination IP': packet.dest_ip,
      'Protocol': packet.protocol,
      'Source Port': packet.source_port,
      'Destination Port': packet.dest_port,
      'Packet Size': packet.packet_size,
      'Flags': packet.flags
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = `network_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    csvLink.click();
    URL.revokeObjectURL(csvUrl);
  };

  const exportNetworkReport = () => {
    const report = {
      report_metadata: {
        title: 'Network Traffic Analysis Report',
        generated: new Date().toISOString(),
        period: `${timeRange} monitoring period`,
        author: 'SHIELD Network Monitoring System'
      },
      executive_summary: {
        total_packets: currentMetrics.packetsPerSecond * 3600,
        average_bandwidth: currentMetrics.bandwidth,
        active_connections: currentMetrics.connections,
        security_alerts: Math.floor(Math.random() * 10),
        anomalies_detected: Math.floor(Math.random() * 5)
      },
      traffic_analysis: {
        protocol_distribution: protocolDistribution,
        peak_hours: ['09:00-10:00', '14:00-15:00', '20:00-21:00'],
        bandwidth_trends: metrics.slice(-20).map(m => ({
          time: new Date(m.timestamp).toISOString(),
          bandwidth_percent: ((m.bytesPerSecond / 125) * 100).toFixed(2) // Convert to % of 1Gbps
        }))
      },
      security_findings: {
        suspicious_traffic: [
          { source: '192.168.1.254', reason: 'High volume outbound traffic', risk: 'medium' },
          { source: '192.168.1.100', reason: 'Unusual port scanning activity', risk: 'high' }
        ],
        blocked_connections: Math.floor(Math.random() * 50),
        quarantined_ips: ['192.168.1.250', '10.0.0.100']
      },
      recommendations: [
        'Implement rate limiting for high-volume sources',
        'Review firewall rules for port scanning prevention',
        'Enable DPI for encrypted traffic analysis',
        'Deploy additional sensors for comprehensive coverage'
      ]
    };

    const reportStr = JSON.stringify(report, null, 2);
    const reportBlob = new Blob([reportStr], { type: 'application/json' });
    const url = URL.createObjectURL(reportBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `network_security_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Network Traffic Monitor</h2>
          <p className="text-gray-600">Real-time network analysis and packet capture - Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPcapData} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export PCAP
          </Button>
          <Button onClick={exportNetworkReport} className="bg-green-600 hover:bg-green-700">
            <HardDrive className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Packet Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.packetsPerSecond.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">packets/second</p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Live
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Bandwidth Usage</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{currentMetrics.bandwidth.toFixed(1)}%</div>
            <Progress value={currentMetrics.bandwidth} className="mt-2 h-2" />
            <p className="text-xs text-gray-600 mt-1">of 1 Gbps capacity</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Active Connections</CardTitle>
            <Network className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.connections.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">concurrent sessions</p>
            <div className="flex gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Upload className="h-3 w-3 text-green-600" />
                <span className="text-xs text-gray-700">{formatBytes(currentMetrics.inboundTraffic)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-gray-700">{formatBytes(currentMetrics.outboundTraffic)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Data Throughput</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(currentMetrics.bytesPerSecond)}
            </div>
            <p className="text-xs text-gray-600">total throughput</p>
            <div className="mt-2">
              <Progress 
                value={(currentMetrics.bytesPerSecond / 25) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packet Rate Timeline */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Network Traffic Timeline</CardTitle>
              <div className="flex gap-2">
                {['5m', '1h', '6h'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
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
                  formatter={(value: any, name: string) => {
                    if (name === 'packetsPerSecond') {
                      return [formatPackets(value), 'Packets/sec'];
                    }
                    return [formatBytes(value), 'Bytes/sec'];
                  }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    color: '#111827'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="packetsPerSecond" 
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  name="Packets/sec"
                />
                <Area 
                  type="monotone" 
                  dataKey="bytesPerSecond" 
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.3}
                  name="Bytes/sec"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Protocol Distribution */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Protocol Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={protocolDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {protocolDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Traffic']}
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {protocolDistribution.map((protocol, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: protocol.color }}
                      />
                      <span className="text-sm">{protocol.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{protocol.value.toFixed(1)}%</span>
                      <Progress 
                        value={protocol.value} 
                        className="w-16 h-2" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bandwidth Utilization */}
      <Card className="bg-white border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">Bandwidth Utilization Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
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
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Bandwidth']}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="bandwidth" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network Statistics Table */}
      <Card className="bg-white border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">Network Interface Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 text-gray-900">Interface</th>
                  <th className="text-left p-2 text-gray-900">Status</th>
                  <th className="text-left p-2 text-gray-900">RX Packets</th>
                  <th className="text-left p-2 text-gray-900">TX Packets</th>
                  <th className="text-left p-2 text-gray-900">RX Bytes</th>
                  <th className="text-left p-2 text-gray-900">TX Bytes</th>
                  <th className="text-left p-2 text-gray-900">Errors</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-medium text-gray-900">eth0</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="bg-green-500 text-white">UP</Badge>
                  </td>
                  <td className="p-2 text-gray-900">{(currentMetrics.packetsPerSecond * 3600).toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.packetsPerSecond * 3400).toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.inboundTraffic * 1024).toFixed(1)} GB</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.outboundTraffic * 1024).toFixed(1)} GB</td>
                  <td className="p-2 text-gray-900">0</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-medium text-gray-900">eth1</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="bg-green-500 text-white">UP</Badge>
                  </td>
                  <td className="p-2 text-gray-900">{(currentMetrics.packetsPerSecond * 1200).toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.packetsPerSecond * 1150).toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.inboundTraffic * 340).toFixed(1)} GB</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.outboundTraffic * 320).toFixed(1)} GB</td>
                  <td className="p-2 text-gray-900">2</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-medium text-gray-900">lo</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="bg-green-500 text-white">UP</Badge>
                  </td>
                  <td className="p-2 text-gray-900">{(currentMetrics.packetsPerSecond * 45).toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.packetsPerSecond * 45).toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.inboundTraffic * 2.1).toFixed(1)} GB</td>
                  <td className="p-2 text-gray-900">{(currentMetrics.outboundTraffic * 2.1).toFixed(1)} GB</td>
                  <td className="p-2">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}