import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { 
  Target, Shield, AlertTriangle, Search, Eye, Brain, Zap, 
  Network, Database, Users, Lock, Settings, Activity,
  Download, Filter, RefreshCw, ExternalLink, Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface MitreTactic {
  id: string;
  name: string;
  description: string;
  techniques: number;
  detectedCount: number;
  coverage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  color: string;
}

interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  tactic: string;
  subTechniques: number;
  detectionCoverage: number;
  mitigationCoverage: number;
  recentDetections: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  platforms: string[];
  dataSources: string[];
}

interface ThreatDetection {
  id: string;
  technique: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  mitigated: boolean;
  confidence: number;
}

interface AttackPath {
  id: string;
  name: string;
  steps: string[];
  probability: number;
  impact: number;
  mitigation: string;
}

export function MitreAttackFramework() {
  const [tactics, setTactics] = useState<MitreTactic[]>([]);
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [detections, setDetections] = useState<ThreatDetection[]>([]);
  const [attackPaths, setAttackPaths] = useState<AttackPath[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTactic, setSelectedTactic] = useState('');
  const [coverageData, setCoverageData] = useState<any[]>([]);

  useEffect(() => {
    // Initialize MITRE ATT&CK data
    const initialTactics: MitreTactic[] = [
      {
        id: 'TA0001',
        name: 'Initial Access',
        description: 'Adversaries are trying to get into your network',
        techniques: 9,
        detectedCount: 7,
        coverage: 78,
        riskLevel: 'high',
        color: '#ef4444'
      },
      {
        id: 'TA0002',
        name: 'Execution',
        description: 'Adversaries are trying to run malicious code',
        techniques: 12,
        detectedCount: 10,
        coverage: 83,
        riskLevel: 'high',
        color: '#f97316'
      },
      {
        id: 'TA0003',
        name: 'Persistence',
        description: 'Adversaries are trying to maintain their foothold',
        techniques: 19,
        detectedCount: 14,
        coverage: 74,
        riskLevel: 'medium',
        color: '#eab308'
      },
      {
        id: 'TA0004',
        name: 'Privilege Escalation',
        description: 'Adversaries are trying to gain higher-level permissions',
        techniques: 13,
        detectedCount: 11,
        coverage: 85,
        riskLevel: 'high',
        color: '#dc2626'
      },
      {
        id: 'TA0005',
        name: 'Defense Evasion',
        description: 'Adversaries are trying to avoid being detected',
        techniques: 42,
        detectedCount: 28,
        coverage: 67,
        riskLevel: 'critical',
        color: '#b91c1c'
      },
      {
        id: 'TA0006',
        name: 'Credential Access',
        description: 'Adversaries are trying to steal account names and passwords',
        techniques: 15,
        detectedCount: 12,
        coverage: 80,
        riskLevel: 'high',
        color: '#f59e0b'
      },
      {
        id: 'TA0007',
        name: 'Discovery',
        description: 'Adversaries are trying to figure out your environment',
        techniques: 29,
        detectedCount: 22,
        coverage: 76,
        riskLevel: 'medium',
        color: '#06b6d4'
      },
      {
        id: 'TA0008',
        name: 'Lateral Movement',
        description: 'Adversaries are trying to move through your environment',
        techniques: 9,
        detectedCount: 7,
        coverage: 78,
        riskLevel: 'high',
        color: '#8b5cf6'
      },
      {
        id: 'TA0009',
        name: 'Collection',
        description: 'Adversaries are trying to gather data of interest',
        techniques: 17,
        detectedCount: 13,
        coverage: 76,
        riskLevel: 'medium',
        color: '#10b981'
      },
      {
        id: 'TA0010',
        name: 'Exfiltration',
        description: 'Adversaries are trying to steal data',
        techniques: 9,
        detectedCount: 6,
        coverage: 67,
        riskLevel: 'critical',
        color: '#ef4444'
      },
      {
        id: 'TA0011',
        name: 'Command and Control',
        description: 'Adversaries are trying to communicate with compromised systems',
        techniques: 16,
        detectedCount: 12,
        coverage: 75,
        riskLevel: 'high',
        color: '#7c3aed'
      },
      {
        id: 'TA0040',
        name: 'Impact',
        description: 'Adversaries are trying to manipulate, interrupt, or destroy systems and data',
        techniques: 13,
        detectedCount: 9,
        coverage: 69,
        riskLevel: 'critical',
        color: '#dc2626'
      }
    ];

    const initialTechniques: MitreTechnique[] = [
      {
        id: 'T1566',
        name: 'Phishing',
        description: 'Adversaries may send phishing messages to gain access to victim systems',
        tactic: 'Initial Access',
        subTechniques: 3,
        detectionCoverage: 85,
        mitigationCoverage: 92,
        recentDetections: 15,
        severity: 'high',
        platforms: ['Linux', 'macOS', 'Windows'],
        dataSources: ['Email Gateway', 'Network Traffic', 'File Monitoring']
      },
      {
        id: 'T1059',
        name: 'Command and Scripting Interpreter',
        description: 'Adversaries may abuse command and script interpreters to execute commands',
        tactic: 'Execution',
        subTechniques: 8,
        detectionCoverage: 78,
        mitigationCoverage: 65,
        recentDetections: 23,
        severity: 'high',
        platforms: ['Linux', 'macOS', 'Windows'],
        dataSources: ['Process Monitoring', 'Command History', 'PowerShell Logs']
      },
      {
        id: 'T1078',
        name: 'Valid Accounts',
        description: 'Adversaries may obtain and abuse credentials of existing accounts',
        tactic: 'Persistence',
        subTechniques: 4,
        detectionCoverage: 70,
        mitigationCoverage: 88,
        recentDetections: 12,
        severity: 'medium',
        platforms: ['Linux', 'macOS', 'Windows', 'Cloud'],
        dataSources: ['Authentication Logs', 'Account Usage', 'Login Anomalies']
      },
      {
        id: 'T1055',
        name: 'Process Injection',
        description: 'Adversaries may inject code into processes to evade defenses',
        tactic: 'Defense Evasion',
        subTechniques: 12,
        detectionCoverage: 45,
        mitigationCoverage: 32,
        recentDetections: 8,
        severity: 'critical',
        platforms: ['Windows', 'Linux', 'macOS'],
        dataSources: ['Process Monitoring', 'DLL Monitoring', 'API Monitoring']
      },
      {
        id: 'T1003',
        name: 'OS Credential Dumping',
        description: 'Adversaries may attempt to dump credentials to obtain account login information',
        tactic: 'Credential Access',
        subTechniques: 8,
        detectionCoverage: 82,
        mitigationCoverage: 75,
        recentDetections: 6,
        severity: 'high',
        platforms: ['Windows', 'Linux', 'macOS'],
        dataSources: ['Process Monitoring', 'File Monitoring', 'Registry Monitoring']
      }
    ];

    const initialDetections: ThreatDetection[] = [
      {
        id: '1',
        technique: 'T1566.001 - Spearphishing Attachment',
        timestamp: new Date(2024, 9, 20, 14, 30),
        severity: 'high',
        source: '192.168.1.45',
        description: 'Malicious email attachment detected with macro-enabled document',
        mitigated: true,
        confidence: 95
      },
      {
        id: '2',
        technique: 'T1059.001 - PowerShell',
        timestamp: new Date(2024, 9, 20, 13, 15),
        severity: 'medium',
        source: 'WORKSTATION-02',
        description: 'Suspicious PowerShell execution with encoded commands',
        mitigated: false,
        confidence: 87
      },
      {
        id: '3',
        technique: 'T1078.004 - Cloud Accounts',
        timestamp: new Date(2024, 9, 20, 12, 45),
        severity: 'high',
        source: 'Azure AD',
        description: 'Unusual login pattern detected from compromised cloud account',
        mitigated: true,
        confidence: 92
      }
    ];

    const initialAttackPaths: AttackPath[] = [
      {
        id: 'path1',
        name: 'Email → Execution → Persistence',
        steps: ['T1566 - Phishing', 'T1059 - Command Interpreter', 'T1078 - Valid Accounts'],
        probability: 75,
        impact: 85,
        mitigation: 'Email filtering, PowerShell logging, Account monitoring'
      },
      {
        id: 'path2',
        name: 'Web → Privilege Escalation → Data Theft',
        steps: ['T1190 - Exploit Public Application', 'T1068 - Exploitation for Privilege Escalation', 'T1041 - Exfiltration Over C2'],
        probability: 45,
        impact: 95,
        mitigation: 'Web application security, Privilege monitoring, DLP'
      }
    ];

    // Generate coverage data for visualization
    const coverageChartData = initialTactics.map(tactic => ({
      name: tactic.name.replace(' ', '\n'),
      coverage: tactic.coverage,
      techniques: tactic.techniques,
      detected: tactic.detectedCount,
      color: tactic.color
    }));

    setTactics(initialTactics);
    setTechniques(initialTechniques);
    setDetections(initialDetections);
    setAttackPaths(initialAttackPaths);
    setCoverageData(coverageChartData);
    setSelectedTactic('TA0001');

    // Simulate real-time detection updates
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newDetection: ThreatDetection = {
          id: Date.now().toString(),
          technique: `T${Math.floor(Math.random() * 9999)} - ${['Phishing', 'PowerShell', 'Registry', 'Process Injection', 'Lateral Movement'][Math.floor(Math.random() * 5)]}`,
          timestamp: new Date(),
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          source: `192.168.1.${Math.floor(Math.random() * 255)}`,
          description: 'Automated detection of suspicious activity',
          mitigated: Math.random() > 0.5,
          confidence: Math.floor(Math.random() * 40) + 60
        };
        setDetections(prev => [newDetection, ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportMitreMatrix = () => {
    const matrixData = {
      metadata: {
        name: 'MITRE ATT&CK Matrix Export',
        version: '14.1',
        author: 'SHIELD Security Operations Center',
        created: new Date().toISOString(),
        description: 'Complete MITRE ATT&CK framework mapping with detection coverage'
      },
      tactics: tactics,
      techniques: techniques,
      detections: detections,
      attackPaths: attackPaths,
      coverage_analysis: {
        overall_coverage: (tactics.reduce((sum, t) => sum + t.coverage, 0) / tactics.length).toFixed(1),
        total_techniques: techniques.length,
        detected_techniques: techniques.filter(t => t.detectionCoverage > 0).length,
        high_risk_techniques: techniques.filter(t => t.severity === 'high' || t.severity === 'critical').length
      }
    };

    // Create downloadable file
    const dataStr = JSON.stringify(matrixData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mitre_attack_matrix_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // Also create Excel-compatible CSV
    const csvData = techniques.map(t => ({
      'Technique ID': t.id,
      'Technique Name': t.name,
      'Tactic': t.tactic,
      'Detection Coverage': `${t.detectionCoverage}%`,
      'Mitigation Coverage': `${t.mitigationCoverage}%`,
      'Severity': t.severity,
      'Recent Detections': t.recentDetections,
      'Platforms': t.platforms.join(', '),
      'Data Sources': t.dataSources.join(', ')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = `mitre_attack_techniques_${new Date().toISOString().split('T')[0]}.csv`;
    csvLink.click();
    URL.revokeObjectURL(csvUrl);
  };

  const openMitreWebsite = () => {
    window.open('https://attack.mitre.org/', '_blank', 'noopener,noreferrer');
  };

  const filteredTechniques = techniques.filter(technique =>
    technique.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technique.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technique.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overallCoverage = tactics.reduce((acc, tactic) => acc + tactic.coverage, 0) / tactics.length;
  const totalDetections = detections.length;
  const criticalDetections = detections.filter(d => d.severity === 'critical').length;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            MITRE ATT&CK Framework
          </h1>
          <p className="text-slate-600">Adversarial tactics, techniques, and procedures mapping - Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={openMitreWebsite}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            MITRE.org
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
            onClick={exportMitreMatrix}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Matrix
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detection Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCoverage.toFixed(1)}%</div>
            <div className="flex items-center text-purple-100 text-sm">
              <Eye className="h-4 w-4 mr-1" />
              Across all tactics
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDetections}</div>
            <div className="text-red-100 text-sm">
              {criticalDetections} critical alerts
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tactics Monitored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tactics.length}</div>
            <div className="text-orange-100 text-sm">
              All MITRE tactics covered
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Techniques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{techniques.length}</div>
            <div className="text-green-100 text-sm">
              Monitored & analyzed
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="bg-white border border-purple-200">
          <TabsTrigger value="matrix" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            ATT&CK Matrix
          </TabsTrigger>
          <TabsTrigger value="techniques" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Techniques
          </TabsTrigger>
          <TabsTrigger value="detections" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Live Detections
          </TabsTrigger>
          <TabsTrigger value="coverage" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Coverage Analysis
          </TabsTrigger>
          <TabsTrigger value="paths" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Attack Paths
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tactics.map((tactic) => (
              <Card 
                key={tactic.id} 
                className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedTactic === tactic.id ? 'border-purple-500 bg-purple-50' : 'border-purple-200'
                }`}
                onClick={() => setSelectedTactic(tactic.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-purple-700">{tactic.name}</CardTitle>
                    <Badge className={getSeverityColor(tactic.riskLevel)}>
                      {tactic.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{tactic.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Coverage</span>
                    <span className="font-medium">{tactic.coverage}%</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-purple-600">{tactic.techniques}</div>
                      <div className="text-xs text-slate-500">Techniques</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{tactic.detectedCount}</div>
                      <div className="text-xs text-slate-500">Detected</div>
                    </div>
                  </div>

                  <div 
                    className="h-2 rounded-full"
                    style={{ backgroundColor: `${tactic.color}20` }}
                  >
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        backgroundColor: tactic.color,
                        width: `${tactic.coverage}%`
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="techniques" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-700">MITRE Techniques Database</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search techniques..."
                    className="pl-10 border-purple-200 focus:ring-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="border-purple-200 text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredTechniques.map((technique) => (
                    <div key={technique.id} className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-purple-700">{technique.id} - {technique.name}</h4>
                            <Badge className={getSeverityColor(technique.severity)}>
                              {technique.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{technique.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                            <span>Tactic: {technique.tactic}</span>
                            <span>Sub-techniques: {technique.subTechniques}</span>
                            <span>Recent Detections: {technique.recentDetections}</span>
                          </div>
                          <div className="flex gap-1 mb-2">
                            {technique.platforms.map((platform) => (
                              <Badge key={platform} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Detection Coverage</span>
                            <span>{technique.detectionCoverage}%</span>
                          </div>
                          <div className="h-2 bg-purple-100 rounded-full">
                            <div 
                              className="h-2 bg-purple-500 rounded-full transition-all"
                              style={{ width: `${technique.detectionCoverage}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Mitigation Coverage</span>
                            <span>{technique.mitigationCoverage}%</span>
                          </div>
                          <div className="h-2 bg-green-100 rounded-full">
                            <div 
                              className="h-2 bg-green-500 rounded-full transition-all"
                              style={{ width: `${technique.mitigationCoverage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detections" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-700">Real-time MITRE Detections</CardTitle>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-600">Live monitoring active</span>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {detections.map((detection) => (
                    <div key={detection.id} className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(detection.severity)}>
                              {detection.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{detection.technique}</span>
                            {detection.mitigated && (
                              <Badge className="bg-green-100 text-green-800">MITIGATED</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{detection.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Source: {detection.source}</span>
                            <span>Confidence: {detection.confidence}%</span>
                            <span>{detection.timestamp.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button size="sm" variant="outline" className="border-purple-200 text-purple-700">
                            <Info className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Tactic Coverage Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={coverageData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                    <Tooltip />
                    <Bar dataKey="coverage" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Detection vs Mitigation Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={techniques}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="detectionCoverage" fill="#8b5cf6" name="Detection" />
                    <Bar dataKey="mitigationCoverage" fill="#10b981" name="Mitigation" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {attackPaths.map((path) => (
              <Card key={path.id} className="border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-purple-700">{path.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-orange-100 text-orange-800">
                      {path.probability}% Probability
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      {path.impact}% Impact
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Attack Steps:</h4>
                    <div className="space-y-2">
                      {path.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Recommended Mitigations:</h4>
                    <p className="text-sm text-slate-600">{path.mitigation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}