import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { EnhancedTradingTerminal } from './EnhancedTradingTerminal';
import { GameBugFixes } from './GameBugFixes';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { SecurityEnhancer } from './SecurityEnhancer';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'support';
  lastLogin: string;
  isActive: boolean;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'trading' | 'analytics' | 'performance' | 'security' | 'users'>('overview');
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.username === 'admin';

  // Load system alerts
  const loadSystemAlerts = async () => {
    // Simulate loading system alerts
    const alerts: SystemAlert[] = [
      {
        id: 'alert_1',
        type: 'warning',
        title: 'High Memory Usage',
        message: 'Memory usage is above 80% on server-1',
        timestamp: new Date().toISOString(),
        resolved: false
      },
      {
        id: 'alert_2',
        type: 'info',
        title: 'New User Registration',
        message: '50 new users registered in the last hour',
        timestamp: new Date().toISOString(),
        resolved: false
      },
      {
        id: 'alert_3',
        type: 'error',
        title: 'API Rate Limit Exceeded',
        message: 'Rate limit exceeded for IP 192.168.1.100',
        timestamp: new Date().toISOString(),
        resolved: false
      },
      {
        id: 'alert_4',
        type: 'success',
        title: 'Backup Completed',
        message: 'Daily backup completed successfully',
        timestamp: new Date().toISOString(),
        resolved: true
      }
    ];
    setSystemAlerts(alerts);
  };

  // Load admin users
  const loadAdminUsers = async () => {
    const users: AdminUser[] = [
      {
        id: 'admin_1',
        username: 'admin',
        email: 'admin@casino.com',
        role: 'admin',
        lastLogin: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'mod_1',
        username: 'moderator1',
        email: 'mod1@casino.com',
        role: 'moderator',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        id: 'support_1',
        username: 'support1',
        email: 'support1@casino.com',
        role: 'support',
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isActive: false
      }
    ];
    setAdminUsers(users);
  };

  // Resolve alert
  const resolveAlert = (alertId: string) => {
    setSystemAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  // Initialize
  useEffect(() => {
    if (isAdmin) {
      loadSystemAlerts();
      loadAdminUsers();
    }
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
        <p className="text-gray-400">Please log in to access the admin dashboard.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400">You don't have permission to access the admin dashboard.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'games', label: 'Game Management', icon: '🎮' },
    { id: 'trading', label: 'Trading Terminal', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'users', label: 'User Management', icon: '👥' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* System Alerts */}
            <div>
              <h3 className="text-lg font-semibold mb-3">System Alerts</h3>
              <div className="space-y-2">
                {systemAlerts.filter(alert => !alert.resolved).map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                    alert.type === 'error' ? 'bg-red-900 bg-opacity-50 border-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-900 bg-opacity-50 border-yellow-500' :
                    alert.type === 'info' ? 'bg-blue-900 bg-opacity-50 border-blue-500' :
                    'bg-green-900 bg-opacity-50 border-green-500'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-gray-300 text-sm">{alert.message}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">Total Users</h4>
                <p className="text-2xl font-bold text-blue-400">12,500</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">Active Games</h4>
                <p className="text-2xl font-bold text-green-400">8</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">Total Revenue</h4>
                <p className="text-2xl font-bold text-yellow-400">$367K</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">System Uptime</h4>
                <p className="text-2xl font-bold text-purple-400">99.8%</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-300">New user registered: crypto_trader_123</span>
                    <span className="text-xs text-gray-400">2 minutes ago</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-300">Large bet placed: $5,000 on To The Moon</span>
                    <span className="text-xs text-gray-400">5 minutes ago</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-300">Security scan completed</span>
                    <span className="text-xs text-gray-400">10 minutes ago</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-300">Performance optimization applied</span>
                    <span className="text-xs text-gray-400">15 minutes ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'games':
        return <GameBugFixes />;

      case 'trading':
        return <EnhancedTradingTerminal className="h-[800px]" />;

      case 'analytics':
        return <AnalyticsDashboard />;

      case 'performance':
        return <PerformanceOptimizer />;

      case 'security':
        return <SecurityEnhancer />;

      case 'users':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-3">Admin Users</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-6 gap-4 text-sm">
                <div className="font-semibold text-gray-300">Username</div>
                <div className="font-semibold text-gray-300">Email</div>
                <div className="font-semibold text-gray-300">Role</div>
                <div className="font-semibold text-gray-300">Last Login</div>
                <div className="font-semibold text-gray-300">Status</div>
                <div className="font-semibold text-gray-300">Actions</div>
                
                {adminUsers.map((adminUser) => (
                  <React.Fragment key={adminUser.id}>
                    <div className="text-gray-400">{adminUser.username}</div>
                    <div className="text-gray-400">{adminUser.email}</div>
                    <div className="text-gray-400">{adminUser.role}</div>
                    <div className="text-gray-400">
                      {new Date(adminUser.lastLogin).toLocaleDateString()}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      adminUser.isActive ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {adminUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                    <div className="flex space-x-1">
                      <button className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">
                        Edit
                      </button>
                      <button className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">
                        Disable
                      </button>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🛠️ Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Welcome, {user.username}</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">System Online</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
};
