
import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
  onGoToShop: () => void;
  onGoToSupplyDrop: () => void;
  onStartMultiplayer: () => void;
  onGoToSettings: () => void;
  onResetProgress: () => void;
  currency: number;
  playerLevel: number;
  playerXp: number;
  xpForNextLevel: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onGoToShop, onGoToSupplyDrop, onStartMultiplayer, onGoToSettings, onResetProgress, currency, playerLevel, playerXp, xpForNextLevel }) => {
  const xpPercentage = (playerXp / xpForNextLevel) * 100;
  
  return (
    <div className="relative flex flex-col items-center justify-center bg-gray-800/50 p-10 rounded-lg shadow-2xl border border-cyan-500/50 w-full max-w-md">
      <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-full text-lg">
        💰 {currency}
      </div>
      <button
        onClick={onGoToSettings}
        className="absolute top-4 left-4 text-3xl transform transition-transform duration-200 hover:scale-110 hover:rotate-90 focus:outline-none"
        aria-label="Settings"
      >
        ⚙️
      </button>
       <div className="w-full text-center mb-4">
        <h3 className="text-xl font-bold text-yellow-300">Level {playerLevel}</h3>
        <div className="w-full bg-gray-700 rounded-full h-4 my-1 border-2 border-gray-600">
            <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${xpPercentage}%` }}></div>
        </div>
        <p className="text-sm text-gray-300">{playerXp} / {xpForNextLevel} XP</p>
      </div>
      <h2 className="text-3xl font-bold text-white mb-6">Are you ready, hero?</h2>
      <div className="flex flex-col space-y-4">
        <button
          onClick={onStartGame}
          className="px-8 py-4 bg-cyan-500 text-gray-900 font-bold text-xl rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300 shadow-lg"
        >
          START GAME
        </button>
         <button
          onClick={onStartMultiplayer}
          className="px-8 py-4 bg-green-500 text-gray-900 font-bold text-xl rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-green-400 focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg"
        >
          MULTIPLAYER
        </button>
        <button
          onClick={onGoToShop}
          className="px-8 py-3 bg-yellow-500 text-gray-900 font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-300 shadow-lg"
        >
          ARMORY
        </button>
        <button
          onClick={onGoToSupplyDrop}
          className="px-8 py-3 bg-purple-500 text-gray-900 font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-300 shadow-lg"
        >
          SUPPLY DROP
        </button>
      </div>
      <div className="hidden md:block mt-8 text-gray-300 text-center">
          <p className="font-bold">Controls (P1):</p>
          <p><span className="text-cyan-400">WASD</span> to move.</p>
          <p><span className="text-cyan-400">Spacebar</span> to fire.</p>
          <p><span className="text-cyan-400">Q</span> to switch weapon.</p>
          <p><span className="text-cyan-400">E</span> to use power-up.</p>
          <p className="font-bold mt-2">Controls (P2):</p>
          <p><span className="text-green-400">Arrow Keys</span> to move.</p>
          <p><span className="text-green-400">/</span> to fire.</p>
          <p><span className="text-green-400">.</span> to switch weapon.</p>
      </div>
       <button
        onClick={onResetProgress}
        className="absolute bottom-4 left-4 px-3 py-1 bg-red-800 text-white font-bold text-xs rounded-lg transform transition-transform duration-200 hover:scale-105 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
        >
        Reset Progress
        </button>
    </div>
  );
};

export default MainMenu;
