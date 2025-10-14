import React, { useState, useEffect } from 'react';
import { apiService } from './api';
import { DexinoTradingInterface } from './DexinoTradingInterface';

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
  const [seeding, setSeeding] = useState(false);

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

      // Handle empty responses gracefully
      setSymbols(Array.isArray(symbolsData) ? symbolsData : []);
      setCurrentRound(roundData && Object.keys(roundData).length > 0 ? roundData : null);
      setPositions(positionsData && positionsData.positions ? positionsData.positions : []);

      if (Array.isArray(symbolsData) && symbolsData.length > 0) {
        setSelectedSymbol(symbolsData[0].id);
        setLeverage(symbolsData[0].maxLeverage);
      } else {
        // If no symbols, show a helpful message
        setError('No trading symbols available. Please contact support to initialize the trading system.');
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

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      await Promise.all([
        apiService.seedFuturesSymbols(),
        apiService.createInitialTradingRound(),
      ]);
      alert('Database seeded successfully!');
      loadInitialData(); // Refresh data
    } catch (err: any) {
      alert(`Failed to seed database: ${err.message}`);
    } finally {
      setSeeding(false);
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
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          {error.includes('No trading symbols available') && (
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
            >
              {seeding ? 'Seeding Database...' : 'Initialize Trading System'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <DexinoTradingInterface />
    </div>
  );
};
