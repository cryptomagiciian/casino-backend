import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

const CRYPTO_SYMBOLS = ['₿', 'Ξ', '◎', '💎', '🪙', '💰', '💸', '📈', '📉', '🚀', '🌙', '⚡'];

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
        setRotation(prev => prev + 30);

        if (spinCount >= 40) { // Stop after ~2 seconds
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Resolve bet with error handling
          apiService.resolveBet(bet.id)
            .then(async (resolved) => {
              const won = resolved.resultMultiplier > 0;
              const stopLossHit = !won;
              
              await fetchBalances();
              
              if (stopLossHit) {
                setResult('⚡ STOP LOSS HIT! You lost!');
              } else {
                setResult(`🎉 SAFE! You won ${getMultiplier(riskLevel)}×!`);
              }
              
              setIsSpinning(false);
            })
            .catch(async (error) => {
              console.error('Bet resolution failed:', error);
              await fetchBalances();
              setResult('❌ Error: ' + error.message);
              setIsSpinning(false);
            });
        }
      }, 50);

    } catch (error) {
      console.error('Spin failed:', error);
      setResult('❌ Spin failed: ' + (error as Error).message);
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
            ⚡ STOP LOSS ROULETTE
          </h2>
          <p className="text-gray-300 text-sm">Higher risk = Higher rewards • Crypto wheel</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Multiplier</div>
          <div className="text-2xl font-bold text-yellow-400">{getMultiplier(riskLevel)}×</div>
        </div>
      </div>

      {/* Crypto Roulette Wheel */}
      <div className="relative bg-black rounded-lg p-6 mb-4 border-2 border-orange-700 h-80 flex items-center justify-center overflow-hidden">
        {/* Pointer/Arrow */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-t-[30px] border-t-yellow-400 border-r-[20px] border-r-transparent drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <div className="relative w-72 h-72">
          <div 
            className="absolute inset-0 rounded-full border-8 border-yellow-500 shadow-2xl transition-transform"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '50ms' : '500ms',
            }}
          >
            {/* Wheel segments */}
            {CRYPTO_SYMBOLS.map((symbol, index) => {
              const angle = (360 / CRYPTO_SYMBOLS.length) * index;
              const isRed = index % 2 === 0;
              
              return (
                <div
                  key={index}
                  className="absolute w-full h-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                  }}
                >
                  <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-36 origin-bottom ${
                    isRed ? 'bg-gradient-to-t from-red-600 to-red-500' : 'bg-gradient-to-t from-green-600 to-green-500'
                  } flex items-start justify-center pt-2`}
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                    }}
                  >
                    <span className="text-3xl font-bold text-white drop-shadow-lg">
                      {symbol}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-300 flex items-center justify-center shadow-2xl">
              <div className="text-2xl font-bold text-black">
                {isSpinning ? '⚡' : '₿'}
              </div>
            </div>
          </div>
        </div>

        {/* Spinning effect overlay */}
        {isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Risk Level Slider */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>Risk Level: {riskLevel}/10</span>
          <span className="text-yellow-400 font-bold">{getMultiplier(riskLevel)}× Payout</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={riskLevel}
          onChange={(e) => setRiskLevel(parseInt(e.target.value))}
          disabled={isSpinning}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #f59e0b ${riskLevel * 10}%, #374151 ${riskLevel * 10}%, #374151 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>🟢 Low Risk</span>
          <span>🟡 Medium</span>
          <span>🔴 High Risk</span>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-2xl font-bold mb-4 p-4 rounded-lg border-2 ${
          result.includes('SAFE') || result.includes('won')
            ? 'bg-green-500/20 text-green-400 border-green-500' 
            : result.includes('HIT') || result.includes('lost')
            ? 'bg-red-500/20 text-red-400 border-red-500'
            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
        } animate-pulse`}>
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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-orange-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-lg"
            />
          </div>

          <button
            onClick={spin}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-orange-500/50"
          >
            🎰 SPIN THE WHEEL ({stake} USDC)
          </button>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-orange-600/30">
            <p className="text-sm text-gray-300 text-center">
              Higher risk = Tighter stop loss = Bigger multiplier!
            </p>
          </div>
        </div>
      )}

      {isSpinning && (
        <div className="text-center text-yellow-400 font-bold text-xl animate-pulse">
          🎲 Spinning... Will your stop loss hit?
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 Spin Again
        </button>
      )}
    </div>
  );
};
