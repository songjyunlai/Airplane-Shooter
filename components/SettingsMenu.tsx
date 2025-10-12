
import React from 'react';
import { Settings } from '../types';

interface SettingsMenuProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onSettingsChange, onClose }) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ [e.target.name]: parseFloat(e.target.value) });
  };
  
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ [e.target.name]: e.target.checked });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-lg bg-gray-800/90 p-8 rounded-lg shadow-2xl border-2 border-cyan-500/50 text-white">
        <h2 className="text-4xl font-bold text-cyan-400 mb-8 text-center">Settings</h2>
        
        <div className="space-y-6">
          {/* Master Volume */}
          <div>
            <label htmlFor="masterVolume" className="block mb-2 text-lg font-bold">Master Volume</label>
            <input 
              type="range" 
              id="masterVolume" 
              name="masterVolume" 
              min="0" 
              max="1" 
              step="0.05" 
              value={settings.masterVolume} 
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          {/* Music Volume */}
          <div>
            <label htmlFor="musicVolume" className="block mb-2 text-lg font-bold">Music Volume</label>
            <input 
              type="range" 
              id="musicVolume" 
              name="musicVolume" 
              min="0" 
              max="1" 
              step="0.05" 
              value={settings.musicVolume} 
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          {/* SFX Volume */}
          <div>
            <label htmlFor="sfxVolume" className="block mb-2 text-lg font-bold">Sound Effects Volume</label>
            <input 
              type="range" 
              id="sfxVolume" 
              name="sfxVolume" 
              min="0" 
              max="1" 
              step="0.05" 
              value={settings.sfxVolume} 
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          {/* Mobile Controls Toggle */}
          <div className="flex items-center justify-between pt-4">
            <label htmlFor="showMobileControls" className="text-lg font-bold">Show Mobile Controls</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="showMobileControls"
                name="showMobileControls"
                checked={settings.showMobileControls}
                onChange={handleToggleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-cyan-600 text-white font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-105 hover:bg-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
