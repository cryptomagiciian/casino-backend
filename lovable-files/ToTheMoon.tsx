import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import { WalletBalance } from './WalletBalance';

export const ToTheMoon: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [multiplier, setMultiplier] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [rocketPosition, setRocketPosition] = useState(0);
  const [stars, setStars] = useState<{x: number, y: number, size: number, speed: number}[]>([]);
  const [exhaust, setExhaust] = useState<{id: number, y: number, opacity: number}[]>([]);
  const [crashPoint, setCrashPoint] = useState<number>(2.0);
  const [canCashout, setCanCashout] = useState(false);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const exhaustCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  // HOUSE EDGE: Generate crash point with balanced early crash prevention
  const generateCrashPoint = (): number => {
    const rand = Math.random();
    
    // ANTI-EXPLOIT: 50% crash BEFORE 2x (prevent doubling strategy)
    // 30% crash at 1.0-1.5x (instant loss - can't even cash out)
    if (rand < 0.30) return 1.0 + Math.random() * 0.5;
    // 20% crash at 1.5-2.0x (crashes right at doubling point)
    if (rand < 0.50) return 1.5 + Math.random() * 0.49; // Cap at 1.99x
    
    // 20% crash at 2.0-2.5x (barely past double)
    if (rand < 0.80) return 2.0 + Math.random() * 0.5;
    // 10% crash at 2.5-4.0x (medium win)
    if (rand < 0.90) return 2.5 + Math.random() * 1.5;
    // 6% crash at 4.0-7.0x (decent win)
    if (rand < 0.96) return 4.0 + Math.random() * 3.0;
    // 3% crash at 7.0-15x (lucky win)
    if (rand < 0.99) return 7.0 + Math.random() * 8.0;
    // 1% crash at 15x+ (jackpot - keeps them playing)
    return 15.0 + Math.random() * 35.0;
  };

  useEffect(() => {
    const newStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
    }));
    setStars(newStars);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startGame = async () => {
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
      
      // Generate crash point (house edge)
      const targetCrash = generateCrashPoint();
      setCrashPoint(targetCrash);
      
      setBetId(bet.id);
      setIsRunning(true);
      setCrashed(false);
      setCashedOut(false);
      setMultiplier(1.0);
      setRocketPosition(0);
      setExhaust([]);
      setCanCashout(false);
      startTimeRef.current = Date.now();
      
      // Enable cashout after 1 second minimum (anti-exploit)
      setTimeout(() => setCanCashout(true), 1000);
      
      // FASTER multiplier growth (30ms instead of 50ms, harder to time)
      intervalRef.current = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + 0.02;
          const newPosition = Math.min((newMultiplier - 1) * 10, 90);
          setRocketPosition(newPosition);
          
          // Add exhaust trail
          if (exhaustCountRef.current % 2 === 0) {
            setExhaust(ex => [
              ...ex.slice(-8),
              { id: Date.now(), y: newPosition, opacity: 1 }
            ]);
          }
          exhaustCountRef.current++;
          
          // Check if reached crash point
          if (newMultiplier >= targetCrash && !cashedOut) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setCrashed(true);
            setIsRunning(false);
            resolveBet(bet.id, targetCrash);
            return targetCrash;
          }
          return newMultiplier;
        });
      }, 30); // MUCH faster - harder to time cashouts
      
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game: ' + (error as Error).message);
    }
  };

  const cashout = async () => {
    // ANTI-EXPLOIT: Prevent instant cashouts and small wins
    if (!canCashout) {
      console.log('Cashout blocked: Must wait 1 second minimum');
      return;
    }
    
    // Minimum 1.2x cashout (prevents tiny profit spam)
    if (multiplier < 1.2) {
      console.log('Cashout blocked: Minimum 1.2x required');
      return;
    }
    
    if (betId && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      setCashedOut(true);
      setCanCashout(false);
      
      try {
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
    setExhaust([]);
    exhaustCountRef.current = 0;
  };

  return (
    <div className="bg-gradient-to-br from-black via-indigo-950 to-purple-950 rounded-lg p-6 border-2 border-indigo-500 shadow-2xl relative">
      <WalletBalance position="top-right" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            🚀 TO THE MOON
          </h2>
          <p className="text-gray-300 text-sm">Cash out before the crash! • Unlimited potential</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Potential Win</div>
          <div className="text-lg font-bold text-green-400">${(parseFloat(stake) * multiplier).toFixed(2)}</div>
        </div>
      </div>

      {/* Enhanced Space Scene */}
      <div className="relative bg-gradient-to-b from-black via-indigo-950 to-purple-950 rounded-lg p-4 mb-4 border-2 border-indigo-700 overflow-hidden h-[500px]">
        {/* Animated Stars */}
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0.3 + Math.sin(Date.now() * 0.001 * star.speed + i) * 0.3,
              boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,0.5)`,
              animation: isRunning ? `twinkle ${1 + star.speed}s infinite` : 'none',
            }}
          />
        ))}

        {/* Nebula effects */}
        <div className="absolute inset-0 opacity-30 animate-pulse" style={{ background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 50%, transparent 100%)' }} />
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 50%, transparent 100%)', animationDelay: '1s' }} />

        {/* Moon with glow */}
        <div className="absolute top-8 right-8 animate-pulse">
          <div className="relative">
            <div className="absolute inset-0 text-9xl blur-xl opacity-50">🌙</div>
            <div className="relative text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">🌙</div>
            {rocketPosition > 75 && !crashed && (
              <>
                <div className="absolute -top-4 -right-4 text-3xl animate-bounce">✨</div>
                <div className="absolute -bottom-4 -left-4 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
              </>
            )}
          </div>
        </div>

        {/* Earth with atmosphere */}
        <div className="absolute bottom-8 left-8">
          <div className="relative">
            <div className="absolute inset-0 text-7xl blur-lg opacity-40">🌍</div>
            <div className="relative text-7xl drop-shadow-lg">🌍</div>
          </div>
        </div>

        {/* Exhaust trail */}
        {exhaust.map((e, i) => (
          <div
            key={e.id}
            className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-300"
            style={{
              bottom: `${e.y}%`,
              opacity: Math.max(0, e.opacity - i * 0.1),
            }}
          >
            <div className="text-4xl animate-pulse" style={{ filter: 'blur(2px)' }}>
              🔥
            </div>
          </div>
        ))}

        {/* Custom Rocket SVG */}
        <div 
          className="absolute transition-all duration-100"
          style={{
            left: '50%',
            bottom: `${rocketPosition}%`,
            transform: `translateX(-50%) rotate(${crashed ? 180 : 0}deg) scale(${isRunning && !crashed ? 1 + Math.sin(Date.now() * 0.01) * 0.05 : 1})`,
          }}
        >
          <div className="relative">
            {/* Rocket SVG */}
            <svg width="80" height="120" viewBox="0 0 80 120" className={crashed ? 'animate-spin' : ''}>
              <defs>
                <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
                <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Rocket body */}
              <path d="M 40 10 L 50 30 L 50 80 L 30 80 L 30 30 Z" fill="url(#rocketGradient)" stroke="#1e3a8a" strokeWidth="2"/>
              
              {/* Rocket nose */}
              <path d="M 40 0 L 55 30 L 25 30 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
              
              {/* Window */}
              <circle cx="40" cy="45" r="10" fill="url(#windowGradient)" stroke="#0369a1" strokeWidth="2"/>
              <circle cx="40" cy="45" r="7" fill="#0c4a6e" opacity="0.5"/>
              
              {/* Fins */}
              <path d="M 30 70 L 15 90 L 30 85 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2"/>
              <path d="M 50 70 L 65 90 L 50 85 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2"/>
              
              {/* Details */}
              <line x1="30" y1="35" x2="50" y2="35" stroke="#1e3a8a" strokeWidth="1"/>
              <line x1="30" y1="60" x2="50" y2="60" stroke="#1e3a8a" strokeWidth="1"/>
              
              {/* Glow effect */}
              {isRunning && !crashed && (
                <circle cx="40" cy="60" r="30" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.3" filter="url(#glow)">
                  <animate attributeName="r" from="30" to="40" dur="1s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite"/>
                </circle>
              )}
            </svg>
            
            {/* Enhanced flames */}
            {isRunning && !crashed && (
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <div className="text-6xl animate-pulse absolute -top-2" style={{ filter: 'blur(4px)', opacity: 0.5 }}>🔥</div>
                  <div className="text-6xl animate-pulse">🔥</div>
                  <div className="absolute -left-6 top-2 text-4xl animate-pulse" style={{ animationDelay: '0.1s' }}>🔥</div>
                  <div className="absolute -right-6 top-2 text-4xl animate-pulse" style={{ animationDelay: '0.2s' }}>🔥</div>
                </div>
              </div>
            )}

            {/* Explosion */}
            {crashed && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="text-9xl animate-ping absolute">💥</div>
                <div className="text-9xl">💥</div>
                <div className="text-6xl absolute -top-8 -left-8 animate-bounce">🔥</div>
                <div className="text-6xl absolute -top-8 -right-8 animate-bounce" style={{ animationDelay: '0.1s' }}>🔥</div>
                <div className="text-6xl absolute -bottom-8 left-0 animate-bounce" style={{ animationDelay: '0.2s' }}>💨</div>
              </div>
            )}

            {/* Success confetti */}
            {cashedOut && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="text-5xl animate-bounce">✨</div>
                <div className="text-4xl absolute -top-8 left-0 animate-bounce" style={{ animationDelay: '0.1s' }}>💰</div>
                <div className="text-4xl absolute -top-8 right-0 animate-bounce" style={{ animationDelay: '0.2s' }}>💎</div>
                <div className="text-3xl absolute top-8 left-0 animate-bounce" style={{ animationDelay: '0.3s' }}>⭐</div>
                <div className="text-3xl absolute top-8 right-0 animate-bounce" style={{ animationDelay: '0.4s' }}>🎉</div>
              </div>
            )}
          </div>
        </div>

        {/* Multiplier Display with enhanced effects */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className={`text-center ${crashed ? 'animate-pulse' : cashedOut ? 'animate-bounce' : ''}`}>
            <div className="relative">
              {/* Glow layers */}
              <div className={`absolute inset-0 text-9xl font-bold font-mono blur-2xl ${
                crashed ? 'text-red-500' : cashedOut ? 'text-green-400' : 'text-yellow-400'
              } opacity-50`}>
                {multiplier.toFixed(2)}×
              </div>
              <div className={`absolute inset-0 text-9xl font-bold font-mono blur-xl ${
                crashed ? 'text-red-500' : cashedOut ? 'text-green-400' : 'text-yellow-400'
              } opacity-70`}>
                {multiplier.toFixed(2)}×
              </div>
              {/* Main text */}
              <div className={`relative text-9xl font-bold font-mono ${
                crashed ? 'text-red-500' : cashedOut ? 'text-green-400' : 'text-yellow-400'
              } drop-shadow-[0_0_30px_rgba(255,255,0,0.8)]`}>
                {multiplier.toFixed(2)}×
              </div>
            </div>
            {isRunning && !crashed && (
              <div className="text-xl text-cyan-400 mt-4 font-bold animate-pulse drop-shadow-lg">
                ${(parseFloat(stake) * multiplier).toFixed(2)} USDC
              </div>
            )}
          </div>
        </div>

        {/* Enhanced altitude indicator */}
        <div className="absolute right-4 top-4 bottom-4 w-3 bg-gray-900 rounded-full border-2 border-gray-700 shadow-inner">
          <div 
            className="absolute bottom-0 w-full rounded-full transition-all duration-100"
            style={{ 
              height: `${rocketPosition}%`,
              background: 'linear-gradient(to top, #10b981, #fbbf24, #ef4444)',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
            }}
          />
          <div 
            className="absolute w-5 h-5 bg-white rounded-full left-1/2 transform -translate-x-1/2 shadow-lg border-2 border-yellow-400 animate-pulse"
            style={{ bottom: `calc(${rocketPosition}% - 10px)` }}
          />
        </div>

        {/* Status messages */}
        {crashed && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-2xl border-4 border-red-300 animate-pulse shadow-2xl">
              💥 RUG PULL! CRASHED AT {multiplier.toFixed(2)}×
            </div>
          </div>
        )}

        {cashedOut && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-xl font-bold text-2xl border-4 border-green-300 animate-bounce shadow-2xl">
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
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            🚀 LAUNCH TO THE MOON
          </button>
        </div>
      )}

      {isRunning && !crashed && !cashedOut && (
        <button
          onClick={cashout}
          disabled={!canCashout || multiplier < 1.2}
          className={`w-full py-4 rounded-lg font-bold text-xl transition-all transform shadow-lg ${
            canCashout && multiplier >= 1.2
              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white hover:scale-105 shadow-yellow-500/50 animate-pulse cursor-pointer'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          {!canCashout ? '⏳ WAIT...' : multiplier < 1.2 ? '❌ MIN 1.2×' : `💰 CASH OUT NOW! ($${(parseFloat(stake) * multiplier).toFixed(2)})`}
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
