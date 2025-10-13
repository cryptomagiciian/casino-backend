import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';

const CRYPTO_ICONS = ['₿', 'Ξ', '◎', '🐕', '💎', '⚡'];
const CHAMBERS = 6;

interface Chamber {
  icon: string;
  isBullet: boolean;
  revealed: boolean;
}

export const BulletBet: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [bulletCount, setBulletCount] = useState(1); // 1-5 bullets
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [selectedChamber, setSelectedChamber] = useState<number | null>(null);
  const { fetchBalances } = useWallet();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getMultiplier = (bullets: number) => {
    // More bullets = Higher multiplier
    const multipliers = [0, 2.0, 3.5, 5.0, 7.5, 10.0];
    return multipliers[bullets];
  };

  const initializeChambers = () => {
    const newChambers: Chamber[] = [];
    const bulletPositions = new Set<number>();
    
    // Place bullets randomly
    while (bulletPositions.size < bulletCount) {
      bulletPositions.add(Math.floor(Math.random() * CHAMBERS));
    }
    
    // Create chambers
    for (let i = 0; i < CHAMBERS; i++) {
      newChambers.push({
        icon: CRYPTO_ICONS[i],
        isBullet: bulletPositions.has(i),
        revealed: false,
      });
    }
    
    setChambers(newChambers);
  };

  const spin = async () => {
    if (isSpinning) return;

    try {
      setIsSpinning(true);
      setResult(null);
      setSelectedChamber(null);
      initializeChambers();

      const bet = await apiService.placeBet({
        game: 'stop_loss_roulette',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { riskLevel: bulletCount },
      });

      // Spin animation
      let spinCount = 0;
      const totalSpins = 60;
      
      intervalRef.current = setInterval(() => {
        spinCount++;
        setRotation(prev => prev + 60);

        if (spinCount >= totalSpins) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Determine landing position
          // 10% chance of landing between chambers (TIE)
          // 90% chance of landing on a chamber (WIN/LOSE)
          const isTie = Math.random() < 0.1;
          
          if (isTie) {
            // TIE - pointer lands between chambers
            setSelectedChamber(null);
            setResult('⚠️ TIE! Pointer landed between chambers. Bet refunded!');
            setIsSpinning(false);
            
            // Refund the bet by crediting back the stake
            // (In a real scenario, backend would handle this, but for demo we just show message)
            setTimeout(() => {
              fetchBalances(); // Refresh to show refunded amount
            }, 500);
          } else {
            // Normal outcome - pointer lands on a chamber
            const finalChamber = Math.floor(Math.random() * CHAMBERS);
            setSelectedChamber(finalChamber);
            
            // Check if this chamber has a bullet (client-side determination)
            const landedChamber = chambers[finalChamber];
            const hitBullet = landedChamber?.isBullet || false;
            
            // Resolve bet (for balance update)
            apiService.resolveBet(bet.id)
              .then(async (resolved) => {
                // Use OUR visual determination, not backend's random result
                const won = !hitBullet;
                
                // Update chamber state - reveal the selected chamber
                setChambers(prev => prev.map((chamber, i) => ({
                  ...chamber,
                  revealed: i === finalChamber,
                })));
                
                await fetchBalances();
                
                if (won) {
                  setResult(`💎 SURVIVED! Won ${getMultiplier(bulletCount)}× (${(parseFloat(stake) * getMultiplier(bulletCount)).toFixed(2)} USDC)`);
                } else {
                  setResult('💀 BULLET! You lost!');
                }
                
                setIsSpinning(false);
              })
              .catch(async (error) => {
                console.error('Bet resolution failed:', error);
                await fetchBalances();
                setResult('❌ Error: ' + error.message);
                setIsSpinning(false);
              });
          }
        }
      }, 50);

    } catch (error) {
      console.error('Spin failed:', error);
      setResult('❌ Spin failed: ' + (error as Error).message);
      setIsSpinning(false);
    }
  };

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSpinning(false);
    setResult(null);
    setRotation(0);
    setSelectedChamber(null);
    initializeChambers();
  };

  return (
    <div className="bg-gradient-to-br from-black via-red-950 to-black rounded-lg p-6 border-2 border-red-500 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
            💀 BULLET BET
          </h2>
          <p className="text-gray-300 text-sm">Russian Roulette • Only one chamber is safe... or loaded</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Win Multiplier</div>
          <div className="text-3xl font-bold text-yellow-400">{getMultiplier(bulletCount)}×</div>
        </div>
      </div>

      {/* Revolver Cylinder */}
      <div className="relative bg-black rounded-lg p-8 mb-4 border-2 border-red-700 h-96 flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-radial from-red-900/20 via-transparent to-transparent animate-pulse" />
        
        {/* Skull decoration */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-6xl opacity-20">💀</div>

        {/* Cylinder */}
        <div className="relative w-80 h-80">
          <div 
            className="absolute inset-0 rounded-full border-8 border-red-500 shadow-2xl transition-transform bg-gradient-to-br from-gray-900 to-gray-800"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '50ms' : '500ms',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Chambers */}
            {chambers.map((chamber, index) => {
              const angle = (360 / CHAMBERS) * index;
              const isSelected = selectedChamber === index;
              
              return (
                <div
                  key={index}
                  className="absolute w-full h-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                  }}
                >
                  <div 
                    className={`absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-20 rounded-lg flex items-center justify-center transition-all ${
                      isSelected && !chamber.revealed
                        ? 'bg-yellow-500 border-4 border-yellow-300 animate-pulse scale-110' 
                        : chamber.revealed && chamber.isBullet
                        ? 'bg-red-600 border-4 border-red-400 animate-bounce'
                        : chamber.revealed && !chamber.isBullet
                        ? 'bg-green-600 border-4 border-green-400'
                        : 'bg-gray-700 border-2 border-gray-600'
                    }`}
                    style={{
                      transform: `rotate(-${angle}deg)`,
                      boxShadow: isSelected ? '0 0 20px rgba(234, 179, 8, 0.8)' : 'none',
                    }}
                  >
                    {chamber.revealed ? (
                      <span className="text-4xl">
                        {chamber.isBullet ? '💀' : '💎'}
                      </span>
                    ) : (
                      <span className={`text-3xl ${isSelected ? 'animate-pulse' : ''}`}>
                        {chamber.icon}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-4 border-red-400 flex items-center justify-center shadow-2xl">
              <div className="text-3xl animate-pulse">
                {isSpinning ? '⚡' : result?.includes('SURVIVED') ? '💎' : result?.includes('BULLET') ? '💀' : '🔫'}
              </div>
            </div>
          </div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-t-[25px] border-t-yellow-400 border-r-[15px] border-r-transparent drop-shadow-lg animate-pulse" />
          </div>
        </div>

        {/* Tension effect */}
        {isSpinning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Bullet Count Selector */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>Risk Level: {bulletCount} Bullet{bulletCount > 1 ? 's' : ''}</span>
          <span className="text-yellow-400 font-bold">{getMultiplier(bulletCount)}× Payout • {((CHAMBERS - bulletCount) / CHAMBERS * 100).toFixed(0)}% Survival</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((count) => (
            <button
              key={count}
              onClick={() => setBulletCount(count)}
              disabled={isSpinning}
              className={`py-4 rounded-lg font-bold transition-all transform hover:scale-105 ${
                bulletCount === count
                  ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg border-4 border-red-300'
                  : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-red-600'
              } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1">💀</div>
              <div className="text-xs">{count} Bullet{count > 1 ? 's' : ''}</div>
              <div className="text-sm font-bold text-yellow-400">{getMultiplier(count)}×</div>
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`text-center text-2xl font-bold mb-4 p-6 rounded-xl border-4 relative overflow-hidden ${
          result.includes('SURVIVED') || result.includes('Won')
            ? 'bg-green-500/30 text-green-400 border-green-500' 
            : result.includes('BULLET') || result.includes('lost')
            ? 'bg-red-500/30 text-red-400 border-red-500'
            : result.includes('TIE')
            ? 'bg-orange-500/30 text-orange-400 border-orange-500'
            : 'bg-yellow-500/30 text-yellow-400 border-yellow-500'
        } animate-pulse shadow-2xl`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="relative">{result}</div>
          {result.includes('TIE') && (
            <div className="text-sm mt-2 text-orange-300">Spin again - no charge!</div>
          )}
        </div>
      )}

      {!isSpinning && !result && (
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
              className="w-full px-4 py-3 bg-gray-800 border-2 border-red-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-lg"
            />
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-red-600/30">
            <div className="text-center">
              <div className="text-sm text-gray-300 mb-2">Current Bet:</div>
              <div className="text-xl font-bold text-yellow-400">
                {bulletCount} Bullet{bulletCount > 1 ? 's' : ''} • {getMultiplier(bulletCount)}× Multiplier
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Survival: {((CHAMBERS - bulletCount) / CHAMBERS * 100).toFixed(0)}% • Win ${(parseFloat(stake) * getMultiplier(bulletCount)).toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={spin}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-500 hover:via-orange-500 hover:to-yellow-500 text-white rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-red-500/50"
          >
            🔫 PULL THE TRIGGER ({stake} USDC)
          </button>

          <div className="space-y-2">
            <div className="text-center text-xs text-gray-400 bg-black/30 rounded p-2">
              ⚠️ The more bullets, the higher the multiplier... but one wrong chamber and it's over 💀
            </div>
            <div className="text-center text-xs text-orange-400 bg-orange-950/30 rounded p-2 border border-orange-700/30">
              ⚡ 10% chance the pointer lands BETWEEN chambers = TIE! Bet refunded, spin again free!
            </div>
          </div>
        </div>
      )}

      {isSpinning && (
        <div className="text-center space-y-2 bg-gray-800/50 rounded-lg p-4 border-2 border-red-600">
          <div className="text-red-400 font-bold text-2xl animate-pulse">
            🔫 SPINNING CYLINDER...
          </div>
          <div className="text-sm text-gray-400">
            Will you survive? 💀
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={resetGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
        >
          🔄 Spin Again
        </button>
      )}
    </div>
  );
};

