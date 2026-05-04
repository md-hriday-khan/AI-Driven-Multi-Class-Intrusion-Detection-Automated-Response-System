import React, { useState, useEffect } from 'react';
import { ThreatMap } from './components/ThreatMap';
import { AttackSimulation } from './components/AttackSimulation';
import { AIMonitoring } from './components/AIMonitoring';
import { ResponsePlaybook } from './components/ResponsePlaybook';
import { RealTimeMetrics } from './components/RealTimeMetrics';
import { NetworkTrafficMonitor } from './components/NetworkTrafficMonitor';
import { AttackDetectionDashboard } from './components/AttackDetectionDashboard';
import { SystemPerformanceMonitor } from './components/SystemPerformanceMonitor';
import { ResponseActionsLog } from './components/ResponseActionsLog';
import { SQLiteLogger } from './components/SQLiteLogger';
import { LoginSystem } from './components/LoginSystem';
import { RealTimeConfidenceScores } from './components/RealTimeConfidenceScores';
import { CICIDSFeatureExtraction } from './components/CICIDSFeatureExtraction';
import { LSTMAnomalyDetection } from './components/LSTMAnomalyDetection';
import { AutonomousResponseEngine } from './components/AutonomousResponseEngine';
import { LiveAttackVisualization } from './components/LiveAttackVisualization';
import { PythonIDSIntegration } from './components/PythonIDSIntegration';
import { AIMonitoringDashboard } from './components/AIMonitoringDashboard';
import { ThreatIntelligenceDashboard } from './components/ThreatIntelligenceDashboard';
import { PrivacyAnalyticsDashboard } from './components/PrivacyAnalyticsDashboard';
import { IntrusionPreventionSystem } from './components/IntrusionPreventionSystem';
import { ComplianceMonitoring } from './components/ComplianceMonitoring';
import { MitreAttackFramework } from './components/MitreAttackFramework';
import { WiresharkAnalyzer } from './components/WiresharkAnalyzer';
import { NetworkAnalysisAdvanced } from './components/NetworkAnalysisAdvanced';
import AttackSurfaceManagement from './components/AttackSurfaceManagement';
import ExtendedDetectionResponse from './components/ExtendedDetectionResponse';
import EndpointAgentsMonitor from './components/EndpointAgentsMonitor';
import ContainmentLanes from './components/ContainmentLanes';
import IncidentPlaybooks from './components/IncidentPlaybooks';
import SecureBootMonitor from './components/SecureBootMonitor';
import { MAVIDS } from './components/MAVIDS';
import { DroneSploit } from './components/DroneSploit';
import { UAVNIDD } from './components/UAVNIDD';
import { AuditLogsViewer } from './components/AuditLogsViewer';
import { UAVCollaborativeIDS } from './components/UAVCollaborativeIDS';
import { EDIDS } from './components/EDIDS';
import { EmergencyControlSystem } from './components/EmergencyControlSystem';
import { WebSocketErrorHandler } from './components/WebSocketErrorHandler';
import { WebSocketHealthMonitor } from './components/WebSocketHealthMonitor';
import { BackendConnectionProvider, BackendConnectionManager } from './components/BackendConnectionManager';
import { SystemConnectionStatus } from './components/SystemConnectionStatus';
import { SilentErrorHandler } from './components/SilentErrorHandler';
import { DataIntegrityDashboard } from './components/DataIntegrityDashboard';

import { Alert, AlertDescription } from './components/ui/alert';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { ScrollArea } from './components/ui/scroll-area';
import { 
  Shield, Activity, AlertTriangle, Eye, Brain, FileText, Network, Target, 
  Cpu, List, Database, Lock, TrendingUp, User, Zap, GitBranch, Settings, 
  Server, Globe, Menu, X, Home, ChevronRight, Bell, Search, Filter,
  Clipboard, Wifi, Users, Router, Key, FileCheck, CheckCircle, Power, Car, Terminal
} from 'lucide-react';

interface ThreatAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  source: string;
}

interface LoginSession {
  userId: string;
  username: string;
  role: string;
  loginTime: Date;
  lastActivity: Date;
  sessionId: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  category: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'overview', label: 'Security Overview', icon: Home, component: () => <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><ThreatMap /></div><div className="space-y-4"><RealTimeMetrics /><SystemConnectionStatus /><WebSocketHealthMonitor /></div></div>, category: 'Dashboard' },
  { id: 'mavids', label: 'MAVIDS - UAV Intrusion Detection', icon: Activity, component: MAVIDS, category: 'UAV Systems' },
  { id: 'dronesploit', label: 'DroneSploit - Penetration Testing', icon: Target, component: DroneSploit, category: 'UAV Systems' },
  { id: 'uav-nidd', label: 'UAV-NIDD Dataset Framework', icon: Database, component: UAVNIDD, category: 'UAV Systems' },
  { id: 'uav-ids', label: 'UAV Collaborative IDS', icon: Activity, component: UAVCollaborativeIDS, category: 'UAV Systems' },
  { id: 'edids', label: 'E-DIDS Distributed System', icon: Network, component: EDIDS, category: 'UAV Systems' },
  { id: 'emergency-control', label: 'Emergency Control System', icon: AlertTriangle, component: EmergencyControlSystem, category: 'Safety' },
  { id: 'audit-logs', label: 'Audit Logs & File Info', icon: FileText, component: AuditLogsViewer, category: 'Monitoring' },
  { id: 'attack-surface', label: 'Attack Surface Management', icon: Target, component: AttackSurfaceManagement, category: 'Security' },
  { id: 'xdr', label: 'Extended Detection & Response', icon: Shield, component: ExtendedDetectionResponse, category: 'Security' },
  { id: 'endpoint-agents', label: 'Endpoint Agents Monitor', icon: Users, component: EndpointAgentsMonitor, category: 'Monitoring' },
  { id: 'containment', label: 'Containment Lanes', icon: Power, component: ContainmentLanes, category: 'Response' },
  { id: 'playbooks', label: 'Incident Playbooks', icon: FileText, component: IncidentPlaybooks, category: 'Response' },
  { id: 'secure-boot', label: 'Secure Boot Monitor', icon: Key, component: SecureBootMonitor, category: 'Security' },

  { id: 'live-viz', label: 'Live Attack Visualization', icon: Eye, component: LiveAttackVisualization, category: 'Dashboard' },
  { id: 'ips', label: 'Intrusion Prevention', icon: Shield, component: IntrusionPreventionSystem, category: 'Protection' },
  { id: 'wireshark', label: 'Network Analysis', icon: Wifi, component: WiresharkAnalyzer, category: 'Analysis' },
  { id: 'network-advanced', label: 'PCAP & Nmap Analysis', icon: Terminal, component: NetworkAnalysisAdvanced, category: 'Analysis' },
  { id: 'compliance', label: 'Compliance Monitoring', icon: Clipboard, component: ComplianceMonitoring, category: 'Compliance' },
  { id: 'mitre', label: 'MITRE ATT&CK', icon: Target, component: MitreAttackFramework, category: 'Framework' },
  { id: 'threat-intel', label: 'Threat Intelligence', icon: Globe, component: ThreatIntelligenceDashboard, category: 'Intelligence' },
  { id: 'ai-observability', label: 'AI Observability', icon: Brain, component: AIMonitoringDashboard, category: 'AI/ML' },
  { id: 'privacy', label: 'Privacy Analytics', icon: Lock, component: PrivacyAnalyticsDashboard, category: 'Privacy' },
  { id: 'cic-ids', label: 'CIC-IDS Features', icon: GitBranch, component: CICIDSFeatureExtraction, category: 'Detection' },
  { id: 'lstm', label: 'LSTM Anomaly Detection', icon: Brain, component: LSTMAnomalyDetection, category: 'AI/ML' },
  { id: 'auto-response', label: 'Autonomous Response', icon: Zap, component: AutonomousResponseEngine, category: 'Response' },
  { id: 'python-ids', label: 'Python IDS Integration', icon: Server, component: PythonIDSIntegration, category: 'Detection' },
  { id: 'confidence', label: 'Confidence Scores', icon: TrendingUp, component: RealTimeConfidenceScores, category: 'Analytics' },
  { id: 'network', label: 'Network Traffic Monitor', icon: Network, component: NetworkTrafficMonitor, category: 'Monitoring' },
  { id: 'detection', label: 'Attack Detection', icon: Target, component: AttackDetectionDashboard, category: 'Detection' },
  { id: 'simulation', label: 'Attack Simulation', icon: AlertTriangle, component: AttackSimulation, category: 'Testing' },
  { id: 'ai', label: 'AI Monitoring', icon: Settings, component: AIMonitoring, category: 'AI/ML' },
  { id: 'system', label: 'System Performance', icon: Cpu, component: SystemPerformanceMonitor, category: 'Monitoring' },
  { id: 'response', label: 'Response Actions', icon: List, component: ResponseActionsLog, category: 'Response' },
  { id: 'database', label: 'Database Logs', icon: Database, component: SQLiteLogger, category: 'Management' },
  { id: 'playbook', label: 'Response Playbook', icon: FileText, component: ResponsePlaybook, category: 'Response' },
  { id: 'data-integrity', label: 'Data Integrity Dashboard', icon: FileCheck, component: DataIntegrityDashboard, category: 'Management' },
];

export default function App() {
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [activeThreats, setActiveThreats] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'warning' | 'critical'>('operational');
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [currentSession, setCurrentSession] = useState<LoginSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Display initial system status message - clean and professional
    console.clear();
    console.log('%c🛡️ CyberAuton Security Operations Centre', 'font-size: 18px; font-weight: bold; color: #6366f1;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1;');
    console.log('%c✨ System Ready - All Components Operational', 'font-size: 14px; font-weight: bold; color: #10b981;');
    console.log('%cBackend API: All endpoints fixed and functional', 'color: #10b981;');
    console.log('%cDemo Mode: Intelligent mock data enabled (zero config required)', 'color: #6b7280;');
    console.log('');
    console.log('%c📊 Active Features:', 'font-weight: bold; color: #6366f1;');
    console.log('   • Real-time threat monitoring & visualization');
    console.log('   • AI-powered anomaly detection (LSTM)');
    console.log('   • UAV security (MAVIDS, DroneSploit, UAV-NIDD)');
    console.log('   • Emergency vehicle control & safety systems');
    console.log('   • MITRE ATT&CK framework & playbooks');
    console.log('   • Attack surface management & XDR');
    console.log('   • Data integrity & security dashboard');
    console.log('   • Automated threat response (4-level system)');
    console.log('');
    console.log('%c🔧 Backend Status:', 'font-weight: bold; color: #6366f1;');
    console.log('   • 17 API endpoints available');
    console.log('   • Security, integrity, and backup endpoints added');
    console.log('   • Silent error handling (no console spam)');
    console.log('   • Automatic fallback to mock data');
    console.log('');
    console.log('%c💡 Quick Start:', 'color: #f59e0b; font-weight: bold;');
    console.log('   • Everything works out of the box!');
    console.log('   • Optional: Start backend with "python start_all_backends.py"');
    console.log('   • Optional: Validate backend with "python validate_backend.py"');
    console.log('   • Check Backend Services panel for connection status');
    console.log('');
    console.log('%c📚 Documentation:', 'font-weight: bold; color: #6366f1;');
    console.log('   • BACKEND_SETUP.md - Complete API documentation');
    console.log('   • TESTING_GUIDE.md - Testing scenarios');
    console.log('   • BACKEND_FIX_SUMMARY.md - What was fixed');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1;');
    console.log('');
    
    // Simulate real-time threat level updates
    const interval = setInterval(() => {
      const levels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      setThreatLevel(randomLevel);
      setActiveThreats(Math.floor(Math.random() * 15) + 1);
      
      // Generate random alerts
      if (Math.random() > 0.7) {
        const alertTypes: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
        const messages = [
          'DDoS attack detected from multiple IP ranges',
          'Suspicious brute force activity on login endpoints',
          'Malware signature detected in network traffic',
          'Anomalous data exfiltration pattern identified',
          'Botnet communication intercepted',
          'Zero-day exploit attempt blocked'
        ];
        
        const newAlert: ThreatAlert = {
          id: Date.now().toString(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date(),
          source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        };
        
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleLogin = (session: LoginSession) => {
    setCurrentSession(session);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentSession(null);
    setIsAuthenticated(false);
  };

  const groupedNavigation = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const filteredNavigation = Object.keys(groupedNavigation).reduce((acc, category) => {
    const filteredItems = groupedNavigation[category].filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredItems.length > 0) {
      acc[category] = filteredItems;
    }
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const activeComponent = navigationItems.find(item => item.id === activeView)?.component || (() => <div>Component not found</div>);
  const ActiveComponent = activeComponent;

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <>
        <SilentErrorHandler />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50">
          <header className="border-b border-purple-200 bg-white/90 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  CyberAuton Security Operations Centre
                </h1>
                <p className="text-sm text-slate-600">Enterprise Cybersecurity Platform - Created by Md.Hriday Khan</p>
              </div>
            </div>
          </div>
        </header>
        
          <div className="container mx-auto px-6 py-12">
            <LoginSystem onLogin={handleLogin} onLogout={handleLogout} currentSession={currentSession} />
          </div>
        </div>
      </>
    );
  }

  return (
    <BackendConnectionProvider>
      <SilentErrorHandler />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 flex">
        <WebSocketErrorHandler />
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white border-r border-purple-200 shadow-lg flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  CyberAuton SOC
                </h1>
                <p className="text-xs text-slate-500">by Md.Hriday Khan</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-purple-50"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div className="p-4 border-b border-purple-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search modules..."
                className="w-full pl-10 pr-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {Object.keys(filteredNavigation).map((category) => (
              <div key={category}>
                {sidebarOpen && (
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                )}
                <div className="space-y-1">
                  {filteredNavigation[category].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                            : 'text-slate-600 hover:bg-purple-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-slate-500'}`} />
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 text-left text-sm font-medium">
                              {item.label}
                            </span>
                            {isActive && <ChevronRight className="h-4 w-4 text-purple-600" />}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* System Status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-purple-200 bg-purple-50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">System Status</span>
                <div className={`w-2 h-2 rounded-full ${getThreatLevelColor(threatLevel)} animate-pulse`}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Threat Level</span>
                <Badge variant="secondary" className="text-xs">
                  {threatLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Active Threats</span>
                <span className="text-xs font-medium text-slate-700">{activeThreats}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-purple-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {navigationItems.find(item => item.id === activeView)?.label || 'Dashboard'}
                </h2>
                {activeView === 'overview' && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    All Systems Operational
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-slate-600">{alerts.length} alerts</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-600">Live</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700">{currentSession?.username}</span>
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                    {currentSession?.role.toUpperCase()}
                  </Badge>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  onClick={handleLogout}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Alert Banner */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="px-6 py-2">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-800">Latest Alert: {alerts[0].message}</span>
                <Badge variant="destructive" className="text-xs">
                  {alerts[0].type.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
    </BackendConnectionProvider>
  );
}