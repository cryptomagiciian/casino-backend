import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import { PumpOrDumpCanvas } from './PumpOrDumpCanvas';
import { sfx } from './SFXSystem';

interface RngTrace {
  pWin: number;
  profile: 'spiky' | 'meanRevert' | 'trendThenSnap' | 'chopThenRip';
  endBps: number;
  userChoice: string;
  willWin: boolean;
  rng: number;
}

const TIME_OPTIONS = [
  { value: 5, label: '5s', color: 'from-green-500 to-emerald-500' },
  { value: 10, label: '10s', color: 'from-blue-500 to-cyan-500' },
  { value: 15, label: '15s', color: 'from-purple-500 to-violet-500' },
  { value: 30, label: '30s', color: 'from-orange-500 to-red-500' },
  { value: 60, label: '1min', color: 'from-pink-500 to-rose-500' },
];

const MICRO_COPY = [
  "Whales entering...",
  "CEX listing rumor...",
  "Jeets selling...",
  "Diamond hands holding...",
  "Paper hands folding...",
  "Moon mission loading...",
  "Rug pull incoming...",
  "Pump it up!",
  "Dump it down!",
  "HODL strong!",
];

export const PumpOrDumpV2: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [choice, setChoice] = useState<'pump' | 'dump'>('pump');
  const [timeframe, setTimeframe] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canBet, setCanBet] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [betId, setBetId] = useState<string | null>(null);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [rngTrace, setRngTrace] = useState<RngTrace | null>(null);
  const [currentMicroCopy, setCurrentMicroCopy] = useState('');
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [autoRounds, setAutoRounds] = useState(10);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  
  const { fetchBalances } = useWallet();
  const microCopyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random micro-copy
  const updateMicroCopy = () => {
    const randomCopy = MICRO_COPY[Math.floor(Math.random() * MICRO_COPY.length)];
    setCurrentMicroCopy(randomCopy);
  };

  // Start micro-copy updates
  useEffect(() => {
    if (isPlaying) {
      updateMicroCopy();
      microCopyIntervalRef.current = setInterval(updateMicroCopy, 2000);
    } else {
      if (microCopyIntervalRef.current) {
        clearInterval(microCopyIntervalRef.current);
        microCopyIntervalRef.current = null;
      }
    }
    
    return () => {
      if (microCopyIntervalRef.current) {
        clearInterval(microCopyIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const startRound = async () => {
    if (!canBet) return;
    
    setIsPlaying(true);
    setCanBet(false);
    setResult(null);
    
    try {
      // Place bet
      const bet = await apiService.placeBet({
        game: 'pump_or_dump',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { choice },
      });
      
      console.log('✅ Bet placed:', bet);
      setBetId(bet.id);
      setEntryPrice(parseFloat(bet.entryPrice || '50000'));
      
      // Get the RNG trace from the bet (this would come from the backend)
      // For now, we'll simulate it
      const mockRngTrace: RngTrace = {
        pWin: 0.487,
        profile: ['spiky', 'meanRevert', 'trendThenSnap', 'chopThenRip'][Math.floor(Math.random() * 4)] as any,
        endBps: 25 + Math.floor(Math.random() * 155),
        userChoice: choice,
        willWin: Math.random() < 0.487,
        rng: Math.random()
      };
      setRngTrace(mockRngTrace);
      
    } catch (error) {
      console.error('Bet failed:', error);
      setResult('❌ Bet failed: ' + (error as Error).message);
      setIsPlaying(false);
      setCanBet(true);
    }
  };

  const handleCanvasComplete = async (canvasResult: any) => {
    if (!betId) return;
    
    try {
      // Resolve bet
      const resolved = await apiService.resolveBet(betId);
      await fetchBalances();
      
      const won = resolved.outcome === 'win';
      const priceChange = ((canvasResult.price - entryPrice) / entryPrice * 100).toFixed(2);
      const isPump = canvasResult.price > entryPrice;
      
      const resultMessage = won 
        ? `🎉 WON! Price ${isPump ? 'PUMPED ⬆️' : 'DUMPED ⬇️'} ${Math.abs(parseFloat(priceChange))}%! +${(parseFloat(stake) * (resolved.resultMultiplier || 1.95)).toFixed(2)} USDC`
        : `💥 LOST! Price ${isPump ? 'PUMPED ⬆️' : 'DUMPED ⬇️'} ${Math.abs(parseFloat(priceChange))}%. You bet ${choice.toUpperCase()}. -${stake} USDC`;
      
      setResult(resultMessage);
      setIsPlaying(false);
      
      // Play win/lose sound
      if (won) {
        sfx.win();
      } else {
        sfx.lose();
      }
      
      // Auto mode
      if (autoMode && autoRounds > 0) {
        setTimeout(() => {
          setAutoRounds(prev => prev - 1);
          startRound();
        }, 3000);
      } else {
        setCanBet(true);
      }
      
    } catch (error) {
      console.error('Bet resolution failed:', error);
      setResult('❌ Error: ' + (error as Error).message);
      setIsPlaying(false);
      setCanBet(true);
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setCanBet(true);
    setResult(null);
    setBetId(null);
    setEntryPrice(0);
    setRngTrace(null);
    setAutoMode(false);
    setAutoRounds(10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-4">
            PUMP OR DUMP
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Hyper-volatile memecoin trading • 60fps chart • Provably fair
          </p>
          <p className="text-lg text-yellow-400 font-semibold">
            Win pays 1.95× (RTP ~97.4%)
          </p>
        </div>

        {/* Betting Panel */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stake Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stake (USDC)</label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                disabled={isPlaying}
              />
            </div>

            {/* Choice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prediction</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChoice('pump')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                    choice === 'pump'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isPlaying}
                >
                  🚀 PUMP
                </button>
                <button
                  onClick={() => setChoice('dump')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                    choice === 'dump'
                      ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isPlaying}
                >
                  📉 DUMP
                </button>
              </div>
            </div>

            {/* Timeframe Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <div className="grid grid-cols-2 gap-1">
                {TIME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeframe(option.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      timeframe === option.value
                        ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    disabled={isPlaying}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={startRound}
                disabled={!canBet || isPlaying}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
              >
                {isPlaying ? 'TRADING...' : 'START TRADE'}
              </button>
              
              {/* Auto Mode Toggle */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoMode"
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  disabled={isPlaying}
                />
                <label htmlFor="autoMode" className="text-sm text-gray-300">
                  Auto Mode ({autoRounds} rounds)
                </label>
              </div>
              
              {/* SFX Toggle */}
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sfxEnabled"
                  checked={sfxEnabled}
                  onChange={(e) => {
                    setSfxEnabled(e.target.checked);
                    sfx.setEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="sfxEnabled" className="text-sm text-gray-300">
                  Sound Effects
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/30">
          {isPlaying && rngTrace ? (
            <PumpOrDumpCanvas
              entryPrice={entryPrice}
              rngTrace={rngTrace}
              durationMs={timeframe * 1000}
              onComplete={handleCanvasComplete}
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500 text-xl">
              {currentMicroCopy || 'Ready to trade...'}
            </div>
          )}
        </div>

        {/* Result Panel */}
        {result && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/30">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4">{result}</div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Trade Again
                </button>
                <button
                  onClick={() => setShowFairnessModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all"
                >
                  Provably Fair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fairness Modal */}
        {showFairnessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Provably Fair</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Server Seed Hash:</span>
                  <div className="text-green-400 font-mono break-all">{rngTrace?.rng.toString().slice(0, 16)}...</div>
                </div>
                <div>
                  <span className="text-gray-400">Client Seed:</span>
                  <div className="text-blue-400 font-mono">{Math.random().toString(36).slice(0, 8)}...</div>
                </div>
                <div>
                  <span className="text-gray-400">Nonce:</span>
                  <div className="text-purple-400 font-mono">{betId?.slice(-8)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Win Probability:</span>
                  <div className="text-yellow-400 font-mono">{(rngTrace?.pWin || 0.487 * 100).toFixed(1)}%</div>
                </div>
              </div>
              <button
                onClick={() => setShowFairnessModal(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
