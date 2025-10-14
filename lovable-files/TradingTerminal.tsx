import React, { useState, useEffect } from 'react';
import { apiService } from './api';

interface FuturesSymbol {
  id: string;
  base: string;
  quote: string;
  maxLeverage: number;
  isMajor: boolean;
  isEnabled: boolean;
}

interface TradingRound {
  id: string;
  serverSeedHash: string;
  startsAt: string;
  endsAt: string;
  intervalMs: number;
  isActive: boolean;
  revealedAt?: string;
}

interface FuturesPosition {
  id: string;
  symbolId: string;
  side: string;
  qty: number;
  entryPrice: number;
  collateral: number;
  leverage: number;
  openedAt: string;
  closedAt?: string;
  status: string;
  realizedPnl: number;
  feesPaid: number;
  borrowStartAt?: string;
}

export const TradingTerminal: React.FC = () => {
  const [symbols, setSymbols] = useState<FuturesSymbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<TradingRound | null>(null);
  const [positions, setPositions] = useState<FuturesPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order form state
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [leverage, setLeverage] = useState(1);
  const [collateral, setCollateral] = useState('');
  const [qty, setQty] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [symbolsData, roundData, positionsData] = await Promise.all([
        apiService.getFuturesSymbols(),
        apiService.getCurrentTradingRound(),
        apiService.getFuturesPositions('OPEN'),
      ]);

      setSymbols(symbolsData);
      setCurrentRound(roundData);
      setPositions(positionsData.positions);

      if (symbolsData.length > 0) {
        setSelectedSymbol(symbolsData[0].id);
        setLeverage(symbolsData[0].maxLeverage);
      }
    } catch (err) {
      setError('Failed to load trading data');
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedSymbolData = symbols.find(s => s.id === selectedSymbol);

  const handleOpenPosition = async () => {
    if (!selectedSymbolData || !collateral) return;

    try {
      const orderData = {
        symbolId: selectedSymbol,
        side,
        leverage,
        collateral: parseFloat(collateral),
        qty: qty ? parseFloat(qty) : undefined,
      };

      const result = await apiService.openFuturesPosition(orderData);
      
      if (result.success) {
        alert(`Position opened successfully! Position ID: ${result.positionId}`);
        setCollateral('');
        setQty('');
        loadInitialData(); // Refresh positions
      }
    } catch (err: any) {
      alert(`Failed to open position: ${err.message}`);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    try {
      const result = await apiService.closeFuturesPosition(positionId);
      
      if (result.success) {
        alert(`Position closed! PnL: ${result.pnl || 0}`);
        loadInitialData(); // Refresh positions
      }
    } catch (err: any) {
      alert(`Failed to close position: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading trading terminal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">🚀 Futures Trading Terminal</h1>
          <p className="text-gray-300">Trade with up to 1000x leverage on majors, 10x on memes</p>
        </div>

        {/* Trading Round Info */}
        {currentRound && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-cyan-500">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Current Trading Round</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Round ID:</span>
                <div className="font-mono text-xs">{currentRound.id}</div>
              </div>
              <div>
                <span className="text-gray-400">Server Seed Hash:</span>
                <div className="font-mono text-xs">{currentRound.serverSeedHash.substring(0, 16)}...</div>
              </div>
              <div>
                <span className="text-gray-400">Starts:</span>
                <div>{new Date(currentRound.startsAt).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">Ends:</span>
                <div>{new Date(currentRound.endsAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Symbol Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Select Symbol</h3>
              
              <div className="space-y-2 mb-6">
                {symbols.map(symbol => (
                  <button
                    key={symbol.id}
                    onClick={() => {
                      setSelectedSymbol(symbol.id);
                      setLeverage(symbol.maxLeverage);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedSymbol === symbol.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{symbol.base}</span>
                      <div className="text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          symbol.isMajor ? 'bg-blue-600' : 'bg-purple-600'
                        }`}>
                          {symbol.isMajor ? 'Major' : 'Meme'}
                        </span>
                        <span className="ml-2 text-gray-400">{symbol.maxLeverage}x max</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Order Form */}
              {selectedSymbolData && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Open Position</h4>
                  
                  {/* Side Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Side</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSide('LONG')}
                        className={`p-3 rounded-lg font-semibold transition-colors ${
                          side === 'LONG'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        LONG
                      </button>
                      <button
                        onClick={() => setSide('SHORT')}
                        className={`p-3 rounded-lg font-semibold transition-colors ${
                          side === 'SHORT'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        SHORT
                      </button>
                    </div>
                  </div>

                  {/* Leverage */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Leverage: {leverage}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={selectedSymbolData.maxLeverage}
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Collateral */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Collateral (USDC)</label>
                    <input
                      type="number"
                      value={collateral}
                      onChange={(e) => setCollateral(e.target.value)}
                      placeholder="100.00"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Quantity (optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity (optional)</label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="Auto-calculate from collateral"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <button
                    onClick={handleOpenPosition}
                    disabled={!collateral}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                  >
                    Open Position
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Positions Table */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Open Positions</h3>
              
              {positions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No open positions
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-2">Symbol</th>
                        <th className="text-left py-3 px-2">Side</th>
                        <th className="text-left py-3 px-2">Size</th>
                        <th className="text-left py-3 px-2">Entry</th>
                        <th className="text-left py-3 px-2">Leverage</th>
                        <th className="text-left py-3 px-2">Collateral</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(position => (
                        <tr key={position.id} className="border-b border-gray-700">
                          <td className="py-3 px-2 font-semibold">{position.symbolId}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              position.side === 'LONG' ? 'bg-green-600' : 'bg-red-600'
                            }`}>
                              {position.side}
                            </span>
                          </td>
                          <td className="py-3 px-2">{position.qty}</td>
                          <td className="py-3 px-2">${position.entryPrice.toFixed(2)}</td>
                          <td className="py-3 px-2">{position.leverage}x</td>
                          <td className="py-3 px-2">${position.collateral.toFixed(2)}</td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => handleClosePosition(position.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
