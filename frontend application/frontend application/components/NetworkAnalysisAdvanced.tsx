import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Network, Search, Download, Upload, Play, Pause, AlertTriangle, 
  Eye, Settings, RefreshCw, Filter, Globe, Shield, Zap, Activity,
  FileText, Database, TrendingUp, Wifi, Router, Lock, Server, Target,
  Terminal, Package, Layers, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

interface PCAPPacket {
  id: number;
  timestamp: Date;
  frameNumber: number;
  sourceIP: string;
  destIP: string;
  sourcePort: number;
  destPort: number;
  protocol: string;
  length: number;
  info: string;
  flags: string[];
  ttl: number;
  checksum: string;
  payload: string;
  severity: 'normal' | 'warning' | 'critical';
  tcpFlags: {
    syn: boolean;
    ack: boolean;
    fin: boolean;
    rst: boolean;
    psh: boolean;
    urg: boolean;
  };
}

interface NmapScanResult {
  id: string;
  ip: string;
  hostname: string;
  status: 'up' | 'down' | 'filtered';
  openPorts: {
    port: number;
    protocol: string;
    service: string;
    version: string;
    state: 'open' | 'closed' | 'filtered';
  }[];
  os: {
    name: string;
    accuracy: number;
  };
  latency: number;
  lastScan: Date;
  vulnerabilities: string[];
  riskScore: number;
}

interface NetworkHost {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  openPorts: number;
  services: string[];
  os: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export function NetworkAnalysisAdvanced() {
  const [packets, setPackets] = useState<PCAPPacket[]>([]);
  const [nmapResults, setNmapResults] = useState<NmapScanResult[]>([]);
  const [networkHosts, setNetworkHosts] = useState<NetworkHost[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [filterProtocol, setFilterProtocol] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<PCAPPacket | null>(null);
  const [scanTarget, setScanTarget] = useState('192.168.1.0/24');
  const [scanType, setScanType] = useState('quick');
  const [captureStats, setCaptureStats] = useState({
    totalPackets: 0,
    totalBytes: 0,
    duration: 0,
    packetsPerSecond: 0,
    bytesPerSecond: 0
  });

  // Generate mock PCAP packet
  const generatePacket = (): PCAPPacket => {
    const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP', 'SMTP', 'TELNET'];
    const tcpPorts = [21, 22, 23, 25, 53, 80, 443, 3306, 3389, 5432, 8080, 8443];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    
    const sourceIP = `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    const destIP = Math.random() > 0.7 ? `8.8.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}` : 
                                         `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    
    const synFlag = Math.random() > 0.7;
    const ackFlag = Math.random() > 0.5;
    const finFlag = Math.random() > 0.85;
    const rstFlag = Math.random() > 0.9;
    
    const flags: string[] = [];
    if (synFlag) flags.push('SYN');
    if (ackFlag) flags.push('ACK');
    if (finFlag) flags.push('FIN');
    if (rstFlag) flags.push('RST');
    if (Math.random() > 0.8) flags.push('PSH');
    
    const severity: 'normal' | 'warning' | 'critical' = 
      rstFlag ? 'critical' : 
      (flags.length > 3 ? 'warning' : 'normal');
    
    return {
      id: Math.floor(Math.random() * 1000000),
      timestamp: new Date(),
      frameNumber: Math.floor(Math.random() * 10000),
      sourceIP,
      destIP,
      sourcePort: Math.floor(Math.random() * 65535),
      destPort: tcpPorts[Math.floor(Math.random() * tcpPorts.length)],
      protocol,
      length: Math.floor(Math.random() * 1500) + 60,
      info: `${protocol} packet from ${sourceIP} to ${destIP}`,
      flags,
      ttl: Math.floor(Math.random() * 64) + 64,
      checksum: Math.random().toString(16).substr(2, 8),
      payload: 'Sample payload data...',
      severity,
      tcpFlags: {
        syn: synFlag,
        ack: ackFlag,
        fin: finFlag,
        rst: rstFlag,
        psh: Math.random() > 0.8,
        urg: Math.random() > 0.95
      }
    };
  };

  // Generate mock Nmap scan result
  const generateNmapResult = (ip: string): NmapScanResult => {
    const services = [
      { port: 22, protocol: 'tcp', service: 'ssh', version: 'OpenSSH 8.9' },
      { port: 80, protocol: 'tcp', service: 'http', version: 'Apache 2.4.52' },
      { port: 443, protocol: 'tcp', service: 'https', version: 'nginx 1.22.0' },
      { port: 3306, protocol: 'tcp', service: 'mysql', version: 'MySQL 8.0.31' },
      { port: 5432, protocol: 'tcp', service: 'postgresql', version: 'PostgreSQL 14.6' },
      { port: 8080, protocol: 'tcp', service: 'http-proxy', version: 'Squid 5.2' }
    ];
    
    const openPortsCount = Math.floor(Math.random() * 4) + 2;
    const openPorts = services.slice(0, openPortsCount).map(s => ({
      ...s,
      state: Math.random() > 0.2 ? 'open' as const : 'filtered' as const
    }));
    
    const osOptions = [
      { name: 'Linux 5.15 (Ubuntu 22.04)', accuracy: 95 },
      { name: 'Windows Server 2022', accuracy: 92 },
      { name: 'macOS 13.0 Ventura', accuracy: 88 },
      { name: 'FreeBSD 13.1', accuracy: 85 }
    ];
    
    const vulnerabilities = [
      'CVE-2023-12345: Remote code execution',
      'CVE-2023-54321: SQL injection vulnerability',
      'CVE-2023-11111: Buffer overflow',
      'CVE-2023-22222: Authentication bypass'
    ];
    
    const vulnCount = Math.floor(Math.random() * 3);
    const hasVulns = vulnCount > 0;
    
    return {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ip,
      hostname: `host-${ip.split('.').join('-')}.local`,
      status: Math.random() > 0.1 ? 'up' : 'down',
      openPorts,
      os: osOptions[Math.floor(Math.random() * osOptions.length)],
      latency: Math.random() * 50 + 1,
      lastScan: new Date(),
      vulnerabilities: hasVulns ? vulnerabilities.slice(0, vulnCount) : [],
      riskScore: hasVulns ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 50) + 10
    };
  };

  // Generate mock network host
  const generateNetworkHost = (ip: string): NetworkHost => {
    const vendors = ['Intel', 'Realtek', 'Broadcom', 'Cisco', 'Dell', 'HP', 'Apple'];
    const osOptions = ['Ubuntu 22.04', 'Windows 11', 'macOS Ventura', 'CentOS 8', 'Debian 11'];
    const services = ['HTTP', 'HTTPS', 'SSH', 'FTP', 'MySQL', 'PostgreSQL', 'Redis'];
    
    const openPortsCount = Math.floor(Math.random() * 5) + 1;
    const hostServices = services.slice(0, Math.floor(Math.random() * 4) + 1);
    
    return {
      ip,
      mac: Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':'),
      hostname: `device-${ip.split('.').pop()}`,
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      status: Math.random() > 0.1 ? 'online' : 'offline',
      lastSeen: new Date(),
      openPorts: openPortsCount,
      services: hostServices,
      os: osOptions[Math.floor(Math.random() * osOptions.length)],
      riskLevel: openPortsCount > 3 ? 'high' : openPortsCount > 1 ? 'medium' : 'low'
    };
  };

  // Start packet capture
  useEffect(() => {
    if (isCapturing) {
      const interval = setInterval(() => {
        const newPacket = generatePacket();
        setPackets(prev => [newPacket, ...prev.slice(0, 499)]);
        
        setCaptureStats(prev => ({
          totalPackets: prev.totalPackets + 1,
          totalBytes: prev.totalBytes + newPacket.length,
          duration: prev.duration + 1,
          packetsPerSecond: (prev.totalPackets + 1) / (prev.duration + 1),
          bytesPerSecond: (prev.totalBytes + newPacket.length) / (prev.duration + 1)
        }));
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isCapturing]);

  // Perform Nmap scan
  const performNmapScan = () => {
    setIsScanning(true);
    setNmapResults([]);
    setNetworkHosts([]);
    
    // Simulate scanning delay
    setTimeout(() => {
      const baseIP = scanTarget.split('/')[0].split('.').slice(0, 3).join('.');
      const hostsCount = scanType === 'quick' ? 10 : scanType === 'full' ? 25 : 50;
      
      const results: NmapScanResult[] = [];
      const hosts: NetworkHost[] = [];
      
      for (let i = 1; i <= hostsCount; i++) {
        const ip = `${baseIP}.${i}`;
        results.push(generateNmapResult(ip));
        hosts.push(generateNetworkHost(ip));
      }
      
      setNmapResults(results);
      setNetworkHosts(hosts);
      setIsScanning(false);
    }, scanType === 'quick' ? 2000 : scanType === 'full' ? 4000 : 6000);
  };

  // Export PCAP
  const exportPCAP = () => {
    const pcapData = {
      metadata: {
        filename: `capture_${new Date().toISOString()}.pcap`,
        version: '2.4',
        linkType: 'Ethernet',
        snaplen: 65535,
        captureStart: new Date(Date.now() - captureStats.duration * 1000).toISOString(),
        captureEnd: new Date().toISOString(),
        totalPackets: captureStats.totalPackets,
        totalBytes: captureStats.totalBytes
      },
      packets: packets.map((p, idx) => ({
        frameNumber: idx + 1,
        timestamp: p.timestamp.toISOString(),
        captureLength: p.length,
        wireLength: p.length,
        ethernet: {
          source: '00:00:00:00:00:00',
          destination: 'ff:ff:ff:ff:ff:ff',
          type: 'IPv4'
        },
        ip: {
          version: 4,
          headerLength: 20,
          tos: 0,
          totalLength: p.length,
          identification: p.id,
          flags: p.flags.join('|'),
          fragmentOffset: 0,
          ttl: p.ttl,
          protocol: p.protocol,
          checksum: p.checksum,
          source: p.sourceIP,
          destination: p.destIP
        },
        transport: {
          sourcePort: p.sourcePort,
          destPort: p.destPort,
          protocol: p.protocol,
          flags: p.tcpFlags
        }
      }))
    };
    
    const blob = new Blob([JSON.stringify(pcapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network_capture_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Nmap results
  const exportNmapResults = () => {
    const nmapData = {
      scanMetadata: {
        target: scanTarget,
        scanType: scanType,
        timestamp: new Date().toISOString(),
        hostsScanned: nmapResults.length,
        hostsUp: nmapResults.filter(r => r.status === 'up').length
      },
      results: nmapResults
    };
    
    const blob = new Blob([JSON.stringify(nmapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmap_scan_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPackets = packets.filter(p => {
    const matchesProtocol = filterProtocol === 'all' || p.protocol === filterProtocol;
    const matchesSearch = !searchQuery || 
      p.sourceIP.includes(searchQuery) || 
      p.destIP.includes(searchQuery) ||
      p.info.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProtocol && matchesSearch;
  });

  const protocolDistribution = packets.reduce((acc, p) => {
    acc[p.protocol] = (acc[p.protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const protocolChartData = Object.entries(protocolDistribution).map(([protocol, count]) => ({
    name: protocol,
    value: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Network Analysis</h2>
          <p className="text-gray-600">PCAP Analysis & Network Scanning - Wireshark + Nmap Capabilities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPCAP} disabled={packets.length === 0} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export PCAP
          </Button>
          <Button onClick={exportNmapResults} disabled={nmapResults.length === 0} className="bg-green-600 hover:bg-green-700">
            <FileText className="h-4 w-4 mr-2" />
            Export Scan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pcap" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-200">
          <TabsTrigger value="pcap" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            PCAP Analyzer
          </TabsTrigger>
          <TabsTrigger value="nmap" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Network Scanner
          </TabsTrigger>
          <TabsTrigger value="hosts" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Host Discovery
          </TabsTrigger>
        </TabsList>

        {/* PCAP Analyzer Tab */}
        <TabsContent value="pcap" className="mt-6 space-y-6">
          {/* Capture Controls */}
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Packet Capture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setIsCapturing(!isCapturing)}
                  className={isCapturing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {isCapturing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isCapturing ? 'Stop Capture' : 'Start Capture'}
                </Button>
                
                <Select value={filterProtocol} onValueChange={setFilterProtocol}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Protocols</SelectItem>
                    <SelectItem value="TCP">TCP</SelectItem>
                    <SelectItem value="UDP">UDP</SelectItem>
                    <SelectItem value="ICMP">ICMP</SelectItem>
                    <SelectItem value="HTTP">HTTP</SelectItem>
                    <SelectItem value="HTTPS">HTTPS</SelectItem>
                    <SelectItem value="DNS">DNS</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1">
                  <Input
                    placeholder="Filter by IP address or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white"
                  />
                </div>
                
                <Button variant="outline" onClick={() => setPackets([])}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Capture Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Packets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{captureStats.totalPackets.toLocaleString()}</div>
                <p className="text-xs text-gray-600">{filteredPackets.length} displayed</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Bytes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{(captureStats.totalBytes / 1024).toFixed(1)} KB</div>
                <p className="text-xs text-gray-600">{(captureStats.totalBytes / 1024 / 1024).toFixed(2)} MB</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Capture Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{captureStats.duration}s</div>
                <p className="text-xs text-gray-600">Active time</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Packet Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{captureStats.packetsPerSecond.toFixed(1)}</div>
                <p className="text-xs text-gray-600">packets/sec</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{(captureStats.bytesPerSecond / 1024).toFixed(1)}</div>
                <p className="text-xs text-gray-600">KB/sec</p>
              </CardContent>
            </Card>
          </div>

          {/* Protocol Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle>Protocol Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={protocolChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {protocolChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle>Packet Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(protocolDistribution).slice(0, 6).map(([protocol, count]) => (
                  <div key={protocol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{protocol}</Badge>
                      <span className="text-sm text-gray-700">{count} packets</span>
                    </div>
                    <Progress 
                      value={(count / packets.length) * 100} 
                      className="w-32 h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Packet List */}
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle>Captured Packets ({filteredPackets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left p-2 text-gray-900">No.</th>
                        <th className="text-left p-2 text-gray-900">Time</th>
                        <th className="text-left p-2 text-gray-900">Source</th>
                        <th className="text-left p-2 text-gray-900">Destination</th>
                        <th className="text-left p-2 text-gray-900">Protocol</th>
                        <th className="text-left p-2 text-gray-900">Length</th>
                        <th className="text-left p-2 text-gray-900">Flags</th>
                        <th className="text-left p-2 text-gray-900">Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackets.map((packet, idx) => (
                        <tr 
                          key={packet.id}
                          className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                            packet.severity === 'critical' ? 'bg-red-50' : 
                            packet.severity === 'warning' ? 'bg-yellow-50' : ''
                          }`}
                          onClick={() => setSelectedPacket(packet)}
                        >
                          <td className="p-2 text-gray-900">{idx + 1}</td>
                          <td className="p-2 text-gray-700">{packet.timestamp.toLocaleTimeString()}</td>
                          <td className="p-2 font-mono text-xs text-blue-600">{packet.sourceIP}:{packet.sourcePort}</td>
                          <td className="p-2 font-mono text-xs text-green-600">{packet.destIP}:{packet.destPort}</td>
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs">{packet.protocol}</Badge>
                          </td>
                          <td className="p-2 text-gray-700">{packet.length} bytes</td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              {packet.flags.map(flag => (
                                <Badge key={flag} variant="outline" className="text-xs">{flag}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-gray-600 text-xs">{packet.info}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Packet Details */}
          {selectedPacket && (
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle>Packet Details - Frame #{selectedPacket.frameNumber}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">Network Layer</h4>
                      <div className="space-y-1 text-sm bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Source IP:</span>
                          <span className="font-mono text-blue-600">{selectedPacket.sourceIP}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Destination IP:</span>
                          <span className="font-mono text-green-600">{selectedPacket.destIP}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">TTL:</span>
                          <span className="text-gray-900">{selectedPacket.ttl}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Checksum:</span>
                          <span className="font-mono text-gray-700">0x{selectedPacket.checksum}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">Transport Layer</h4>
                      <div className="space-y-1 text-sm bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Protocol:</span>
                          <Badge>{selectedPacket.protocol}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Source Port:</span>
                          <span className="text-gray-900">{selectedPacket.sourcePort}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dest Port:</span>
                          <span className="text-gray-900">{selectedPacket.destPort}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Length:</span>
                          <span className="text-gray-900">{selectedPacket.length} bytes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">TCP Flags</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(selectedPacket.tcpFlags).map(([flag, value]) => (
                          <div key={flag} className={`p-2 rounded text-center ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                            <div className="text-xs font-semibold">{flag.toUpperCase()}</div>
                            <div className="text-xs">{value ? 'Set' : 'Not set'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">Payload Preview</h4>
                      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                        {selectedPacket.payload}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Network Scanner Tab */}
        <TabsContent value="nmap" className="mt-6 space-y-6">
          {/* Scan Controls */}
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Network Port Scanner (Nmap-style)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Target (e.g., 192.168.1.0/24)"
                  value={scanTarget}
                  onChange={(e) => setScanTarget(e.target.value)}
                  className="flex-1 bg-white"
                />
                
                <Select value={scanType} onValueChange={setScanType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Scan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Scan</SelectItem>
                    <SelectItem value="full">Full Scan</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={performNmapScan}
                  disabled={isScanning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Scan
                    </>
                  )}
                </Button>
              </div>
              
              {isScanning && (
                <div className="mt-4">
                  <Progress value={33} className="h-2" />
                  <p className="text-sm text-gray-600 mt-2">Scanning network... Please wait</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scan Results Summary */}
          {nmapResults.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Hosts Scanned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{nmapResults.length}</div>
                    <p className="text-xs text-gray-600">Total hosts</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Hosts Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {nmapResults.filter(r => r.status === 'up').length}
                    </div>
                    <p className="text-xs text-gray-600">Online hosts</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Open Ports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {nmapResults.reduce((sum, r) => sum + r.openPorts.filter(p => p.state === 'open').length, 0)}
                    </div>
                    <p className="text-xs text-gray-600">Total discovered</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Vulnerabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {nmapResults.reduce((sum, r) => sum + r.vulnerabilities.length, 0)}
                    </div>
                    <p className="text-xs text-gray-600">Potential issues</p>
                  </CardContent>
                </Card>
              </div>

              {/* Scan Results Table */}
              <Card className="bg-white border-gray-300 shadow-lg">
                <CardHeader>
                  <CardTitle>Scan Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {nmapResults.map((result) => (
                        <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${result.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <div className="font-mono text-blue-600 font-semibold">{result.ip}</div>
                                <div className="text-sm text-gray-600">{result.hostname}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={result.riskScore > 70 ? 'bg-red-600' : result.riskScore > 40 ? 'bg-yellow-600' : 'bg-green-600'}>
                                Risk: {result.riskScore}
                              </Badge>
                              <Badge variant="secondary">{result.latency.toFixed(1)}ms</Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm font-semibold mb-2 text-gray-900">Open Ports</h5>
                              <div className="space-y-1">
                                {result.openPorts.map((port, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                    <span className="font-mono">{port.port}/{port.protocol}</span>
                                    <span className="text-gray-600">{port.service} {port.version}</span>
                                    <Badge variant={port.state === 'open' ? 'default' : 'secondary'} className="text-xs">
                                      {port.state}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-semibold mb-2 text-gray-900">Operating System</h5>
                              <div className="bg-gray-50 p-2 rounded mb-3">
                                <div className="text-sm text-gray-900">{result.os.name}</div>
                                <div className="text-xs text-gray-600">Accuracy: {result.os.accuracy}%</div>
                              </div>
                              
                              {result.vulnerabilities.length > 0 && (
                                <>
                                  <h5 className="text-sm font-semibold mb-2 text-red-600">Vulnerabilities</h5>
                                  <div className="space-y-1">
                                    {result.vulnerabilities.map((vuln, idx) => (
                                      <div key={idx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                                        {vuln}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Host Discovery Tab */}
        <TabsContent value="hosts" className="mt-6 space-y-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-purple-600" />
                Discovered Network Hosts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {networkHosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hosts discovered. Run a network scan first.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left p-2 text-gray-900">Status</th>
                        <th className="text-left p-2 text-gray-900">IP Address</th>
                        <th className="text-left p-2 text-gray-900">MAC Address</th>
                        <th className="text-left p-2 text-gray-900">Hostname</th>
                        <th className="text-left p-2 text-gray-900">Vendor</th>
                        <th className="text-left p-2 text-gray-900">OS</th>
                        <th className="text-left p-2 text-gray-900">Ports</th>
                        <th className="text-left p-2 text-gray-900">Services</th>
                        <th className="text-left p-2 text-gray-900">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {networkHosts.map((host, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2">
                            {host.status === 'online' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </td>
                          <td className="p-2 font-mono text-blue-600">{host.ip}</td>
                          <td className="p-2 font-mono text-xs text-gray-600">{host.mac}</td>
                          <td className="p-2 text-gray-900">{host.hostname}</td>
                          <td className="p-2 text-gray-700">{host.vendor}</td>
                          <td className="p-2 text-gray-700">{host.os}</td>
                          <td className="p-2 text-center">
                            <Badge variant="secondary">{host.openPorts}</Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1 flex-wrap">
                              {host.services.slice(0, 3).map((service, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{service}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge className={
                              host.riskLevel === 'critical' ? 'bg-red-600' :
                              host.riskLevel === 'high' ? 'bg-orange-600' :
                              host.riskLevel === 'medium' ? 'bg-yellow-600' :
                              'bg-green-600'
                            }>
                              {host.riskLevel}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
