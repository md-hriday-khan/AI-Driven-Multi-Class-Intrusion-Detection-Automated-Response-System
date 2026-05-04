import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { 
  FileText, Download, Search, Filter, Eye, Calendar,
  User, Database, Lock, Shield, Activity, AlertTriangle,
  CheckCircle, XCircle, Clock, HardDrive, Wifi, Cpu
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'failure' | 'warning';
  ipAddress: string;
  userAgent: string;
  details: any;
  fileHash?: string;
  fileSize?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  permissions: string;
  owner: string;
  hash: string;
  type: string;
  encrypted: boolean;
  sensitive: boolean;
}

const auditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T14:30:22Z'),
    user: 'admin@shield.com',
    action: 'FILE_ACCESS',
    resource: '/secure/threat_intel/ioc_database.json',
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    details: { operation: 'read', bytes_read: 2048576 },
    fileHash: 'sha256:a1b2c3d4e5f6...',
    fileSize: 2048576,
    riskLevel: 'medium'
  },
  {
    id: '2',
    timestamp: new Date('2024-01-15T14:25:15Z'),
    user: 'security@shield.com',
    action: 'EXPORT_PCAP',
    resource: '/network/captures/suspicious_traffic.pcap',
    status: 'success',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Linux; Ubuntu)',
    details: { export_format: 'pcap', compression: 'gzip', duration: '1h' },
    fileHash: 'sha256:f7e8d9c0b1a2...',
    fileSize: 15728640,
    riskLevel: 'high'
  },
  {
    id: '3',
    timestamp: new Date('2024-01-15T14:20:10Z'),
    user: 'analyst@shield.com',
    action: 'MITRE_EXPORT',
    resource: '/frameworks/mitre_attack_matrix.xlsx',
    status: 'failure',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Mac OS X)',
    details: { error: 'Insufficient permissions', attempted_format: 'xlsx' },
    riskLevel: 'medium'
  },
  {
    id: '4',
    timestamp: new Date('2024-01-15T14:15:30Z'),
    user: 'system',
    action: 'BACKUP_CREATION',
    resource: '/backups/security_logs_20240115.tar.gz',
    status: 'success',
    ipAddress: '127.0.0.1',
    userAgent: 'SystemProcess/1.0',
    details: { backup_size: '5.2GB', compression_ratio: '68%', integrity_check: 'passed' },
    fileHash: 'sha256:9f8e7d6c5b4a...',
    fileSize: 5587456000,
    riskLevel: 'low'
  },
  {
    id: '5',
    timestamp: new Date('2024-01-15T14:10:45Z'),
    user: 'api_service',
    action: 'CONFIG_CHANGE',
    resource: '/config/security_policies.yaml',
    status: 'warning',
    ipAddress: '192.168.1.50',
    userAgent: 'APIClient/2.1',
    details: { 
      changed_fields: ['max_login_attempts', 'session_timeout'],
      old_values: { max_login_attempts: 3, session_timeout: 3600 },
      new_values: { max_login_attempts: 5, session_timeout: 7200 }
    },
    fileHash: 'sha256:c4d5e6f7a8b9...',
    fileSize: 4096,
    riskLevel: 'medium'
  }
];

const fileInfoDatabase: Record<string, FileInfo> = {
  '/secure/threat_intel/ioc_database.json': {
    name: 'ioc_database.json',
    path: '/secure/threat_intel/',
    size: 2048576,
    created: new Date('2024-01-10T09:00:00Z'),
    modified: new Date('2024-01-15T13:45:00Z'),
    accessed: new Date('2024-01-15T14:30:22Z'),
    permissions: 'rw-r-----',
    owner: 'security_team',
    hash: 'sha256:a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789ab',
    type: 'application/json',
    encrypted: true,
    sensitive: true
  },
  '/network/captures/suspicious_traffic.pcap': {
    name: 'suspicious_traffic.pcap',
    path: '/network/captures/',
    size: 15728640,
    created: new Date('2024-01-15T13:00:00Z'),
    modified: new Date('2024-01-15T14:00:00Z'),
    accessed: new Date('2024-01-15T14:25:15Z'),
    permissions: 'rw-------',
    owner: 'network_admin',
    hash: 'sha256:f7e8d9c0b1a23456789abcdef0123456789abcdef0123456789abcdef0123456',
    type: 'application/vnd.tcpdump.pcap',
    encrypted: false,
    sensitive: true
  },
  '/frameworks/mitre_attack_matrix.xlsx': {
    name: 'mitre_attack_matrix.xlsx',
    path: '/frameworks/',
    size: 1048576,
    created: new Date('2024-01-05T10:00:00Z'),
    modified: new Date('2024-01-14T16:30:00Z'),
    accessed: new Date('2024-01-15T14:20:10Z'),
    permissions: 'rw-r--r--',
    owner: 'threat_intel',
    hash: 'sha256:b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abc',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    encrypted: false,
    sensitive: false
  }
};

export function AuditLogsViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || log.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failure': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'FILE_ACCESS': return <FileText className="h-4 w-4" />;
      case 'EXPORT_PCAP': return <Download className="h-4 w-4" />;
      case 'MITRE_EXPORT': return <Shield className="h-4 w-4" />;
      case 'BACKUP_CREATION': return <HardDrive className="h-4 w-4" />;
      case 'CONFIG_CHANGE': return <Cpu className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const exportAuditLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportFileReport = (filePath: string) => {
    const fileInfo = fileInfoDatabase[filePath];
    if (!fileInfo) return;

    const report = {
      file_information: fileInfo,
      audit_trail: auditLogs.filter(log => log.resource === filePath),
      security_assessment: {
        risk_level: fileInfo.sensitive ? 'high' : 'medium',
        encryption_status: fileInfo.encrypted ? 'encrypted' : 'unencrypted',
        access_frequency: auditLogs.filter(log => log.resource === filePath).length,
        last_accessed: fileInfo.accessed
      }
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `file_report_${fileInfo.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs & File Information</h2>
        <Button onClick={exportAuditLogs} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
            
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">{filteredLogs.length} results</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="audit-logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="audit-logs" className="text-gray-700">Audit Logs</TabsTrigger>
          <TabsTrigger value="file-access" className="text-gray-700">File Access</TabsTrigger>
          <TabsTrigger value="system-events" className="text-gray-700">System Events</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logs List */}
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedLog?.id === log.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="font-medium text-gray-900">{log.action}</span>
                            {getStatusIcon(log.status)}
                          </div>
                          <Badge className={getRiskColor(log.riskLevel)}>
                            {log.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <div>User: {log.user}</div>
                          <div>Resource: {log.resource}</div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{log.timestamp.toLocaleString()}</span>
                          <span>{log.ipAddress}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Log Details */}
            <Card className="bg-white border-gray-300 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Log Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedLog ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Action</label>
                        <div className="text-gray-900">{selectedLog.action}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedLog.status)}
                          <span className="text-gray-900">{selectedLog.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Resource</label>
                      <div className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                        {selectedLog.resource}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">User</label>
                        <div className="text-gray-900">{selectedLog.user}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">IP Address</label>
                        <div className="text-gray-900">{selectedLog.ipAddress}</div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">User Agent</label>
                      <div className="text-gray-900 text-sm">{selectedLog.userAgent}</div>
                    </div>
                    
                    {selectedLog.fileHash && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">File Hash</label>
                        <div className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded">
                          {selectedLog.fileHash}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Details</label>
                      <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded border overflow-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                    
                    {fileInfoDatabase[selectedLog.resource] && (
                      <Button
                        onClick={() => exportFileReport(selectedLog.resource)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View File Information
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a log entry to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="file-access" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">File Access Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(fileInfoDatabase).map(([path, fileInfo]) => (
                  <div key={path} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">{fileInfo.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileInfo.encrypted && (
                          <Badge className="bg-green-500 text-white">ENCRYPTED</Badge>
                        )}
                        {fileInfo.sensitive && (
                          <Badge className="bg-red-500 text-white">SENSITIVE</Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() => exportFileReport(path)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="text-gray-700 font-medium">Size</label>
                        <div className="text-gray-900">{(fileInfo.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <div>
                        <label className="text-gray-700 font-medium">Owner</label>
                        <div className="text-gray-900">{fileInfo.owner}</div>
                      </div>
                      <div>
                        <label className="text-gray-700 font-medium">Permissions</label>
                        <div className="text-gray-900 font-mono">{fileInfo.permissions}</div>
                      </div>
                      <div>
                        <label className="text-gray-700 font-medium">Type</label>
                        <div className="text-gray-900">{fileInfo.type}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-600">
                      <div>Created: {fileInfo.created.toLocaleString()}</div>
                      <div>Modified: {fileInfo.modified.toLocaleString()}</div>
                      <div>Accessed: {fileInfo.accessed.toLocaleString()}</div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="text-xs text-gray-700 font-medium">File Hash (SHA-256)</label>
                      <div className="text-xs text-gray-900 font-mono bg-white p-2 rounded border mt-1">
                        {fileInfo.hash}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-events" className="mt-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">System Events & Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700 font-medium">Total Events</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{auditLogs.length}</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700 font-medium">Successful</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {auditLogs.filter(log => log.status === 'success').length}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-gray-700 font-medium">Failed</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {auditLogs.filter(log => log.status === 'failure').length}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-gray-700 font-medium">High Risk</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {auditLogs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical').length}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Recent System Activities</h4>
                <div className="space-y-2">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getActionIcon(log.action)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.action}</div>
                          <div className="text-xs text-gray-600">{log.user} - {log.timestamp.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge className={getRiskColor(log.riskLevel)}>
                          {log.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-8">
        Audit Logs & File Information System - Created by Md.Hriday Khan
      </div>
    </div>
  );
}