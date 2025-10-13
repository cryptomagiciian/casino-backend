import { useState, useEffect, useRef } from 'react';
import { apiService } from '../lib/api';
import { useWallet } from '../hooks/useWallet';

interface SlotSymbol {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const CRYPTO_SYMBOLS: SlotSymbol[] = [
  { id: 'btc', name: 'Bitcoin', emoji: '₿', color: 'text-orange-400' },
  { id: 'eth', name: 'Ethereum', emoji: '◈', color: 'text-blue-400' },
  { id: 'sol', name: 'Solana', emoji: '◎', color: 'text-purple-400' },
  { id: 'bnb', name: 'BNB', emoji: '◉', color: 'text-yellow-400' },
  { id: 'doge', name: 'Dogecoin', emoji: 'Ð', color: 'text-yellow-300' },
  { id: 'pepe', name: 'Pepe', emoji: '🐸', color: 'text-green-400' },
  { id: 'bonk', name: 'Bonk', emoji: '🦴', color: 'text-orange-300' },
  { id: 'wif', name: 'WIF', emoji: '🐕', color: 'text-pink-400' },
];

const SPECIAL_SYMBOLS: SlotSymbol[] = [
  { id: 'pump', name: 'Pump', emoji: '📈', color: 'text-green-500' },
  { id: 'dump', name: 'Dump', emoji: '📉', color: 'text-red-500' },
  { id: 'rug', name: 'Rug Pull', emoji: '💥', color: 'text-red-600' },
];

const ALL_SYMBOLS = [...CRYPTO_SYMBOLS, ...SPECIAL_SYMBOLS];

export function CryptoSlots() {
  const { balances, fetchBalances } = useWallet();
  const [stake, setStake] = useState('1.00');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [reels, setReels] = useState<SlotSymbol[][]>([
    [ALL_SYMBOLS[0], ALL_SYMBOLS[1], ALL_SYMBOLS[2], ALL_SYMBOLS[3], ALL_SYMBOLS[4]],
    [ALL_SYMBOLS[1], ALL_SYMBOLS[2], ALL_SYMBOLS[3], ALL_SYMBOLS[4], ALL_SYMBOLS[5]],
    [ALL_SYMBOLS[2], ALL_SYMBOLS[3], ALL_SYMBOLS[4], ALL_SYMBOLS[5], ALL_SYMBOLS[6]],
  ]);
  const [reelPositions, setReelPositions] = useState([0, 0, 0]);
  const [finalSymbols, setFinalSymbols] = useState<SlotSymbol[]>([ALL_SYMBOLS[0], ALL_SYMBOLS[1], ALL_SYMBOLS[2]]);
  const [showWinEffect, setShowWinEffect] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const generateReelStrip = (length = 50): SlotSymbol[] => {
    return Array.from({ length }, () => getRandomSymbol());
  };

  const calculatePayout = (symbols: SlotSymbol[]): { multiplier: number; message: string } => {
    // Check for Rug Pull
    if (symbols.some(s => s.id === 'rug')) {
      return { multiplier: 0, message: '💥 RUG PULL! You got rugged!' };
    }

    // Check for 3 Green Candles
    if (symbols.every(s => s.id === 'pump')) {
      return { multiplier: 5, message: '📈📈📈 TRIPLE PUMP! JACKPOT 5×!' };
    }

    // Check for 3 same coins
    if (symbols[0].id === symbols[1].id && symbols[1].id === symbols[2].id) {
      return { multiplier: 3, message: `${symbols[0].emoji}${symbols[0].emoji}${symbols[0].emoji} TRIPLE ${symbols[0].name.toUpperCase()}! 3× WIN!` };
    }

    // Check for any 2 matching
    const counts = new Map<string, number>();
    symbols.forEach(s => counts.set(s.id, (counts.get(s.id) || 0) + 1));
    if (Array.from(counts.values()).some(c => c >= 2)) {
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

      const bet = await apiService.placeBet({
        game: 'candle_flip',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: {},
      });

      // Generate final outcome
      const outcome: SlotSymbol[] = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol(),
      ];

      // Generate reel strips for animation
      const reel1Strip = generateReelStrip(50);
      const reel2Strip = generateReelStrip(50);
      const reel3Strip = generateReelStrip(50);

      // Place outcome at the end
      reel1Strip[reel1Strip.length - 3] = outcome[0];
      reel2Strip[reel2Strip.length - 3] = outcome[1];
      reel3Strip[reel3Strip.length - 3] = outcome[2];

      setReels([reel1Strip, reel2Strip, reel3Strip]);

      // Spin each reel with easing
      const spinReel = (reelIndex: number, duration: number) => {
        return new Promise<void>((resolve) => {
          const startTime = Date.now();
          const targetPosition = reel1Strip.length - 3;

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const position = Math.floor(easeProgress * targetPosition);

            setReelPositions(prev => {
              const newPos = [...prev];
              newPos[reelIndex] = position;
              return newPos;
            });

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };

          animate();
        });
      };

      // Stagger reel stops
      await spinReel(0, 1500);
      await spinReel(1, 2000);
      await spinReel(2, 2500);

      setFinalSymbols(outcome);

      // Calculate result
      const { multiplier, message } = calculatePayout(outcome);

      // Resolve bet
      await apiService.resolveBet(bet.id);
      await fetchBalances();

      setResult(message);
      
      if (multiplier > 0) {
        setShowWinEffect(true);
        setTimeout(() => setShowWinEffect(false), 3000);
      }

      setIsSpinning(false);
    } catch (error) {
      console.error('Spin failed:', error);
      setResult('❌ Spin failed: ' + (error as Error).message);
      setIsSpinning(false);
    }
  };

  const reset = () => {
    setResult(null);
    setShowWinEffect(false);
    setReelPositions([0, 0, 0]);
  };

  const renderSymbol = (symbol: SlotSymbol) => (
    <div className={`text-6xl ${symbol.color} filter drop-shadow-lg`}>
      {symbol.emoji}
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-[#040B14] via-[#0A1628] to-[#0F2233] rounded-lg p-8 border-2 border-cyan-500/30 shadow-2xl relative overflow-hidden">
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
            <p className="text-gray-400 text-sm mt-1">Spin the Market • Premium Edition</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Balance</div>
            <div className="text-2xl font-bold text-cyan-400">
              {balances.find(b => b.currency === 'USDC')?.balance || '0.00'} USDC
            </div>
          </div>
        </div>

        {/* Mini crypto ticker */}
        <div className="bg-black/40 rounded-lg p-3 mb-6 border border-cyan-500/20 overflow-hidden">
          <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
            {CRYPTO_SYMBOLS.map((sym, i) => (
              <span key={i} className={`${sym.color} font-mono text-sm`}>
                {sym.emoji} {sym.name} ${(10000 + Math.random() * 50000).toFixed(2)}
              </span>
            ))}
          </div>
        </div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-8 mb-6 border-4 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-cyan-600/10 rounded-2xl pointer-events-none" />
          
          <div className="flex justify-center gap-4 mb-6">
            {/* Reels */}
            {[0, 1, 2].map((reelIdx) => (
              <div
                key={reelIdx}
                className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border-4 border-cyan-500/50 shadow-inner overflow-hidden relative w-32 h-40"
                style={{
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), inset 0 0 20px rgba(0,0,0,0.8)',
                }}
              >
                {/* Neon glow effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent pointer-events-none z-10" />
                
                <div
                  className={`flex flex-col items-center justify-start transition-transform ${
                    isSpinning ? 'duration-0' : 'duration-500 ease-out'
                  }`}
                  style={{
                    transform: `translateY(-${reelPositions[reelIdx] * 80}px)`,
                  }}
                >
                  {reels[reelIdx]?.map((symbol, idx) => (
                    <div
                      key={idx}
                      className="h-20 w-full flex items-center justify-center border-b border-gray-700/30"
                    >
                      {renderSymbol(symbol)}
                    </div>
                  ))}
                </div>
                
                {/* Center line indicator */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400/50 transform -translate-y-1/2 z-20 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Payout lines indicator */}
          <div className="text-center text-xs text-cyan-400 mb-2">
            💎 3 Pumps = 5× | 🪙 3 Same = 3× | 🎲 Double = 1.5× | 💥 Rug = LOSS
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
                Stake (USDC):
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
              Watch the reels carefully...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

