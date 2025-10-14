import React from 'react';

interface TestLadderSceneProps {
  currentLevel: number;
  multiplier: number;
  risk: number;
  milestones?: number[];
  onMilestoneReached?: (milestone: number) => void;
}

const TestLadderScene: React.FC<TestLadderSceneProps> = ({
  currentLevel,
  multiplier,
  risk,
  milestones = [2, 5, 10],
  onMilestoneReached
}) => {
  return (
    <div className="w-full h-full relative bg-gradient-to-b from-blue-900 to-purple-900 flex flex-col items-center justify-center">
      {/* Test visual elements */}
      <div className="text-white text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">🎯 LADDER SCENE TEST</h3>
        <p className="text-lg">Current Level: {currentLevel}</p>
        <p className="text-lg">Multiplier: {multiplier.toFixed(2)}×</p>
        <p className="text-lg">Risk: {risk}%</p>
      </div>
      
      {/* Simple ladder visualization */}
      <div className="flex flex-col-reverse items-center space-y-2">
        {Array.from({ length: 10 }, (_, i) => {
          const level = i + 1;
          const isActive = currentLevel === level;
          const isPassed = currentLevel > level;
          
          let color = 'bg-gray-600';
          if (level <= 3) color = 'bg-green-500';
          else if (level <= 6) color = 'bg-cyan-500';
          else if (level <= 9) color = 'bg-purple-500';
          else color = 'bg-yellow-500';
          
          return (
            <div
              key={level}
              className={`w-16 h-8 ${color} rounded border-2 ${
                isActive ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 
                isPassed ? 'border-green-400' : 'border-gray-500'
              } flex items-center justify-center text-white font-bold text-sm`}
            >
              {level}
            </div>
          );
        })}
      </div>
      
      {/* Player avatar */}
      {currentLevel > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 animate-pulse">
            <div className="w-full h-full bg-yellow-300 rounded-full animate-ping"></div>
          </div>
        </div>
      )}
      
      {/* Milestone labels */}
      {milestones.map(milestone => (
        <div
          key={milestone}
          className="absolute right-4 text-white font-bold text-lg"
          style={{ top: `${100 - (milestone * 8)}%` }}
        >
          {milestone}×
        </div>
      ))}
      
      {/* Flames at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-500 to-red-500 opacity-75"
        style={{ height: `${Math.min(64, risk * 0.8)}px` }}
      >
        <div className="w-full h-full bg-gradient-to-t from-red-600 to-orange-400 animate-pulse"></div>
      </div>
    </div>
  );
};

export default TestLadderScene;
