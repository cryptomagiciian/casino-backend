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
  const [rocketPosition, setRocketPosition] = useState(0); // 0-100%
  const [stars, setStars] = useState<{x: number, y: number, size: number}[]>([]);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate stars on mount
  useEffect(() => {
    const newStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
    }));
    setStars(newStars);
  }, []);

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
      setRocketPosition(0);
      
      // Simulate multiplier growth
      intervalRef.current = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + 0.01;
          const newPosition = Math.min((newMultiplier - 1) * 10, 90); // 0% to 90%
          setRocketPosition(newPosition);
          
          // Random crash simulation (1% chance each step after 1.5x)
          if (newMultiplier > 1.5 && Math.random() < 0.01) {
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
    } catch (error) {
      console.error('Bet resolution failed:', error);
    }
  };

  const resetGame = () => {
    setCrashed(false);
    setCashedOut(false);
    setMultiplier(1.0);
    setBetId(null);
    setRocketPosition(0);
  };

  return (
    <div className="bg-gradient-to-br from-black via-indigo-950 to-purple-950 rounded-lg p-6 border-2 border-indigo-500 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            🚀 TO THE MOON
          </h2>
          <p className="text-gray-300 text-sm">Cash out before the crash! • Unlimited potential</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Stake</div>
          <div className="text-lg font-bold text-yellow-400">${stake} USDC</div>
        </div>
      </div>

      {/* Space Scene */}
      <div className="relative bg-black rounded-lg p-4 mb-4 border-2 border-indigo-700 overflow-hidden h-96">
        {/* Stars */}
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0.3 + Math.random() * 0.7,
            }}
          />
        ))}

        {/* Moon */}
        <div className="absolute top-8 right-8">
          <div className="relative">
            <div className="text-8xl animate-pulse">🌙</div>
            {rocketPosition > 80 && !crashed && (
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
            )}
          </div>
        </div>

        {/* Earth */}
        <div className="absolute bottom-8 left-8">
          <div className="text-6xl">🌍</div>
        </div>

        {/* Rocket */}
        <div 
          className="absolute transition-all duration-100"
          style={{
            left: '50%',
            bottom: `${rocketPosition}%`,
            transform: `translateX(-50%) rotate(${crashed ? 180 : 0}deg)`,
          }}
        >
          <div className="relative">
            {/* Rocket emoji */}
            <div className={`text-7xl ${
              isRunning && !crashed ? 'animate-bounce' : ''
            } ${crashed ? 'animate-spin' : ''}`}>
              🚀
            </div>
            
            {/* Flames when running */}
            {isRunning && !crashed && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-4xl animate-pulse">
                🔥
              </div>
            )}

            {/* Explosion when crashed */}
            {crashed && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="text-8xl animate-ping absolute">💥</div>
                <div className="text-8xl">💥</div>
              </div>
            )}

            {/* Success stars when cashed out */}
            {cashedOut && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce">
                ✨💰✨
              </div>
            )}
          </div>
        </div>

        {/* Multiplier Display */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className={`text-center ${
            crashed ? 'animate-pulse' : cashedOut ? 'animate-bounce' : ''
          }`}>
            <div className={`text-8xl font-bold font-mono ${
              crashed ? 'text-red-500' : 
              cashedOut ? 'text-green-400' : 
              'text-yellow-400'
            } drop-shadow-[0_0_30px_rgba(255,255,0,0.5)]`}>
              {multiplier.toFixed(2)}×
            </div>
            {isRunning && !crashed && (
              <div className="text-sm text-cyan-400 mt-2 animate-pulse">
                ${(parseFloat(stake) * multiplier).toFixed(2)} USDC
              </div>
            )}
          </div>
        </div>

        {/* Altitude indicator */}
        <div className="absolute right-4 top-4 bottom-4 w-2 bg-gray-800 rounded-full">
          <div 
            className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-100"
            style={{ height: `${rocketPosition}%` }}
          />
          <div 
            className="absolute w-4 h-4 bg-white rounded-full left-1/2 transform -translate-x-1/2 shadow-lg"
            style={{ bottom: `${rocketPosition}%` }}
          />
        </div>

        {/* Status message */}
        {crashed && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            <div className="bg-red-500/90 text-white px-6 py-3 rounded-lg font-bold text-xl border-2 border-red-300 animate-pulse">
              💥 RUG PULL! CRASHED AT {multiplier.toFixed(2)}×
            </div>
          </div>
        )}

        {cashedOut && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            <div className="bg-green-500/90 text-white px-6 py-3 rounded-lg font-bold text-xl border-2 border-green-300 animate-bounce">
              💰 CASHED OUT! Won ${(parseFloat(stake) * multiplier).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {!isRunning && !crashed && !cashedOut && (
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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-indigo-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-lg"
            />
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
          >
            🚀 LAUNCH TO THE MOON
          </button>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-indigo-600/30">
            <p className="text-sm text-gray-300 text-center">
              Multiplier grows infinitely • Cash out anytime • Random crash!
            </p>
          </div>
        </div>
      )}

      {isRunning && !crashed && !cashedOut && (
        <button
          onClick={cashout}
          className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50 animate-pulse"
        >
          💰 CASH OUT NOW! (${(parseFloat(stake) * multiplier).toFixed(2)})
        </button>
      )}

      {(crashed || cashedOut) && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 Launch Again
        </button>
      )}
    </div>
  );
};
