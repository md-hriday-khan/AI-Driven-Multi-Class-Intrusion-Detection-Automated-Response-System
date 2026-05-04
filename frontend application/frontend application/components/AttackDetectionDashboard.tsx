import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Shield, Target, AlertTriangle, TrendingUp, Clock, Zap } from 'lucide-react';

interface DetectionEvent {
  id: string;
  timestamp: number;
  attackType: string;
  confidence: number;
  source: string;
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'mitigated' | 'false_positive';
}

interface AttackClassification {
  type: string;
  count: number;
  confidence: number;
  color: string;
}

interface ConfidenceMetric {
  timestamp: number;
  overallConfidence: number;
  ddosConfidence: number;
  malwareConfidence: number;
  brutforceConfidence: number;
  detectionRate: number;
}

export function AttackDetectionDashboard() {
  const [detectionEvents, setDetectionEvents] = useState<DetectionEvent[]>([]);
  const [confidenceMetrics, setConfidenceMetrics] = useState<ConfidenceMetric[]>([]);
  const [attackClassifications, setAttackClassifications] = useState<AttackClassification[]>([
    { type: 'DDoS', count: 45, confidence: 94.2, color: '#EF4444' },
    { type: 'Malware', count: 23, confidence: 87.6, color: '#F97316' },
    { type: 'Brute Force', count: 18, confidence: 91.3, color: '#8B5CF6' },
    { type: 'Botnet', count: 12, confidence: 89.1, color: '#10B981' },
    { type: 'Zero-day', count: 3, confidence: 95.7, color: '#DC2626' },
    { type: 'Exfiltration', count: 8, confidence: 88.4, color: '#EC4899' }
  ]);

  const [currentStats, setCurrentStats] = useState({
    totalDetections: 109,
    highConfidenceDetections: 87,
    avgConfidence: 90.3,
    falsePositiveRate: 2.1,
    avgDetectionTime: 1.4, // seconds
    threatsBlocked: 98
  });

  useEffect(() => {
    // Initialize historical data
    const now = Date.now();
    const initialConfidenceData: ConfidenceMetric[] = [];
    const initialEvents: DetectionEvent[] = [];
    
    // Generate confidence metrics
    for (let i = 60; i >= 0; i--) {
      initialConfidenceData.push({
        timestamp: now - (i * 60000), // 1 minute intervals
        overallConfidence: 85 + Math.random() * 10,
        ddosConfidence: 88 + Math.random() * 8,
        malwareConfidence: 82 + Math.random() * 12,
        brutforceConfidence: 90 + Math.random() * 8,
        detectionRate: 94 + Math.random() * 4
      });
    }

    // Generate initial detection events
    const attackTypes = ['DDoS', 'Malware', 'Brute Force', 'Botnet', 'Zero-day', 'Exfiltration'];
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const statuses: Array<'detected' | 'investigating' | 'mitigated' | 'false_positive'> = 
      ['detected', 'investigating', 'mitigated', 'false_positive'];

    for (let i = 0; i < 20; i++) {
      initialEvents.push({
        id: `event-${i}`,
        timestamp: now - (Math.random() * 3600000), // Last hour
        attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
        confidence: 70 + Math.random() * 25,
        source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        target: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    setConfidenceMetrics(initialConfidenceData);
    setDetectionEvents(initialEvents.sort((a, b) => b.timestamp - a.timestamp));

    // Real-time updates
    const interval = setInterval(() => {
      // Update confidence metrics
      const newConfidenceMetric: ConfidenceMetric = {
        timestamp: Date.now(),
        overallConfidence: 85 + Math.random() * 10,
        ddosConfidence: 88 + Math.random() * 8,
        malwareConfidence: 82 + Math.random() * 12,
        brutforceConfidence: 90 + Math.random() * 8,
        detectionRate: 94 + Math.random() * 4
      };

      setConfidenceMetrics(prev => [...prev.slice(-59), newConfidenceMetric]);

      // Occasionally add new detection events
      if (Math.random() > 0.7) {
        const newEvent: DetectionEvent = {
          id: `event-${Date.now()}`,
          timestamp: Date.now(),
          attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
          confidence: 70 + Math.random() * 25,
          source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          severity: severities[Math.floor(Math.random() * severities.length)],
          status: 'detected'
        };

        setDetectionEvents(prev => [newEvent, ...prev.slice(0, 19)]);
        
        // Update stats
        setCurrentStats(prev => ({
          ...prev,
          totalDetections: prev.totalDetections + 1,
          highConfidenceDetections: newEvent.confidence > 85 ? prev.highConfidenceDetections + 1 : prev.highConfidenceDetections,
          avgConfidence: (prev.avgConfidence + newEvent.confidence) / 2,
          threatsBlocked: newEvent.confidence > 80 ? prev.threatsBlocked + 1 : prev.threatsBlocked
        }));
      }

      // Update attack classifications
      setAttackClassifications(prev => prev.map(attack => ({
        ...attack,
        confidence: Math.max(75, Math.min(98, attack.confidence + (Math.random() - 0.5) * 2))
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-red-500';
      case 'investigating': return 'bg-yellow-500';
      case 'mitigated': return 'bg-green-500';
      case 'false_positive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 80) return 'text-yellow-400';
    if (confidence >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Detection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalDetections}</div>
            <p className="text-xs text-slate-400">last 24 hours</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+12% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Shield className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.avgConfidence.toFixed(1)}%</div>
            <Progress value={currentStats.avgConfidence} className="mt-2 h-2" />
            <p className="text-xs text-slate-400 mt-1">
              High confidence: {currentStats.highConfidenceDetections}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.avgDetectionTime}s</div>
            <p className="text-xs text-slate-400">average response time</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-green-500 text-xs">
                Real-time
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Trends and Attack Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Confidence Scores */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Real-time Confidence Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={confidenceMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  domain={[70, 100]}
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${formatTimestamp(value as number)}`}
                  formatter={(value: any, name: string) => [
                    `${value.toFixed(1)}%`, 
                    name.charAt(0).toUpperCase() + name.slice(1).replace('Confidence', ' Confidence')
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="overallConfidence" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="overall"
                />
                <Line 
                  type="monotone" 
                  dataKey="ddosConfidence" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="ddos"
                />
                <Line 
                  type="monotone" 
                  dataKey="malwareConfidence" 
                  stroke="#F97316" 
                  strokeWidth={2}
                  name="malware"
                />
                <Line 
                  type="monotone" 
                  dataKey="brutforceConfidence" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="bruteforce"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attack Type Classification */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Attack Type Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attackClassifications}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'count' ? value : `${value.toFixed(1)}%`,
                    name === 'count' ? 'Detections' : 'Confidence'
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" name="count" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {attackClassifications.map((attack, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: attack.color }}
                    />
                    <span className="font-medium">{attack.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{attack.count} detections</span>
                    <span className={`text-sm font-medium ${getConfidenceColor(attack.confidence)}`}>
                      {attack.confidence.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Timeline */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Recent Detection Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detectionEvents.slice(0, 10).map((event) => (
              <div 
                key={event.id}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium">{event.attackType}</span>
                  </div>
                  
                  <div className="text-sm text-slate-400">
                    {event.source} → {event.target}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getConfidenceColor(event.confidence)}`}>
                      {event.confidence.toFixed(1)}% confidence
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <Badge 
                    variant="secondary" 
                    className={getSeverityColor(event.severity)}
                  >
                    {event.severity.toUpperCase()}
                  </Badge>

                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(event.status)}
                  >
                    {event.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Metrics */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Model Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Detection Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-400">96.2%</div>
              <div className="text-xs text-slate-400">True positive rate</div>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium">Precision</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">94.7%</div>
              <div className="text-xs text-slate-400">Positive predictive value</div>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">F1 Score</span>
              </div>
              <div className="text-2xl font-bold text-green-400">95.4%</div>
              <div className="text-xs text-slate-400">Harmonic mean</div>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-medium">False Positive</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{currentStats.falsePositiveRate}%</div>
              <div className="text-xs text-slate-400">Error rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}