import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const PumpOrDump: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'pump' | 'dump'>('pump');
  const [countdown, setCountdown] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canBet, setCanBet] = useState(true);
  const [price, setPrice] = useState(50000);
  const [priceHistory, setPriceHistory] = useState<number[]>([50000]);
  const [result, setResult] = useState<string | null>(null);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
    const startPrice = 50000 + Math.random() * 20000;
    setPrice(startPrice);
    setPriceHistory([startPrice]);

    // Animate price volatility
    intervalRef.current = setInterval(() => {
      setPrice(prev => {
        const change = (Math.random() - 0.5) * 1000;
        const newPrice = prev + change;
        setPriceHistory(history => [...history.slice(-20), newPrice]);
        return newPrice;
      });
    }, 200);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setCanBet(false);
          return 0;
        }
        if (prev === 3) setCanBet(false); // Lock bets at 3 seconds
        return prev - 1;
      });
    }, 1000);
  };

  const placeBet = async () => {
    if (!canBet) return;
    
    try {
      const bet = await apiService.placeBet({
        game: 'pump_or_dump',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });

      // Wait for countdown to finish
      setTimeout(async () => {
        const resolved = await apiService.resolveBet(bet.id);
        await fetchBalances();
        
        const won = resolved.resultMultiplier > 0;
        setResult(won ? '🎉 YOU WON!' : '💥 YOU LOST!');
        
        // Auto restart after 3 seconds
        setTimeout(() => {
          startRound();
        }, 3000);
      }, countdown * 1000);

    } catch (error) {
      console.error('Bet failed:', error);
      alert('Bet failed: ' + (error as Error).message);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsPlaying(false);
    setCanBet(true);
    setResult(null);
    setPrice(50000);
    setPriceHistory([50000]);
    setCountdown(10);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg p-6 border-2 border-cyan-500 shadow-2xl">
      <h2 className="text-3xl font-bold text-cyan-400 mb-2 animate-pulse">📊 PUMP OR DUMP</h2>
      <p className="text-gray-300 mb-4">Predict the next candle! 1.95× payout</p>

      {/* Price Chart Visual */}
      <div className="bg-black rounded-lg p-4 mb-4 border border-cyan-700 relative overflow-hidden">
        <div className="flex items-end justify-around h-32 gap-1">
          {priceHistory.slice(-15).map((p, i) => {
            const height = ((p - 45000) / 25000) * 100;
            const color = i > 0 && p > priceHistory[priceHistory.length - 15 + i - 1] 
              ? 'bg-green-500' 
              : 'bg-red-500';
            return (
              <div 
                key={i} 
                className={`${color} w-3 transition-all duration-200`}
                style={{ height: `${Math.max(10, height)}%` }}
              />
            );
          })}
        </div>
        
        <div className="text-center mt-2">
          <div className={`text-4xl font-mono font-bold ${
            price > 55000 ? 'text-green-400' : 'text-red-400'
          } drop-shadow-lg`}>
            ${price.toFixed(0)}
          </div>
        </div>

        {countdown > 0 && countdown <= 10 && isPlaying && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black px-4 py-2 rounded-full text-2xl font-bold animate-bounce">
            {countdown}s
          </div>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 animate-pulse ${
          result.includes('WON') ? 'text-green-400' : 'text-red-400'
        }`}>
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
              className="w-full px-3 py-2 bg-gray-700 border border-cyan-600 rounded text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Prediction:
            </label>
            <div className="flex gap-4">
              <button
                className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 ${
                  prediction === 'pump'
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50'
                    : 'bg-gray-700 text-gray-400'
                }`}
                onClick={() => setPrediction('pump')}
              >
                📈 PUMP
              </button>
              <button
                className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 ${
                  prediction === 'dump'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-700 text-gray-400'
                }`}
                onClick={() => setPrediction('dump')}
              >
                📉 DUMP
              </button>
            </div>
          </div>

          <button
            onClick={startRound}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🚀 START ROUND
          </button>
        </div>
      )}

      {isPlaying && canBet && (
        <button
          onClick={placeBet}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg animate-pulse"
        >
          💰 PLACE BET ({prediction.toUpperCase()})
        </button>
      )}

      {isPlaying && !canBet && !result && (
        <div className="text-center text-yellow-400 font-bold text-xl animate-pulse">
          ⏳ Waiting for candle to close...
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
        >
          🔄 New Round
        </button>
      )}
    </div>
  );
};

