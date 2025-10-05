import React from 'react';
import { Boss, WeaponSelection, GunType, PowerUp } from '../types';
import { POWER_UPS } from '../constants';

interface HUDProps {
  score: number;
  score2?: number;
  isMultiplayer?: boolean;
  lives: number;
  level: number;
  currency: number;
  boss: Boss | null;
  onPause: () => void;
  p1Weapon: WeaponSelection;
  p1Ammo?: number;
  p2Weapon?: WeaponSelection;
  p2Ammo?: number;
  equippedGun?: GunType | null;
  playerLevel: number;
  xp: number;
  xpForNextLevel: number;
  equippedPowerUpId: string | null;
  powerUpCount: number;
  isInvincible: boolean;
  rapidFireTimeLeft: number; // in ms
  timeSlowTimeLeft: number; // in ms
  goldRushTimeLeft: number; // in ms
}

const WeaponDisplay: React.FC<{
    weapon: WeaponSelection;
    ammo?: number;
    maxAmmo?: number;
    isP1: boolean;
}> = ({ weapon, ammo, maxAmmo, isP1}) => {
    const weaponIcon = weapon === 'bomb' ? '💣' : '🔫';
    const color = isP1 ? 'text-cyan-400' : 'text-green-400';
    const switchKey = isP1 ? 'Q' : '.';
    
    return (
        <div className={`flex items-center gap-2 ${color}`}>
            <span className="font-bold">[{switchKey}] WPN:</span>
            <span>{weaponIcon}</span>
            {weapon === 'gun' && maxAmmo !== undefined && (
                <span>{ammo}/{maxAmmo}</span>
            )}
        </div>
    );
};

const HUD: React.FC<HUDProps> = ({ score, score2, isMultiplayer, lives, level, currency, boss, onPause, p1Weapon, p1Ammo, p2Weapon, p2Ammo, equippedGun, playerLevel, xp, xpForNextLevel, equippedPowerUpId, powerUpCount, isInvincible, rapidFireTimeLeft, timeSlowTimeLeft, goldRushTimeLeft }) => {
  const bossHealthPercentage = boss ? (boss.health / boss.maxHealth) * 100 : 0;
  const xpPercentage = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0;
  const equippedPowerUp = equippedPowerUpId ? POWER_UPS.find(p => p.id === equippedPowerUpId) : null;

  return (
    <>
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-black/30 text-lg">
        <div className="flex gap-4 items-center">
          {isMultiplayer ? (
             <>
                <div><span className="font-bold text-cyan-400">P1:</span> {score}</div>
                <div><span className="font-bold text-green-400">P2:</span> {score2}</div>
             </>
          ) : (
             <div className="flex items-center gap-4">
                 <div>
                    <span className="font-bold text-yellow-400">SCORE:</span> {score}
                 </div>
                 <div className="w-40">
                    <div className="flex justify-between text-sm font-bold">
                        <span className="text-yellow-300">LVL {playerLevel}</span>
                        <span className="text-gray-300">{xp} / {xpForNextLevel}</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1 border border-gray-500">
                        <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${xpPercentage}%` }}></div>
                    </div>
                 </div>
            </div>
          )}
        </div>
         <div className="flex flex-col items-center">
            <WeaponDisplay weapon={p1Weapon} ammo={p1Ammo} maxAmmo={equippedGun?.maxAmmo} isP1={true} />
            {isMultiplayer && p2Weapon && <WeaponDisplay weapon={p2Weapon} ammo={p2Ammo} maxAmmo={equippedGun?.maxAmmo} isP1={false} />}
        </div>
        <div className="flex gap-4 items-center">
            {equippedPowerUp && (
              <div className="flex items-center gap-2 text-xl border-r-2 border-gray-500 pr-4">
                  <span className="font-bold text-yellow-300">[E]</span>
                  <span>{equippedPowerUp.emoji}</span>
                  <span className="font-bold">{powerUpCount}</span>
              </div>
            )}
            <div>
            <span className="font-bold text-green-400">💰:</span> {currency}
            </div>
            <div>
            <span className="font-bold text-cyan-400">LVL:</span> {level}
            </div>
            <div className="flex items-center">
            <span className="font-bold text-red-500 mr-2">HP:</span>
            {'❤️'.repeat(lives)}
            </div>
            <button onClick={onPause} className="text-3xl hover:opacity-75" aria-label="Pause Game">
                ⏸️
            </button>
        </div>
      </div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {rapidFireTimeLeft > 0 && (
            <div className="text-2xl font-bold text-red-500 animate-pulse bg-black/50 px-4 py-1 rounded-lg">
                RAPID FIRE: {(rapidFireTimeLeft / 1000).toFixed(1)}s
            </div>
        )}
        {timeSlowTimeLeft > 0 && (
            <div className="text-2xl font-bold text-blue-400 animate-pulse bg-black/50 px-4 py-1 rounded-lg">
                TIME SLOW: {(timeSlowTimeLeft / 1000).toFixed(1)}s
            </div>
        )}
        {goldRushTimeLeft > 0 && (
            <div className="text-2xl font-bold text-yellow-400 animate-pulse bg-black/50 px-4 py-1 rounded-lg">
                GOLD RUSH: {(goldRushTimeLeft / 1000).toFixed(1)}s
            </div>
        )}
      </div>
      {boss && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4">
            <div className="text-center mb-1 text-white font-bold text-lg">{`BOSS: ${boss.type}`}</div>
            <div className="w-full bg-gray-600 rounded-full h-6 border-2 border-red-800">
                <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${bossHealthPercentage}%` }}
                ></div>
            </div>
        </div>
      )}
    </>
  );
};

export default HUD;