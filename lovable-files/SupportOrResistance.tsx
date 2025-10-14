import React, { useState, useEffect, useRef } from 'react';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { useBalance } from './BalanceContext';
import { WalletBalance } from './WalletBalance';

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp: number;
}

export const SupportOrResistance: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'break' | 'reject'>('break');
  const [isPlaying, setIsPlaying] = useState(false);
  const [price, setPrice] = useState(50000);
  const [support, setSupport] = useState(48500);
  const [resistance, setResistance] = useState(51500);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [priceMoving, setPriceMoving] = useState(false);
  const [breakoutDirection, setBreakoutDirection] = useState<'up' | 'down' | null>(null);
  const { placeBet, resolveBet, getBalance, isBetting, error } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, displayCurrency, formatBalance } = useCurrency();
  const { getAvailableBalance } = useBalance();
  const [balance, setBalance] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh balance when network or currency changes
  useEffect(() => {
    refreshBalance();
  }, [network, bettingCurrency]);

  // Sync with global balance changes
  useEffect(() => {
    const currentBalance = getAvailableBalance(bettingCurrency);
    setBalance(currentBalance);
  }, [bettingCurrency]); // Remove getAvailableBalance from dependencies to prevent render loop

  const refreshBalance = async () => {
    try {
      // Use global balance context for immediate balance access
      const currentBalance = getAvailableBalance(bettingCurrency);
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  useEffect(() => {
    // Initialize with candlesticks
    const initCandles: Candle[] = [];
    let currentPrice = 50000;
    const sup = 48500;
    const res = 51500;
    
    for (let i = 0; i < 15; i++) {
      const open = currentPrice;
      const targetPrice = sup + Math.random() * (res - sup);
      const close = open * 0.7 + targetPrice * 0.3;
      const high = Math.max(open, close) + Math.random() * 300;
      const low = Math.min(open, close) - Math.random() * 300;
      
      initCandles.push({
        open,
        close,
        high,
        low,
        timestamp: Date.now() - (15 - i) * 3000,
      });
      currentPrice = close;
    }
    
    setCandles(initCandles);
    setPrice(currentPrice);
    setSupport(sup);
    setResistance(res);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const placeBet = async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      setPriceMoving(true);
      setResult(null);
      setBreakoutDirection(null);

      // Check if user has sufficient balance
    if (balance < parseFloat(stake)) {
      setResult('❌ Insufficient balance!');
      setIsPlaying(false);
      return;
    }

    const bet = await placeBet({
        game: 'support_or_resistance',
        currency: 'USD', // Always bet in USD,
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });

      // Start forming new candle
      const open = price;
      const newCandle: Candle = {
        open,
        close: open,
        high: open,
        low: open,
        timestamp: Date.now(),
      };
      setCurrentCandle(newCandle);

      // Animate price building tension
      let step = 0;
      
      intervalRef.current = setInterval(() => {
        step++;
        
        if (step < 20) {
          // Create tension with realistic movements toward a level
          const targetLevel = Math.random() > 0.5 ? resistance : support;
          const progress = step / 20;
          const tensionPrice = open + (targetLevel - open) * progress + Math.sin(step) * 200;
          
          setPrice(tensionPrice);
          setCurrentCandle(candle => {
            if (!candle) return null;
            return {
              ...candle,
              close: tensionPrice,
              high: Math.max(candle.high, tensionPrice),
              low: Math.min(candle.low, tensionPrice),
            };
          });
        } else {
          // Final decision
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Resolve bet with error handling
          resolveBet(bet.id)
            .then(async (resolved) => {
              const won = resolved.resultMultiplier > 0;
              const actualOutcome = won ? prediction : (prediction === 'break' ? 'reject' : 'break');
              
              let finalPrice: number;
              if (actualOutcome === 'break') {
                if (Math.random() > 0.5) {
                  finalPrice = resistance + 800;
                  setBreakoutDirection('up');
                } else {
                  finalPrice = support - 800;
                  setBreakoutDirection('down');
                }
              } else {
                finalPrice = (support + resistance) / 2;
              }
              
              // Finalize candle
              if (currentCandle) {
                const finalCandle = {
                  ...currentCandle,
                  close: finalPrice,
                  high: Math.max(currentCandle.high, finalPrice),
                  low: Math.min(currentCandle.low, finalPrice),
                };
                setCandles(prev => [...prev.slice(-14), finalCandle]);
                setCurrentCandle(null);
              }
              
              setPrice(finalPrice);
              await refreshBalance();
              setResult(won ? '🎉 YOU WON! 2.0×' : '💥 YOU LOST!');
              setPriceMoving(false);
            })
            .catch(async (error) => {
              console.error('Bet resolution failed:', error);
              await refreshBalance();
              setResult('❌ Error: ' + error.message);
              setPriceMoving(false);
            })
            .finally(() => {
              setIsPlaying(false);
            });
        }
      }, 150);

    } catch (error) {
      console.error('Bet failed:', error);
      setResult('❌ Bet failed: ' + (error as Error).message);
      setIsPlaying(false);
      setPriceMoving(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setPriceMoving(false);
    setResult(null);
    setBreakoutDirection(null);
    setCurrentCandle(null);
    
    // New support/resistance levels
    const newSupport = 47000 + Math.random() * 2000;
    const newResistance = 51000 + Math.random() * 2000;
    const newPrice = newSupport + (newResistance - newSupport) * 0.5;
    
    setSupport(newSupport);
    setResistance(newResistance);
    setPrice(newPrice);
  };

  // Render candlestick
  const renderCandle = (candle: Candle, index: number, isLive = false) => {
    const isPump = candle.close >= candle.open;
    const color = isPump ? 'bg-green-500' : 'bg-red-500';
    const bodyColor = isPump ? 'bg-green-400' : 'bg-red-400';
    
    const allCandles = [...candles, ...(currentCandle ? [currentCandle] : [])];
    const minPrice = Math.min(support - 1000, ...allCandles.map(c => c.low));
    const maxPrice = Math.max(resistance + 1000, ...allCandles.map(c => c.high));
    const priceRange = maxPrice - minPrice || 1;
    
    const wickBottom = ((candle.low - minPrice) / priceRange) * 100;
    const bodyBottom = ((Math.min(candle.open, candle.close) - minPrice) / priceRange) * 100;
    const bodyHeight = (Math.abs(candle.close - candle.open) / priceRange) * 100 || 2;
    const wickTop = ((candle.high - Math.max(candle.open, candle.close)) / priceRange) * 100;
    
    return (
      <div key={index} className="flex flex-col items-center justify-end h-full relative px-0.5">
        <div 
          className={`w-0.5 ${color} ${isLive ? 'animate-pulse' : ''}`}
          style={{ height: `${wickTop}%` }}
        />
        <div 
          className={`w-full ${bodyColor} ${isLive ? 'animate-pulse border border-yellow-400' : ''} rounded-sm`}
          style={{ height: `${Math.max(bodyHeight, 2)}%` }}
        />
        <div 
          className={`w-0.5 ${color} ${isLive ? 'animate-pulse' : ''}`}
          style={{ height: `${bodyBottom - wickBottom}%` }}
        />
      </div>
    );
  };

  const allCandles = [...candles, ...(currentCandle ? [currentCandle] : [])];
  const minPrice = Math.min(support - 1000, ...allCandles.map(c => c.low));
  const maxPrice = Math.max(resistance + 1000, ...allCandles.map(c => c.high));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-lg p-6 border-2 border-indigo-500 shadow-2xl relative">
      <WalletBalance position="top-right" />
      {/* Balance Display */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Balance:</span>
          <span className="font-mono font-bold text-green-400">
            {formatBalance(balance, bettingCurrency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>Network: {network}</span>
          <span>Currency: {bettingCurrency}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-red-400">
            ⚡ SUPPORT OR RESISTANCE
          </h2>
          <p className="text-gray-300 text-sm">Break through or bounce back? • 2.0× payout</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Price</div>
          <div className={`text-2xl font-mono font-bold ${
            price > resistance ? 'text-red-400' : 
            price < support ? 'text-blue-400' : 
            'text-yellow-400'
          }`}>
            ${price.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Enhanced Chart with Candlesticks */}
      <div className="bg-black rounded-lg p-4 mb-4 border-2 border-indigo-700 relative overflow-hidden h-80">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        
        {/* Grid */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-gray-800/30" />
          ))}
        </div>

        {/* Resistance Zone */}
        <div 
          className="absolute left-0 right-0 h-10 bg-red-500/10 border-t-2 border-b border-red-500 border-dashed z-10"
          style={{ 
            top: `${((maxPrice - resistance) / priceRange) * 100}%`,
          }}
        >
          <div className="flex items-center justify-between px-2 h-full">
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold shadow-lg">
              RESISTANCE ${resistance.toFixed(0)}
            </span>
            {breakoutDirection === 'up' && (
              <div className="flex items-center space-x-1 animate-bounce">
                <div className="text-red-400 text-2xl">🚀</div>
                <span className="text-red-400 text-sm font-bold">BREAKOUT!</span>
              </div>
            )}
          </div>
        </div>

        {/* Support Zone */}
        <div 
          className="absolute left-0 right-0 h-10 bg-blue-500/10 border-b-2 border-t border-blue-500 border-dashed z-10"
          style={{ 
            top: `${((maxPrice - support) / priceRange) * 100}%`,
          }}
        >
          <div className="flex items-center justify-between px-2 h-full">
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-bold shadow-lg">
              SUPPORT ${support.toFixed(0)}
            </span>
            {breakoutDirection === 'down' && (
              <div className="flex items-center space-x-1 animate-bounce">
                <div className="text-blue-400 text-2xl">💥</div>
                <span className="text-blue-400 text-sm font-bold">BREAKDOWN!</span>
              </div>
            )}
          </div>
        </div>

        {/* Candlesticks */}
        <div className="relative h-full flex items-end justify-around gap-1">
          {candles.slice(-15).map((candle, i) => renderCandle(candle, i))}
          {currentCandle && renderCandle(currentCandle, 999, true)}
        </div>

        {/* Tension overlay */}
        {priceMoving && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-500/10 to-yellow-500/5 animate-pulse z-20 pointer-events-none" />
        )}
      </div>

      {/* Market pressure indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>🐂 Buyer Pressure</span>
          <span>🐻 Seller Pressure</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ 
              width: `${((price - support) / (resistance - support)) * 100}%` 
            }}
          />
          <div 
            className="bg-gradient-to-r from-red-400 to-red-500 flex-1"
          />
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 p-6 rounded-xl border-4 relative overflow-hidden ${
          result.includes('WON') 
            ? 'bg-green-500/30 text-green-400 border-green-500' 
            : result.includes('LOST')
            ? 'bg-red-500/30 text-red-400 border-red-500'
            : 'bg-yellow-500/30 text-yellow-400 border-yellow-500'
        } animate-pulse shadow-2xl`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="relative">{result}</div>
        </div>
      )}

      {!isPlaying && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stake (USD):
            </label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full px-4 py-3 bg-gray-800 border-2 border-indigo-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Prediction:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'break'
                    ? 'bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/50 border-4 border-red-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-red-600'
                }`}
                onClick={() => setPrediction('break')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-4xl mb-1">💥</div>
                  <div>BREAK</div>
                  <div className="text-xs text-red-200 mt-1">Smash through</div>
                </div>
              </button>
              <button
                className={`py-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'reject'
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/50 border-4 border-blue-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-blue-600'
                }`}
                onClick={() => setPrediction('reject')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-4xl mb-1">🛡️</div>
                  <div>REJECT</div>
                  <div className="text-xs text-blue-200 mt-1">Bounce back</div>
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={placeBet}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/50"
          >
            🎯 PLACE BET ({stake} USD)
          </button>
        </div>
      )}

      {priceMoving && (
        <div className="text-center space-y-2 bg-gray-800/50 rounded-lg p-4 border-2 border-purple-600">
          <div className="text-yellow-400 font-bold text-2xl animate-pulse">
            ⚡ Price testing {price > (support + resistance) / 2 ? 'RESISTANCE' : 'SUPPORT'}...
          </div>
          <div className="text-sm text-gray-400">
            {prediction === 'break' ? 'Break through and win!' : 'Hold the level!'}
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 New Chart Setup
        </button>
      )}
    </div>
  );
};
