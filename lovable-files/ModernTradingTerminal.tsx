import React, { useState, useEffect, useCallback } from 'react';
import { ModernTradingChart } from './ModernTradingChart';
import { apiService } from './api';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';

interface ModernTradingTerminalProps {
  className?: string;
}

export const ModernTradingTerminal: React.FC<ModernTradingTerminalProps> = ({
  className = ''
}) => {
  // Auth and wallet
  const { user } = useAuth();
  const { balances, refreshBalances } = useWallet();
  
  // Trading state
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ASTER');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [wager, setWager] = useState<string>('1');
  const [leverage, setLeverage] = useState<number>(20);
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  
  // UI state
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activePositions, setActivePositions] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  // Available symbols with proper leverage limits
  const symbols = [
    { id: 'BTC', name: 'Bitcoin', leverage: 1000, icon: '₿' },
    { id: 'ETH', name: 'Ethereum', leverage: 1000, icon: 'Ξ' },
    { id: 'SOL', name: 'Solana', leverage: 1000, icon: '◎' },
    { id: 'ASTER', name: 'Aster', leverage: 1000, icon: '★' },
    { id: 'COAI', name: 'Coai', leverage: 10, icon: '🪙' },
    { id: 'SUI', name: 'Sui', leverage: 10, icon: '💎' },
  ];

  // Available timeframes
  const timeframes = [
    { id: '5s', name: '5s', label: '5s' },
    { id: '15s', name: '15s', label: '15s' },
    { id: '30s', name: '30s', label: '30s' },
    { id: '1m', name: '1m', label: '1m' },
    { id: '5m', name: '5m', label: '5m' },
    { id: '15m', name: '15m', label: '15m' },
  ];

  // Get current symbol info
  const currentSymbol = symbols.find(s => s.id === selectedSymbol);

  // Update available balance from wallet
  useEffect(() => {
    if (balances && balances.length > 0) {
      const usdcBalance = balances.find(b => b.currency === 'USDC');
      if (usdcBalance) {
        setAvailableBalance(parseFloat(usdcBalance.available));
      }
    }
  }, [balances]);

  // Handle price updates from chart
  const handlePriceUpdate = useCallback((price: number) => {
    setCurrentPrice(price);
  }, []);

  // Handle wager percentage buttons
  const handleWagerPercentage = (percentage: number) => {
    const amount = (availableBalance * percentage / 100).toFixed(2);
    setWager(amount);
  };

  // Calculate position size and fees
  const positionSize = parseFloat(wager) * leverage;
  const openFee = parseFloat(wager) * 0.0008; // 0.08% open fee
  const totalRequired = parseFloat(wager) + openFee;

  // Handle trade execution
  const handleTrade = async (tradeSide: 'LONG' | 'SHORT') => {
    if (isTrading || !user) return;
    
    // Validate balance
    if (availableBalance < totalRequired) {
      alert('Insufficient balance for this trade');
      return;
    }

    setIsTrading(true);
    try {
      console.log(`Executing ${tradeSide} trade:`, {
        symbol: selectedSymbol,
        wager: parseFloat(wager),
        leverage,
        side: tradeSide,
        currentPrice
      });

      // TODO: Implement actual futures trade execution
      // This would call the futures API to open a position
      const tradeData = {
        symbolId: `${selectedSymbol}-USDC`,
        side: tradeSide,
        leverage,
        collateral: parseFloat(wager),
        qty: (parseFloat(wager) * leverage) / currentPrice
      };

      // Simulate trade execution for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Refresh balances after trade
      await refreshBalances();
      
      // Add to trade history
      const newTrade = {
        id: Date.now().toString(),
        symbol: selectedSymbol,
        side: tradeSide,
        amount: parseFloat(wager),
        leverage,
        entryPrice: currentPrice,
        timestamp: new Date().toISOString(),
        status: 'OPEN'
      };
      
      setActivePositions(prev => [...prev, newTrade]);
      setTradeHistory(prev => [newTrade, ...prev]);
      
      console.log('Trade executed successfully:', newTrade);
      
    } catch (error) {
      console.error('Trade execution failed:', error);
      alert('Trade execution failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Close position
  const handleClosePosition = async (positionId: string) => {
    try {
      // TODO: Implement position closing
      console.log('Closing position:', positionId);
      
      setActivePositions(prev => prev.filter(p => p.id !== positionId));
      
      // Refresh balances
      await refreshBalances();
      
    } catch (error) {
      console.error('Failed to close position:', error);
    }
  };

  return (
    <div className={`h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col ${className}`}>
      {/* Modern Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Balance and Symbol Info */}
          <div className="flex items-center space-x-8">
            <div className="text-sm">
              <div className="text-gray-400 mb-1">Available Balance</div>
              <div className="text-white font-bold text-lg">${availableBalance.toFixed(2)}</div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <div className="text-gray-400 mb-1">Current Price</div>
                <div className="text-white font-bold text-lg">${currentPrice.toFixed(4)}</div>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-400 mb-1">Symbol</div>
                <div className="text-white font-bold text-lg">{selectedSymbol}-USDC</div>
              </div>
            </div>
          </div>

          {/* Center: Symbol Selector */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
            {symbols.map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => {
                  setSelectedSymbol(symbol.id);
                  setLeverage(Math.min(leverage, symbol.leverage));
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedSymbol === symbol.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-2">{symbol.icon}</span>
                {symbol.id}
              </button>
            ))}
          </div>

          {/* Right: Timeframe and Controls */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              {timeframes.map((tf) => (
                <option key={tf.id} value={tf.id}>
                  {tf.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Trading Panel */}
        <div className="w-96 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 p-6 flex flex-col">
          {/* Wager Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Wager Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-xl font-mono"
                placeholder="0.00"
                step="0.01"
                min="0"
                max={availableBalance}
              />
              <div className="absolute right-4 top-4 text-gray-400 font-medium">USD</div>
            </div>
            
            {/* Percentage Buttons */}
            <div className="flex space-x-2 mt-4">
              {[0, 25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleWagerPercentage(percentage)}
                  className="flex-1 py-3 px-4 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 hover:text-white transition-all duration-200"
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>

          {/* Leverage Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Leverage: <span className="text-blue-400 font-bold">{leverage}x</span>
            </label>
            <input
              type="range"
              min="1"
              max={currentSymbol?.leverage || 1000}
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>1x</span>
              <span>{currentSymbol?.leverage || 1000}x</span>
            </div>
          </div>

          {/* Trade Buttons */}
          <div className="space-y-4 mb-8">
            <button
              onClick={() => handleTrade('LONG')}
              disabled={isTrading || availableBalance < totalRequired}
              className={`w-full py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
                side === 'LONG'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              } ${isTrading || availableBalance < totalRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isTrading ? 'TRADING...' : 'LONG'}
            </button>
            
            <button
              onClick={() => handleTrade('SHORT')}
              disabled={isTrading || availableBalance < totalRequired}
              className={`w-full py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
                side === 'SHORT'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              } ${isTrading || availableBalance < totalRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isTrading ? 'TRADING...' : 'SHORT'}
            </button>
          </div>

          {/* Trade Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 space-y-4 border border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Entry Price:</span>
              <span className="text-white font-mono">${currentPrice.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Leverage:</span>
              <span className="text-white font-mono">{leverage}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Position Size:</span>
              <span className="text-white font-mono">${positionSize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Open Fee:</span>
              <span className="text-white font-mono">${openFee.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-400">Total Required:</span>
              <span className="text-white font-mono">${totalRequired.toFixed(2)}</span>
            </div>
          </div>

          {/* Active Positions */}
          {activePositions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Active Positions</h3>
              <div className="space-y-2">
                {activePositions.map((position) => (
                  <div key={position.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {position.symbol} {position.side}
                        </div>
                        <div className="text-xs text-gray-400">
                          {position.leverage}x • ${position.amount}
                        </div>
                      </div>
                      <button
                        onClick={() => handleClosePosition(position.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Chart Area */}
        <div className="flex-1 flex flex-col">
          {/* Chart Header */}
          <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <h2 className="text-xl font-bold text-white">
                  {selectedSymbol}-USDC
                </h2>
                <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-lg">
                  {selectedTimeframe} • Real-time
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-300 font-medium">LIVE</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 relative">
            <ModernTradingChart
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
              onPriceUpdate={handlePriceUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
