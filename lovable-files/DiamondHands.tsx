import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const NUM_MINES = 5;

type TileState = 'hidden' | 'safe' | 'mine';

export const DiamondHands: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [grid, setGrid] = useState<TileState[]>(Array(TOTAL_TILES).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [safeCount, setSafeCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [result, setResult] = useState<string | null>(null);
  const { fetchBalances } = useWallet();

  const calculateMultiplier = (safePicks: number) => {
    // Exponential growth: each safe pick increases multiplier
    const base = 1.4;
    return Math.pow(base, safePicks);
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
      while (mines.length < NUM_MINES) {
        const pos = Math.floor(Math.random() * TOTAL_TILES);
        if (!mines.includes(pos)) mines.push(pos);
      }
      setMinePositions(mines);

      const bet = await apiService.placeBet({
        game: 'diamond_hands',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { mineCount: NUM_MINES },
      });

      setBetId(bet.id);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game: ' + (error as Error).message);
      setIsPlaying(false);
    }
  };

  const revealTile = (index: number) => {
    if (!isPlaying || grid[index] !== 'hidden' || result) return;

    const newGrid = [...grid];
    
    if (minePositions.includes(index)) {
      // Hit a mine!
      newGrid[index] = 'mine';
      setGrid(newGrid);
      setResult('💥 BOOM! You hit a mine!');
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
        apiService.resolveBet(betId).then(() => fetchBalances());
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
      if (newSafeCount >= TOTAL_TILES - NUM_MINES) {
        setResult(`💎 PERFECT! All diamonds found! ${newMultiplier.toFixed(2)}×`);
        setIsPlaying(false);
        
        if (betId) {
          apiService.cashoutBet(betId).then(() => fetchBalances());
        }
      }
    }
  };

  const cashOut = async () => {
    if (!isPlaying || safeCount === 0 || !betId) return;

    setIsPlaying(false);
    
    try {
      await apiService.cashoutBet(betId);
      await fetchBalances();
      setResult(`💎 CASHED OUT! ${multiplier.toFixed(2)}× WIN!`);
      
      // Reveal all mines
      const finalGrid = grid.map((tile, i) => 
        minePositions.includes(i) ? 'mine' : tile
      );
      setGrid(finalGrid);
    } catch (error) {
      console.error('Cashout failed:', error);
      alert('Cashout failed: ' + (error as Error).message);
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
      <h2 className="text-3xl font-bold text-cyan-400 mb-2">💎 DIAMOND HANDS</h2>
      <p className="text-gray-300 mb-4">Find the diamonds, avoid the mines!</p>

      {/* Stats Display */}
      {isPlaying && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-black rounded p-3 border border-cyan-600 text-center">
            <div className="text-gray-400 text-xs">Safe Picks</div>
            <div className="text-2xl font-bold text-green-400">{safeCount}</div>
          </div>
          <div className="bg-black rounded p-3 border border-cyan-600 text-center">
            <div className="text-gray-400 text-xs">Multiplier</div>
            <div className="text-2xl font-bold text-yellow-400">{multiplier.toFixed(2)}×</div>
          </div>
          <div className="bg-black rounded p-3 border border-cyan-600 text-center">
            <div className="text-gray-400 text-xs">Mines Left</div>
            <div className="text-2xl font-bold text-red-400">{NUM_MINES}</div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="bg-black rounded-lg p-4 mb-4 border border-cyan-700">
        <div className="grid grid-cols-5 gap-2">
          {grid.map((tile, index) => (
            <button
              key={index}
              onClick={() => revealTile(index)}
              disabled={!isPlaying || tile !== 'hidden' || !!result}
              className={`aspect-square rounded-lg font-bold text-3xl transition-all transform hover:scale-105 disabled:scale-100 ${
                tile === 'hidden' 
                  ? 'bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 cursor-pointer' 
                  : tile === 'safe' 
                    ? 'bg-gradient-to-br from-green-600 to-green-500 animate-pulse' 
                    : 'bg-gradient-to-br from-red-600 to-red-500 animate-bounce'
              }`}
            >
              {tile === 'safe' && '💎'}
              {tile === 'mine' && '💣'}
              {tile === 'hidden' && '?'}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-2xl font-bold mb-4 animate-bounce ${
          result.includes('WIN') || result.includes('PERFECT') || result.includes('CASHED') 
            ? 'text-green-400' 
            : 'text-red-400'
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
              className="w-full px-3 py-2 bg-gray-700 border border-cyan-600 rounded text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="bg-gray-800 rounded p-3 border border-cyan-600">
            <p className="text-gray-400 text-sm">
              5 mines hidden in 25 tiles. Each safe pick increases your multiplier exponentially!
            </p>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            💎 START MINING
          </button>
        </div>
      )}

      {isPlaying && !result && (
        <button
          onClick={cashOut}
          disabled={safeCount === 0}
          className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-600 text-white rounded-lg font-bold text-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
        >
          💰 CASH OUT ({multiplier.toFixed(2)}×)
        </button>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
        >
          🔄 New Game
        </button>
      )}
    </div>
  );
};

