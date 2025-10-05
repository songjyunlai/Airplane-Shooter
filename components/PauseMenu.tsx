import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onMenu: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onMenu }) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
      <div className="bg-gray-800/80 p-10 rounded-lg shadow-2xl border border-cyan-500/50 text-center">
        <h2 className="text-5xl font-bold text-cyan-400 mb-8" style={{ textShadow: '0 0 8px #0ff' }}>PAUSED</h2>
        <div className="flex flex-col space-y-4">
          <button
            onClick={onResume}
            className="px-8 py-4 bg-cyan-500 text-gray-900 font-bold text-xl rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300"
            aria-label="Resume Game"
          >
            Resume
          </button>
          <button
            onClick={onMenu}
            className="px-8 py-3 bg-gray-600 text-white font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400"
            aria-label="Return to Main Menu"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
