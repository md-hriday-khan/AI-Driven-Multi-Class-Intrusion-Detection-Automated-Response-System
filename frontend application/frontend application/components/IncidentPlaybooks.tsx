import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, Users, Clock, AlertTriangle, CheckCircle, XCircle, 
  PlayCircle, PauseCircle, SkipForward, RotateCcw, Brain, Phone,
  Shield, Zap, Eye, Settings, Activity, TrendingUp, UserCheck
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  assignedRole: string;
  estimatedTime: number; // in minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  automationPossible: boolean;
  humanTakeoverThreshold?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  startTime?: Date;
  completionTime?: Date;
  notes?: string;
}

interface IncidentPlaybook {
  id: string;
  name: string;
  category: 'malware' | 'data_breach' | 'ddos' | 'insider_threat' | 'apt' | 'system_compromise';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  triggerConditions: string[];
  steps: PlaybookStep[];
  escalationPath: string[];
  humanTakeoverCriteria: string[];
  estimatedDuration: number; // in minutes
  lastUsed?: Date;
  successRate: number;
  automationLevel: number; // percentage
}

interface PlaybookExecution {
  id: string;
  playbookId: string;
  incidentId: string;
  status: 'active' | 'completed' | 'paused' | 'escalated' | 'aborted';
  startTime: Date;
  completionTime?: Date;
  currentStep: number;
  humanTakeover: boolean;
  escalationLevel: number;
  assignedTeam: string[];
  notes: string;
}

interface EscalationRule {
  id: string;
  condition: string;
  threshold: string;
  action: string;
  notificationTargets: string[];
  autoExecute: boolean;
}

const IncidentPlaybooks: React.FC = () => {
  const [playbooks, setPlaybooks] = useState<IncidentPlaybook[]>([]);
  const [executions, setExecutions] = useState<PlaybookExecution[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<IncidentPlaybook | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<PlaybookExecution | null>(null);

  // Mock data generation
  useEffect(() => {
    const mockSteps: PlaybookStep[] = [
      {
        id: 'step-001',
        title: 'Initial Assessment',
        description: 'Assess the scope and impact of the security incident',
        assignedRole: 'SOC Analyst L1',
        estimatedTime: 5,
        priority: 'critical',
        dependencies: [],
        automationPossible: true,
        status: 'completed',
        startTime: new Date(Date.now() - 10 * 60 * 1000),
        completionTime: new Date(Date.now() - 7 * 60 * 1000)
      },
      {
        id: 'step-002',
        title: 'Containment Actions',
        description: 'Isolate affected systems and prevent lateral movement',
        assignedRole: 'SOC Analyst L2',
        estimatedTime: 15,
        priority: 'critical',
        dependencies: ['step-001'],
        automationPossible: true,
        humanTakeoverThreshold: 'More than 10 systems affected',
        status: 'in_progress',
        startTime: new Date(Date.now() - 7 * 60 * 1000)
      },
      {
        id: 'step-003',
        title: 'Threat Analysis',
        description: 'Analyze malware samples and attack vectors',
        assignedRole: 'Threat Analyst',
        estimatedTime: 30,
        priority: 'high',
        dependencies: ['step-002'],
        automationPossible: false,
        status: 'pending'
      },
      {
        id: 'step-004',
        title: 'Evidence Collection',
        description: 'Collect forensic evidence for investigation',
        assignedRole: 'Digital Forensics',
        estimatedTime: 45,
        priority: 'medium',
        dependencies: ['step-002'],
        automationPossible: true,
        status: 'pending'
      }
    ];

    const mockPlaybooks: IncidentPlaybook[] = [
      {
        id: 'pb-001',
        name: 'Malware Incident Response',
        category: 'malware',
        severity: 'critical',
        description: 'Standard response procedure for malware infections',
        triggerConditions: ['Malware signature detected', 'Suspicious process execution', 'AV alert triggered'],
        steps: mockSteps,
        escalationPath: ['SOC Manager', 'CISO', 'IT Director', 'CEO'],
        humanTakeoverCriteria: ['Critical infrastructure affected', 'Data exfiltration detected', 'More than 50 endpoints infected'],
        estimatedDuration: 120,
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        successRate: 95,
        automationLevel: 65
      },
      {
        id: 'pb-002',
        name: 'Data Breach Response',
        category: 'data_breach',
        severity: 'critical',
        description: 'Response procedure for confirmed or suspected data breaches',
        triggerConditions: ['Unauthorized data access', 'Data exfiltration detected', 'Compliance violation'],
        steps: [],
        escalationPath: ['SOC Manager', 'Legal Team', 'CISO', 'CEO'],
        humanTakeoverCriteria: ['PII/PHI involved', 'Regulatory notification required', 'Media attention'],
        estimatedDuration: 180,
        lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        successRate: 88,
        automationLevel: 35
      },
      {
        id: 'pb-003',
        name: 'DDoS Attack Mitigation',
        category: 'ddos',
        severity: 'high',
        description: 'Procedures for mitigating distributed denial of service attacks',
        triggerConditions: ['Abnormal traffic patterns', 'Service unavailability', 'Network congestion'],
        steps: [],
        escalationPath: ['Network Team', 'SOC Manager', 'IT Director'],
        humanTakeoverCriteria: ['ISP involvement needed', 'Business critical services down'],
        estimatedDuration: 60,
        successRate: 92,
        automationLevel: 80
      }
    ];

    const mockExecutions: PlaybookExecution[] = [
      {
        id: 'exec-001',
        playbookId: 'pb-001',
        incidentId: 'inc-2024-001',
        status: 'active',
        startTime: new Date(Date.now() - 10 * 60 * 1000),
        currentStep: 2,
        humanTakeover: false,
        escalationLevel: 0,
        assignedTeam: ['Alice Johnson', 'Bob Smith'],
        notes: 'Malware detected on executive workstation, containment in progress'
      },
      {
        id: 'exec-002',
        playbookId: 'pb-002',
        incidentId: 'inc-2024-002',
        status: 'escalated',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        currentStep: 5,
        humanTakeover: true,
        escalationLevel: 2,
        assignedTeam: ['Carol Davis', 'David Wilson', 'Eve Brown'],
        notes: 'Potential data breach involving customer records, legal team engaged'
      }
    ];

    const mockEscalationRules: EscalationRule[] = [
      {
        id: 'esc-001',
        condition: 'Incident duration exceeds threshold',
        threshold: '60 minutes',
        action: 'Escalate to SOC Manager',
        notificationTargets: ['soc-manager@company.com', 'on-call-team'],
        autoExecute: true
      },
      {
        id: 'esc-002',
        condition: 'Critical infrastructure affected',
        threshold: 'Immediate',
        action: 'Emergency escalation to CISO',
        notificationTargets: ['ciso@company.com', 'emergency-team'],
        autoExecute: true
      },
      {
        id: 'esc-003',
        condition: 'Human takeover required',
        threshold: 'Automation confidence < 70%',
        action: 'Transfer to senior analyst',
        notificationTargets: ['senior-analysts@company.com'],
        autoExecute: true
      }
    ];

    setPlaybooks(mockPlaybooks);
    setExecutions(mockExecutions);
    setEscalationRules(mockEscalationRules);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'escalated': return 'text-red-600 bg-red-50 border-red-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'aborted': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'malware': return <Shield className="h-4 w-4" />;
      case 'data_breach': return <AlertTriangle className="h-4 w-4" />;
      case 'ddos': return <Zap className="h-4 w-4" />;
      case 'insider_threat': return <Users className="h-4 w-4" />;
      case 'apt': return <Brain className="h-4 w-4" />;
      case 'system_compromise': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const playbookMetrics = [
    { name: 'Active Executions', value: executions.filter(e => e.status === 'active').length },
    { name: 'Avg Resolution Time', value: '85m' },
    { name: 'Automation Level', value: `${Math.round(playbooks.reduce((sum, p) => sum + p.automationLevel, 0) / playbooks.length)}%` },
    { name: 'Success Rate', value: `${Math.round(playbooks.reduce((sum, p) => sum + p.successRate, 0) / playbooks.length)}%` }
  ];

  const executionTrendData = [
    { hour: '00:00', automated: 2, manual: 1, escalated: 0 },
    { hour: '04:00', automated: 1, manual: 0, escalated: 0 },
    { hour: '08:00', automated: 5, manual: 2, escalated: 1 },
    { hour: '12:00', automated: 3, manual: 1, escalated: 0 },
    { hour: '16:00', automated: 4, manual: 3, escalated: 2 },
    { hour: '20:00', automated: 2, manual: 1, escalated: 0 }
  ];

  const handleExecutePlaybook = (playbookId: string) => {
    const newExecution: PlaybookExecution = {
      id: `exec-${Date.now()}`,
      playbookId: playbookId,
      incidentId: `inc-${Date.now()}`,
      status: 'active',
      startTime: new Date(),
      currentStep: 1,
      humanTakeover: false,
      escalationLevel: 0,
      assignedTeam: ['Current User'],
      notes: 'Playbook execution started from UI'
    };
    setExecutions(prev => [newExecution, ...prev]);
  };

  const handleHumanTakeover = (executionId: string) => {
    setExecutions(prev => prev.map(exec => 
      exec.id === executionId 
        ? { ...exec, humanTakeover: true, escalationLevel: exec.escalationLevel + 1 }
        : exec
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Incident Response Playbooks
          </h2>
          <p className="text-slate-600 mt-2">Structured response procedures with clear escalation paths and human takeover criteria</p>
          <p className="text-xs text-slate-500 mt-1">Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <FileText className="h-4 w-4 mr-2" />
            New Playbook
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {playbookMetrics.map((metric, index) => (
          <Card key={index} className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="playbooks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="executions">Active Executions</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
          <TabsTrigger value="human-takeover">Human Takeover</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="playbooks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playbooks List */}
            <div className="lg:col-span-2">
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Incident Response Playbooks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {playbooks.map((playbook) => (
                        <div 
                          key={playbook.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedPlaybook?.id === playbook.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedPlaybook(playbook)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg">
                                {getCategoryIcon(playbook.category)}
                              </div>
                              <div>
                                <p className="font-medium">{playbook.name}</p>
                                <p className="text-sm text-slate-600 capitalize">{playbook.category.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge className={getSeverityColor(playbook.severity)}>
                                {playbook.severity.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-700 mb-3">{playbook.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-slate-500">Duration:</span>
                              <span className="ml-2 font-medium">{playbook.estimatedDuration}m</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Success Rate:</span>
                              <span className="ml-2 font-medium">{playbook.successRate}%</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Automation:</span>
                              <span className="ml-2 font-medium">{playbook.automationLevel}%</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Steps:</span>
                              <span className="ml-2 font-medium">{playbook.steps.length}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                              {playbook.lastUsed ? `Last used: ${playbook.lastUsed.toLocaleDateString()}` : 'Never used'}
                            </div>
                            <Button 
                              size="sm" 
                              className="h-6 text-xs bg-purple-600 hover:bg-purple-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecutePlaybook(playbook.id);
                              }}
                            >
                              <PlayCircle className="h-3 w-3 mr-1" />
                              Execute
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Playbook Details */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Playbook Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPlaybook ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Trigger Conditions</h4>
                      <div className="space-y-1">
                        {selectedPlaybook.triggerConditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>{condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Escalation Path</h4>
                      <div className="space-y-2">
                        {selectedPlaybook.escalationPath.map((role, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                              {index + 1}
                            </div>
                            <span>{role}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Human Takeover Criteria</h4>
                      <div className="space-y-1">
                        {selectedPlaybook.humanTakeoverCriteria.map((criteria, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <UserCheck className="h-3 w-3 text-blue-500" />
                            <span>{criteria}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Process Steps</h4>
                      <div className="space-y-2">
                        {selectedPlaybook.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm p-2 bg-slate-50 rounded">
                            <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{step.title}</p>
                              <p className="text-xs text-slate-600">{step.assignedRole} • {step.estimatedTime}min</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a playbook to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Executions */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Active Playbook Executions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {executions.map((execution) => (
                      <div 
                        key={execution.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedExecution?.id === execution.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedExecution(execution)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">Incident {execution.incidentId}</p>
                            <p className="text-sm text-slate-600">Playbook: {execution.playbookId}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge className={getStatusColor(execution.status)}>
                              {execution.status.toUpperCase()}
                            </Badge>
                            {execution.humanTakeover && (
                              <Badge variant="outline" className="text-xs">
                                Human Control
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-700 mb-2">{execution.notes}</p>
                        
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Step {execution.currentStep} of {selectedPlaybook?.steps.length || '?'}</span>
                          <span>Escalation Level: {execution.escalationLevel}</span>
                        </div>

                        <div className="mb-2">
                          <Progress value={(execution.currentStep / (selectedPlaybook?.steps.length || 1)) * 100} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Team: {execution.assignedTeam.join(', ')}</span>
                          <span>Started: {execution.startTime.toLocaleTimeString()}</span>
                        </div>

                        {!execution.humanTakeover && execution.status === 'active' && (
                          <div className="mt-2 flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHumanTakeover(execution.id);
                              }}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Take Control
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Execution Timeline */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Execution Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedExecution && selectedPlaybook ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Incident {selectedExecution.incidentId}</h4>
                      <Badge className={getStatusColor(selectedExecution.status)}>
                        {selectedExecution.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <ScrollArea className="h-80">
                      <div className="space-y-3">
                        {selectedPlaybook.steps.map((step, index) => (
                          <div key={step.id} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              {getStepStatusIcon(step.status)}
                              {index < selectedPlaybook.steps.length - 1 && (
                                <div className="w-px h-8 bg-slate-200 mt-1"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{step.title}</p>
                                <Badge variant="outline" className="text-xs">
                                  {step.estimatedTime}min
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 mb-1">{step.description}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{step.assignedRole}</span>
                                {step.automationPossible && (
                                  <Badge variant="outline" className="text-xs">
                                    Auto
                                  </Badge>
                                )}
                              </div>
                              {step.startTime && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Started: {step.startTime.toLocaleTimeString()}
                                  {step.completionTime && (
                                    <span> • Completed: {step.completionTime.toLocaleTimeString()}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>Select an execution to view timeline</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="escalation" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Escalation Rules & Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {escalationRules.map((rule) => (
                  <div key={rule.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{rule.condition}</p>
                        <p className="text-sm text-slate-600">Threshold: {rule.threshold}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rule.autoExecute && (
                          <Badge variant="outline" className="text-xs">
                            Auto Execute
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-2">Action: {rule.action}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Notifications: {rule.notificationTargets.join(', ')}</span>
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

        <TabsContent value="human-takeover" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Human Takeover Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    Human takeover protocols are active. Analysts can assume control when automation confidence falls below threshold or critical decisions are required.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Current Human-Controlled Incidents</h4>
                    <div className="space-y-2">
                      {executions.filter(e => e.humanTakeover).map((execution) => (
                        <div key={execution.id} className="p-3 border border-slate-200 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">Incident {execution.incidentId}</p>
                            <Badge variant="outline" className="text-xs">
                              Human Control
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">Team: {execution.assignedTeam.join(', ')}</p>
                          <p className="text-xs text-slate-500">Escalation Level: {execution.escalationLevel}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Takeover Criteria</h4>
                    <div className="space-y-2">
                      <div className="p-3 border border-slate-200 rounded">
                        <p className="font-medium text-sm">Automation Confidence Threshold</p>
                        <p className="text-xs text-slate-600">Threshold: &lt; 70%</p>
                        <p className="text-xs text-slate-500">Status: Monitoring</p>
                      </div>
                      <div className="p-3 border border-slate-200 rounded">
                        <p className="font-medium text-sm">Critical Infrastructure Impact</p>
                        <p className="text-xs text-slate-600">Threshold: Immediate</p>
                        <p className="text-xs text-slate-500">Status: Active</p>
                      </div>
                      <div className="p-3 border border-slate-200 rounded">
                        <p className="font-medium text-sm">Regulatory Compliance Risk</p>
                        <p className="text-xs text-slate-600">Threshold: High risk detected</p>
                        <p className="text-xs text-slate-500">Status: Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Playbook Execution Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={executionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="automated" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="manual" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="escalated" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentPlaybooks;