import React, { useState, useEffect, useCallback } from 'react';
import { RealTimeTradingChart } from './RealTimeTradingChart';

interface SolcasinoTradingTerminalProps {
  className?: string;
}

export const SolcasinoTradingTerminal: React.FC<SolcasinoTradingTerminalProps> = ({
  className = ''
}) => {
  // Trading state
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ASTER');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('5s');
  const [wager, setWager] = useState<string>('1');
  const [leverage, setLeverage] = useState<number>(20);
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  
  // UI state
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Available symbols
  const symbols = [
    { id: 'BTC', name: 'Bitcoin', leverage: 1000 },
    { id: 'ETH', name: 'Ethereum', leverage: 1000 },
    { id: 'SOL', name: 'Solana', leverage: 1000 },
    { id: 'ASTER', name: 'Aster', leverage: 1000 },
    { id: 'COAI', name: 'Coai', leverage: 10 },
    { id: 'SUI', name: 'Sui', leverage: 10 },
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

  // Handle price updates from chart
  const handlePriceUpdate = useCallback((price: number) => {
    setCurrentPrice(price);
  }, []);

  // Handle wager percentage buttons
  const handleWagerPercentage = (percentage: number) => {
    const amount = (availableBalance * percentage / 100).toFixed(2);
    setWager(amount);
  };

  // Handle trade execution
  const handleTrade = async (tradeSide: 'LONG' | 'SHORT') => {
    if (isTrading) return;
    
    setIsTrading(true);
    try {
      // TODO: Implement actual trade execution
      console.log(`Executing ${tradeSide} trade:`, {
        symbol: selectedSymbol,
        wager: parseFloat(wager),
        leverage,
        side: tradeSide
      });
      
      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Trade execution failed:', error);
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className={`h-screen bg-gray-900 flex flex-col ${className}`}>
      {/* Solcasino Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Balance and Symbol Info */}
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <div className="text-gray-400">Available Balance</div>
              <div className="text-white font-semibold">${availableBalance.toFixed(2)}</div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <div className="text-gray-400">Current Price</div>
                <div className="text-white font-semibold">${currentPrice.toFixed(4)}</div>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-400">Symbol</div>
                <div className="text-white font-semibold">{selectedSymbol}-USDC</div>
              </div>
            </div>
          </div>

          {/* Center: Symbol Selector */}
          <div className="flex items-center space-x-2">
            {symbols.map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => setSelectedSymbol(symbol.id)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedSymbol === symbol.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {symbol.id}
              </button>
            ))}
          </div>

          {/* Right: Timeframe and Controls */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600"
            >
              {timeframes.map((tf) => (
                <option key={tf.id} value={tf.id}>
                  {tf.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
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
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
          {/* Wager Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wager
            </label>
            <div className="relative">
              <input
                type="number"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <div className="absolute right-3 top-3 text-gray-400">USD</div>
            </div>
            
            {/* Percentage Buttons */}
            <div className="flex space-x-2 mt-3">
              {[0, 25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleWagerPercentage(percentage)}
                  className="flex-1 py-2 px-3 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>

          {/* Leverage Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Leverage: {leverage}x
            </label>
            <input
              type="range"
              min="1"
              max={currentSymbol?.leverage || 1000}
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1x</span>
              <span>{currentSymbol?.leverage || 1000}x</span>
            </div>
          </div>

          {/* Trade Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleTrade('LONG')}
              disabled={isTrading}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                side === 'LONG'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isTrading ? 'TRADING...' : 'LONG'}
            </button>
            
            <button
              onClick={() => handleTrade('SHORT')}
              disabled={isTrading}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                side === 'SHORT'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isTrading ? 'TRADING...' : 'SHORT'}
            </button>
          </div>

          {/* Trade Info */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Entry Price:</span>
              <span className="text-white">${currentPrice.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Leverage:</span>
              <span className="text-white">{leverage}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Position Size:</span>
              <span className="text-white">${(parseFloat(wager) * leverage).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fee:</span>
              <span className="text-white">${(parseFloat(wager) * 0.001).toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Right Chart Area */}
        <div className="flex-1 flex flex-col">
          {/* Chart Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-white">
                  {selectedSymbol}-USDC
                </h2>
                <div className="text-sm text-gray-400">
                  {selectedTimeframe} • Real-time
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">LIVE</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 relative">
            <RealTimeTradingChart
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
