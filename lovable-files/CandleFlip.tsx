import React, { useState } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const CandleFlip: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'red' | 'green'>('red');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { fetchBalances } = useWallet();

  const previewBet = async () => {
    try {
      const data = await apiService.previewBet({
        game: 'candle_flip',
        currency: 'USDC',
        stake,
        params: { prediction },
      });
      setPreview(data);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Preview failed: ' + (error as Error).message);
    }
  };

  const placeBet = async () => {
    setLoading(true);
    try {
      const bet = await apiService.placeBet({
        game: 'candle_flip',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });
      
      // Resolve bet immediately for demo
      const result = await apiService.resolveBet(bet.id);
      await fetchBalances();
      
      alert(`Bet placed! Outcome: ${result.outcome}, Multiplier: ${result.resultMultiplier}x, You ${result.resultMultiplier > 0 ? 'WON' : 'LOST'}!`);
      setPreview(null); // Reset preview after bet
    } catch (error) {
      console.error('Bet failed:', error);
      alert('Bet failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">🕯️ Candle Flip</h2>
      <p className="text-gray-300 mb-6">Predict the next candle color</p>
      
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
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prediction:
          </label>
          <div className="flex space-x-4">
            <button
              className={`px-6 py-3 rounded font-bold transition-colors ${
                prediction === 'red' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setPrediction('red')}
            >
              🔴 Red
            </button>
            <button
              className={`px-6 py-3 rounded font-bold transition-colors ${
                prediction === 'green' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setPrediction('green')}
            >
              🟢 Green
            </button>
          </div>
        </div>
        
        <button
          onClick={previewBet}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
        >
          Preview Bet
        </button>
        
        {preview && (
          <div className="bg-gray-700 rounded p-4 border border-gray-600">
            <h3 className="text-lg font-bold text-green-400 mb-2">Bet Preview</h3>
            <p className="text-gray-300">Potential Payout: <span className="text-green-400 font-bold">{preview.potentialPayout} USDC</span></p>
            <p className="text-gray-300">Win Chance: <span className="text-blue-400 font-bold">{(preview.winChance * 100).toFixed(1)}%</span></p>
            <p className="text-gray-300">Multiplier: <span className="text-yellow-400 font-bold">{preview.multiplier}x</span></p>
          </div>
        )}
        
        <button
          onClick={placeBet}
          disabled={loading || !preview}
          className="w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 rounded font-bold transition-colors"
        >
          {loading ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
};
