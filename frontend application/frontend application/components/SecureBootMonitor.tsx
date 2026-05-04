import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, Lock, Key, CheckCircle, XCircle, AlertTriangle, 
  Server, Smartphone, Router, FileCheck, Clock, Settings,
  Eye, Activity, Database, Network, Cpu, HardDrive
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SecureBootDevice {
  id: string;
  hostname: string;
  deviceType: 'server' | 'workstation' | 'controller' | 'network_device' | 'iot_device';
  bootStatus: 'secure' | 'compromised' | 'unknown' | 'disabled';
  certificateStatus: 'valid' | 'expired' | 'revoked' | 'missing';
  firmwareVersion: string;
  lastBootTime: Date;
  bootMeasurements: string[];
  trustedPlatformModule: boolean;
  attestationStatus: 'passed' | 'failed' | 'pending';
  criticalLevel: 'critical' | 'high' | 'medium' | 'low';
  isolationDomain: string;
  location: string;
}

interface SignedImage {
  id: string;
  name: string;
  version: string;
  type: 'bootloader' | 'kernel' | 'firmware' | 'application';
  signature: string;
  signedBy: string;
  signatureDate: Date;
  validUntil: Date;
  deployedDevices: string[];
  integrityStatus: 'verified' | 'compromised' | 'unknown';
  criticalController: boolean;
}

interface IntegrityAttestation {
  deviceId: string;
  timestamp: Date;
  attestationType: 'boot' | 'runtime' | 'periodic';
  measurements: {
    component: string;
    expectedHash: string;
    actualHash: string;
    status: 'match' | 'mismatch' | 'unknown';
  }[];
  overallStatus: 'pass' | 'fail' | 'warning';
  riskScore: number;
}

interface IsolatedDomain {
  id: string;
  name: string;
  purpose: string;
  deviceCount: number;
  isolationLevel: 'complete' | 'network_only' | 'partial';
  criticalAssets: string[];
  networkSegment: string;
  accessControlled: boolean;
  monitoringLevel: 'high' | 'medium' | 'low';
}

const SecureBootMonitor: React.FC = () => {
  const [devices, setDevices] = useState<SecureBootDevice[]>([]);
  const [signedImages, setSignedImages] = useState<SignedImage[]>([]);
  const [attestations, setAttestations] = useState<IntegrityAttestation[]>([]);
  const [isolatedDomains, setIsolatedDomains] = useState<IsolatedDomain[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<SecureBootDevice | null>(null);
  const [continuousMonitoring, setContinuousMonitoring] = useState(true);

  // Mock data generation
  useEffect(() => {
    const mockDevices: SecureBootDevice[] = [
      {
        id: 'dev-001',
        hostname: 'CTRL-SAFETY-01',
        deviceType: 'controller',
        bootStatus: 'secure',
        certificateStatus: 'valid',
        firmwareVersion: '3.2.1-signed',
        lastBootTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        bootMeasurements: ['PCR0: a1b2c3d4', 'PCR1: e5f6g7h8', 'PCR7: i9j0k1l2'],
        trustedPlatformModule: true,
        attestationStatus: 'passed',
        criticalLevel: 'critical',
        isolationDomain: 'safety-critical',
        location: 'Control Room A'
      },
      {
        id: 'dev-002',
        hostname: 'SRV-PROD-001',
        deviceType: 'server',
        bootStatus: 'secure',
        certificateStatus: 'valid',
        firmwareVersion: '2.8.5-signed',
        lastBootTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        bootMeasurements: ['PCR0: b2c3d4e5', 'PCR1: f6g7h8i9', 'PCR7: j0k1l2m3'],
        trustedPlatformModule: true,
        attestationStatus: 'passed',
        criticalLevel: 'high',
        isolationDomain: 'production',
        location: 'Data Center A'
      },
      {
        id: 'dev-003',
        hostname: 'WS-ADMIN-015',
        deviceType: 'workstation',
        bootStatus: 'compromised',
        certificateStatus: 'revoked',
        firmwareVersion: '1.9.3-unsigned',
        lastBootTime: new Date(Date.now() - 30 * 60 * 1000),
        bootMeasurements: ['PCR0: c3d4e5f6', 'PCR1: g7h8i9j0', 'PCR7: k1l2m3n4'],
        trustedPlatformModule: false,
        attestationStatus: 'failed',
        criticalLevel: 'medium',
        isolationDomain: 'admin-network',
        location: 'Office Block B'
      }
    ];

    const mockImages: SignedImage[] = [
      {
        id: 'img-001',
        name: 'SafetyController_v3.2.1',
        version: '3.2.1',
        type: 'firmware',
        signature: 'RSA-4096:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        signedBy: 'Safety Systems CA',
        signatureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 358 * 24 * 60 * 60 * 1000),
        deployedDevices: ['CTRL-SAFETY-01', 'CTRL-SAFETY-02'],
        integrityStatus: 'verified',
        criticalController: true
      },
      {
        id: 'img-002',
        name: 'SecureBoot_UEFI',
        version: '2.8.5',
        type: 'bootloader',
        signature: 'ECDSA-384:b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        signedBy: 'Enterprise Root CA',
        signatureDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 351 * 24 * 60 * 60 * 1000),
        deployedDevices: ['SRV-PROD-001', 'SRV-PROD-002', 'SRV-PROD-003'],
        integrityStatus: 'verified',
        criticalController: false
      },
      {
        id: 'img-003',
        name: 'WorkstationKernel',
        version: '1.9.3',
        type: 'kernel',
        signature: 'CORRUPTED',
        signedBy: 'Unknown',
        signatureDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        deployedDevices: ['WS-ADMIN-015'],
        integrityStatus: 'compromised',
        criticalController: false
      }
    ];

    const mockAttestations: IntegrityAttestation[] = [
      {
        deviceId: 'dev-001',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        attestationType: 'periodic',
        measurements: [
          { component: 'Bootloader', expectedHash: 'a1b2c3d4', actualHash: 'a1b2c3d4', status: 'match' },
          { component: 'Kernel', expectedHash: 'e5f6g7h8', actualHash: 'e5f6g7h8', status: 'match' },
          { component: 'Firmware', expectedHash: 'i9j0k1l2', actualHash: 'i9j0k1l2', status: 'match' }
        ],
        overallStatus: 'pass',
        riskScore: 1.2
      },
      {
        deviceId: 'dev-003',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        attestationType: 'boot',
        measurements: [
          { component: 'Bootloader', expectedHash: 'c3d4e5f6', actualHash: 'x1y2z3a4', status: 'mismatch' },
          { component: 'Kernel', expectedHash: 'g7h8i9j0', actualHash: 'b5c6d7e8', status: 'mismatch' }
        ],
        overallStatus: 'fail',
        riskScore: 9.8
      }
    ];

    const mockDomains: IsolatedDomain[] = [
      {
        id: 'domain-001',
        name: 'Safety Critical Control',
        purpose: 'Industrial safety systems and emergency controls',
        deviceCount: 8,
        isolationLevel: 'complete',
        criticalAssets: ['CTRL-SAFETY-01', 'CTRL-SAFETY-02', 'EMERGENCY-STOP'],
        networkSegment: '172.16.1.0/24',
        accessControlled: true,
        monitoringLevel: 'high'
      },
      {
        id: 'domain-002',
        name: 'Production Systems',
        purpose: 'Core business production infrastructure',
        deviceCount: 25,
        isolationLevel: 'network_only',
        criticalAssets: ['SRV-PROD-001', 'SRV-PROD-002', 'DB-CLUSTER-01'],
        networkSegment: '10.0.1.0/24',
        accessControlled: true,
        monitoringLevel: 'high'
      },
      {
        id: 'domain-003',
        name: 'Administrative Network',
        purpose: 'Management and administrative functions',
        deviceCount: 45,
        isolationLevel: 'partial',
        criticalAssets: ['AD-CONTROLLER', 'MGMT-SERVER'],
        networkSegment: '192.168.1.0/24',
        accessControlled: false,
        monitoringLevel: 'medium'
      }
    ];

    setDevices(mockDevices);
    setSignedImages(mockImages);
    setAttestations(mockAttestations);
    setIsolatedDomains(mockDomains);
  }, []);

  // Continuous monitoring simulation
  useEffect(() => {
    if (!continuousMonitoring) return;

    const interval = setInterval(() => {
      // Simulate new attestations
      if (Math.random() > 0.7) {
        const randomDevice = devices[Math.floor(Math.random() * devices.length)];
        const newAttestation: IntegrityAttestation = {
          deviceId: randomDevice.id,
          timestamp: new Date(),
          attestationType: 'periodic',
          measurements: [
            { component: 'Bootloader', expectedHash: 'a1b2c3d4', actualHash: 'a1b2c3d4', status: 'match' },
            { component: 'Kernel', expectedHash: 'e5f6g7h8', actualHash: 'e5f6g7h8', status: 'match' }
          ],
          overallStatus: Math.random() > 0.9 ? 'fail' : 'pass',
          riskScore: Math.random() * 10
        };
        setAttestations(prev => [newAttestation, ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [continuousMonitoring, devices]);

  const getBootStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-600 bg-green-50 border-green-200';
      case 'compromised': return 'text-red-600 bg-red-50 border-red-200';
      case 'unknown': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'disabled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCertificateStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-50 border-green-200';
      case 'expired': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'revoked': return 'text-red-600 bg-red-50 border-red-200';
      case 'missing': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'workstation': return <Cpu className="h-4 w-4" />;
      case 'controller': return <Settings className="h-4 w-4" />;
      case 'network_device': return <Router className="h-4 w-4" />;
      case 'iot_device': return <Smartphone className="h-4 w-4" />;
      default: return <HardDrive className="h-4 w-4" />;
    }
  };

  const getAttestationIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const securityMetrics = [
    { name: 'Secure Boot Enabled', value: devices.filter(d => d.bootStatus === 'secure').length },
    { name: 'Valid Certificates', value: devices.filter(d => d.certificateStatus === 'valid').length },
    { name: 'Critical Domains', value: isolatedDomains.filter(d => d.isolationLevel === 'complete').length },
    { name: 'Attestations Passed', value: `${Math.round((attestations.filter(a => a.overallStatus === 'pass').length / attestations.length) * 100)}%` }
  ];

  const deviceDistribution = [
    { name: 'Secure', value: devices.filter(d => d.bootStatus === 'secure').length, color: '#10b981' },
    { name: 'Compromised', value: devices.filter(d => d.bootStatus === 'compromised').length, color: '#ef4444' },
    { name: 'Unknown', value: devices.filter(d => d.bootStatus === 'unknown').length, color: '#f59e0b' },
    { name: 'Disabled', value: devices.filter(d => d.bootStatus === 'disabled').length, color: '#6b7280' }
  ];

  const attestationTrendData = [
    { hour: '00:00', passed: 45, failed: 2, pending: 1 },
    { hour: '04:00', passed: 42, failed: 1, pending: 0 },
    { hour: '08:00', passed: 48, failed: 3, pending: 2 },
    { hour: '12:00', passed: 46, failed: 2, pending: 1 },
    { hour: '16:00', passed: 44, failed: 4, pending: 3 },
    { hour: '20:00', passed: 47, failed: 1, pending: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Secure Boot & Signed Images
          </h2>
          <p className="text-slate-600 mt-2">Critical controller protection with secure boot, signed images, and integrity attestation</p>
          <p className="text-xs text-slate-500 mt-1">Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setContinuousMonitoring(!continuousMonitoring)}
            variant={continuousMonitoring ? 'default' : 'outline'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {continuousMonitoring ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-pulse" />
                Monitoring Active
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Continuous Monitoring Status */}
      {continuousMonitoring && (
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600 animate-pulse" />
          <AlertDescription>
            <span className="font-medium">Continuous integrity monitoring active</span> - Real-time attestation and boot verification in progress
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {securityMetrics.map((metric, index) => (
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
      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="devices">Secure Devices</TabsTrigger>
          <TabsTrigger value="images">Signed Images</TabsTrigger>
          <TabsTrigger value="attestation">Integrity Attestation</TabsTrigger>
          <TabsTrigger value="domains">Isolated Domains</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Devices List */}
            <div className="lg:col-span-2">
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-600" />
                    Secure Boot Devices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {devices.map((device) => (
                        <div 
                          key={device.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedDevice?.id === device.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedDevice(device)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg">
                                {getDeviceIcon(device.deviceType)}
                              </div>
                              <div>
                                <p className="font-medium">{device.hostname}</p>
                                <p className="text-sm text-slate-600 capitalize">{device.deviceType.replace('_', ' ')}</p>
                                <p className="text-xs text-slate-500">{device.location}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge className={getBootStatusColor(device.bootStatus)}>
                                {device.bootStatus.toUpperCase()}
                              </Badge>
                              <Badge className={getCertificateStatusColor(device.certificateStatus)}>
                                CERT: {device.certificateStatus.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <span className="text-slate-500">Firmware:</span>
                              <span className="ml-2 font-medium">{device.firmwareVersion}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">TPM:</span>
                              <span className="ml-2 font-medium">{device.trustedPlatformModule ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Attestation:</span>
                              <Badge variant={device.attestationStatus === 'passed' ? 'default' : 'destructive'} className={device.attestationStatus === 'passed' ? 'bg-green-600' : ''}>
                                {device.attestationStatus.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-slate-500">Domain:</span>
                              <span className="ml-2 font-medium">{device.isolationDomain}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Last boot: {device.lastBootTime.toLocaleString()}</span>
                            <Badge variant="outline" className={`text-xs ${device.criticalLevel === 'critical' ? 'border-red-200 text-red-600' : ''}`}>
                              {device.criticalLevel.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Device Details */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Device Security Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDevice ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Boot Measurements</h4>
                      <div className="space-y-1">
                        {selectedDevice.bootMeasurements.map((measurement, index) => (
                          <div key={index} className="text-xs font-mono bg-gray-100 p-2 rounded">
                            {measurement}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Security Features</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Secure Boot:</span>
                          <Badge className={getBootStatusColor(selectedDevice.bootStatus)}>
                            {selectedDevice.bootStatus.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">TPM Support:</span>
                          <Badge variant={selectedDevice.trustedPlatformModule ? 'default' : 'secondary'} className={selectedDevice.trustedPlatformModule ? 'bg-green-600' : ''}>
                            {selectedDevice.trustedPlatformModule ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Certificate:</span>
                          <Badge className={getCertificateStatusColor(selectedDevice.certificateStatus)}>
                            {selectedDevice.certificateStatus.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Isolation Domain</h4>
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-sm font-medium">{selectedDevice.isolationDomain}</p>
                        <p className="text-xs text-slate-600">Critical Level: {selectedDevice.criticalLevel}</p>
                        <p className="text-xs text-slate-500">Location: {selectedDevice.location}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Recent Activity</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Last Boot:</span>
                          <span>{selectedDevice.lastBootTime.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Attestation:</span>
                          <span>{selectedDevice.attestationStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <Lock className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a device to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device Distribution */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Security Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {deviceDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm text-slate-600">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-600" />
                Signed Images & Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signedImages.map((image) => (
                  <div key={image.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <FileCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{image.name}</p>
                          <p className="text-sm text-slate-600">Version {image.version} • {image.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={image.integrityStatus === 'verified' ? 'default' : 'destructive'}
                          className={image.integrityStatus === 'verified' ? 'bg-green-600' : ''}
                        >
                          {image.integrityStatus.toUpperCase()}
                        </Badge>
                        {image.criticalController && (
                          <Badge variant="destructive" className="bg-red-600">
                            CRITICAL
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Signed By:</span>
                        <span className="ml-2 font-medium">{image.signedBy}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Deployed:</span>
                        <span className="ml-2 font-medium">{image.deployedDevices.length} devices</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Signed:</span>
                        <span className="ml-2 font-medium">{image.signatureDate.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Valid Until:</span>
                        <span className="ml-2 font-medium">{image.validUntil.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-slate-500 font-mono bg-gray-100 p-2 rounded">
                        {image.signature}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {image.deployedDevices.slice(0, 3).map((device, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {device}
                          </Badge>
                        ))}
                        {image.deployedDevices.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{image.deployedDevices.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attestation" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Integrity Attestation & Periodic Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attestations.map((attestation, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getAttestationIcon(attestation.overallStatus)}
                        <div>
                          <p className="font-medium">Device: {attestation.deviceId}</p>
                          <p className="text-sm text-slate-600 capitalize">{attestation.attestationType} attestation</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={attestation.overallStatus === 'pass' ? 'default' : 'destructive'}
                          className={attestation.overallStatus === 'pass' ? 'bg-green-600' : ''}
                        >
                          {attestation.overallStatus.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          Risk: {attestation.riskScore.toFixed(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {attestation.measurements.map((measurement, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            {measurement.status === 'match' ? 
                              <CheckCircle className="h-3 w-3 text-green-500" /> :
                              <XCircle className="h-3 w-3 text-red-500" />
                            }
                            <span className="font-medium">{measurement.component}</span>
                          </div>
                          <Badge variant={measurement.status === 'match' ? 'default' : 'destructive'} className={measurement.status === 'match' ? 'bg-green-600 text-xs' : 'text-xs'}>
                            {measurement.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Checked: {attestation.timestamp.toLocaleString()}</span>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-600" />
                Isolated Safety-Critical Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isolatedDomains.map((domain) => (
                  <div key={domain.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{domain.name}</p>
                        <p className="text-sm text-slate-600">{domain.purpose}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={domain.isolationLevel === 'complete' ? 'destructive' : 'secondary'}
                          className={domain.isolationLevel === 'complete' ? 'bg-red-600' : ''}
                        >
                          {domain.isolationLevel.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {domain.deviceCount} devices
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Network:</span>
                        <span className="ml-2 font-mono">{domain.networkSegment}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Access Control:</span>
                        <span className="ml-2 font-medium">{domain.accessControlled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Monitoring:</span>
                        <span className="ml-2 font-medium capitalize">{domain.monitoringLevel}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Critical Assets:</span>
                        <span className="ml-2 font-medium">{domain.criticalAssets.length}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {domain.criticalAssets.slice(0, 3).map((asset, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {asset}
                          </Badge>
                        ))}
                        {domain.criticalAssets.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{domain.criticalAssets.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Attestation Trends & Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attestationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="passed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecureBootMonitor;