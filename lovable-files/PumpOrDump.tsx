import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp: number;
}

export const PumpOrDump: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'pump' | 'dump'>('pump');
  const [countdown, setCountdown] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canBet, setCanBet] = useState(true);
  const [price, setPrice] = useState(50000);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [betId, setBetId] = useState<string | null>(null);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize with some candles
    const initialCandles: Candle[] = [];
    let basePrice = 50000;
    for (let i = 0; i < 8; i++) {
      const open = basePrice;
      const change = (Math.random() - 0.5) * 2000;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 500;
      const low = Math.min(open, close) - Math.random() * 500;
      initialCandles.push({ open, close, high, low, timestamp: Date.now() - (8 - i) * 10000 });
      basePrice = close;
    }
    setCandles(initialCandles);
    setPrice(basePrice);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startRound = () => {
    setIsPlaying(true);
    setCanBet(true);
    setCountdown(10);
    setResult(null);
    setBetId(null);
    
    const lastPrice = candles.length > 0 ? candles[candles.length - 1].close : 50000;
    const open = lastPrice;
    setPrice(open);
    
    const newCandle: Candle = {
      open,
      close: open,
      high: open,
      low: open,
      timestamp: Date.now(),
    };
    setCurrentCandle(newCandle);

    // Animate current candle volatility
    intervalRef.current = setInterval(() => {
      setPrice(prev => {
        const change = (Math.random() - 0.5) * 800;
        const newPrice = prev + change;
        
        setCurrentCandle(candle => {
          if (!candle) return null;
          return {
            ...candle,
            close: newPrice,
            high: Math.max(candle.high, newPrice),
            low: Math.min(candle.low, newPrice),
          };
        });
        
        return newPrice;
      });
    }, 150);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          finalizeCandle();
          return 0;
        }
        if (prev === 3) setCanBet(false); // Lock bets at 3 seconds
        return prev - 1;
      });
    }, 1000);
  };

  const finalizeCandle = async () => {
    if (currentCandle) {
      setCandles(prev => [...prev.slice(-7), currentCandle]);
    }
    setCurrentCandle(null);
    
    // Resolve bet if placed
    if (betId) {
      try {
        const resolved = await apiService.resolveBet(betId);
        await fetchBalances();
        
        const won = resolved.resultMultiplier > 0;
        setResult(won ? '🎉 YOU WON!' : '💥 YOU LOST!');
        
        // Auto restart after 3 seconds
        setTimeout(() => {
          setIsPlaying(false);
        }, 3000);
      } catch (error) {
        console.error('Bet resolution failed:', error);
        await fetchBalances();
        setResult('❌ Error: ' + (error as Error).message);
        setIsPlaying(false);
      } finally {
        setBetId(null);
      }
    } else {
      // No bet placed, just reset
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);
    }
  };

  const placeBet = async () => {
    if (!canBet || betId) return;
    
    try {
      const bet = await apiService.placeBet({
        game: 'pump_or_dump',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });
      
      setBetId(bet.id);
    } catch (error) {
      console.error('Bet failed:', error);
      setResult('❌ Bet failed: ' + (error as Error).message);
      setIsPlaying(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsPlaying(false);
    setCanBet(true);
    setResult(null);
    setCurrentCandle(null);
    setBetId(null);
  };

  // Render a single candlestick
  const renderCandle = (candle: Candle, index: number, isLive = false) => {
    const isPump = candle.close >= candle.open;
    const color = isPump ? 'bg-green-500' : 'bg-red-500';
    const bodyColor = isPump ? 'bg-green-400' : 'bg-red-400';
    const minPrice = Math.min(...candles.map(c => c.low), currentCandle?.low ?? Infinity);
    const maxPrice = Math.max(...candles.map(c => c.high), currentCandle?.high ?? 0);
    const priceRange = maxPrice - minPrice || 1;
    
    const wickBottom = ((candle.low - minPrice) / priceRange) * 100;
    const bodyBottom = ((Math.min(candle.open, candle.close) - minPrice) / priceRange) * 100;
    const bodyHeight = (Math.abs(candle.close - candle.open) / priceRange) * 100 || 2;
    const wickTop = ((candle.high - Math.max(candle.open, candle.close)) / priceRange) * 100;
    
    return (
      <div key={index} className="flex flex-col items-center justify-end h-full relative px-1">
        {/* Top wick */}
        <div 
          className={`w-0.5 ${color} ${isLive ? 'animate-pulse' : ''}`}
          style={{ height: `${wickTop}%` }}
        />
        {/* Body */}
        <div 
          className={`w-full ${bodyColor} ${isLive ? 'animate-pulse border-2 border-yellow-400' : ''} rounded-sm`}
          style={{ height: `${Math.max(bodyHeight, 2)}%` }}
        />
        {/* Bottom wick */}
        <div 
          className={`w-0.5 ${color} ${isLive ? 'animate-pulse' : ''}`}
          style={{ height: `${bodyBottom - wickBottom}%` }}
        />
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-black rounded-lg p-6 border-2 border-purple-500 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-red-400">
            📊 PUMP OR DUMP
          </h2>
          <p className="text-gray-300 text-sm">Real-time candle prediction • 1.95× payout</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Price</div>
          <div className={`text-2xl font-mono font-bold ${
            price > 52000 ? 'text-green-400' : price < 48000 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            ${price.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Enhanced Candlestick Chart */}
      <div className="bg-black rounded-lg p-4 mb-4 border-2 border-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
        
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-gray-800/50" />
          ))}
        </div>

        {/* Candlesticks */}
        <div className="relative h-48 flex items-end justify-around gap-1">
          {candles.slice(-8).map((candle, i) => renderCandle(candle, i))}
          {currentCandle && renderCandle(currentCandle, 999, true)}
        </div>

        {/* Countdown timer */}
        {countdown > 0 && countdown <= 10 && isPlaying && (
          <div className="absolute top-4 right-4 flex flex-col items-center">
            <div className="bg-yellow-500 text-black px-4 py-2 rounded-full text-2xl font-bold animate-bounce shadow-lg">
              {countdown}s
            </div>
            <div className="text-xs text-yellow-400 mt-1">Candle closing...</div>
          </div>
        )}

        {/* Bet indicator */}
        {betId && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            🎲 Bet Placed: {prediction.toUpperCase()}
          </div>
        )}
      </div>

      {/* Volume bars (decorative) */}
      <div className="flex gap-1 mb-4 h-8 items-end">
        {candles.slice(-8).map((candle, i) => (
          <div 
            key={i} 
            className={`flex-1 ${candle.close >= candle.open ? 'bg-green-600/30' : 'bg-red-600/30'} rounded-t`}
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
        {currentCandle && (
          <div className="flex-1 bg-yellow-500/30 rounded-t animate-pulse" style={{ height: '80%' }} />
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 p-4 rounded-lg ${
          result.includes('WON') 
            ? 'bg-green-500/20 text-green-400 border-2 border-green-500' 
            : result.includes('LOST')
            ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
            : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500'
        } animate-pulse`}>
          {result}
        </div>
      )}

      {!isPlaying && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stake (USDC):
            </label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full px-4 py-3 bg-gray-800 border-2 border-purple-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Prediction:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-6 rounded-lg font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'pump'
                    ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50 border-2 border-green-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-green-600'
                }`}
                onClick={() => setPrediction('pump')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-4xl mb-1">📈</div>
                  <div>PUMP</div>
                  <div className="text-xs text-green-200 mt-1">Price goes up</div>
                </div>
              </button>
              <button
                className={`py-6 rounded-lg font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'dump'
                    ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50 border-2 border-red-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-red-600'
                }`}
                onClick={() => setPrediction('dump')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-4xl mb-1">📉</div>
                  <div>DUMP</div>
                  <div className="text-xs text-red-200 mt-1">Price goes down</div>
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={startRound}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            🚀 START NEW ROUND
          </button>
        </div>
      )}

      {isPlaying && canBet && !betId && (
        <button
          onClick={placeBet}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50 animate-pulse"
        >
          💰 PLACE BET: {prediction.toUpperCase()} ({stake} USDC)
        </button>
      )}

      {isPlaying && betId && !result && (
        <div className="text-center space-y-2">
          <div className="text-yellow-400 font-bold text-xl animate-pulse">
            ⏳ Waiting for candle to close...
          </div>
          <div className="text-sm text-gray-400">
            Betting locked • Result coming in {countdown}s
          </div>
        </div>
      )}

      {isPlaying && !canBet && !betId && !result && (
        <div className="text-center text-gray-400 font-medium">
          ⚠️ Betting window closed for this round
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 Play Another Round
        </button>
      )}
    </div>
  );
};
