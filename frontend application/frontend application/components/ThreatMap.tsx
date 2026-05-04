import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Globe, AlertTriangle, Zap, Shield } from 'lucide-react';

interface ThreatLocation {
  id: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
  threatType: 'ddos' | 'malware' | 'botnet' | 'bruteforce' | 'exfiltration' | 'zeroday';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  ipCount: number;
}

const threatColors = {
  ddos: '#ef4444',      // red
  malware: '#f97316',   // orange
  botnet: '#eab308',    // yellow
  bruteforce: '#8b5cf6', // purple
  exfiltration: '#ec4899', // pink
  zeroday: '#dc2626'    // dark red
};

const severityColors = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444'
};

export function ThreatMap() {
  const [threats, setThreats] = useState<ThreatLocation[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<ThreatLocation | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Initialize with some sample threats
    const initialThreats: ThreatLocation[] = [
      {
        id: '1',
        lat: 40.7128,
        lng: -74.0060,
        country: 'USA',
        city: 'New York',
        threatType: 'ddos',
        severity: 'high',
        timestamp: new Date(),
        ipCount: 247
      },
      {
        id: '2',
        lat: 51.5074,
        lng: -0.1278,
        country: 'UK',
        city: 'London',
        threatType: 'malware',
        severity: 'medium',
        timestamp: new Date(),
        ipCount: 89
      },
      {
        id: '3',
        lat: 35.6762,
        lng: 139.6503,
        country: 'Japan',
        city: 'Tokyo',
        threatType: 'botnet',
        severity: 'critical',
        timestamp: new Date(),
        ipCount: 156
      }
    ];

    setThreats(initialThreats);

    // Simulate real-time threat updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const locations = [
          { lat: 52.5200, lng: 13.4050, country: 'Germany', city: 'Berlin' },
          { lat: 48.8566, lng: 2.3522, country: 'France', city: 'Paris' },
          { lat: 55.7558, lng: 37.6176, country: 'Russia', city: 'Moscow' },
          { lat: 39.9042, lng: 116.4074, country: 'China', city: 'Beijing' },
          { lat: -33.8688, lng: 151.2093, country: 'Australia', city: 'Sydney' },
          { lat: 19.0760, lng: 72.8777, country: 'India', city: 'Mumbai' }
        ];

        const threatTypes: Array<'ddos' | 'malware' | 'botnet' | 'bruteforce' | 'exfiltration' | 'zeroday'> = 
          ['ddos', 'malware', 'botnet', 'bruteforce', 'exfiltration', 'zeroday'];
        const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];

        const location = locations[Math.floor(Math.random() * locations.length)];
        const newThreat: ThreatLocation = {
          id: Date.now().toString(),
          ...location,
          threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          timestamp: new Date(),
          ipCount: Math.floor(Math.random() * 300) + 10
        };

        setThreats(prev => [newThreat, ...prev.slice(0, 9)]); // Keep last 10 threats
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const filteredThreats = filter === 'all' 
    ? threats 
    : threats.filter(threat => threat.threatType === filter);

  const threatTypeLabels = {
    ddos: 'DDoS Attack',
    malware: 'Malware',
    botnet: 'Botnet',
    bruteforce: 'Brute Force',
    exfiltration: 'Data Exfiltration',
    zeroday: 'Zero-Day Exploit'
  };

  return (
    <Card className="bg-white border-slate-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            Global Threat Map
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            {Object.keys(threatTypeLabels).map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
                className="text-xs"
              >
                {type.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* World Map Simulation */}
          <div className="lg:col-span-2">
            <div className="relative h-80 bg-slate-100 rounded-lg border border-slate-300 overflow-hidden">
              {/* Map background with grid */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              </div>

              {/* Threat indicators */}
              {filteredThreats.map((threat) => {
                // Convert lat/lng to x/y coordinates (simplified)
                const x = ((threat.lng + 180) / 360) * 100;
                const y = ((90 - threat.lat) / 180) * 100;

                return (
                  <div
                    key={threat.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedThreat(threat)}
                  >
                    <div className="relative">
                      {/* Pulse animation */}
                      <div 
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ 
                          backgroundColor: severityColors[threat.severity],
                          width: '20px',
                          height: '20px'
                        }}
                      />
                      {/* Threat indicator */}
                      <div 
                        className="relative rounded-full border-2 border-white"
                        style={{ 
                          backgroundColor: threatColors[threat.threatType],
                          width: '12px',
                          height: '12px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-3 backdrop-blur-sm border border-slate-200">
                <h4 className="text-sm font-medium mb-2 text-slate-800">Threat Types</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(threatColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="capitalize text-slate-700">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Threat Details */}
          <div className="space-y-4">
            {selectedThreat ? (
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Threat Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Type</span>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: threatColors[selectedThreat.threatType] + '20' }}
                      >
                        {threatTypeLabels[selectedThreat.threatType]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Severity</span>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: severityColors[selectedThreat.severity] + '20' }}
                      >
                        {selectedThreat.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Location</span>
                      <span className="text-sm">{selectedThreat.city}, {selectedThreat.country}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">IP Count</span>
                      <span className="text-sm">{selectedThreat.ipCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Detected</span>
                      <span className="text-sm">{selectedThreat.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Initiate Response
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-slate-500 py-8">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click on a threat indicator to view details</p>
              </div>
            )}

            {/* Recent Threats List */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Threats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredThreats.slice(0, 5).map((threat) => (
                    <div 
                      key={threat.id}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 cursor-pointer hover:bg-slate-100"
                      onClick={() => setSelectedThreat(threat)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: threatColors[threat.threatType] }}
                        />
                        <div>
                          <p className="text-sm font-medium">{threat.city}</p>
                          <p className="text-xs text-slate-500">{threatTypeLabels[threat.threatType]}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: severityColors[threat.severity] + '20' }}
                      >
                        {threat.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}