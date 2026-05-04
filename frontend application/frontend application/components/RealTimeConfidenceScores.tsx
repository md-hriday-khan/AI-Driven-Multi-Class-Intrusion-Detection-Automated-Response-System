import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, BarChart, Bar } from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Activity, Zap } from 'lucide-react';

interface ConfidenceScore {
  timestamp: number;
  overallConfidence: number;
  threatTypeConfidences: {
    ddos: number;
    malware: number;
    bruteforce: number;
    botnet: number;
    exfiltration: number;
    zeroday: number;
  };
  modelMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
    accuracy: number;
  };
  detectionLatency: number;
  falsePositiveRate: number;
}

interface ThreatConfidence {
  type: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdate: number;
  detections24h: number;
  color: string;
}

export function RealTimeConfidenceScores() {
  const [currentScore, setCurrentScore] = useState<ConfidenceScore>({
    timestamp: Date.now(),
    overallConfidence: 92.4,
    threatTypeConfidences: {
      ddos: 94.2,
      malware: 89.7,
      bruteforce: 91.3,
      botnet: 87.9,
      exfiltration: 93.6,
      zeroday: 88.1
    },
    modelMetrics: {
      precision: 94.7,
      recall: 92.1,
      f1Score: 93.4,
      accuracy: 95.2
    },
    detectionLatency: 45.7,
    falsePositiveRate: 2.3
  });

  const [historicalScores, setHistoricalScores] = useState<ConfidenceScore[]>([]);
  const [threatConfidences, setThreatConfidences] = useState<ThreatConfidence[]>([
    { type: 'DDoS', confidence: 94.2, trend: 'up', lastUpdate: Date.now(), detections24h: 45, color: '#EF4444' },
    { type: 'Malware', confidence: 89.7, trend: 'stable', lastUpdate: Date.now(), detections24h: 23, color: '#F97316' },
    { type: 'Brute Force', confidence: 91.3, trend: 'up', lastUpdate: Date.now(), detections24h: 18, color: '#8B5CF6' },
    { type: 'Botnet', confidence: 87.9, trend: 'down', lastUpdate: Date.now(), detections24h: 12, color: '#10B981' },
    { type: 'Exfiltration', confidence: 93.6, trend: 'stable', lastUpdate: Date.now(), detections24h: 8, color: '#EC4899' },
    { type: 'Zero-day', confidence: 88.1, trend: 'up', lastUpdate: Date.now(), detections24h: 3, color: '#DC2626' }
  ]);

  const [liveAlerts, setLiveAlerts] = useState<Array<{
    id: string;
    type: string;
    confidence: number;
    timestamp: number;
    message: string;
  }>>([]);

  useEffect(() => {
    // Initialize historical data
    const now = Date.now();
    const initialData: ConfidenceScore[] = [];
    
    for (let i = 60; i >= 0; i--) {
      initialData.push({
        timestamp: now - (i * 60000), // 1 minute intervals
        overallConfidence: 88 + Math.random() * 8,
        threatTypeConfidences: {
          ddos: 90 + Math.random() * 8,
          malware: 85 + Math.random() * 10,
          bruteforce: 87 + Math.random() * 8,
          botnet: 84 + Math.random() * 8,
          exfiltration: 89 + Math.random() * 8,
          zeroday: 85 + Math.random() * 8
        },
        modelMetrics: {
          precision: 90 + Math.random() * 8,
          recall: 88 + Math.random() * 8,
          f1Score: 89 + Math.random() * 8,
          accuracy: 91 + Math.random() * 8
        },
        detectionLatency: 40 + Math.random() * 20,
        falsePositiveRate: 1 + Math.random() * 3
      });
    }
    
    setHistoricalScores(initialData);

    // Real-time updates
    const interval = setInterval(() => {
      const newScore: ConfidenceScore = {
        timestamp: Date.now(),
        overallConfidence: Math.max(75, Math.min(98, currentScore.overallConfidence + (Math.random() - 0.5) * 3)),
        threatTypeConfidences: {
          ddos: Math.max(75, Math.min(98, currentScore.threatTypeConfidences.ddos + (Math.random() - 0.5) * 4)),
          malware: Math.max(75, Math.min(98, currentScore.threatTypeConfidences.malware + (Math.random() - 0.5) * 4)),
          bruteforce: Math.max(75, Math.min(98, currentScore.threatTypeConfidences.bruteforce + (Math.random() - 0.5) * 4)),
          botnet: Math.max(75, Math.min(98, currentScore.threatTypeConfidences.botnet + (Math.random() - 0.5) * 4)),
          exfiltration: Math.max(75, Math.min(98, currentScore.threatTypeConfidences.exfiltration + (Math.random() - 0.5) * 4)),
          zeroday: Math.max(75, Math.min(98, currentScore.threatTypeConfidences.zeroday + (Math.random() - 0.5) * 4))
        },
        modelMetrics: {
          precision: Math.max(80, Math.min(98, currentScore.modelMetrics.precision + (Math.random() - 0.5) * 2)),
          recall: Math.max(80, Math.min(98, currentScore.modelMetrics.recall + (Math.random() - 0.5) * 2)),
          f1Score: Math.max(80, Math.min(98, currentScore.modelMetrics.f1Score + (Math.random() - 0.5) * 2)),
          accuracy: Math.max(80, Math.min(98, currentScore.modelMetrics.accuracy + (Math.random() - 0.5) * 2))
        },
        detectionLatency: Math.max(20, Math.min(100, currentScore.detectionLatency + (Math.random() - 0.5) * 10)),
        falsePositiveRate: Math.max(0.5, Math.min(5, currentScore.falsePositiveRate + (Math.random() - 0.5) * 0.5))
      };

      setCurrentScore(newScore);
      setHistoricalScores(prev => [...prev.slice(-59), newScore]);

      // Update threat confidences
      setThreatConfidences(prev => prev.map(threat => {
        const newConfidence = Math.max(75, Math.min(98, threat.confidence + (Math.random() - 0.5) * 3));
        const prevConfidence = threat.confidence;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (newConfidence > prevConfidence + 1) trend = 'up';
        else if (newConfidence < prevConfidence - 1) trend = 'down';

        return {
          ...threat,
          confidence: newConfidence,
          trend,
          lastUpdate: Date.now(),
          detections24h: Math.max(0, threat.detections24h + Math.floor((Math.random() - 0.8) * 3))
        };
      }));

      // Generate live alerts for significant confidence changes
      if (Math.random() > 0.8) {
        const alertTypes = ['DDoS', 'Malware', 'Brute Force', 'Botnet'];
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const confidence = 85 + Math.random() * 13;
        
        const newAlert = {
          id: `alert_${Date.now()}`,
          type: alertType,
          confidence: Math.round(confidence * 100) / 100,
          timestamp: Date.now(),
          message: `${alertType} detection confidence updated to ${confidence.toFixed(1)}%`
        };

        setLiveAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentScore]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-emerald-400';
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 85) return 'text-yellow-400';
    if (confidence >= 80) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressColor = (confidence: number) => {
    if (confidence >= 95) return 'bg-emerald-500';
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 85) return 'bg-yellow-500';
    if (confidence >= 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />;
      default: return <Activity className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Prepare data for radial chart
  const radialData = Object.entries(currentScore.threatTypeConfidences).map(([key, value]) => ({
    name: key.toUpperCase(),
    confidence: Math.round(value),
    fill: threatConfidences.find(t => t.type.toLowerCase().replace(' ', '').replace('-', '') === key)?.color || '#8B5CF6'
  }));

  return (
    <div className="space-y-6">
      {/* Overall Confidence Score */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-400" />
            Real-time Confidence Scores
            <Badge variant="secondary" className="bg-cyan-600 text-white animate-pulse">
              LIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Score Display */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getConfidenceColor(currentScore.overallConfidence)}`}>
                  {currentScore.overallConfidence.toFixed(1)}%
                </div>
                <div className="text-slate-400 mb-4">Overall Confidence</div>
                <Progress 
                  value={currentScore.overallConfidence} 
                  className="h-3 mb-4"
                />
                <div className="text-xs text-slate-400">
                  Last updated: {formatTimestamp(currentScore.timestamp)}
                </div>
              </div>
            </div>

            {/* Model Metrics */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">Precision</span>
                </div>
                <div className={`text-2xl font-bold ${getConfidenceColor(currentScore.modelMetrics.precision)}`}>
                  {currentScore.modelMetrics.precision.toFixed(1)}%
                </div>
                <Progress value={currentScore.modelMetrics.precision} className="h-2 mt-2" />
              </div>

              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">Recall</span>
                </div>
                <div className={`text-2xl font-bold ${getConfidenceColor(currentScore.modelMetrics.recall)}`}>
                  {currentScore.modelMetrics.recall.toFixed(1)}%
                </div>
                <Progress value={currentScore.modelMetrics.recall} className="h-2 mt-2" />
              </div>

              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">F1 Score</span>
                </div>
                <div className={`text-2xl font-bold ${getConfidenceColor(currentScore.modelMetrics.f1Score)}`}>
                  {currentScore.modelMetrics.f1Score.toFixed(1)}%
                </div>
                <Progress value={currentScore.modelMetrics.f1Score} className="h-2 mt-2" />
              </div>

              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">Accuracy</span>
                </div>
                <div className={`text-2xl font-bold ${getConfidenceColor(currentScore.modelMetrics.accuracy)}`}>
                  {currentScore.modelMetrics.accuracy.toFixed(1)}%
                </div>
                <Progress value={currentScore.modelMetrics.accuracy} className="h-2 mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threat-Specific Confidence Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Threat Confidences */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Threat Detection Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threatConfidences.map((threat) => (
                <div key={threat.type} className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: threat.color }}
                      />
                      <span className="font-medium">{threat.type}</span>
                      {getTrendIcon(threat.trend)}
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getConfidenceColor(threat.confidence)}`}>
                        {threat.confidence.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">
                        {threat.detections24h} detections
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={threat.confidence} 
                    className="h-2"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    Updated {formatTimestamp(threat.lastUpdate)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radial Confidence Chart */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="90%" 
                data={radialData}
              >
                <RadialBar 
                  dataKey="confidence" 
                  cornerRadius={10} 
                  fill="#8884d8" 
                />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Confidence']}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Historical Confidence Trends */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Confidence Score Trends (Last Hour)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historicalScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimestamp}
                stroke="#9CA3AF"
              />
              <YAxis 
                domain={[75, 100]}
                stroke="#9CA3AF"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                labelFormatter={(value) => `Time: ${formatTimestamp(value as number)}`}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)}%`, 
                  name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1').trim()
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
                stroke="#06B6D4" 
                strokeWidth={3}
                name="overall"
              />
              <Line 
                type="monotone" 
                dataKey={(data) => data.threatTypeConfidences.ddos} 
                stroke="#EF4444" 
                strokeWidth={2}
                name="ddos"
              />
              <Line 
                type="monotone" 
                dataKey={(data) => data.threatTypeConfidences.malware} 
                stroke="#F97316" 
                strokeWidth={2}
                name="malware"
              />
              <Line 
                type="monotone" 
                dataKey={(data) => data.threatTypeConfidences.bruteforce} 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="bruteForce"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Confidence Alerts */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Live Confidence Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liveAlerts.length === 0 ? (
              <div className="text-center text-slate-400 py-4">
                No recent confidence alerts
              </div>
            ) : (
              liveAlerts.map((alert) => (
                <div key={alert.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getConfidenceColor(alert.confidence)} bg-slate-700`}
                      >
                        {alert.confidence.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Detection Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Detection Latency:</span>
                <span className="font-medium text-cyan-400">
                  {currentScore.detectionLatency.toFixed(1)}ms
                </span>
              </div>
              <Progress value={(100 - currentScore.detectionLatency)} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">False Positive Rate:</span>
                <span className="font-medium text-red-400">
                  {currentScore.falsePositiveRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={100 - (currentScore.falsePositiveRate * 20)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Model Status:</span>
                <Badge className="bg-green-600 text-white">
                  OPERATIONAL
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Model Update:</span>
                <span className="text-slate-300">2 hours ago</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Training Data Version:</span>
                <span className="text-slate-300">v2.4.1</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Models:</span>
                <span className="text-slate-300">6/6</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}