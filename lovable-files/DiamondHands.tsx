import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

type TileState = 'hidden' | 'safe' | 'mine';

interface DifficultyOption {
  mines: number;
  name: string;
  color: string;
  baseMultiplier: number;
  description: string;
}

const DIFFICULTIES: DifficultyOption[] = [
  { mines: 1, name: 'Super Easy', color: 'from-blue-600 to-blue-500', baseMultiplier: 1.08, description: 'Very Low Risk - Low Rewards' },
  { mines: 5, name: 'Easy', color: 'from-green-600 to-green-500', baseMultiplier: 1.15, description: 'Lower Risk' },
  { mines: 8, name: 'Medium', color: 'from-yellow-600 to-yellow-500', baseMultiplier: 1.25, description: 'Medium Risk' },
  { mines: 12, name: 'Hard', color: 'from-orange-600 to-orange-500', baseMultiplier: 1.4, description: 'High Risk' },
  { mines: 15, name: 'Extreme', color: 'from-red-600 to-red-500', baseMultiplier: 1.6, description: 'Very High Risk' },
  { mines: 18, name: 'Insane', color: 'from-purple-600 to-purple-500', baseMultiplier: 1.9, description: 'Extreme Risk - Max Rewards' },
];

export const DiamondHands: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [difficulty, setDifficulty] = useState<DifficultyOption>(DIFFICULTIES[0]); // Default: Super Easy
  const [isPlaying, setIsPlaying] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [grid, setGrid] = useState<TileState[]>(Array(TOTAL_TILES).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [safeCount, setSafeCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [result, setResult] = useState<string | null>(null);
  const { fetchBalances } = useWallet();

  const calculateMultiplier = (safePicks: number) => {
    // Exponential growth based on difficulty with scaled max cap
    const base = difficulty.baseMultiplier;
    const mult = Math.pow(base, safePicks);
    
    // HOUSE EDGE: Max payout scales with risk level
    const maxPayouts: { [key: number]: number } = {
      1: 5,     // Super Easy: max 5x (very low)
      5: 10,    // Easy: max 10x
      8: 20,    // Medium: max 20x
      12: 40,   // Hard: max 40x
      15: 75,   // Extreme: max 75x
      18: 150,  // Insane: max 150x (highest risk, highest reward)
    };
    
    const maxPayout = maxPayouts[difficulty.mines] || 25;
    return Math.min(mult, maxPayout);
  };

  const getPotentialWin = () => {
    const currentMultiplier = calculateMultiplier(safeCount);
    const stakeAmount = parseFloat(stake) || 0;
    return (stakeAmount * currentMultiplier).toFixed(2);
  };

  const getMaxPossibleMultiplier = () => {
    return calculateMultiplier(TOTAL_TILES - difficulty.mines).toFixed(2);
  };

  const startGame = async () => {
    try {
      setIsPlaying(true);
      setResult(null);
      setGrid(Array(TOTAL_TILES).fill('hidden'));
      setSafeCount(0);
      setMultiplier(1.0);

      // Generate random mine positions
      const mines: number[] = [];
      while (mines.length < difficulty.mines) {
        const pos = Math.floor(Math.random() * TOTAL_TILES);
        if (!mines.includes(pos)) mines.push(pos);
      }
      setMinePositions(mines);

      const bet = await apiService.placeBet({
        game: 'diamond_hands',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { mineCount: difficulty.mines },
      });

      setBetId(bet.id);
    } catch (error) {
      console.error('Failed to start game:', error);
      setResult('❌ Failed to start: ' + (error as Error).message);
      setIsPlaying(false);
    }
  };

  const revealTile = (index: number) => {
    if (!isPlaying || grid[index] !== 'hidden' || result) return;

    // HOUSE EDGE: Weighted mine probability (gets harder each click)
    const getMineProbability = () => {
      if (safeCount < 3) return 0.20;      // Easy start (20%)
      if (safeCount < 6) return 0.40;      // Gets harder (40%)
      if (safeCount < 10) return 0.65;     // Very hard (65%)
      return 0.85;                         // Almost impossible (85%)
    };
    
    const mineProb = getMineProbability();
    const hitMine = Math.random() < mineProb || minePositions.includes(index);

    const newGrid = [...grid];
    
    if (hitMine) {
      // Hit a mine!
      newGrid[index] = 'mine';
      setGrid(newGrid);
      setResult(`💣 BOOM! Hit mine after ${safeCount} safe picks. Lost ${stake} USDC!`);
      setIsPlaying(false);

      // Reveal all mines
      setTimeout(() => {
        const finalGrid = newGrid.map((tile, i) => 
          minePositions.includes(i) ? 'mine' : tile
        );
        setGrid(finalGrid);
      }, 500);

      // Resolve bet as loss
      if (betId) {
        apiService.resolveBet(betId).then(() => fetchBalances()).catch(err => {
          console.error('Bet resolution failed:', err);
        });
      }
    } else {
      // Safe tile!
      newGrid[index] = 'safe';
      setGrid(newGrid);
      
      const newSafeCount = safeCount + 1;
      setSafeCount(newSafeCount);
      
      const newMultiplier = calculateMultiplier(newSafeCount);
      setMultiplier(newMultiplier);

      // Check if all safe tiles found
      if (newSafeCount >= TOTAL_TILES - difficulty.mines) {
        setResult(`💎 PERFECT GAME! All diamonds found! ${newMultiplier.toFixed(2)}×`);
        setIsPlaying(false);
        
        if (betId) {
          apiService.cashoutBet(betId, newMultiplier).then(() => fetchBalances()).catch(err => {
            console.error('Cashout failed:', err);
          });
        }
      }
    }
  };

  const cashOut = async () => {
    if (!isPlaying || safeCount === 0 || !betId) return;

    setIsPlaying(false);
    
    try {
      await apiService.cashoutBet(betId, multiplier);
      await fetchBalances();
      setResult(`💰 CASHED OUT! Won ${getPotentialWin()} USDC (${multiplier.toFixed(2)}×)`);
      
      // Reveal all mines
      const finalGrid = grid.map((tile, i) => 
        minePositions.includes(i) ? 'mine' : tile
      );
      setGrid(finalGrid);
    } catch (error) {
      console.error('Cashout failed:', error);
      setResult('❌ Cashout failed: ' + (error as Error).message);
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    setResult(null);
    setGrid(Array(TOTAL_TILES).fill('hidden'));
    setBetId(null);
    setMinePositions([]);
    setSafeCount(0);
    setMultiplier(1.0);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-black rounded-lg p-6 border-2 border-cyan-500 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            💎 DIAMOND HANDS
          </h2>
          <p className="text-gray-300 text-sm">Find diamonds, avoid mines • Dynamic risk/reward</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Max Possible</div>
          <div className="text-lg font-bold text-yellow-400">{getMaxPossibleMultiplier()}×</div>
        </div>
      </div>

      {/* Stats Display */}
      {isPlaying && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-black rounded p-2 border border-cyan-600 text-center">
            <div className="text-gray-400 text-xs">Gems</div>
            <div className="text-xl font-bold text-green-400">{safeCount}</div>
          </div>
          <div className="bg-black rounded p-2 border border-cyan-600 text-center">
            <div className="text-gray-400 text-xs">Multiplier</div>
            <div className="text-xl font-bold text-yellow-400">{multiplier.toFixed(2)}×</div>
          </div>
          <div className="bg-black rounded p-2 border border-cyan-600 text-center">
            <div className="text-gray-400 text-xs">Mines</div>
            <div className="text-xl font-bold text-red-400">{difficulty.mines}</div>
          </div>
          <div className="bg-black rounded p-2 border border-cyan-600 text-center">
            <div className="text-gray-400 text-xs">Win</div>
            <div className="text-xl font-bold text-purple-400">${getPotentialWin()}</div>
          </div>
        </div>
      )}

      {/* Grid - Reduced Size */}
      <div className="bg-black rounded-lg p-3 mb-4 border-2 border-cyan-700 relative overflow-hidden max-w-lg mx-auto">
        {/* Glowing effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="grid grid-cols-5 gap-1 relative">
          {grid.map((tile, index) => (
            <button
              key={index}
              onClick={() => revealTile(index)}
              disabled={!isPlaying || tile !== 'hidden' || !!result}
              className={`aspect-square rounded-lg font-bold text-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg relative overflow-hidden ${
                tile === 'hidden' 
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 cursor-pointer border-2 border-gray-600 hover:border-cyan-500' 
                  : tile === 'safe' 
                    ? 'bg-gradient-to-br from-green-600 to-green-500 border-2 border-green-400 animate-pulse shadow-green-500/50' 
                    : 'bg-gradient-to-br from-red-600 to-red-500 border-2 border-red-400 animate-bounce shadow-red-500/50'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="relative">
                {tile === 'safe' && <span className="animate-ping absolute inline-flex h-full w-full opacity-30">💎</span>}
                {tile === 'safe' && '💎'}
                {tile === 'mine' && '💣'}
                {tile === 'hidden' && <span className="text-gray-500 text-xl">?</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {isPlaying && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{safeCount} / {TOTAL_TILES - difficulty.mines} safe tiles</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-300"
              style={{ 
                width: `${(safeCount / (TOTAL_TILES - difficulty.mines)) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`text-center text-2xl font-bold mb-4 p-4 rounded-lg border-2 ${
          result.includes('WIN') || result.includes('PERFECT') || result.includes('CASHED') 
            ? 'bg-green-500/20 text-green-400 border-green-500 animate-pulse' 
            : result.includes('BOOM')
            ? 'bg-red-500/20 text-red-400 border-red-500'
            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
        }`}>
          {result}
        </div>
      )}

      {!isPlaying && !result && (
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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-cyan-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty (More Mines = Higher Multipliers):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.name}
                  onClick={() => setDifficulty(diff)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all transform hover:scale-105 border-2 ${
                    difficulty.name === diff.name
                      ? `bg-gradient-to-br ${diff.color} text-white shadow-lg border-white`
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div>{diff.name}</div>
                  <div className="text-xs opacity-75">{diff.mines} 💣 • {diff.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border-2 border-cyan-600">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Selected Difficulty:</div>
                <div className="text-white font-bold">{difficulty.name}</div>
              </div>
              <div>
                <div className="text-gray-400">Mines:</div>
                <div className="text-red-400 font-bold">{difficulty.mines} / {TOTAL_TILES}</div>
              </div>
              <div>
                <div className="text-gray-400">Safe Tiles:</div>
                <div className="text-green-400 font-bold">{TOTAL_TILES - difficulty.mines}</div>
              </div>
              <div>
                <div className="text-gray-400">Max Win:</div>
                <div className="text-yellow-400 font-bold">{getMaxPossibleMultiplier()}×</div>
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
          >
            💎 START MINING ({stake} USDC)
          </button>
        </div>
      )}

      {isPlaying && !result && (
        <button
          onClick={cashOut}
          disabled={safeCount === 0}
          className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-600 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg disabled:shadow-none"
        >
          {safeCount === 0 
            ? '🔒 Pick a tile first' 
            : `💰 CASH OUT $${getPotentialWin()} (${multiplier.toFixed(2)}×)`
          }
        </button>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 New Game
        </button>
      )}
    </div>
  );
};
