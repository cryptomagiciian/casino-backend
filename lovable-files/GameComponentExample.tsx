/**
 * EXAMPLE: How to update your existing game components
 * 
 * This shows how to integrate the new betting system into your games.
 * Copy this pattern to all your game components.
 */

import React, { useState, useEffect } from 'react';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';

interface GameComponentProps {
  gameName: string;
  className?: string;
}

export const GameComponentExample: React.FC<GameComponentProps> = ({ 
  gameName,
  className = '' 
}) => {
  const { placeBet, resolveBet, cashoutBet, getBalance, isBetting, error } = useBetting();
  const { network } = useNetwork();
  const { displayCurrency, bettingCurrency, formatBalance } = useCurrency();
  
  const [balance, setBalance] = useState<number>(0);
  const [stake, setStake] = useState<number>(10);
  const [betId, setBetId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'betting' | 'playing' | 'finished'>('idle');
  const [result, setResult] = useState<any>(null);

  // Refresh balance when network or currency changes
  useEffect(() => {
    refreshBalance();
  }, [network, displayCurrency]);

  const refreshBalance = async () => {
    try {
      const currentBalance = await getBalance(bettingCurrency);
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const handlePlaceBet = async () => {
    if (balance < stake) {
      alert('Insufficient balance!');
      return;
    }

    try {
      setGameState('betting');
      
      const betResult = await placeBet({
        game: gameName,
        stake: stake,
        currency: displayCurrency === 'usd' ? 'USD' : bettingCurrency,
        prediction: {
          // Add your game-specific prediction data here
          direction: 'up', // Example for pump/dump
          amount: stake,
        },
        meta: {
          network,
          displayCurrency,
          bettingCurrency,
          timestamp: Date.now(),
        },
      });

      setBetId(betResult.id);
      setGameState('playing');
      
      // Simulate game play (replace with your actual game logic)
      setTimeout(() => {
        handleResolveBet();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to place bet:', error);
      setGameState('idle');
    }
  };

  const handleResolveBet = async () => {
    if (!betId) return;

    try {
      const result = await resolveBet(betId);
      setResult(result);
      setGameState('finished');
      
      // Refresh balance after bet resolution
      await refreshBalance();
      
      // Reset after 3 seconds
      setTimeout(() => {
        setGameState('idle');
        setBetId(null);
        setResult(null);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to resolve bet:', error);
      setGameState('idle');
    }
  };

  const handleCashout = async (multiplier?: number) => {
    if (!betId) return;

    try {
      const result = await cashoutBet(betId, multiplier);
      setResult(result);
      setGameState('finished');
      
      // Refresh balance after cashout
      await refreshBalance();
      
      // Reset after 3 seconds
      setTimeout(() => {
        setGameState('idle');
        setBetId(null);
        setResult(null);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to cashout:', error);
    }
  };

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold capitalize">{gameName.replace('_', ' ')}</h2>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${
            network === 'mainnet' 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-orange-600/20 text-orange-400'
          }`}>
            {network === 'mainnet' ? 'LIVE' : 'DEMO'}
          </span>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Balance:</span>
          <span className="font-mono font-bold text-green-400">
            {formatBalance(balance, bettingCurrency)}
          </span>
        </div>
      </div>

      {/* Stake Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Stake Amount</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            min="1"
            max={balance}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            disabled={gameState !== 'idle'}
          />
          <span className="text-gray-400 text-sm">
            {displayCurrency === 'usd' ? 'USD' : bettingCurrency}
          </span>
        </div>
      </div>

      {/* Game Controls */}
      <div className="space-y-3">
        {gameState === 'idle' && (
          <button
            onClick={handlePlaceBet}
            disabled={isBetting || balance < stake}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {isBetting ? 'Placing Bet...' : `Place Bet (${stake} ${displayCurrency === 'usd' ? 'USD' : bettingCurrency})`}
          </button>
        )}

        {gameState === 'playing' && (
          <div className="space-y-2">
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Game in progress...</p>
            </div>
            <button
              onClick={() => handleCashout(2.0)} // Example 2x cashout
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              Cashout (2x)
            </button>
          </div>
        )}

        {gameState === 'finished' && result && (
          <div className="text-center py-4">
            <div className={`text-2xl font-bold mb-2 ${
              result.won ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.won ? '🎉 WIN!' : '💸 LOSS'}
            </div>
            <p className="text-gray-400">
              {result.won 
                ? `Won ${formatBalance(result.payout, bettingCurrency)}` 
                : `Lost ${formatBalance(result.stake, bettingCurrency)}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Network Info */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <p className="text-xs text-gray-500 text-center">
          Playing on {network === 'mainnet' ? 'LIVE' : 'TESTNET'} network
        </p>
      </div>
    </div>
  );
};

/**
 * INTEGRATION CHECKLIST FOR YOUR GAMES:
 * 
 * 1. Import the required hooks:
 *    - useBetting from GameBettingProvider
 *    - useNetwork from NetworkContext  
 *    - useCurrency from CurrencyToggle
 * 
 * 2. Replace your old betting logic with:
 *    - placeBet() instead of direct API calls
 *    - resolveBet() for game resolution
 *    - cashoutBet() for early cashouts
 *    - getBalance() for balance checks
 * 
 * 3. Add network awareness:
 *    - Show LIVE/DEMO indicators
 *    - Handle network-specific logic
 *    - Refresh balances on network changes
 * 
 * 4. Add currency support:
 *    - Use formatBalance() for display
 *    - Handle USD to crypto conversion
 *    - Show appropriate currency labels
 * 
 * 5. Add proper error handling:
 *    - Show betting errors to users
 *    - Handle insufficient balance
 *    - Handle network errors gracefully
 * 
 * 6. Add balance refresh:
 *    - After bet placement
 *    - After bet resolution
 *    - After cashouts
 *    - On network/currency changes
 */
