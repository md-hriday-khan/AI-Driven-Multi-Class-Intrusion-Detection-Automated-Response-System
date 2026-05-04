import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  Shield, CheckCircle, AlertTriangle, XCircle, FileText, Clock, 
  Users, Lock, Database, Network, Eye, Settings, TrendingUp,
  Download, RefreshCw, Calendar, Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  compliance: number;
  controls: number;
  passed: number;
  failed: number;
  pending: number;
  lastAudit: Date;
  nextAudit: Date;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceControl {
  id: string;
  framework: string;
  title: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'pending';
  evidence: string[];
  lastCheck: Date;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  framework: string;
  control: string;
  action: string;
  user: string;
  result: 'pass' | 'fail' | 'warning';
  details: string;
}

export function ComplianceMonitoring() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedFramework, setSelectedFramework] = useState('');
  const [complianceTrend, setComplianceTrend] = useState<any[]>([]);

  useEffect(() => {
    // Initialize compliance frameworks
    const initialFrameworks: ComplianceFramework[] = [
      {
        id: 'iso27001',
        name: 'ISO 27001',
        description: 'Information Security Management Systems',
        compliance: 87,
        controls: 114,
        passed: 99,
        failed: 8,
        pending: 7,
        lastAudit: new Date(2024, 9, 15),
        nextAudit: new Date(2024, 11, 15),
        risk: 'low'
      },
      {
        id: 'nist',
        name: 'NIST Cybersecurity Framework',
        description: 'Framework for Improving Critical Infrastructure Cybersecurity',
        compliance: 92,
        controls: 108,
        passed: 99,
        failed: 5,
        pending: 4,
        lastAudit: new Date(2024, 9, 20),
        nextAudit: new Date(2024, 11, 20),
        risk: 'low'
      },
      {
        id: 'sox',
        name: 'SOX',
        description: 'Sarbanes-Oxley Act Compliance',
        compliance: 78,
        controls: 45,
        passed: 35,
        failed: 6,
        pending: 4,
        lastAudit: new Date(2024, 8, 30),
        nextAudit: new Date(2024, 11, 30),
        risk: 'medium'
      },
      {
        id: 'gdpr',
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        compliance: 95,
        controls: 73,
        passed: 69,
        failed: 2,
        pending: 2,
        lastAudit: new Date(2024, 9, 10),
        nextAudit: new Date(2024, 11, 10),
        risk: 'low'
      },
      {
        id: 'hipaa',
        name: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act',
        compliance: 85,
        controls: 67,
        passed: 57,
        failed: 7,
        pending: 3,
        lastAudit: new Date(2024, 9, 5),
        nextAudit: new Date(2024, 11, 5),
        risk: 'medium'
      },
      {
        id: 'pci',
        name: 'PCI DSS',
        description: 'Payment Card Industry Data Security Standard',
        compliance: 89,
        controls: 78,
        passed: 69,
        failed: 6,
        pending: 3,
        lastAudit: new Date(2024, 9, 25),
        nextAudit: new Date(2024, 11, 25),
        risk: 'low'
      }
    ];

    const initialControls: ComplianceControl[] = [
      {
        id: 'iso-a5.1.1',
        framework: 'ISO 27001',
        title: 'Information Security Policy',
        description: 'An information security policy shall be defined, approved by management, published and communicated to employees and relevant external parties.',
        status: 'compliant',
        evidence: ['Policy Document v2.1', 'Management Approval', 'Training Records'],
        lastCheck: new Date(2024, 9, 20),
        assignee: 'Security Team',
        priority: 'high',
        category: 'Policy & Governance'
      },
      {
        id: 'nist-id.am-1',
        framework: 'NIST',
        title: 'Asset Management',
        description: 'Physical devices and systems within the organization are inventoried',
        status: 'partial',
        evidence: ['Asset Inventory System', 'Pending Mobile Devices'],
        lastCheck: new Date(2024, 9, 18),
        assignee: 'IT Operations',
        priority: 'medium',
        category: 'Asset Management'
      },
      {
        id: 'gdpr-art25',
        framework: 'GDPR',
        title: 'Data Protection by Design',
        description: 'Data protection by design and by default',
        status: 'compliant',
        evidence: ['Privacy Impact Assessments', 'System Design Reviews'],
        lastCheck: new Date(2024, 9, 15),
        assignee: 'Privacy Officer',
        priority: 'high',
        category: 'Privacy'
      },
      {
        id: 'sox-404',
        framework: 'SOX',
        title: 'Internal Controls Assessment',
        description: 'Management assessment of internal controls',
        status: 'non-compliant',
        evidence: ['Pending Assessment', 'Control Testing Required'],
        lastCheck: new Date(2024, 9, 10),
        assignee: 'Audit Team',
        priority: 'critical',
        category: 'Financial Controls'
      }
    ];

    const initialAuditLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date(2024, 9, 20, 14, 30),
        framework: 'ISO 27001',
        control: 'A.5.1.1',
        action: 'Control Assessment',
        user: 'auditor@company.com',
        result: 'pass',
        details: 'Information security policy reviewed and found compliant'
      },
      {
        id: '2',
        timestamp: new Date(2024, 9, 20, 11, 15),
        framework: 'NIST',
        control: 'ID.AM-1',
        action: 'Asset Inventory Check',
        user: 'it.admin@company.com',
        result: 'warning',
        details: 'Mobile device inventory incomplete - 15 devices pending registration'
      },
      {
        id: '3',
        timestamp: new Date(2024, 9, 19, 16, 45),
        framework: 'SOX',
        control: '404',
        action: 'Control Testing',
        user: 'audit.manager@company.com',
        result: 'fail',
        details: 'Internal control assessment documentation incomplete'
      }
    ];

    // Generate compliance trend data
    const trendData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendData.push({
        date: date.toISOString().split('T')[0],
        'ISO 27001': Math.floor(Math.random() * 10) + 80,
        'NIST': Math.floor(Math.random() * 8) + 85,
        'GDPR': Math.floor(Math.random() * 5) + 90,
        'SOX': Math.floor(Math.random() * 15) + 70,
        'HIPAA': Math.floor(Math.random() * 12) + 78,
        'PCI DSS': Math.floor(Math.random() * 8) + 82
      });
    }

    setFrameworks(initialFrameworks);
    setControls(initialControls);
    setAuditLogs(initialAuditLogs);
    setComplianceTrend(trendData);
    setSelectedFramework('iso27001');

    // Simulate real-time updates
    const interval = setInterval(() => {
      setFrameworks(prev => prev.map(framework => ({
        ...framework,
        compliance: Math.max(0, Math.min(100, framework.compliance + (Math.random() - 0.5) * 2))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': case 'pass': return 'bg-green-100 text-green-800';
      case 'non-compliant': case 'fail': return 'bg-red-100 text-red-800';
      case 'partial': case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const overallCompliance = frameworks.reduce((acc, f) => acc + f.compliance, 0) / frameworks.length;
  const totalControls = frameworks.reduce((acc, f) => acc + f.controls, 0);
  const totalPassed = frameworks.reduce((acc, f) => acc + f.passed, 0);
  const totalFailed = frameworks.reduce((acc, f) => acc + f.failed, 0);

  const pieData = [
    { name: 'Compliant', value: totalPassed, fill: '#22c55e' },
    { name: 'Non-Compliant', value: totalFailed, fill: '#ef4444' },
    { name: 'Pending', value: totalControls - totalPassed - totalFailed, fill: '#3b82f6' }
  ];

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Automated Compliance Monitoring
          </h1>
          <p className="text-slate-600">Real-time compliance tracking and automated control assessment - Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompliance.toFixed(1)}%</div>
            <div className="flex items-center text-purple-100 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              +2.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Controls Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPassed}</div>
            <div className="text-green-100 text-sm">
              {((totalPassed / totalControls) * 100).toFixed(1)}% of total controls
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFailed}</div>
            <div className="text-red-100 text-sm">
              Requires immediate attention
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{frameworks.length}</div>
            <div className="text-blue-100 text-sm">
              All frameworks monitored
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="frameworks" className="space-y-6">
        <TabsList className="bg-white border border-purple-200">
          <TabsTrigger value="frameworks" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="controls" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Controls
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Trends
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {frameworks.map((framework) => (
              <Card key={framework.id} className="border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-purple-700">{framework.name}</CardTitle>
                    <Badge className={getRiskColor(framework.risk)}>
                      {framework.risk.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{framework.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Compliance Score</span>
                      <span className="font-medium">{framework.compliance.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={framework.compliance} 
                      className="h-2 bg-purple-100"
                      // Note: Progress component would need custom styling for purple color
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{framework.passed}</div>
                      <div className="text-xs text-slate-500">Passed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{framework.failed}</div>
                      <div className="text-xs text-slate-500">Failed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{framework.pending}</div>
                      <div className="text-xs text-slate-500">Pending</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-purple-100">
                    <span>Last Audit: {framework.lastAudit.toLocaleDateString()}</span>
                    <span>Next: {framework.nextAudit.toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-700">Compliance Controls</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-purple-200 text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {controls.map((control) => (
                    <div key={control.id} className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-purple-700">{control.title}</h4>
                            <Badge className={getStatusColor(control.status)}>
                              {control.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {control.framework}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{control.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>ID: {control.id}</span>
                            <span>Assignee: {control.assignee}</span>
                            <span>Last Check: {control.lastCheck.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge className={getRiskColor(control.priority)}>
                          {control.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Compliance Trends (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ISO 27001" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="NIST" stroke="#06b6d4" strokeWidth={2} />
                    <Line type="monotone" dataKey="GDPR" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="SOX" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-700">Control Status Distribution</CardTitle>
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
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-purple-700">Audit Activity Log</CardTitle>
              <p className="text-sm text-slate-600">Recent compliance assessment activities</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(log.result)}>
                              {log.result.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{log.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.framework}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{log.details}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Control: {log.control}</span>
                            <span>User: {log.user}</span>
                            <span>{log.timestamp.toLocaleString()}</span>
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
      </Tabs>
    </div>
  );
}