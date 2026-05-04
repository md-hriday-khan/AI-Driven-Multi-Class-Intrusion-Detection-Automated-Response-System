import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  FileText, Play, Pause, CheckCircle, AlertTriangle, Clock, Shield,
  Zap, Lock, Database, Activity, Settings, Target, Navigation,
  Radio, Wifi, Router, RotateCcw, Brain, MapPin, Satellite
} from 'lucide-react';

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  estimatedTime: number;
  actualTime?: number;
  isAutomated: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ResponsePlaybook {
  id: string;
  name: string;
  threatType: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: PlaybookStep[];
  isActive: boolean;
  totalEstimatedTime: number;
  successRate: number;
}

interface ThreatIntelligence {
  id: string;
  type: 'gps_spoofing' | 'jamming' | 'malware' | 'ddos' | 'hijacking' | 'mitm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  indicators: string[];
  impact_assessment: string;
  mitigation_priority: number;
}

interface SelfHealingAction {
  id: string;
  name: string;
  trigger: string;
  description: string;
  auto_execute: boolean;
  success_rate: number;
  execution_time: number;
  status: 'ready' | 'executing' | 'completed' | 'failed';
  last_executed?: Date;
}

interface GPSSpoofingDetection {
  id: string;
  timestamp: Date;
  detection_type: 'signal_inconsistency' | 'impossible_movement' | 'timing_attack' | 'false_almanac';
  confidence: number;
  affected_receivers: string[];
  spoofed_coordinates: { lat: number; lng: number };
  actual_coordinates: { lat: number; lng: number };
  deviation_distance: number;
  countermeasures_applied: string[];
}

const responsePlaybooks: ResponsePlaybook[] = [
  {
    id: 'gps-spoofing-response',
    name: 'GPS Spoofing Mitigation',
    threatType: 'GPS Spoofing Attack',
    description: 'Automated response to GPS signal manipulation and navigation compromise',
    icon: <Satellite className="h-5 w-5" />,
    color: 'bg-orange-500',
    totalEstimatedTime: 90,
    successRate: 94.7,
    isActive: false,
    steps: [
      {
        id: 'detect-gps-anomaly',
        title: 'GPS Signal Analysis',
        description: 'Detect signal inconsistencies and impossible movement patterns',
        status: 'pending',
        estimatedTime: 10,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'switch-backup-nav',
        title: 'Activate Backup Navigation',
        description: 'Switch to inertial navigation and visual odometry systems',
        status: 'pending',
        estimatedTime: 15,
        isAutomated: true,
        severity: 'critical'
      },
      {
        id: 'signal-validation',
        title: 'Multi-Source Validation',
        description: 'Cross-reference position with multiple navigation sources',
        status: 'pending',
        estimatedTime: 20,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'countermeasure-deploy',
        title: 'Deploy Anti-Spoofing',
        description: 'Activate GPS anti-spoofing algorithms and filters',
        status: 'pending',
        estimatedTime: 30,
        isAutomated: true,
        severity: 'medium'
      },
      {
        id: 'alert-operator',
        title: 'Operator Notification',
        description: 'Alert human operator of navigation compromise',
        status: 'pending',
        estimatedTime: 15,
        isAutomated: true,
        severity: 'medium'
      }
    ]
  },
  {
    id: 'communication-jamming',
    name: 'Communication Jamming Response',
    threatType: 'RF Jamming Attack',
    description: 'Automated response to communication jamming and signal interference',
    icon: <Radio className="h-5 w-5" />,
    color: 'bg-yellow-500',
    totalEstimatedTime: 120,
    successRate: 91.3,
    isActive: false,
    steps: [
      {
        id: 'detect-jamming',
        title: 'Jamming Detection',
        description: 'Analyze signal strength and noise patterns for jamming signatures',
        status: 'pending',
        estimatedTime: 15,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'frequency-hop',
        title: 'Frequency Hopping',
        description: 'Switch to alternative communication frequencies',
        status: 'pending',
        estimatedTime: 20,
        isAutomated: true,
        severity: 'critical'
      },
      {
        id: 'redundant-channels',
        title: 'Activate Redundant Channels',
        description: 'Enable backup communication channels and protocols',
        status: 'pending',
        estimatedTime: 25,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'adaptive-power',
        title: 'Adaptive Power Control',
        description: 'Increase transmission power to overcome interference',
        status: 'pending',
        estimatedTime: 30,
        isAutomated: true,
        severity: 'medium'
      },
      {
        id: 'mesh-network',
        title: 'Mesh Network Fallback',
        description: 'Switch to mesh network communication with peer nodes',
        status: 'pending',
        estimatedTime: 30,
        isAutomated: true,
        severity: 'medium'
      }
    ]
  },
  {
    id: 'ddos-response',
    name: 'DDoS Mitigation',
    threatType: 'DDoS Attack',
    description: 'Automated response to distributed denial of service attacks',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-red-500',
    totalEstimatedTime: 180,
    successRate: 97.8,
    isActive: false,
    steps: [
      {
        id: 'detect-ddos',
        title: 'Threat Detection Confirmation',
        description: 'Validate DDoS attack pattern and source IPs',
        status: 'pending',
        estimatedTime: 15,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'rate-limit',
        title: 'Enable Rate Limiting',
        description: 'Activate aggressive rate limiting rules',
        status: 'pending',
        estimatedTime: 30,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'block-ips',
        title: 'Block Malicious IPs',
        description: 'Add attacking IP addresses to blocklist',
        status: 'pending',
        estimatedTime: 45,
        isAutomated: true,
        severity: 'critical'
      },
      {
        id: 'cdn-shield',
        title: 'Activate CDN Shield',
        description: 'Enable enhanced CDN protection mechanisms',
        status: 'pending',
        estimatedTime: 60,
        isAutomated: true,
        severity: 'medium'
      },
      {
        id: 'notify-team',
        title: 'Notify Security Team',
        description: 'Send alerts to on-call security personnel',
        status: 'pending',
        estimatedTime: 30,
        isAutomated: true,
        severity: 'medium'
      }
    ]
  },
  {
    id: 'uav-hijacking-response',
    name: 'UAV Hijacking Countermeasures',
    threatType: 'UAV Control Hijacking',
    description: 'Automated response to unauthorized UAV control takeover attempts',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-red-600',
    totalEstimatedTime: 150,
    successRate: 89.2,
    isActive: false,
    steps: [
      {
        id: 'detect-unauthorized',
        title: 'Unauthorized Command Detection',
        description: 'Identify suspicious control commands and authentication failures',
        status: 'pending',
        estimatedTime: 20,
        isAutomated: true,
        severity: 'critical'
      },
      {
        id: 'isolate-control',
        title: 'Isolate Control Channel',
        description: 'Disconnect compromised control channels immediately',
        status: 'pending',
        estimatedTime: 10,
        isAutomated: true,
        severity: 'critical'
      },
      {
        id: 'autonomous-mode',
        title: 'Switch to Autonomous Mode',
        description: 'Activate autonomous flight mode with predefined safe protocols',
        status: 'pending',
        estimatedTime: 30,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'safe-landing',
        title: 'Initiate Safe Landing',
        description: 'Execute controlled landing at nearest safe location',
        status: 'pending',
        estimatedTime: 60,
        isAutomated: true,
        severity: 'high'
      },
      {
        id: 'forensic-capture',
        title: 'Forensic Data Capture',
        description: 'Capture attack vectors and command sequences for analysis',
        status: 'pending',
        estimatedTime: 30,
        isAutomated: true,
        severity: 'medium'
      }
    ]
  }
];

const selfHealingActions: SelfHealingAction[] = [
  {
    id: 'reboot-subsystem',
    name: 'Subsystem Reboot',
    trigger: 'Communication failure detected',
    description: 'Automatically restart failed communication subsystem',
    auto_execute: true,
    success_rate: 87.3,
    execution_time: 45,
    status: 'ready'
  },
  {
    id: 'reroute-traffic',
    name: 'Traffic Rerouting',
    trigger: 'Network congestion threshold exceeded',
    description: 'Reroute network traffic through alternative channels',
    auto_execute: true,
    success_rate: 94.1,
    execution_time: 30,
    status: 'ready'
  },
  {
    id: 'backup-sensor',
    name: 'Backup Sensor Activation',
    trigger: 'Primary sensor malfunction',
    description: 'Switch to redundant sensor systems automatically',
    auto_execute: true,
    success_rate: 96.8,
    execution_time: 15,
    status: 'ready'
  },
  {
    id: 'memory-cleanup',
    name: 'Memory Cleanup',
    trigger: 'Memory usage above 90%',
    description: 'Free up system memory and optimize resource allocation',
    auto_execute: true,
    success_rate: 91.7,
    execution_time: 60,
    status: 'ready'
  }
];

const threatIntelligence: ThreatIntelligence[] = [
  {
    id: 'THREAT_001',
    type: 'gps_spoofing',
    severity: 'high',
    source: '192.168.1.100',
    target: 'UAV_FLEET_ALPHA',
    location: { lat: 40.7128, lng: -74.0060 },
    timestamp: new Date(),
    indicators: ['Signal timing anomaly', 'Impossible velocity detected', 'Multiple receiver disagreement'],
    impact_assessment: 'Navigation system compromise with potential for controlled crash',
    mitigation_priority: 9
  },
  {
    id: 'THREAT_002',
    type: 'jamming',
    severity: 'medium',
    source: 'Unknown RF source',
    target: 'COMM_CHANNEL_2.4GHZ',
    location: { lat: 40.7589, lng: -73.9851 },
    timestamp: new Date(),
    indicators: ['Signal-to-noise ratio degradation', 'Packet loss increase', 'Communication timeouts'],
    impact_assessment: 'Communication disruption affecting command and control',
    mitigation_priority: 7
  },
  {
    id: 'THREAT_003',
    type: 'hijacking',
    severity: 'critical',
    source: 'Unauthorized control station',
    target: 'UAV_003',
    location: { lat: 40.7282, lng: -74.0776 },
    timestamp: new Date(),
    indicators: ['Authentication bypass attempt', 'Unauthorized command injection', 'Control protocol violation'],
    impact_assessment: 'Complete loss of vehicle control with safety implications',
    mitigation_priority: 10
  }
];

export function ResponsePlaybook() {
  const [playbooks, setPlaybooks] = useState<ResponsePlaybook[]>(responsePlaybooks);
  const [activePlaybook, setActivePlaybook] = useState<string | null>(null);
  const [healingActions, setHealingActions] = useState<SelfHealingAction[]>(selfHealingActions);
  const [threats, setThreats] = useState<ThreatIntelligence[]>(threatIntelligence);
  const [gpsDetections, setGpsDetections] = useState<GPSSpoofingDetection[]>([]);
  const [autoExecutionEnabled, setAutoExecutionEnabled] = useState(true);

  useEffect(() => {
    // Simulate real-time threat intelligence updates
    const threatInterval = setInterval(() => {
      // Generate new GPS spoofing detection
      if (Math.random() > 0.8) {
        const detectionTypes: Array<'signal_inconsistency' | 'impossible_movement' | 'timing_attack' | 'false_almanac'> = 
          ['signal_inconsistency', 'impossible_movement', 'timing_attack', 'false_almanac'];
        
        const newDetection: GPSSpoofingDetection = {
          id: `GPS_DET_${Date.now()}`,
          timestamp: new Date(),
          detection_type: detectionTypes[Math.floor(Math.random() * detectionTypes.length)],
          confidence: 75 + Math.random() * 23,
          affected_receivers: [`GPS_RX_${Math.floor(Math.random() * 5) + 1}`],
          spoofed_coordinates: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1
          },
          actual_coordinates: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.01,
            lng: -74.0060 + (Math.random() - 0.5) * 0.01
          },
          deviation_distance: Math.random() * 500 + 50,
          countermeasures_applied: [
            'Switched to inertial navigation',
            'Activated GPS anti-spoofing filters',
            'Enabled multi-source position validation'
          ]
        };

        setGpsDetections(prev => [newDetection, ...prev.slice(0, 9)]);

        // Auto-trigger GPS spoofing playbook if enabled
        if (autoExecutionEnabled && newDetection.confidence > 85) {
          executePlaybook('gps-spoofing-response');
        }
      }

      // Update threat priorities and locations
      setThreats(prev => prev.map(threat => ({
        ...threat,
        mitigation_priority: Math.max(1, Math.min(10, threat.mitigation_priority + (Math.random() - 0.5) * 2)),
        timestamp: new Date()
      })));

      // Simulate self-healing actions
      setHealingActions(prev => prev.map(action => {
        if (action.auto_execute && Math.random() > 0.95 && action.status === 'ready') {
          return { ...action, status: 'executing', last_executed: new Date() };
        }
        if (action.status === 'executing') {
          return { ...action, status: 'completed' };
        }
        return action;
      }));
    }, 5000);

    return () => clearInterval(threatInterval);
  }, [autoExecutionEnabled]);

  useEffect(() => {
    // Simulate playbook execution
    if (activePlaybook) {
      const executeStep = () => {
        setPlaybooks(prev => prev.map(playbook => {
          if (playbook.id === activePlaybook) {
            const currentStepIndex = playbook.steps.findIndex(s => s.status === 'pending');
            if (currentStepIndex !== -1) {
              const updatedSteps = [...playbook.steps];
              updatedSteps[currentStepIndex] = {
                ...updatedSteps[currentStepIndex],
                status: 'running'
              };
              
              // Complete the step after estimated time
              setTimeout(() => {
                setPlaybooks(prev => prev.map(p => {
                  if (p.id === activePlaybook) {
                    const stepToComplete = [...p.steps];
                    stepToComplete[currentStepIndex] = {
                      ...stepToComplete[currentStepIndex],
                      status: 'completed',
                      actualTime: stepToComplete[currentStepIndex].estimatedTime + Math.random() * 10 - 5
                    };
                    
                    // Check if all steps are completed
                    if (stepToComplete.every(step => step.status === 'completed')) {
                      setActivePlaybook(null);
                      return { ...p, steps: stepToComplete, isActive: false };
                    }
                    
                    return { ...p, steps: stepToComplete };
                  }
                  return p;
                }));
              }, updatedSteps[currentStepIndex].estimatedTime * 100); // Speed up for demo

              return { ...playbook, steps: updatedSteps };
            }
          }
          return playbook;
        }));
      };

      const stepInterval = setInterval(executeStep, 2000);
      return () => clearInterval(stepInterval);
    }
  }, [activePlaybook]);

  const executePlaybook = (playbookId: string) => {
    if (activePlaybook) return; // Only one playbook at a time
    
    setPlaybooks(prev => prev.map(playbook => 
      playbook.id === playbookId 
        ? { ...playbook, isActive: true, steps: playbook.steps.map(step => ({ ...step, status: 'pending' as const })) }
        : playbook
    ));
    setActivePlaybook(playbookId);
  };

  const pausePlaybook = (playbookId: string) => {
    setActivePlaybook(null);
    setPlaybooks(prev => prev.map(playbook => 
      playbook.id === playbookId ? { ...playbook, isActive: false } : playbook
    ));
  };

  const resetPlaybook = (playbookId: string) => {
    setPlaybooks(prev => prev.map(playbook => 
      playbook.id === playbookId 
        ? { 
            ...playbook, 
            isActive: false, 
            steps: playbook.steps.map(step => ({ ...step, status: 'pending' as const, actualTime: undefined }))
          }
        : playbook
    ));
    if (activePlaybook === playbookId) {
      setActivePlaybook(null);
    }
  };

  const calculateProgress = (steps: PlaybookStep[]): number => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running': return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
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

  const getDetectionTypeIcon = (type: string) => {
    switch (type) {
      case 'signal_inconsistency': return <Radio className="h-4 w-4" />;
      case 'impossible_movement': return <Navigation className="h-4 w-4" />;
      case 'timing_attack': return <Clock className="h-4 w-4" />;
      case 'false_almanac': return <Satellite className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Response Playbook & Threat Intelligence</h2>
          <p className="text-gray-600">AI-driven response engine with automated threat mitigation and self-healing capabilities</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoExecutionEnabled} 
              onCheckedChange={setAutoExecutionEnabled}
            />
            <span className="text-sm text-gray-700">Auto-Execute</span>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            <Brain className="h-4 w-4 mr-2" />
            AI Enabled
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="playbooks" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="playbooks" className="text-gray-700">Response Playbooks</TabsTrigger>
          <TabsTrigger value="threat-map" className="text-gray-700">Threat Mapping</TabsTrigger>
          <TabsTrigger value="gps-detection" className="text-gray-700">GPS Spoofing Detection</TabsTrigger>
          <TabsTrigger value="self-healing" className="text-gray-700">Self-Healing</TabsTrigger>
          <TabsTrigger value="execution" className="text-gray-700">Active Execution</TabsTrigger>
        </TabsList>

        <TabsContent value="playbooks" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {playbooks.map(playbook => (
              <Card key={playbook.id} className="bg-white border-gray-300 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${playbook.color} p-3 rounded-lg text-white`}>
                        {playbook.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{playbook.name}</h3>
                        <p className="text-sm text-gray-600">{playbook.threatType}</p>
                      </div>
                    </div>
                    {playbook.isActive && (
                      <Badge className="bg-blue-500 text-white animate-pulse">
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{playbook.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Steps:</span>
                      <span className="ml-2 font-medium text-gray-900">{playbook.steps.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ETA:</span>
                      <span className="ml-2 font-medium text-gray-900">{Math.floor(playbook.totalEstimatedTime / 60)}m</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="ml-2 font-medium text-green-600">{playbook.successRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Automated:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {playbook.steps.filter(s => s.isAutomated).length}/{playbook.steps.length}
                      </span>
                    </div>
                  </div>

                  {playbook.isActive && (
                    <div>
                      <Progress value={calculateProgress(playbook.steps)} className="h-2 mb-2" />
                      <span className="text-xs text-gray-600">
                        {calculateProgress(playbook.steps).toFixed(0)}% Complete
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!playbook.isActive ? (
                      <Button
                        onClick={() => executePlaybook(playbook.id)}
                        size="sm"
                        className="flex-1"
                        disabled={!!activePlaybook}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                    ) : (
                      <Button
                        onClick={() => pausePlaybook(playbook.id)}
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => resetPlaybook(playbook.id)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="threat-map" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Active Threat Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threats.map((threat) => (
                    <div key={threat.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(threat.severity)}>
                            {threat.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-gray-900 capitalize">
                            {threat.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          Priority: {threat.mitigation_priority}/10
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Source:</span>
                          <span className="ml-2 text-gray-900 font-mono">{threat.source}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Target:</span>
                          <span className="ml-2 text-gray-900">{threat.target}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">
                            {threat.location.lat.toFixed(4)}, {threat.location.lng.toFixed(4)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Detected:</span>
                          <span className="ml-2 text-gray-900">{threat.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm mb-3">
                        <span className="text-gray-600 font-medium">Impact Assessment:</span>
                        <p className="text-gray-800 mt-1">{threat.impact_assessment}</p>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Indicators:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {threat.indicators.map((indicator, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {indicator}
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
                <CardTitle className="text-gray-900">Threat Distribution Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Interactive Threat Map</p>
                      <p className="text-sm text-gray-500">Real-time threat geolocation visualization</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {threats.filter(t => t.severity === 'critical').length}
                      </div>
                      <div className="text-sm text-red-700">Critical Threats</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {threats.filter(t => t.severity === 'high').length}
                      </div>
                      <div className="text-sm text-orange-700">High Threats</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {threats.filter(t => t.severity === 'medium').length}
                      </div>
                      <div className="text-sm text-yellow-700">Medium Threats</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {threats.filter(t => t.severity === 'low').length}
                      </div>
                      <div className="text-sm text-green-700">Low Threats</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gps-detection" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">GPS Spoofing Detection & Response</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {gpsDetections.map((detection) => (
                    <div key={detection.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getDetectionTypeIcon(detection.detection_type)}
                          <span className="font-medium text-gray-900 capitalize">
                            {detection.detection_type.replace('_', ' ')}
                          </span>
                          <Badge className={detection.confidence > 90 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {detection.confidence.toFixed(1)}% confidence
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-600">
                          {detection.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Affected Receivers:</span>
                          <div className="mt-1">
                            {detection.affected_receivers.map(receiver => (
                              <Badge key={receiver} variant="outline" className="text-xs mr-1">
                                {receiver}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Deviation Distance:</span>
                          <span className="ml-2 text-gray-900">{detection.deviation_distance.toFixed(1)}m</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Spoofed Position:</span>
                          <div className="text-gray-900 font-mono text-xs">
                            {detection.spoofed_coordinates.lat.toFixed(6)}, {detection.spoofed_coordinates.lng.toFixed(6)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Actual Position:</span>
                          <div className="text-gray-900 font-mono text-xs">
                            {detection.actual_coordinates.lat.toFixed(6)}, {detection.actual_coordinates.lng.toFixed(6)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Countermeasures Applied:</span>
                        <div className="mt-1 space-y-1">
                          {detection.countermeasures_applied.map((measure, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-green-800 text-xs">{measure}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {gpsDetections.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Satellite className="h-8 w-8 mx-auto mb-2" />
                      <p>No GPS spoofing detections. System monitoring normally.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="self-healing" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Self-Healing Mechanisms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healingActions.map((action) => (
                    <div key={action.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{action.name}</h4>
                        <Badge className={
                          action.status === 'executing' ? 'bg-blue-500 text-white' :
                          action.status === 'completed' ? 'bg-green-500 text-white' :
                          action.status === 'failed' ? 'bg-red-500 text-white' :
                          'bg-gray-500 text-white'
                        }>
                          {action.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Trigger:</span>
                          <div className="text-gray-900 text-xs mt-1">{action.trigger}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="ml-2 text-gray-900">{action.success_rate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Execution Time:</span>
                          <span className="ml-2 text-gray-900">{action.execution_time}s</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Auto Execute:</span>
                          <span className="ml-2 text-gray-900">{action.auto_execute ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      
                      {action.last_executed && (
                        <div className="text-sm text-gray-600">
                          Last executed: {action.last_executed.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Recovery Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Automatic Recovery Rate</span>
                      <span className="text-2xl font-bold text-green-600">94.7%</span>
                    </div>
                    <Progress value={94.7} className="h-2" />
                    <span className="text-xs text-green-700">Last 30 days</span>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Mean Recovery Time</span>
                      <span className="text-2xl font-bold text-blue-600">42s</span>
                    </div>
                    <div className="text-xs text-blue-700">Average time to restore service</div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Recovery Actions Triggered</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {healingActions.filter(a => a.last_executed).length}
                      </span>
                    </div>
                    <div className="text-xs text-purple-700">In the last 24 hours</div>
                  </div>
                  
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Self-healing systems are operating optimally. All automated recovery 
                      mechanisms are functioning within normal parameters.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="execution" className="mt-6">
          {activePlaybook ? (
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900">Active Playbook Execution</CardTitle>
                  <Badge className="bg-blue-500 text-white animate-pulse">
                    EXECUTING
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {playbooks
                  .filter(p => p.id === activePlaybook)
                  .map(playbook => (
                    <div key={playbook.id} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`${playbook.color} p-3 rounded-lg text-white`}>
                          {playbook.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{playbook.name}</h3>
                          <p className="text-gray-600">{playbook.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {calculateProgress(playbook.steps).toFixed(0)}%
                          </div>
                          <div className="text-sm text-gray-600">Complete</div>
                        </div>
                      </div>

                      <Progress value={calculateProgress(playbook.steps)} className="h-3" />

                      <div className="space-y-3">
                        {playbook.steps.map((step, index) => (
                          <div 
                            key={step.id}
                            className={`flex items-center gap-4 p-3 rounded-lg border ${
                              step.status === 'running' 
                                ? 'border-blue-500 bg-blue-50' 
                                : step.status === 'completed'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                                step.status === 'completed' ? 'bg-green-500 text-white' :
                                step.status === 'running' ? 'bg-blue-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              {getStepIcon(step.status)}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{step.title}</h4>
                              <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                            
                            <div className="text-right">
                              <Badge className={getSeverityColor(step.severity)} size="sm">
                                {step.severity}
                              </Badge>
                              <div className="text-xs text-gray-600 mt-1">
                                {step.estimatedTime}s est.
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-medium text-gray-900 mb-2">No Active Playbook</h3>
                <p className="text-gray-600">Select a playbook from the Response Playbooks tab to begin execution</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-8">
        Response Playbook & Threat Intelligence System - Created by Md.Hriday Khan
      </div>
    </div>
  );
}