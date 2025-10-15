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
  stopLoss?: number;
  takeProfit?: number;
  timestamp: number;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED' | 'STOPPED' | 'TAKEN';
  fundingRate: number;
  fundingPayments: number;
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
  exitReason: 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION';
  fees: {
    openFee: number;
    closeFee: number;
    impactFee: number;
    fundingPayments: number;
  };
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

export const EnhancedTradingTerminalV2: React.FC<{ className?: string }> = ({ className = '' }) => {
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
  const [wagerAmount, setWagerAmount] = useState<string>('100');
  const [leverage, setLeverage] = useState<number>(10);
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [isTrading, setIsTrading] = useState<boolean>(false);

  // Stop Loss / Take Profit
  const [useTPSL, setUseTPSL] = useState<boolean>(false);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  // UI state
  const [showOrderPanel, setShowOrderPanel] = useState<boolean>(true);
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(true);
  const [chartHeight, setChartHeight] = useState<number>(600); // Adjustable chart height

  // Positions and history
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [chartLines, setChartLines] = useState<Array<{
    id: string;
    type: 'entry' | 'stop_loss' | 'take_profit';
    price: number;
    side: 'LONG' | 'SHORT';
    color: string;
  }>>([]);
  const [topTrades, setTopTrades] = useState<TopTrade[]>([]);
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'top'>('positions');

  // Refs
  const wsRef = useRef<WebSocket | null>(null);

  // Use centralized price manager
  const { prices } = usePrices();
  
  // Symbol data with real prices from centralized price manager (memoized to prevent infinite re-renders)
  const symbolData = useMemo(() => ({
    'BTC': { price: prices.BTC || 112823.3, name: 'Bitcoin', maxLeverage: 1000, isMeme: false },
    'ETH': { price: prices.ETH || 4107.29, name: 'Ethereum', maxLeverage: 1000, isMeme: false },
    'SOL': { price: prices.SOL || 202.29, name: 'Solana', maxLeverage: 1000, isMeme: false },
    'ASTER': { price: prices.ASTER || 1.4600, name: 'Aster', maxLeverage: 10, isMeme: true },
    'COAI': { price: prices.COAI || 0.000123, name: 'Coai', maxLeverage: 10, isMeme: true },
    'SUI': { price: prices.SUI || 2.45, name: 'Sui', maxLeverage: 1000, isMeme: false }
  }), [prices.BTC, prices.ETH, prices.SOL, prices.ASTER, prices.COAI, prices.SUI]);

  // Load balance
  const loadBalance = useCallback(async () => {
    try {
      const balance = await getBalance(bettingCurrency);
      setAvailableBalance(balance);
      console.log(`💰 Trading Terminal Balance: $${balance} USD (${bettingCurrency})`);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  }, [getBalance, bettingCurrency]);

  // Load positions from API
  const loadPositions = useCallback(async () => {
    try {
      const response = await apiService.getFuturesPositions('OPEN');
      if (response.positions) {
        const formattedPositions: Position[] = response.positions.map((pos: any) => ({
          id: pos.id,
          symbol: pos.symbolId.split('-')[0], // Extract symbol from "BTC-USDC"
          side: pos.side,
          size: pos.collateral,
          entryPrice: pos.entryPrice,
          currentPrice: symbolData[pos.symbolId.split('-')[0]]?.price || pos.entryPrice,
          leverage: pos.leverage,
          pnl: pos.realizedPnl || 0,
          pnlPercent: 0, // Will be calculated
          margin: pos.collateral,
          liquidationPrice: 0, // Will be fetched separately
          stopLoss: undefined, // Not implemented in backend yet
          takeProfit: undefined, // Not implemented in backend yet
          timestamp: new Date(pos.openedAt).getTime(),
          status: pos.status,
          fundingRate: 0.00005, // Default
          fundingPayments: pos.feesPaid || 0
        }));
        setPositions(formattedPositions);
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  }, [symbolData]);

  // Load trade history from API
  const loadTradeHistory = useCallback(async () => {
    try {
      const response = await apiService.getFuturesPositions('CLOSED', 1, 50);
      if (response.positions) {
        const formattedHistory: TradeHistory[] = response.positions.map((pos: any) => ({
          id: pos.id,
          symbol: pos.symbolId.split('-')[0],
          side: pos.side,
          size: pos.collateral,
          entryPrice: pos.entryPrice,
          exitPrice: pos.exitPrice || pos.entryPrice,
          leverage: pos.leverage,
          pnl: pos.realizedPnl || 0,
          pnlPercent: pos.realizedPnlPercent || 0,
          timestamp: new Date(pos.closedAt || pos.openedAt).getTime(),
          duration: formatDuration(new Date(pos.closedAt || pos.openedAt).getTime() - new Date(pos.openedAt).getTime()),
          exitReason: pos.exitReason || 'MANUAL',
          fees: {
            openFee: pos.openFee || 0,
            closeFee: pos.closeFee || 0,
            impactFee: pos.impactFee || 0,
            fundingPayments: pos.fundingPayments || 0
          }
        }));
        setTradeHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Failed to load trade history:', error);
    }
  }, []);

  // Calculate fees - REALISTIC RATES
  const calculateFees = useCallback((amount: number, leverage: number) => {
    const positionSize = amount * leverage;
    
    // Much more realistic fee structure
    const openFee = amount * 0.0001; // 0.01% of wager amount (not position size)
    const closeFee = amount * 0.0001; // 0.01% of wager amount (not position size)
    
    // Impact fee based on position size but much lower
    let impactFeeRate = 0.0001; // 0.01% base
    if (positionSize > 100000) impactFeeRate = 0.0002; // 0.02% for large positions
    if (positionSize > 500000) impactFeeRate = 0.0003; // 0.03% for very large positions
    if (positionSize > 1000000) impactFeeRate = 0.0005; // 0.05% for massive positions
    
    const impactFee = positionSize * impactFeeRate;
    const borrowRate = 0.00001; // 0.001%/hr (much lower)
    
    return {
      openFee,
      closeFee,
      impactFee,
      impactFeeRate: impactFeeRate * 100, // Convert to percentage for display
      borrowRate,
      totalFees: openFee + closeFee + impactFee
    };
  }, []);

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

  // Check stop loss and take profit
  const checkTPSL = useCallback((position: Position) => {
    if (!position.stopLoss && !position.takeProfit) return null;

    const { pnl, pnlPercent } = calculatePnL(position.entryPrice, position.currentPrice, position.side, position.size, position.leverage);
    
    // Check stop loss
    if (position.stopLoss && position.side === 'LONG' && position.currentPrice <= position.stopLoss) {
      return 'STOP_LOSS';
    }
    if (position.stopLoss && position.side === 'SHORT' && position.currentPrice >= position.stopLoss) {
      return 'STOP_LOSS';
    }
    
    // Check take profit
    if (position.takeProfit && position.side === 'LONG' && position.currentPrice >= position.takeProfit) {
      return 'TAKE_PROFIT';
    }
    if (position.takeProfit && position.side === 'SHORT' && position.currentPrice <= position.takeProfit) {
      return 'TAKE_PROFIT';
    }
    
    return null;
  }, [calculatePnL]);

  // Update current price when symbol changes
  useEffect(() => {
    const realPrice = symbolData[selectedSymbol]?.price || 1.4600;
    setCurrentPrice(realPrice);
    
    // Reset leverage if it exceeds max for selected symbol
    const maxLeverage = symbolData[selectedSymbol]?.maxLeverage || 1000;
    if (leverage > maxLeverage) {
      setLeverage(maxLeverage);
    }
  }, [selectedSymbol, symbolData, leverage]);

  // Load balance, positions, and trade history on mount
  useEffect(() => {
    loadBalance();
    loadPositions();
    loadTradeHistory();
  }, [loadBalance, loadPositions, loadTradeHistory]);

  // Refresh balance when network or currency changes (like Diamond Hands)
  useEffect(() => {
    loadBalance();
  }, [network, bettingCurrency, loadBalance]);

  // Update positions with current prices (simplified to prevent infinite loops)
  useEffect(() => {
    if (positions.length === 0) return;
    
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
  }, [symbolData.BTC, symbolData.ETH, symbolData.SOL, symbolData.ASTER, symbolData.COAI, symbolData.SUI]); // Only depend on individual price values

  // Check for stop loss and take profit (separate useEffect)
  useEffect(() => {
    positions.forEach(position => {
      if (position.status === 'OPEN') {
        const tpslResult = checkTPSL(position);
        if (tpslResult) {
          // Auto-close position
          setTimeout(() => {
            closePosition(position.id, tpslResult);
          }, 100);
        }
      }
    });
  }, [positions, checkTPSL]);

  // Update chart lines based on positions (separate useEffect to avoid infinite loop)
  useEffect(() => {
    const newChartLines: Array<{
      id: string;
      type: 'entry' | 'stop_loss' | 'take_profit';
      price: number;
      side: 'LONG' | 'SHORT';
      color: string;
    }> = [];

    positions.forEach(position => {
      if (position.status === 'OPEN') {
        // Entry line
        newChartLines.push({
          id: `${position.id}-entry`,
          type: 'entry',
          price: position.entryPrice,
          side: position.side,
          color: position.side === 'LONG' ? '#00d4aa' : '#ff6b6b'
        });

        // Stop loss line
        if (position.stopLoss) {
          newChartLines.push({
            id: `${position.id}-sl`,
            type: 'stop_loss',
            price: position.stopLoss,
            side: position.side,
            color: '#ff6b6b'
          });
        }

        // Take profit line
        if (position.takeProfit) {
          newChartLines.push({
            id: `${position.id}-tp`,
            type: 'take_profit',
            price: position.takeProfit,
            side: position.side,
            color: '#00d4aa'
          });
        }
      }
    });

    setChartLines(newChartLines);
  }, [positions]);

  // Place trade
  const placeTrade = async () => {
    if (!user) return;
    
    setIsTrading(true);
    try {
      const amount = parseFloat(wagerAmount);
      
      // Check balance using the same system as Diamond Hands
      console.log(`💰 Trading Balance Check: $${availableBalance} USD vs $${amount} USD stake`);
      console.log(`💰 Sufficient funds? ${availableBalance >= amount ? 'YES' : 'NO'}`);
      
      if (amount <= 0 || amount > availableBalance) {
        alert(`❌ Insufficient balance! You have $${availableBalance.toFixed(2)} USD but need $${amount.toFixed(2)} USD`);
        setIsTrading(false);
        return;
      }

      const maxLeverage = symbolData[selectedSymbol]?.maxLeverage || 1000;
      if (leverage > maxLeverage) {
        alert(`Maximum leverage for ${selectedSymbol} is ${maxLeverage}x`);
        setIsTrading(false);
        return;
      }

      const fees = calculateFees(amount, leverage);

      // Create symbol ID for API
      const symbolId = `${selectedSymbol}-USDC`;

      // Call real API to open position
      const response = await apiService.openFuturesPosition({
        symbolId,
        side,
        leverage,
        collateral: amount,
        qty: amount * leverage / currentPrice, // Convert to quantity
        splitSize: amount, // For impact fee calculation
        network: network // Send current network (mainnet/testnet)
      });

      if (response.success) {
        // Refresh positions and balance
        console.log('🔄 Refreshing positions and balance after successful trade...');
        await loadPositions();
        await loadBalance();
        
        // Force refresh balances from the global context
        if (refreshBalances) {
          console.log('🔄 Triggering global balance refresh...');
          await refreshBalances();
        }
        
        alert(`✅ Position opened successfully! Position ID: ${response.positionId}`);
      } else {
        alert(`❌ Failed to open position: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to place trade:', error);
      alert(`❌ Failed to place trade: ${error.message || 'Unknown error'}`);
    } finally {
      setIsTrading(false);
    }
  };

  // Close position
  const closePosition = async (positionId: string, exitReason: 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION' = 'MANUAL') => {
    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) return;

      // Call real API to close position
      const response = await apiService.closeFuturesPosition(positionId);
      
      if (response.success) {
        // Refresh positions, balance, and trade history
        await loadPositions();
        await loadBalance();
        await loadTradeHistory();
        
        const exitMessage = exitReason === 'STOP_LOSS' ? 'Stop Loss triggered!' : 
                           exitReason === 'TAKE_PROFIT' ? 'Take Profit triggered!' :
                           exitReason === 'LIQUIDATION' ? 'Position liquidated!' : 'Position closed!';

        alert(`${exitMessage} PnL: ${response.pnl >= 0 ? '+' : ''}$${response.pnl.toFixed(2)}`);
      } else {
        alert(`Failed to close position: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to close position:', error);
      alert(`Failed to close position: ${error.message || 'Unknown error'}`);
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

  const fees = calculateFees(parseFloat(wagerAmount), leverage);
  const maxLeverage = symbolData[selectedSymbol]?.maxLeverage || 1000;
  const isMeme = symbolData[selectedSymbol]?.isMeme || false;

  return (
    <div className={`bg-gray-900 text-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">DEXINO Trading Terminal</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              Balance: {formatBalance(availableBalance)} {bettingCurrency}
            </div>
            <div className={`text-sm px-3 py-1 rounded font-medium ${
              network === 'testnet' 
                ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
                : 'bg-red-900/30 text-red-300 border border-red-500/30'
            }`}>
              {network === 'testnet' ? '🎮 DEMO MODE' : '💰 LIVE MODE'}
            </div>
            <div className="text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
              💡 Trading requires USDC
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
              {/* Chart Height Control */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Chart Height:</span>
                <input
                  type="range"
                  min="400"
                  max="800"
                  value={chartHeight}
                  onChange={(e) => setChartHeight(Number(e.target.value))}
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400">{chartHeight}px</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Symbol Selectors */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Symbol:</span>
            <div className="flex space-x-1">
              {Object.keys(symbolData).map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedSymbol === symbol 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {symbol}
                  {symbolData[symbol].isMeme && <span className="ml-1 text-xs">🎭</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: `${chartHeight + 200}px` }}>
        {/* Order Panel - LEFT SIDE */}
        {showOrderPanel && (
          <div 
            className="p-2 border-r border-gray-700 flex-shrink-0" 
            style={{ 
              width: '350px',
              minWidth: '350px',
              maxWidth: '350px'
            }}
          >
            <div className="h-full bg-gray-800 rounded-lg p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Place Order</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-400">{selectedSymbol}</span>
                  {symbolData[selectedSymbol]?.isMeme && <span className="text-xs bg-purple-600 px-2 py-1 rounded">MEME</span>}
                </div>
              </div>
              
              {/* USDC Notice */}
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-blue-300 font-medium">USDC Required</span>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  All leverage trades require USDC as collateral. Get USDC from the faucet in Demo mode.
                </p>
              </div>
              
              <div className="space-y-4">
                {/* Wager Amount */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Wager (USD)</label>
                  <input
                    type="number"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                  />
                </div>

                {/* Risk/Reward Bar */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Risk/Reward</div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (leverage / maxLeverage) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Leverage with Scrollable Bar */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">PAYOUT MULTIPLIER</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      onClick={() => setLeverage(Math.max(1, leverage - 1))}
                      className="w-8 h-8 bg-gray-700 text-white rounded flex items-center justify-center hover:bg-gray-600"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-lg font-bold">{leverage}x</span>
                    </div>
                    <button
                      onClick={() => setLeverage(Math.min(maxLeverage, leverage + 1))}
                      className="w-8 h-8 bg-gray-700 text-white rounded flex items-center justify-center hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Leverage Slider */}
                  <input
                    type="range"
                    min="1"
                    max={maxLeverage}
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(leverage / maxLeverage) * 100}%, #374151 ${(leverage / maxLeverage) * 100}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>x1 Safe</span>
                    <span>Wild - x{maxLeverage}</span>
                  </div>
                </div>

                {/* Stop Loss / Take Profit */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="tpsl"
                      checked={useTPSL}
                      onChange={(e) => setUseTPSL(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="tpsl" className="text-sm text-gray-400">TP/SL</label>
                    <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-300 cursor-help">
                      i
                    </div>
                  </div>
                  
                  {useTPSL && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Stop Loss</label>
                        <input
                          type="number"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(e.target.value)}
                          className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Enter stop loss price"
                          step="0.0001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Take Profit</label>
                        <input
                          type="number"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(e.target.value)}
                          className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Enter take profit price"
                          step="0.0001"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Side Selection */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Side</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSide('LONG')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium ${
                        side === 'LONG' 
                          ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Buy/Long
                    </button>
                    <button
                      onClick={() => setSide('SHORT')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium ${
                        side === 'SHORT' 
                          ? 'bg-gradient-to-r from-orange-500 to-purple-500 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Sell/Short
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {side === 'LONG' ? `Bust ${calculateLiquidationPrice(currentPrice, 'LONG', leverage).toFixed(6)}` : 
                     `Bust ${calculateLiquidationPrice(currentPrice, 'SHORT', leverage).toFixed(6)}`}
                  </div>
                </div>

                {/* Fees Breakdown */}
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-2">Fees</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Open Fee (0.01%):</span>
                      <span>{formatCurrency(fees.openFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Close Fee (0.01%):</span>
                      <span>{formatCurrency(fees.closeFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impact Fee ({fees.impactFeeRate.toFixed(2)}%):</span>
                      <span>{formatCurrency(fees.impactFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Borrow Rate:</span>
                      <span>0.001%/hr</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-400">
                      <span>Total Fees:</span>
                      <span>{formatCurrency(fees.totalFees)}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <div className="mt-4 mb-2">
                  <button
                    onClick={placeTrade}
                    disabled={isTrading || !wagerAmount || parseFloat(wagerAmount) <= 0}
                    className={`w-full py-3 px-4 rounded-lg font-medium ${
                      isTrading || !wagerAmount || parseFloat(wagerAmount) <= 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : side === 'LONG'
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600'
                        : 'bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-600 hover:to-purple-600'
                    }`}
                  >
                    {isTrading ? 'Placing Trade...' : `Place ${side} Order`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Area - RIGHT SIDE */}
        <div 
          className="p-2 flex-1" 
          style={{ 
            minWidth: showOrderPanel ? 'calc(100% - 350px)' : '100%',
            overflow: 'hidden'
          }}
        >
          <div className="h-full bg-gray-800 rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">LIVE</span>
                </div>
              </div>
            </div>
            
            {/* TradingView Chart - FILL CONTAINER */}
            <div className="w-full h-full relative" style={{ height: `calc(100% - 60px)` }}>
              <TradingViewChart
                symbol={selectedSymbol}
                timeframe={timeframe}
                width={showOrderPanel ? 2000 : 2400}
                height={chartHeight - 100}
                autosize={true}
                chartLines={chartLines}
              />
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Data</span>
                </div>
                <div className="text-sm">Current Price: ${currentPrice.toFixed(4)}</div>
                {isMeme && <span className="text-xs bg-purple-600 px-2 py-1 rounded">MEME</span>}
              </div>
              <div className="text-xs">
                Powered by TradingView • DEXINO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Panel - When Positions are Hidden */}
      {!showBottomPanel && (
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Switch to Games</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Game Cards - Top 4 Games */}
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                <div className="text-lg font-bold text-green-400 mb-2">🚀 To The Moon</div>
                <div className="text-sm text-gray-400">Crash-style multiplier game</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                <div className="text-lg font-bold text-blue-400 mb-2">📈 Pump or Dump</div>
                <div className="text-sm text-gray-400">Predict price direction</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                <div className="text-lg font-bold text-purple-400 mb-2">💎 Diamond Hands</div>
                <div className="text-sm text-gray-400">Minesweeper-style game</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                <div className="text-lg font-bold text-red-400 mb-2">🔫 Bullet Bet</div>
                <div className="text-sm text-gray-400">Russian roulette style</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Panel - Collapsible */}
      {showBottomPanel && (
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-800 rounded-lg p-4">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveTab('positions')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === 'positions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Current Positions ({positions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Trading History ({tradeHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('top')}
                className={`px-3 py-1 rounded text-sm font-medium ${
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
                <div className="space-y-2">
                  {positions.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      No open positions
                    </div>
                  ) : (
                    positions.map(position => (
                      <div key={position.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              position.side === 'LONG' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {position.side}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{position.symbol}</div>
                              <div className="text-xs text-gray-400">
                                {position.leverage}x • ${position.size}
                                {position.stopLoss && <span className="ml-2 text-red-400">SL: ${position.stopLoss.toFixed(4)}</span>}
                                {position.takeProfit && <span className="ml-2 text-green-400">TP: ${position.takeProfit.toFixed(4)}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium text-sm ${
                              position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                            </div>
                            <div className={`text-xs ${
                              position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                            </div>
                          </div>
                          <button
                            onClick={() => closePosition(position.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Close
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Entry: ${position.entryPrice.toFixed(4)} • Current: ${position.currentPrice.toFixed(4)} • 
                          Liquidation: ${position.liquidationPrice.toFixed(4)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-2">
                  {tradeHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      No trading history
                    </div>
                  ) : (
                    tradeHistory.map(trade => (
                      <div key={trade.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.side === 'LONG' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {trade.side}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{trade.symbol}</div>
                              <div className="text-xs text-gray-400">
                                {trade.leverage}x • ${trade.size} • {trade.duration}
                                <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                                  trade.exitReason === 'STOP_LOSS' ? 'bg-red-600' :
                                  trade.exitReason === 'TAKE_PROFIT' ? 'bg-green-600' :
                                  trade.exitReason === 'LIQUIDATION' ? 'bg-red-800' : 'bg-gray-600'
                                }`}>
                                  {trade.exitReason.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium text-sm ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </div>
                            <div className={`text-xs ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Entry: ${trade.entryPrice.toFixed(4)} • Exit: ${trade.exitPrice.toFixed(4)} • 
                          Fees: {formatCurrency(trade.fees.openFee + trade.fees.closeFee + trade.fees.impactFee)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'top' && (
                <div className="space-y-2">
                  {topTrades.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      No top trades available
                    </div>
                  ) : (
                    topTrades.map(trade => (
                      <div key={trade.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.side === 'LONG' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {trade.side}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{trade.symbol}</div>
                              <div className="text-xs text-gray-400">
                                {trade.leverage}x • ${trade.size} • {trade.username}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium text-sm ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </div>
                            <div className={`text-xs ${
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
