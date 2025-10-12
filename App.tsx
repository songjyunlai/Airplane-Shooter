
import React, { useState, useCallback, useEffect } from 'react';
import Game from './components/Game';
import MainMenu from './components/MainMenu';
import GameOverScreen from './components/GameOverScreen';
import GameWonScreen from './components/GameWonScreen';
import ShopScreen from './components/ShopScreen';
import SupplyDropScreen from './components/SupplyDropScreen';
import LevelSelectionScreen from './components/LevelSelectionScreen';
import PauseMenu from './components/PauseMenu';
import SettingsMenu from './components/SettingsMenu';
import { GameState, Boat, BombType, GunType, PowerUp, Settings } from './types';
import { BOATS, BOMBS, GUNS, POWER_UPS, LOOT_POOL, SUPPLY_DROP_COST, DUPLICATE_CURRENCY_AWARD, getXpForNextLevel, LEVEL_CONFIGS } from './constants';
import { audioManager } from './utils/audioManager';

const SAVE_KEY = 'underwaterWarSaveData';
const SETTINGS_KEY = 'underwaterWarSettings';

interface PlayerData {
  playerLevel: number;
  playerXp: number;
  currency: number;
  ownedBoats: Set<string>;
  ownedBombs: Set<string>;
  ownedGuns: Set<string>;
  ownedPowerUps: { [key: string]: number };
  equippedBoatId: string;
  equippedBombId: string;
  equippedGunId: string | null;
  equippedPowerUpId: string | null;
}

const defaultPlayerData: PlayerData = {
  playerLevel: 1,
  playerXp: 0,
  currency: 500,
  ownedBoats: new Set(['p1']),
  ownedBombs: new Set(['b1']),
  ownedGuns: new Set(),
  ownedPowerUps: { 'pw1': 3 },
  equippedBoatId: 'p1',
  equippedBombId: 'b1',
  equippedGunId: null,
  equippedPowerUpId: 'pw1',
};

const defaultSettings: Settings = {
    masterVolume: 0.7,
    musicVolume: 0.8,
    sfxVolume: 0.9,
    showMobileControls: true,
};

const loadGameData = (): PlayerData => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return {
        ...defaultPlayerData,
        ...parsed,
        ownedBoats: new Set(parsed.ownedBoats || ['p1']),
        ownedBombs: new Set(parsed.ownedBombs || ['b1']),
        ownedGuns: new Set(parsed.ownedGuns || []),
      };
    }
  } catch (error) {
    console.error("Failed to load save data:", error);
  }
  return defaultPlayerData;
};

const loadSettings = (): Settings => {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            return { ...defaultSettings, ...JSON.parse(savedSettings) };
        }
    } catch (error) {
        console.error("Failed to load settings:", error);
    }
    return defaultSettings;
}


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MainMenu);
  const [finalScore1, setFinalScore1] = useState(0);
  const [finalScore2, setFinalScore2] = useState<number | undefined>(undefined);
  const [startLevel, setStartLevel] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [playerData, setPlayerData] = useState<PlayerData>(loadGameData);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [lastRunXpEarned, setLastRunXpEarned] = useState(0);
  const [levelUpInfo, setLevelUpInfo] = useState<{ old: number; new: number } | null>(null);

  useEffect(() => {
    audioManager.init(settings);
  }, []); // Init once on mount

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      audioManager.updateVolumes(settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  useEffect(() => {
    try {
      const dataToSave = {
        ...playerData,
        ownedBoats: Array.from(playerData.ownedBoats),
        ownedBombs: Array.from(playerData.ownedBombs),
        ownedGuns: Array.from(playerData.ownedGuns),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Failed to save game data:", error);
    }
  }, [playerData]);

  const startGame = useCallback((level: number) => {
    setStartLevel(level);
    setGameState(GameState.Playing);
  }, []);
  
  const startMultiplayerGame = useCallback(() => {
    setStartLevel(1);
    setGameState(GameState.MultiplayerPlaying);
  }, []);

  const goToLevelSelection = useCallback(() => {
    setGameState(GameState.LevelSelection);
  }, []);

  const handleGameEnd = useCallback((scores: {p1: number, p2?: number}, won: boolean, xpEarned: number, finalPowerUpCount?: number, finalCurrency?: number) => {
    setFinalScore1(scores.p1);
    setFinalScore2(scores.p2);
    setLastRunXpEarned(xpEarned);

    setPlayerData(prevData => {
      const oldLevel = prevData.playerLevel;
      let currentLevel = prevData.playerLevel;
      let newTotalXp = prevData.playerXp + xpEarned;
      let xpForNext = getXpForNextLevel(currentLevel);

      while (newTotalXp >= xpForNext) {
        newTotalXp -= xpForNext;
        currentLevel++;
        xpForNext = getXpForNextLevel(currentLevel);
      }
      
      if (currentLevel > oldLevel) {
        setLevelUpInfo({ old: oldLevel, new: currentLevel });
      }

      const newOwnedPowerUps = { ...prevData.ownedPowerUps };
      if (prevData.equippedPowerUpId && finalPowerUpCount !== undefined) {
          newOwnedPowerUps[prevData.equippedPowerUpId] = finalPowerUpCount;
      }

      return {
        ...prevData,
        playerLevel: currentLevel,
        playerXp: newTotalXp,
        ownedPowerUps: newOwnedPowerUps,
        currency: prevData.currency + (finalCurrency || 0),
      };
    });
    
    setGameState(won ? GameState.GameWon : GameState.GameOver);
  }, [startLevel]);

  const backToMenu = useCallback(() => {
    setFinalScore2(undefined);
    setLevelUpInfo(null);
    setGameState(GameState.MainMenu);
  }, []);

  const goToShop = useCallback(() => {
    setGameState(GameState.Shop);
  }, []);

  const goToSupplyDrop = useCallback(() => {
    setGameState(GameState.SupplyDrop);
  }, []);

  const pauseGame = useCallback(() => {
    if (gameState === GameState.Playing) {
      setGameState(GameState.Paused);
    } else if (gameState === GameState.MultiplayerPlaying) {
      setGameState(GameState.MultiplayerPaused);
    }
  }, [gameState]);

  const resumeGame = useCallback(() => {
    if (gameState === GameState.Paused) {
      setGameState(GameState.Playing);
    } else if (gameState === GameState.MultiplayerPaused) {
      setGameState(GameState.MultiplayerPlaying);
    }
  }, [gameState]);

  const handleBuyItem = useCallback((itemId: string, itemType: 'boat' | 'bomb' | 'gun' | 'powerup', cost: number) => {
    setPlayerData(prev => {
        if (prev.currency < cost) return prev;

        const newBoats = new Set(prev.ownedBoats);
        const newBombs = new Set(prev.ownedBombs);
        const newGuns = new Set(prev.ownedGuns);
        const newPowerUps = { ...prev.ownedPowerUps };

        if (itemType === 'boat') newBoats.add(itemId);
        else if (itemType === 'bomb') newBombs.add(itemId);
        else if (itemType === 'gun') newGuns.add(itemId);
        else if (itemType === 'powerup') newPowerUps[itemId] = (newPowerUps[itemId] || 0) + 1;

        return {
            ...prev,
            currency: prev.currency - cost,
            ownedBoats: newBoats,
            ownedBombs: newBombs,
            ownedGuns: newGuns,
            ownedPowerUps: newPowerUps,
        };
    });
  }, []);

  const handleOpenSupplyDrop = useCallback((): { item: Boat | BombType | GunType | PowerUp, isDuplicate: boolean } => {
    const totalWeight = LOOT_POOL.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    let wonItemId: string | null = null;
    for (const item of LOOT_POOL) {
        random -= item.weight;
        if (random <= 0) {
            wonItemId = item.id;
            break;
        }
    }
    
    const allItems = [...BOATS, ...BOMBS, ...GUNS, ...POWER_UPS];
    const wonItem = allItems.find(i => i.id === wonItemId)!;

    let isDuplicate = false;
    let itemType: 'boat' | 'bomb' | 'gun' | 'powerup';

    if ('maxAmmo' in wonItem) itemType = 'gun';
    else if ('damage' in wonItem) itemType = 'bomb';
    else if ('quantityPerDrop' in wonItem) itemType = 'powerup';
    else itemType = 'boat';

    setPlayerData(prev => {
        const newBoats = new Set(prev.ownedBoats);
        const newBombs = new Set(prev.ownedBombs);
        const newGuns = new Set(prev.ownedGuns);
        const newPowerUps = { ...prev.ownedPowerUps };
        let newCurrency = prev.currency - SUPPLY_DROP_COST;

        if (itemType === 'boat') {
            isDuplicate = newBoats.has(wonItem.id);
            newBoats.add(wonItem.id);
        } else if (itemType === 'bomb') {
            isDuplicate = newBombs.has(wonItem.id);
            newBombs.add(wonItem.id);
        } else if (itemType === 'gun') {
            isDuplicate = newGuns.has(wonItem.id);
            newGuns.add(wonItem.id);
        } else { // powerup
            const quantity = (wonItem as PowerUp).quantityPerDrop || 1;
            isDuplicate = (newPowerUps[wonItem.id] || 0) > 0;
            newPowerUps[wonItem.id] = (newPowerUps[wonItem.id] || 0) + quantity;
        }

        if (isDuplicate && itemType !== 'powerup') {
            newCurrency += DUPLICATE_CURRENCY_AWARD;
        }

        return {
            ...prev,
            currency: newCurrency,
            ownedBoats: newBoats,
            ownedBombs: newBombs,
            ownedGuns: newGuns,
            ownedPowerUps: newPowerUps,
        };
    });
    
    return { item: wonItem, isDuplicate };
  }, []);
  
  const handleResetProgress = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }
  }, []);

  const renderContent = () => {
    const xpForNextLevel = getXpForNextLevel(playerData.playerLevel);

    switch (gameState) {
      case GameState.Playing:
      case GameState.Paused:
      case GameState.MultiplayerPlaying:
      case GameState.MultiplayerPaused:
        const isMultiplayer = gameState === GameState.MultiplayerPlaying || gameState === GameState.MultiplayerPaused;
        const isPaused = gameState === GameState.Paused || gameState === GameState.MultiplayerPaused;
        return (
          <>
            <Game 
              isPaused={isPaused}
              isMultiplayer={isMultiplayer}
              startLevel={startLevel}
              onGameOver={(scores, xp, count, currency) => handleGameEnd(scores, false, xp, count, currency)} 
              onGameWon={(scores, xp, count, currency) => handleGameEnd(scores, true, xp, count, currency)}
              onPause={pauseGame}
              equippedBoatId={playerData.equippedBoatId}
              equippedBombId={playerData.equippedBombId}
              equippedGunId={playerData.equippedGunId}
              equippedPowerUpId={playerData.equippedPowerUpId}
              ownedPowerUps={playerData.ownedPowerUps}
              playerLevel={playerData.playerLevel}
              playerXp={playerData.playerXp}
              xpForNextLevel={xpForNextLevel}
              settings={settings}
            />
            {isPaused && <PauseMenu onResume={resumeGame} onMenu={backToMenu} />}
          </>
        );
      case GameState.GameOver:
        return <GameOverScreen 
                    score={finalScore1} 
                    score2={finalScore2}
                    onRestart={finalScore2 !== undefined ? startMultiplayerGame : () => startGame(startLevel)} 
                    onMenu={backToMenu} 
                    xpEarned={lastRunXpEarned}
                    levelUpInfo={levelUpInfo}
                />;
      case GameState.GameWon:
        return <GameWonScreen 
                    score={finalScore1} 
                    score2={finalScore2}
                    onRestart={finalScore2 !== undefined ? startMultiplayerGame : goToLevelSelection} 
                    onMenu={backToMenu} 
                    xpEarned={lastRunXpEarned}
                    levelUpInfo={levelUpInfo}
                />;
      case GameState.LevelSelection:
        return <LevelSelectionScreen 
                    onSelectLevel={startGame} 
                    onBack={backToMenu} 
                />;
      case GameState.Shop:
        return (
          <ShopScreen 
            currency={playerData.currency}
            ownedBoats={playerData.ownedBoats}
            ownedBombs={playerData.ownedBombs}
            ownedGuns={playerData.ownedGuns}
            ownedPowerUps={playerData.ownedPowerUps}
            equippedBoatId={playerData.equippedBoatId}
            equippedBombId={playerData.equippedBombId}
            equippedGunId={playerData.equippedGunId}
            equippedPowerUpId={playerData.equippedPowerUpId}
            onBuyItem={handleBuyItem}
            onEquipBoat={(id) => setPlayerData(p => ({ ...p, equippedBoatId: id }))}
            onEquipBomb={(id) => setPlayerData(p => ({ ...p, equippedBombId: id }))}
            onEquipGun={(id) => setPlayerData(p => ({ ...p, equippedGunId: id }))}
            onEquipPowerUp={(id) => setPlayerData(p => ({ ...p, equippedPowerUpId: id }))}
            onBack={backToMenu}
          />
        );
       case GameState.SupplyDrop:
        return (
          <SupplyDropScreen
            currency={playerData.currency}
            onOpenSupplyDrop={handleOpenSupplyDrop}
            onBack={backToMenu}
          />
        );
      case GameState.MainMenu:
      default:
        return <MainMenu 
                    onStartGame={goToLevelSelection} 
                    onStartMultiplayer={startMultiplayerGame} 
                    onGoToShop={goToShop} 
                    onGoToSupplyDrop={goToSupplyDrop} 
                    onGoToSettings={() => setIsSettingsOpen(true)}
                    currency={playerData.currency} 
                    playerLevel={playerData.playerLevel}
                    playerXp={playerData.playerXp}
                    xpForNextLevel={xpForNextLevel}
                    onResetProgress={handleResetProgress}
                />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full text-white font-mono p-2 sm:p-4">
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-2 text-cyan-400 tracking-widest text-center" style={{ textShadow: '0 0 10px #0ff, 0 0 20px #0ff' }}>
        UNDERWATER WAR
      </h1>
      <p className="text-gray-200 mb-6 text-center text-sm sm:text-base">Engage in naval combat against quirky underwater enemies!</p>
      {renderContent()}
      {isSettingsOpen && (
        <SettingsMenu 
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
