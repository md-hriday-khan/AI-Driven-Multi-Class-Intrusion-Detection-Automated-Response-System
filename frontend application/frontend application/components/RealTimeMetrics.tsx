import React, { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Zap, Shield, Activity, Database } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

export function RealTimeMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Network Throughput',
      value: 847.2,
      unit: 'Mbps',
      trend: 'up',
      icon: <Activity className="h-4 w-4" />,
      color: 'text-blue-400'
    },
    {
      label: 'Threats Blocked',
      value: 1247,
      unit: '/hour',
      trend: 'down',
      icon: <Shield className="h-4 w-4" />,
      color: 'text-green-400'
    },
    {
      label: 'AI Confidence',
      value: 94.7,
      unit: '%',
      trend: 'stable',
      icon: <Zap className="h-4 w-4" />,
      color: 'text-yellow-400'
    },
    {
      label: 'System Load',
      value: 67.3,
      unit: '%',
      trend: 'up',
      icon: <Database className="h-4 w-4" />,
      color: 'text-orange-400'
    }
  ]);

  // Use WebSocket for real-time updates (with mock data fallback)
  const { isConnected } = useWebSocket('ws://localhost:8080', {
    mockData: true, // Enable mock data mode for demo
    onMessage: (message) => {
      if (message.type === 'system_update') {
        const data = message.data;
        setMetrics(prev => prev.map(metric => {
          let newValue = metric.value;
          
          switch (metric.label) {
            case 'Network Throughput':
              newValue = data.networkLatency ? 1000 - data.networkLatency * 10 : metric.value;
              break;
            case 'Threats Blocked':
              newValue = data.cpuUsage * 20 || metric.value;
              break;
            case 'System Load':
              newValue = data.cpuUsage || metric.value;
              break;
            case 'AI Confidence':
              newValue = 95 + Math.random() * 4;
              break;
            default:
              const variation = (Math.random() - 0.5) * 10;
              newValue = metric.value + variation;
          }
          
          // Keep values within reasonable bounds
          if (metric.label === 'AI Confidence' || metric.label === 'System Load') {
            newValue = Math.max(0, Math.min(100, newValue));
          } else if (metric.label === 'Network Throughput') {
            newValue = Math.max(0, Math.min(1000, newValue));
          } else {
            newValue = Math.max(0, newValue);
          }

          const variation = newValue - metric.value;
          const trend = variation > 2 ? 'up' : variation < -2 ? 'down' : 'stable';
          
          return { ...metric, value: newValue, trend };
        }));
      }
    },
    mockData: true
  });

  // Fallback interval for demo purposes
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        setMetrics(prev => prev.map(metric => {
          const variation = (Math.random() - 0.5) * 10;
          let newValue = metric.value + variation;
          
          // Keep values within reasonable bounds
          if (metric.label === 'AI Confidence' || metric.label === 'System Load') {
            newValue = Math.max(0, Math.min(100, newValue));
          } else if (metric.label === 'Network Throughput') {
            newValue = Math.max(0, Math.min(1000, newValue));
          } else {
            newValue = Math.max(0, newValue);
          }

          const trend = variation > 2 ? 'up' : variation < -2 ? 'down' : 'stable';

          return {
            ...metric,
            value: newValue,
            trend
          };
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-400" />;
      default: return <div className="h-3 w-3 rounded-full bg-yellow-400" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%' || unit === '/hour') {
      return value.toFixed(1);
    }
    return value.toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              {metric.label}
            </CardTitle>
            <div className={metric.color.replace('400', '600')}>
              {metric.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(metric.value, metric.unit)}
                <span className="text-sm font-normal text-gray-600 ml-1">
                  {metric.unit}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(metric.trend)}
              </div>
            </div>
            
            {(metric.label === 'AI Confidence' || metric.label === 'System Load') && (
              <div className="mt-3">
                <Progress 
                  value={metric.value} 
                  className="h-2" 
                />
              </div>
            )}
            
            <div className="mt-2 flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className="text-xs bg-green-100 text-green-800"
              >
                Live
              </Badge>
              <span className="text-xs text-gray-500">
                Updated {new Date().toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}