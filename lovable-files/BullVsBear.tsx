import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const BullVsBear: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [side, setSide] = useState<'bull' | 'bear'>('bull');
  const [isPlaying, setIsPlaying] = useState(false);
  const [barPosition, setBarPosition] = useState(50); // 0-100, 50 is center
  const [result, setResult] = useState<string | null>(null);
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

      const bet = await apiService.placeBet({
        game: 'bull_vs_bear_battle',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { side },
      });

      // Tug of war animation
      let steps = 0;
      intervalRef.current = setInterval(() => {
        steps++;
        
        setBarPosition(prev => {
          // Random movement
          const move = (Math.random() - 0.5) * 8;
          let newPos = prev + move;
          
          // Keep in bounds
          newPos = Math.max(0, Math.min(100, newPos));
          
          // After 20 steps, decide winner
          if (steps >= 20) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            
            // Resolve bet with timeout and error handling
            apiService.resolveBet(bet.id)
              .then(async (resolved) => {
                const won = resolved.resultMultiplier > 0;
                const winner = won ? side : (side === 'bull' ? 'bear' : 'bull');
                
                // Animate to winning side
                setBarPosition(winner === 'bull' ? 95 : 5);
                
                await fetchBalances();
                setResult(won ? '🎉 YOUR SIDE WON! 1.98×' : '💥 YOUR SIDE LOST!');
              })
              .catch(async (error) => {
                console.error('Bet resolution failed:', error);
                await fetchBalances();
                setResult('❌ Error: ' + error.message);
              })
              .finally(() => {
                setIsPlaying(false);
              });
          }
          
          return newPos;
        });
      }, 150);

    } catch (error) {
      console.error('Bet failed:', error);
      alert('Bet failed: ' + (error as Error).message);
      setIsPlaying(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setResult(null);
    setBarPosition(50);
  };

  return (
    <div className="bg-gradient-to-br from-green-900 via-gray-900 to-red-900 rounded-lg p-6 border-2 border-yellow-500 shadow-2xl">
      <h2 className="text-3xl font-bold text-yellow-400 mb-2">🐂 BULL VS BEAR 🐻</h2>
      <p className="text-gray-300 mb-4">Choose your side! 1.98× payout</p>

      {/* Battle Arena */}
      <div className="bg-black rounded-lg p-6 mb-4 border border-yellow-700 relative h-48">
        {/* Bull Side */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-6xl animate-bounce">
          🐂
        </div>

        {/* Bear Side */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-6xl animate-bounce">
          🐻
        </div>

        {/* Battle Bar */}
        <div className="absolute top-1/2 left-20 right-20 transform -translate-y-1/2">
          {/* Background bar */}
          <div className="h-12 bg-gradient-to-r from-green-800 via-gray-700 to-red-800 rounded-full relative overflow-hidden">
            {/* Center marker */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-white" />
            
            {/* Moving indicator */}
            <div 
              className="absolute top-0 h-full w-6 bg-yellow-400 rounded-full transition-all duration-150 shadow-lg"
              style={{ left: `calc(${barPosition}% - 12px)` }}
            >
              <div className="absolute inset-0 bg-yellow-300 rounded-full animate-ping opacity-75" />
            </div>
          </div>

          {/* Score indicators */}
          <div className="flex justify-between mt-2 text-sm font-bold">
            <span className={`${barPosition < 30 ? 'text-green-400 text-xl' : 'text-gray-500'}`}>
              BULL {barPosition < 30 && '🔥'}
            </span>
            <span className={`${barPosition > 70 ? 'text-red-400 text-xl' : 'text-gray-500'}`}>
              {barPosition > 70 && '🔥'} BEAR
            </span>
          </div>
        </div>

        {/* Crowd Cheering Effect */}
        {isPlaying && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-yellow-400 animate-pulse font-bold">
            {barPosition < 40 && '📣 GO BULL GO!'}
            {barPosition > 60 && '📣 GO BEAR GO!'}
            {barPosition >= 40 && barPosition <= 60 && '⚔️ INTENSE BATTLE!'}
          </div>
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
              className="w-full px-3 py-2 bg-gray-700 border border-yellow-600 rounded text-white focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Choose Your Side:
            </label>
            <div className="flex gap-4">
              <button
                className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 ${
                  side === 'bull'
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50'
                    : 'bg-gray-700 text-gray-400'
                }`}
                onClick={() => setSide('bull')}
              >
                🐂 BULL
              </button>
              <button
                className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 ${
                  side === 'bear'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-700 text-gray-400'
                }`}
                onClick={() => setSide('bear')}
              >
                🐻 BEAR
              </button>
            </div>
          </div>

          <button
            onClick={placeBet}
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            ⚔️ START BATTLE
          </button>
        </div>
      )}

      {isPlaying && !result && (
        <div className="text-center text-yellow-400 font-bold text-xl animate-pulse">
          ⚔️ Battle in progress... GO {side.toUpperCase()}!
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
        >
          🔄 New Battle
        </button>
      )}
    </div>
  );
};

