import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import { WalletBalance } from './WalletBalance';

const MULTIPLIER_OPTIONS = [
  { value: 1.5, risk: 'Safe', color: 'from-green-600 to-green-500', chance: '60%' },
  { value: 1.98, risk: 'Normal', color: 'from-blue-600 to-blue-500', chance: '50%' },
  { value: 3.0, risk: 'Risky', color: 'from-yellow-600 to-yellow-500', chance: '33%' },
  { value: 5.0, risk: 'Extreme', color: 'from-red-600 to-red-500', chance: '20%' },
];

export const BullVsBear: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [side, setSide] = useState<'bull' | 'bear'>('bull');
  const [multiplier, setMultiplier] = useState(1.98);
  const [isPlaying, setIsPlaying] = useState(false);
  const [barPosition, setBarPosition] = useState(50);
  const [result, setResult] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(0);
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
      setResult(null);
      setBarPosition(50);
      setIntensity(0);

      const bet = await apiService.placeBet({
        game: 'bull_vs_bear_battle',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { side, multiplier },
      });

      let steps = 0;
      const targetSteps = 30;
      
      intervalRef.current = setInterval(() => {
        steps++;
        setIntensity((steps / targetSteps) * 100);
        
        setBarPosition(prev => {
          const move = (Math.random() - 0.5) * 10;
          let newPos = prev + move;
          newPos = Math.max(5, Math.min(95, newPos));
          
          if (steps >= targetSteps) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            
            apiService.resolveBet(bet.id)
              .then(async (resolved) => {
                const won = resolved.resultMultiplier > 0;
                const winningSide = won ? side : (side === 'bull' ? 'bear' : 'bull');
                
                const finalPos = winningSide === 'bull' ? 90 : 10;
                setBarPosition(finalPos);
                
                await fetchBalances();
                setResult(won ? `🎉 ${side.toUpperCase()} WINS! ${multiplier}×` : `💥 ${winningSide.toUpperCase()} WINS!`);
                setIsPlaying(false);
              })
              .catch(async (error) => {
                console.error('Bet resolution failed:', error);
                await fetchBalances();
                setResult('❌ Error: ' + error.message);
                setIsPlaying(false);
              });
          }
          
          return newPos;
        });
      }, 100);

    } catch (error) {
      console.error('Bet failed:', error);
      setResult('❌ Bet failed: ' + (error as Error).message);
      setIsPlaying(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setResult(null);
    setBarPosition(50);
    setIntensity(0);
  };

  const selectedOption = MULTIPLIER_OPTIONS.find(o => o.value === multiplier) || MULTIPLIER_OPTIONS[1];

  return (
    <div className="bg-gradient-to-br from-green-900 via-gray-900 to-red-900 rounded-lg p-6 border-2 border-yellow-500 shadow-2xl relative">
      <WalletBalance position="top-right" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-red-400">
            🐂 BULL VS BEAR 🐻
          </h2>
          <p className="text-gray-300 text-sm">Tug of war • Choose your multiplier</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Potential Win</div>
          <div className="text-2xl font-bold text-yellow-400">{multiplier}× ({selectedOption.chance})</div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="bg-black rounded-lg p-6 mb-4 border-2 border-yellow-700 relative overflow-hidden h-64">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-transparent to-red-900/20 pointer-events-none" />
        
        {/* Intensity overlay */}
        {isPlaying && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-yellow-500/10 to-red-500/10 animate-pulse pointer-events-none"
            style={{ opacity: intensity / 100 }}
          />
        )}

        {/* Bull Side */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <div className={`text-8xl transition-all duration-300 ${
            barPosition > 50 ? 'scale-125 animate-bounce' : 'scale-100'
          }`}>
            🐂
          </div>
          <div className="text-center text-green-400 font-bold text-xl mt-2">BULL</div>
        </div>

        {/* Bear Side */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className={`text-8xl transition-all duration-300 ${
            barPosition < 50 ? 'scale-125 animate-bounce' : 'scale-100'
          }`}>
            🐻
          </div>
          <div className="text-center text-red-400 font-bold text-xl mt-2">BEAR</div>
        </div>

        {/* Tug of War Bar */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-3/4">
          <div className="h-6 bg-gray-800 rounded-full overflow-hidden border-2 border-yellow-500 relative shadow-inner">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
              style={{ 
                transform: `translateX(${barPosition - 50}%)`,
                filter: isPlaying ? 'brightness(1.5)' : 'brightness(1)',
              }}
            />
            {/* Center marker */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-white opacity-50" />
          </div>
          
          {/* Power indicator */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 transition-all duration-300"
            style={{ left: `${barPosition}%` }}
          >
            <div className={`text-4xl ${isPlaying ? 'animate-bounce' : ''}`}>⚡</div>
          </div>
        </div>

        {/* Score display */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-sm text-gray-400">Power</div>
          <div className={`text-xl font-bold font-mono ${
            barPosition > 50 ? 'text-green-400' : barPosition < 50 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {barPosition.toFixed(0)}%
          </div>
        </div>

        {/* Crowd effects */}
        {isPlaying && (
          <>
            <div className="absolute top-2 left-2 text-2xl animate-bounce">🎪</div>
            <div className="absolute top-2 right-2 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎪</div>
          </>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 p-6 rounded-xl border-4 relative overflow-hidden ${
          result.includes('WINS') && result.includes(side.toUpperCase())
            ? 'bg-green-500/30 text-green-400 border-green-500' 
            : result.includes('WINS')
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
              Choose Multiplier (Higher = Riskier but Bigger Win):
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MULTIPLIER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMultiplier(option.value)}
                  className={`py-4 rounded-xl font-bold text-sm transition-all transform hover:scale-105 ${
                    multiplier === option.value
                      ? `bg-gradient-to-br ${option.color} text-white shadow-lg border-4 border-white`
                      : 'bg-gray-800 text-gray-400 border-2 border-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.value}×</div>
                  <div className="text-xs">{option.risk}</div>
                  <div className="text-xs opacity-75">{option.chance}</div>
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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-yellow-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pick Your Side:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  side === 'bull'
                    ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50 border-4 border-green-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-green-600'
                }`}
                onClick={() => setSide('bull')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-5xl mb-2">🐂</div>
                  <div>BULL</div>
                  <div className="text-xs text-green-200 mt-1">Market UP</div>
                </div>
              </button>
              <button
                className={`py-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 relative overflow-hidden ${
                  side === 'bear'
                    ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50 border-4 border-red-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-red-600'
                }`}
                onClick={() => setSide('bear')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-5xl mb-2">🐻</div>
                  <div>BEAR</div>
                  <div className="text-xs text-red-200 mt-1">Market DOWN</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-yellow-600/30">
            <div className="text-center">
              <div className="text-sm text-gray-300 mb-2">Current Selection:</div>
              <div className="text-xl font-bold text-yellow-400">
                {side.toUpperCase()} • {multiplier}× Multiplier • Win ${(parseFloat(stake) * multiplier).toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={placeBet}
            className="w-full py-4 bg-gradient-to-r from-green-600 via-yellow-600 to-red-600 hover:from-green-500 hover:via-yellow-500 hover:to-red-500 text-white rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50"
          >
            ⚔️ START BATTLE ({stake} USDC)
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="text-center space-y-2 bg-gray-800/50 rounded-lg p-4 border-2 border-yellow-600">
          <div className="text-yellow-400 font-bold text-2xl animate-pulse">
            ⚔️ BATTLE IN PROGRESS...
          </div>
          <div className="text-sm text-gray-400">
            {side === 'bull' ? '🐂 GO BULL GO!' : '🐻 GET EM BEAR!'}
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 New Battle
        </button>
      )}
    </div>
  );
};
