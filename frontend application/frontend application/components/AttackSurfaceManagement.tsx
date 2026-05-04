import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, Server, Globe, Wifi, AlertTriangle, Eye, Target, Lock, 
  Activity, Network, Zap, Database, FileCheck, Users, MapPin,
  TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertOctagon
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface AssetData {
  id: string;
  name: string;
  type: 'server' | 'endpoint' | 'network' | 'application' | 'database' | 'iot';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number;
  vulnerabilities: number;
  lastScan: Date;
  status: 'online' | 'offline' | 'maintenance' | 'compromised';
  location: string;
  owner: string;
}

interface VulnerabilityData {
  id: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  asset: string;
  description: string;
  discoveredDate: Date;
  status: 'open' | 'patched' | 'mitigated' | 'accepted';
  exploitAvailable: boolean;
}

interface ExposureData {
  category: string;
  exposed: number;
  total: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

const AttackSurfaceManagement: React.FC = () => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityData[]>([]);
  const [exposureData, setExposureData] = useState<ExposureData[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Mock data generation
  useEffect(() => {
    // Generate mock assets
    const mockAssets: AssetData[] = [
      {
        id: 'srv-001',
        name: 'Web Server Alpha',
        type: 'server',
        criticality: 'critical',
        riskScore: 8.5,
        vulnerabilities: 12,
        lastScan: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'online',
        location: 'Data Center A',
        owner: 'IT Operations'
      },
      {
        id: 'ep-002',
        name: 'Executive Workstation',
        type: 'endpoint',
        criticality: 'high',
        riskScore: 6.2,
        vulnerabilities: 5,
        lastScan: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'online',
        location: 'Floor 15',
        owner: 'Executive Team'
      },
      {
        id: 'db-003',
        name: 'Customer Database',
        type: 'database',
        criticality: 'critical',
        riskScore: 9.1,
        vulnerabilities: 8,
        lastScan: new Date(Date.now() - 1 * 60 * 60 * 1000),
        status: 'online',
        location: 'Secure Zone',
        owner: 'Database Team'
      },
      {
        id: 'iot-004',
        name: 'Security Cameras',
        type: 'iot',
        criticality: 'medium',
        riskScore: 4.7,
        vulnerabilities: 15,
        lastScan: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: 'online',
        location: 'Building Perimeter',
        owner: 'Physical Security'
      },
      {
        id: 'app-005',
        name: 'Customer Portal',
        type: 'application',
        criticality: 'high',
        riskScore: 7.3,
        vulnerabilities: 7,
        lastScan: new Date(Date.now() - 3 * 60 * 60 * 1000),
        status: 'online',
        location: 'DMZ',
        owner: 'Application Team'
      }
    ];

    // Generate mock vulnerabilities
    const mockVulnerabilities: VulnerabilityData[] = [
      {
        id: 'vuln-001',
        cve: 'CVE-2024-0001',
        severity: 'critical',
        cvss: 9.8,
        asset: 'Web Server Alpha',
        description: 'Remote code execution vulnerability in web framework',
        discoveredDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'open',
        exploitAvailable: true
      },
      {
        id: 'vuln-002',
        cve: 'CVE-2024-0002',
        severity: 'high',
        cvss: 8.1,
        asset: 'Customer Database',
        description: 'SQL injection vulnerability in user authentication',
        discoveredDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        status: 'mitigated',
        exploitAvailable: false
      },
      {
        id: 'vuln-003',
        cve: 'CVE-2024-0003',
        severity: 'medium',
        cvss: 6.5,
        asset: 'Security Cameras',
        description: 'Default credentials vulnerability',
        discoveredDate: new Date(Date.now() - 72 * 60 * 60 * 1000),
        status: 'open',
        exploitAvailable: true
      }
    ];

    // Generate exposure data
    const mockExposureData: ExposureData[] = [
      { category: 'Web Applications', exposed: 12, total: 45, riskLevel: 'high' },
      { category: 'Database Services', exposed: 3, total: 8, riskLevel: 'critical' },
      { category: 'IoT Devices', exposed: 28, total: 150, riskLevel: 'medium' },
      { category: 'Network Services', exposed: 7, total: 25, riskLevel: 'high' },
      { category: 'API Endpoints', exposed: 15, total: 60, riskLevel: 'medium' }
    ];

    setAssets(mockAssets);
    setVulnerabilities(mockVulnerabilities);
    setExposureData(mockExposureData);
  }, []);

  // Simulate scanning process
  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 8) return 'text-red-600 bg-red-50 border-red-200';
    if (riskScore >= 6) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (riskScore >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'compromised': return <AlertOctagon className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-5 w-5" />;
      case 'endpoint': return <Users className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      case 'application': return <Globe className="h-5 w-5" />;
      case 'network': return <Network className="h-5 w-5" />;
      case 'iot': return <Wifi className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const attackSurfaceMetrics = [
    { name: 'Critical Assets', value: assets.filter(a => a.criticality === 'critical').length },
    { name: 'High Risk Assets', value: assets.filter(a => a.riskScore >= 7).length },
    { name: 'Open Vulnerabilities', value: vulnerabilities.filter(v => v.status === 'open').length },
    { name: 'Exposed Services', value: exposureData.reduce((sum, e) => sum + e.exposed, 0) }
  ];

  const riskTrendData = [
    { month: 'Jan', riskScore: 6.2, vulnerabilities: 45 },
    { month: 'Feb', riskScore: 6.8, vulnerabilities: 52 },
    { month: 'Mar', riskScore: 7.1, vulnerabilities: 58 },
    { month: 'Apr', riskScore: 6.9, vulnerabilities: 48 },
    { month: 'May', riskScore: 7.5, vulnerabilities: 61 },
    { month: 'Jun', riskScore: 7.8, vulnerabilities: 67 }
  ];

  const assetDistribution = [
    { name: 'Servers', value: assets.filter(a => a.type === 'server').length, color: '#8b5cf6' },
    { name: 'Endpoints', value: assets.filter(a => a.type === 'endpoint').length, color: '#06b6d4' },
    { name: 'Applications', value: assets.filter(a => a.type === 'application').length, color: '#10b981' },
    { name: 'Databases', value: assets.filter(a => a.type === 'database').length, color: '#f59e0b' },
    { name: 'IoT Devices', value: assets.filter(a => a.type === 'iot').length, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Attack Surface Management
          </h2>
          <p className="text-slate-600 mt-2">Comprehensive visibility and risk assessment of your digital attack surface</p>
          <p className="text-xs text-slate-500 mt-1">Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={startScan} 
            disabled={isScanning}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isScanning ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <Alert className="border-purple-200 bg-purple-50">
          <Activity className="h-4 w-4 text-purple-600 animate-spin" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Attack Surface Discovery in Progress</span>
                <span className="text-sm">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {attackSurfaceMetrics.map((metric, index) => (
          <Card key={index} className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="exposure">Exposure</TabsTrigger>
          <TabsTrigger value="risk-trends">Risk Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Distribution */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Asset Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={assetDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {assetDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {assetDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-sm text-slate-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Score Trend */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Risk Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={riskTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="riskScore" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Exposure Summary */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Service Exposure Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exposureData.map((exposure, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">{exposure.category}</p>
                        <p className="text-sm text-slate-600">
                          {exposure.exposed} of {exposure.total} exposed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={(exposure.exposed / exposure.total) * 100} 
                        className="w-24 h-2"
                      />
                      <Badge 
                        variant={exposure.riskLevel === 'critical' ? 'destructive' : 
                                exposure.riskLevel === 'high' ? 'destructive' : 'secondary'}
                      >
                        {exposure.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Asset Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div 
                      key={asset.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAsset?.id === asset.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {getAssetIcon(asset.type)}
                          </div>
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-slate-600">{asset.location} • {asset.owner}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusIcon(asset.status)}
                          <Badge 
                            className={getRiskColor(asset.riskScore)}
                          >
                            Risk: {asset.riskScore}/10
                          </Badge>
                          <Badge variant="outline">
                            {asset.vulnerabilities} vulns
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Critical Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-5 w-5 ${
                            vuln.severity === 'critical' ? 'text-red-600' :
                            vuln.severity === 'high' ? 'text-orange-600' :
                            vuln.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                          <div>
                            <p className="font-medium">{vuln.cve}</p>
                            <p className="text-sm text-slate-600">{vuln.asset}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={vuln.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {vuln.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            CVSS: {vuln.cvss}
                          </Badge>
                          {vuln.exploitAvailable && (
                            <Badge variant="destructive">
                              Exploit Available
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{vuln.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Discovered: {vuln.discoveredDate.toLocaleDateString()}</span>
                        <span>Status: {vuln.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exposure" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">External Exposure Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exposureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="exposed" fill="#8b5cf6" />
                  <Bar dataKey="total" fill="#e2e8f0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-trends" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Risk Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="riskScore" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vulnerabilities" 
                    stroke="#06b6d4" 
                    fill="#06b6d4"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttackSurfaceManagement;