import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, Shield, AlertTriangle, CheckCircle, Clock, Activity, Settings, Play, Pause, Target } from 'lucide-react';

interface ThreatEvent {
  id: string;
  timestamp: number;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  targetIP: string;
  confidence: number;
  description: string;
}

interface ResponseAction {
  id: string;
  timestamp: number;
  eventId: string;
  actionType: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executionTime: number;
  details: string;
  effectiveness: number;
  automated: boolean;
}

interface PlaybookRule {
  id: string;
  name: string;
  description: string;
  triggers: {
    threatTypes: string[];
    severityLevel: string;
    confidenceThreshold: number;
  };
  actions: {
    type: string;
    priority: number;
    parameters: Record<string, any>;
    timeout: number;
  }[];
  enabled: boolean;
  executionCount: number;
  successRate: number;
}

interface EngineMetrics {
  totalResponses: number;
  successfulResponses: number;
  averageResponseTime: number;
  threatsBlocked: number;
  falsePositives: number;
  efficiency: number;
}

export function AutonomousResponseEngine() {
  const [isEngineActive, setIsEngineActive] = useState(true);
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [responses, setResponses] = useState<ResponseAction[]>([]);
  const [playbooks, setPlaybooks] = useState<PlaybookRule[]>([]);
  const [metrics, setMetrics] = useState<EngineMetrics>({
    totalResponses: 0,
    successfulResponses: 0,
    averageResponseTime: 0,
    threatsBlocked: 0,
    falsePositives: 0,
    efficiency: 0
  });
  const [queueSize, setQueueSize] = useState(0);

  // Initialize playbook rules
  useEffect(() => {
    const initialPlaybooks: PlaybookRule[] = [
      {
        id: 'rule_ddos_mitigation',
        name: 'DDoS Attack Mitigation',
        description: 'Automatically block DDoS attacks and implement rate limiting',
        triggers: {
          threatTypes: ['ddos'],
          severityLevel: 'medium',
          confidenceThreshold: 0.8
        },
        actions: [
          {
            type: 'ip_block',
            priority: 1,
            parameters: { duration: '1h', scope: 'source_ip' },
            timeout: 30000
          },
          {
            type: 'rate_limit',
            priority: 2,
            parameters: { limit: 100, window: '1m' },
            timeout: 5000
          },
          {
            type: 'alert_soc',
            priority: 3,
            parameters: { urgency: 'high' },
            timeout: 1000
          }
        ],
        enabled: true,
        executionCount: 45,
        successRate: 94.2
      },
      {
        id: 'rule_malware_quarantine',
        name: 'Malware Quarantine',
        description: 'Isolate and quarantine malware-infected endpoints',
        triggers: {
          threatTypes: ['malware'],
          severityLevel: 'high',
          confidenceThreshold: 0.85
        },
        actions: [
          {
            type: 'endpoint_isolation',
            priority: 1,
            parameters: { method: 'network_quarantine' },
            timeout: 60000
          },
          {
            type: 'file_quarantine',
            priority: 2,
            parameters: { scan_deep: true },
            timeout: 120000
          },
          {
            type: 'forensic_capture',
            priority: 3,
            parameters: { memory_dump: true, disk_image: false },
            timeout: 300000
          }
        ],
        enabled: true,
        executionCount: 23,
        successRate: 91.3
      },
      {
        id: 'rule_bruteforce_block',
        name: 'Brute Force Protection',
        description: 'Block brute force attacks and enforce account lockouts',
        triggers: {
          threatTypes: ['bruteforce'],
          severityLevel: 'medium',
          confidenceThreshold: 0.75
        },
        actions: [
          {
            type: 'account_lockout',
            priority: 1,
            parameters: { duration: '30m', failed_attempts: 5 },
            timeout: 5000
          },
          {
            type: 'ip_reputation_check',
            priority: 2,
            parameters: { blacklist_update: true },
            timeout: 10000
          },
          {
            type: 'captcha_challenge',
            priority: 3,
            parameters: { difficulty: 'medium' },
            timeout: 2000
          }
        ],
        enabled: true,
        executionCount: 67,
        successRate: 96.8
      },
      {
        id: 'rule_data_exfiltration',
        name: 'Data Exfiltration Prevention',
        description: 'Prevent unauthorized data transfers and alert security team',
        triggers: {
          threatTypes: ['exfiltration'],
          severityLevel: 'critical',
          confidenceThreshold: 0.9
        },
        actions: [
          {
            type: 'connection_terminate',
            priority: 1,
            parameters: { immediate: true },
            timeout: 1000
          },
          {
            type: 'dlp_enforcement',
            priority: 2,
            parameters: { policy: 'strict' },
            timeout: 15000
          },
          {
            type: 'incident_creation',
            priority: 3,
            parameters: { severity: 'critical', escalate: true },
            timeout: 5000
          }
        ],
        enabled: true,
        executionCount: 12,
        successRate: 100
      }
    ];

    setPlaybooks(initialPlaybooks);
  }, []);

  // Generate threat events and automatic responses
  useEffect(() => {
    if (!isEngineActive) return;

    const interval = setInterval(() => {
      // Generate new threat event
      if (Math.random() > 0.6) {
        const threatTypes = ['ddos', 'malware', 'bruteforce', 'botnet', 'exfiltration', 'zeroday'];
        const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
        
        const newEvent: ThreatEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          targetIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          confidence: Math.random() * 0.3 + 0.7, // 70-100%
          description: `${threatTypes[Math.floor(Math.random() * threatTypes.length)].toUpperCase()} attack detected from external source`
        };

        setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        setQueueSize(prev => prev + 1);

        // Check for matching playbook rules
        const matchingRules = playbooks.filter(rule => 
          rule.enabled &&
          rule.triggers.threatTypes.includes(newEvent.threatType) &&
          newEvent.confidence >= rule.triggers.confidenceThreshold &&
          getSeverityWeight(newEvent.severity) >= getSeverityWeight(rule.triggers.severityLevel)
        );

        // Execute automated responses
        matchingRules.forEach(rule => {
          rule.actions.forEach((action, index) => {
            setTimeout(() => {
              const response: ResponseAction = {
                id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                eventId: newEvent.id,
                actionType: action.type,
                status: 'executing',
                executionTime: 0,
                details: `Executing ${action.type} for ${newEvent.threatType} threat`,
                effectiveness: 0,
                automated: true
              };

              setResponses(prev => [response, ...prev.slice(0, 99)]);

              // Simulate execution completion
              setTimeout(() => {
                const executionTime = Math.random() * action.timeout;
                const success = Math.random() > 0.1; // 90% success rate
                const effectiveness = success ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;

                setResponses(prev => prev.map(r => 
                  r.id === response.id 
                    ? { 
                        ...r, 
                        status: success ? 'completed' : 'failed',
                        executionTime,
                        effectiveness,
                        details: success 
                          ? `Successfully executed ${action.type} - ${(effectiveness * 100).toFixed(1)}% effective`
                          : `Failed to execute ${action.type} - retrying with alternative method`
                      }
                    : r
                ));

                // Update metrics
                setMetrics(prev => ({
                  ...prev,
                  totalResponses: prev.totalResponses + 1,
                  successfulResponses: success ? prev.successfulResponses + 1 : prev.successfulResponses,
                  averageResponseTime: (prev.averageResponseTime * prev.totalResponses + executionTime) / (prev.totalResponses + 1),
                  threatsBlocked: success && effectiveness > 0.8 ? prev.threatsBlocked + 1 : prev.threatsBlocked,
                  efficiency: ((prev.successfulResponses + (success ? 1 : 0)) / (prev.totalResponses + 1)) * 100
                }));

                setQueueSize(prev => Math.max(0, prev - 1));
              }, executionTime);
            }, index * 1000); // Stagger action execution
          });
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isEngineActive, playbooks]);

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
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-black';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600 text-white';
      case 'executing': return 'bg-blue-600 text-white animate-pulse';
      case 'pending': return 'bg-yellow-600 text-black';
      case 'failed': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const togglePlaybook = (playbookId: string) => {
    setPlaybooks(prev => prev.map(p => 
      p.id === playbookId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  // Prepare chart data
  const responseTimeData = responses.slice(0, 20).map((response, index) => ({
    time: index,
    executionTime: response.executionTime / 1000, // Convert to seconds
    effectiveness: response.effectiveness * 100
  }));

  const actionTypeData = responses.reduce((acc, response) => {
    const existing = acc.find(item => item.name === response.actionType);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: response.actionType, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Engine Status */}
      <Alert className={isEngineActive ? 'border-green-600 bg-green-950/20' : 'border-yellow-600 bg-yellow-950/20'}>
        <Zap className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Autonomous Response Engine: {isEngineActive ? 'ACTIVE' : 'STANDBY'} | 
            Queue: {queueSize} events | 
            Success Rate: {metrics.efficiency.toFixed(1)}%
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm">Engine Status:</span>
            <Switch
              checked={isEngineActive}
              onCheckedChange={setIsEngineActive}
            />
          </div>
        </AlertDescription>
      </Alert>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-900 to-cyan-800 border-cyan-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-100">Total Responses</CardTitle>
            <Activity className="h-4 w-4 text-cyan-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalResponses}</div>
            <p className="text-xs text-cyan-200">automated actions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.efficiency.toFixed(1)}%</div>
            <p className="text-xs text-emerald-200">{metrics.successfulResponses} successful</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(metrics.averageResponseTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-blue-200">execution time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Threats Blocked</CardTitle>
            <Shield className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.threatsBlocked}</div>
            <p className="text-xs text-purple-200">attacks mitigated</p>
          </CardContent>
        </Card>
      </div>

      {/* Response Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Response Time & Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="executionTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Response Time (s)"
                />
                <Line 
                  type="monotone" 
                  dataKey="effectiveness" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Effectiveness (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Action Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {actionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Playbook Rules Management */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Response Playbooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playbooks.map((playbook) => (
              <div key={playbook.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={playbook.enabled}
                      onCheckedChange={() => togglePlaybook(playbook.id)}
                    />
                    <div>
                      <h4 className="font-medium">{playbook.name}</h4>
                      <p className="text-sm text-slate-400">{playbook.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-400">
                      {playbook.successRate.toFixed(1)}% success
                    </div>
                    <div className="text-xs text-slate-400">
                      {playbook.executionCount} executions
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Triggers:</span>
                    <div className="mt-1">
                      <div className="flex flex-wrap gap-1">
                        {playbook.triggers.threatTypes.map(type => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Min severity: {playbook.triggers.severityLevel} | 
                        Confidence: {(playbook.triggers.confidenceThreshold * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400">Actions ({playbook.actions.length}):</span>
                    <div className="mt-1 space-y-1">
                      {playbook.actions.slice(0, 3).map((action, index) => (
                        <div key={index} className="text-xs">
                          <Badge variant="outline" className="text-xs mr-1">
                            {action.priority}
                          </Badge>
                          {action.type.replace('_', ' ')}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400">Performance:</span>
                    <div className="mt-1">
                      <div className="text-xs">
                        Execution Time: {(playbook.actions.reduce((sum, a) => sum + a.timeout, 0) / 1000).toFixed(1)}s max
                      </div>
                      <Progress 
                        value={playbook.successRate} 
                        className="h-2 mt-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events and Responses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Recent Threat Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm mb-2">
                      <div className="font-medium text-orange-400 mb-1">
                        {event.threatType.toUpperCase()} Attack
                      </div>
                      <div className="text-slate-400">{event.description}</div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>From: <span className="text-red-400">{event.sourceIP}</span></span>
                      <span>To: <span className="text-blue-400">{event.targetIP}</span></span>
                      <span>Confidence: <span className="text-green-400">{(event.confidence * 100).toFixed(1)}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-400" />
              Automated Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {responses.slice(0, 10).map((response) => (
                  <div key={response.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(response.status)}>
                        {response.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(response.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm mb-2">
                      <div className="font-medium text-cyan-400 mb-1">
                        {response.actionType.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-slate-400">{response.details}</div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Time: <span className="text-blue-400">{(response.executionTime / 1000).toFixed(1)}s</span></span>
                      <span>Effectiveness: <span className="text-green-400">{(response.effectiveness * 100).toFixed(1)}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}