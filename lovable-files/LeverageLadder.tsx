import React, { useState, useEffect, useRef } from 'react';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { useBalance } from './BalanceContext';
import { WalletBalance } from './WalletBalance';
import TestLadderScene from './components/games/leverage/TestLadderScene';
import Controls from './components/games/leverage/Controls';
import { sfxManager } from './lib/sfx/SFXManager';

// Generate 100 levels with ADDICTIVE multiplier curve
// Formula: multiplier = 1.2^level (more aggressive growth)
// Level 1 = 1.2×, Level 5 = 2.5×, Level 10 = 6.2×, Level 20 = 38×, Level 30 = 237×, Level 50 = 9,100×
const generateLadderRungs = () => {
  const rungs = [];
  for (let level = 1; level <= 100; level++) {
    const multiplier = Math.pow(1.2, level);
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
  const [isResolving, setIsResolving] = useState(false); // Prevent duplicate resolutions
  const { placeBet, resolveBet, cashoutBet, getBalance, isBetting, error } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, displayCurrency, formatBalance, convertToUsd } = useCurrency();
  const { getAvailableBalance } = useBalance();
  const [balance, setBalance] = useState<number>(0);
  
  // Scene ref for animations (simplified for test)
  const sceneRef = useRef<any>(null);

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

  // Removed calculateBustLevel - backend now handles all RNG securely

  const startGame = async () => {
    try {
      // Initialize SFX on first user interaction
      await sfxManager.initializeOnUserInteraction();
      
      setIsPlaying(true);
      setCurrentLevel(0);
      setResult(null);
      setBustLevel(null); // Don't calculate bust level on frontend!
      setIsResolving(false); // Reset resolving state

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
    if (!isPlaying || currentLevel >= 100 || !betId || isResolving) return;

    const nextLevel = currentLevel + 1;
    
    // Prevent duplicate resolutions
    setIsResolving(true);
    
    // Play climb attempt sound
    sfxManager.play('climb_success', 0.5);
    
    try {
      // Let backend determine if this climb succeeds or fails
      // Send the current level to backend for RNG decision
      const resolveParams = {
        currentLevel: nextLevel,
        action: 'climb'
      };
      
      console.log('🎯 Sending climb request to backend:', resolveParams);
      const result = await resolveBet(betId, resolveParams);
      
      if (result.outcome === 'lose' || result.outcome === 'crash') {
        // Backend determined liquidation
        setCurrentLevel(nextLevel);
        setResult('💥 LIQUIDATED! You lost everything!');
        setIsPlaying(false);
        
        // Play liquidation sound and animation
        sfxManager.play('liquidation_thunder', 0.8);
        console.log('💥 Liquidation animation triggered');
        
        await refreshBalance();
      } else {
        // Backend determined success
        setCurrentLevel(nextLevel);
        
        // Play success animation
        console.log('🎯 Advance animation triggered');
        
        // Give feedback at milestones - BALANCED PSYCHOLOGICAL HOOKS
        if (nextLevel === 3) {
          console.log('🎯 Good start! Level 3 - 1.7× multiplier! The real challenge begins now!');
          sfxManager.play('milestone_reached', 0.7);
        } else if (nextLevel === 8) {
          console.log('🔥 Nice progress! Level 8 - 4.3× multiplier! Getting interesting!');
          sfxManager.play('milestone_reached', 0.7);
        } else if (nextLevel === 15) {
          console.log('💎 Impressive! Level 15 - 15.4× multiplier! This is where legends are made!');
          sfxManager.play('milestone_reached', 0.7);
        } else if (nextLevel === 25) {
          console.log('🚀 LEGENDARY! Level 25 - 95× multiplier! You could be rich!');
          sfxManager.play('milestone_reached', 0.7);
        } else if (nextLevel === 40) {
          console.log('👑 GODLIKE! Level 40 - 1,470× multiplier! LIFE CHANGING MONEY!');
          sfxManager.play('milestone_reached', 0.7);
        } else if (nextLevel === 60) {
          console.log('🌟 UNSTOPPABLE! Level 60 - 56,348× multiplier! LEGEND STATUS!');
          sfxManager.play('milestone_reached', 0.7);
        } else if (nextLevel === 100) {
          console.log('👑 MAXIMUM POWER! Level 100 - 83M× multiplier! YOU ARE THE CHOSEN ONE!');
          sfxManager.play('milestone_reached', 0.7);
        }
      }
    } catch (error) {
      console.error('Climb failed:', error);
      alert('Climb failed: ' + (error as Error).message);
    } finally {
      setIsResolving(false);
    }
  };

  const cashOut = async () => {
    if (!isPlaying || currentLevel === 0 || !betId || isResolving) return;

    setIsResolving(true);
    setIsPlaying(false);
    const multiplier = LADDER_RUNGS[currentLevel - 1].multiplier;

    try {
      // Play cashout sound and animation
      sfxManager.play('cashout_chime', 0.8);
      console.log('💰 Cashout animation triggered');
      
      // Send current multiplier to backend
      await cashoutBet(betId, multiplier);
      await refreshBalance();
      setResult(`🎉 CASHED OUT! ${multiplier.toFixed(2)}× WIN!`);
    } catch (error) {
      console.error('Cashout failed:', error);
      alert('Cashout failed: ' + (error as Error).message);
      setIsPlaying(true); // Re-enable if cashout failed
    } finally {
      setIsResolving(false);
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setCurrentLevel(0);
    setResult(null);
    setBetId(null);
    setBustLevel(null);
    setIsResolving(false);
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
      <p className="text-gray-300 mb-4">The ultimate test of greed! Every level is a 50/50 gamble with massive multipliers - will you cash out or risk it all?</p>

      {/* Main Game Area */}
      <div className="space-y-4">
        {/* Ladder Scene - Test Version */}
        <div className="bg-black rounded-lg border border-indigo-700 overflow-hidden" 
             style={{ height: '56vh', minHeight: '400px' }}>
          <TestLadderScene
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
            isResolving={isResolving}
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
                  Bet Amount (USD):
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
              {result ? '🔄 Try Again' : '🚀 START YOUR JOURNEY TO RICHES'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

