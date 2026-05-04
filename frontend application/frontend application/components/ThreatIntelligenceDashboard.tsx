import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Globe, AlertTriangle, Shield, Target, Database, Zap, Brain, Eye, TrendingUp, Activity, Search, Filter, Clock, Map, Hash, Mail, ExternalLink } from 'lucide-react';

interface ThreatIndicator {
  indicator_id: string;
  indicator_type: string;
  value: string;
  confidence: number;
  severity: string;
  first_seen: string;
  last_seen: string;
  source: string;
  tags: string[];
  reputation_score: number;
}

interface ThreatCampaign {
  campaign_id: string;
  name: string;
  threat_actor: string;
  start_date: string;
  targeted_sectors: string[];
  attack_vectors: string[];
  confidence: number;
  status: string;
}

interface FeedStatus {
  last_update: string;
  indicators_fetched: number;
  status: string;
  update_time?: number;
  error?: string;
}

export function ThreatIntelligenceDashboard() {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [campaigns, setCampaigns] = useState<ThreatCampaign[]>([]);
  const [feedStatus, setFeedStatus] = useState<Record<string, FeedStatus>>({});
  const [selectedIndicator, setSelectedIndicator] = useState<ThreatIndicator | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Initial data generation
  useEffect(() => {
    // Generate initial data
    generateInitialData();
    updateFeedStatus();
    updateCampaigns();

    // Set up real-time updates
    const interval = setInterval(() => {
      generateNewIndicators();
      updateFeedStatus();
      updateCampaigns();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const generateInitialData = () => {
    const indicatorTypes = ['ip', 'domain', 'hash', 'url', 'email'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const sources = ['misp', 'taxii', 'virustotal', 'alienvault', 'openai_threat'];
    const tags = ['malware', 'apt', 'phishing', 'botnet', 'ransomware', 'c2', 'trojan'];

    const initialIndicators = Array.from({ length: 50 }, (_, index) => {
      const type = indicatorTypes[Math.floor(Math.random() * indicatorTypes.length)];
      const baseTime = Date.now() - (index * 60 * 1000); // Spread over last hour
      
      return {
        indicator_id: `ind_${baseTime}_${Math.random().toString(36).substr(2, 9)}`,
        indicator_type: type,
        value: generateIndicatorValue(type),
        confidence: Math.random() * 0.4 + 0.6,
        severity: severities[Math.floor(Math.random() * severities.length)],
        first_seen: new Date(baseTime).toISOString(),
        last_seen: new Date(baseTime + Math.random() * 60 * 1000).toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)],
        tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
        reputation_score: Math.random() * 0.3 + 0.7
      };
    });

    setIndicators(initialIndicators);
  };

  const generateNewIndicators = () => {
    const indicatorTypes = ['ip', 'domain', 'hash', 'url', 'email'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const sources = ['misp', 'taxii', 'virustotal', 'alienvault', 'openai_threat'];
    const tags = ['malware', 'apt', 'phishing', 'botnet', 'ransomware', 'c2', 'trojan'];

    const newIndicators = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => {
      const type = indicatorTypes[Math.floor(Math.random() * indicatorTypes.length)];
      return {
        indicator_id: `ind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        indicator_type: type,
        value: generateIndicatorValue(type),
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
        severity: severities[Math.floor(Math.random() * severities.length)],
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)],
        tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
        reputation_score: Math.random() * 0.3 + 0.7 // 0.7-1.0
      };
    });

    setIndicators(prev => [...newIndicators, ...prev.slice(0, 99)]);
  };

  const generateIndicatorValue = (type: string): string => {
    switch (type) {
      case 'ip':
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      case 'domain':
        const domains = ['malicious-site.com', 'evil-domain.net', 'threat-actor.org', 'c2-server.info', 'phishing-bank.com'];
        return domains[Math.floor(Math.random() * domains.length)];
      case 'hash':
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      case 'url':
        return `http://malware-${Math.floor(Math.random() * 1000)}.example.com/payload`;
      case 'email':
        return `attacker${Math.floor(Math.random() * 100)}@malicious.com`;
      default:
        return 'unknown';
    }
  };

  const updateFeedStatus = () => {
    const feeds = ['misp', 'taxii', 'openai_threat', 'virustotal', 'alienvault'];
    const newStatus: Record<string, FeedStatus> = {};

    feeds.forEach(feed => {
      const isHealthy = Math.random() > 0.1; // 90% chance of healthy
      newStatus[feed] = {
        last_update: new Date().toISOString(),
        indicators_fetched: Math.floor(Math.random() * 50) + 10,
        status: isHealthy ? 'healthy' : 'error',
        update_time: Math.random() * 5 + 1,
        error: isHealthy ? undefined : 'Connection timeout'
      };
    });

    setFeedStatus(newStatus);
  };

  const updateCampaigns = () => {
    if (Math.random() > 0.7) { // 30% chance to add new campaign
      const threatActors = ['APT29', 'Lazarus Group', 'FIN7', 'Carbanak', 'APT1'];
      const sectors = ['finance', 'healthcare', 'government', 'technology', 'energy'];
      const vectors = ['phishing', 'malware', 'exploit_kit', 'watering_hole', 'supply_chain'];

      const newCampaign: ThreatCampaign = {
        campaign_id: `camp_${Date.now()}`,
        name: `Campaign ${Math.floor(Math.random() * 1000)}`,
        threat_actor: threatActors[Math.floor(Math.random() * threatActors.length)],
        start_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        targeted_sectors: sectors.slice(0, Math.floor(Math.random() * 3) + 1),
        attack_vectors: vectors.slice(0, Math.floor(Math.random() * 2) + 1),
        confidence: Math.random() * 0.3 + 0.7,
        status: Math.random() > 0.3 ? 'active' : 'dormant'
      };

      setCampaigns(prev => [newCampaign, ...prev.slice(0, 19)]);
    }
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
      case 'healthy': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getIndicatorIcon = (type: string) => {
    switch (type) {
      case 'ip': return <Globe className="h-4 w-4" />;
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'hash': return <Hash className="h-4 w-4" />;
      case 'url': return <ExternalLink className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         indicator.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = filterSeverity === 'all' || indicator.severity === filterSeverity;
    const matchesType = filterType === 'all' || indicator.indicator_type === filterType;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  // Calculate statistics
  const indicatorsByType = indicators.reduce((acc, ind) => {
    acc[ind.indicator_type] = (acc[ind.indicator_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const indicatorsBySeverity = indicators.reduce((acc, ind) => {
    acc[ind.severity] = (acc[ind.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceStats = Object.entries(feedStatus).map(([source, status]) => ({
    source,
    indicators: status.indicators_fetched,
    status: status.status,
    updateTime: status.update_time || 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Indicators</CardTitle>
            <Database className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{indicators.length.toLocaleString()}</div>
            <p className="text-xs text-blue-200">
              {indicators.filter(i => new Date(i.first_seen) > new Date(Date.now() - 24*60*60*1000)).length} new today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-red-200">
              {campaigns.length} total campaigns tracked
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Feed Health</CardTitle>
            <Activity className="h-4 w-4 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Object.values(feedStatus).filter(f => f.status === 'healthy').length}/{Object.keys(feedStatus).length}
            </div>
            <p className="text-xs text-green-200">Feeds operational</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">High Confidence</CardTitle>
            <Brain className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {indicators.filter(i => i.confidence > 0.8).length}
            </div>
            <p className="text-xs text-purple-200">High confidence indicators</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="indicators" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="indicators" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Indicators
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="feeds" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Feeds
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Indicators List */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Threat Indicators</CardTitle>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search indicators..."
                        className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <select
                        className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                      >
                        <option value="all">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <select
                        className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="all">All Types</option>
                        <option value="ip">IP Address</option>
                        <option value="domain">Domain</option>
                        <option value="hash">Hash</option>
                        <option value="url">URL</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {filteredIndicators.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                          No indicators match the current filters
                        </div>
                      ) : (
                        filteredIndicators.map((indicator) => (
                          <div
                            key={indicator.indicator_id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedIndicator?.indicator_id === indicator.indicator_id
                                ? 'border-blue-500 bg-blue-950/20'
                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                            }`}
                            onClick={() => setSelectedIndicator(indicator)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getIndicatorIcon(indicator.indicator_type)}
                                <Badge className={getSeverityColor(indicator.severity)}>
                                  {indicator.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {indicator.indicator_type.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{indicator.source}</span>
                                <span className="text-xs text-green-400">
                                  {(indicator.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>

                            <div className="text-sm mb-2">
                              <div className="font-mono text-cyan-400 mb-1">
                                {indicator.value}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {indicator.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-between text-xs text-slate-400">
                              <span>First seen: {new Date(indicator.first_seen).toLocaleString()}</span>
                              <span>Reputation: {(indicator.reputation_score * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Indicator Details */}
            <div>
              {selectedIndicator ? (
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader>
                    <CardTitle>Indicator Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-cyan-400">Basic Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Type:</span>
                            <span>{selectedIndicator.indicator_type.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Value:</span>
                            <span className="font-mono text-cyan-400 break-all">
                              {selectedIndicator.value}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Severity:</span>
                            <Badge className={getSeverityColor(selectedIndicator.severity)}>
                              {selectedIndicator.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Source:</span>
                            <span>{selectedIndicator.source}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-green-400">Confidence & Reputation</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Confidence</span>
                              <span>{(selectedIndicator.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={selectedIndicator.confidence * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Reputation Score</span>
                              <span>{(selectedIndicator.reputation_score * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={selectedIndicator.reputation_score * 100} className="h-2" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-purple-400">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedIndicator.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-yellow-400">Timeline</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">First Seen:</span>
                            <span>{new Date(selectedIndicator.first_seen).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Last Seen:</span>
                            <span>{new Date(selectedIndicator.last_seen).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button className="w-full bg-red-600 hover:bg-red-700">
                          Block Indicator
                        </Button>
                        <Button variant="outline" className="w-full">
                          Export to SIEM
                        </Button>
                        <Button variant="outline" className="w-full">
                          Create Hunt Query
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-slate-400">
                      <Search className="h-8 w-8 mx-auto mb-2" />
                      <p>Select an indicator to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Active Threat Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {campaigns.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        No active campaigns detected
                      </div>
                    ) : (
                      campaigns.map((campaign) => (
                        <div
                          key={campaign.campaign_id}
                          className="p-3 rounded-lg border border-slate-700 bg-slate-800"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={campaign.status === 'active' ? 'bg-red-600' : 'bg-yellow-600'}>
                                {campaign.status.toUpperCase()}
                              </Badge>
                              <span className="font-medium text-orange-400">{campaign.name}</span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {(campaign.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>

                          <div className="text-sm mb-2">
                            <div className="text-red-400 mb-1">
                              Threat Actor: {campaign.threat_actor}
                            </div>
                            <div className="text-slate-300">
                              Started: {new Date(campaign.start_date).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-xs text-slate-400">Targeted Sectors:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {campaign.targeted_sectors.map((sector, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {sector}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-slate-400">Attack Vectors:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {campaign.attack_vectors.map((vector, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {vector}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Campaign Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-cyan-400">Campaign Status Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: campaigns.filter(c => c.status === 'active').length },
                            { name: 'Dormant', value: campaigns.filter(c => c.status === 'dormant').length },
                            { name: 'Concluded', value: campaigns.filter(c => c.status === 'concluded').length }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3 text-green-400">Top Threat Actors</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        campaigns.reduce((acc, c) => {
                          acc[c.threat_actor] = (acc[c.threat_actor] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).slice(0, 5).map(([actor, count]) => (
                        <div key={actor} className="flex justify-between items-center">
                          <span className="text-sm">{actor}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feeds" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Feed Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(feedStatus).map(([feedName, status]) => (
                    <div key={feedName} className="p-3 rounded-lg border border-slate-700 bg-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            status.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <span className="font-medium capitalize">{feedName}</span>
                        </div>
                        <Badge className={status.status === 'healthy' ? 'bg-green-600' : 'bg-red-600'}>
                          {status.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Last Update:</span>
                          <div>{new Date(status.last_update).toLocaleTimeString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Indicators Fetched:</span>
                          <div className="text-green-400">{status.indicators_fetched}</div>
                        </div>
                        {status.update_time && (
                          <div>
                            <span className="text-slate-400">Update Time:</span>
                            <div>{status.update_time.toFixed(2)}s</div>
                          </div>
                        )}
                        {status.error && (
                          <div>
                            <span className="text-slate-400">Error:</span>
                            <div className="text-red-400">{status.error}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Feed Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="source" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="indicators" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Indicator Type Distribution */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Indicator Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(indicatorsByType).map(([type, count]) => ({
                        name: type.toUpperCase(),
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(indicatorsByType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(indicatorsBySeverity).map(([severity, count]) => ({
                    severity: severity.toUpperCase(),
                    count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="severity" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="count" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Timeline Analysis */}
            <Card className="bg-slate-900 border-slate-700 lg:col-span-2">
              <CardHeader>
                <CardTitle>Threat Intelligence Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={
                    Array.from({ length: 24 }, (_, i) => {
                      const hour = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
                      const hourIndicators = indicators.filter(ind => {
                        const indHour = new Date(ind.first_seen);
                        return indHour.getHours() === hour.getHours() && 
                               indHour.getDate() === hour.getDate();
                      });
                      
                      return {
                        time: hour.toLocaleTimeString([], { hour: '2-digit' }),
                        indicators: hourIndicators.length,
                        critical: hourIndicators.filter(i => i.severity === 'critical').length,
                        high: hourIndicators.filter(i => i.severity === 'high').length
                      };
                    })
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Area type="monotone" dataKey="indicators" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="critical" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.5} />
                    <Area type="monotone" dataKey="high" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}