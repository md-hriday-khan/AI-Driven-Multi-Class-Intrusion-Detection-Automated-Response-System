import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Network, Search, Filter, Download, Play, Pause, AlertTriangle, 
  Eye, Settings, RefreshCw, Clock, Globe, Shield, Zap, Activity,
  FileText, Database, TrendingUp, Wifi, Router, Lock, ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface NetworkPacket {
  id: string;
  timestamp: Date;
  sourceIP: string;
  destIP: string;
  sourcePort: number;
  destPort: number;
  protocol: string;
  length: number;
  flags: string[];
  payload: string;
  direction: 'inbound' | 'outbound';
  severity: 'low' | 'medium' | 'high' | 'critical';
  vulnerability?: string;
  geolocation: {
    country: string;
    city: string;
    isp: string;
  };
}

interface VulnerabilityAssessment {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_ips: string[];
  affected_ports: number[];
  cve_ids: string[];
  mitigation: string;
  first_seen: Date;
  last_seen: Date;
  count: number;
}

interface ProtocolStats {
  protocol: string;
  packets: number;
  bytes: number;
  percentage: number;
  vulnerabilities: number;
}

interface NetworkFlow {
  id: string;
  sourceIP: string;
  destIP: string;
  sourcePort: number;
  destPort: number;
  protocol: string;
  packets: number;
  bytes: number;
  duration: number;
  flags: string[];
  risk_score: number;
}

export function WiresharkAnalyzer() {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityAssessment[]>([]);
  const [protocolStats, setProtocolStats] = useState<ProtocolStats[]>([]);
  const [networkFlows, setNetworkFlows] = useState<NetworkFlow[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('all');
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any[]>([]);

  useEffect(() => {
    // Initialize network data
    const generateRandomIP = () => {
      return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    };

    const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP', 'SMTP'];
    const countries = ['United States', 'China', 'Russia', 'Germany', 'United Kingdom', 'France', 'Japan', 'Brazil'];
    const cities = ['New York', 'Beijing', 'Moscow', 'Berlin', 'London', 'Paris', 'Tokyo', 'São Paulo'];
    const isps = ['Comcast', 'China Telecom', 'Rostelecom', 'Deutsche Telekom', 'BT Group', 'Orange', 'NTT', 'Vivo'];

    const initialPackets: NetworkPacket[] = Array.from({ length: 50 }, (_, i) => {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const sourceIP = generateRandomIP();
      const destIP = generateRandomIP();
      const countryIndex = Math.floor(Math.random() * countries.length);
      
      return {
        id: `pkt_${i}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        sourceIP,
        destIP,
        sourcePort: Math.floor(Math.random() * 65535) + 1,
        destPort: Math.floor(Math.random() * 65535) + 1,
        protocol,
        length: Math.floor(Math.random() * 1500) + 64,
        flags: ['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG'].filter(() => Math.random() > 0.7),
        payload: `${protocol} payload data - ${Math.random().toString(36).substring(7)}`,
        direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        vulnerability: Math.random() > 0.8 ? `CVE-2024-${Math.floor(Math.random() * 9999)}` : undefined,
        geolocation: {
          country: countries[countryIndex],
          city: cities[countryIndex],
          isp: isps[countryIndex]
        }
      };
    });

    const initialVulnerabilities: VulnerabilityAssessment[] = [
      {
        id: 'vuln_1',
        type: 'Port Scan Detection',
        severity: 'medium',
        description: 'Multiple connection attempts to various ports detected from single source',
        affected_ips: ['192.168.1.45', '192.168.1.67'],
        affected_ports: [21, 22, 23, 80, 443],
        cve_ids: [],
        mitigation: 'Block source IP, enable rate limiting',
        first_seen: new Date(Date.now() - 7200000),
        last_seen: new Date(Date.now() - 3600000),
        count: 347
      },
      {
        id: 'vuln_2',
        type: 'SQL Injection Attempt',
        severity: 'high',
        description: 'Malicious SQL injection patterns detected in HTTP requests',
        affected_ips: ['10.0.0.15'],
        affected_ports: [80, 443],
        cve_ids: ['CVE-2024-1234', 'CVE-2024-5678'],
        mitigation: 'Update web application, implement WAF rules',
        first_seen: new Date(Date.now() - 1800000),
        last_seen: new Date(Date.now() - 300000),
        count: 23
      },
      {
        id: 'vuln_3',
        type: 'DDoS Attack',
        severity: 'critical',
        description: 'High volume of traffic from multiple sources targeting specific endpoint',
        affected_ips: ['203.0.113.1'],
        affected_ports: [80],
        cve_ids: [],
        mitigation: 'Enable DDoS protection, rate limiting, traffic shaping',
        first_seen: new Date(Date.now() - 900000),
        last_seen: new Date(Date.now() - 60000),
        count: 15743
      },
      {
        id: 'vuln_4',
        type: 'Suspicious SSH Activity',
        severity: 'high',
        description: 'Multiple failed SSH login attempts with common usernames',
        affected_ips: ['172.16.0.10'],
        affected_ports: [22],
        cve_ids: [],
        mitigation: 'Disable root login, implement fail2ban, use key-based auth',
        first_seen: new Date(Date.now() - 3600000),
        last_seen: new Date(Date.now() - 1800000),
        count: 156
      },
      {
        id: 'vuln_5',
        type: 'DNS Tunneling',
        severity: 'medium',
        description: 'Unusual DNS query patterns suggesting data exfiltration',
        affected_ips: ['192.168.1.100'],
        affected_ports: [53],
        cve_ids: [],
        mitigation: 'Monitor DNS queries, implement DNS filtering',
        first_seen: new Date(Date.now() - 2700000),
        last_seen: new Date(Date.now() - 900000),
        count: 89
      }
    ];

    const protocolData = protocols.map(protocol => ({
      protocol,
      packets: Math.floor(Math.random() * 10000) + 1000,
      bytes: Math.floor(Math.random() * 1000000) + 100000,
      percentage: Math.floor(Math.random() * 30) + 5,
      vulnerabilities: Math.floor(Math.random() * 10)
    }));

    const flowData: NetworkFlow[] = Array.from({ length: 20 }, (_, i) => ({
      id: `flow_${i}`,
      sourceIP: generateRandomIP(),
      destIP: generateRandomIP(),
      sourcePort: Math.floor(Math.random() * 65535) + 1,
      destPort: Math.floor(Math.random() * 65535) + 1,
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      packets: Math.floor(Math.random() * 1000) + 10,
      bytes: Math.floor(Math.random() * 100000) + 1000,
      duration: Math.floor(Math.random() * 3600) + 1,
      flags: ['SYN', 'ACK', 'FIN'].filter(() => Math.random() > 0.5),
      risk_score: Math.floor(Math.random() * 100)
    }));

    // Generate traffic timeline data
    const timelineData = Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      packets: Math.floor(Math.random() * 10000) + 1000,
      bytes: Math.floor(Math.random() * 1000000) + 100000,
      threats: Math.floor(Math.random() * 50),
      vulnerabilities: Math.floor(Math.random() * 20)
    }));

    // Generate geographical data
    const geoTrafficData = countries.map((country, i) => ({
      country,
      city: cities[i],
      packets: Math.floor(Math.random() * 50000) + 5000,
      threats: Math.floor(Math.random() * 100) + 10,
      risk_level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
    }));

    setPackets(initialPackets);
    setVulnerabilities(initialVulnerabilities);
    setProtocolStats(protocolData);
    setNetworkFlows(flowData);
    setTrafficData(timelineData);
    setGeoData(geoTrafficData);

    // Simulate real-time packet capture
    const captureInterval = setInterval(() => {
      if (isCapturing) {
        const newPacket: NetworkPacket = {
          id: `pkt_${Date.now()}`,
          timestamp: new Date(),
          sourceIP: generateRandomIP(),
          destIP: generateRandomIP(),
          sourcePort: Math.floor(Math.random() * 65535) + 1,
          destPort: Math.floor(Math.random() * 65535) + 1,
          protocol: protocols[Math.floor(Math.random() * protocols.length)],
          length: Math.floor(Math.random() * 1500) + 64,
          flags: ['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG'].filter(() => Math.random() > 0.7),
          payload: `Real-time captured data - ${Math.random().toString(36).substring(7)}`,
          direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          vulnerability: Math.random() > 0.9 ? `CVE-2024-${Math.floor(Math.random() * 9999)}` : undefined,
          geolocation: {
            country: countries[Math.floor(Math.random() * countries.length)],
            city: cities[Math.floor(Math.random() * cities.length)],
            isp: isps[Math.floor(Math.random() * isps.length)]
          }
        };
        
        setPackets(prev => [newPacket, ...prev.slice(0, 99)]);
      }
    }, 2000);

    return () => clearInterval(captureInterval);
  }, [isCapturing]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const filteredPackets = packets.filter(packet => {
    const matchesFilter = filterText === '' || 
      packet.sourceIP.includes(filterText) ||
      packet.destIP.includes(filterText) ||
      packet.protocol.toLowerCase().includes(filterText.toLowerCase()) ||
      packet.sourcePort.toString().includes(filterText) ||
      packet.destPort.toString().includes(filterText);
    
    const matchesProtocol = selectedProtocol === 'all' || packet.protocol === selectedProtocol;
    
    return matchesFilter && matchesProtocol;
  });

  const totalPackets = packets.length;
  const totalVulnerabilities = vulnerabilities.length;
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
  const averagePacketSize = packets.reduce((acc, p) => acc + p.length, 0) / packets.length || 0;

  const pieData = protocolStats.slice(0, 6).map(stat => ({
    name: stat.protocol,
    value: stat.packets,
    color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][protocolStats.indexOf(stat) % 6]
  }));

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Network Traffic Analyzer
          </h1>
          <p className="text-slate-600">Wireshark-style packet analysis and vulnerability assessment - Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isCapturing ? "destructive" : "default"}
            onClick={() => setIsCapturing(!isCapturing)}
            className={isCapturing ? "" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"}
          >
            {isCapturing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isCapturing ? 'Stop Capture' : 'Start Capture'}
          </Button>
          <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
            <Download className="h-4 w-4 mr-2" />
            Export PCAP
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Packets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPackets.toLocaleString()}</div>
            <div className="flex items-center text-purple-100 text-sm">
              <Activity className="h-4 w-4 mr-1" />
              {isCapturing ? 'Live Capturing' : 'Paused'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVulnerabilities}</div>
            <div className="text-red-100 text-sm">
              {criticalVulns} critical issues
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Packet Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averagePacketSize)} B</div>
            <div className="text-blue-100 text-sm">
              Network efficiency metric
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkFlows.length}</div>
            <div className="text-green-100 text-sm">
              Current connections
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packets" className="space-y-6">
        <TabsList className="bg-white border border-purple-200">
          <TabsTrigger value="packets" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Packet Capture
          </TabsTrigger>
          <TabsTrigger value="vulnerabilities" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Vulnerability Assessment
          </TabsTrigger>
          <TabsTrigger value="flows" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Network Flows
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Traffic Analysis
          </TabsTrigger>
          <TabsTrigger value="geographic" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Geographic View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packets" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-700">Live Packet Capture</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Filter by IP, port, protocol..."
                    className="pl-10 border-purple-200 focus:ring-purple-500"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                  <SelectTrigger className="w-32 border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Protocols</SelectItem>
                    <SelectItem value="TCP">TCP</SelectItem>
                    <SelectItem value="UDP">UDP</SelectItem>
                    <SelectItem value="HTTP">HTTP</SelectItem>
                    <SelectItem value="HTTPS">HTTPS</SelectItem>
                    <SelectItem value="DNS">DNS</SelectItem>
                    <SelectItem value="SSH">SSH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredPackets.map((packet) => (
                    <div key={packet.id} className="border border-purple-100 rounded-lg p-3 hover:bg-purple-50 transition-colors text-sm font-mono">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1">
                          <Badge className={getDirectionColor(packet.direction)}>
                            {packet.direction === 'inbound' ? '→' : '←'}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-xs">
                          {packet.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="col-span-2">
                          <span className="text-blue-600">{packet.sourceIP}</span>
                          <span className="text-slate-500">:{packet.sourcePort}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-green-600">{packet.destIP}</span>
                          <span className="text-slate-500">:{packet.destPort}</span>
                        </div>
                        <div className="col-span-1">
                          <Badge variant="outline" className="text-xs">
                            {packet.protocol}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-slate-600">
                          {packet.length}B
                        </div>
                        <div className="col-span-2">
                          {packet.flags.map(flag => (
                            <Badge key={flag} variant="outline" className="text-xs mr-1">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                        <div className="col-span-1">
                          <Badge className={getSeverityColor(packet.severity)}>
                            {packet.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {packet.vulnerability && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                          <span className="font-medium text-red-800">Vulnerability Detected: </span>
                          <span className="text-red-600">{packet.vulnerability}</span>
                        </div>
                      )}
                      <div className="mt-1 text-xs text-slate-500 truncate">
                        <span className="font-medium">Payload:</span> {packet.payload}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        <span className="font-medium">Location:</span> {packet.geolocation.city}, {packet.geolocation.country} ({packet.geolocation.isp})
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vulnerabilities.map((vuln) => (
              <Card key={vuln.id} className="border-purple-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-purple-700">{vuln.type}</CardTitle>
                    <Badge className={getSeverityColor(vuln.severity)}>
                      {vuln.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{vuln.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-2">Affected IPs</h4>
                      <div className="space-y-1">
                        {vuln.affected_ips.map(ip => (
                          <Badge key={ip} variant="outline" className="text-xs mr-1">
                            {ip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700 mb-2">Affected Ports</h4>
                      <div className="space-y-1">
                        {vuln.affected_ports.map(port => (
                          <Badge key={port} variant="outline" className="text-xs mr-1">
                            {port}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {vuln.cve_ids.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-700 mb-2">CVE References</h4>
                      <div className="space-y-1">
                        {vuln.cve_ids.map(cve => (
                          <Badge key={cve} className="bg-red-100 text-red-800 text-xs mr-1">
                            {cve}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Mitigation</h4>
                    <p className="text-sm text-slate-600">{vuln.mitigation}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center pt-2 border-t border-purple-100">
                    <div>
                      <div className="text-lg font-bold text-purple-600">{vuln.count}</div>
                      <div className="text-xs text-slate-500">Occurrences</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">First Seen</div>
                      <div className="text-xs text-slate-500">{vuln.first_seen.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Last Seen</div>
                      <div className="text-xs text-slate-500">{vuln.last_seen.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flows" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-700">Active Network Flows</CardTitle>
              <p className="text-sm text-slate-600">Real-time connection analysis with risk scoring</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {networkFlows.map((flow) => (
                    <div key={flow.id} className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                      <div className="grid grid-cols-8 gap-4 items-center text-sm">
                        <div className="col-span-2">
                          <div className="font-mono text-blue-600">{flow.sourceIP}:{flow.sourcePort}</div>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="text-slate-400">→</span>
                        </div>
                        <div className="col-span-2">
                          <div className="font-mono text-green-600">{flow.destIP}:{flow.destPort}</div>
                        </div>
                        <div className="col-span-1">
                          <Badge variant="outline" className="text-xs">
                            {flow.protocol}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-center">
                          <div className="text-slate-600">{flow.packets} pkts</div>
                          <div className="text-xs text-slate-500">{(flow.bytes / 1024).toFixed(1)}KB</div>
                        </div>
                        <div className="col-span-1 text-center">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            flow.risk_score > 80 ? 'bg-red-100 text-red-800' :
                            flow.risk_score > 60 ? 'bg-orange-100 text-orange-800' :
                            flow.risk_score > 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {flow.risk_score}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span>Duration: {Math.floor(flow.duration / 60)}m {flow.duration % 60}s</span>
                        {flow.flags.length > 0 && (
                          <span>
                            Flags: {flow.flags.map(flag => (
                              <Badge key={flag} variant="outline" className="text-xs ml-1">
                                {flag}
                              </Badge>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Traffic Timeline (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="packets" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="threats" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Protocol Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Protocol Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={protocolStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="protocol" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="packets" fill="#8b5cf6" />
                    <Bar dataKey="vulnerabilities" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Vulnerability Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="vulnerabilities" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="threats" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-700">Geographic Traffic Analysis</CardTitle>
              <p className="text-sm text-slate-600">Traffic sources and threat origins by location</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {geoData.map((location, index) => (
                  <div key={index} className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-purple-700">{location.country}</h4>
                        <p className="text-sm text-slate-600">{location.city}</p>
                      </div>
                      <Badge className={getSeverityColor(location.risk_level)}>
                        {location.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Packets</span>
                        <span className="font-medium">{location.packets.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Threats</span>
                        <span className="font-medium text-red-600">{location.threats}</span>
                      </div>
                      <div className="h-2 bg-purple-100 rounded-full">
                        <div 
                          className="h-2 bg-purple-500 rounded-full transition-all"
                          style={{ width: `${(location.threats / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}