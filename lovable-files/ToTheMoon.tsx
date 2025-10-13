import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const ToTheMoon: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [multiplier, setMultiplier] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startGame = async () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    try {
      const bet = await apiService.placeBet({
        game: 'to_the_moon',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: {},
      });
      
      setBetId(bet.id);
      setIsRunning(true);
      setCrashed(false);
      setCashedOut(false);
      setMultiplier(1.0);
      
      // Simulate multiplier growth
      intervalRef.current = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + 0.01;
          // Random crash simulation (1% chance each step)
          if (Math.random() < 0.01) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setCrashed(true);
            setIsRunning(false);
            resolveBet(bet.id, newMultiplier);
            return newMultiplier;
          }
          return newMultiplier;
        });
      }, 100);
      
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game: ' + (error as Error).message);
    }
  };

  const cashout = async () => {
    if (betId && intervalRef.current) {
      // Stop the game immediately
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      setCashedOut(true);
      
      try {
        // Send current multiplier to backend
        await apiService.cashoutBet(betId, multiplier);
        await fetchBalances();
        alert(`Cashed out at ${multiplier.toFixed(2)}x! 🎉`);
      } catch (error) {
        console.error('Cashout failed:', error);
        alert('Cashout failed: ' + (error as Error).message);
      }
    }
  };

  const resolveBet = async (id: string, finalMultiplier: number) => {
    try {
      await apiService.resolveBet(id);
      await fetchBalances();
      alert(`Crashed at ${finalMultiplier.toFixed(2)}x!`);
    } catch (error) {
      console.error('Bet resolution failed:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">🚀 To the Moon</h2>
      <p className="text-gray-300 mb-6">Watch the multiplier grow and cash out before it crashes!</p>
      
      <div className="text-center">
        <div className={`text-6xl font-bold mb-6 ${crashed ? 'text-red-500' : 'text-green-400'}`}>
          {multiplier.toFixed(2)}x
        </div>
        
        {!isRunning && !crashed && (
          <div className="space-y-4">
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              step="0.01"
              min="0.01"
              placeholder="Stake (USDC)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
            <button
              onClick={startGame}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-colors"
            >
              Start Game
            </button>
          </div>
        )}
        
        {isRunning && (
          <button
            onClick={cashout}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded font-bold text-xl transition-colors"
          >
            💰 Cash Out
          </button>
        )}
        
        {(crashed || cashedOut) && (
          <button
            onClick={() => {
              setCrashed(false);
              setCashedOut(false);
              setMultiplier(1.0);
              setBetId(null);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
};
