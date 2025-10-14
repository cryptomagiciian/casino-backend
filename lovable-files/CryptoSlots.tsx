import { useState, useEffect, useRef } from 'react';
import { apiService } from '../lib/api';
import { useWallet } from '../hooks/useWallet';
import { useBalance } from './BalanceContext';
import { WalletBalance } from './WalletBalance';

interface SlotSymbol {
  id: string;
  name: string;
  logo: string; // SVG logo element
  color: string;
}

const CRYPTO_SYMBOLS: SlotSymbol[] = [
  { 
    id: 'btc', 
    name: 'Bitcoin', 
    logo: '₿',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    id: 'eth', 
    name: 'Ethereum', 
    logo: '◈',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'sol', 
    name: 'Solana', 
    logo: '◎',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    id: 'bnb', 
    name: 'BNB', 
    logo: '◉',
    color: 'from-yellow-500 to-yellow-600'
  },
  { 
    id: 'doge', 
    name: 'Dogecoin', 
    logo: 'Ð',
    color: 'from-yellow-400 to-yellow-500'
  },
  { 
    id: 'pepe', 
    name: 'Pepe', 
    logo: '🐸',
    color: 'from-green-500 to-green-600'
  },
  { 
    id: 'bonk', 
    name: 'Bonk', 
    logo: '🦴',
    color: 'from-orange-400 to-orange-500'
  },
  { 
    id: 'wif', 
    name: 'WIF', 
    logo: '🐕',
    color: 'from-pink-500 to-pink-600'
  },
];

const SPECIAL_SYMBOLS: SlotSymbol[] = [
  { 
    id: 'pump', 
    name: 'Pump', 
    logo: '📈',
    color: 'from-green-400 to-green-500'
  },
  { 
    id: 'dump', 
    name: 'Dump', 
    logo: '📉',
    color: 'from-red-400 to-red-500'
  },
  { 
    id: 'rug', 
    name: 'Rug Pull', 
    logo: '💥',
    color: 'from-red-600 to-red-700'
  },
];

const ALL_SYMBOLS = [...CRYPTO_SYMBOLS, ...SPECIAL_SYMBOLS];

export function CryptoSlots() {
  const { balances, fetchBalances } = useWallet();
  const [stake, setStake] = useState('1.00');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [grid, setGrid] = useState<SlotSymbol[][]>([
    [ALL_SYMBOLS[0], ALL_SYMBOLS[1], ALL_SYMBOLS[2]],
    [ALL_SYMBOLS[3], ALL_SYMBOLS[4], ALL_SYMBOLS[5]],
    [ALL_SYMBOLS[6], ALL_SYMBOLS[7], ALL_SYMBOLS[0]],
  ]);
  const [finalGrid, setFinalGrid] = useState<SlotSymbol[][]>([]);
  const [showWinEffect, setShowWinEffect] = useState(false);
  const [spinOffsets, setSpinOffsets] = useState<number[][]>([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh balance when network or currency changes
  useEffect(() => {
    refreshBalance();
  }, [network, bettingCurrency]);

  // Sync with global balance changes
  useEffect(() => {
    const currentBalance = getAvailableBalance(bettingCurrency);
    setBalance(currentBalance);
  }, [bettingCurrency]); // Remove getAvailableBalance from dependencies to prevent render loop

  const refreshBalance = async () => {
    try {
      // Use global balance context for immediate balance access
      const currentBalance = getAvailableBalance(bettingCurrency);
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getRandomSymbol = (): SlotSymbol => {
    // 70% chance crypto, 20% pump/dump, 10% rug
    const rand = Math.random();
    if (rand < 0.7) {
      return CRYPTO_SYMBOLS[Math.floor(Math.random() * CRYPTO_SYMBOLS.length)];
    } else if (rand < 0.9) {
      return SPECIAL_SYMBOLS[Math.random() < 0.5 ? 0 : 1]; // Pump or Dump
    } else {
      return SPECIAL_SYMBOLS[2]; // Rug Pull
    }
  };

  const calculatePayout = (resultGrid: SlotSymbol[][]): { multiplier: number; message: string } => {
    // Flatten grid for easier checking
    const flat = resultGrid.flat();

    // Check for Rug Pull
    if (flat.some(s => s.id === 'rug')) {
      return { multiplier: 0, message: '💥 RUG PULL! You got rugged!' };
    }

    // Check all rows
    for (let row of resultGrid) {
      // 3 Green Candles
      if (row.every(s => s.id === 'pump')) {
        return { multiplier: 5, message: '📈📈📈 TRIPLE PUMP! JACKPOT 5×!' };
      }
      // 3 same coins
      if (row[0].id === row[1].id && row[1].id === row[2].id && CRYPTO_SYMBOLS.some(c => c.id === row[0].id)) {
        return { multiplier: 3, message: `${row[0].logo}${row[0].logo}${row[0].logo} TRIPLE ${row[0].name.toUpperCase()}! 3× WIN!` };
      }
    }

    // Check all columns
    for (let col = 0; col < 3; col++) {
      const column = [resultGrid[0][col], resultGrid[1][col], resultGrid[2][col]];
      // 3 Green Candles
      if (column.every(s => s.id === 'pump')) {
        return { multiplier: 5, message: '📈📈📈 TRIPLE PUMP! JACKPOT 5×!' };
      }
      // 3 same coins
      if (column[0].id === column[1].id && column[1].id === column[2].id && CRYPTO_SYMBOLS.some(c => c.id === column[0].id)) {
        return { multiplier: 3, message: `${column[0].logo}${column[0].logo}${column[0].logo} TRIPLE ${column[0].name.toUpperCase()}! 3× WIN!` };
      }
    }

    // Check diagonals
    const diag1 = [resultGrid[0][0], resultGrid[1][1], resultGrid[2][2]];
    const diag2 = [resultGrid[0][2], resultGrid[1][1], resultGrid[2][0]];

    for (let diag of [diag1, diag2]) {
      if (diag.every(s => s.id === 'pump')) {
        return { multiplier: 5, message: '📈📈📈 TRIPLE PUMP! JACKPOT 5×!' };
      }
      if (diag[0].id === diag[1].id && diag[1].id === diag[2].id && CRYPTO_SYMBOLS.some(c => c.id === diag[0].id)) {
        return { multiplier: 3, message: `${diag[0].logo}${diag[0].logo}${diag[0].logo} TRIPLE ${diag[0].name.toUpperCase()}! 3× WIN!` };
      }
    }

    // Check for any 2 matching in a line
    const countMatches = (arr: SlotSymbol[]) => {
      const counts = new Map<string, number>();
      arr.forEach(s => counts.set(s.id, (counts.get(s.id) || 0) + 1));
      return Array.from(counts.values()).some(c => c >= 2);
    };

    if (countMatches(flat)) {
      return { multiplier: 1.5, message: '🎰 DOUBLE MATCH! 1.5× WIN!' };
    }

    // No match
    return { multiplier: 0, message: '❌ NO MATCH - Try again!' };
  };

  const spin = async () => {
    if (isSpinning) return;

    try {
      setIsSpinning(true);
      setResult(null);
      setShowWinEffect(false);

      // Check if user has sufficient balance
    if (balance < parseFloat(stake)) {
      setResult('❌ Insufficient balance!');
      setIsPlaying(false);
      return;
    }

    const bet = await placeBet({
        game: 'candle_flip',
        currency: '{displayCurrency === 'usd' ? 'USD' : bettingCurrency}',
        stake,
        clientSeed: Math.random().toString(36),
        params: {},
      });

      // Generate random outcome grid
      const outcome: SlotSymbol[][] = [
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ];

      setFinalGrid(outcome);

      // Animate spinning for each cell
      const spinDuration = 2000; // 2 seconds
      let elapsed = 0;

      intervalRef.current = setInterval(() => {
        elapsed += 50;

        // Update grid with random symbols while spinning
        setGrid([
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        ]);

        if (elapsed >= spinDuration) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Set final grid
          setGrid(outcome);

          // Calculate result
          const { multiplier, message } = calculatePayout(outcome);

          // Resolve bet
          resolveBet(bet.id)
            .then(async () => {
              await refreshBalance();
              setResult(message);
              
              if (multiplier > 0) {
                setShowWinEffect(true);
                setTimeout(() => setShowWinEffect(false), 3000);
              }

              setIsSpinning(false);
            })
            .catch(async (error) => {
              console.error('Bet resolution failed:', error);
              await refreshBalance();
              setResult('❌ Spin failed: ' + error.message);
              setIsSpinning(false);
            });
        }
      }, 50);

    } catch (error) {
      console.error('Spin failed:', error);
      setResult('❌ Spin failed: ' + (error as Error).message);
      setIsSpinning(false);
    }
  };

  const reset = () => {
    setResult(null);
    setShowWinEffect(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#040B14] via-[#0A1628] to-[#0F2233] rounded-lg p-8 border-2 border-cyan-500/30 shadow-2xl relative overflow-hidden">
      <WalletBalance position="top-right" />
      {/* Balance Display */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Balance:</span>
          <span className="font-mono font-bold text-green-400">
            {formatBalance(balance, bettingCurrency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>Network: {network}</span>
          <span>Currency: {bettingCurrency}</span>
        </div>
      </div>
      
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-purple-500/5 animate-pulse pointer-events-none" />
      
      {/* Confetti effect on win */}
      {showWinEffect && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              🎰 CRYPTO SLOTS
            </h2>
            <p className="text-gray-400 text-sm mt-1">Spin the Market • 3x3 Premium Edition</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Balance</div>
            <div className="text-2xl font-bold text-cyan-400">
              {balances.find(b => b.currency === '{displayCurrency === 'usd' ? 'USD' : bettingCurrency}')?.balance || '0.00'} {displayCurrency === 'usd' ? 'USD' : bettingCurrency}
            </div>
          </div>
        </div>

        {/* 3x3 Slot Grid */}
        <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-8 mb-6 border-4 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-cyan-600/10 rounded-2xl pointer-events-none" />
          
          <div className="grid grid-cols-3 gap-3">
            {grid.map((row, rowIdx) => (
              row.map((symbol, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`bg-gradient-to-br ${symbol.color} rounded-xl border-4 border-cyan-500/50 shadow-inner overflow-hidden relative aspect-square flex items-center justify-center transition-all ${
                    isSpinning ? 'animate-pulse' : ''
                  }`}
                  style={{
                    boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), inset 0 0 20px rgba(0,0,0,0.8)',
                  }}
                >
                  {/* Neon glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  
                  <div className="text-7xl filter drop-shadow-2xl">
                    {symbol.logo}
                  </div>
                </div>
              ))
            ))}
          </div>

          {/* Win lines indicator */}
          <div className="text-center text-xs text-cyan-400 mt-4">
            💎 Row/Column/Diagonal • 3 Pumps = 5× | 3 Same = 3× | 2 Match = 1.5× | Rug = LOSS
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center text-2xl font-bold mb-4 p-6 rounded-xl border-4 relative overflow-hidden ${
            result.includes('JACKPOT') || result.includes('WIN') || result.includes('TRIPLE')
              ? 'bg-gradient-to-r from-green-500/30 to-cyan-500/30 text-green-400 border-green-500 animate-pulse'
              : result.includes('RUG') || result.includes('NO MATCH')
              ? 'bg-red-500/30 text-red-400 border-red-500'
              : 'bg-yellow-500/30 text-yellow-400 border-yellow-500'
          } shadow-2xl`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <div className="relative">{result}</div>
          </div>
        )}

        {/* Controls */}
        {!isSpinning && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Stake ({displayCurrency === 'usd' ? 'USD' : bettingCurrency}):
              </label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full px-4 py-3 bg-gray-900 border-2 border-cyan-500/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-lg"
              />
            </div>

            <button
              onClick={result ? reset : spin}
              className="w-full py-5 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-2xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              <span className="relative">
                {result ? '🔄 SPIN AGAIN' : '🎰 SPIN THE MARKET'}
              </span>
            </button>

            <div className="text-center text-xs text-gray-500">
              ⚡ Provably Fair • Powered by Crypto Volatility
            </div>
          </div>
        )}

        {isSpinning && (
          <div className="text-center space-y-3 bg-gray-900/50 rounded-lg p-6 border-2 border-cyan-500/30">
            <div className="text-cyan-400 text-xl font-bold animate-pulse">
              🎰 SPINNING THE MARKET...
            </div>
            <div className="text-gray-400 text-sm">
              Watch the 3x3 grid carefully...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
