import React, { useState, useEffect, useRef } from 'react';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { useBalance } from './BalanceContext';
import { WalletBalance } from './WalletBalance';
import SimpleLadderScene, { SimpleLadderSceneRef } from './components/games/leverage/SimpleLadderScene';
import Controls from './components/games/leverage/Controls';
import { sfxManager } from './lib/sfx/SFXManager';

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
  const { placeBet, resolveBet, cashoutBet, getBalance, isBetting, error } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, displayCurrency, formatBalance, convertToUsd } = useCurrency();
  const { getAvailableBalance } = useBalance();
  const [balance, setBalance] = useState<number>(0);
  
  // Scene ref for animations
  const sceneRef = useRef<SimpleLadderSceneRef>(null);

  // Auto-scroll to current level
  // Refresh balance when network or currency changes
  useEffect(() => {
    refreshBalance();
  }, [network, bettingCurrency]);

  // Sync with global balance changes
  useEffect(() => {
    const cryptoBalance = getAvailableBalance(bettingCurrency);
    const currentBalance = convertToUsd(cryptoBalance, bettingCurrency);
    setBalance(currentBalance);
  }, [bettingCurrency]); // Remove getAvailableBalance from dependencies to prevent render loop

  const refreshBalance = async () => {
    try {
      // Use global balance context for immediate balance access
      const cryptoBalance = getAvailableBalance(bettingCurrency);
    const currentBalance = convertToUsd(cryptoBalance, bettingCurrency);
    setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

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
      // Initialize SFX on first user interaction
      await sfxManager.initializeOnUserInteraction();
      
      setIsPlaying(true);
      setCurrentLevel(0);
      setResult(null);
      
      // Calculate bust level with house edge
      const bustLvl = calculateBustLevel();
      setBustLevel(bustLvl);
      
      console.log(`🎲 Game started - Bust at level ${bustLvl}`);

      // Check if user has sufficient balance
    if (balance < parseFloat(stake)) {
      setResult('❌ Insufficient balance!');
      setIsPlaying(false);
      return;
    }

    const bet = await placeBet({
        game: 'leverage_ladder',
        currency: 'USD', // Always bet in USD,
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

  const climbUp = async () => {
    if (!isPlaying || currentLevel >= 100 || !betId) return;

    const nextLevel = currentLevel + 1;
    
    // Play climb attempt sound
    sfxManager.play('climb_success', 0.5);
    
    // Check if busted
    if (nextLevel >= (bustLevel || 101)) {
      setCurrentLevel(nextLevel);
      setResult('💥 LIQUIDATED! You lost everything!');
      setIsPlaying(false);
      
      // Play liquidation sound and animation
      sfxManager.play('liquidation_thunder', 0.8);
      sceneRef.current?.animateLiquidation();
      
      // Resolve bet as loss - send the actual game outcome
      if (betId) {
        const resolveParams = {
          frontendOutcome: 'lose', // Player hit liquidation level
          frontendMultiplier: 0,   // No payout for liquidation
          liquidationLevel: nextLevel,
          bustLevel: bustLevel
        };
        
        console.log('🎯 Sending liquidation resolve params:', resolveParams);
        resolveBet(betId, resolveParams).then(() => refreshBalance());
      }
    } else {
      setCurrentLevel(nextLevel);
      
      // Play success animation
      sceneRef.current?.animateAdvance();
      
      // Give feedback at milestones
      if (nextLevel === 10) {
        console.log('🎯 Nice! Level 10 reached - 4× multiplier');
        sfxManager.play('milestone_reached', 0.7);
      } else if (nextLevel === 25) {
        console.log('🔥 Amazing! Level 25 - 33× multiplier!');
        sfxManager.play('milestone_reached', 0.7);
      } else if (nextLevel === 50) {
        console.log('💎 INSANE! Level 50 - 1,084× multiplier!!');
        sfxManager.play('milestone_reached', 0.7);
      } else if (nextLevel === 75) {
        console.log('🚀 LEGENDARY! Level 75 - 37K× multiplier!!!');
        sfxManager.play('milestone_reached', 0.7);
      } else if (nextLevel === 100) {
        console.log('👑 GODLIKE! MAX LEVEL 100 - 1.17M× MULTIPLIER!!!!');
        sfxManager.play('milestone_reached', 0.7);
      }
    }
  };

  const cashOut = async () => {
    if (!isPlaying || currentLevel === 0 || !betId) return;

    setIsPlaying(false);
    const multiplier = LADDER_RUNGS[currentLevel - 1].multiplier;

    try {
      // Play cashout sound and animation
      sfxManager.play('cashout_chime', 0.8);
      sceneRef.current?.animateCashout();
      
      // Send current multiplier to backend
      await cashoutBet(betId, multiplier);
      await refreshBalance();
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

  // Calculate current multiplier and potential win
  const currentMultiplier = currentLevel === 0 ? 1.0 : LADDER_RUNGS[currentLevel - 1].multiplier;
  const potentialWin = parseFloat(stake) * currentMultiplier;
  
  // Calculate risk level (0-100) based on current level
  const riskLevel = Math.min(95, currentLevel * 2 + Math.random() * 10);
  
  // Calculate next level success probability
  const nextLevelProb = Math.max(5, 100 - riskLevel);

  return (
    <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-black rounded-lg p-6 border-2 border-indigo-500 shadow-2xl relative">
      <WalletBalance position="top-right" />
      
      {/* Balance Display */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Balance:</span>
          <span className="font-mono font-bold text-green-400">
            ${balance.toFixed(2)} USD
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>Network: {network}</span>
          <span>Currency: {bettingCurrency}</span>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-indigo-400 mb-2">🪜 LEVERAGE LADDER</h2>
      <p className="text-gray-300 mb-4">Climb the neon ladder! Cash out before liquidation!</p>

      {/* Main Game Area */}
      <div className="space-y-4">
        {/* Ladder Scene - Canvas */}
        <div className="bg-black rounded-lg border border-indigo-700 overflow-hidden" 
             style={{ height: '56vh', minHeight: '400px' }}>
          <SimpleLadderScene
            ref={sceneRef}
            currentLevel={currentLevel}
            multiplier={currentMultiplier}
            risk={riskLevel}
            milestones={[2, 5, 10]}
            onMilestoneReached={(milestone) => {
              console.log(`🎯 Milestone reached: ${milestone}×`);
            }}
          />
        </div>

        {/* Controls */}
        {isPlaying && !result && (
          <Controls
            currentLevel={currentLevel}
            multiplier={currentMultiplier}
            potentialWin={potentialWin}
            risk={riskLevel}
            nextLevelProb={nextLevelProb}
            isClimbing={isBetting}
            canCashOut={currentLevel > 0}
            onClimb={climbUp}
            onCashOut={cashOut}
          />
        )}

        {/* Result Display */}
        {result && (
          <div className={`text-center text-3xl font-bold mb-4 animate-bounce ${
            result.includes('WON') || result.includes('CASHED') ? 'text-green-400' : 'text-red-400'
          }`}>
            {result}
          </div>
        )}

        {/* Start Game / Reset */}
        {!isPlaying && (
          <div className="space-y-4">
            {!result && (
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
                  className="w-full px-3 py-2 bg-gray-700 border border-indigo-600 rounded text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <button
              onClick={result ? resetGame : startGame}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              {result ? '🔄 New Climb' : '🚀 START CLIMBING'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

