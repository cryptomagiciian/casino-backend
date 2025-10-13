import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const CandleFlip: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'red' | 'green'>('red');
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [candleColor, setCandleColor] = useState<'red' | 'green' | null>(null);
  const [rotation, setRotation] = useState(0);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const placeBet = async () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setResult(null);
    setCandleColor(null);
    setRotation(0);
    
    try {
      const bet = await apiService.placeBet({
        game: 'candle_flip',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });
      
      // Animate candle flip
      let rotations = 0;
      const totalRotations = 5 + Math.random() * 3; // 5-8 full rotations
      
      intervalRef.current = setInterval(() => {
        rotations += 0.1;
        setRotation(rotations * 360);
        
        if (rotations >= totalRotations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Resolve bet
          apiService.resolveBet(bet.id)
            .then(async (resolved) => {
              await fetchBalances();
              
              const won = resolved.resultMultiplier > 0;
              const actualColor = resolved.outcome as 'red' | 'green';
              
              setCandleColor(actualColor);
              setResult(won ? `🎉 YOU WON! ${resolved.resultMultiplier}×` : '💥 YOU LOST!');
              setIsFlipping(false);
            })
            .catch(async (error) => {
              console.error('Bet resolution failed:', error);
              await fetchBalances();
              setResult('❌ Error: ' + error.message);
              setIsFlipping(false);
            });
        }
      }, 50);
      
    } catch (error) {
      console.error('Bet failed:', error);
      setResult('❌ Bet failed: ' + (error as Error).message);
      setIsFlipping(false);
    }
  };

  const resetGame = () => {
    setResult(null);
    setCandleColor(null);
    setRotation(0);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-yellow-900 to-black rounded-lg p-6 border-2 border-yellow-500 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-green-400">
            🕯️ CANDLE FLIP
          </h2>
          <p className="text-gray-300 text-sm">Red or Green? 50/50 chance • 1.95× payout</p>
        </div>
      </div>

      {/* Candle Animation */}
      <div className="bg-black rounded-lg p-8 mb-4 border-2 border-yellow-700 relative overflow-hidden h-64 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 via-transparent to-orange-900/10 pointer-events-none" />
        
        {/* Animated Candle */}
        <div 
          className="relative transition-transform duration-50"
          style={{ 
            transform: `rotate(${rotation}deg) scale(${isFlipping ? 1.2 : 1})`,
          }}
        >
          {/* Candle */}
          <div className={`relative ${
            candleColor === 'red' ? 'text-red-500' :
            candleColor === 'green' ? 'text-green-500' :
            'text-gray-400'
          }`}>
            {/* Flame */}
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 ${
              candleColor ? 'animate-bounce' : ''
            }`}>
              <div className={`text-4xl ${
                candleColor === 'red' ? 'animate-pulse' :
                candleColor === 'green' ? 'animate-pulse' :
                'opacity-50'
              }`}>
                🔥
              </div>
            </div>
            
            {/* Candle Body */}
            <svg width="120" height="180" viewBox="0 0 120 180">
              <defs>
                <linearGradient id={`candleGradient-${candleColor || 'default'}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={
                    candleColor === 'red' ? '#ef4444' :
                    candleColor === 'green' ? '#22c55e' :
                    '#6b7280'
                  } />
                  <stop offset="100%" stopColor={
                    candleColor === 'red' ? '#991b1b' :
                    candleColor === 'green' ? '#166534' :
                    '#374151'
                  } />
                </linearGradient>
              </defs>
              
              {/* Candle body */}
              <rect 
                x="30" 
                y="20" 
                width="60" 
                height="140" 
                rx="5"
                fill={`url(#candleGradient-${candleColor || 'default'})`}
                stroke={candleColor ? '#fbbf24' : '#4b5563'}
                strokeWidth="2"
              />
              
              {/* Wax drips */}
              {candleColor && (
                <>
                  <ellipse cx="40" cy="22" rx="3" ry="5" fill={candleColor === 'red' ? '#dc2626' : '#16a34a'} opacity="0.7" />
                  <ellipse cx="80" cy="25" rx="3" ry="6" fill={candleColor === 'red' ? '#dc2626' : '#16a34a'} opacity="0.7" />
                </>
              )}
              
              {/* Wick */}
              <rect x="57" y="5" width="6" height="20" fill="#4a5568" />
            </svg>

            {/* Color label */}
            {candleColor && (
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
                <div className={`text-3xl font-bold ${
                  candleColor === 'red' ? 'text-red-400' : 'text-green-400'
                } animate-pulse`}>
                  {candleColor === 'red' ? '🔴 RED' : '🟢 GREEN'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Flipping indicator */}
        {isFlipping && (
          <div className="absolute top-4 right-4 text-yellow-400 font-bold animate-pulse">
            ⚡ FLIPPING...
          </div>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 p-4 rounded-lg border-2 ${
          result.includes('WON') 
            ? 'bg-green-500/20 text-green-400 border-green-500' 
            : result.includes('LOST')
            ? 'bg-red-500/20 text-red-400 border-red-500'
            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
        } animate-pulse`}>
          {result}
        </div>
      )}

      {!isFlipping && !result && (
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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-yellow-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Prediction:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-6 rounded-lg font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'red'
                    ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50 border-2 border-red-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-red-600'
                }`}
                onClick={() => setPrediction('red')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-4xl mb-1">🔴</div>
                  <div>RED CANDLE</div>
                  <div className="text-xs text-red-200 mt-1">Bearish</div>
                </div>
              </button>
              <button
                className={`py-6 rounded-lg font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'green'
                    ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50 border-2 border-green-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-green-600'
                }`}
                onClick={() => setPrediction('green')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-4xl mb-1">🟢</div>
                  <div>GREEN CANDLE</div>
                  <div className="text-xs text-green-200 mt-1">Bullish</div>
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={placeBet}
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50"
          >
            🎲 FLIP CANDLE ({stake} USDC)
          </button>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-yellow-600/30">
            <p className="text-sm text-gray-300 text-center">
              50/50 chance • Win 1.95× your stake • Instant result
            </p>
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 Flip Again
        </button>
      )}
    </div>
  );
};
