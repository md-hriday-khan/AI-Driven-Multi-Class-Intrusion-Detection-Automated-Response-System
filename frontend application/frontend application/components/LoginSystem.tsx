import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Shield, Lock, User, Eye, EyeOff, LogIn, LogOut, Users, Key } from 'lucide-react';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'operator' | 'analyst' | 'viewer';
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
  email?: string;
}

interface LoginSession {
  userId: string;
  username: string;
  role: string;
  loginTime: Date;
  lastActivity: Date;
  sessionId: string;
}

// Simulated user database - In production, this would be in an encrypted database
const USERS_DB: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'shield123!',
    role: 'admin',
    permissions: ['all'],
    isActive: true,
    email: 'admin@shield.local'
  },
  {
    id: '2',
    username: 'security_ops',
    password: 'SecOps2024!',
    role: 'operator',
    permissions: ['monitor', 'respond', 'investigate'],
    isActive: true,
    email: 'ops@shield.local'
  },
  {
    id: '3',
    username: 'analyst',
    password: 'Analyze123!',
    role: 'analyst',
    permissions: ['monitor', 'investigate', 'report'],
    isActive: true,
    email: 'analyst@shield.local'
  },
  {
    id: '4',
    username: 'viewer',
    password: 'View2024!',
    role: 'viewer',
    permissions: ['monitor'],
    isActive: true,
    email: 'viewer@shield.local'
  }
];

interface LoginSystemProps {
  onLogin: (session: LoginSession) => void;
  onLogout: () => void;
  currentSession?: LoginSession | null;
}

export function LoginSystem({ onLogin, onLogout, currentSession }: LoginSystemProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [activeSessions, setActiveSessions] = useState<LoginSession[]>([]);

  useEffect(() => {
    // Auto-unlock after 5 minutes
    if (isLocked) {
      const timer = setTimeout(() => {
        setIsLocked(false);
        setLoginAttempts(0);
        setError('');
      }, 300000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  useEffect(() => {
    // Update last activity for current session
    if (currentSession) {
      const interval = setInterval(() => {
        setActiveSessions(prev => prev.map(session => 
          session.sessionId === currentSession.sessionId 
            ? { ...session, lastActivity: new Date() }
            : session
        ));
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLocked) {
      setError('Account is temporarily locked due to multiple failed attempts');
      return;
    }

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    // Find user in database
    const user = USERS_DB.find(u => u.username === username && u.isActive);
    
    if (!user || user.password !== password) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setError('Too many failed attempts. Account locked for 5 minutes.');
      } else {
        setError(`Invalid credentials. ${3 - newAttempts} attempts remaining.`);
      }
      return;
    }

    // Successful login
    const session: LoginSession = {
      userId: user.id,
      username: user.username,
      role: user.role,
      loginTime: new Date(),
      lastActivity: new Date(),
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setActiveSessions(prev => [...prev, session]);
    setLoginAttempts(0);
    setSuccess(`Welcome back, ${user.username}!`);
    setUsername('');
    setPassword('');
    
    // Update user's last login
    const userIndex = USERS_DB.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      USERS_DB[userIndex].lastLogin = new Date();
    }

    onLogin(session);
  };

  const handleLogout = () => {
    if (currentSession) {
      setActiveSessions(prev => prev.filter(s => s.sessionId !== currentSession.sessionId));
      setSuccess('Logged out successfully');
      onLogout();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600 text-white';
      case 'operator': return 'bg-blue-600 text-white';
      case 'analyst': return 'bg-green-600 text-white';
      case 'viewer': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPermissionsText = (permissions: string[]) => {
    if (permissions.includes('all')) return 'Full Access';
    return permissions.join(', ').replace(/^\w/, c => c.toUpperCase());
  };

  if (currentSession) {
    return (
      <div className="space-y-6">
        {/* Current Session Info */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Active Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="font-medium text-lg">{currentSession.username}</div>
                    <div className="text-sm text-slate-400">User ID: {currentSession.userId}</div>
                  </div>
                </div>
                <Badge className={getRoleColor(currentSession.role)}>
                  {currentSession.role.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Login Time:</span>
                  <div className="font-medium">{currentSession.loginTime.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400">Last Activity:</span>
                  <div className="font-medium">{currentSession.lastActivity.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400">Session ID:</span>
                  <div className="font-mono text-xs">{currentSession.sessionId}</div>
                </div>
                <div>
                  <span className="text-slate-400">Permissions:</span>
                  <div className="font-medium text-green-400">
                    {getPermissionsText(USERS_DB.find(u => u.id === currentSession.userId)?.permissions || [])}
                  </div>
                </div>
              </div>

              <Button onClick={handleLogout} variant="destructive" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Active Sessions */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              Active Sessions ({activeSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div 
                  key={session.sessionId}
                  className={`p-3 rounded-lg border ${
                    session.sessionId === currentSession.sessionId 
                      ? 'border-green-600 bg-green-950/20' 
                      : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-blue-400" />
                      <div>
                        <div className="font-medium">{session.username}</div>
                        <div className="text-xs text-slate-400">
                          {session.sessionId === currentSession.sessionId ? 'Current Session' : 'Other Session'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getRoleColor(session.role)}>
                        {session.role}
                      </Badge>
                      <div className="text-xs text-slate-400 mt-1">
                        {session.lastActivity.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Login Form */}
      <Card className="bg-slate-900 border-slate-700 max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Lock className="h-5 w-5 text-blue-400" />
            SHIELD SOC Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-600 bg-green-950/20">
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isLocked}
                className="bg-slate-800 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isLocked}
                  className="bg-slate-800 border-slate-600 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLocked}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isLocked ? 'Account Locked' : 'Login'}
            </Button>

            {loginAttempts > 0 && !isLocked && (
              <div className="text-center text-sm text-yellow-400">
                Failed attempts: {loginAttempts}/3
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Test Credentials */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowCredentials(!showCredentials)}
          >
            <Key className="h-5 w-5 text-yellow-400" />
            Test Credentials
            {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {showCredentials && (
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-yellow-600 bg-yellow-950/20">
                <AlertDescription className="text-yellow-400">
                  These are test credentials for demonstration purposes only.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {USERS_DB.map((user) => (
                  <div key={user.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{user.username}</div>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-slate-400">Password: <span className="font-mono text-green-400">{user.password}</span></div>
                      <div className="text-slate-400">Permissions: <span className="text-blue-400">{getPermissionsText(user.permissions)}</span></div>
                      {user.email && (
                        <div className="text-slate-400">Email: <span className="text-purple-400">{user.email}</span></div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        setUsername(user.username);
                        setPassword(user.password);
                      }}
                    >
                      Use Credentials
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}