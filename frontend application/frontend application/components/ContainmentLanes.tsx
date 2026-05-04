import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, Zap, Power, Network, Lock, AlertTriangle, CheckCircle, 
  XCircle, Clock, Settings, Database, Router, Server, Smartphone,
  Eye, Activity, Brain, FileImage, RefreshCw, PlayCircle, StopCircle
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ContainmentLane {
  id: string;
  name: string;
  type: 'software_kill_switch' | 'network_cutoff' | 'safe_stop_actuators' | 'system_isolation' | 'privilege_revocation';
  status: 'active' | 'standby' | 'triggered' | 'maintenance';
  assets: string[];
  triggerConditions: string[];
  lastActivation?: Date;
  activationCount: number;
  automationLevel: 'automatic' | 'semi_automatic' | 'manual';
  safetyLevel: 'critical' | 'high' | 'medium' | 'low';
  responseTime: number; // in milliseconds
}

interface ImmutableImage {
  id: string;
  name: string;
  version: string;
  type: 'os_baseline' | 'application_stack' | 'security_config' | 'firmware';
  size: number; // in MB
  checksum: string;
  creationDate: Date;
  lastVerified: Date;
  integrityStatus: 'verified' | 'corrupted' | 'unknown';
  deploymentTarget: string[];
  rollbackCapable: boolean;
}

interface RollbackOperation {
  id: string;
  targetSystem: string;
  sourceImage: string;
  targetImage: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rollback_needed';
  startTime: Date;
  completionTime?: Date;
  triggeredBy: 'security_event' | 'integrity_failure' | 'manual_request' | 'compliance_violation';
  rollbackReason: string;
  automatedRollback: boolean;
}

interface ContainmentAction {
  id: string;
  laneId: string;
  action: string;
  target: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executionTime: Date;
  duration?: number;
  result?: string;
  humanApproval: boolean;
  rollbackPossible: boolean;
}

const ContainmentLanes: React.FC = () => {
  const [containmentLanes, setContainmentLanes] = useState<ContainmentLane[]>([]);
  const [immutableImages, setImmutableImages] = useState<ImmutableImage[]>([]);
  const [rollbackOperations, setRollbackOperations] = useState<RollbackOperation[]>([]);
  const [containmentActions, setContainmentActions] = useState<ContainmentAction[]>([]);
  const [selectedLane, setSelectedLane] = useState<ContainmentLane | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // Mock data generation
  useEffect(() => {
    const mockLanes: ContainmentLane[] = [
      {
        id: 'lane-001',
        name: 'Critical System Kill Switch',
        type: 'software_kill_switch',
        status: 'standby',
        assets: ['SRV-PROD-001', 'SRV-PROD-002', 'DB-CLUSTER-01'],
        triggerConditions: ['Malware detected', 'Unauthorized access', 'Data exfiltration attempt'],
        activationCount: 3,
        automationLevel: 'automatic',
        safetyLevel: 'critical',
        responseTime: 150,
        lastActivation: new Date(Date.now() - 72 * 60 * 60 * 1000)
      },
      {
        id: 'lane-002',
        name: 'Network Isolation Perimeter',
        type: 'network_cutoff',
        status: 'active',
        assets: ['VLAN-100', 'VLAN-200', 'DMZ-SEGMENT'],
        triggerConditions: ['Lateral movement detected', 'Suspicious traffic patterns', 'C2 communication'],
        activationCount: 12,
        automationLevel: 'semi_automatic',
        safetyLevel: 'high',
        responseTime: 300,
        lastActivation: new Date(Date.now() - 10 * 60 * 1000)
      },
      {
        id: 'lane-003',
        name: 'Industrial Control Safe-Stop',
        type: 'safe_stop_actuators',
        status: 'standby',
        assets: ['PLC-001', 'PLC-002', 'SCADA-MAIN'],
        triggerConditions: ['Safety system compromise', 'Abnormal sensor readings', 'Communication loss'],
        activationCount: 0,
        automationLevel: 'manual',
        safetyLevel: 'critical',
        responseTime: 500
      },
      {
        id: 'lane-004',
        name: 'Endpoint Quarantine Zone',
        type: 'system_isolation',
        status: 'triggered',
        assets: ['WS-EXEC-001', 'LAPTOP-DEV-005'],
        triggerConditions: ['Malware infection', 'Policy violation', 'Behavioral anomaly'],
        activationCount: 8,
        automationLevel: 'automatic',
        safetyLevel: 'medium',
        responseTime: 200,
        lastActivation: new Date(Date.now() - 5 * 60 * 1000)
      }
    ];

    const mockImages: ImmutableImage[] = [
      {
        id: 'img-001',
        name: 'Windows Server 2022 Baseline',
        version: '1.0.3',
        type: 'os_baseline',
        size: 4096,
        checksum: 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        creationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastVerified: new Date(Date.now() - 60 * 60 * 1000),
        integrityStatus: 'verified',
        deploymentTarget: ['SRV-PROD-001', 'SRV-PROD-002'],
        rollbackCapable: true
      },
      {
        id: 'img-002',
        name: 'Security Configuration Bundle',
        version: '2.1.5',
        type: 'security_config',
        size: 512,
        checksum: 'sha256:b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastVerified: new Date(Date.now() - 30 * 60 * 1000),
        integrityStatus: 'verified',
        deploymentTarget: ['ALL_ENDPOINTS'],
        rollbackCapable: true
      },
      {
        id: 'img-003',
        name: 'PLC Firmware v3.2',
        version: '3.2.1',
        type: 'firmware',
        size: 128,
        checksum: 'sha256:c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
        creationDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastVerified: new Date(Date.now() - 2 * 60 * 60 * 1000),
        integrityStatus: 'corrupted',
        deploymentTarget: ['PLC-001', 'PLC-002'],
        rollbackCapable: true
      }
    ];

    const mockRollbacks: RollbackOperation[] = [
      {
        id: 'rollback-001',
        targetSystem: 'LAPTOP-DEV-005',
        sourceImage: 'img-002',
        targetImage: 'img-002-previous',
        status: 'completed',
        startTime: new Date(Date.now() - 15 * 60 * 1000),
        completionTime: new Date(Date.now() - 10 * 60 * 1000),
        triggeredBy: 'security_event',
        rollbackReason: 'Malware infection detected, rolling back to clean state',
        automatedRollback: true
      },
      {
        id: 'rollback-002',
        targetSystem: 'PLC-001',
        sourceImage: 'img-003',
        targetImage: 'img-003-previous',
        status: 'in_progress',
        startTime: new Date(Date.now() - 5 * 60 * 1000),
        triggeredBy: 'integrity_failure',
        rollbackReason: 'Firmware corruption detected',
        automatedRollback: true
      }
    ];

    const mockActions: ContainmentAction[] = [
      {
        id: 'action-001',
        laneId: 'lane-002',
        action: 'Isolate network segment VLAN-100',
        target: 'VLAN-100',
        status: 'completed',
        executionTime: new Date(Date.now() - 10 * 60 * 1000),
        duration: 2500,
        result: 'Network segment successfully isolated, 15 hosts affected',
        humanApproval: false,
        rollbackPossible: true
      },
      {
        id: 'action-002',
        laneId: 'lane-004',
        action: 'Quarantine endpoint WS-EXEC-001',
        target: 'WS-EXEC-001',
        status: 'executing',
        executionTime: new Date(Date.now() - 2 * 60 * 1000),
        humanApproval: false,
        rollbackPossible: true
      }
    ];

    setContainmentLanes(mockLanes);
    setImmutableImages(mockImages);
    setRollbackOperations(mockRollbacks);
    setContainmentActions(mockActions);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'standby': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'triggered': return 'text-red-600 bg-red-50 border-red-200';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSafetyLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getContainmentIcon = (type: string) => {
    switch (type) {
      case 'software_kill_switch': return <Power className="h-5 w-5" />;
      case 'network_cutoff': return <Network className="h-5 w-5" />;
      case 'safe_stop_actuators': return <StopCircle className="h-5 w-5" />;
      case 'system_isolation': return <Lock className="h-5 w-5" />;
      case 'privilege_revocation': return <Shield className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const containmentMetrics = [
    { name: 'Active Lanes', value: containmentLanes.filter(l => l.status === 'active' || l.status === 'triggered').length },
    { name: 'Avg Response Time', value: `${Math.round(containmentLanes.reduce((sum, l) => sum + l.responseTime, 0) / containmentLanes.length)}ms` },
    { name: 'Total Activations', value: containmentLanes.reduce((sum, l) => sum + l.activationCount, 0) },
    { name: 'Rollback Operations', value: rollbackOperations.filter(r => r.status === 'in_progress' || r.status === 'pending').length }
  ];

  const activationTrendData = [
    { hour: '00:00', activations: 2, rollbacks: 0 },
    { hour: '04:00', activations: 1, rollbacks: 1 },
    { hour: '08:00', activations: 5, rollbacks: 2 },
    { hour: '12:00', activations: 3, rollbacks: 0 },
    { hour: '16:00', activations: 7, rollbacks: 3 },
    { hour: '20:00', activations: 4, rollbacks: 1 }
  ];

  const handleEmergencyActivation = (laneId: string) => {
    setContainmentLanes(prev => prev.map(lane => 
      lane.id === laneId 
        ? { ...lane, status: 'triggered', lastActivation: new Date(), activationCount: lane.activationCount + 1 }
        : lane
    ));
  };

  const handleRollbackAction = (imageId: string) => {
    const newRollback: RollbackOperation = {
      id: `rollback-${Date.now()}`,
      targetSystem: 'SELECTED_SYSTEM',
      sourceImage: imageId,
      targetImage: `${imageId}-current`,
      status: 'pending',
      startTime: new Date(),
      triggeredBy: 'manual_request',
      rollbackReason: 'Manual rollback requested from UI',
      automatedRollback: false
    };
    setRollbackOperations(prev => [newRollback, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Containment Lanes & Immutable Systems
          </h2>
          <p className="text-slate-600 mt-2">Automated isolation channels, kill-switches, and fast rollback capabilities</p>
          <p className="text-xs text-slate-500 mt-1">Created by Md.Hriday Khan</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setEmergencyMode(!emergencyMode)}
            variant={emergencyMode ? 'destructive' : 'outline'}
            className={emergencyMode ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50'}
          >
            {emergencyMode ? (
              <>
                <StopCircle className="h-4 w-4 mr-2" />
                Exit Emergency
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Emergency Mode Alert */}
      {emergencyMode && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-800">Emergency Mode Active</span>
              <span className="text-sm text-red-600">All containment lanes ready for immediate activation</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {containmentMetrics.map((metric, index) => (
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
      <Tabs defaultValue="containment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="containment">Containment Lanes</TabsTrigger>
          <TabsTrigger value="immutable">Immutable Images</TabsTrigger>
          <TabsTrigger value="rollback">Rollback Operations</TabsTrigger>
          <TabsTrigger value="actions">Active Actions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="containment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Containment Lanes */}
            <div className="lg:col-span-2">
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Automated Isolation Channels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {containmentLanes.map((lane) => (
                        <div 
                          key={lane.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedLane?.id === lane.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedLane(lane)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg">
                                {getContainmentIcon(lane.type)}
                              </div>
                              <div>
                                <p className="font-medium">{lane.name}</p>
                                <p className="text-sm text-slate-600 capitalize">{lane.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge className={getStatusColor(lane.status)}>
                                {lane.status.toUpperCase()}
                              </Badge>
                              <Badge className={getSafetyLevelColor(lane.safetyLevel)}>
                                {lane.safetyLevel.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <span className="text-slate-500">Assets:</span>
                              <span className="ml-2 font-medium">{lane.assets.length}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Response Time:</span>
                              <span className="ml-2 font-medium">{lane.responseTime}ms</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Automation:</span>
                              <span className="ml-2 font-medium capitalize">{lane.automationLevel.replace('_', ' ')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Activations:</span>
                              <span className="ml-2 font-medium">{lane.activationCount}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                              {lane.lastActivation ? `Last: ${lane.lastActivation.toLocaleString()}` : 'Never activated'}
                            </div>
                            {(emergencyMode || lane.automationLevel === 'manual') && (
                              <Button 
                                size="sm" 
                                variant={lane.status === 'triggered' ? 'outline' : 'destructive'}
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEmergencyActivation(lane.id);
                                }}
                                disabled={lane.status === 'maintenance'}
                              >
                                {lane.status === 'triggered' ? 'Active' : 'Activate'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Lane Details */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Lane Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedLane ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Trigger Conditions</h4>
                      <div className="space-y-1">
                        {selectedLane.triggerConditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>{condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Protected Assets</h4>
                      <div className="space-y-1">
                        {selectedLane.assets.map((asset, index) => (
                          <Badge key={index} variant="secondary" className="mr-2 mb-1">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Lane Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Response Time:</span>
                          <span className="font-medium">{selectedLane.responseTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Automation Level:</span>
                          <span className="font-medium capitalize">{selectedLane.automationLevel.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Safety Level:</span>
                          <Badge className={getSafetyLevelColor(selectedLane.safetyLevel)}>
                            {selectedLane.safetyLevel.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a containment lane</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="immutable" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileImage className="h-5 w-5 text-purple-600" />
                Immutable System Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {immutableImages.map((image) => (
                  <div key={image.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <FileImage className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{image.name}</p>
                          <p className="text-sm text-slate-600">Version {image.version} • {image.size}MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={image.integrityStatus === 'verified' ? 'default' : 'destructive'}
                          className={image.integrityStatus === 'verified' ? 'bg-green-600' : ''}
                        >
                          {image.integrityStatus.toUpperCase()}
                        </Badge>
                        {image.rollbackCapable && (
                          <Badge variant="outline">
                            Rollback Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <span className="ml-2 font-medium capitalize">{image.type.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Targets:</span>
                        <span className="ml-2 font-medium">{image.deploymentTarget.length} systems</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Created:</span>
                        <span className="ml-2 font-medium">{image.creationDate.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Last Verified:</span>
                        <span className="ml-2 font-medium">{image.lastVerified.toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-slate-500 font-mono bg-gray-100 p-2 rounded">
                        {image.checksum}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {image.deploymentTarget.slice(0, 3).map((target, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {target}
                          </Badge>
                        ))}
                        {image.deploymentTarget.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{image.deploymentTarget.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-6 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                        {image.rollbackCapable && (
                          <Button 
                            size="sm" 
                            className="h-6 text-xs bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleRollbackAction(image.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rollback" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                Fast Automated Rollback Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rollbackOperations.map((rollback) => (
                  <div key={rollback.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">Rollback: {rollback.targetSystem}</p>
                        <p className="text-sm text-slate-600">
                          {rollback.sourceImage} → {rollback.targetImage}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rollback.automatedRollback && (
                          <Badge variant="outline" className="text-xs">
                            Automated
                          </Badge>
                        )}
                        <Badge 
                          variant={rollback.status === 'completed' ? 'default' : 
                                  rollback.status === 'failed' ? 'destructive' : 'secondary'}
                          className={rollback.status === 'completed' ? 'bg-green-600' : ''}
                        >
                          {rollback.status.toUpperCase().replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-2">{rollback.rollbackReason}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span>Triggered by: {rollback.triggeredBy.replace('_', ' ')}</span>
                        <span>Started: {rollback.startTime.toLocaleTimeString()}</span>
                      </div>
                      {rollback.completionTime && (
                        <span>Completed: {rollback.completionTime.toLocaleTimeString()}</span>
                      )}
                    </div>

                    {rollback.status === 'in_progress' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Rollback Progress</span>
                          <span>65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Active Containment Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {containmentActions.map((action) => (
                  <div key={action.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{action.action}</p>
                        <p className="text-sm text-slate-600">Target: {action.target}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.humanApproval && (
                          <Badge variant="outline" className="text-xs">
                            Human Approved
                          </Badge>
                        )}
                        <Badge 
                          variant={action.status === 'completed' ? 'default' : 
                                  action.status === 'failed' ? 'destructive' : 'secondary'}
                          className={action.status === 'completed' ? 'bg-green-600' : ''}
                        >
                          {action.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    {action.result && (
                      <p className="text-sm text-slate-700 mb-2">{action.result}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Executed: {action.executionTime.toLocaleTimeString()}</span>
                      {action.duration && (
                        <span>Duration: {action.duration}ms</span>
                      )}
                      {action.rollbackPossible && (
                        <Button size="sm" variant="outline" className="h-6 text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Rollback
                        </Button>
                      )}
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
              <CardTitle className="text-lg">Containment & Rollback Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="activations" 
                    stackId="1" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rollbacks" 
                    stackId="1" 
                    stroke="#06b6d4" 
                    fill="#06b6d4" 
                    fillOpacity={0.6} 
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

export default ContainmentLanes;