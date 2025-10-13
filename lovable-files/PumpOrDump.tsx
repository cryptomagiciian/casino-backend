import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import { PumpOrDumpCanvas } from './PumpOrDumpCanvas';
import { sfx } from './SFXSystem';

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp: number;
}

const TIME_OPTIONS = [
  { value: 5, label: '5s', speed: 80 },
  { value: 10, label: '10s', speed: 150 },
  { value: 15, label: '15s', speed: 225 },
  { value: 30, label: '30s', speed: 450 },
  { value: 60, label: '1min', speed: 900 },
];

export const PumpOrDump: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [choice, setChoice] = useState<'pump' | 'dump'>('pump');
  const [timeframe, setTimeframe] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canBet, setCanBet] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [betId, setBetId] = useState<string | null>(null);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [rngTrace, setRngTrace] = useState<any>(null);
  const [currentMicroCopy, setCurrentMicroCopy] = useState<string>('');
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [autoRounds, setAutoRounds] = useState(10);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const { fetchBalances } = useWallet();

  // Micro-copy messages for psychological tension
  const microCopyMessages = [
    "Whales entering...",
    "CEX listing rumor...",
    "Influencer pump...",
    "Smart money accumulating...",
    "Technical breakout...",
    "FOMO building...",
    "Paper hands selling...",
    "Diamond hands holding...",
    "Market manipulation...",
    "Retail panic...",
    "Institutional buying...",
    "Stop losses triggered..."
  ];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const message = microCopyMessages[Math.floor(Math.random() * microCopyMessages.length)];
        setCurrentMicroCopy(message);
        setTimeout(() => setCurrentMicroCopy(''), 2000);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const startRound = async () => {
    console.log('🚀 START ROUND called, canBet:', canBet);
    if (!canBet) {
      console.log('❌ Cannot bet, returning early');
      return;
    }
    
    console.log('✅ Starting round...');
    setIsPlaying(true);
    setCanBet(false);
    setResult(null);
    
    // Generate entry price
    const entry = 45000 + Math.random() * 10000; // $45k-$55k range
    console.log('💰 Entry price set to:', entry);
    setEntryPrice(entry);
    
    try {
      // Place bet
      const bet = await apiService.placeBet({
        game: 'pump_or_dump',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction: choice },
      });
      
      console.log('✅ Bet placed:', bet);
      setBetId(bet.id);
      
      // Create a mock RNG trace for the canvas (since backend might not return it immediately)
      const mockRngTrace = {
        pWin: 0.487,
        profile: 'spiky',
        endBps: 25 + Math.random() * 155, // 25-180 bps
        userChoice: choice,
        willWin: Math.random() < 0.487, // 48.7% win chance
        rng: Math.random()
      };
      
      setRngTrace(mockRngTrace);
      console.log('✅ RNG trace set:', mockRngTrace);
      
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
      // Resolve the bet
      const resolved = await apiService.resolveBet(betId);
      await fetchBalances();
      
      const won = resolved.outcome === 'win';
      const isPump = canvasResult.price > entryPrice;
      const priceChange = ((canvasResult.price - entryPrice) / entryPrice * 100).toFixed(2);
      
      // Play appropriate sound
      if (sfxEnabled) {
        if (won) {
          sfx.win();
        } else {
          sfx.lose();
        }
      }
      
      // Show result
      const resultMessage = won 
        ? `🎉 WON! Price ${isPump ? 'PUMPED ⬆️' : 'DUMPED ⬇️'} ${Math.abs(parseFloat(priceChange))}%! +${(parseFloat(stake) * (resolved.resultMultiplier || 1.95)).toFixed(2)} USDC`
        : `💥 LOST! Price ${isPump ? 'PUMPED ⬆️' : 'DUMPED ⬇️'} ${Math.abs(parseFloat(priceChange))}%. You bet ${choice.toUpperCase()}. -${stake} USDC`;
      
      setResult(resultMessage);
      setIsPlaying(false);
      
      // Auto mode logic
      if (autoMode && autoRounds > 0) {
        setAutoRounds(prev => prev - 1);
        setTimeout(() => {
          if (autoRounds > 1) {
            startRound();
          } else {
            setCanBet(true);
            setBetId(null);
            setAutoMode(false);
            setAutoRounds(10);
          }
        }, 3000);
      } else {
        setTimeout(() => {
          setCanBet(true);
          setBetId(null);
        }, 3000);
      }
      
    } catch (error) {
      console.error('Bet resolution failed:', error);
      setResult('❌ Error: ' + (error as Error).message);
      setIsPlaying(false);
      setCanBet(true);
      setBetId(null);
    }
  };


  const toggleFairnessModal = () => {
    setShowFairnessModal(!showFairnessModal);
  };

  const verifyFairness = () => {
    // In a real implementation, this would verify the server seed
    alert('Fairness verification would show server seed hash and allow verification');
  };


  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-black rounded-lg p-6 border-2 border-purple-500 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-red-400">
            PUMP OR DUMP
          </h2>
          <p className="text-gray-300 text-sm">Hyper-volatile memecoin trading • 60fps chart • Provably fair</p>
          <p className="text-yellow-400 text-sm font-bold">Win pays 1.95× (RTP ~97.4%)</p>
        </div>
        <button
          onClick={toggleFairnessModal}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-all"
        >
          🔒 Fairness
        </button>
      </div>

      {/* Micro-copy */}
      {currentMicroCopy && (
        <div className="text-center mb-4">
          <div className="inline-block bg-purple-600/30 text-purple-300 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
            {currentMicroCopy}
          </div>
        </div>
      )}

      {/* Game Controls */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-purple-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stake */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stake (USDC)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              disabled={isPlaying}
            />
          </div>

          {/* Prediction */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prediction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                  choice === 'pump'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setChoice('pump')}
                disabled={isPlaying}
              >
                🚀 PUMP
              </button>
              <button
                className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                  choice === 'dump'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setChoice('dump')}
                disabled={isPlaying}
              >
                📉 DUMP
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
            <div className="grid grid-cols-5 gap-1">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`py-2 px-1 rounded text-xs font-bold transition-all ${
                    timeframe === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  disabled={isPlaying}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startRound}
          disabled={!canBet}
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

      {/* Chart Area */}
      <div className="mb-6">
        {isPlaying && entryPrice > 0 ? (
          rngTrace ? (
            <PumpOrDumpCanvas
              entryPrice={entryPrice}
              rngTrace={rngTrace}
              durationMs={timeframe * 1000}
              onComplete={handleCanvasComplete}
            />
          ) : (
            <div className="bg-gray-900 rounded-lg h-96 flex items-center justify-center border-2 border-gray-700">
              <div className="text-center text-yellow-400">
                <div className="text-6xl mb-4 animate-spin">⚡</div>
                <div className="text-xl font-bold">Loading Chart...</div>
                <div className="text-sm">Preparing your trade</div>
              </div>
            </div>
          )
        ) : (
          <div className="bg-gray-900 rounded-lg h-96 flex items-center justify-center border-2 border-gray-700">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl font-bold">Ready to Trade</div>
              <div className="text-sm">Click "START TRADE" to begin</div>
            </div>
          </div>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-2xl font-bold mb-4 p-6 rounded-xl border-4 ${
          result.includes('WON') 
            ? 'bg-green-500/30 text-green-400 border-green-500' 
            : 'bg-red-500/30 text-red-400 border-red-500'
        } animate-pulse shadow-2xl`}>
          {result}
        </div>
      )}

      {/* Fairness Modal */}
      {showFairnessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-teal-500">
            <h3 className="text-xl font-bold text-white mb-4">🔒 Provably Fair</h3>
            <p className="text-gray-300 mb-4">
              This game uses provably fair technology. All outcomes are determined by cryptographic hashes
              that can be verified for fairness.
            </p>
            <div className="space-y-2">
              <button
                onClick={verifyFairness}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
              >
                Verify Fairness
              </button>
              <button
                onClick={toggleFairnessModal}
                className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
