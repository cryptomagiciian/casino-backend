import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const StopLossRoulette: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [riskLevel, setRiskLevel] = useState(5); // 1-10, tighter = higher payout
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Calculate multiplier based on risk (tighter stop = higher payout)
  const getMultiplier = (risk: number) => {
    return (1.5 + (risk * 0.15)).toFixed(2);
  };

  const spin = async () => {
    if (isSpinning) return;

    try {
      setIsSpinning(true);
      setResult(null);

      const bet = await apiService.placeBet({
        game: 'stop_loss_roulette',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { riskLevel },
      });

      // Spin animation
      let spinCount = 0;
      intervalRef.current = setInterval(() => {
        spinCount++;
        setRotation(prev => (prev + 30) % 360);

        if (spinCount >= 40) { // Stop after ~2 seconds
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Resolve bet
          apiService.resolveBet(bet.id).then(async (resolved) => {
            const won = resolved.resultMultiplier > 0;
            const stopLossHit = !won;
            
            await fetchBalances();
            
            if (stopLossHit) {
              setResult('⚡ STOP LOSS HIT! You lost!');
            } else {
              setResult(`🎉 SAFE! You won ${getMultiplier(riskLevel)}×!`);
            }
            
            setIsSpinning(false);
          });
        }
      }, 50);

    } catch (error) {
      console.error('Spin failed:', error);
      alert('Spin failed: ' + (error as Error).message);
      setIsSpinning(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSpinning(false);
    setResult(null);
    setRotation(0);
  };

  return (
    <div className="bg-gradient-to-br from-orange-900 via-red-900 to-black rounded-lg p-6 border-2 border-orange-500 shadow-2xl">
      <h2 className="text-3xl font-bold text-orange-400 mb-2">⚡ STOP LOSS ROULETTE</h2>
      <p className="text-gray-300 mb-4">Set your risk, spin the wheel!</p>

      {/* Roulette Wheel */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* Wheel */}
          <div 
            className="w-64 h-64 rounded-full border-8 border-orange-500 bg-gradient-to-br from-gray-900 via-orange-900 to-red-900 flex items-center justify-center transition-transform duration-100 shadow-2xl"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Candle Icons on Wheel */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <div
                key={i}
                className="absolute text-4xl"
                style={{
                  transform: `rotate(${angle}deg) translateY(-90px)`,
                }}
              >
                {i % 2 === 0 ? '🕯️' : '⚡'}
              </div>
            ))}
            
            {/* Center */}
            <div className="text-6xl animate-pulse">
              {isSpinning ? '💫' : '🎯'}
            </div>
          </div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 text-4xl">
            ⬇️
          </div>
        </div>
      </div>

      {/* Risk Slider */}
      {!isSpinning && !result && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Risk Level: <span className="text-orange-400 text-xl font-bold">{riskLevel}</span>
            <span className="text-gray-500 text-sm ml-2">
              (Payout: {getMultiplier(riskLevel)}×)
            </span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={riskLevel}
            onChange={(e) => setRiskLevel(Number(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Safe (1.5×)</span>
            <span>Risky (3.0×)</span>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 animate-bounce ${
          result.includes('won') || result.includes('SAFE') ? 'text-green-400' : 'text-red-400'
        }`}>
          {result}
        </div>
      )}

      {!isSpinning && !result && (
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
              className="w-full px-3 py-2 bg-gray-700 border border-orange-600 rounded text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={spin}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🎰 SPIN THE WHEEL
          </button>
        </div>
      )}

      {isSpinning && (
        <div className="text-center text-orange-400 font-bold text-xl animate-pulse">
          🌀 Spinning... Will you hit stop loss?
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
        >
          🔄 Spin Again
        </button>
      )}
    </div>
  );
};

