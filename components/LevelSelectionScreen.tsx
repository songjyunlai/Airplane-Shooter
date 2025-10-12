
import React from 'react';
import { LEVEL_CONFIGS } from '../constants';

interface LevelSelectionScreenProps {
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const LevelSelectionScreen: React.FC<LevelSelectionScreenProps> = ({ onSelectLevel, onBack }) => {
  return (
    <div className="w-full max-w-6xl bg-gray-900/70 p-6 rounded-lg shadow-2xl border border-cyan-500/50">
      <h2 className="text-4xl font-bold text-white text-center mb-6">Select Mission</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-4 mb-8">
        {LEVEL_CONFIGS.map((levelConfig) => (
          <div
            key={levelConfig.level}
            onClick={() => onSelectLevel(levelConfig.level)}
            className="flex flex-col items-center justify-between p-4 bg-gray-800/50 rounded-lg border-2 transform transition-all duration-200 border-cyan-700/50 cursor-pointer hover:scale-105 hover:border-cyan-400"
          >
            <h3 className="text-xl font-bold mb-2 text-cyan-400">Lvl {levelConfig.level}</h3>
            <div className="text-5xl my-3 flex items-center justify-center h-16">
              <span>{levelConfig.boss.type}</span>
            </div>
            <p className="text-gray-300 text-sm">vs</p>
            <p className="text-gray-300">Enemies: <span className="text-xl">{levelConfig.enemies.type}</span></p>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gray-600 text-white font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default LevelSelectionScreen;
