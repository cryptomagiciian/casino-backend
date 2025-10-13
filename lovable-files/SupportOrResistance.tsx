import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const SupportOrResistance: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'break' | 'reject'>('break');
  const [isPlaying, setIsPlaying] = useState(false);
  const [price, setPrice] = useState(50000);
  const [support, setSupport] = useState(48000);
  const [resistance, setResistance] = useState(52000);
  const [result, setResult] = useState<string | null>(null);
  const [priceMoving, setPriceMoving] = useState(false);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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

      // Place bet on backend
      const bet = await apiService.placeBet({
        game: 'support_or_resistance',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });

      // Animate price movement
      const startPrice = support + (resistance - support) * 0.5;
      setPrice(startPrice);

      let step = 0;
      intervalRef.current = setInterval(() => {
        step++;
        
        // Create tension with fake movements
        if (step < 15) {
          const tension = Math.sin(step * 0.5) * 500;
          setPrice(startPrice + tension);
        } else {
          // Final decision
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Resolve bet with error handling
          apiService.resolveBet(bet.id)
            .then(async (resolved) => {
              const won = resolved.resultMultiplier > 0;
              const actualOutcome = won ? prediction : (prediction === 'break' ? 'reject' : 'break');
              
              // Animate to final position
              if (actualOutcome === 'break') {
                setPrice(resistance + 500);
              } else {
                setPrice(support - 500);
              }
              
              await fetchBalances();
              setResult(won ? '🎉 YOU WON! 2.0×' : '💥 YOU LOST!');
              setPriceMoving(false);
            })
            .catch(async (error) => {
              console.error('Bet resolution failed:', error);
              await fetchBalances();
              setResult('❌ Error: ' + error.message);
              setPriceMoving(false);
            })
            .finally(() => {
              setIsPlaying(false);
            });
        }
      }, 200);

    } catch (error) {
      console.error('Bet failed:', error);
      alert('Bet failed: ' + (error as Error).message);
      setIsPlaying(false);
      setPriceMoving(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setPriceMoving(false);
    setResult(null);
    setPrice(50000);
    setSupport(48000 + Math.random() * 1000);
    setResistance(51000 + Math.random() * 1000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-lg p-6 border-2 border-purple-500 shadow-2xl">
      <h2 className="text-3xl font-bold text-purple-400 mb-2">📈 SUPPORT OR RESISTANCE</h2>
      <p className="text-gray-300 mb-4">Will price break through or bounce? 2.0× payout</p>

      {/* Chart Visual */}
      <div className="bg-black rounded-lg p-6 mb-4 border border-purple-700 relative h-64">
        {/* Resistance Line */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-red-500 border-dashed flex items-center"
          style={{ top: '20%' }}
        >
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded ml-2 font-bold">
            RESISTANCE ${resistance.toFixed(0)}
          </span>
          {priceMoving && price > resistance && (
            <div className="absolute right-4 text-red-500 text-2xl animate-ping">💥</div>
          )}
        </div>

        {/* Price Point */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-200"
          style={{ 
            top: `${((resistance - price) / (resistance - support)) * 60 + 20}%`,
          }}
        >
          <div className={`w-6 h-6 rounded-full ${
            priceMoving ? 'bg-yellow-400 animate-pulse' : 'bg-blue-500'
          } shadow-lg`} />
          <div className="text-center text-white font-mono text-lg font-bold mt-2 whitespace-nowrap">
            ${price.toFixed(0)}
          </div>
        </div>

        {/* Support Line */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-blue-500 border-dashed flex items-center"
          style={{ top: '80%' }}
        >
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded ml-2 font-bold">
            SUPPORT ${support.toFixed(0)}
          </span>
          {priceMoving && price < support && (
            <div className="absolute right-4 text-blue-500 text-2xl animate-ping">💥</div>
          )}
        </div>

        {/* Tension Effect */}
        {priceMoving && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-pulse" />
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 animate-bounce ${
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
              className="w-full px-3 py-2 bg-gray-700 border border-purple-600 rounded text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Prediction:
            </label>
            <div className="flex gap-4">
              <button
                className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                  prediction === 'break'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-700 text-gray-400'
                }`}
                onClick={() => setPrediction('break')}
              >
                💥 BREAK THROUGH
              </button>
              <button
                className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                  prediction === 'reject'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-700 text-gray-400'
                }`}
                onClick={() => setPrediction('reject')}
              >
                🛡️ BOUNCE BACK
              </button>
            </div>
          </div>

          <button
            onClick={placeBet}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🎯 PLACE BET
          </button>
        </div>
      )}

      {priceMoving && (
        <div className="text-center text-yellow-400 font-bold text-xl animate-pulse">
          ⚡ Price is moving... {prediction === 'break' ? 'Break it!' : 'Hold strong!'}
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

