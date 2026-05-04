import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  Target, Shield, AlertTriangle, Activity, Zap, Brain,
  Bug, Search, Database, Lock, Eye, Users, Router,
  Play, Pause, RotateCcw, CheckCircle, XCircle, Clock
} from 'lucide-react';

interface DroneTarget {
  id: string;
  name: string;
  ip_address: string;
  manufacturer: string;
  model: string;
  firmware_version: string;
  vulnerability_score: number;
  status: 'online' | 'offline' | 'testing' | 'compromised';
  last_seen: Date;
  open_ports: number[];
  services: string[];
}

interface VulnerabilityTest {
  id: string;
  name: string;
  category: 'network' | 'wireless' | 'firmware' | 'protocol' | 'physical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  target_protocols: string[];
  execution_time: number;
  success_rate: number;
  status: 'ready' | 'running' | 'completed' | 'failed';
  results?: {
    vulnerabilities_found: number;
    exploitable: boolean;
    risk_level: string;
    recommendations: string[];
  };
}

interface PenetrationResult {
  id: string;
  timestamp: Date;
  target_drone: string;
  test_executed: string;
  success: boolean;
  vulnerabilities: {
    cve_id?: string;
    description: string;
    severity: string;
    exploitable: boolean;
  }[];
  exploitation_details: string;
  defensive_measures: string[];
}

const droneTargets: DroneTarget[] = [
  {
    id: 'DRONE_001',
    name: 'DJI Phantom 4 Pro',
    ip_address: '192.168.1.100',
    manufacturer: 'DJI',
    model: 'Phantom 4 Pro',
    firmware_version: '1.7.90',
    vulnerability_score: 6.8,
    status: 'online',
    last_seen: new Date(),
    open_ports: [21, 23, 80, 443, 8080],
    services: ['HTTP', 'Telnet', 'FTP', 'HTTPS']
  },
  {
    id: 'DRONE_002',
    name: 'Parrot ANAFI',
    ip_address: '192.168.1.101',
    manufacturer: 'Parrot',
    model: 'ANAFI',
    firmware_version: '1.8.0',
    vulnerability_score: 7.2,
    status: 'testing',
    last_seen: new Date(),
    open_ports: [22, 53, 80, 8554],
    services: ['SSH', 'DNS', 'HTTP', 'RTSP']
  },
  {
    id: 'DRONE_003',
    name: 'Autel EVO II',
    ip_address: '192.168.1.102',
    manufacturer: 'Autel',
    model: 'EVO II',
    firmware_version: '2.1.4',
    vulnerability_score: 5.4,
    status: 'offline',
    last_seen: new Date(Date.now() - 300000),
    open_ports: [80, 443],
    services: ['HTTP', 'HTTPS']
  }
];

const vulnerabilityTests: VulnerabilityTest[] = [
  {
    id: 'TEST_001',
    name: 'WiFi Deauthentication Attack',
    category: 'wireless',
    severity: 'high',
    description: 'Tests drone vulnerability to WiFi deauthentication attacks that can force disconnection',
    target_protocols: ['802.11', 'WiFi'],
    execution_time: 30,
    success_rate: 85.2,
    status: 'ready'
  },
  {
    id: 'TEST_002',
    name: 'MAVLink Command Injection',
    category: 'protocol',
    severity: 'critical',
    description: 'Attempts to inject malicious commands through MAVLink protocol vulnerabilities',
    target_protocols: ['MAVLink', 'UDP'],
    execution_time: 60,
    success_rate: 67.8,
    status: 'ready'
  },
  {
    id: 'TEST_003',
    name: 'Firmware Buffer Overflow',
    category: 'firmware',
    severity: 'critical',
    description: 'Tests for buffer overflow vulnerabilities in drone firmware components',
    target_protocols: ['TCP', 'HTTP'],
    execution_time: 120,
    success_rate: 45.3,
    status: 'ready'
  },
  {
    id: 'TEST_004',
    name: 'GPS Spoofing Simulation',
    category: 'wireless',
    severity: 'high',
    description: 'Simulates GPS signal spoofing to test drone navigation vulnerabilities',
    target_protocols: ['GPS', 'GNSS'],
    execution_time: 90,
    success_rate: 72.1,
    status: 'ready'
  },
  {
    id: 'TEST_005',
    name: 'Video Stream Hijacking',
    category: 'network',
    severity: 'medium',
    description: 'Attempts to intercept and manipulate live video streams from drone cameras',
    target_protocols: ['RTSP', 'RTP'],
    execution_time: 45,
    success_rate: 58.9,
    status: 'ready'
  },
  {
    id: 'TEST_006',
    name: 'Emergency Landing Force',
    category: 'protocol',
    severity: 'critical',
    description: 'Tests ability to force emergency landing through protocol exploitation',
    target_protocols: ['MAVLink', 'RC'],
    execution_time: 15,
    success_rate: 34.7,
    status: 'ready'
  }
];

export function DroneSploit() {
  const [targets, setTargets] = useState<DroneTarget[]>(droneTargets);
  const [tests, setTests] = useState<VulnerabilityTest[]>(vulnerabilityTests);
  const [results, setResults] = useState<PenetrationResult[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [scanningProgress, setScanningProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTestsCount, setActiveTestsCount] = useState(0);

  useEffect(() => {
    // Simulate real-time target monitoring
    const interval = setInterval(() => {
      setTargets(prev => prev.map(target => ({
        ...target,
        vulnerability_score: Math.max(1.0, Math.min(10.0, target.vulnerability_score + (Math.random() - 0.5) * 0.5)),
        status: target.status === 'testing' ? 
          (Math.random() > 0.7 ? 'online' : 'testing') : 
          target.status,
        last_seen: target.status === 'online' ? new Date() : target.last_seen
      })));

      // Generate automated test results
      if (Math.random() > 0.8) {
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];
        const randomTest = tests[Math.floor(Math.random() * tests.length)];
        
        const newResult: PenetrationResult = {
          id: `RESULT_${Date.now()}`,
          timestamp: new Date(),
          target_drone: randomTarget.id,
          test_executed: randomTest.name,
          success: Math.random() > 0.4,
          vulnerabilities: generateVulnerabilities(),
          exploitation_details: getExploitationDetails(),
          defensive_measures: getDefensiveMeasures()
        };

        setResults(prev => [newResult, ...prev.slice(0, 19)]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [targets, tests]);

  const generateVulnerabilities = () => {
    const vulns = [
      {
        cve_id: 'CVE-2023-1234',
        description: 'Weak WiFi encryption allows unauthorized access',
        severity: 'high',
        exploitable: true
      },
      {
        description: 'Default credentials found on telnet service',
        severity: 'critical',
        exploitable: true
      },
      {
        description: 'Unencrypted MAVLink communication detected',
        severity: 'medium',
        exploitable: false
      },
      {
        cve_id: 'CVE-2023-5678',
        description: 'Buffer overflow in firmware update mechanism',
        severity: 'critical',
        exploitable: true
      }
    ];
    
    return vulns.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const getExploitationDetails = (): string => {
    const details = [
      'Successfully gained shell access through telnet brute force',
      'WiFi handshake captured, WPA2 key recovered using dictionary attack',
      'MAVLink command injection successful, unauthorized flight commands sent',
      'GPS spoofing signal accepted, navigation system compromised',
      'Video stream intercepted and modified in real-time',
      'Firmware update process hijacked, malicious payload uploaded'
    ];
    return details[Math.floor(Math.random() * details.length)];
  };

  const getDefensiveMeasures = (): string[] => {
    const measures = [
      'Implement strong WPA3 encryption with complex passwords',
      'Disable default accounts and change all default credentials',
      'Enable MAVLink message authentication and encryption',
      'Deploy GPS anti-spoofing detection algorithms',
      'Encrypt video streams with end-to-end encryption',
      'Implement secure firmware update with digital signatures',
      'Deploy network intrusion detection systems',
      'Regular security audits and penetration testing',
      'Implement geofencing and flight path restrictions'
    ];
    return measures.slice(0, Math.floor(Math.random() * 4) + 2);
  };

  const startPenetrationTest = () => {
    if (!selectedTarget || !selectedTest) {
      alert('Please select both a target and a test');
      return;
    }

    setIsScanning(true);
    setScanningProgress(0);
    setActiveTestsCount(prev => prev + 1);

    // Update test status
    setTests(prev => prev.map(test => 
      test.id === selectedTest ? { ...test, status: 'running' } : test
    ));

    // Update target status
    setTargets(prev => prev.map(target => 
      target.id === selectedTarget ? { ...target, status: 'testing' } : target
    ));

    // Simulate test execution
    const progressInterval = setInterval(() => {
      setScanningProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          completeTest();
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const completeTest = () => {
    const targetData = targets.find(t => t.id === selectedTarget);
    const testData = tests.find(t => t.id === selectedTest);
    
    if (!targetData || !testData) return;

    const testSuccess = Math.random() > 0.3;
    
    // Create result
    const newResult: PenetrationResult = {
      id: `RESULT_${Date.now()}`,
      timestamp: new Date(),
      target_drone: selectedTarget,
      test_executed: testData.name,
      success: testSuccess,
      vulnerabilities: testSuccess ? generateVulnerabilities() : [],
      exploitation_details: testSuccess ? getExploitationDetails() : 'Test completed without successful exploitation',
      defensive_measures: getDefensiveMeasures()
    };

    setResults(prev => [newResult, ...prev]);

    // Update test status
    setTests(prev => prev.map(test => 
      test.id === selectedTest ? { 
        ...test, 
        status: testSuccess ? 'completed' : 'failed',
        results: testSuccess ? {
          vulnerabilities_found: newResult.vulnerabilities.length,
          exploitable: newResult.vulnerabilities.some(v => v.exploitable),
          risk_level: testData.severity,
          recommendations: newResult.defensive_measures
        } : undefined
      } : test
    ));

    // Update target status
    setTargets(prev => prev.map(target => 
      target.id === selectedTarget ? { 
        ...target, 
        status: testSuccess ? 'compromised' : 'online'
      } : target
    ));

    setIsScanning(false);
    setActiveTestsCount(prev => prev - 1);
    setScanningProgress(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'testing': return 'bg-blue-500';
      case 'compromised': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'network': return <Router className="h-4 w-4" />;
      case 'wireless': return <Activity className="h-4 w-4" />;
      case 'firmware': return <Database className="h-4 w-4" />;
      case 'protocol': return <Shield className="h-4 w-4" />;
      case 'physical': return <Lock className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const selectedTargetData = targets.find(t => t.id === selectedTarget);
  const selectedTestData = tests.find(t => t.id === selectedTest);

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DroneSploit - UAV Penetration Testing Framework</h2>
          <p className="text-gray-600">Open-source vulnerability assessment and intrusion simulation for drone ecosystems</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800">
            <Target className="h-4 w-4 mr-2" />
            {targets.filter(t => t.status === 'online').length} Targets Online
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            <Bug className="h-4 w-4 mr-2" />
            {results.filter(r => r.success).length} Vulnerabilities Found
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Active Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeTestsCount}</div>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Currently running</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Compromised Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {targets.filter(t => t.status === 'compromised').length}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">Security breached</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Total Vulnerabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {results.reduce((sum, r) => sum + r.vulnerabilities.length, 0)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Bug className="h-3 w-3 text-orange-600" />
              <span className="text-xs text-orange-600">Identified issues</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {results.length > 0 ? Math.round((results.filter(r => r.success).length / results.length) * 100) : 0}%
            </div>
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Exploitation rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="targets" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="targets" className="text-gray-700">Target Discovery</TabsTrigger>
          <TabsTrigger value="testing" className="text-gray-700">Penetration Testing</TabsTrigger>
          <TabsTrigger value="results" className="text-gray-700">Results & Analysis</TabsTrigger>
          <TabsTrigger value="defensive" className="text-gray-700">Defensive Measures</TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Discovered Drone Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {targets.map((target) => (
                    <div 
                      key={target.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedTarget === target.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTarget(target.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(target.status)}`}></div>
                          <span className="font-medium text-gray-900">{target.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {target.manufacturer}
                          </Badge>
                        </div>
                        <Badge className={target.vulnerability_score > 7 ? 'bg-red-100 text-red-800' : 
                                        target.vulnerability_score > 5 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-green-100 text-green-800'}>
                          Risk: {target.vulnerability_score.toFixed(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">IP Address:</span>
                          <div className="font-mono text-gray-900">{target.ip_address}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Firmware:</span>
                          <div className="text-gray-900">{target.firmware_version}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Open Ports:</span>
                          <div className="text-gray-900">{target.open_ports.join(', ')}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="text-gray-900 capitalize ml-1">{target.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Target Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTargetData ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{selectedTargetData.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Manufacturer:</span>
                          <div className="text-gray-900">{selectedTargetData.manufacturer}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Model:</span>
                          <div className="text-gray-900">{selectedTargetData.model}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 font-medium">Network Information:</span>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>IP: <span className="font-mono">{selectedTargetData.ip_address}</span></div>
                        <div>Firmware: {selectedTargetData.firmware_version}</div>
                        <div>Last Seen: {selectedTargetData.last_seen.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 font-medium">Detected Services:</span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedTargetData.services.map(service => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 font-medium">Vulnerability Assessment:</span>
                      <div className="mt-2">
                        <Progress value={selectedTargetData.vulnerability_score * 10} className="h-3" />
                        <span className="text-sm text-gray-600 mt-1">Score: {selectedTargetData.vulnerability_score}/10</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a target to view detailed information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Available Penetration Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.map((test) => (
                    <div 
                      key={test.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedTest === test.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTest(test.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(test.category)}
                          <span className="font-medium text-gray-900">{test.name}</span>
                        </div>
                        <Badge className={getSeverityColor(test.severity)}>
                          {test.severity.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="ml-2 text-gray-900">{test.success_rate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Execution Time:</span>
                          <span className="ml-2 text-gray-900">{test.execution_time}s</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-gray-600">Protocols:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {test.target_protocols.map(protocol => (
                            <Badge key={protocol} variant="outline" className="text-xs">
                              {protocol}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Test Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Selected Target:</label>
                    <div className="text-gray-900">
                      {selectedTargetData ? selectedTargetData.name : 'No target selected'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Selected Test:</label>
                    <div className="text-gray-900">
                      {selectedTestData ? selectedTestData.name : 'No test selected'}
                    </div>
                  </div>
                  
                  {isScanning && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700">Test Progress</span>
                        <span className="text-gray-900">{scanningProgress}%</span>
                      </div>
                      <Progress value={scanningProgress} className="h-3" />
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button
                      onClick={startPenetrationTest}
                      disabled={!selectedTarget || !selectedTest || isScanning}
                      className="w-full"
                    >
                      {isScanning ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Running Test...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Penetration Test
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {selectedTestData && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Warning:</strong> This test simulates real attack scenarios. 
                        Only run against authorized targets in controlled environments.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Penetration Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-green-600" />
                          )}
                          <span className="font-medium text-gray-900">{result.test_executed}</span>
                          <Badge className={result.success ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {result.success ? 'EXPLOITED' : 'SECURED'}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-600">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Target: </span>
                        <span className="text-sm text-gray-900">{result.target_drone}</span>
                      </div>
                      
                      {result.vulnerabilities.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Vulnerabilities Found:</span>
                          <div className="mt-1 space-y-1">
                            {result.vulnerabilities.map((vuln, index) => (
                              <div key={index} className="text-xs bg-white p-2 rounded border">
                                {vuln.cve_id && <span className="font-mono text-blue-600">{vuln.cve_id}: </span>}
                                <span className="text-gray-800">{vuln.description}</span>
                                <Badge className={getSeverityColor(vuln.severity)} size="sm">
                                  {vuln.severity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Details: </span>
                        <p className="text-gray-800 mt-1">{result.exploitation_details}</p>
                      </div>
                    </div>
                  ))}
                  
                  {results.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Bug className="h-8 w-8 mx-auto mb-2" />
                      <p>No test results yet. Start a penetration test to see results.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defensive" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Security Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.length > 0 && results[0].defensive_measures.map((measure, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm text-green-800">{measure}</span>
                      </div>
                    </div>
                  ))}
                  
                  {results.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Shield className="h-8 w-8 mx-auto mb-2" />
                      <p>Run penetration tests to generate security recommendations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Hardening Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-800">Enable strong WiFi encryption (WPA3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-800">Change all default passwords</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-800">Update firmware regularly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-800">Disable unnecessary services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-800">Implement geofencing restrictions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-800">Enable MAVLink authentication</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-8">
        DroneSploit - Open-source UAV Security Testing Framework - Created by Md.Hriday Khan
      </div>
    </div>
  );
}