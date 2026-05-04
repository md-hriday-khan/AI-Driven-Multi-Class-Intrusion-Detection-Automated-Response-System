import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Database, Download, Upload, FileText, Search, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DatabaseEvent {
  id: number;
  event_id: string;
  timestamp: number;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  source_ip: string;
  target_ip: string;
  attack_vector: string;
  geo_location: string;
  status: 'detected' | 'investigating' | 'mitigated' | 'false_positive';
  created_at: string;
}

interface LogStats {
  totalEvents: number;
  todayEvents: number;
  criticalEvents: number;
  averageConfidence: number;
  topThreatType: string;
  dbSize: string;
}

export function SQLiteLogger() {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [stats, setStats] = useState<LogStats>({
    totalEvents: 0,
    todayEvents: 0,
    criticalEvents: 0,
    averageConfidence: 0,
    topThreatType: '',
    dbSize: '0 MB'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Simulated SQLite database operations
  useEffect(() => {
    // Simulate database connection
    setIsConnected(true);
    
    // Define common data arrays
    const threatTypes = ['ddos', 'malware', 'bruteforce', 'botnet', 'exfiltration', 'zeroday'];
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const statuses: Array<'detected' | 'investigating' | 'mitigated' | 'false_positive'> = 
      ['detected', 'investigating', 'mitigated', 'false_positive'];
    const geoLocations = ['US', 'CN', 'RU', 'DE', 'UK', 'FR', 'JP', 'BR'];
    
    // Generate mock data that simulates SQLite records
    const generateMockEvents = (): DatabaseEvent[] => {

      const mockEvents: DatabaseEvent[] = [];
      
      for (let i = 1; i <= 100; i++) {
        const timestamp = Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
        mockEvents.push({
          id: i,
          event_id: `evt_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp,
          threat_type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          confidence: Math.round((70 + Math.random() * 30) * 100) / 100,
          source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          attack_vector: `${threatTypes[Math.floor(Math.random() * threatTypes.length)].toUpperCase()} Attack`,
          geo_location: geoLocations[Math.floor(Math.random() * geoLocations.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          created_at: new Date(timestamp).toISOString()
        });
      }
      
      return mockEvents.sort((a, b) => b.timestamp - a.timestamp);
    };

    const mockEvents = generateMockEvents();
    setEvents(mockEvents);

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayEvents = mockEvents.filter(e => e.timestamp >= todayTimestamp);
    const criticalEvents = mockEvents.filter(e => e.severity === 'critical');
    const avgConfidence = mockEvents.reduce((sum, e) => sum + e.confidence, 0) / mockEvents.length;
    
    const threatTypeCounts = mockEvents.reduce((acc, e) => {
      acc[e.threat_type] = (acc[e.threat_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topThreatType = Object.entries(threatTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'ddos';

    setStats({
      totalEvents: mockEvents.length,
      todayEvents: todayEvents.length,
      criticalEvents: criticalEvents.length,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      topThreatType,
      dbSize: '2.4 MB'
    });

    // Simulate real-time event insertion
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent: DatabaseEvent = {
          id: Date.now(),
          event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          threat_type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          confidence: Math.round((70 + Math.random() * 30) * 100) / 100,
          source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          attack_vector: `${threatTypes[Math.floor(Math.random() * threatTypes.length)].toUpperCase()} Attack`,
          geo_location: geoLocations[Math.floor(Math.random() * geoLocations.length)],
          status: 'detected',
          created_at: new Date().toISOString()
        };

        setEvents(prev => [newEvent, ...prev.slice(0, 99)]);
        setStats(prev => ({
          ...prev,
          totalEvents: prev.totalEvents + 1,
          todayEvents: prev.todayEvents + 1
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const exportToCSV = () => {
    const headers = ['ID', 'Event ID', 'Timestamp', 'Threat Type', 'Severity', 'Confidence', 'Source IP', 'Target IP', 'Attack Vector', 'Location', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredEvents.map(event => [
        event.id,
        event.event_id,
        new Date(event.timestamp).toISOString(),
        event.threat_type,
        event.severity,
        event.confidence,
        event.source_ip,
        event.target_ip,
        `"${event.attack_vector}"`,
        event.geo_location,
        event.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shield_events_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      // Simple CSV parsing (in real implementation, use a proper CSV parser)
      const importedEvents: DatabaseEvent[] = [];
      for (let i = 1; i < lines.length && i < 21; i++) { // Limit to 20 imports for demo
        const values = lines[i].split(',');
        if (values.length >= headers.length) {
          const importedEvent: DatabaseEvent = {
            id: Date.now() + i,
            event_id: `imported_${Date.now()}_${i}`,
            timestamp: new Date(values[2]).getTime() || Date.now(),
            threat_type: values[3] || 'unknown',
            severity: (values[4] as any) || 'medium',
            confidence: parseFloat(values[5]) || 75.0,
            source_ip: values[6] || '0.0.0.0',
            target_ip: values[7] || '192.168.1.1',
            attack_vector: values[8].replace(/"/g, '') || 'Unknown Attack',
            geo_location: values[9] || 'US',
            status: (values[10] as any) || 'detected',
            created_at: new Date().toISOString()
          };
          importedEvents.push(importedEvent);
        }
      }

      setEvents(prev => [...importedEvents, ...prev]);
      setStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents + importedEvents.length
      }));
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
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
      case 'detected': return 'bg-red-600 text-white';
      case 'investigating': return 'bg-yellow-600 text-black';
      case 'mitigated': return 'bg-green-600 text-white';
      case 'false_positive': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.source_ip.includes(searchTerm) ||
      event.threat_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || event.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={isConnected ? 'border-green-600 bg-green-950/20' : 'border-red-600 bg-red-950/20'}>
        <Database className="h-4 w-4" />
        <AlertDescription>
          SQLite Database Status: {isConnected ? 'Connected' : 'Disconnected'}
          {isConnected && ` | Database Size: ${stats.dbSize} | Last Updated: ${new Date().toLocaleTimeString()}`}
        </AlertDescription>
      </Alert>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Database className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-slate-400">all time records</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.todayEvents}</div>
            <p className="text-xs text-slate-400">new events today</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <Search className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.criticalEvents}</div>
            <p className="text-xs text-slate-400">require immediate attention</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Filter className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.averageConfidence}%</div>
            <p className="text-xs text-slate-400">detection accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Database Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              <label className="cursor-pointer">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="detected">Detected</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="mitigated">Mitigated</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Log */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Security Events Log ({filteredEvents.length} records)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredEvents.slice(0, 50).map((event) => (
                <div 
                  key={event.id}
                  className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-cyan-600 text-white">
                        #{event.id}
                      </Badge>
                      <span className="font-mono text-sm text-slate-300">{event.event_id}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status.toUpperCase().replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Threat Type:</span>
                      <div className="font-medium text-orange-400">{event.threat_type.toUpperCase()}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Confidence:</span>
                      <div className="font-medium text-green-400">{event.confidence}%</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Source IP:</span>
                      <div className="font-mono font-medium text-red-400">{event.source_ip}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Location:</span>
                      <div className="font-medium text-purple-400">{event.geo_location}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
                    <span>Target: {event.target_ip}</span>
                    <span>Vector: {event.attack_vector}</span>
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}