import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { 
  Database, Brain, Shield, AlertTriangle, Activity, Target,
  Download, Upload, Settings, Monitor, BarChart3, Zap,
  Clock, Users, Network, Eye, Lock, CheckCircle, Play
} from 'lucide-react';

interface DatasetSample {
  id: string;
  timestamp: Date;
  uav_id: string;
  attack_type: 'normal' | 'mitm' | 'gps_spoofing' | 'dos' | 'jamming' | 'hijacking';
  telemetry: {
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: { x: number; y: number; z: number };
    battery: number;
    signal_strength: number;
  };
  network_features: {
    packet_size: number;
    inter_arrival_time: number;
    protocol: string;
    port: number;
    flag_count: number;
  };
  labels: {
    is_attack: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };
}

interface MLModel {
  id: string;
  name: string;
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_samples: number;
  status: 'training' | 'ready' | 'deployed' | 'updating';
  last_trained: Date;
}

interface SimulatedAttack {
  id: string;
  name: string;
  attack_type: 'mitm' | 'gps_spoofing' | 'dos' | 'jamming' | 'hijacking';
  description: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  target_protocol: string;
  samples_generated: number;
  status: 'ready' | 'running' | 'completed';
}

interface TestbedMetrics {
  total_samples: number;
  attack_samples: number;
  normal_samples: number;
  data_quality: number;
  real_time_throughput: number;
  storage_used: number;
  active_uavs: number;
}

const simulatedAttacks: SimulatedAttack[] = [
  {
    id: 'ATTACK_001',
    name: 'Man-in-the-Middle Simulation',
    attack_type: 'mitm',
    description: 'Simulates MITM attacks on UAV communication channels with packet interception',
    duration: 300,
    intensity: 'medium',
    target_protocol: 'MAVLink',
    samples_generated: 0,
    status: 'ready'
  },
  {
    id: 'ATTACK_002',
    name: 'GPS Spoofing Campaign',
    attack_type: 'gps_spoofing',
    description: 'Generates false GPS signals to simulate navigation compromise scenarios',
    duration: 180,
    intensity: 'high',
    target_protocol: 'GPS/GNSS',
    samples_generated: 0,
    status: 'ready'
  },
  {
    id: 'ATTACK_003',
    name: 'Denial of Service Flood',
    attack_type: 'dos',
    description: 'Simulates network flooding attacks targeting UAV communication systems',
    duration: 120,
    intensity: 'high',
    target_protocol: 'TCP/UDP',
    samples_generated: 0,
    status: 'ready'
  },
  {
    id: 'ATTACK_004',
    name: 'Communication Jamming',
    attack_type: 'jamming',
    description: 'Simulates RF jamming attacks on various UAV communication frequencies',
    duration: 240,
    intensity: 'medium',
    target_protocol: '2.4GHz/5.8GHz',
    samples_generated: 0,
    status: 'ready'
  },
  {
    id: 'ATTACK_005',
    name: 'UAV Hijacking Attempt',
    attack_type: 'hijacking',
    description: 'Simulates complete UAV control takeover through command injection',
    duration: 600,
    intensity: 'critical',
    target_protocol: 'Control Channel',
    samples_generated: 0,
    status: 'ready'
  }
];

const mlModels: MLModel[] = [
  {
    id: 'MODEL_001',
    name: 'Random Forest Classifier',
    algorithm: 'Random Forest',
    accuracy: 94.2,
    precision: 93.8,
    recall: 94.6,
    f1_score: 94.2,
    training_samples: 150000,
    status: 'deployed',
    last_trained: new Date()
  },
  {
    id: 'MODEL_002',
    name: 'LSTM Neural Network',
    algorithm: 'LSTM',
    accuracy: 96.7,
    precision: 96.3,
    recall: 97.1,
    f1_score: 96.7,
    training_samples: 200000,
    status: 'training',
    last_trained: new Date()
  },
  {
    id: 'MODEL_003',
    name: 'Support Vector Machine',
    algorithm: 'SVM',
    accuracy: 89.4,
    precision: 88.9,
    recall: 90.0,
    f1_score: 89.4,
    training_samples: 100000,
    status: 'ready',
    last_trained: new Date()
  }
];

export function UAVNIDD() {
  const [datasetSamples, setDatasetSamples] = useState<DatasetSample[]>([]);
  const [models, setModels] = useState<MLModel[]>(mlModels);
  const [attacks, setAttacks] = useState<SimulatedAttack[]>(simulatedAttacks);
  const [testbedMetrics, setTestbedMetrics] = useState<TestbedMetrics>({
    total_samples: 47892,
    attack_samples: 15234,
    normal_samples: 32658,
    data_quality: 96.3,
    real_time_throughput: 1247,
    storage_used: 78.4,
    active_uavs: 6
  });
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isGeneratingData, setIsGeneratingData] = useState(false);

  useEffect(() => {
    // Generate initial dataset samples
    const generateSample = (): DatasetSample => {
      const attackTypes: Array<'normal' | 'mitm' | 'gps_spoofing' | 'dos' | 'jamming' | 'hijacking'> = 
        ['normal', 'mitm', 'gps_spoofing', 'dos', 'jamming', 'hijacking'];
      const isAttack = Math.random() > 0.7;
      const attackType = isAttack ? attackTypes[Math.floor(Math.random() * (attackTypes.length - 1)) + 1] : 'normal';

      return {
        id: `SAMPLE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date(),
        uav_id: `UAV_${Math.floor(Math.random() * 6) + 1}`,
        attack_type: attackType,
        telemetry: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
          altitude: 50 + Math.random() * 200,
          velocity: {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            z: (Math.random() - 0.5) * 5
          },
          battery: 20 + Math.random() * 80,
          signal_strength: 30 + Math.random() * 70
        },
        network_features: {
          packet_size: 64 + Math.random() * 1400,
          inter_arrival_time: Math.random() * 100,
          protocol: ['TCP', 'UDP', 'MAVLink'][Math.floor(Math.random() * 3)],
          port: Math.floor(Math.random() * 65535),
          flag_count: Math.floor(Math.random() * 8)
        },
        labels: {
          is_attack: isAttack,
          severity: isAttack ? (['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical') : 'low',
          confidence: 0.7 + Math.random() * 0.3
        }
      };
    };

    // Initialize with some samples
    const initialSamples = Array.from({ length: 20 }, () => generateSample());
    setDatasetSamples(initialSamples);

    // Real-time data generation
    const interval = setInterval(() => {
      const newSample = generateSample();
      setDatasetSamples(prev => [newSample, ...prev.slice(0, 49)]);

      // Update metrics
      setTestbedMetrics(prev => ({
        ...prev,
        total_samples: prev.total_samples + 1,
        attack_samples: newSample.labels.is_attack ? prev.attack_samples + 1 : prev.attack_samples,
        normal_samples: newSample.labels.is_attack ? prev.normal_samples : prev.normal_samples + 1,
        real_time_throughput: Math.max(800, Math.min(2000, prev.real_time_throughput + (Math.random() - 0.5) * 100)),
        storage_used: Math.min(100, prev.storage_used + 0.01),
        data_quality: Math.max(90, Math.min(99, prev.data_quality + (Math.random() - 0.5) * 1))
      }));

      // Update model performances
      setModels(prev => prev.map(model => ({
        ...model,
        accuracy: Math.max(85, Math.min(99, model.accuracy + (Math.random() - 0.5) * 0.5)),
        precision: Math.max(85, Math.min(99, model.precision + (Math.random() - 0.5) * 0.5)),
        recall: Math.max(85, Math.min(99, model.recall + (Math.random() - 0.5) * 0.5))
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const startAttackSimulation = (attackId: string) => {
    setAttacks(prev => prev.map(attack => 
      attack.id === attackId ? { ...attack, status: 'running', samples_generated: 0 } : attack
    ));

    // Simulate attack progression
    const progressInterval = setInterval(() => {
      setAttacks(prev => prev.map(attack => {
        if (attack.id === attackId && attack.status === 'running') {
          const newSamplesGenerated = attack.samples_generated + Math.floor(Math.random() * 50) + 10;
          if (newSamplesGenerated >= 1000) {
            clearInterval(progressInterval);
            return { ...attack, status: 'completed', samples_generated: 1000 };
          }
          return { ...attack, samples_generated: newSamplesGenerated };
        }
        return attack;
      }));
    }, 1000);
  };

  const trainModel = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId ? { ...model, status: 'training' } : model
    ));

    // Simulate training
    setTimeout(() => {
      setModels(prev => prev.map(model => 
        model.id === modelId ? {
          ...model,
          status: 'ready',
          accuracy: Math.min(99, model.accuracy + Math.random() * 2),
          training_samples: model.training_samples + 10000,
          last_trained: new Date()
        } : model
      ));
    }, 5000);
  };

  const exportDataset = () => {
    // Simulate dataset export
    const datasetContent = {
      metadata: {
        total_samples: testbedMetrics.total_samples,
        attack_samples: testbedMetrics.attack_samples,
        normal_samples: testbedMetrics.normal_samples,
        generated_at: new Date().toISOString(),
        version: "UAV-NIDD v1.2"
      },
      samples: datasetSamples.slice(0, 10) // Sample data
    };

    const blob = new Blob([JSON.stringify(datasetContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uav-nidd-dataset-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const getAttackTypeColor = (type: string) => {
    switch (type) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'mitm': return 'bg-red-100 text-red-800';
      case 'gps_spoofing': return 'bg-orange-100 text-orange-800';
      case 'dos': return 'bg-purple-100 text-purple-800';
      case 'jamming': return 'bg-yellow-100 text-yellow-800';
      case 'hijacking': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'bg-green-500 text-white';
      case 'training': return 'bg-blue-500 text-white';
      case 'ready': return 'bg-yellow-500 text-black';
      case 'updating': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">UAV-NIDD: Network Intrusion Detection Dataset</h2>
          <p className="text-gray-600">Dynamic real-time testbed for UAV-specific threat training and model development</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportDataset} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Dataset
          </Button>
          <Badge className="bg-blue-100 text-blue-800">
            <Database className="h-4 w-4 mr-2" />
            {testbedMetrics.total_samples.toLocaleString()} Samples
          </Badge>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {testbedMetrics.data_quality.toFixed(1)}%
            </div>
            <Progress value={testbedMetrics.data_quality} className="mt-2 h-2" />
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">High fidelity</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Real-time Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {testbedMetrics.real_time_throughput}
            </div>
            <div className="text-xs text-gray-600">samples/sec</div>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Live processing</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Attack Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((testbedMetrics.attack_samples / testbedMetrics.total_samples) * 100)}%
            </div>
            <div className="text-xs text-gray-600">
              {testbedMetrics.attack_samples.toLocaleString()} attack samples
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">Diverse threats</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Active UAVs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {testbedMetrics.active_uavs}
            </div>
            <div className="text-xs text-gray-600">Contributing data</div>
            <div className="flex items-center gap-1 mt-2">
              <Users className="h-3 w-3 text-purple-600" />
              <span className="text-xs text-purple-600">Multi-platform</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dataset" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="dataset" className="text-gray-700">Live Dataset</TabsTrigger>
          <TabsTrigger value="attacks" className="text-gray-700">Attack Simulation</TabsTrigger>
          <TabsTrigger value="models" className="text-gray-700">ML Models</TabsTrigger>
          <TabsTrigger value="testbed" className="text-gray-700">Testbed Control</TabsTrigger>
        </TabsList>

        <TabsContent value="dataset" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Real-Time Dataset Samples</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {datasetSamples.map((sample) => (
                    <div key={sample.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getAttackTypeColor(sample.attack_type)}>
                            {sample.attack_type.toUpperCase().replace('_', ' ')}
                          </Badge>
                          <span className="font-medium text-gray-900">{sample.uav_id}</span>
                          {sample.labels.is_attack && (
                            <Badge className={getSeverityColor(sample.labels.severity)}>
                              {sample.labels.severity.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {sample.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Position:</span>
                          <div className="font-mono text-xs text-gray-900">
                            {sample.telemetry.latitude.toFixed(4)}, {sample.telemetry.longitude.toFixed(4)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Altitude:</span>
                          <span className="ml-2 text-gray-900">{sample.telemetry.altitude.toFixed(1)}m</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Battery:</span>
                          <span className="ml-2 text-gray-900">{sample.telemetry.battery.toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Protocol:</span>
                          <span className="ml-2 text-gray-900">{sample.network_features.protocol}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Packet Size:</span>
                          <span className="ml-2 text-gray-900">{sample.network_features.packet_size.toFixed(0)} bytes</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-2 text-gray-900">{(sample.labels.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600">Velocity:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">
                          X:{sample.telemetry.velocity.x.toFixed(1)} Y:{sample.telemetry.velocity.y.toFixed(1)} Z:{sample.telemetry.velocity.z.toFixed(1)} m/s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attacks" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Simulated Cyberattacks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attacks.map((attack) => (
                    <div key={attack.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{attack.name}</h4>
                        <Badge className={attack.status === 'running' ? 'bg-blue-500 text-white' :
                                        attack.status === 'completed' ? 'bg-green-500 text-white' :
                                        'bg-gray-500 text-white'}>
                          {attack.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{attack.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 text-gray-900">{attack.duration}s</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Intensity:</span>
                          <Badge className={getSeverityColor(attack.intensity)} size="sm">
                            {attack.intensity}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-600">Protocol:</span>
                          <span className="ml-2 text-gray-900">{attack.target_protocol}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Samples:</span>
                          <span className="ml-2 text-gray-900">{attack.samples_generated}</span>
                        </div>
                      </div>
                      
                      {attack.status === 'running' && (
                        <div className="mb-3">
                          <Progress value={(attack.samples_generated / 1000) * 100} className="h-2" />
                          <span className="text-xs text-gray-600">
                            {attack.samples_generated}/1000 samples generated
                          </span>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => startAttackSimulation(attack.id)}
                        disabled={attack.status === 'running'}
                        size="sm"
                        className="w-full"
                      >
                        {attack.status === 'running' ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Simulation
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Attack Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">Normal Traffic</span>
                      <span className="text-gray-900">{testbedMetrics.normal_samples.toLocaleString()}</span>
                    </div>
                    <Progress value={(testbedMetrics.normal_samples / testbedMetrics.total_samples) * 100} className="h-2" />
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">MITM Attacks</span>
                      <span className="text-gray-900">{Math.floor(testbedMetrics.attack_samples * 0.3).toLocaleString()}</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">GPS Spoofing</span>
                      <span className="text-gray-900">{Math.floor(testbedMetrics.attack_samples * 0.25).toLocaleString()}</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">DoS Attacks</span>
                      <span className="text-gray-900">{Math.floor(testbedMetrics.attack_samples * 0.2).toLocaleString()}</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">Jamming</span>
                      <span className="text-gray-900">{Math.floor(testbedMetrics.attack_samples * 0.15).toLocaleString()}</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">Hijacking</span>
                      <span className="text-gray-900">{Math.floor(testbedMetrics.attack_samples * 0.1).toLocaleString()}</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Machine Learning Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{model.name}</h4>
                        <Badge className={getModelStatusColor(model.status)}>
                          {model.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Algorithm:</span>
                          <span className="ml-2 text-gray-900">{model.algorithm}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Accuracy:</span>
                          <span className="ml-2 text-gray-900">{model.accuracy.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Precision:</span>
                          <span className="ml-2 text-gray-900">{model.precision.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recall:</span>
                          <span className="ml-2 text-gray-900">{model.recall.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">F1-Score</span>
                          <span className="text-gray-900">{model.f1_score.toFixed(1)}%</span>
                        </div>
                        <Progress value={model.f1_score} className="h-2" />
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        Training samples: {model.training_samples.toLocaleString()}
                      </div>
                      
                      <Button
                        onClick={() => trainModel(model.id)}
                        disabled={model.status === 'training'}
                        size="sm"
                        className="w-full"
                      >
                        {model.status === 'training' ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Training...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Retrain Model
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Model Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Accuracy Comparison</h4>
                    {models.map((model) => (
                      <div key={model.id} className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{model.name}</span>
                          <span className="text-gray-900">{model.accuracy.toFixed(1)}%</span>
                        </div>
                        <Progress value={model.accuracy} className="h-2" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Training Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Training Samples:</span>
                        <span className="text-gray-900">
                          {models.reduce((sum, model) => sum + model.training_samples, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Accuracy:</span>
                        <span className="text-gray-900">
                          {(models.reduce((sum, model) => sum + model.accuracy, 0) / models.length).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Performing:</span>
                        <span className="text-gray-900">
                          {models.reduce((best, model) => model.accuracy > best.accuracy ? model : best).name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testbed" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Testbed Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Real-time Data Collection</span>
                      <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Collecting live telemetry from {testbedMetrics.active_uavs} UAV platforms
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Attack Simulation Engine</span>
                      <Badge className="bg-blue-500 text-white">READY</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Multi-vector attack generation with MITM, GPS spoofing, DoS
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Physical Drone Integration</span>
                      <Badge className="bg-green-500 text-white">CONNECTED</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Real drone telemetry paired with simulated attacks
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Data Quality Assurance</span>
                      <Badge className="bg-green-500 text-white">OPTIMAL</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Automated validation and labeling at {testbedMetrics.data_quality.toFixed(1)}% quality
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Storage Utilization</span>
                      <span className="text-gray-900">{testbedMetrics.storage_used.toFixed(1)}%</span>
                    </div>
                    <Progress value={testbedMetrics.storage_used} className="h-3" />
                    <span className="text-xs text-gray-600">~{(testbedMetrics.total_samples * 0.5 / 1024).toFixed(1)} GB used</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Processing Load</span>
                      <span className="text-gray-900">67%</span>
                    </div>
                    <Progress value={67} className="h-3" />
                    <span className="text-xs text-gray-600">Multi-threaded data processing</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Network Bandwidth</span>
                      <span className="text-gray-900">45%</span>
                    </div>
                    <Progress value={45} className="h-3" />
                    <span className="text-xs text-gray-600">UAV telemetry streaming</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">ML Training Resources</span>
                      <span className="text-gray-900">23%</span>
                    </div>
                    <Progress value={23} className="h-3" />
                    <span className="text-xs text-gray-600">GPU/CPU for model training</span>
                  </div>
                  
                  <Alert className="border-blue-200 bg-blue-50 mt-4">
                    <Monitor className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Testbed operating at optimal performance with balanced resource utilization
                      across data collection, attack simulation, and model training.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-8">
        UAV-NIDD: Network Intrusion Detection Dataset - Real-time Testbed - Created by Md.Hriday Khan
      </div>
    </div>
  );
}