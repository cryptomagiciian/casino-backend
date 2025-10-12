import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { CandleFlip } from './CandleFlip';
import { ToTheMoon } from './ToTheMoon';

interface Game {
  id: string;
  name: string;
  description: string;
  houseEdge: number;
  rtp: number;
}

export const GameList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await apiService.getGames();
        setGames(data);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderGameComponent = () => {
    switch (selectedGame) {
      case 'candle_flip':
        return <CandleFlip />;
      case 'to_the_moon':
        return <ToTheMoon />;
      default:
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Select a Game</h3>
            <p className="text-gray-300">Choose a game from the list to start playing!</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Selection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎮 Available Games</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedGame === game.id
                  ? 'border-yellow-400 bg-gray-700'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setSelectedGame(game.id)}
            >
              <h3 className="font-bold text-white mb-2">{game.name}</h3>
              <p className="text-gray-300 text-sm mb-2">{game.description}</p>
              <div className="flex justify-between text-xs">
                <span className="text-green-400">RTP: {game.rtp}%</span>
                <span className="text-red-400">Edge: {game.houseEdge}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Component */}
      {renderGameComponent()}
    </div>
  );
};
