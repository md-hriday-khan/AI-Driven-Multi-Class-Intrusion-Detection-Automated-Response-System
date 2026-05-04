import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Zap,
  Target,
  TrendingUp,
  RotateCw,
  Play,
  StopCircle
} from 'lucide-react';

interface ResponseAction {
  id: string;
  timestamp: number;
  action: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  duration: number; // in seconds
  effectiveness: number; // percentage
  details: string;
  targetSystem: string;
  autoExecuted: boolean;
}

interface SystemState {
  timestamp: number;
  state: 'normal' | 'elevated' | 'high_alert' | 'critical' | 'lockdown';
  reason: string;
  threatLevel: number;
}

interface ActionEffectiveness {
  action: string;
  successRate: number;
  avgDuration: number;
  totalExecutions: number;
}

export function ResponseActionsLog() {
  const [responseActions, setResponseActions] = useState<ResponseAction[]>([]);
  const [systemStates, setSystemStates] = useState<SystemState[]>([]);
  const [actionEffectiveness, setActionEffectiveness] = useState<ActionEffectiveness[]>([
    { action: 'Block IP Address', successRate: 98.2, avgDuration: 2.3, totalExecutions: 145 },
    { action: 'Rate Limiting', successRate: 94.7, avgDuration: 5.1, totalExecutions: 89 },
    { action: 'Isolate Host', successRate: 96.8, avgDuration: 12.4, totalExecutions: 67 },
    { action: 'Deploy Countermeasures', successRate: 91.3, avgDuration: 18.7, totalExecutions: 34 },
    { action: 'Emergency Shutdown', successRate: 99.1, avgDuration: 45.2, totalExecutions: 12 },
    { action: 'Activate Backup Systems', successRate: 87.9, avgDuration: 120.5, totalExecutions: 23 }
  ]);

  const [liveMetrics, setLiveMetrics] = useState({
    activeResponses: 3,
    totalToday: 47,
    successRate: 94.2,
    avgResponseTime: 8.7,
    systemState: 'elevated' as 'normal' | 'elevated' | 'high_alert' | 'critical' | 'lockdown'
  });

  const [filter, setFilter] = useState<'all' | 'automated' | 'manual'>('all');

  useEffect(() => {
    // Initialize historical data
    const now = Date.now();
    const initialActions: ResponseAction[] = [];
    const initialStates: SystemState[] = [];

    const actionTypes = [
      'Block IP Address', 'Rate Limiting', 'Isolate Host', 'Deploy Countermeasures',
      'Emergency Shutdown', 'Activate Backup Systems', 'Update Firewall Rules',
      'Quarantine File', 'Reset User Credentials', 'Enable MFA'
    ];
    
    const threatTypes = ['DDoS', 'Malware', 'Brute Force', 'Botnet', 'Zero-day', 'Exfiltration'];
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const statuses: Array<'initiated' | 'in_progress' | 'completed' | 'failed' | 'timeout'> = 
      ['initiated', 'in_progress', 'completed', 'failed', 'timeout'];
    const systems = ['Web Server', 'Database', 'API Gateway', 'Load Balancer', 'Security Gateway'];

    // Generate response actions
    for (let i = 0; i < 50; i++) {
      const timestamp = now - (Math.random() * 24 * 60 * 60 * 1000); // Last 24 hours
      initialActions.push({
        id: `action-${i}`,
        timestamp,
        action: actionTypes[Math.floor(Math.random() * actionTypes.length)],
        threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        duration: Math.random() * 120 + 5, // 5-125 seconds
        effectiveness: 70 + Math.random() * 30, // 70-100%
        details: `Automated response to detected threat from suspicious source`,
        targetSystem: systems[Math.floor(Math.random() * systems.length)],
        autoExecuted: Math.random() > 0.3
      });
    }

    // Generate system states
    const stateTypes: Array<'normal' | 'elevated' | 'high_alert' | 'critical' | 'lockdown'> = 
      ['normal', 'elevated', 'high_alert', 'critical', 'lockdown'];
    
    for (let i = 60; i >= 0; i--) {
      initialStates.push({
        timestamp: now - (i * 600000), // 10 minute intervals
        state: stateTypes[Math.floor(Math.random() * stateTypes.length)],
        reason: 'Automated state transition based on threat assessment',
        threatLevel: Math.random() * 100
      });
    }

    setResponseActions(initialActions.sort((a, b) => b.timestamp - a.timestamp));
    setSystemStates(initialStates);

    // Real-time updates
    const interval = setInterval(() => {
      // Add new response actions occasionally
      if (Math.random() > 0.8) {
        const newAction: ResponseAction = {
          id: `action-${Date.now()}`,
          timestamp: Date.now(),
          action: actionTypes[Math.floor(Math.random() * actionTypes.length)],
          threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          status: 'initiated',
          duration: 0,
          effectiveness: 0,
          details: `Real-time response to active threat detection`,
          targetSystem: systems[Math.floor(Math.random() * systems.length)],
          autoExecuted: Math.random() > 0.2
        };

        setResponseActions(prev => [newAction, ...prev.slice(0, 49)]);
        setLiveMetrics(prev => ({ 
          ...prev, 
          totalToday: prev.totalToday + 1,
          activeResponses: prev.activeResponses + 1
        }));
      }

      // Update action statuses
      setResponseActions(prev => prev.map(action => {
        if (action.status === 'initiated' && Math.random() > 0.7) {
          return { ...action, status: 'in_progress' };
        }
        if (action.status === 'in_progress' && Math.random() > 0.6) {
          const completed = Math.random() > 0.1; // 90% success rate
          return { 
            ...action, 
            status: completed ? 'completed' : 'failed',
            duration: Math.random() * 60 + 5,
            effectiveness: completed ? 80 + Math.random() * 20 : Math.random() * 30
          };
        }
        return action;
      }));

      // Update live metrics
      setLiveMetrics(prev => ({
        ...prev,
        successRate: Math.max(85, Math.min(99, prev.successRate + (Math.random() - 0.5) * 2)),
        avgResponseTime: Math.max(3, Math.min(20, prev.avgResponseTime + (Math.random() - 0.5) * 2)),
        activeResponses: Math.max(0, prev.activeResponses + Math.floor((Math.random() - 0.7) * 3))
      }));

      // Add new system state
      if (Math.random() > 0.9) {
        const newState: SystemState = {
          timestamp: Date.now(),
          state: stateTypes[Math.floor(Math.random() * stateTypes.length)],
          reason: 'Automated state transition based on current threat assessment',
          threatLevel: Math.random() * 100
        };

        setSystemStates(prev => [newState, ...prev.slice(0, 59)]);
        setLiveMetrics(prev => ({ ...prev, systemState: newState.state }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500 animate-pulse';
      case 'initiated': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'timeout': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSystemStateColor = (state: string) => {
    switch (state) {
      case 'normal': return 'bg-green-500';
      case 'elevated': return 'bg-yellow-500';
      case 'high_alert': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      case 'lockdown': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <RotateCw className="h-4 w-4 animate-spin" />;
      case 'initiated': return <Play className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'timeout': return <Clock className="h-4 w-4" />;
      default: return <StopCircle className="h-4 w-4" />;
    }
  };

  const filteredActions = responseActions.filter(action => {
    if (filter === 'automated') return action.autoExecuted;
    if (filter === 'manual') return !action.autoExecuted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Live Response Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Responses</CardTitle>
            <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {liveMetrics.activeResponses}
            </div>
            <p className="text-xs text-slate-400">currently executing</p>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                Live
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {liveMetrics.successRate.toFixed(1)}%
            </div>
            <Progress value={liveMetrics.successRate} className="mt-2 h-2" />
            <p className="text-xs text-slate-400 mt-1">
              {liveMetrics.totalToday} actions today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {liveMetrics.avgResponseTime.toFixed(1)}s
            </div>
            <p className="text-xs text-slate-400">from detection to action</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">15% faster than yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System State</CardTitle>
            <Shield className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">
              {liveMetrics.systemState.replace('_', ' ')}
            </div>
            <Badge 
              variant="secondary" 
              className={`${getSystemStateColor(liveMetrics.systemState)} text-white mt-2`}
            >
              {liveMetrics.systemState.toUpperCase().replace('_', ' ')}
            </Badge>
            <p className="text-xs text-slate-400 mt-1">security posture</p>
          </CardContent>
        </Card>
      </div>

      {/* Response Actions and System State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Response Activity */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Response Activity</CardTitle>
                <div className="flex gap-2">
                  {['all', 'automated', 'manual'].map((filterType) => (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterType as any)}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredActions.slice(0, 20).map((action) => (
                    <div 
                      key={action.id}
                      className={`p-4 rounded-lg border transition-all ${
                        action.status === 'in_progress' 
                          ? 'border-blue-500 bg-blue-500/10 shadow-lg' 
                          : 'border-slate-700 bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(action.status)} text-white`}>
                            {getStatusIcon(action.status)}
                          </div>
                          <div>
                            <h4 className="font-medium">{action.action}</h4>
                            <p className="text-sm text-slate-400">{action.details}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={getSeverityColor(action.severity)}
                          >
                            {action.severity.toUpperCase()}
                          </Badge>
                          {action.autoExecuted && (
                            <Badge variant="secondary" className="bg-blue-500">
                              AUTO
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Threat:</span>
                          <div className="font-medium">{action.threatType}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Target:</span>
                          <div className="font-medium">{action.targetSystem}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Duration:</span>
                          <div className="font-medium">
                            {action.duration > 0 ? `${action.duration.toFixed(1)}s` : 'In progress...'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Effectiveness:</span>
                          <div className="font-medium">
                            {action.effectiveness > 0 ? `${action.effectiveness.toFixed(1)}%` : 'Pending...'}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
                        <span>{new Date(action.timestamp).toLocaleString()}</span>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(action.status)}
                        >
                          {action.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {action.status === 'completed' && action.effectiveness > 0 && (
                        <div className="mt-2">
                          <Progress value={action.effectiveness} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* System State Transitions */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>System State Transitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStates.slice(0, 8).map((state, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getSystemStateColor(state.state)}`} />
                    <div>
                      <div className="font-medium capitalize">
                        {state.state.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-slate-400">
                        Threat: {state.threatLevel.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTimestamp(state.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Effectiveness Analysis */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Action Effectiveness Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionEffectiveness}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="action" 
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'successRate' ? `${value.toFixed(1)}%` : 
                    name === 'avgDuration' ? `${value.toFixed(1)}s` : value,
                    name === 'successRate' ? 'Success Rate' :
                    name === 'avgDuration' ? 'Avg Duration' : 'Total Executions'
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="successRate" fill="#10B981" name="successRate" />
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {actionEffectiveness.map((action, index) => (
                <div key={index} className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{action.action}</h4>
                    <Badge variant="secondary" className="bg-green-500">
                      {action.successRate.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Executions:</span>
                      <div className="font-medium">{action.totalExecutions}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Avg Duration:</span>
                      <div className="font-medium">{action.avgDuration.toFixed(1)}s</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Success Rate:</span>
                      <div className="font-medium text-green-400">{action.successRate.toFixed(1)}%</div>
                    </div>
                  </div>

                  <Progress value={action.successRate} className="mt-2 h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}