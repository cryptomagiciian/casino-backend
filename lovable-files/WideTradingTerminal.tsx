import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { apiService } from './api';
import { usePrices } from './PriceManager';
import { TradingViewChart } from './TradingViewChart';

interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
  liquidationPrice: number;
  timestamp: number;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
}

interface TradeHistory {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
  duration: string;
}

interface TopTrade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  timestamp: number;
  username: string;
}

export const WideTradingTerminal: React.FC<{ className?: string }> = ({ className = '' }) => {
  // Auth and wallet
  const { user } = useAuth();
  const { getBalance, refreshBalances } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, formatBalance } = useCurrency();

  // Trading state
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ASTER');
  const [timeframe, setTimeframe] = useState<string>('5s');
  const [currentPrice, setCurrentPrice] = useState<number>(1.4600);
  const [availableBalance, setAvailableBalance] = useState<number>(702.20);

  // Order form
  const [wagerAmount, setWagerAmount] = useState<string>('1');
  const [leverage, setLeverage] = useState<number>(20);
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [isTrading, setIsTrading] = useState<boolean>(false);

  // UI state
  const [showOrderPanel, setShowOrderPanel] = useState<boolean>(true);
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(true);

  // Positions and history
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [topTrades, setTopTrades] = useState<TopTrade[]>([]);
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'top'>('positions');

  // Refs
  const wsRef = useRef<WebSocket | null>(null);

  // Use centralized price manager
  const { prices } = usePrices();
  
  // Symbol data with real prices from centralized price manager (memoized to prevent infinite re-renders)
  const symbolData = useMemo(() => ({
    'BTC': { price: prices.BTC || 112823.3, name: 'Bitcoin' },
    'ETH': { price: prices.ETH || 4107.29, name: 'Ethereum' },
    'SOL': { price: prices.SOL || 202.29, name: 'Solana' },
    'ASTER': { price: prices.ASTER || 1.4600, name: 'Aster' },
    'COAI': { price: prices.COAI || 0.000123, name: 'Coai' },
    'SUI': { price: prices.SUI || 2.45, name: 'Sui' }
  }), [prices.BTC, prices.ETH, prices.SOL, prices.ASTER, prices.COAI, prices.SUI]);

  // Load balance
  const loadBalance = useCallback(async () => {
    try {
      const balance = await getBalance(bettingCurrency, network);
      setAvailableBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  }, [getBalance, bettingCurrency, network]);

  // Calculate liquidation price
  const calculateLiquidationPrice = useCallback((entryPrice: number, side: 'LONG' | 'SHORT', leverage: number): number => {
    if (side === 'LONG') {
      return entryPrice * (1 - 0.95 / leverage); // 95% margin call
    } else {
      return entryPrice * (1 + 0.95 / leverage);
    }
  }, []);

  // Calculate PnL
  const calculatePnL = useCallback((entryPrice: number, currentPrice: number, side: 'LONG' | 'SHORT', size: number, leverage: number): { pnl: number; pnlPercent: number } => {
    const priceChange = side === 'LONG' ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
    const pnl = (priceChange / entryPrice) * size * leverage;
    const pnlPercent = (priceChange / entryPrice) * 100 * leverage;
    return { pnl, pnlPercent };
  }, []);

  // Update current price when symbol changes
  useEffect(() => {
    const realPrice = symbolData[selectedSymbol]?.price || 1.4600;
    setCurrentPrice(realPrice);
  }, [selectedSymbol, symbolData]);

  // Load balance on mount
  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // Update positions with current prices
  useEffect(() => {
    setPositions(prev => prev.map(position => {
      const currentPrice = symbolData[position.symbol]?.price || position.currentPrice;
      const { pnl, pnlPercent } = calculatePnL(position.entryPrice, currentPrice, position.side, position.size, position.leverage);
      
      return {
        ...position,
        currentPrice,
        pnl,
        pnlPercent
      };
    }));
  }, [symbolData, calculatePnL]);

  // Place trade
  const placeTrade = async () => {
    if (!user) return;
    
    setIsTrading(true);
    try {
      const amount = parseFloat(wagerAmount);
      if (amount <= 0 || amount > availableBalance) {
        alert('Invalid amount or insufficient balance');
        return;
      }

      const margin = amount / leverage;
      const liquidationPrice = calculateLiquidationPrice(currentPrice, side, leverage);

      // Create new position
      const newPosition: Position = {
        id: `pos_${Date.now()}`,
        symbol: selectedSymbol,
        side,
        size: amount,
        entryPrice: currentPrice,
        currentPrice,
        leverage,
        pnl: 0,
        pnlPercent: 0,
        margin,
        liquidationPrice,
        timestamp: Date.now(),
        status: 'OPEN'
      };

      setPositions(prev => [...prev, newPosition]);

      // Here you would integrate with your trading API
      console.log('Placing trade:', {
        symbol: selectedSymbol,
        side,
        amount,
        leverage,
        timeframe,
        liquidationPrice
      });

      // Simulate trade placement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh balance after trade
      await loadBalance();
      
      alert('Trade placed successfully!');
    } catch (error) {
      console.error('Failed to place trade:', error);
      alert('Failed to place trade');
    } finally {
      setIsTrading(false);
    }
  };

  // Close position
  const closePosition = async (positionId: string) => {
    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) return;

      const { pnl, pnlPercent } = calculatePnL(position.entryPrice, position.currentPrice, position.side, position.size, position.leverage);

      // Add to trade history
      const trade: TradeHistory = {
        id: `trade_${Date.now()}`,
        symbol: position.symbol,
        side: position.side,
        size: position.size,
        entryPrice: position.entryPrice,
        exitPrice: position.currentPrice,
        leverage: position.leverage,
        pnl,
        pnlPercent,
        timestamp: Date.now(),
        duration: formatDuration(Date.now() - position.timestamp)
      };

      setTradeHistory(prev => [trade, ...prev]);
      setPositions(prev => prev.filter(p => p.id !== positionId));

      // Update balance
      await loadBalance();

      alert(`Position closed! PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`);
    } catch (error) {
      console.error('Failed to close position:', error);
      alert('Failed to close position');
    }
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!user) {
    return (
      <div className={`bg-gray-900 text-white p-8 rounded-lg ${className}`}>
        <h2 className="text-2xl font-bold mb-4">Trading Terminal</h2>
        <p className="text-gray-400">Please log in to access the trading terminal.</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 text-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Trading Terminal</h1>
          <div className="flex items-center space-x-6">
            <div className="text-lg">
              Balance: {formatBalance(availableBalance)} {bettingCurrency}
            </div>
            <div className="text-lg text-gray-400">
              Network: {network}
            </div>
            {/* Toggle buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowOrderPanel(!showOrderPanel)}
                className={`px-3 py-1 rounded text-sm ${
                  showOrderPanel ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {showOrderPanel ? 'Hide' : 'Show'} Order Panel
              </button>
              <button
                onClick={() => setShowBottomPanel(!showBottomPanel)}
                className={`px-3 py-1 rounded text-sm ${
                  showBottomPanel ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {showBottomPanel ? 'Hide' : 'Show'} Positions
              </button>
            </div>
          </div>
        </div>
        
        {/* Symbol and Timeframe Selectors */}
        <div className="flex items-center space-x-6 mt-6">
          <div className="flex items-center space-x-3">
            <span className="text-lg text-gray-400">Symbol:</span>
            <div className="flex space-x-2">
              {Object.keys(symbolData).map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedSymbol === symbol 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
          
          {/* Timeframe selector */}
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            <option value="5s">5s</option>
            <option value="15s">15s</option>
            <option value="30s">30s</option>
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="30m">30m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Chart Area - Maximum Width */}
        <div className={`${showOrderPanel ? 'flex-1' : 'w-full'} p-4`} style={{ minWidth: showOrderPanel ? '75%' : '100%' }}>
          <div className="h-full bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{selectedSymbol} • {timeframe} • Real-time</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-lg">LIVE</span>
                </div>
              </div>
            </div>
            
            {/* TradingView Chart - Maximum Size */}
            <div className="w-full h-full relative">
              <TradingViewChart
                symbol={selectedSymbol}
                timeframe={timeframe}
                width={showOrderPanel ? 1600 : 2000}
                height={showBottomPanel ? 600 : 800}
                autosize={true}
              />
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Data</span>
                </div>
                <div className="text-lg">Current Price: ${currentPrice.toFixed(4)}</div>
              </div>
              <div className="text-sm">
                Powered by TradingView
              </div>
            </div>
          </div>
        </div>

        {/* Floating Order Panel - Narrower */}
        {showOrderPanel && (
          <div className="w-72 p-4 border-l border-gray-700" style={{ minWidth: '25%' }}>
            <div className="h-full bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6">Place Order</h3>
              
              <div className="space-y-6">
                {/* Side Selection */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Side</label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSide('LONG')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium ${
                        side === 'LONG' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      LONG
                    </button>
                    <button
                      onClick={() => setSide('SHORT')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium ${
                        side === 'SHORT' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      SHORT
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Amount (USD)</label>
                  <input
                    type="number"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                  />
                </div>

                {/* Leverage */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Leverage</label>
                  <select
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                  >
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={5}>5x</option>
                    <option value={10}>10x</option>
                    <option value={20}>20x</option>
                    <option value={50}>50x</option>
                    <option value={100}>100x</option>
                    <option value={200}>200x</option>
                    <option value={500}>500x</option>
                    <option value={1000}>1000x</option>
                  </select>
                </div>

                {/* Enhanced Trade Summary */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-3">Trade Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Symbol:</span>
                      <span>{selectedSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Side:</span>
                      <span className={side === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                        {side}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>${wagerAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leverage:</span>
                      <span>{leverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margin:</span>
                      <span>${(parseFloat(wagerAmount) / leverage).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquidation:</span>
                      <span className="text-red-400">
                        ${calculateLiquidationPrice(currentPrice, side, leverage).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total:</span>
                      <span>${(parseFloat(wagerAmount) * leverage).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={placeTrade}
                  disabled={isTrading || !wagerAmount || parseFloat(wagerAmount) <= 0}
                  className={`w-full py-4 px-4 rounded-lg font-medium text-lg ${
                    isTrading || !wagerAmount || parseFloat(wagerAmount) <= 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : side === 'LONG'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isTrading ? 'Placing Trade...' : `Place ${side} Order`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel - Collapsible */}
      {showBottomPanel && (
        <div className="p-6 border-t border-gray-700">
          <div className="bg-gray-800 rounded-lg p-6">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('positions')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'positions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Current Positions ({positions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Trading History ({tradeHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('top')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'top'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Top Trades
              </button>
            </div>

            {/* Tab Content */}
            <div className="h-48 overflow-y-auto">
              {activeTab === 'positions' && (
                <div className="space-y-3">
                  {positions.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No open positions
                    </div>
                  ) : (
                    positions.map(position => (
                      <div key={position.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              position.side === 'LONG' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {position.side}
                            </div>
                            <div>
                              <div className="font-medium">{position.symbol}</div>
                              <div className="text-sm text-gray-400">
                                {position.leverage}x • ${position.size}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${
                              position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                            </div>
                            <div className={`text-sm ${
                              position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                            </div>
                          </div>
                          <button
                            onClick={() => closePosition(position.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Close
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Entry: ${position.entryPrice.toFixed(4)} • Current: ${position.currentPrice.toFixed(4)} • 
                          Liquidation: ${position.liquidationPrice.toFixed(4)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {tradeHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No trading history
                    </div>
                  ) : (
                    tradeHistory.map(trade => (
                      <div key={trade.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              trade.side === 'LONG' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {trade.side}
                            </div>
                            <div>
                              <div className="font-medium">{trade.symbol}</div>
                              <div className="text-sm text-gray-400">
                                {trade.leverage}x • ${trade.size} • {trade.duration}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </div>
                            <div className={`text-sm ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Entry: ${trade.entryPrice.toFixed(4)} • Exit: ${trade.exitPrice.toFixed(4)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'top' && (
                <div className="space-y-3">
                  {topTrades.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No top trades available
                    </div>
                  ) : (
                    topTrades.map(trade => (
                      <div key={trade.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              trade.side === 'LONG' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {trade.side}
                            </div>
                            <div>
                              <div className="font-medium">{trade.symbol}</div>
                              <div className="text-sm text-gray-400">
                                {trade.leverage}x • ${trade.size} • {trade.username}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </div>
                            <div className={`text-sm ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
