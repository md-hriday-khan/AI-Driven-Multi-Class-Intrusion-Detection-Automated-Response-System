import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { 
  Play, 
  StopCircle, 
  Settings, 
  Zap, 
  Shield, 
  AlertTriangle, 
  Activity,
  Database,
  Lock
} from 'lucide-react';

interface AttackScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  targetSystems: string[];
  estimatedDuration: number; // in minutes
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SimulationState {
  isRunning: boolean;
  currentAttack: string | null;
  progress: number;
  detectionTime: number;
  responseTime: number;
  blockedRequests: number;
  compromisedSystems: number;
}

const attackScenarios: AttackScenario[] = [
  {
    id: 'ddos',
    name: 'DDoS Attack',
    description: 'Distributed Denial of Service attack targeting web infrastructure',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-red-500',
    targetSystems: ['Web Servers', 'Load Balancers', 'CDN'],
    estimatedDuration: 15,
    severityLevel: 'high'
  },
  {
    id: 'bruteforce',
    name: 'Brute Force Attack',
    description: 'Automated password guessing attack on authentication systems',
    icon: <Lock className="h-5 w-5" />,
    color: 'bg-orange-500',
    targetSystems: ['Authentication API', 'User Database', 'Login Portal'],
    estimatedDuration: 25,
    severityLevel: 'medium'
  },
  {
    id: 'malware',
    name: 'Malware Infection',
    description: 'Malicious software attempting to infiltrate network systems',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-purple-500',
    targetSystems: ['Endpoints', 'File Servers', 'Email System'],
    estimatedDuration: 30,
    severityLevel: 'critical'
  },
  {
    id: 'exfiltration',
    name: 'Data Exfiltration',
    description: 'Unauthorized data extraction from sensitive databases',
    icon: <Database className="h-5 w-5" />,
    color: 'bg-pink-500',
    targetSystems: ['Customer DB', 'Financial Records', 'PII Storage'],
    estimatedDuration: 45,
    severityLevel: 'critical'
  },
  {
    id: 'botnet',
    name: 'Botnet Activity',
    description: 'Coordinated attack from compromised devices network',
    icon: <Activity className="h-5 w-5" />,
    color: 'bg-yellow-500',
    targetSystems: ['Network Infrastructure', 'IoT Devices', 'Edge Servers'],
    estimatedDuration: 20,
    severityLevel: 'high'
  },
  {
    id: 'zeroday',
    name: 'Zero-Day Exploit',
    description: 'Previously unknown vulnerability exploitation attempt',
    icon: <Shield className="h-5 w-5" />,
    color: 'bg-red-600',
    targetSystems: ['Operating System', 'Application Layer', 'Security Tools'],
    estimatedDuration: 35,
    severityLevel: 'critical'
  }
];

export function AttackSimulation() {
  const [simulation, setSimulation] = useState<SimulationState>({
    isRunning: false,
    currentAttack: null,
    progress: 0,
    detectionTime: 0,
    responseTime: 0,
    blockedRequests: 0,
    compromisedSystems: 0
  });

  const [selectedAttack, setSelectedAttack] = useState<string>('ddos');
  const [intensity, setIntensity] = useState([70]);
  const [autoResponse, setAutoResponse] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (simulation.isRunning && simulation.currentAttack) {
      interval = setInterval(() => {
        setSimulation(prev => {
          const newProgress = Math.min(prev.progress + (Math.random() * 5 + 2), 100);
          const attack = attackScenarios.find(a => a.id === prev.currentAttack);
          
          if (newProgress >= 100) {
            return {
              ...prev,
              isRunning: false,
              progress: 100,
              detectionTime: prev.detectionTime || Math.floor(Math.random() * 30 + 5),
              responseTime: prev.responseTime || Math.floor(Math.random() * 60 + 10)
            };
          }

          return {
            ...prev,
            progress: newProgress,
            detectionTime: newProgress > 20 ? Math.floor(Math.random() * 30 + 5) : prev.detectionTime,
            responseTime: newProgress > 50 ? Math.floor(Math.random() * 60 + 10) : prev.responseTime,
            blockedRequests: prev.blockedRequests + Math.floor(Math.random() * 50 + 10),
            compromisedSystems: newProgress > 80 ? Math.floor(Math.random() * 3) : prev.compromisedSystems
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simulation.isRunning, simulation.currentAttack]);

  const startSimulation = (attackId: string) => {
    setSimulation({
      isRunning: true,
      currentAttack: attackId,
      progress: 0,
      detectionTime: 0,
      responseTime: 0,
      blockedRequests: 0,
      compromisedSystems: 0
    });
  };

  const stopSimulation = () => {
    setSimulation(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const resetSimulation = () => {
    setSimulation({
      isRunning: false,
      currentAttack: null,
      progress: 0,
      detectionTime: 0,
      responseTime: 0,
      blockedRequests: 0,
      compromisedSystems: 0
    });
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

  const currentAttackData = attackScenarios.find(a => a.id === simulation.currentAttack);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-white border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Settings className="h-5 w-5 text-blue-600" />
            Attack Simulation Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Attack Selection */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-medium text-gray-900">Select Attack Scenario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attackScenarios.map((attack) => (
                  <div
                    key={attack.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAttack === attack.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                    onClick={() => setSelectedAttack(attack.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`${attack.color} p-2 rounded-lg text-white`}>
                        {attack.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{attack.name}</h4>
                        <Badge variant="secondary" className={`${getSeverityColor(attack.severityLevel)} text-white`}>
                          {attack.severityLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{attack.description}</p>
                    <div className="text-xs text-gray-500">
                      Duration: ~{attack.estimatedDuration} min
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Configuration</h3>
              
              <div>
                <label className="text-sm text-gray-700 mb-2 block">
                  Attack Intensity: {intensity[0]}%
                </label>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={100}
                  min={10}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-900">Auto Response</label>
                <Switch
                  checked={autoResponse}
                  onCheckedChange={setAutoResponse}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-900">Real-time Mode</label>
                <Switch
                  checked={realTimeMode}
                  onCheckedChange={setRealTimeMode}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Controls</h3>
              
              <div className="space-y-2">
                <Button
                  onClick={() => startSimulation(selectedAttack)}
                  disabled={simulation.isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Simulation
                </Button>
                
                <Button
                  onClick={stopSimulation}
                  disabled={!simulation.isRunning}
                  variant="destructive"
                  className="w-full"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Simulation
                </Button>
                
                <Button
                  onClick={resetSimulation}
                  variant="outline"
                  className="w-full"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Status */}
      {simulation.currentAttack && (
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-gray-900">
              <span>Simulation Status</span>
              <Badge 
                variant={simulation.isRunning ? "destructive" : "secondary"}
                className="animate-pulse"
              >
                {simulation.isRunning ? "RUNNING" : "STOPPED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentAttackData && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`${currentAttackData.color} p-3 rounded-lg text-white`}>
                    {currentAttackData.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{currentAttackData.name}</h3>
                    <p className="text-gray-600">{currentAttackData.description}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{simulation.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={simulation.progress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {simulation.detectionTime}s
                    </div>
                    <div className="text-xs text-gray-600">Detection Time</div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {simulation.responseTime}s
                    </div>
                    <div className="text-xs text-gray-600">Response Time</div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {simulation.blockedRequests.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Blocked Requests</div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {simulation.compromisedSystems}
                    </div>
                    <div className="text-xs text-gray-600">Compromised Systems</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Target Systems</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentAttackData.targetSystems.map((system, index) => (
                      <Badge key={index} variant="outline">
                        {system}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Simulations */}
      <Card className="bg-white border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Simulation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 text-gray-900">Attack Type</th>
                  <th className="text-left p-2 text-gray-900">Severity</th>
                  <th className="text-left p-2 text-gray-900">Detection Time</th>
                  <th className="text-left p-2 text-gray-900">Response Time</th>
                  <th className="text-left p-2 text-gray-900">Outcome</th>
                  <th className="text-left p-2 text-gray-900">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {simulation.progress === 100 && simulation.currentAttack && (
                  <tr className="border-b border-gray-200">
                    <td className="p-2 text-gray-900">{currentAttackData?.name}</td>
                    <td className="p-2">
                      <Badge variant="secondary" className={`${getSeverityColor(currentAttackData?.severityLevel || 'low')} text-white`}>
                        {currentAttackData?.severityLevel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-900">{simulation.detectionTime}s</td>
                    <td className="p-2 text-gray-900">{simulation.responseTime}s</td>
                    <td className="p-2">
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        BLOCKED
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-900">{new Date().toLocaleString()}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-200">
                  <td className="p-2 text-gray-900">DDoS Attack</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="bg-orange-500 text-white">HIGH</Badge>
                  </td>
                  <td className="p-2 text-gray-900">12s</td>
                  <td className="p-2 text-gray-900">34s</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="bg-green-500 text-white">BLOCKED</Badge>
                  </td>
                  <td className="p-2 text-gray-900">2024-01-15 14:23:11</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-2 text-gray-900">Malware Infection</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="bg-red-500 text-white">CRITICAL</Badge>
                  </td>
                  <td className="p-2 text-gray-900">8s</td>
                  <td className="p-2 text-gray-900">45s</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="bg-green-500 text-white">BLOCKED</Badge>
                  </td>
                  <td className="p-2 text-gray-900">2024-01-15 13:47:22</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}