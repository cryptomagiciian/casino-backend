import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { apiService } from './api';

interface GameAnalytics {
  gameName: string;
  totalPlays: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  houseEdge: number;
  avgBetSize: number;
  uniquePlayers: number;
  retentionRate: number;
  lastUpdated: string;
}

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  avgSessionDuration: number;
  avgBetsPerUser: number;
  topCountries: Array<{ country: string; users: number }>;
  userGrowthRate: number;
}

interface RevenueAnalytics {
  totalRevenue: number;
  totalVolume: number;
  revenueByGame: Array<{ game: string; revenue: number }>;
  revenueByCurrency: Array<{ currency: string; revenue: number }>;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  monthlyGrowth: number;
}

interface SystemMetrics {
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  totalRequests: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getBalance, refreshBalances } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, formatBalance } = useCurrency();

  const [gameAnalytics, setGameAnalytics] = useState<GameAnalytics[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [realTimeData, setRealTimeData] = useState<any>(null);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📊 Loading analytics data...');

      // Load game analytics
      const gameData = await loadGameAnalytics();
      setGameAnalytics(gameData);

      // Load user analytics
      const userData = await loadUserAnalytics();
      setUserAnalytics(userData);

      // Load revenue analytics
      const revenueData = await loadRevenueAnalytics();
      setRevenueAnalytics(revenueData);

      // Load system metrics
      const systemData = await loadSystemMetrics();
      setSystemMetrics(systemData);

      console.log('✅ Analytics data loaded successfully');

    } catch (error) {
      console.error('❌ Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  // Load game analytics
  const loadGameAnalytics = async (): Promise<GameAnalytics[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        gameName: 'Pump or Dump',
        totalPlays: 15420,
        totalWagered: 125000,
        totalWon: 118750,
        totalLost: 125000,
        houseEdge: 5.0,
        avgBetSize: 8.1,
        uniquePlayers: 3240,
        retentionRate: 78.5,
        lastUpdated: new Date().toISOString()
      },
      {
        gameName: 'To The Moon',
        totalPlays: 12850,
        totalWagered: 98000,
        totalWon: 93100,
        totalLost: 98000,
        houseEdge: 5.0,
        avgBetSize: 7.6,
        uniquePlayers: 2890,
        retentionRate: 82.3,
        lastUpdated: new Date().toISOString()
      },
      {
        gameName: 'Diamond Hands',
        totalPlays: 8750,
        totalWagered: 67000,
        totalWon: 63650,
        totalLost: 67000,
        houseEdge: 5.0,
        avgBetSize: 7.7,
        uniquePlayers: 2150,
        retentionRate: 75.8,
        lastUpdated: new Date().toISOString()
      },
      {
        gameName: 'Leverage Ladder',
        totalPlays: 6200,
        totalWagered: 45000,
        totalWon: 42750,
        totalLost: 45000,
        houseEdge: 5.0,
        avgBetSize: 7.3,
        uniquePlayers: 1680,
        retentionRate: 71.2,
        lastUpdated: new Date().toISOString()
      },
      {
        gameName: 'Bullet Bet',
        totalPlays: 4200,
        totalWagered: 32000,
        totalWon: 30400,
        totalLost: 32000,
        houseEdge: 5.0,
        avgBetSize: 7.6,
        uniquePlayers: 1200,
        retentionRate: 68.5,
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  // Load user analytics
  const loadUserAnalytics = async (): Promise<UserAnalytics> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      totalUsers: 12500,
      activeUsers: 3200,
      newUsers: 450,
      returningUsers: 2750,
      avgSessionDuration: 18.5,
      avgBetsPerUser: 12.3,
      topCountries: [
        { country: 'United States', users: 3200 },
        { country: 'United Kingdom', users: 1800 },
        { country: 'Canada', users: 1200 },
        { country: 'Australia', users: 950 },
        { country: 'Germany', users: 800 }
      ],
      userGrowthRate: 15.2
    };
  };

  // Load revenue analytics
  const loadRevenueAnalytics = async (): Promise<RevenueAnalytics> => {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    return {
      totalRevenue: 367000,
      totalVolume: 367000,
      revenueByGame: [
        { game: 'Pump or Dump', revenue: 6250 },
        { game: 'To The Moon', revenue: 4900 },
        { game: 'Diamond Hands', revenue: 3350 },
        { game: 'Leverage Ladder', revenue: 2250 },
        { game: 'Bullet Bet', revenue: 1600 }
      ],
      revenueByCurrency: [
        { currency: 'USDC', revenue: 180000 },
        { currency: 'USDT', revenue: 120000 },
        { currency: 'BTC', revenue: 45000 },
        { currency: 'ETH', revenue: 22000 }
      ],
      dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.random() * 15000 + 5000
      })),
      monthlyGrowth: 12.5
    };
  };

  // Load system metrics
  const loadSystemMetrics = async (): Promise<SystemMetrics> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      uptime: 99.8,
      avgResponseTime: 245,
      errorRate: 0.2,
      totalRequests: 1250000,
      cacheHitRate: 87.5,
      memoryUsage: 68.2,
      cpuUsage: 45.8
    };
  };

  // Real-time data updates
  const startRealTimeUpdates = useCallback(() => {
    const interval = setInterval(() => {
      setRealTimeData({
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 100) + 3000,
        totalBets: Math.floor(Math.random() * 50) + 1000,
        revenue: Math.floor(Math.random() * 1000) + 5000
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!gameAnalytics.length || !userAnalytics || !revenueAnalytics) {
      return null;
    }

    const totalPlays = gameAnalytics.reduce((sum, game) => sum + game.totalPlays, 0);
    const totalWagered = gameAnalytics.reduce((sum, game) => sum + game.totalWagered, 0);
    const totalRevenue = revenueAnalytics.totalRevenue;
    const avgHouseEdge = gameAnalytics.reduce((sum, game) => sum + game.houseEdge, 0) / gameAnalytics.length;

    return {
      totalPlays,
      totalWagered,
      totalRevenue,
      avgHouseEdge,
      activeUsers: userAnalytics.activeUsers,
      totalUsers: userAnalytics.totalUsers
    };
  }, [gameAnalytics, userAnalytics, revenueAnalytics]);

  // Export analytics data
  const exportAnalytics = () => {
    const data = {
      gameAnalytics,
      userAnalytics,
      revenueAnalytics,
      systemMetrics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Initialize
  useEffect(() => {
    loadAnalyticsData();
    const cleanup = startRealTimeUpdates();
    return cleanup;
  }, [loadAnalyticsData, startRealTimeUpdates]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange, loadAnalyticsData]);

  if (!user) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
        <p className="text-gray-400">Please log in to access the analytics dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-2">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📊 Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={exportAnalytics}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Real-time Data */}
      {realTimeData && (
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Live Data</span>
              </div>
              <div className="text-sm text-gray-300">
                Active Users: <span className="text-green-400 font-semibold">{realTimeData.activeUsers}</span>
              </div>
              <div className="text-sm text-gray-300">
                Bets Today: <span className="text-blue-400 font-semibold">{realTimeData.totalBets}</span>
              </div>
              <div className="text-sm text-gray-300">
                Revenue: <span className="text-yellow-400 font-semibold">${realTimeData.revenue}</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Last updated: {new Date(realTimeData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {keyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-1">Total Plays</h3>
            <p className="text-2xl font-bold text-blue-400">{keyMetrics.totalPlays.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-1">Total Wagered</h3>
            <p className="text-2xl font-bold text-green-400">${keyMetrics.totalWagered.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold text-yellow-400">${keyMetrics.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-1">House Edge</h3>
            <p className="text-2xl font-bold text-red-400">{keyMetrics.avgHouseEdge.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-1">Active Users</h3>
            <p className="text-2xl font-bold text-purple-400">{keyMetrics.activeUsers.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-1">Total Users</h3>
            <p className="text-2xl font-bold text-indigo-400">{keyMetrics.totalUsers.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Game Analytics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Game Performance</h3>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-8 gap-4 text-sm">
            <div className="font-semibold text-gray-300">Game</div>
            <div className="font-semibold text-gray-300">Plays</div>
            <div className="font-semibold text-gray-300">Wagered</div>
            <div className="font-semibold text-gray-300">Revenue</div>
            <div className="font-semibold text-gray-300">House Edge</div>
            <div className="font-semibold text-gray-300">Avg Bet</div>
            <div className="font-semibold text-gray-300">Players</div>
            <div className="font-semibold text-gray-300">Retention</div>
            
            {gameAnalytics.map((game, index) => (
              <React.Fragment key={index}>
                <div className="text-gray-400">{game.gameName}</div>
                <div className="text-gray-400">{game.totalPlays.toLocaleString()}</div>
                <div className="text-gray-400">${game.totalWagered.toLocaleString()}</div>
                <div className="text-green-400">${(game.totalWagered - game.totalWon).toLocaleString()}</div>
                <div className="text-red-400">{game.houseEdge.toFixed(1)}%</div>
                <div className="text-gray-400">${game.avgBetSize.toFixed(1)}</div>
                <div className="text-gray-400">{game.uniquePlayers.toLocaleString()}</div>
                <div className="text-blue-400">{game.retentionRate.toFixed(1)}%</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">System Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Uptime</h4>
              <p className="text-xl font-bold text-green-400">{systemMetrics.uptime}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Avg Response Time</h4>
              <p className="text-xl font-bold text-blue-400">{systemMetrics.avgResponseTime}ms</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Error Rate</h4>
              <p className="text-xl font-bold text-red-400">{systemMetrics.errorRate}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Cache Hit Rate</h4>
              <p className="text-xl font-bold text-yellow-400">{systemMetrics.cacheHitRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* User Analytics */}
      {userAnalytics && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">User Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">New Users (24h)</h4>
              <p className="text-xl font-bold text-green-400">{userAnalytics.newUsers}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Avg Session Duration</h4>
              <p className="text-xl font-bold text-blue-400">{userAnalytics.avgSessionDuration}min</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-1">Avg Bets Per User</h4>
              <p className="text-xl font-bold text-purple-400">{userAnalytics.avgBetsPerUser}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Countries */}
      {userAnalytics && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Top Countries</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="space-y-2">
              {userAnalytics.topCountries.map((country, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">{country.country}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ width: `${(country.users / userAnalytics.topCountries[0].users) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-400 w-16 text-right">{country.users.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
