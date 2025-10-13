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

const TIME_OPTIONS = [
  { value: 5, label: '5s', speed: 80 },
  { value: 10, label: '10s', speed: 150 },
  { value: 15, label: '15s', speed: 225 },
  { value: 30, label: '30s', speed: 450 },
  { value: 60, label: '1min', speed: 900 },
];

export const PumpOrDump: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'pump' | 'dump'>('pump');
  const [timeframe, setTimeframe] = useState(10);
  const [countdown, setCountdown] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canBet, setCanBet] = useState(true);
  const [price, setPrice] = useState(50000);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [betId, setBetId] = useState<string | null>(null);
  const [volumeBars, setVolumeBars] = useState<number[]>([]);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [currentPnL, setCurrentPnL] = useState<number>(0);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialCandles: Candle[] = [];
    let basePrice = 50000;
    const initialVolume: number[] = [];
    
    for (let i = 0; i < 12; i++) {
      const open = basePrice;
      const change = (Math.random() - 0.5) * 2000;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 500;
      const low = Math.min(open, close) - Math.random() * 500;
      initialCandles.push({ open, close, high, low, timestamp: Date.now() - (12 - i) * 10000 });
      initialVolume.push(30 + Math.random() * 70);
      basePrice = close;
    }
    
    setCandles(initialCandles);
    setVolumeBars(initialVolume);
    setPrice(basePrice);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startRound = async () => {
    setIsPlaying(true);
    setCanBet(false); // Disable betting immediately
    setCountdown(timeframe);
    setResult(null);
    
    const lastPrice = candles.length > 0 ? candles[candles.length - 1].close : 50000;
    const open = lastPrice;
    setPrice(open);
    setEntryPrice(open); // Set entry price for P&L tracking
    setCurrentPnL(0);
    
    const newCandle: Candle = {
      open,
      close: open,
      high: open,
      low: open,
      timestamp: Date.now(),
    };
    setCurrentCandle(newCandle);

    // Automatically place bet when round starts
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
      return;
    }

    const updateSpeed = TIME_OPTIONS.find(t => t.value === timeframe)?.speed || 150;
    
    intervalRef.current = setInterval(() => {
      setPrice(prev => {
        const volatility = (Math.random() - 0.5) * 800;
        const trend = (Math.random() - 0.5) * 300;
        const newPrice = prev + volatility + trend;
        
        setCurrentCandle(candle => {
          if (!candle) return null;
          return {
            ...candle,
            close: newPrice,
            high: Math.max(candle.high, newPrice),
            low: Math.min(candle.low, newPrice),
          };
        });
        
        // Calculate P&L based on prediction
        const priceChange = newPrice - open;
        const pnlPercent = (priceChange / open) * 100;
        
        let estimatedPnL = 0;
        if (prediction === 'pump' && priceChange > 0) {
          estimatedPnL = parseFloat(stake) * 0.95 * (pnlPercent / 2); // Theoretical profit
        } else if (prediction === 'dump' && priceChange < 0) {
          estimatedPnL = parseFloat(stake) * 0.95 * (Math.abs(pnlPercent) / 2);
        } else {
          estimatedPnL = -parseFloat(stake) * (Math.abs(pnlPercent) / 10); // Theoretical loss
        }
        
        setCurrentPnL(estimatedPnL);
        
        return newPrice;
      });
    }, updateSpeed);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          finalizeCandle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finalizeCandle = async () => {
    let finalPrice = price;
    
    if (currentCandle) {
      finalPrice = currentCandle.close;
      setCandles(prev => [...prev.slice(-11), currentCandle]);
      setVolumeBars(prev => [...prev.slice(-11), 30 + Math.random() * 70]);
    }
    setCurrentCandle(null);
    setCurrentPnL(0);
    
    if (betId) {
      try {
        // Determine outcome: PUMP = close > entry, DUMP = close < entry
        const isPump = finalPrice > entryPrice;
        const priceChange = ((finalPrice - entryPrice) / entryPrice * 100).toFixed(2);
        
        // FAIR OUTCOME: Player wins if they predicted correctly
        const won = (prediction === 'pump' && isPump) || (prediction === 'dump' && !isPump);
        
        console.log('🎲 PUMP OR DUMP RESULT:', {
          entryPrice,
          finalPrice,
          isPump,
          prediction,
          won,
          priceChange: `${priceChange}%`
        });
        
        const resolved = await apiService.resolveBet(betId);
        await fetchBalances();
        
        // Show detailed result - ALWAYS show win or loss
        const resultMessage = won 
          ? `🎉 WON! Price ${isPump ? 'PUMPED ⬆️' : 'DUMPED ⬇️'} ${Math.abs(parseFloat(priceChange))}%! +${(parseFloat(stake) * 1.88).toFixed(2)} USDC`
          : `💥 LOST! Price ${isPump ? 'PUMPED ⬆️' : 'DUMPED ⬇️'} ${Math.abs(parseFloat(priceChange))}%. You bet ${prediction.toUpperCase()}. -${stake} USDC`;
        
        console.log('📢 Setting result:', resultMessage);
        setResult(resultMessage);
        
        setTimeout(() => {
          setIsPlaying(false);
          setCanBet(true);
        }, 3000);
      } catch (error) {
        console.error('Bet resolution failed:', error);
        await fetchBalances();
        setResult('❌ Error: ' + (error as Error).message);
        setIsPlaying(false);
        setCanBet(true);
      } finally {
        setBetId(null);
      }
    } else {
      setTimeout(() => {
        setIsPlaying(false);
        setCanBet(true);
      }, 2000);
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

  const renderCandle = (candle: Candle, index: number, isLive = false) => {
    const isPump = candle.close >= candle.open;
    const allCandles = [...candles, ...(currentCandle ? [currentCandle] : [])];
    const minPrice = Math.min(...allCandles.map(c => c.low));
    const maxPrice = Math.max(...allCandles.map(c => c.high));
    const priceRange = maxPrice - minPrice || 1;
    
    // Calculate heights in pixels (assuming 224px container height)
    const chartHeight = 224;
    const wickLow = ((candle.low - minPrice) / priceRange) * chartHeight;
    const wickHigh = ((candle.high - minPrice) / priceRange) * chartHeight;
    const bodyLow = ((Math.min(candle.open, candle.close) - minPrice) / priceRange) * chartHeight;
    const bodyHigh = ((Math.max(candle.open, candle.close) - minPrice) / priceRange) * chartHeight;
    
    const wickHeight = wickHigh - wickLow;
    const bodyHeight = Math.max(bodyHigh - bodyLow, 2);
    const topWickHeight = wickHigh - bodyHigh;
    const bottomWickHeight = bodyLow - wickLow;
    
    return (
      <div key={index} className="flex-1 flex flex-col-reverse items-center justify-start" style={{ minWidth: '12px', maxWidth: '20px' }}>
        {/* Bottom wick */}
        {bottomWickHeight > 0 && (
          <div 
            className={`w-0.5 ${isPump ? 'bg-green-500' : 'bg-red-500'} ${isLive ? 'shadow-lg shadow-green-500/50' : ''}`}
            style={{ height: `${bottomWickHeight}px` }}
          />
        )}
        
        {/* Candle body */}
        <div 
          className={`w-full ${
            isPump 
              ? 'bg-green-500 border border-green-300' 
              : 'bg-red-500 border border-red-300'
          } ${isLive ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-500/50 animate-pulse' : ''} rounded-sm relative overflow-hidden`}
          style={{ height: `${bodyHeight}px` }}
        >
          {/* Inner gradient for depth */}
          <div className={`absolute inset-0 bg-gradient-to-b ${
            isPump ? 'from-green-300/60 via-green-400/40 to-green-600/60' : 'from-red-300/60 via-red-400/40 to-red-600/60'
          }`} />
          {isLive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
        
        {/* Top wick */}
        {topWickHeight > 0 && (
          <div 
            className={`w-0.5 ${isPump ? 'bg-green-500' : 'bg-red-500'} ${isLive ? 'shadow-lg shadow-red-500/50' : ''}`}
            style={{ height: `${topWickHeight}px` }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-black rounded-lg p-6 border-2 border-purple-500 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-red-400">
            📊 PUMP OR DUMP
          </h2>
          <p className="text-gray-300 text-sm">Pocket Option style • Real-time trading • 1.95× payout</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Price</div>
          <div className={`text-2xl font-mono font-bold transition-colors ${
            price > 52000 ? 'text-green-400' : price < 48000 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            ${price.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Enhanced Candlestick Chart */}
      <div className="bg-black rounded-lg p-4 mb-4 border-2 border-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-green-900/10 pointer-events-none" />
        
        {/* Grid lines with labels */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="relative border-t border-gray-800/50">
              <span className="absolute -left-2 -top-2 text-xs text-gray-600">
                ${(52000 - i * 1000).toFixed(0)}
              </span>
            </div>
          ))}
        </div>

        {/* Candlesticks */}
        <div className="relative h-56 flex items-end justify-start gap-0.5 px-4">
          {candles.slice(-11).map((candle, i) => renderCandle(candle, i))}
          {currentCandle && renderCandle(currentCandle, 999, true)}
        </div>

        {/* Countdown timer - centered */}
        {countdown > 0 && countdown <= timeframe && isPlaying && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-none">
            <div className={`px-8 py-6 rounded-full text-6xl font-bold shadow-2xl border-4 ${
              countdown <= 3 ? 'bg-red-500 text-white border-red-300 animate-bounce scale-110' : 'bg-yellow-500 text-black border-yellow-300'
            }`}>
              {countdown}
            </div>
            <div className="text-sm text-yellow-400 mt-2 font-bold bg-black/70 px-3 py-1 rounded-full">
              Candle closing...
            </div>
          </div>
        )}

        {/* Bet indicator */}
        {betId && !result && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse border-2 border-purple-300 shadow-lg z-10">
            🎲 {prediction.toUpperCase()} • {stake} USDC
          </div>
        )}

        {/* Entry Price indicator line (YELLOW = STARTING PRICE) */}
        {entryPrice > 0 && (() => {
          const allCandles = [...candles, ...(currentCandle ? [currentCandle] : [])];
          const minPrice = Math.min(...allCandles.map(c => c.low));
          const maxPrice = Math.max(...allCandles.map(c => c.high));
          const priceRange = maxPrice - minPrice || 1;
          const entryPosition = ((entryPrice - minPrice) / priceRange) * 100;
          
          return (
            <div 
              className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-400 z-10" 
              style={{ bottom: `${entryPosition}%` }}
            >
              <div className="absolute left-4 -top-3 bg-yellow-400 text-black text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                📍 ENTRY: ${entryPrice.toFixed(0)}
              </div>
              <div className="absolute right-4 -top-3 bg-yellow-400 text-black text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                {isPlaying ? '⏳ CURRENT' : '✅ FINAL'}: ${price.toFixed(0)}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Volume bars */}
      <div className="flex gap-1 mb-4 h-12 items-end bg-gray-900 rounded p-2">
        {volumeBars.slice(-11).map((vol, i) => {
          const candle = candles.slice(-11)[i];
          const isGreen = candle && candle.close >= candle.open;
          return (
            <div 
              key={i} 
              className={`flex-1 ${isGreen ? 'bg-green-600/40' : 'bg-red-600/40'} rounded-t transition-all`}
              style={{ height: `${vol}%` }}
            />
          );
        })}
        {currentCandle && (
          <div className="flex-1 bg-yellow-500/40 rounded-t animate-pulse" style={{ height: '85%' }} />
        )}
        {!currentCandle && <div className="flex-1" />}
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
              Timeframe:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`py-3 rounded-lg font-bold text-sm transition-all transform hover:scale-105 ${
                    timeframe === option.value
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg border-2 border-purple-300'
                      : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-purple-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-purple-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Prediction:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'pump'
                    ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50 border-4 border-green-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-green-600'
                }`}
                onClick={() => setPrediction('pump')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-5xl mb-2">📈</div>
                  <div>PUMP</div>
                  <div className="text-xs text-green-200 mt-1">Price goes UP</div>
                </div>
              </button>
              <button
                className={`py-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'dump'
                    ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50 border-4 border-red-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-red-600'
                }`}
                onClick={() => setPrediction('dump')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-5xl mb-2">📉</div>
                  <div>DUMP</div>
                  <div className="text-xs text-red-200 mt-1">Price goes DOWN</div>
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={startRound}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            🚀 START {timeframe}s ROUND & BET {prediction.toUpperCase()} ({stake} USDC)
          </button>
        </div>
      )}

      {isPlaying && betId && !result && (
        <div className="text-center space-y-2 bg-gray-800/50 rounded-lg p-4 border-2 border-purple-600">
          <div className="text-yellow-400 font-bold text-2xl animate-pulse">
            ⏳ Waiting for candle close...
          </div>
          <div className="text-sm text-gray-400">
            Bet locked • Result in {countdown}s
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 Trade Again
        </button>
      )}
    </div>
  );
};
