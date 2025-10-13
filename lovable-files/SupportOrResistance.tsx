import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

interface PricePoint {
  price: number;
  timestamp: number;
}

export const SupportOrResistance: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'break' | 'reject'>('break');
  const [isPlaying, setIsPlaying] = useState(false);
  const [price, setPrice] = useState(50000);
  const [support, setSupport] = useState(48000);
  const [resistance, setResistance] = useState(52000);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [priceMoving, setPriceMoving] = useState(false);
  const [breakoutDirection, setBreakoutDirection] = useState<'up' | 'down' | null>(null);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize price history
    const initHistory: PricePoint[] = [];
    let currentPrice = 50000;
    const sup = 48500;
    const res = 51500;
    
    for (let i = 0; i < 30; i++) {
      // Keep price between support and resistance
      const targetPrice = sup + Math.random() * (res - sup);
      currentPrice = currentPrice * 0.7 + targetPrice * 0.3;
      initHistory.push({
        price: currentPrice,
        timestamp: Date.now() - (30 - i) * 1000,
      });
    }
    
    setPriceHistory(initHistory);
    setPrice(currentPrice);
    setSupport(sup);
    setResistance(res);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const placeBet = async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      setPriceMoving(true);
      setResult(null);
      setBreakoutDirection(null);

      // Place bet on backend
      const bet = await apiService.placeBet({
        game: 'support_or_resistance',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });

      // Animate price building tension
      let step = 0;
      const startPrice = price;
      
      intervalRef.current = setInterval(() => {
        step++;
        
        if (step < 20) {
          // Create tension with realistic movements toward a level
          const targetLevel = Math.random() > 0.5 ? resistance : support;
          const progress = step / 20;
          const tensionPrice = startPrice + (targetLevel - startPrice) * progress + Math.sin(step) * 200;
          
          setPrice(tensionPrice);
          setPriceHistory(prev => [...prev.slice(-29), { 
            price: tensionPrice, 
            timestamp: Date.now() 
          }]);
        } else {
          // Final decision
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Resolve bet with error handling
          apiService.resolveBet(bet.id)
            .then(async (resolved) => {
              const won = resolved.resultMultiplier > 0;
              const actualOutcome = won ? prediction : (prediction === 'break' ? 'reject' : 'break');
              
              // Determine breakout direction
              let finalPrice: number;
              if (actualOutcome === 'break') {
                // Broke through - randomly choose direction
                if (Math.random() > 0.5) {
                  finalPrice = resistance + 800;
                  setBreakoutDirection('up');
                } else {
                  finalPrice = support - 800;
                  setBreakoutDirection('down');
                }
              } else {
                // Rejected - bounce back to center
                finalPrice = (support + resistance) / 2;
              }
              
              // Animate to final position
              let animStep = 0;
              const animInterval = setInterval(() => {
                animStep++;
                const animProgress = animStep / 10;
                const currentPrice = price + (finalPrice - price) * animProgress;
                
                setPrice(currentPrice);
                setPriceHistory(prev => [...prev.slice(-29), { 
                  price: currentPrice, 
                  timestamp: Date.now() 
                }]);
                
                if (animStep >= 10) {
                  clearInterval(animInterval);
                  setPriceMoving(false);
                }
              }, 100);
              
              await fetchBalances();
              setResult(won ? '🎉 YOU WON! 2.0×' : '💥 YOU LOST!');
            })
            .catch(async (error) => {
              console.error('Bet resolution failed:', error);
              await fetchBalances();
              setResult('❌ Error: ' + error.message);
              setPriceMoving(false);
            })
            .finally(() => {
              setIsPlaying(false);
            });
        }
      }, 150);

    } catch (error) {
      console.error('Bet failed:', error);
      setResult('❌ Bet failed: ' + (error as Error).message);
      setIsPlaying(false);
      setPriceMoving(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setPriceMoving(false);
    setResult(null);
    setBreakoutDirection(null);
    
    // New support/resistance levels
    const newSupport = 47000 + Math.random() * 2000;
    const newResistance = 51000 + Math.random() * 2000;
    const newPrice = newSupport + (newResistance - newSupport) * 0.5;
    
    setSupport(newSupport);
    setResistance(newResistance);
    setPrice(newPrice);
    setPriceHistory(prev => [...prev.slice(-29), { 
      price: newPrice, 
      timestamp: Date.now() 
    }]);
  };

  // Calculate chart dimensions
  const minPrice = Math.min(support - 1000, ...priceHistory.map(p => p.price));
  const maxPrice = Math.max(resistance + 1000, ...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-lg p-6 border-2 border-indigo-500 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400">
            ⚡ SUPPORT OR RESISTANCE
          </h2>
          <p className="text-gray-300 text-sm">Break through or bounce back? • 2.0× payout</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Price</div>
          <div className={`text-2xl font-mono font-bold ${
            price > resistance ? 'text-red-400' : 
            price < support ? 'text-blue-400' : 
            'text-yellow-400'
          }`}>
            ${price.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Advanced Chart with Candles */}
      <div className="bg-black rounded-lg p-4 mb-4 border-2 border-indigo-700 relative overflow-hidden h-72">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        
        {/* Grid */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-gray-800/30" />
          ))}
        </div>

        {/* Resistance Zone */}
        <div 
          className="absolute left-0 right-0 h-8 bg-red-500/10 border-t-2 border-b border-red-500 border-dashed"
          style={{ 
            top: `${((maxPrice - resistance) / priceRange) * 100}%`,
          }}
        >
          <div className="flex items-center justify-between px-2 h-full">
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold">
              RESISTANCE ${resistance.toFixed(0)}
            </span>
            {breakoutDirection === 'up' && (
              <div className="flex items-center space-x-1">
                <div className="text-red-400 text-xl animate-bounce">🚀</div>
                <span className="text-red-400 text-sm font-bold">BREAKOUT!</span>
              </div>
            )}
          </div>
        </div>

        {/* Support Zone */}
        <div 
          className="absolute left-0 right-0 h-8 bg-blue-500/10 border-b-2 border-t border-blue-500 border-dashed"
          style={{ 
            top: `${((maxPrice - support) / priceRange) * 100}%`,
          }}
        >
          <div className="flex items-center justify-between px-2 h-full">
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-bold">
              SUPPORT ${support.toFixed(0)}
            </span>
            {breakoutDirection === 'down' && (
              <div className="flex items-center space-x-1">
                <div className="text-blue-400 text-xl animate-bounce">💥</div>
                <span className="text-blue-400 text-sm font-bold">BREAKDOWN!</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Line Chart */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 211, 238, 0.3)" />
              <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
            </linearGradient>
          </defs>
          
          {/* Area under line */}
          <path
            d={`M 0,${((maxPrice - priceHistory[0].price) / priceRange) * 288} ${priceHistory.map((point, i) => {
              const x = (i / (priceHistory.length - 1)) * 100;
              const y = ((maxPrice - point.price) / priceRange) * 288;
              return `L ${x}%,${y}`;
            }).join(' ')} L 100%,288 L 0,288 Z`}
            fill="url(#priceGradient)"
          />
          
          {/* Price line */}
          <path
            d={`M 0,${((maxPrice - priceHistory[0].price) / priceRange) * 288} ${priceHistory.map((point, i) => {
              const x = (i / (priceHistory.length - 1)) * 100;
              const y = ((maxPrice - point.price) / priceRange) * 288;
              return `L ${x}%,${y}`;
            }).join(' ')}`}
            fill="none"
            stroke={price > resistance ? '#f87171' : price < support ? '#60a5fa' : '#22d3ee'}
            strokeWidth="2"
            className={priceMoving ? 'animate-pulse' : ''}
          />
          
          {/* Current price dot */}
          <circle
            cx="100%"
            cy={`${((maxPrice - price) / priceRange) * 100}%`}
            r="5"
            fill={priceMoving ? '#fbbf24' : '#22d3ee'}
            className={priceMoving ? 'animate-ping' : ''}
          />
          <circle
            cx="100%"
            cy={`${((maxPrice - price) / priceRange) * 100}%`}
            r="3"
            fill="#fff"
          />
        </svg>

        {/* Tension overlay */}
        {priceMoving && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-500/10 to-yellow-500/5 animate-pulse" style={{ zIndex: 2 }} />
        )}
      </div>

      {/* Market pressure indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Buyer Pressure</span>
          <span>Seller Pressure</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ 
              width: `${((price - support) / (resistance - support)) * 100}%` 
            }}
          />
          <div 
            className="bg-gradient-to-r from-red-400 to-red-500 flex-1"
          />
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-3xl font-bold mb-4 p-4 rounded-lg ${
          result.includes('WON') 
            ? 'bg-green-500/20 text-green-400 border-2 border-green-500' 
            : result.includes('LOST')
            ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
            : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500'
        } animate-pulse`}>
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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-indigo-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Prediction:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-6 rounded-lg font-bold text-lg transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'break'
                    ? 'bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/50 border-2 border-red-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-red-600'
                }`}
                onClick={() => setPrediction('break')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-3xl mb-1">💥</div>
                  <div>BREAK</div>
                  <div className="text-xs text-red-200 mt-1">Smash through levels</div>
                </div>
              </button>
              <button
                className={`py-6 rounded-lg font-bold text-lg transition-all transform hover:scale-105 relative overflow-hidden ${
                  prediction === 'reject'
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/50 border-2 border-blue-400'
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-blue-600'
                }`}
                onClick={() => setPrediction('reject')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-3xl mb-1">🛡️</div>
                  <div>REJECT</div>
                  <div className="text-xs text-blue-200 mt-1">Bounce back</div>
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={placeBet}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/50"
          >
            🎯 PLACE BET ({stake} USDC)
          </button>
        </div>
      )}

      {priceMoving && (
        <div className="text-center space-y-2">
          <div className="text-yellow-400 font-bold text-xl animate-pulse">
            ⚡ Price is moving toward {price > (support + resistance) / 2 ? 'RESISTANCE' : 'SUPPORT'}...
          </div>
          <div className="text-sm text-gray-400">
            {prediction === 'break' ? 'Break through and win!' : 'Hold the level!'}
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 New Chart Setup
        </button>
      )}
    </div>
  );
};
