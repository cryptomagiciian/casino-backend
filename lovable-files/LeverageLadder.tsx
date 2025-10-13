import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

// Generate 100 levels with exponential growth
// Formula: multiplier = 1.15^level (exponential curve)
// Level 1 = 1.15×, Level 10 = 4.0×, Level 25 = 33×, Level 50 = 1,084×, Level 100 = 1,174,313×
const generateLadderRungs = () => {
  const rungs = [];
  for (let level = 1; level <= 100; level++) {
    const multiplier = Math.pow(1.15, level);
    rungs.push({
      level,
      multiplier,
      label: multiplier < 1000 
        ? `${multiplier.toFixed(2)}×` 
        : multiplier < 1000000
          ? `${(multiplier / 1000).toFixed(1)}K×`
          : `${(multiplier / 1000000).toFixed(2)}M×`
    });
  }
  return rungs;
};

const LADDER_RUNGS = generateLadderRungs();

export const LeverageLadder: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [bustLevel, setBustLevel] = useState<number | null>(null);
  const { fetchBalances } = useWallet();

  // Auto-scroll to current level
  useEffect(() => {
    if (currentLevel > 0) {
      const element = document.getElementById(`level-${currentLevel}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Scroll to level 1 (bottom) when not playing
      const element = document.getElementById(`level-1`);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    }
  }, [currentLevel]);

  // Calculate bust level with AGGRESSIVE probability
  // 85% chance of very early bust (levels 1-10) - BRUTAL
  // 10% chance of early bust (levels 11-20)
  // 3% chance of medium bust (levels 21-35)
  // 1.5% chance of high bust (levels 36-50)
  // 0.4% chance of very high (levels 51-75)
  // 0.09% chance of legendary (levels 76-90)
  // 0.01% chance of max (levels 91-100) - Nearly impossible
  const calculateBustLevel = () => {
    const rand = Math.random();
    
    if (rand < 0.85) {
      // 85% - Very early bust (1-10) - Most lose immediately
      return Math.floor(Math.random() * 10) + 1;
    } else if (rand < 0.95) {
      // 10% - Early bust (11-20)
      return Math.floor(Math.random() * 10) + 11;
    } else if (rand < 0.98) {
      // 3% - Medium bust (21-35)
      return Math.floor(Math.random() * 15) + 21;
    } else if (rand < 0.995) {
      // 1.5% - High bust (36-50)
      return Math.floor(Math.random() * 15) + 36;
    } else if (rand < 0.999) {
      // 0.4% - Very high (51-75)
      return Math.floor(Math.random() * 25) + 51;
    } else if (rand < 0.9999) {
      // 0.09% - Legendary (76-90)
      return Math.floor(Math.random() * 15) + 76;
    } else {
      // 0.01% - God tier (91-100) - 1 in 10,000
      return Math.floor(Math.random() * 10) + 91;
    }
  };

  const startGame = async () => {
    try {
      setIsPlaying(true);
      setCurrentLevel(0);
      setResult(null);
      
      // Calculate bust level with house edge
      const bustLvl = calculateBustLevel();
      setBustLevel(bustLvl);
      
      console.log(`🎲 Game started - Bust at level ${bustLvl}`);

      const bet = await apiService.placeBet({
        game: 'leverage_ladder',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: {},
      });

      setBetId(bet.id);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game: ' + (error as Error).message);
      setIsPlaying(false);
    }
  };

  const climbUp = () => {
    if (!isPlaying || currentLevel >= 100) return;

    const nextLevel = currentLevel + 1;
    
    // Check if busted
    if (nextLevel >= (bustLevel || 101)) {
      setCurrentLevel(nextLevel);
      setResult('💥 LIQUIDATED! You lost everything!');
      setIsPlaying(false);
      
      // Resolve bet as loss
      if (betId) {
        apiService.resolveBet(betId).then(() => fetchBalances());
      }
    } else {
      setCurrentLevel(nextLevel);
      
      // Give feedback at milestones
      if (nextLevel === 10) {
        console.log('🎯 Nice! Level 10 reached - 4× multiplier');
      } else if (nextLevel === 25) {
        console.log('🔥 Amazing! Level 25 - 33× multiplier!');
      } else if (nextLevel === 50) {
        console.log('💎 INSANE! Level 50 - 1,084× multiplier!!');
      } else if (nextLevel === 75) {
        console.log('🚀 LEGENDARY! Level 75 - 37K× multiplier!!!');
      } else if (nextLevel === 100) {
        console.log('👑 GODLIKE! MAX LEVEL 100 - 1.17M× MULTIPLIER!!!!');
      }
    }
  };

  const cashOut = async () => {
    if (!isPlaying || currentLevel === 0 || !betId) return;

    setIsPlaying(false);
    const multiplier = LADDER_RUNGS[currentLevel - 1].multiplier;

    try {
      // Send current multiplier to backend
      await apiService.cashoutBet(betId, multiplier);
      await fetchBalances();
      setResult(`🎉 CASHED OUT! ${multiplier.toFixed(2)}× WIN!`);
    } catch (error) {
      console.error('Cashout failed:', error);
      alert('Cashout failed: ' + (error as Error).message);
      setIsPlaying(true); // Re-enable if cashout failed
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setCurrentLevel(0);
    setResult(null);
    setBetId(null);
    setBustLevel(null);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-black rounded-lg p-6 border-2 border-indigo-500 shadow-2xl">
      <h2 className="text-3xl font-bold text-indigo-400 mb-2">🪜 LEVERAGE LADDER</h2>
      <p className="text-gray-300 mb-4">Climb for higher multipliers! Cash out before liquidation!</p>

      {/* Ladder Visual - Scrollable */}
      <div className="bg-black rounded-lg p-4 mb-4 border border-indigo-700 relative h-96 overflow-y-auto">
        <div className="flex flex-col-reverse gap-2">
          {LADDER_RUNGS.map((rung, index) => {
            const isActive = currentLevel === rung.level;
            const isPassed = currentLevel > rung.level;
            const isBust = bustLevel === rung.level && currentLevel >= rung.level;
            const isMilestone = rung.level % 10 === 0;
            const isUltraRare = rung.level > 80;
            
            return (
              <div 
                key={rung.level}
                id={`level-${rung.level}`}
                className={`relative flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  isBust 
                    ? 'bg-red-900 border-red-500 animate-pulse' 
                    : isActive 
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 border-yellow-400 shadow-lg shadow-yellow-500/50 animate-pulse' 
                      : isPassed 
                        ? 'bg-green-800 border-green-500' 
                        : isUltraRare
                          ? 'bg-purple-900 border-purple-500'
                          : isMilestone
                            ? 'bg-gray-700 border-indigo-500'
                            : 'bg-gray-800 border-gray-600'
                } ${isActive ? 'scale-105' : ''}`}
              >
                <span className={`font-bold ${
                  isUltraRare ? 'text-purple-300 text-lg' : isMilestone ? 'text-indigo-300 text-lg' : 'text-white'
                }`}>
                  {isUltraRare && '👑'} Lvl {rung.level} {isMilestone && rung.level !== 100 && '🎯'}
                </span>
                <span className={`font-bold ${
                  isBust 
                    ? 'text-red-400 text-2xl' 
                    : isActive 
                      ? 'text-yellow-300 text-2xl' 
                      : isPassed 
                        ? 'text-green-400 text-xl' 
                        : isUltraRare
                          ? 'text-purple-400 text-lg'
                          : isMilestone
                            ? 'text-indigo-400'
                            : 'text-gray-500 text-sm'
                }`}>
                  {isBust ? '💀 ' : ''}{rung.label}
                </span>
                
                {isActive && (
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-3xl animate-bounce">
                    👤
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 animate-bounce ${
          result.includes('WON') || result.includes('CASHED') ? 'text-green-400' : 'text-red-400'
        }`}>
          {result}
        </div>
      )}

      {!isPlaying && !result && (
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
              className="w-full px-3 py-2 bg-gray-700 border border-indigo-600 rounded text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🚀 START CLIMBING
          </button>
        </div>
      )}

      {isPlaying && !result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3 border border-indigo-600 text-center">
              <div className="text-gray-400 text-xs">Level</div>
              <div className="text-3xl font-bold text-indigo-400">
                {currentLevel} / 100
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3 border border-yellow-600 text-center">
              <div className="text-gray-400 text-xs">Multiplier</div>
              <div className="text-3xl font-bold text-yellow-400">
                {currentLevel === 0 ? '1.0×' : LADDER_RUNGS[currentLevel - 1].label}
              </div>
            </div>
          </div>

          {currentLevel > 0 && (
            <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded p-2 border border-green-600 text-center">
              <div className="text-green-300 text-sm font-bold">
                💰 Potential Win: {(parseFloat(stake) * LADDER_RUNGS[currentLevel - 1].multiplier).toFixed(2)} USDC
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={climbUp}
              disabled={currentLevel >= 100}
              className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100"
            >
              ⬆️ CLIMB {currentLevel < 100 ? `(${currentLevel + 1})` : 'MAX'}
            </button>
            <button
              onClick={cashOut}
              disabled={currentLevel === 0}
              className="flex-1 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-600 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100"
            >
              💰 CASH OUT
            </button>
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
        >
          🔄 New Climb
        </button>
      )}
    </div>
  );
};

