import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Shield, Lock, Eye, EyeOff, Key, Database, Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Activity, Settings } from 'lucide-react';

interface AnalyticsQuery {
  query_id: string;
  query_type: string;
  data_source: string;
  user_id: string;
  privacy_cost: number;
  approved: boolean;
  timestamp: string;
  noise_added: number;
  result: any;
}

interface PrivacyBudget {
  user_id: string;
  dataset: string;
  total_budget: number;
  consumed_budget: number;
  remaining_budget: number;
}

interface HomomorphicDemo {
  original_values: number[];
  encrypted_sum: number;
  homomorphic_sum: number;
  verification: boolean;
}

export function PrivacyAnalyticsDashboard() {
  const [pendingQueries, setPendingQueries] = useState<AnalyticsQuery[]>([]);
  const [completedQueries, setCompletedQueries] = useState<AnalyticsQuery[]>([]);
  const [privacyBudgets, setPrivacyBudgets] = useState<PrivacyBudget[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<AnalyticsQuery | null>(null);
  const [differentialPrivacyEnabled, setDifferentialPrivacyEnabled] = useState(true);
  const [homomorphicEnabled, setHomomorphicEnabled] = useState(true);
  const [epsilonValue, setEpsilonValue] = useState([1.0]);
  const [deltaValue, setDeltaValue] = useState([0.00001]);

  // Demo states
  const [homomorphicDemo, setHomomorphicDemo] = useState<HomomorphicDemo | null>(null);
  const [secretSharingDemo, setSecretSharingDemo] = useState<any>(null);

  useEffect(() => {
    // Initialize with sample data
    initializeSampleData();
    
    // Real-time updates
    const interval = setInterval(() => {
      generateNewQuery();
      updatePrivacyBudgets();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const initializeSampleData = () => {
    // Initialize privacy budgets
    const initialBudgets: PrivacyBudget[] = [
      {
        user_id: 'analyst_001',
        dataset: 'network_logs',
        total_budget: 10.0,
        consumed_budget: 2.3,
        remaining_budget: 7.7
      },
      {
        user_id: 'analyst_002',
        dataset: 'user_behavior',
        total_budget: 8.0,
        consumed_budget: 5.1,
        remaining_budget: 2.9
      },
      {
        user_id: 'researcher_001',
        dataset: 'threat_intelligence',
        total_budget: 15.0,
        consumed_budget: 1.8,
        remaining_budget: 13.2
      }
    ];

    setPrivacyBudgets(initialBudgets);

    // Initialize completed queries
    const initialQueries: AnalyticsQuery[] = [
      {
        query_id: 'query_001',
        query_type: 'count',
        data_source: 'network_logs',
        user_id: 'analyst_001',
        privacy_cost: 0.5,
        approved: true,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        noise_added: 2.3,
        result: 1247
      },
      {
        query_id: 'query_002',
        query_type: 'mean',
        data_source: 'user_behavior',
        user_id: 'analyst_002',
        privacy_cost: 0.8,
        approved: true,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        noise_added: 0.15,
        result: 45.67
      }
    ];

    setCompletedQueries(initialQueries);
  };

  const generateNewQuery = () => {
    if (Math.random() > 0.7) { // 30% chance of new query
      const queryTypes = ['count', 'mean', 'histogram', 'correlation'];
      const dataSources = ['network_logs', 'user_behavior', 'threat_intelligence', 'system_metrics'];
      const users = ['analyst_001', 'analyst_002', 'researcher_001', 'admin_001'];

      const newQuery: AnalyticsQuery = {
        query_id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        query_type: queryTypes[Math.floor(Math.random() * queryTypes.length)],
        data_source: dataSources[Math.floor(Math.random() * dataSources.length)],
        user_id: users[Math.floor(Math.random() * users.length)],
        privacy_cost: Math.random() * 2 + 0.1,
        approved: false,
        timestamp: new Date().toISOString(),
        noise_added: 0,
        result: null
      };

      setPendingQueries(prev => [newQuery, ...prev.slice(0, 9)]);
    }
  };

  const updatePrivacyBudgets = () => {
    setPrivacyBudgets(prev => prev.map(budget => ({
      ...budget,
      consumed_budget: Math.min(budget.total_budget, budget.consumed_budget + Math.random() * 0.1),
      remaining_budget: Math.max(0, budget.total_budget - budget.consumed_budget)
    })));
  };

  const approveQuery = (queryId: string) => {
    const query = pendingQueries.find(q => q.query_id === queryId);
    if (!query) return;

    // Simulate query execution with privacy noise
    const updatedQuery = {
      ...query,
      approved: true,
      noise_added: Math.random() * 5 + 1,
      result: generateQueryResult(query.query_type)
    };

    // Move to completed queries
    setCompletedQueries(prev => [updatedQuery, ...prev.slice(0, 19)]);
    setPendingQueries(prev => prev.filter(q => q.query_id !== queryId));

    // Update privacy budget
    setPrivacyBudgets(prev => prev.map(budget => {
      if (budget.user_id === query.user_id) {
        return {
          ...budget,
          consumed_budget: budget.consumed_budget + query.privacy_cost,
          remaining_budget: Math.max(0, budget.remaining_budget - query.privacy_cost)
        };
      }
      return budget;
    }));
  };

  const rejectQuery = (queryId: string) => {
    setPendingQueries(prev => prev.filter(q => q.query_id !== queryId));
  };

  const generateQueryResult = (queryType: string) => {
    switch (queryType) {
      case 'count':
        return Math.floor(Math.random() * 10000) + 100;
      case 'mean':
        return (Math.random() * 100).toFixed(2);
      case 'histogram':
        return Array.from({ length: 10 }, () => Math.floor(Math.random() * 50));
      case 'correlation':
        return (Math.random() * 2 - 1).toFixed(3);
      default:
        return 'Unknown result';
    }
  };

  const runHomomorphicDemo = () => {
    const values = [10, 20, 30, 40, 50];
    const actualSum = values.reduce((a, b) => a + b, 0);
    
    // Simulate homomorphic encryption (simplified)
    const demo: HomomorphicDemo = {
      original_values: values,
      encrypted_sum: actualSum + Math.floor(Math.random() * 10 - 5), // Simulate slight difference
      homomorphic_sum: actualSum,
      verification: true
    };

    setHomomorphicDemo(demo);
  };

  const runSecretSharingDemo = () => {
    const secret = 42;
    const shares = [
      { party: 'Node A', share: 23 },
      { party: 'Node B', share: 35 },
      { party: 'Node C', share: 17 }
    ];
    const reconstructed = 42; // Simplified

    setSecretSharingDemo({
      original_secret: secret,
      shares: shares,
      reconstructed_secret: reconstructed,
      verification: secret === reconstructed
    });
  };

  const getBudgetColor = (percentage: number) => {
    if (percentage > 70) return 'text-green-400';
    if (percentage > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQueryStatusColor = (approved: boolean) => {
    return approved ? 'bg-green-600' : 'bg-yellow-600';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            Privacy-Preserving Analytics Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-400" />
                <span className="text-sm">Differential Privacy</span>
              </div>
              <Switch
                checked={differentialPrivacyEnabled}
                onCheckedChange={setDifferentialPrivacyEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-400" />
                <span className="text-sm">Homomorphic Encryption</span>
              </div>
              <Switch
                checked={homomorphicEnabled}
                onCheckedChange={setHomomorphicEnabled}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Epsilon (ε): {epsilonValue[0]}</label>
              <Slider
                value={epsilonValue}
                onValueChange={setEpsilonValue}
                max={5}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Delta (δ): {deltaValue[0]}</label>
              <Slider
                value={deltaValue}
                onValueChange={setDeltaValue}
                max={0.001}
                min={0.00001}
                step={0.00001}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Pending Queries</CardTitle>
            <Clock className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingQueries.length}</div>
            <p className="text-xs text-blue-200">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Completed Queries</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{completedQueries.length}</div>
            <p className="text-xs text-green-200">Privacy preserved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{privacyBudgets.length}</div>
            <p className="text-xs text-purple-200">With privacy budgets</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Privacy Budget Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {((privacyBudgets.reduce((sum, b) => sum + b.consumed_budget, 0) / 
                 privacyBudgets.reduce((sum, b) => sum + b.total_budget, 1)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-orange-200">Overall consumption</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="queries" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="queries" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Query Management
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Privacy Budgets
          </TabsTrigger>
          <TabsTrigger value="homomorphic" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Homomorphic Encryption
          </TabsTrigger>
          <TabsTrigger value="multiparty" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Secure Multi-Party
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Privacy Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Queries */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  Pending Query Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {pendingQueries.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        No pending queries
                      </div>
                    ) : (
                      pendingQueries.map((query) => (
                        <div
                          key={query.query_id}
                          className="p-3 rounded-lg border border-slate-700 bg-slate-800"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {query.query_type.toUpperCase()}
                              </Badge>
                              <Badge className="bg-yellow-600">
                                PENDING
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(query.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="text-sm mb-3">
                            <div className="text-cyan-400 mb-1">
                              Query ID: {query.query_id}
                            </div>
                            <div className="text-slate-300">
                              User: {query.user_id} | Dataset: {query.data_source}
                            </div>
                            <div className="text-orange-400">
                              Privacy Cost: ε = {query.privacy_cost.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveQuery(query.query_id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-950"
                              onClick={() => rejectQuery(query.query_id)}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Completed Queries */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Completed Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {completedQueries.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        No completed queries
                      </div>
                    ) : (
                      completedQueries.map((query) => (
                        <div
                          key={query.query_id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedQuery?.query_id === query.query_id
                              ? 'border-blue-500 bg-blue-950/20'
                              : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                          }`}
                          onClick={() => setSelectedQuery(query)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {query.query_type.toUpperCase()}
                              </Badge>
                              <Badge className="bg-green-600">
                                COMPLETED
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(query.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="text-sm mb-2">
                            <div className="text-cyan-400 mb-1">
                              Result: {JSON.stringify(query.result)}
                            </div>
                            <div className="text-slate-300">
                              User: {query.user_id} | Dataset: {query.data_source}
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-orange-400">
                                Privacy Cost: ε = {query.privacy_cost.toFixed(2)}
                              </span>
                              <span className="text-purple-400">
                                Noise Added: {query.noise_added.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Privacy Budget Status */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Privacy Budget Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {privacyBudgets.map((budget) => (
                    <div key={`${budget.user_id}_${budget.dataset}`} className="p-3 rounded-lg border border-slate-700 bg-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="font-medium">{budget.user_id}</span>
                        </div>
                        <Badge variant="secondary">{budget.dataset}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Budget:</span>
                          <span className="text-green-400">ε = {budget.total_budget.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Consumed:</span>
                          <span className="text-red-400">ε = {budget.consumed_budget.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining:</span>
                          <span className={getBudgetColor((budget.remaining_budget / budget.total_budget) * 100)}>
                            ε = {budget.remaining_budget.toFixed(1)}
                          </span>
                        </div>
                        
                        <Progress 
                          value={(budget.consumed_budget / budget.total_budget) * 100} 
                          className="h-2 mt-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Budget Usage Analytics */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Budget Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={privacyBudgets.map(budget => ({
                    user: budget.user_id.split('_')[0],
                    consumed: budget.consumed_budget,
                    remaining: budget.remaining_budget
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="user" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="consumed" stackId="budget" fill="#EF4444" name="Consumed" />
                    <Bar dataKey="remaining" stackId="budget" fill="#10B981" name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="homomorphic" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Homomorphic Encryption Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Demonstrate secure computation on encrypted data without decryption.
                  </p>
                  
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={runHomomorphicDemo}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Run Homomorphic Demo
                  </Button>

                  {homomorphicDemo && (
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-3 text-purple-400">Demo Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original Values:</span>
                          <span className="text-cyan-400">[{homomorphicDemo.original_values.join(', ')}]</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expected Sum:</span>
                          <span className="text-green-400">{homomorphicDemo.original_values.reduce((a, b) => a + b, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Homomorphic Sum:</span>
                          <span className="text-blue-400">{homomorphicDemo.homomorphic_sum}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verification:</span>
                          <Badge className={homomorphicDemo.verification ? 'bg-green-600' : 'bg-red-600'}>
                            {homomorphicDemo.verification ? 'PASSED' : 'FAILED'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-green-400">Use Cases</h4>
                    <ul className="text-sm space-y-1 text-slate-300">
                      <li>• Secure aggregation of sensitive metrics</li>
                      <li>• Privacy-preserving machine learning</li>
                      <li>• Encrypted database queries</li>
                      <li>• Secure multi-party computation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Encryption Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-cyan-400">Operation Benchmarks</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Encryption</span>
                        <div className="flex items-center gap-2">
                          <Progress value={75} className="w-24 h-2" />
                          <span className="text-xs text-slate-400">2.3ms</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Decryption</span>
                        <div className="flex items-center gap-2">
                          <Progress value={60} className="w-24 h-2" />
                          <span className="text-xs text-slate-400">1.8ms</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Addition</span>
                        <div className="flex items-center gap-2">
                          <Progress value={85} className="w-24 h-2" />
                          <span className="text-xs text-slate-400">3.1ms</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Multiplication</span>
                        <div className="flex items-center gap-2">
                          <Progress value={45} className="w-24 h-2" />
                          <span className="text-xs text-slate-400">1.2ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-yellow-400">Security Properties</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Key Size:</span>
                        <span className="text-green-400">2048 bits</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security Level:</span>
                        <span className="text-green-400">112 bits</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantum Resistant:</span>
                        <Badge className="bg-red-600">NO</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="multiparty" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Secret Sharing Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Demonstrate secure multi-party computation using secret sharing.
                  </p>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={runSecretSharingDemo}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Run Secret Sharing Demo
                  </Button>

                  {secretSharingDemo && (
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-3 text-green-400">Demo Results</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Original Secret:</span>
                          <span className="text-cyan-400">{secretSharingDemo.original_secret}</span>
                        </div>
                        
                        <div>
                          <span className="text-slate-400">Secret Shares:</span>
                          <div className="mt-1 space-y-1">
                            {secretSharingDemo.shares.map((share: any, index: number) => (
                              <div key={index} className="flex justify-between pl-4">
                                <span>{share.party}:</span>
                                <span className="text-purple-400">{share.share}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <span>Reconstructed:</span>
                          <span className="text-blue-400">{secretSharingDemo.reconstructed_secret}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verification:</span>
                          <Badge className={secretSharingDemo.verification ? 'bg-green-600' : 'bg-red-600'}>
                            {secretSharingDemo.verification ? 'PASSED' : 'FAILED'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-orange-400">Protocol Properties</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div>• Threshold: 2 out of 3 shares needed</div>
                      <div>• Information-theoretic security</div>
                      <div>• No single point of failure</div>
                      <div>• Supports arithmetic operations</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Federated Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-blue-400">Node Statistics</h4>
                    <div className="space-y-3">
                      {[
                        { node: 'Node A', samples: 1250, contribution: 35 },
                        { node: 'Node B', samples: 980, contribution: 28 },
                        { node: 'Node C', samples: 1340, contribution: 37 }
                      ].map((node, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{node.node}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{node.samples} samples</span>
                            <div className="flex items-center gap-1">
                              <Progress value={node.contribution} className="w-12 h-2" />
                              <span className="text-xs">{node.contribution}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-purple-400">Aggregation Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Nodes:</span>
                        <span className="text-green-400">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Nodes:</span>
                        <span className="text-green-400">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Aggregation:</span>
                        <span className="text-cyan-400">2 min ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Privacy Budget:</span>
                        <span className="text-yellow-400">ε = 0.5</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Activity className="h-4 w-4 mr-2" />
                    Start Federated Computation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Type Distribution */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Query Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Count', value: completedQueries.filter(q => q.query_type === 'count').length },
                        { name: 'Mean', value: completedQueries.filter(q => q.query_type === 'mean').length },
                        { name: 'Histogram', value: completedQueries.filter(q => q.query_type === 'histogram').length },
                        { name: 'Correlation', value: completedQueries.filter(q => q.query_type === 'correlation').length }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Privacy Cost Analysis */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Privacy Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={completedQueries.slice(-10).map((query, index) => ({
                    query: index + 1,
                    privacy_cost: query.privacy_cost,
                    noise_added: query.noise_added
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="query" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="privacy_cost" 
                      stroke="#EF4444" 
                      strokeWidth={2} 
                      name="Privacy Cost (ε)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="noise_added" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                      name="Noise Added" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overall Privacy Metrics */}
            <Card className="bg-slate-900 border-slate-700 lg:col-span-2">
              <CardHeader>
                <CardTitle>Privacy Preservation Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {((completedQueries.length / (completedQueries.length + pendingQueries.length)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-400">Query Success Rate</div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {completedQueries.length > 0 ? 
                        (completedQueries.reduce((sum, q) => sum + q.privacy_cost, 0) / completedQueries.length).toFixed(2) : 
                        '0.00'
                      }
                    </div>
                    <div className="text-sm text-slate-400">Avg Privacy Cost (ε)</div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {completedQueries.length > 0 ? 
                        (completedQueries.reduce((sum, q) => sum + q.noise_added, 0) / completedQueries.length).toFixed(2) : 
                        '0.00'
                      }
                    </div>
                    <div className="text-sm text-slate-400">Avg Noise Level</div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {privacyBudgets.filter(b => b.remaining_budget > 0).length}
                    </div>
                    <div className="text-sm text-slate-400">Active Budget Holders</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}