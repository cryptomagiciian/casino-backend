import React from 'react';
import { COLORS } from '../../../lib/ladder/sceneAssets';

interface ControlsProps {
  currentLevel: number;
  multiplier: number;
  potentialWin: number;
  risk: number; // 0-100
  nextLevelProb: number; // 0-100
  isClimbing: boolean;
  isResolving: boolean;
  canCashOut: boolean;
  onClimb: () => void;
  onCashOut: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  currentLevel,
  multiplier,
  potentialWin,
  risk,
  nextLevelProb,
  isClimbing,
  isResolving,
  canCashOut,
  onClimb,
  onCashOut
}) => {
  const getRiskColor = (riskLevel: number) => {
    if (riskLevel < 33) return COLORS.riskMeter.low;
    if (riskLevel < 66) return COLORS.riskMeter.medium;
    return COLORS.riskMeter.high;
  };

  const getRiskLabel = (riskLevel: number) => {
    if (riskLevel < 33) return 'Low Risk';
    if (riskLevel < 66) return 'Medium Risk';
    return 'High Risk';
  };

  const formatRiskColor = (color: number) => {
    return `#${color.toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Level */}
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Level</div>
          <div className="text-2xl font-bold text-white">{currentLevel}</div>
        </div>
        
        {/* Current Multiplier */}
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Multiplier</div>
          <div className="text-2xl font-bold text-cyan-400">{multiplier.toFixed(2)}×</div>
        </div>
        
        {/* Potential Win */}
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Potential Win</div>
          <div className="text-2xl font-bold text-green-400">${potentialWin.toFixed(2)}</div>
        </div>
      </div>

      {/* Risk Meter */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Risk Level</span>
          <span 
            className="text-sm font-medium"
            style={{ color: formatRiskColor(getRiskColor(risk)) }}
          >
            {getRiskLabel(risk)}
          </span>
        </div>
        
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
          {/* Risk gradient bar */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
            style={{
              width: `${risk}%`,
              background: `linear-gradient(90deg, ${formatRiskColor(COLORS.riskMeter.low)}, ${formatRiskColor(COLORS.riskMeter.medium)}, ${formatRiskColor(COLORS.riskMeter.high)})`
            }}
          />
          
          {/* Risk level indicator */}
          <div 
            className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg"
            style={{ left: `${risk}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        
        {/* Risk percentage */}
        <div className="text-right text-xs text-gray-400 mt-1">
          {risk.toFixed(1)}% liquidation chance
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* CLIMB Button */}
        <button
          onClick={onClimb}
          disabled={isClimbing || isResolving}
          className={`
            relative px-6 py-3 rounded-lg font-bold text-white transition-all duration-200
            ${isClimbing || isResolving
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95'
            }
            shadow-lg
          `}
          style={{
            background: `linear-gradient(135deg, ${formatRiskColor(COLORS.climbButton.start)}, ${formatRiskColor(COLORS.climbButton.end)})`,
            boxShadow: isClimbing || isResolving
              ? '0 4px 8px rgba(0,0,0,0.3)' 
              : '0 8px 16px rgba(29, 233, 182, 0.3), 0 0 20px rgba(0, 194, 255, 0.2)'
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg">CLIMB</span>
            <span className="text-xs opacity-80">
              {nextLevelProb.toFixed(1)}% success
            </span>
          </div>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200"
               style={{
                 background: `linear-gradient(135deg, ${formatRiskColor(COLORS.climbButton.start)}, ${formatRiskColor(COLORS.climbButton.end)})`,
                 filter: 'blur(8px)',
                 zIndex: -1
               }}
          />
        </button>

        {/* CASH OUT Button */}
        <button
          onClick={onCashOut}
          disabled={!canCashOut || isClimbing || isResolving}
          className={`
            relative px-6 py-3 rounded-lg font-bold text-white transition-all duration-200
            ${!canCashOut || isClimbing || isResolving
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95'
            }
            shadow-lg
            ${risk > 65 ? 'animate-pulse' : ''}
          `}
          style={{
            background: `linear-gradient(135deg, ${formatRiskColor(COLORS.cashoutButton.start)}, ${formatRiskColor(COLORS.cashoutButton.end)})`,
            boxShadow: !canCashOut || isClimbing || isResolving
              ? '0 4px 8px rgba(0,0,0,0.3)'
              : '0 8px 16px rgba(255, 154, 46, 0.3), 0 0 20px rgba(255, 77, 109, 0.2)'
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg">CASH OUT</span>
            <span className="text-xs opacity-80">
              Secure ${potentialWin.toFixed(2)}
            </span>
          </div>
          
          {/* High risk shake effect */}
          {risk > 65 && (
            <div className="absolute inset-0 rounded-lg animate-pulse"
                 style={{
                   background: `linear-gradient(135deg, ${formatRiskColor(COLORS.cashoutButton.start)}, ${formatRiskColor(COLORS.cashoutButton.end)})`,
                   filter: 'blur(4px)',
                   zIndex: -1
                 }}
            />
          )}
        </button>
      </div>

      {/* Game Info */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          <div className="mb-1">
            <span className="text-cyan-400">Next Level:</span> {nextLevelProb.toFixed(1)}% chance
          </div>
          <div>
            <span className="text-red-400">Liquidation:</span> {risk.toFixed(1)}% chance
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
