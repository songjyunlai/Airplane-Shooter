
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Bomb, Enemy, Boss, BossProjectile, Explosion, Position, WeaponSelection, Bullet, AmmoDrop, Drone, QTEDodgeState, CurrencyDrop, Settings } from '../types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_BASE_HP,
  HIT_DAMAGE,
  DRONE_WIDTH,
  DRONE_HEIGHT,
  BOMB_WIDTH,
  BOMB_HEIGHT,
  BOMB_SPEED,
  BOMB_COOLDOWN,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  BULLET_SPEED,
  GUN_COOLDOWN,
  DRONE_FIRE_COOLDOWN,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_SPEED,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  BOSS_SPEED,
  LEVEL_CONFIGS,
  BOSS_PROJECTILE_WIDTH,
  BOSS_PROJECTILE_HEIGHT,
  BOSS_SHOOT_COOLDOWN,
  BOSS_PROJECTILE_SPEED,
  BOSS_POWER_UP_COOLDOWN,
  BOSS_POWER_UP_DURATIONS,
  BOATS,
  BOMBS,
  GUNS,
  POWER_UPS,
  ENEMY_CURRENCY_DROP,
  BOSS_CURRENCY_DROP,
  AMMO_DROP_CHANCE_ON_BOSS_HIT,
  AMMO_DROP_BASE_AMOUNT,
  AMMO_DROP_WIDTH,
  AMMO_DROP_HEIGHT,
  CURRENCY_DROP_WIDTH,
  CURRENCY_DROP_HEIGHT,
  ENEMY_XP_DROP,
  BOSS_XP_DROP_BASE,
  DAMAGE_BONUS_PER_LEVEL,
  INVINCIBILITY_DURATION,
  RAPID_FIRE_DURATION,
  TIME_SLOW_DURATION,
  GOLD_RUSH_DURATION,
  QTE_DODGE_DANGER_RADIUS,
  QTE_DODGE_COOLDOWN,
  QTE_DODGE_SLOW_MO_DURATION,
  QTE_DODGE_SLOW_MO_FACTOR,
  QTE_DODGE_SEQUENCE_LENGTH,
  QTE_DODGE_DISTANCE,
  AEGIS_LASER_COOLDOWN,
  AEGIS_LASER_DAMAGE,
  AEGIS_RETALIATION_PULSE_RADIUS,
  AEGIS_CURRENCY_BONUS,
  BATTLESHIP_SIDE_CANNON_COOLDOWN,
  BLACK_HOLE_DIRECT_DAMAGE_MODIFIER,
} from '../constants';
import HUD from './HUD';
import { generateInsult } from '../services/geminiService';
import { audioManager } from '../utils/audioManager';
import MobileControls from './MobileControls';

interface GameProps {
  startLevel: number;
  isMultiplayer: boolean;
  onGameOver: (scores: { p1: number, p2?: number }, xpEarned: number, finalPowerUpCount: number, currencyEarned: number) => void;
  onGameWon: (scores: { p1: number, p2?: number }, xpEarned: number, finalPowerUpCount: number, currencyEarned: number) => void;
  equippedBoatId: string;
  equippedBombId: string;
  equippedGunId: string | null;
  isPaused: boolean;
  onPause: () => void;
  playerLevel: number;
  playerXp: number;
  xpForNextLevel: number;
  equippedPowerUpId: string | null;
  ownedPowerUps: { [key: string]: number };
  settings: Settings;
}

const BOSS_PROJECTILE_MAP: { [key: string]: string } = {
  '🐙': '💧', '🦈': '🐟', '🦀': '⚪️', '🐡': '💥', '🦞': '🌊',
  '🐚': '⚪', '🦪': '⚫', '🦑': '⚡️', '🐍': '🧪', '👵': '🧶',
  '🦍': '🍌', '🦖': '☄️', '🐉': '🔥', '🦂': '☠️', '🕷️': '🕸️', 
  '🧙': '🪄', '🦅': '🌪️', '👁️': '🌀', '🐳': '💦', '👑': '💎',
  '🏺': '💨', '🪐': '💫', '🦾': '🔩', '🐺': '🦷', '🧊': '❄️', 
  '🌋': '🟠', '🌌': '✨', '👼': '🕊️', '⁉️': '❓', '⚫️': ' ',
};
const PLAYER_2_EMOJI = '🛶';
const EXPLOSION_DURATION = 400;

const ALL_BOSS_TYPES_FOR_RANDOM = LEVEL_CONFIGS.map(l => l.boss.type).slice(0, 28); // All bosses except ? and black hole

const Game: React.FC<GameProps> = ({ startLevel, isMultiplayer, onGameOver, onGameWon, equippedBoatId, equippedBombId, equippedGunId, isPaused, onPause, playerLevel, playerXp, xpForNextLevel, equippedPowerUpId, ownedPowerUps, settings }) => {
  const equippedBoat = BOATS.find(p => p.id === equippedBoatId)!;
  const equippedBomb = BOMBS.find(b => b.id === equippedBombId)!;
  const equippedGun = equippedGunId ? GUNS.find(g => g.id === equippedGunId) : null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const createPlayer = useCallback((id: number): Player => ({
    id: `player${id}`, playerId: id,
    x: id === 1 ? GAME_WIDTH / 2 - PLAYER_WIDTH * 1.5 : GAME_WIDTH / 2 + PLAYER_WIDTH * 0.5,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 20, width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
  }), []);

  const player1Ref = useRef<Player>(createPlayer(1));
  const player2Ref = useRef<Player | null>(isMultiplayer ? createPlayer(2) : null);
  const bombsRef = useRef<Bomb[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const ammoDropsRef = useRef<AmmoDrop[]>([]);
  const currencyDropsRef = useRef<CurrencyDrop[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const bossProjectilesRef = useRef<BossProjectile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const droneRef = useRef<Drone | null>(null);
  const droneBulletsRef = useRef<Bullet[]>([]);

  const [level, setLevel] = useState(startLevel);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [currentRunCurrency, setCurrentRunCurrency] = useState(0);
  const [currentRunXp, setCurrentRunXp] = useState(0);
  
  const [player1Hp, setPlayer1Hp] = useState(100);
  const [player1MaxHp, setPlayer1MaxHp] = useState(100);
  const [isPlayer1Dead, setIsPlayer1Dead] = useState(false);
  const [player2Hp, setPlayer2Hp] = useState(100);
  const [player2MaxHp, setPlayer2MaxHp] = useState(100);
  const [isPlayer2Dead, setIsPlayer2Dead] = useState(false);

  const [boss, setBoss] = useState<Boss | null>(null);
  const [isBossActive, setIsBossActive] = useState(false);
  const [bossInsult, setBossInsult] = useState('');
  const [isLoadingInsult, setIsLoadingInsult] = useState(false);
  const [isPlayer1Stunned, setIsPlayer1Stunned] = useState(false);
  const [isPlayer2Stunned, setIsPlayer2Stunned] = useState(false);
  const [p1Weapon, setP1Weapon] = useState<WeaponSelection>('bomb');
  const [p1Ammo, setP1Ammo] = useState(equippedGun?.maxAmmo || 0);
  const [p2Weapon, setP2Weapon] = useState<WeaponSelection>('bomb');
  const [p2Ammo, setP2Ammo] = useState(equippedGun?.maxAmmo || 0);
  const [powerUpCount, setPowerUpCount] = useState(0);
  const [isInvincible, setIsInvincible] = useState(false);
  const [isRapidFire, setIsRapidFire] = useState(false);
  const [rapidFireEndTime, setRapidFireEndTime] = useState(0);
  const [isTimeSlow, setIsTimeSlow] = useState(false);
  const [timeSlowEndTime, setTimeSlowEndTime] = useState(0);
  const [isGoldRush, setIsGoldRush] = useState(false);
  const [goldRushEndTime, setGoldRushEndTime] = useState(0);
  const [qteDodgeState, setQteDodgeState] = useState<QTEDodgeState | null>(null);

  const [isPlayer1Slowed, setIsPlayer1Slowed] = useState(false);
  const slowTimeoutP1 = useRef<number | null>(null);
  const [isPlayer1ControlsReversed, setIsPlayer1ControlsReversed] = useState(false);
  const controlsReversedTimeoutP1 = useRef<number | null>(null);
  const player1PushForce = useRef<{ dx: number; dy: number; endTime: number } | null>(null);
  const [isPlayer2Slowed, setIsPlayer2Slowed] = useState(false);
  const slowTimeoutP2 = useRef<number | null>(null);
  const [isPlayer2ControlsReversed, setIsPlayer2ControlsReversed] = useState(false);
  const controlsReversedTimeoutP2 = useRef<number | null>(null);
  const player2PushForce = useRef<{ dx: number; dy: number; endTime: number } | null>(null);

  const isInvincibleRef = useRef(isInvincible);
  useEffect(() => { isInvincibleRef.current = isInvincible; }, [isInvincible]);

  const keysPressed = useRef<Set<string>>(new Set());
  const lastFireTimeP1 = useRef(0);
  const lastFireTimeP2 = useRef(0);
  const lastSideCannonTimeP1 = useRef(0);
  const lastSideCannonTimeP2 = useRef(0);
  const lastAegisLaserTimeP1 = useRef(0);
  const lastAegisLaserTimeP2 = useRef(0);
  const lastBossShotTime = useRef(0);
  const lastBossPowerUpTime = useRef(0);
  const lastQteTriggerTimeP1 = useRef(0);
  const lastQteTriggerTimeP2 = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const bossDirection = useRef(1);
  const bossTargetRef = useRef<{ x: number, y: number } | null>(null);
  const snakeShotCounter = useRef(0);
  const stunTimeoutP1 = useRef<number | null>(null);
  const stunTimeoutP2 = useRef<number | null>(null);

  useEffect(() => {
    audioManager.playMusic();
    return () => {
      audioManager.stopMusic();
    };
  }, []);

  useEffect(() => {
    if (isPaused) {
        audioManager.pauseMusic();
    } else {
        audioManager.playMusic();
    }
  }, [isPaused]);


  const resetAllPlayerDebuffs = useCallback(() => {
    setIsPlayer1Slowed(false); if (slowTimeoutP1.current) clearTimeout(slowTimeoutP1.current);
    setIsPlayer1ControlsReversed(false); if (controlsReversedTimeoutP1.current) clearTimeout(controlsReversedTimeoutP1.current);
    player1PushForce.current = null;
    setIsPlayer1Stunned(false); if (stunTimeoutP1.current) clearTimeout(stunTimeoutP1.current);
    if(isMultiplayer) {
      setIsPlayer2Slowed(false); if (slowTimeoutP2.current) clearTimeout(slowTimeoutP2.current);
      setIsPlayer2ControlsReversed(false); if (controlsReversedTimeoutP2.current) clearTimeout(controlsReversedTimeoutP2.current);
      player2PushForce.current = null;
      setIsPlayer2Stunned(false); if (stunTimeoutP2.current) clearTimeout(stunTimeoutP2.current);
    }
  }, [isMultiplayer]);

  useEffect(() => {
    if (equippedPowerUpId) setPowerUpCount(ownedPowerUps[equippedPowerUpId] || 0);
  }, [equippedPowerUpId, ownedPowerUps]);

  useEffect(() => {
    const boat = BOATS.find(p => p.id === equippedBoatId)!;
    const maxHp = PLAYER_BASE_HP * boat.hpMultiplier;
    setPlayer1MaxHp(maxHp);
    setPlayer1Hp(maxHp);
    setIsPlayer1Dead(false);

    if (isMultiplayer) {
        setPlayer2MaxHp(maxHp);
        setPlayer2Hp(maxHp);
        setIsPlayer2Dead(false);
    }
  }, [equippedBoatId, isMultiplayer, startLevel]);

  useEffect(() => {
      if (player1Hp <= 0 && !isPlayer1Dead) {
          setIsPlayer1Dead(true);
          audioManager.playSfx('explosion');
          explosionsRef.current.push({ id: `player1-death`, x: player1Ref.current.x, y: player1Ref.current.y, startTime: Date.now(), emoji: '☠️' });
          player1Ref.current.x = -2000;
      }
      if (isMultiplayer && player2Hp <= 0 && !isPlayer2Dead) {
          setIsPlayer2Dead(true);
          audioManager.playSfx('explosion');
          explosionsRef.current.push({ id: `player2-death`, x: player2Ref.current.x!, y: player2Ref.current.y!, startTime: Date.now(), emoji: '☠️' });
          if(player2Ref.current) player2Ref.current.x = -2000;
      }
  }, [player1Hp, isPlayer1Dead, player2Hp, isPlayer2Dead, isMultiplayer]);

  useEffect(() => {
    const p1IsOutOfGame = isPlayer1Dead;
    const p2IsOutOfGame = isMultiplayer ? isPlayer2Dead : true;

    if (p1IsOutOfGame && p2IsOutOfGame && gameLoopRef.current) {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
        setTimeout(() => {
             onGameOver({ p1: score1, p2: isMultiplayer ? score2 : undefined }, currentRunXp, powerUpCount, currentRunCurrency);
        }, 1000);
    }
  }, [isPlayer1Dead, isPlayer2Dead, isMultiplayer, onGameOver, score1, score2, currentRunXp, powerUpCount, currentRunCurrency]);

  const levelConfig = LEVEL_CONFIGS[level - 1];

  const setupLevel = useCallback((currentLevel: number) => {
    const levelConfigForSetup = LEVEL_CONFIGS[currentLevel - 1];
    if (!levelConfigForSetup) return;

    setIsBossActive(false); setBoss(null);
    enemiesRef.current = []; bombsRef.current = []; bulletsRef.current = [];
    ammoDropsRef.current = []; currencyDropsRef.current = [];
    bossProjectilesRef.current = []; explosionsRef.current = [];
    droneRef.current = null; droneBulletsRef.current = [];
    bossTargetRef.current = null; snakeShotCounter.current = 0;
    lastBossPowerUpTime.current = 0;
    resetAllPlayerDebuffs();
    player1Ref.current = createPlayer(1);
    if(isMultiplayer) player2Ref.current = createPlayer(2);

    setIsTimeSlow(false); setTimeSlowEndTime(0);
    setIsGoldRush(false); setGoldRushEndTime(0);
    setIsRapidFire(false); setRapidFireEndTime(0);

    if (equippedGun) {
        setP1Ammo(equippedGun.maxAmmo);
        if (isMultiplayer) setP2Ammo(equippedGun.maxAmmo);
    }

    const newEnemies: Enemy[] = [];
    const enemyConfig = levelConfigForSetup.enemies;
    for (let i = 0; i < enemyConfig.count; i++) {
      newEnemies.push({
        id: `enemy-${Date.now()}-${i}`,
        x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
        y: -ENEMY_HEIGHT - Math.random() * 300,
        width: ENEMY_WIDTH, height: ENEMY_HEIGHT, type: enemyConfig.type,
      });
    }
    enemiesRef.current = newEnemies;
  }, [isMultiplayer, equippedGun, resetAllPlayerDebuffs, createPlayer]);

  useEffect(() => { setupLevel(level); }, [setupLevel, level]);

  const handleUsePowerUp = useCallback(() => {
    if (isPaused || !equippedPowerUpId || powerUpCount <= 0) return;
    const powerUp = POWER_UPS.find(p => p.id === equippedPowerUpId);
    if (!powerUp) return;

    audioManager.playSfx('powerUp');
    setPowerUpCount(c => c - 1);

    switch (powerUp.id) {
      case 'pw1': // Shield
        setIsInvincible(true);
        setTimeout(() => setIsInvincible(false), INVINCIBILITY_DURATION);
        break;
      case 'pw2': // Nuke
        const killedEnemies = enemiesRef.current;
        const killedCount = killedEnemies.length;
        if (killedCount > 0) {
          if (isMultiplayer) {
            setScore1(s => s + Math.ceil(killedCount / 2) * 100);
            setScore2(s => s + Math.floor(killedCount / 2) * 100);
          } else {
            setScore1(s => s + killedCount * 100);
          }
           const currencyMultiplier = isGoldRush ? 2 : 1;
           const baseAmount = ENEMY_CURRENCY_DROP * (equippedBoatId === 'p5' ? AEGIS_CURRENCY_BONUS : 1);
           killedEnemies.forEach(enemy => currencyDropsRef.current.push({
                id: `curr-nuke-${enemy.id}`,
                x: enemy.x + ENEMY_WIDTH / 2,
                y: enemy.y + ENEMY_HEIGHT / 2,
                width: CURRENCY_DROP_WIDTH, height: CURRENCY_DROP_HEIGHT,
                amount: baseAmount * currencyMultiplier,
                emoji: '💰'
           }));
          setCurrentRunXp(xp => xp + killedCount * ENEMY_XP_DROP);
          killedEnemies.forEach(enemy => explosionsRef.current.push({
            id: `explosion-nuke-${enemy.id}`,
            x: enemy.x + ENEMY_WIDTH / 2,
            y: enemy.y + ENEMY_HEIGHT / 2,
            startTime: Date.now(),
            emoji: '💥',
          }));
          audioManager.playSfx('explosion');
        }
        enemiesRef.current = [];
        break;
      case 'pw3': // Rapid Fire
        setIsRapidFire(true);
        setRapidFireEndTime(Date.now() + RAPID_FIRE_DURATION);
        setTimeout(() => setIsRapidFire(false), RAPID_FIRE_DURATION);
        break;
      case 'pw4': // Chrono Field
        setIsTimeSlow(true);
        setTimeSlowEndTime(Date.now() + TIME_SLOW_DURATION);
        setTimeout(() => setIsTimeSlow(false), TIME_SLOW_DURATION);
        break;
      case 'pw5': // Gold Rush
        setIsGoldRush(true);
        setGoldRushEndTime(Date.now() + GOLD_RUSH_DURATION);
        setTimeout(() => setIsGoldRush(false), GOLD_RUSH_DURATION);
        break;
      case 'pw6': // Wingman Drone
        if (!droneRef.current) {
            droneRef.current = {
                id: 'drone-1',
                x: player1Ref.current.x - 50,
                y: player1Ref.current.y,
                width: DRONE_WIDTH,
                height: DRONE_HEIGHT,
                emoji: '🤖',
                lastFireTime: 0,
            };
        }
        break;
       case 'pw7': // Repair Kit
        if (!isPlayer1Dead) setPlayer1Hp(hp => Math.min(player1MaxHp, hp + player1MaxHp * 0.5));
        if (isMultiplayer && !isPlayer2Dead) setPlayer2Hp(hp => Math.min(player2MaxHp, hp + player2MaxHp * 0.5));
        break;
    }
  }, [isPaused, equippedPowerUpId, powerUpCount, isMultiplayer, isGoldRush, equippedBoatId, isPlayer1Dead, isPlayer2Dead, player1MaxHp, player2MaxHp]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const now = Date.now();
    
    ctx.textBaseline = 'top';
    
    ctx.font = '40px sans-serif';
    enemiesRef.current.forEach(e => ctx.fillText(e.type, e.x, e.y));
    
    ctx.font = '30px sans-serif';
    ammoDropsRef.current.forEach(d => ctx.fillText(d.emoji, d.x, d.y));
    currencyDropsRef.current.forEach(d => ctx.fillText(d.emoji, d.x, d.y));

    ctx.font = '24px sans-serif';
    bombsRef.current.forEach(b => ctx.fillText(b.emoji, b.x, b.y));

    ctx.font = '38px sans-serif';
    ctx.fillStyle = '#fef08a';
    bulletsRef.current.forEach(b => ctx.fillText(b.emoji, b.x, b.y));
    ctx.fillStyle = '#a78bfa';
    droneBulletsRef.current.forEach(b => ctx.fillText(b.emoji, b.x, b.y));
    ctx.fillStyle = 'white';
    
    ctx.font = '24px sans-serif';
    bossProjectilesRef.current.forEach(p => {
        const emoji = p.isStun ? (boss?.type === '🕷️' ? '🕸️' : '✨') : (boss ? BOSS_PROJECTILE_MAP[boss.type] || '🔥' : '🔥');
        const size = p.health ? 24 + p.health * 4 : 24;
        ctx.font = `${size}px sans-serif`;
        ctx.fillText(emoji, p.x, p.y);
    });
    ctx.font = '24px sans-serif';

    if (boss && isBossActive) {
      ctx.save();
      if (boss.powerUp?.active && boss.powerUp.type === 'WIZARD_INVISIBILITY') ctx.globalAlpha = 0.3;
      if (boss.powerUp?.active && boss.powerUp.type === 'KING_DECREE') ctx.filter = 'drop-shadow(0 0 8px #fef08a)';
      if (boss.type === '⚫️') {
        const pulse = 1 + Math.sin(now / 500) * 0.05;
        ctx.font = `${80 * pulse}px sans-serif`;
      } else {
        ctx.font = '80px sans-serif';
      }
      ctx.fillText(boss.type, boss.x, boss.y);
      ctx.restore();
      if (boss.powerUp?.active && boss.powerUp.type === 'GORILLA_POUND') {
        const elapsed = now - boss.powerUp.startTime;
        const progress = elapsed / BOSS_POWER_UP_DURATIONS.GORILLA_POUND;
        if (progress < 1) {
            ctx.fillStyle = `rgba(255, 255, 100, ${0.6 - progress * 0.6})`;
            ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH * progress, 30);
            ctx.fillRect(GAME_WIDTH * (1 - progress), GAME_HEIGHT - 30, GAME_WIDTH * progress, 30);
        }
      }
      boss.subEntities?.forEach(sub => {
        const fontSize = sub.type === '🐺' ? '30px' : '40px';
        ctx.font = `${fontSize} sans-serif`;
        ctx.fillText(sub.type, sub.x, sub.y);
      });
    }

    if (droneRef.current) {
        ctx.font = '30px sans-serif';
        ctx.fillText(droneRef.current.emoji, droneRef.current.x, droneRef.current.y);
    }
    
    if (!isPlayer1Dead) {
        ctx.save();
        ctx.font = '48px sans-serif';
        if (isInvincible) ctx.filter = `drop-shadow(0 0 10px #0ff) drop-shadow(0 0 5px #0ff)`;
        ctx.fillText(equippedBoat.emoji, player1Ref.current.x, player1Ref.current.y);
        ctx.restore();
        if (isInvincible) {
            ctx.font = '70px sans-serif';
            ctx.globalAlpha = 0.5 + Math.sin(now / 150) * 0.2;
            ctx.fillText('🛡️', player1Ref.current.x - 10, player1Ref.current.y - 10);
            ctx.globalAlpha = 1.0;
        }
        ctx.font = '30px sans-serif';
        if (isPlayer1Stunned) ctx.fillText('⚡️', player1Ref.current.x + 12, player1Ref.current.y - 10);
        if (isPlayer1Slowed) ctx.fillText('🐌', player1Ref.current.x - 12, player1Ref.current.y + 30);
        if (isPlayer1ControlsReversed) ctx.fillText('❓', player1Ref.current.x + 12, player1Ref.current.y - 10);
    }
    
    if(isMultiplayer && player2Ref.current && !isPlayer2Dead) {
        ctx.save();
        ctx.font = '48px sans-serif';
        ctx.fillText(PLAYER_2_EMOJI, player2Ref.current.x, player2Ref.current.y);
        ctx.restore();
        ctx.font = '30px sans-serif';
        if (isPlayer2Stunned) ctx.fillText('⚡️', player2Ref.current.x + 12, player2Ref.current.y - 10);
        if (isPlayer2Slowed) ctx.fillText('🐌', player2Ref.current.x - 12, player2Ref.current.y + 30);
        if (isPlayer2ControlsReversed) ctx.fillText('❓', player2Ref.current.x + 12, player2Ref.current.y - 10);
    }

    explosionsRef.current.forEach(exp => {
        const progress = (now - exp.startTime) / EXPLOSION_DURATION;
        if (progress < 1) {
            const emoji = exp.emoji || '💥';
            const initialSize = emoji === '💨' ? 32 : (emoji === '✨' ? 96 : 48);
            const scale = 0.5 + progress;
            ctx.save();
            ctx.globalAlpha = 1 - progress;
            ctx.font = `${initialSize * scale}px sans-serif`;
            const size = initialSize * scale;
            ctx.fillText(emoji, exp.x - size / 2, exp.y - size / 2);
            ctx.restore();
        }
    });
    
    if (qteDodgeState) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 150, 255, 0.15)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const player = qteDodgeState.playerId === 1 ? player1Ref.current : player2Ref.current;
        if (player) {
            const displayX = player.x + PLAYER_WIDTH / 2;
            const displayY = player.y - 60;

            const timeElapsed = now - qteDodgeState.startTime;
            const timeRemaining = 1 - (timeElapsed / QTE_DODGE_SLOW_MO_DURATION);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(displayX - 80, displayY + 40, 160, 10);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(displayX - 80, displayY + 40, 160 * timeRemaining, 10);
            
            ctx.font = '40px sans-serif';
            ctx.textAlign = 'center';
            qteDodgeState.sequence.forEach((key, index) => {
                const keyDisplayMap: {[key: string]: string} = {
                    'w': '↑', 'a': '←', 's': '↓', 'd': '→',
                    'arrowup': '↑', 'arrowleft': '←', 'arrowdown': '↓', 'arrowright': '→'
                };
                
                if (index < qteDodgeState.currentIndex) {
                    ctx.fillStyle = '#4ade80';
                } else {
                    ctx.fillStyle = 'white';
                }
                ctx.fillText(keyDisplayMap[key] || key.toUpperCase(), displayX - 60 + (index * 40), displayY);
            });
        }
        ctx.restore();
    }

  }, [boss, isBossActive, equippedBoat.emoji, isInvincible, isPlayer1Stunned, isPlayer2Stunned, isMultiplayer, isPlayer1Slowed, isPlayer1ControlsReversed, isPlayer2Slowed, isPlayer2ControlsReversed, isPlayer1Dead, isPlayer2Dead, qteDodgeState]);
  
  const checkCollision = (a: {x:number, y:number, width:number, height:number}, b: {x:number, y:number, width:number, height:number}) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  };

  const gameLoop = useCallback(() => {
    const now = Date.now();
    let currentBoss = boss;
    const speedMultiplier = qteDodgeState ? QTE_DODGE_SLOW_MO_FACTOR : isTimeSlow ? 0.5 : 1;
    const damageBonus = 1 + (playerLevel - 1) * DAMAGE_BONUS_PER_LEVEL;
    const damageReduction = equippedBoat.damageReduction || 0;
    const damageMultiplier = 1 - damageReduction;

    if (qteDodgeState && now > qteDodgeState.startTime + QTE_DODGE_SLOW_MO_DURATION) {
        const playerToDamage = qteDodgeState.playerId === 1 ? 1 : 2;
        const finalDamage = HIT_DAMAGE * damageMultiplier;
        if (playerToDamage === 1) setPlayer1Hp(hp => Math.max(0, hp - finalDamage));
        else setPlayer2Hp(hp => Math.max(0, hp - finalDamage));

        if (qteDodgeState.entityType === 'projectile') {
            bossProjectilesRef.current = bossProjectilesRef.current.filter(p => p.id !== qteDodgeState.triggeringEntityId);
        } else {
            enemiesRef.current = enemiesRef.current.filter(e => e.id !== qteDodgeState.triggeringEntityId);
        }
        setQteDodgeState(null);
    }

    const blackHole = currentBoss?.type === '⚫️' ? currentBoss : null;
    const galaxy = currentBoss?.type === '🌌' ? currentBoss : null;

    const updatePlayerPosition = (player: Player, keys: { left: string, right: string, up: string, down: string }, pushForce: typeof player1PushForce.current, isSlowed: boolean, isReversed: boolean) => {
        let speed = isSlowed ? PLAYER_SPEED * 0.5 : PLAYER_SPEED;
        
        if (pushForce && now < pushForce.endTime) {
            player.x += pushForce.dx * speed * 0.8;
            player.y += pushForce.dy * speed * 0.8;
        }

        if (galaxy) {
            const dx = galaxy.x + BOSS_WIDTH / 2 - (player.x + PLAYER_WIDTH / 2);
            const dy = galaxy.y + BOSS_HEIGHT / 2 - (player.y + PLAYER_HEIGHT / 2);
            const distSq = dx * dx + dy * dy;
            if (distSq > 1) {
                const dist = Math.sqrt(distSq);
                const force = Math.min(2, 300 / distSq);
                player.x += (dx / dist) * force;
                player.y += (dy / dist) * force;
            }
        } else if (blackHole) {
            const dx = blackHole.x + BOSS_WIDTH / 2 - (player.x + PLAYER_WIDTH / 2);
            const dy = blackHole.y + BOSS_HEIGHT / 2 - (player.y + PLAYER_HEIGHT / 2);
            const distSq = dx * dx + dy * dy;
            if (distSq > 1 && distSq < 400 * 400) {
                const dist = Math.sqrt(distSq);
                const force = Math.min(4, 800 / distSq);
                player.x += (dx / dist) * force;
                player.y += (dy / dist) * force;
            }
        }

        const left = isReversed ? keys.right : keys.left;
        const right = isReversed ? keys.left : keys.right;

        if (keysPressed.current.has(left)) player.x -= speed;
        if (keysPressed.current.has(right)) player.x += speed;
        if (keysPressed.current.has(keys.up)) player.y -= speed;
        if (keysPressed.current.has(keys.down)) player.y += speed;

        player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, player.x));
        player.y = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_HEIGHT, player.y));
    };
    
    if(!isPlayer1Dead && !qteDodgeState) updatePlayerPosition(player1Ref.current, { left: 'a', right: 'd', up: 'w', down: 's'}, player1PushForce.current, isPlayer1Slowed, isPlayer1ControlsReversed);
    if(isMultiplayer && player2Ref.current && !isPlayer2Dead && !qteDodgeState) {
        updatePlayerPosition(player2Ref.current, { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown'}, player2PushForce.current, isPlayer2Slowed, isPlayer2ControlsReversed);
    }
   
    const applyGravity = (obj: {x:number, y:number}) => {
        if (blackHole) {
            const dx = blackHole.x + BOSS_WIDTH / 2 - obj.x;
            const dy = blackHole.y + BOSS_HEIGHT / 2 - obj.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > 1) {
                const dist = Math.sqrt(distSq);
                const force = 300 / distSq;
                return { dx: (dx / dist) * force, dy: (dy / dist) * force };
            }
        }
        return { dx: 0, dy: 0 };
    };

    bombsRef.current = bombsRef.current.map(b => {
      const gravity = applyGravity(b);
      return { ...b, x: b.x + gravity.dx, y: b.y - BOMB_SPEED * speedMultiplier + gravity.dy };
    }).filter(b => b.y > -BOMB_HEIGHT);

    bulletsRef.current = bulletsRef.current.map(b => {
      const gravity = applyGravity(b);
      return { ...b, x: b.x + gravity.dx, y: b.y - BULLET_SPEED * speedMultiplier + gravity.dy };
    }).filter(b => b.y > -BULLET_HEIGHT);
    
    droneBulletsRef.current = droneBulletsRef.current.map(b => {
      const gravity = applyGravity(b);
      return { ...b, x: b.x + gravity.dx, y: b.y - BULLET_SPEED * speedMultiplier + gravity.dy };
    }).filter(b => b.y > -BULLET_HEIGHT);

    enemiesRef.current = enemiesRef.current.map(e => ({ ...e, x: e.x + (e.dx || 0) * speedMultiplier, y: e.y + (e.dy || ENEMY_SPEED) * speedMultiplier })).filter(e => e.y < GAME_HEIGHT && e.x > -ENEMY_WIDTH && e.x < GAME_WIDTH);
    
    const updateDrops = <T extends AmmoDrop | CurrencyDrop>(drops: T[]): T[] => {
        return drops.map(d => {
            const newY = d.y + ENEMY_SPEED * 0.5 * speedMultiplier;
            const newX = d.x;
            return { ...d, y: newY, x: newX };
        }).filter(d => d.y < GAME_HEIGHT);
    };
    ammoDropsRef.current = updateDrops(ammoDropsRef.current);
    currencyDropsRef.current = updateDrops(currencyDropsRef.current);
    
    bossProjectilesRef.current = bossProjectilesRef.current
        .map(p => ({ ...p, x: p.x + (p.dx || 0) * speedMultiplier, y: p.y + (p.dy || BOSS_PROJECTILE_SPEED) * speedMultiplier, }))
        .filter(p => {
            const alive = !(p.lifetime && p.createdAt && now > p.createdAt + p.lifetime);
            const inBounds = p.y < GAME_HEIGHT && p.y > -BOSS_PROJECTILE_HEIGHT && p.x < GAME_WIDTH && p.x > -BOSS_PROJECTILE_WIDTH;
            return alive && inBounds;
        });
    explosionsRef.current = explosionsRef.current.filter(exp => (now - exp.startTime) < EXPLOSION_DURATION);

    if (droneRef.current) {
        const targetX = player1Ref.current.x - (DRONE_WIDTH + 10);
        const targetY = player1Ref.current.y;
        droneRef.current.x += (targetX - droneRef.current.x) * 0.1;
        droneRef.current.y += (targetY - droneRef.current.y) * 0.1;

        if (now - droneRef.current.lastFireTime > DRONE_FIRE_COOLDOWN) {
            droneRef.current.lastFireTime = now;
            droneBulletsRef.current.push({
                id: `dbullet-${now}`,
                playerId: 1,
                x: droneRef.current.x + DRONE_WIDTH / 2 - BULLET_WIDTH / 2,
                y: droneRef.current.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                damage: 1 * (1 + (playerLevel - 1) * DAMAGE_BONUS_PER_LEVEL),
                emoji: '•'
            });
        }
    }

    const bombDamage = equippedBomb.damage * damageBonus;
    const gunDamage = equippedGun ? equippedGun.damage * damageBonus : 0;
    const fireRateMultiplier = isRapidFire ? 2 : 1;
    const bombCooldown = (equippedBoatId === 'p5' ? BOMB_COOLDOWN * 0.75 : BOMB_COOLDOWN) / fireRateMultiplier;

    const fireWeapon = (playerRef: React.MutableRefObject<Player>, lastFireTimeRef: React.MutableRefObject<number>, weapon: WeaponSelection, setAmmo: (fn: (a: number) => number) => void, ammo: number) => {
        const player = playerRef.current;
        if (weapon === 'bomb' && now - lastFireTimeRef.current > bombCooldown) {
            lastFireTimeRef.current = now;
            const commonBombProps = { playerId: player.playerId, y: player.y, width: BOMB_WIDTH, height: BOMB_HEIGHT, damage: bombDamage, emoji: equippedBomb.emoji };
            bombsRef.current.push({ ...commonBombProps, id: `b-${now}-p${player.playerId}`, x: player.x + PLAYER_WIDTH/2 - BOMB_WIDTH/2 });
            audioManager.playSfx('shoot');
            return true;
        } else if (weapon === 'gun' && equippedGun && ammo > 0 && now - lastFireTimeRef.current > GUN_COOLDOWN / fireRateMultiplier) {
            lastFireTimeRef.current = now;
            bulletsRef.current.push({ id: `bu-${now}-p${player.playerId}`, playerId: player.playerId, x: player.x + PLAYER_WIDTH/2 - BULLET_WIDTH/2, y: player.y, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: gunDamage, emoji: equippedGun.emoji });
            setAmmo(a => a - 1);
            audioManager.playSfx('shoot');
            return true;
        }
        return false;
    }
    
    if (keysPressed.current.has(' ') && !isPlayer1Stunned && !isPlayer1Dead && !qteDodgeState) {
        fireWeapon(player1Ref, lastFireTimeP1, p1Weapon, setP1Ammo, p1Ammo);
    }
    if (isMultiplayer && player2Ref.current && keysPressed.current.has('/') && !isPlayer2Stunned && !isPlayer2Dead && !qteDodgeState) {
        fireWeapon(player2Ref, lastFireTimeP2, p2Weapon, setP2Ammo, p2Ammo);
    }

    if (equippedBoatId === 'p3') {
        if (now - lastSideCannonTimeP1.current > BATTLESHIP_SIDE_CANNON_COOLDOWN && !isPlayer1Dead) {
            lastSideCannonTimeP1.current = now;
            bulletsRef.current.push({ id: `bs-${now}-p1-l`, playerId: 1, x: player1Ref.current.x, y: player1Ref.current.y + PLAYER_HEIGHT / 2, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: 1 * damageBonus, emoji: '•' });
            bulletsRef.current.push({ id: `bs-${now}-p1-r`, playerId: 1, x: player1Ref.current.x + PLAYER_WIDTH - BULLET_WIDTH, y: player1Ref.current.y + PLAYER_HEIGHT / 2, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: 1 * damageBonus, emoji: '•' });
        }
        if (isMultiplayer && player2Ref.current && now - lastSideCannonTimeP2.current > BATTLESHIP_SIDE_CANNON_COOLDOWN && !isPlayer2Dead) {
            lastSideCannonTimeP2.current = now;
            bulletsRef.current.push({ id: `bs-${now}-p2-l`, playerId: 2, x: player2Ref.current.x, y: player2Ref.current.y + PLAYER_HEIGHT / 2, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: 1 * damageBonus, emoji: '•' });
            bulletsRef.current.push({ id: `bs-${now}-p2-r`, playerId: 2, x: player2Ref.current.x + PLAYER_WIDTH - BULLET_WIDTH, y: player2Ref.current.y + PLAYER_HEIGHT / 2, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: 1 * damageBonus, emoji: '•' });
        }
    }

    if (equippedBoatId === 'p5') {
        if (now - lastAegisLaserTimeP1.current > AEGIS_LASER_COOLDOWN && !isPlayer1Dead) {
            lastAegisLaserTimeP1.current = now;
            bulletsRef.current.push({ id: `al-${now}-p1-1`, playerId: 1, x: player1Ref.current.x, y: player1Ref.current.y + PLAYER_HEIGHT / 4, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: AEGIS_LASER_DAMAGE * damageBonus, emoji: '⚡️' });
            bulletsRef.current.push({ id: `al-${now}-p1-2`, playerId: 1, x: player1Ref.current.x + PLAYER_WIDTH - BULLET_WIDTH, y: player1Ref.current.y + PLAYER_HEIGHT / 4, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: AEGIS_LASER_DAMAGE * damageBonus, emoji: '⚡️' });
        }
        if (isMultiplayer && player2Ref.current && now - lastAegisLaserTimeP2.current > AEGIS_LASER_COOLDOWN && !isPlayer2Dead) {
            lastAegisLaserTimeP2.current = now;
            bulletsRef.current.push({ id: `al-${now}-p2-1`, playerId: 2, x: player2Ref.current.x, y: player2Ref.current.y + PLAYER_HEIGHT / 4, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: AEGIS_LASER_DAMAGE * damageBonus, emoji: '⚡️' });
            bulletsRef.current.push({ id: `al-${now}-p2-2`, playerId: 2, x: player2Ref.current.x + PLAYER_WIDTH - BULLET_WIDTH, y: player2Ref.current.y + PLAYER_HEIGHT / 4, width: BULLET_WIDTH, height: BULLET_HEIGHT, damage: AEGIS_LASER_DAMAGE * damageBonus, emoji: '⚡️' });
        }
    }
    
    if (isBossActive && currentBoss) {
        if (currentBoss.powerUp?.active && now > currentBoss.powerUp.endTime) {
            currentBoss.powerUp.active = false;
        }

       if (level >= 10 && !currentBoss.powerUp?.active && now - lastBossPowerUpTime.current > BOSS_POWER_UP_COOLDOWN) {
            lastBossPowerUpTime.current = now;
            let powerUpType = '';
            let duration = 0;
            switch (currentBoss.type) {
                case '👵': powerUpType = 'GRANDMA_YARN'; duration = BOSS_POWER_UP_DURATIONS.GRANDMA_YARN;
                    const yarnProjectile: BossProjectile = { id: `bproj-yarn-${now}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT, width: 40, height: 40, dx: (Math.random() > 0.5 ? 1 : -1) * BOSS_PROJECTILE_SPEED * 0.6, dy: BOSS_PROJECTILE_SPEED * 0.6, lifetime: duration };
                    bossProjectilesRef.current.push(yarnProjectile);
                    break;
                case '🦍': powerUpType = 'GORILLA_POUND'; duration = BOSS_POWER_UP_DURATIONS.GORILLA_POUND; break;
                case '🦖': powerUpType = 'TREX_ROAR'; duration = BOSS_POWER_UP_DURATIONS.TREX_ROAR;
                    player1PushForce.current = { dx: 0, dy: 2, endTime: now + duration };
                    if (isMultiplayer) player2PushForce.current = { dx: 0, dy: 2, endTime: now + duration };
                    break;
                case '🐉': powerUpType = 'DRAGON_BREATH'; duration = BOSS_POWER_UP_DURATIONS.DRAGON_BREATH; break;
                case '🦂': powerUpType = 'SCORPION_SLOW'; duration = BOSS_POWER_UP_DURATIONS.SCORPION_SLOW;
                    const poisonProjectile: BossProjectile = { id: `bproj-poison-${now}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT, width: BOSS_PROJECTILE_WIDTH, height: BOSS_PROJECTILE_HEIGHT, isStun: true, stunDuration: duration, dy: BOSS_PROJECTILE_SPEED * 1.5 };
                    bossProjectilesRef.current.push(poisonProjectile);
                    break;
                case '🕷️': powerUpType = 'SPIDER_COCOON'; duration = BOSS_POWER_UP_DURATIONS.SPIDER_COCOON;
                    const targetPlayerSpider = !player2Ref.current || Math.random() < 0.5 ? player1Ref.current : player2Ref.current;
                    const dirX = (targetPlayerSpider.x + PLAYER_WIDTH / 2) - (currentBoss.x + BOSS_WIDTH / 2);
                    const dirY = (targetPlayerSpider.y + PLAYER_HEIGHT / 2) - (currentBoss.y + BOSS_HEIGHT / 2);
                    const len = Math.sqrt(dirX * dirX + dirY * dirY);
                    const cocoonProjectile: BossProjectile = { id: `bproj-cocoon-${now}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT, width: 30, height: 30, isStun: true, stunDuration: duration, dx: (dirX / len) * BOSS_PROJECTILE_SPEED, dy: (dirY / len) * BOSS_PROJECTILE_SPEED };
                    bossProjectilesRef.current.push(cocoonProjectile);
                    break;
                case '🧙': powerUpType = 'WIZARD_INVISIBILITY'; duration = BOSS_POWER_UP_DURATIONS.WIZARD_INVISIBILITY; break;
                case '🦅': powerUpType = 'EAGLE_GUST'; duration = BOSS_POWER_UP_DURATIONS.EAGLE_GUST;
                    const direction = Math.random() < 0.5 ? -1 : 1;
                    player1PushForce.current = { dx: direction, dy: 0, endTime: now + duration };
                    if (isMultiplayer) player2PushForce.current = { dx: direction, dy: 0, endTime: now + duration };
                    break;
                case '👁️': powerUpType = 'EYE_HYPNOSIS'; duration = BOSS_POWER_UP_DURATIONS.EYE_HYPNOSIS;
                    setIsPlayer1ControlsReversed(true); if(controlsReversedTimeoutP1.current) clearTimeout(controlsReversedTimeoutP1.current); controlsReversedTimeoutP1.current = window.setTimeout(() => setIsPlayer1ControlsReversed(false), duration);
                    if (isMultiplayer) { setIsPlayer2ControlsReversed(true); if(controlsReversedTimeoutP2.current) clearTimeout(controlsReversedTimeoutP2.current); controlsReversedTimeoutP2.current = window.setTimeout(() => setIsPlayer2ControlsReversed(false), duration); }
                    break;
                case '🐳': powerUpType = 'WHALE_MINIONS'; duration = BOSS_POWER_UP_DURATIONS.WHALE_MINIONS;
                    for (let i = 0; i < 3; i++) { enemiesRef.current.push({ id: `minion-${now}-${i}`, x: currentBoss.x, y: currentBoss.y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT, type: '🐠' }); }
                    break;
                case '👑': powerUpType = 'KING_DECREE'; duration = BOSS_POWER_UP_DURATIONS.KING_DECREE; break;
            }
            if(powerUpType) setBoss(b => b ? { ...b, powerUp: { type: powerUpType, active: true, endTime: now + duration, startTime: now } } : null);
       }
        
       if (currentBoss.powerUp?.active && currentBoss.powerUp.type === 'DRAGON_BREATH') {
            if (now % 100 < 50) {
                const sweepAngle = Math.sin(now * 0.001) * (Math.PI / 4);
                bossProjectilesRef.current.push({ id: `bproj-breath-${now}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT, width: 15, height: 15, dx: Math.sin(sweepAngle) * BOSS_PROJECTILE_SPEED, dy: Math.cos(sweepAngle) * BOSS_PROJECTILE_SPEED, lifetime: 800 });
            }
       }

       if (currentBoss.type === '👵') {
            const activePlayer = player2Ref.current || player1Ref.current;
            const MIN_BOSS_DISTANCE = 200;
            if (!bossTargetRef.current || (Math.abs(currentBoss.x - bossTargetRef.current.x) < BOSS_SPEED && Math.abs(currentBoss.y - bossTargetRef.current.y) < BOSS_SPEED)) {
                let targetX = 0, targetY = 0; let isValidTarget = false;
                while (!isValidTarget) {
                    targetX = Math.random() * (GAME_WIDTH - BOSS_WIDTH);
                    targetY = 50 + Math.random() * (GAME_HEIGHT / 2 - BOSS_HEIGHT - 50);
                    const distToPlayer = Math.sqrt(Math.pow(targetX - activePlayer.x, 2) + Math.pow(targetY - activePlayer.y, 2));
                    if (distToPlayer > MIN_BOSS_DISTANCE) isValidTarget = true;
                }
                bossTargetRef.current = { x: targetX, y: targetY };
            }
            const target = bossTargetRef.current; const dirX = target.x - currentBoss.x; const dirY = target.y - currentBoss.y; const len = Math.sqrt(dirX * dirX + dirY * dirY);
            if (len > BOSS_SPEED) { currentBoss.x += (dirX / len) * BOSS_SPEED * speedMultiplier; currentBoss.y += (dirY / len) * BOSS_SPEED * speedMultiplier; } else { currentBoss.x = target.x; currentBoss.y = target.y; }
        } else if (['🧙', '🏺', '⚫️'].includes(currentBoss.type)) {
        } else if (currentBoss.type === '🐺') {
            const targetX = player1Ref.current.x;
            if (Math.abs(targetX - currentBoss.x) > PLAYER_WIDTH) {
                currentBoss.x += Math.sign(targetX - currentBoss.x) * BOSS_SPEED * 0.5 * speedMultiplier;
            }
        } else {
            let newBossX = currentBoss.x + BOSS_SPEED * bossDirection.current * speedMultiplier;
            if (newBossX <= 0 || newBossX >= GAME_WIDTH - BOSS_WIDTH) bossDirection.current *= -1;
            currentBoss.x = newBossX;
        }

        let currentCooldown = BOSS_SHOOT_COOLDOWN;
        if (level >= 2 && level <= 5) currentCooldown *= 0.8;
        if (level >= 6 && level <= 9) currentCooldown *= 0.6;
        if (level >= 10) currentCooldown *= 0.5;
        if (['👵', '👑', '⁉️', '👼'].includes(currentBoss.type)) currentCooldown /= 2;
        if (currentBoss.powerUp?.active && currentBoss.powerUp.type === 'KING_DECREE') currentCooldown /= 2;

        if (now - lastBossShotTime.current > currentCooldown) {
            lastBossShotTime.current = now;
            const projectilesToCreate: BossProjectile[] = [];
            const baseProjectile = { y: currentBoss.y + BOSS_HEIGHT, width: BOSS_PROJECTILE_WIDTH, height: BOSS_PROJECTILE_HEIGHT, createdAt: now };

            const executeAttack = (attackType: string) => {
                let targetPlayer: Player | null = null;
                const canTargetP1 = !isPlayer1Dead;
                const canTargetP2 = isMultiplayer && player2Ref.current && !isPlayer2Dead;
                if (canTargetP1 && canTargetP2) { targetPlayer = Math.random() < 0.5 ? player1Ref.current : player2Ref.current!; }
                else if (canTargetP1) { targetPlayer = player1Ref.current; }
                else if (canTargetP2) { targetPlayer = player2Ref.current!; }

                switch (attackType) {
                    case '🐙': {
                        if (targetPlayer) {
                            const pCenterX = targetPlayer.x + PLAYER_WIDTH / 2;
                            const bCenterX = currentBoss.x + BOSS_WIDTH / 2;
                            const dirX = pCenterX - bCenterX;
                            const dirY = (targetPlayer.y + PLAYER_HEIGHT / 2) - (currentBoss.y + BOSS_HEIGHT / 2);
                            const len = Math.sqrt(dirX * dirX + dirY * dirY);
                            if (len > 0) {
                                projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-homing`, x: currentBoss.x + BOSS_WIDTH / 2 - BOSS_PROJECTILE_WIDTH / 2, dx: (dirX / len) * BOSS_PROJECTILE_SPEED, dy: (dirY / len) * BOSS_PROJECTILE_SPEED });
                            }
                        } else {
                            projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}`, x: currentBoss.x + BOSS_WIDTH / 2 });
                        }
                        break;
                    }
                    case '🦈': {
                        if (targetPlayer) {
                            const pCenterX = targetPlayer.x + PLAYER_WIDTH / 2;
                            const bCenterX = currentBoss.x + BOSS_WIDTH / 2;
                            const dirX = pCenterX - bCenterX;
                            const dirY = (targetPlayer.y + PLAYER_HEIGHT / 2) - (currentBoss.y + BOSS_HEIGHT / 2);
                            const len = Math.sqrt(dirX * dirX + dirY * dirY);
                            if (len > 0) {
                                const mainDx = (dirX / len) * BOSS_PROJECTILE_SPEED;
                                const mainDy = (dirY / len) * BOSS_PROJECTILE_SPEED;
                                const spreadAngle = 0.4;
                                projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-0`, x: currentBoss.x + BOSS_WIDTH / 2, dx: mainDx, dy: mainDy });
                                const dx1 = mainDx * Math.cos(spreadAngle) - mainDy * Math.sin(spreadAngle);
                                const dy1 = mainDx * Math.sin(spreadAngle) + mainDy * Math.cos(spreadAngle);
                                projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-1`, x: currentBoss.x + BOSS_WIDTH / 2, dx: dx1, dy: dy1 });
                                const dx2 = mainDx * Math.cos(-spreadAngle) - mainDy * Math.sin(-spreadAngle);
                                const dy2 = mainDx * Math.sin(-spreadAngle) + mainDy * Math.cos(-spreadAngle);
                                projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-2`, x: currentBoss.x + BOSS_WIDTH / 2, dx: dx2, dy: dy2 });
                            }
                        } else {
                             for (let i = -1; i <= 1; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2 - BOSS_PROJECTILE_WIDTH / 2, dx: i * (BOSS_PROJECTILE_SPEED * 0.5), dy: BOSS_PROJECTILE_SPEED, });
                        }
                        break;
                    }
                    case '🦀': {
                        if (targetPlayer) {
                            const pCenterX = targetPlayer.x + PLAYER_WIDTH / 2;
                            const pCenterY = targetPlayer.y + PLAYER_HEIGHT / 2;
                            const bLeftX = currentBoss.x + 10;
                            const dirX1 = pCenterX - bLeftX;
                            const dirY1 = pCenterY - (currentBoss.y + BOSS_HEIGHT / 2);
                            const len1 = Math.sqrt(dirX1*dirX1 + dirY1*dirY1);
                            if (len1 > 0) {
                                 projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-1`, x: bLeftX, dx: (dirX1 / len1) * BOSS_PROJECTILE_SPEED, dy: (dirY1 / len1) * BOSS_PROJECTILE_SPEED });
                            }
                            const bRightX = currentBoss.x + BOSS_WIDTH - BOSS_PROJECTILE_WIDTH - 10;
                            const dirX2 = pCenterX - bRightX;
                            const dirY2 = pCenterY - (currentBoss.y + BOSS_HEIGHT / 2);
                            const len2 = Math.sqrt(dirX2*dirX2 + dirY2*dirY2);
                             if (len2 > 0) {
                                 projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-2`, x: bRightX, dx: (dirX2 / len2) * BOSS_PROJECTILE_SPEED, dy: (dirY2 / len2) * BOSS_PROJECTILE_SPEED });
                            }
                        } else {
                            projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-1`, x: currentBoss.x + 10 });
                            projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-2`, x: currentBoss.x + BOSS_WIDTH - BOSS_PROJECTILE_WIDTH - 10 });
                        }
                        break;
                    }
                    case '🐡': {
                        if (targetPlayer) {
                            const pCenterX = targetPlayer.x + PLAYER_WIDTH / 2;
                            const bCenterX = currentBoss.x + BOSS_WIDTH / 2;
                            const dirX = pCenterX - bCenterX;
                            const dirY = (targetPlayer.y + PLAYER_HEIGHT / 2) - (currentBoss.y + BOSS_HEIGHT / 2);
                            const len = Math.sqrt(dirX * dirX + dirY * dirY);
                            if (len > 0) {
                                const mainDx = (dirX / len) * BOSS_PROJECTILE_SPEED;
                                const mainDy = (dirY / len) * BOSS_PROJECTILE_SPEED;
                                const spreadAngle = 0.2; // radians for spread

                                // Fires a 5-shot spread instead of a single projectile
                                for (let i = -2; i <= 2; i++) {
                                    const angle = i * spreadAngle;
                                    const dx = mainDx * Math.cos(angle) - mainDy * Math.sin(angle);
                                    const dy = mainDx * Math.sin(angle) + mainDy * Math.cos(angle);
                                    projectilesToCreate.push({
                                        ...baseProjectile,
                                        id: `bproj-${now}-${i}`,
                                        x: currentBoss.x + BOSS_WIDTH / 2 - BOSS_PROJECTILE_WIDTH / 2,
                                        dx,
                                        dy,
                                    });
                                }
                            }
                        }
                        break;
                    }
                    case '🦞': for (let i = 0; i < 3; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2 - BOSS_PROJECTILE_WIDTH / 2, y: baseProjectile.y + (i * 40), dy: BOSS_PROJECTILE_SPEED * 1.2, }); break;
                    case '🐚': for (let i = 0; i < 2; i++) { const angle = (snakeShotCounter.current / 8) * (2 * Math.PI) + (i * Math.PI); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.cos(angle) * BOSS_PROJECTILE_SPEED, dy: Math.sin(angle) * BOSS_PROJECTILE_SPEED, }); } snakeShotCounter.current++; break;
                    case '🦪': projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-mid`, x: currentBoss.x + BOSS_WIDTH / 2, dy: BOSS_PROJECTILE_SPEED * 0.7 }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-left`, x: currentBoss.x, dy: BOSS_PROJECTILE_SPEED * 1.4 }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-right`, x: currentBoss.x + BOSS_WIDTH - BOSS_PROJECTILE_WIDTH, dy: BOSS_PROJECTILE_SPEED * 1.4 }); break;
                    case '🦑': for (let i = 0; i < 8; i++) { const angle = (i / 8) * 2 * Math.PI; projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.cos(angle) * BOSS_PROJECTILE_SPEED, dy: Math.sin(angle) * BOSS_PROJECTILE_SPEED, }); } break;
                    case '🐍': snakeShotCounter.current = (snakeShotCounter.current + 1); const wave = Math.sin(snakeShotCounter.current * 0.3) * (GAME_WIDTH / 3); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-1`, x: currentBoss.x + BOSS_WIDTH / 2 + wave }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-2`, x: currentBoss.x + BOSS_WIDTH / 2 - wave, y: baseProjectile.y + 30 }); break;
                    case '👵': { 
                        if (targetPlayer) {
                            const projectile: BossProjectile = { ...baseProjectile, id: `bproj-${now}`, x: currentBoss.x + BOSS_WIDTH / 2 };
                            const pCenterX_g = targetPlayer.x + PLAYER_WIDTH / 2, pCenterY_g = targetPlayer.y + PLAYER_HEIGHT / 2;
                            const bCenterX_g = currentBoss.x + BOSS_WIDTH / 2, bCenterY_g = currentBoss.y + BOSS_HEIGHT / 2;
                            const dirX_g = pCenterX_g - bCenterX_g, dirY_g = pCenterY_g - bCenterY_g;
                            const len_g = Math.sqrt(dirX_g * dirX_g + dirY_g * dirY_g);
                            if (len_g > 0) {
                                projectile.dx = (dirX_g / len_g) * BOSS_PROJECTILE_SPEED;
                                projectile.dy = (dirY_g / len_g) * BOSS_PROJECTILE_SPEED;
                            }
                            projectilesToCreate.push(projectile);
                        }
                        break; 
                    }
                    case '🦍': for (let i = -1; i <= 1; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, dx: i * (BOSS_PROJECTILE_SPEED * 0.4), dy: BOSS_PROJECTILE_SPEED * (1 - Math.abs(i) * 0.2), }); break;
                    case '🦖': projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}`, x: currentBoss.x + BOSS_WIDTH / 2, dy: BOSS_PROJECTILE_SPEED * 1.8 }); break;
                    case '🐉': snakeShotCounter.current++; const sweepAngle = Math.sin(snakeShotCounter.current * 0.1) * (Math.PI / 2.5); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.sin(sweepAngle) * BOSS_PROJECTILE_SPEED, dy: Math.cos(sweepAngle) * BOSS_PROJECTILE_SPEED, }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-2`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.sin(sweepAngle + Math.PI) * BOSS_PROJECTILE_SPEED, dy: Math.cos(sweepAngle + Math.PI) * BOSS_PROJECTILE_SPEED, }); break;
                    case '🦂': snakeShotCounter.current++; const attackPhaseScorpion = snakeShotCounter.current % 3; if (attackPhaseScorpion === 0) { const targetPlayerScorpion = !player2Ref.current || Math.random() < 0.5 ? player1Ref.current : player2Ref.current; const pCenterX_s = targetPlayerScorpion.x + PLAYER_WIDTH / 2; const bCenterX_s = currentBoss.x + BOSS_WIDTH / 2; const dirX_s = pCenterX_s - bCenterX_s; const dirY_s = (targetPlayerScorpion.y + PLAYER_HEIGHT / 2) - (currentBoss.y + BOSS_HEIGHT / 2); const len_s = Math.sqrt(dirX_s * dirX_s + dirY_s * dirY_s); if (len_s > 0) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-homing`, x: currentBoss.x + BOSS_WIDTH / 2, dx: (dirX_s / len_s) * BOSS_PROJECTILE_SPEED * 1.2, dy: (dirY_s / len_s) * BOSS_PROJECTILE_SPEED * 1.2, }); } else if (attackPhaseScorpion === 1) { projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-pincer-left`, x: currentBoss.x, dx: BOSS_PROJECTILE_SPEED * 0.5, dy: BOSS_PROJECTILE_SPEED * 0.9 }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-pincer-right`, x: currentBoss.x + BOSS_WIDTH - BOSS_PROJECTILE_WIDTH, dx: -BOSS_PROJECTILE_SPEED * 0.5, dy: BOSS_PROJECTILE_SPEED * 0.9 }); } else { for (let i = -1; i <= 1; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-whip-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, dx: i * (BOSS_PROJECTILE_SPEED * 0.2), dy: BOSS_PROJECTILE_SPEED * 1.5 }); } break;
                    case '🕷️': projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-stun`, x: currentBoss.x + BOSS_WIDTH / 2, isStun: true, stunDuration: 500 }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-left`, x: currentBoss.x, dx: -BOSS_PROJECTILE_SPEED * 0.5 }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-right`, x: currentBoss.x + BOSS_WIDTH - BOSS_PROJECTILE_WIDTH, dx: BOSS_PROJECTILE_SPEED * 0.5 }); break;
                    case '🧙': currentBoss.x = Math.random() * (GAME_WIDTH - BOSS_WIDTH); for (let i = -1; i <= 1; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, dx: i * (BOSS_PROJECTILE_SPEED * 0.5), dy: BOSS_PROJECTILE_SPEED, }); break;
                    case '🦅': for (let i = -2; i <= 2; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, dx: i * (BOSS_PROJECTILE_SPEED * 0.3), dy: BOSS_PROJECTILE_SPEED * (1.2 - Math.abs(i) * 0.1), }); break;
                    case '👁️': const beamX = currentBoss.x + BOSS_WIDTH / 2; for (let i = 0; i < 20; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: beamX, y: currentBoss.y + BOSS_HEIGHT + (i * BOSS_PROJECTILE_HEIGHT), dx: 0, dy: 0, lifetime: 500 }); break;
                    case '🐳': for (let i = 0; i < 10; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: Math.random() * GAME_WIDTH, y: -BOSS_PROJECTILE_HEIGHT - (Math.random() * 200), dy: BOSS_PROJECTILE_SPEED * 1.1 }); break;
                    case '👑': snakeShotCounter.current++; const attackPhase = snakeShotCounter.current % 4; if (attackPhase === 0) { projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-stun`, x: currentBoss.x + BOSS_WIDTH / 2, isStun: true, stunDuration: 500 }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-left`, x: currentBoss.x, dx: -BOSS_PROJECTILE_SPEED * 0.5 }); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-right`, x: currentBoss.x + BOSS_WIDTH - BOSS_PROJECTILE_WIDTH, dx: BOSS_PROJECTILE_SPEED * 0.5 }); } else if (attackPhase === 1) { for (let i = -2; i <= 2; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, dx: i * (BOSS_PROJECTILE_SPEED * 0.3), dy: BOSS_PROJECTILE_SPEED * (1.2 - Math.abs(i) * 0.1), }); } else if (attackPhase === 2) { for (let i = 0; i < 8; i++) { const angle = (i / 8) * 2 * Math.PI; projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.cos(angle) * BOSS_PROJECTILE_SPEED, dy: Math.sin(angle) * BOSS_PROJECTILE_SPEED, }); } } else { for (let i = 0; i < 10; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: Math.random() * GAME_WIDTH, y: -BOSS_PROJECTILE_HEIGHT - (Math.random() * 200), dy: BOSS_PROJECTILE_SPEED * 1.1 }); } break;
                }
            };
            
            switch (currentBoss.type) {
                case '🏺': currentBoss.x = Math.random() * (GAME_WIDTH - BOSS_WIDTH); for (let i = 0; i < 12; i++) { const angle = (i / 12) * 2 * Math.PI + (snakeShotCounter.current * 0.1); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.cos(angle) * BOSS_PROJECTILE_SPEED, dy: Math.sin(angle) * BOSS_PROJECTILE_SPEED, }); } snakeShotCounter.current++; break;
                case '🪐': for (let i = 0; i < 16; i++) { const angle = (i / 16) * 2 * Math.PI; projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.cos(angle) * BOSS_PROJECTILE_SPEED * 0.8, dy: Math.sin(angle) * BOSS_PROJECTILE_SPEED * 0.8, lifetime: 2000 }); } projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-center`, x: currentBoss.x + BOSS_WIDTH / 2, dy: BOSS_PROJECTILE_SPEED * 1.5, width: 40, height: 40 }); break;
                case '🦾': for (let i = -3; i <= 3; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, dx: i * BOSS_PROJECTILE_SPEED * 0.2, dy: BOSS_PROJECTILE_SPEED * 1.3 }); currentBoss.y += 30; setTimeout(() => setBoss(b => b ? {...b, y: b.y - 30 } : null), 200); break;
                case '🐺': if (!currentBoss.subEntities || currentBoss.subEntities.length === 0) { currentBoss.subEntities = [ { id: 'spirit-1', x: currentBoss.x - 50, y: currentBoss.y, type: '🐺', width: 30, height: 30 }, { id: 'spirit-2', x: currentBoss.x + BOSS_WIDTH + 20, y: currentBoss.y, type: '🐺', width: 30, height: 30 }]; } currentBoss.subEntities?.forEach(spirit => projectilesToCreate.push({ ...baseProjectile, id: `bproj-spirit-${spirit.id}-${now}`, x: spirit.x, y: spirit.y, dy: BOSS_PROJECTILE_SPEED * 0.8 })); projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}`, x: currentBoss.x + BOSS_WIDTH / 2 }); break;
                case '🧊': if (Math.random() > 0.3) { for (let i = -1; i <= 1; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, dx: i * (BOSS_PROJECTILE_SPEED * 0.2), dy: BOSS_PROJECTILE_SPEED, isStun: true, stunDuration: 2000 }); } else { projectilesToCreate.push({ ...baseProjectile, id: `bproj-shatter-${now}`, x: currentBoss.x + BOSS_WIDTH / 2, dy: BOSS_PROJECTILE_SPEED * 0.5, health: 5 }); } break;
                case '🌋': for (let i = 0; i < 15; i++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: Math.random() * GAME_WIDTH, y: -BOSS_PROJECTILE_HEIGHT - (Math.random() * 300), dy: BOSS_PROJECTILE_SPEED * (1 + Math.random()) }); break;
                case '🌌': for (let i = 0; i < 6; i++) { const angle = (now * 0.001) + (i / 6) * 2 * Math.PI; projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}`, x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2, dx: Math.cos(angle) * BOSS_PROJECTILE_SPEED, dy: Math.sin(angle) * BOSS_PROJECTILE_SPEED }); } break;
                case '👼': for (let i = 0; i < 3; i++) { const beamX = 100 + i * (GAME_WIDTH-200)/2; for(let j=0; j<20; j++) projectilesToCreate.push({ ...baseProjectile, id: `bproj-${now}-${i}-${j}`, x: beamX, y: currentBoss.y + BOSS_HEIGHT + (j * BOSS_PROJECTILE_HEIGHT), dx: Math.sin(now/1000 + i) * 2, dy: 0, lifetime: 1000 }); } break;
                case '⁉️': if (!currentBoss.attackState?.currentAttack || now > currentBoss.attackState.attackEndTime) { const randomAttack = ALL_BOSS_TYPES_FOR_RANDOM[Math.floor(Math.random() * ALL_BOSS_TYPES_FOR_RANDOM.length)]; currentBoss.attackState = { currentAttack: randomAttack, attackEndTime: now + 3000 }; } executeAttack(currentBoss.attackState.currentAttack); break;
                case '⚫️': if (currentBoss.subEntities?.length < 5) { currentBoss.subEntities.push({ id: `fragment-${now}`, type: '🌟', x: Math.random() * GAME_WIDTH, y: Math.random() * (GAME_HEIGHT-100) + 100, width: 40, height: 40, health: 1 }); } break;
                
                default:
                   executeAttack(currentBoss.type);
                   break;
            }
            bossProjectilesRef.current.push(...projectilesToCreate);
        }

        if (currentBoss.subEntities && currentBoss.subEntities.length > 0) {
            switch(currentBoss.type) {
                case '🐺':
                    currentBoss.subEntities[0].x = currentBoss.x - 50; currentBoss.subEntities[0].y = currentBoss.y;
                    currentBoss.subEntities[1].x = currentBoss.x + BOSS_WIDTH + 20; currentBoss.subEntities[1].y = currentBoss.y;
                    break;
                case '⚫️':
                    currentBoss.subEntities = currentBoss.subEntities.filter(frag => {
                       if (frag.health <= 0) {
                          const dx = (currentBoss.x + BOSS_WIDTH/2) - frag.x;
                          const dy = (currentBoss.y + BOSS_HEIGHT/2) - frag.y;
                          const len = Math.sqrt(dx*dx + dy*dy);
                          frag.x += (dx/len) * 15; frag.y += (dy/len) * 15;
                          if (len < 50) {
                              currentBoss.health -= 50;
                              explosionsRef.current.push({ id: `exp-frag-${frag.id}`, x: frag.x, y: frag.y, startTime: now, emoji: '✨' });
                              return false;
                          }
                       }
                       return true;
                    });
                    break;
            }
        }
        
        if (currentBoss.type === '👼') {
            if (now - (currentBoss.lastDamagedTime || 0) > 3000) {
                currentBoss.health = Math.min(currentBoss.maxHealth, currentBoss.health + 0.5);
            }
        }
    }
    
    if (!isInvincibleRef.current) {
        let damageToP1 = 0;
        let damageToP2 = 0;
        const enemiesToRemove = new Set<string>();
        const projectilesToRemove = new Set<string>();

        const checkAndTriggerQTE = (player: Player, threat: Enemy | BossProjectile, entityType: 'enemy' | 'projectile', lastQteTimeRef: React.MutableRefObject<number>): boolean => {
            if (equippedBoatId !== 'p5' || qteDodgeState || now - lastQteTimeRef.current < QTE_DODGE_COOLDOWN) {
                return false;
            }
            
            const dangerZone = {
                x: player.x + PLAYER_WIDTH / 2 - QTE_DODGE_DANGER_RADIUS,
                y: player.y + PLAYER_HEIGHT / 2 - QTE_DODGE_DANGER_RADIUS,
                width: QTE_DODGE_DANGER_RADIUS * 2,
                height: QTE_DODGE_DANGER_RADIUS * 2,
            };

            if (checkCollision(dangerZone, threat)) {
                lastQteTimeRef.current = now;
                const p1Keys = ['w', 'a', 's', 'd'];
                const p2Keys = ['arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
                const keySet = player.playerId === 1 ? p1Keys : p2Keys;
                const sequence = Array.from({ length: QTE_DODGE_SEQUENCE_LENGTH }, () => keySet[Math.floor(Math.random() * keySet.length)]);
                
                setQteDodgeState({
                    isActive: true,
                    startTime: now,
                    sequence,
                    currentIndex: 0,
                    playerId: player.playerId,
                    triggeringEntityId: threat.id,
                    entityType,
                });
                return true;
            }
            return false;
        };

        for (const enemy of enemiesRef.current) {
            let wasQteTriggered = false;
            if (!isPlayer1Dead && !wasQteTriggered) {
                if (checkAndTriggerQTE(player1Ref.current, enemy, 'enemy', lastQteTriggerTimeP1)) {
                    wasQteTriggered = true;
                } else if (checkCollision(player1Ref.current, enemy)) {
                    damageToP1 += HIT_DAMAGE * damageMultiplier;
                    enemiesToRemove.add(enemy.id);
                    explosionsRef.current.push({id: `exp-coll-p1-${enemy.id}`, x: enemy.x, y: enemy.y, startTime: now, emoji: '💥'});
                }
            }
            if (isMultiplayer && player2Ref.current && !isPlayer2Dead && !wasQteTriggered) {
                if (checkAndTriggerQTE(player2Ref.current, enemy, 'enemy', lastQteTriggerTimeP2)) {
                    wasQteTriggered = true;
                } else if (checkCollision(player2Ref.current, enemy)) {
                    damageToP2 += HIT_DAMAGE * damageMultiplier;
                    enemiesToRemove.add(enemy.id);
                    explosionsRef.current.push({id: `exp-coll-p2-${enemy.id}`, x: enemy.x, y: enemy.y, startTime: now, emoji: '💥'});
                }
            }
        }

        for (const p of bossProjectilesRef.current) {
            let wasQteTriggered = false;
            if (!isPlayer1Dead && !wasQteTriggered) {
                if (checkAndTriggerQTE(player1Ref.current, p, 'projectile', lastQteTriggerTimeP1)) {
                    wasQteTriggered = true;
                } else if (checkCollision(player1Ref.current, p)) {
                    if (!p.isStun) damageToP1 += HIT_DAMAGE * damageMultiplier;
                    projectilesToRemove.add(p.id);
                    if (p.isStun && p.stunDuration) {
                        if (stunTimeoutP1.current) clearTimeout(stunTimeoutP1.current);
                        setIsPlayer1Stunned(true);
                        stunTimeoutP1.current = window.setTimeout(() => setIsPlayer1Stunned(false), p.stunDuration);
                    }
                }
            }
            if (isMultiplayer && player2Ref.current && !isPlayer2Dead && !wasQteTriggered) {
                if (checkAndTriggerQTE(player2Ref.current, p, 'projectile', lastQteTriggerTimeP2)) {
                    wasQteTriggered = true;
                } else if (checkCollision(player2Ref.current, p)) {
                    if (!p.isStun) damageToP2 += HIT_DAMAGE * damageMultiplier;
                    projectilesToRemove.add(p.id);
                    if (p.isStun && p.stunDuration) {
                        if (stunTimeoutP2.current) clearTimeout(stunTimeoutP2.current);
                        setIsPlayer2Stunned(true);
                        stunTimeoutP2.current = window.setTimeout(() => setIsPlayer2Stunned(false), p.stunDuration);
                    }
                }
            }
        }

        if (currentBoss && isBossActive) {
            if (!isPlayer1Dead && checkCollision(player1Ref.current, currentBoss)) damageToP1 += HIT_DAMAGE * 2 * damageMultiplier;
            if (isMultiplayer && player2Ref.current && !isPlayer2Dead && checkCollision(player2Ref.current, currentBoss)) damageToP2 += HIT_DAMAGE * 2 * damageMultiplier;
        }

        if (damageToP1 > 0 || damageToP2 > 0) {
            audioManager.playSfx('hit');
        }
        if (damageToP1 > 0) setPlayer1Hp(hp => Math.max(0, hp - damageToP1));
        if (damageToP2 > 0) setPlayer2Hp(hp => Math.max(0, hp - damageToP2));
        if (enemiesToRemove.size > 0) enemiesRef.current = enemiesRef.current.filter(e => !enemiesToRemove.has(e.id));
        if (projectilesToRemove.size > 0) bossProjectilesRef.current = bossProjectilesRef.current.filter(p => !projectilesToRemove.has(p.id));
    }

    const pickupDrops = () => {
        const ammoDropsToRemove = new Set<string>();
        if (equippedGun) {
            for (const drop of ammoDropsRef.current) {
                if (!isPlayer1Dead && checkCollision(player1Ref.current, drop)) { setP1Ammo(a => Math.min(equippedGun.maxAmmo, a + drop.amount)); ammoDropsToRemove.add(drop.id); } 
                else if (isMultiplayer && player2Ref.current && !isPlayer2Dead && checkCollision(player2Ref.current, drop)) { setP2Ammo(a => Math.min(equippedGun.maxAmmo, a + drop.amount)); ammoDropsToRemove.add(drop.id); }
            }
            if (ammoDropsToRemove.size > 0) ammoDropsRef.current = ammoDropsRef.current.filter(d => !ammoDropsToRemove.has(d.id));
        }

        const currencyDropsToRemove = new Set<string>();
        for (const drop of currencyDropsRef.current) {
            let collected = false;
            if (!isPlayer1Dead && checkCollision(player1Ref.current, drop)) {
                 setCurrentRunCurrency(c => c + drop.amount);
                 collected = true;
            } else if (isMultiplayer && player2Ref.current && !isPlayer2Dead && checkCollision(player2Ref.current, drop)) {
                 setCurrentRunCurrency(c => c + drop.amount);
                 collected = true;
            }
            if (collected) {
              currencyDropsToRemove.add(drop.id);
              audioManager.playSfx('coin');
            }
        }
        if (currencyDropsToRemove.size > 0) currencyDropsRef.current = currencyDropsRef.current.filter(d => !currencyDropsToRemove.has(d.id));
    }
    pickupDrops();
    
    let score1ToAdd = 0, score2ToAdd = 0, xpToAdd = 0;
    const bombsHit = new Set<string>(); const bulletsHit = new Set<string>(); const enemiesHit = new Set<string>(); const droneBulletsHit = new Set<string>();
    const allProjectiles = [...bombsRef.current.map(b => ({ ...b, type: 'bomb' })), ...bulletsRef.current.map(b => ({ ...b, type: 'bullet' })), ...droneBulletsRef.current.map(b => ({ ...b, type: 'drone_bullet' }))];

    for (const proj of allProjectiles) {
        for (const enemy of enemiesRef.current) {
            if (enemiesHit.has(enemy.id)) continue;
            if (checkCollision(proj, enemy)) {
                if (proj.type === 'bomb') bombsHit.add(proj.id); 
                else if (proj.type === 'bullet') bulletsHit.add(proj.id);
                else droneBulletsHit.add(proj.id);
                
                enemiesHit.add(enemy.id);
                if (proj.playerId === 1) score1ToAdd += 100; else score2ToAdd += 100;

                const currencyMultiplier = isGoldRush ? 2 : 1;
                const baseAmount = ENEMY_CURRENCY_DROP * (equippedBoatId === 'p5' ? AEGIS_CURRENCY_BONUS : 1);
                currencyDropsRef.current.push({
                    id: `curr-${enemy.id}`,
                    x: enemy.x, y: enemy.y,
                    width: CURRENCY_DROP_WIDTH, height: CURRENCY_DROP_HEIGHT,
                    amount: baseAmount * currencyMultiplier,
                    emoji: '💰',
                });

                xpToAdd += ENEMY_XP_DROP;
            }
        }
        if (currentBoss && isBossActive) {
            if (checkCollision(proj, currentBoss)) {
                if (currentBoss.powerUp?.active && currentBoss.powerUp.type === 'KING_DECREE') { /* Invincible */ } 
                else {
                    let damageDealt = proj.damage;
                    if (currentBoss.type === '⚫️') {
                        damageDealt *= BLACK_HOLE_DIRECT_DAMAGE_MODIFIER;
                    }

                    if (proj.type === 'bomb') bombsHit.add(proj.id);
                    else if (proj.type === 'bullet') bulletsHit.add(proj.id);
                    else droneBulletsHit.add(proj.id);

                    currentBoss.health -= damageDealt;
                    currentBoss.lastDamagedTime = now;
                    if (proj.playerId === 1) score1ToAdd += 50; else score2ToAdd += 50;
                    if (Math.random() < AMMO_DROP_CHANCE_ON_BOSS_HIT) {
                        ammoDropsRef.current.push({ id: `ammo-${now}`, x: currentBoss.x + Math.random() * BOSS_WIDTH, y: currentBoss.y + BOSS_HEIGHT, width: AMMO_DROP_WIDTH, height: AMMO_DROP_HEIGHT, amount: AMMO_DROP_BASE_AMOUNT, emoji: '🔋'});
                    }
                }
            }
            currentBoss.subEntities?.forEach(sub => {
                if (checkCollision(proj, sub)) {
                    if (proj.type === 'bomb') bombsHit.add(proj.id); 
                    else if (proj.type === 'bullet') bulletsHit.add(proj.id);
                    else droneBulletsHit.add(proj.id);

                    if (sub.health) sub.health -= proj.damage;
                }
            });
            const shatterProjectiles = bossProjectilesRef.current.filter(p => p.health && p.health > 0);
            for(const shatterProj of shatterProjectiles) {
                if (checkCollision(proj, shatterProj)) {
                     if (proj.type === 'bomb') bombsHit.add(proj.id); 
                     else if (proj.type === 'bullet') bulletsHit.add(proj.id);
                     else droneBulletsHit.add(proj.id);

                     shatterProj.health -= proj.damage;
                     if(shatterProj.health <= 0) {
                        explosionsRef.current.push({ id: `exp-shatter-${shatterProj.id}`, x: shatterProj.x, y: shatterProj.y, startTime: now, emoji: '❄️' });
                        bossProjectilesRef.current = bossProjectilesRef.current.filter(p => p.id !== shatterProj.id);
                        const baseProjectile = { width: BOSS_PROJECTILE_WIDTH, height: BOSS_PROJECTILE_HEIGHT, createdAt: now };
                        for (let i = 0; i < 8; i++) { const angle = (i/8) * 2 * Math.PI; bossProjectilesRef.current.push({ ...baseProjectile, id:`bproj-frag-${now}-${i}`, x: shatterProj.x, y: shatterProj.y, dx: Math.cos(angle) * BOSS_PROJECTILE_SPEED * 0.8, dy: Math.sin(angle) * BOSS_PROJECTILE_SPEED * 0.8, isStun: true, stunDuration: 1000 }); }
                     }
                }
            }
        }
    }
    
    if (bombsHit.size > 0) bombsRef.current = bombsRef.current.filter(b => !bombsHit.has(b.id));
    if (bulletsHit.size > 0) bulletsRef.current = bulletsRef.current.filter(b => !bulletsHit.has(b.id));
    if (droneBulletsHit.size > 0) droneBulletsRef.current = droneBulletsRef.current.filter(b => !droneBulletsHit.has(b.id));
    if (enemiesHit.size > 0) {
        audioManager.playSfx('explosion');
        enemiesHit.forEach(id => {
            const enemy = enemiesRef.current.find(e => e.id === id);
            if(enemy) explosionsRef.current.push({ id: `exp-en-${id}`, x: enemy.x, y: enemy.y, startTime: now, emoji: '💥' });
        });
        enemiesRef.current = enemiesRef.current.filter(e => !enemiesHit.has(e.id));
    }
    
    if (score1ToAdd > 0) setScore1(s => s + score1ToAdd);
    if (score2ToAdd > 0) setScore2(s => s + score2ToAdd);
    if (xpToAdd > 0) setCurrentRunXp(xp => xp + xpToAdd);
    
    if (currentBoss && currentBoss.health <= 0) {
        audioManager.playSfx('explosion');
        const currencyMultiplier = isGoldRush ? 2 : 1;
        const bossCurrencyDrop = (BOSS_CURRENCY_DROP * level) * currencyMultiplier * (equippedBoatId === 'p5' ? AEGIS_CURRENCY_BONUS : 1);
        currencyDropsRef.current.push({
            id: `curr-boss-${currentBoss.id}`,
            x: currentBoss.x + BOSS_WIDTH / 2, y: currentBoss.y + BOSS_HEIGHT / 2,
            width: CURRENCY_DROP_WIDTH, height: CURRENCY_DROP_HEIGHT,
            amount: bossCurrencyDrop,
            emoji: '💰'
        });
        
        const finalXp = currentRunXp + xpToAdd + (BOSS_XP_DROP_BASE * level);
        const bossScore = 1000 * level;
        const finalP1Score = score1 + score1ToAdd + (isMultiplayer ? bossScore/2 : bossScore);
        const finalP2Score = isMultiplayer ? score2 + score2ToAdd + bossScore/2 : undefined;

        explosionsRef.current.push({ id: `exp-boss-${currentBoss.id}`, x: currentBoss.x, y: currentBoss.y, startTime: now, emoji: '💥' });
        
        if (level === LEVEL_CONFIGS.length) {
            pickupDrops();
            onGameWon({ p1: finalP1Score, p2: finalP2Score }, finalXp, powerUpCount, currentRunCurrency + bossCurrencyDrop);
            return;
        }

        setLevel(l => l + 1);
        setCurrentRunXp(xp => xp + xpToAdd + (BOSS_XP_DROP_BASE * level));
        setScore1(s => s + score1ToAdd + (isMultiplayer ? bossScore / 2 : bossScore));
        if(isMultiplayer) setScore2(s => s + score2ToAdd + bossScore / 2);
        setBoss(null);
        setIsBossActive(false);
    } else {
        setBoss(currentBoss);
    }
    
    if (!isBossActive && enemiesRef.current.length === 0 && !boss) {
      setIsBossActive(true);
      lastBossPowerUpTime.current = Date.now() + 5000;
      const bossConfig = levelConfig.boss;
      const bossX = bossConfig.type === '⚫️' ? GAME_WIDTH / 2 - BOSS_WIDTH / 2 : Math.random() * (GAME_WIDTH - BOSS_WIDTH);
      const bossY = bossConfig.type === '⚫️' ? 100 : 50;
      setBoss({ id: `boss-${level}`, x: bossX, y: bossY, width: BOSS_WIDTH, height: BOSS_HEIGHT, type: bossConfig.type, health: bossConfig.health, maxHealth: bossConfig.health, attackState: {}, subEntities: [], lastDamagedTime: Date.now() });
    }

    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [ draw, isMultiplayer, playerLevel, equippedBoat, equippedBomb, equippedGun, isRapidFire, isTimeSlow, isGoldRush, isPlayer1Stunned, p1Weapon, p1Ammo, isPlayer2Stunned, p2Weapon, p2Ammo, boss, isBossActive, level, onGameWon, powerUpCount, currentRunCurrency, currentRunXp, score1, score2, levelConfig, isPlayer1ControlsReversed, isPlayer1Slowed, isPlayer2ControlsReversed, isPlayer2Slowed, isPlayer1Dead, isPlayer2Dead, qteDodgeState ]);

  useEffect(() => {
    if (isPaused) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      resetAllPlayerDebuffs();
    };
  }, [isPaused, gameLoop, resetAllPlayerDebuffs]);

  useEffect(() => {
    const updateScale = () => {
        if (gameContainerRef.current) {
            const { width } = gameContainerRef.current.getBoundingClientRect();
            setScale(width / GAME_WIDTH);
        }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  
  const handleTouchAction = useCallback((action: string, active: boolean) => {
    if (active) {
        if (action === 'q') {
            if (equippedGun) setP1Weapon(w => w === 'bomb' ? 'gun' : 'bomb');
        } else if (action === 'e') {
            handleUsePowerUp();
        } else {
            keysPressed.current.add(action);
        }
    } else {
        keysPressed.current.delete(action);
    }
  }, [equippedGun, handleUsePowerUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const key = e.key.toLowerCase();

        if (qteDodgeState) {
            const p1Keys = ['w', 'a', 's', 'd'];
            const p2Keys = ['arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
            const isP1Event = p1Keys.includes(key) && qteDodgeState.playerId === 1;
            const isP2Event = p2Keys.includes(key) && qteDodgeState.playerId === 2;

            if (isP1Event || isP2Event) {
                e.preventDefault();
                const expectedKey = qteDodgeState.sequence[qteDodgeState.currentIndex];

                if (key === expectedKey) {
                    const newIndex = qteDodgeState.currentIndex + 1;
                    if (newIndex >= qteDodgeState.sequence.length) {
                        const player = qteDodgeState.playerId === 1 ? player1Ref.current : player2Ref.current!;
                        const threat = qteDodgeState.entityType === 'projectile'
                            ? bossProjectilesRef.current.find(p => p.id === qteDodgeState.triggeringEntityId)
                            : enemiesRef.current.find(e => e.id === qteDodgeState.triggeringEntityId);

                        if (threat) {
                             if (threat.x < player.x) player.x += QTE_DODGE_DISTANCE;
                             else player.x -= QTE_DODGE_DISTANCE;
                        } else { player.x += QTE_DODGE_DISTANCE; }
                        player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, player.x));

                        explosionsRef.current.push({
                            id: `dodge-${player.id}-${Date.now()}`, x: player.x + PLAYER_WIDTH / 2, y: player.y + PLAYER_HEIGHT / 2, startTime: Date.now(), emoji: '✨'
                        });
                        
                        const pulseCenter = { x: player.x + PLAYER_WIDTH / 2, y: player.y + PLAYER_HEIGHT / 2 };
                        const projectilesToDestroy = new Set<string>();
                        bossProjectilesRef.current.forEach(proj => {
                            if (!proj.health && !proj.isStun) {
                                const projCenter = { x: proj.x + proj.width / 2, y: proj.y + proj.height / 2 };
                                if (((pulseCenter.x - projCenter.x)**2 + (pulseCenter.y - projCenter.y)**2) < AEGIS_RETALIATION_PULSE_RADIUS**2) {
                                    projectilesToDestroy.add(proj.id);
                                }
                            }
                        });


                        if (qteDodgeState.entityType === 'projectile') {
                             bossProjectilesRef.current = bossProjectilesRef.current.filter(p => p.id !== qteDodgeState.triggeringEntityId && !projectilesToDestroy.has(p.id));
                        } else {
                             enemiesRef.current = enemiesRef.current.filter(e => e.id !== qteDodgeState.triggeringEntityId);
                             bossProjectilesRef.current = bossProjectilesRef.current.filter(p => !projectilesToDestroy.has(p.id));
                        }
                        setQteDodgeState(null);
                    } else {
                        setQteDodgeState(prev => prev ? { ...prev, currentIndex: newIndex } : null);
                    }
                } else {
                    const damageReduction = equippedBoat.damageReduction || 0;
                    const damageMultiplier = 1 - damageReduction;
                    const finalDamage = HIT_DAMAGE * damageMultiplier;

                    const playerToDamage = qteDodgeState.playerId === 1 ? 1 : 2;
                    if (playerToDamage === 1) setPlayer1Hp(hp => Math.max(0, hp - finalDamage));
                    else setPlayer2Hp(hp => Math.max(0, hp - finalDamage));

                    if (qteDodgeState.entityType === 'projectile') {
                        bossProjectilesRef.current = bossProjectilesRef.current.filter(p => p.id !== qteDodgeState.triggeringEntityId);
                    } else {
                        enemiesRef.current = enemiesRef.current.filter(e => e.id !== qteDodgeState.triggeringEntityId);
                    }
                    setQteDodgeState(null);
                }
            }
            return;
        }

        if (key === 'escape') { e.preventDefault(); onPause(); } 
        else if (key === 'q' && equippedGun) setP1Weapon(w => w === 'bomb' ? 'gun' : 'bomb');
        else if (key === '.' && isMultiplayer && equippedGun) setP2Weapon(w => w === 'bomb' ? 'gun' : 'bomb');
        else if (key === 'e') handleUsePowerUp();
        else keysPressed.current.add(key);
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPause, isMultiplayer, equippedGun, handleUsePowerUp, qteDodgeState, equippedBoat]);
  
  useEffect(() => {
    if(boss && boss.type === '👵' && !bossInsult && !isLoadingInsult){
      const fetchInsult = async () => {
        setIsLoadingInsult(true);
        const insult = await generateInsult();
        setBossInsult(insult);
        setIsLoadingInsult(false);
      };
      fetchInsult();
      const interval = setInterval(fetchInsult, 10000);
      return () => clearInterval(interval);
    }
  }, [boss, bossInsult, isLoadingInsult]);

  if (!levelConfig) return null;
  const rapidFireTimeLeft = isRapidFire ? Math.max(0, rapidFireEndTime - Date.now()) : 0;
  const timeSlowTimeLeft = isTimeSlow ? Math.max(0, timeSlowEndTime - Date.now()) : 0;
  const goldRushTimeLeft = isGoldRush ? Math.max(0, goldRushEndTime - Date.now()) : 0;

  return (
    <div className="relative w-full" style={{ maxWidth: GAME_WIDTH }}>
        <div ref={gameContainerRef} className="w-full" style={{ height: GAME_HEIGHT * scale }}>
            <div
              className={`relative overflow-hidden border-4 border-cyan-500 shadow-2xl ${levelConfig.background}`}
              style={{
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
            >
              <HUD 
                score={score1} score2={score2} isMultiplayer={isMultiplayer} level={level} 
                currency={currentRunCurrency} boss={boss && isBossActive ? boss : null} onPause={onPause}
                p1Weapon={p1Weapon} p1Ammo={p1Ammo} p2Weapon={p2Weapon} p2Ammo={p2Ammo}
                equippedGun={equippedGun} playerLevel={playerLevel} xp={playerXp + currentRunXp}
                xpForNextLevel={xpForNextLevel} 
                p1Hp={player1Hp} p1MaxHp={player1MaxHp}
                p2Hp={player2Hp} p2MaxHp={player2MaxHp}
                equippedPowerUpId={equippedPowerUpId} powerUpCount={powerUpCount}
                isInvincible={isInvincible} rapidFireTimeLeft={rapidFireTimeLeft}
                timeSlowTimeLeft={timeSlowTimeLeft} goldRushTimeLeft={goldRushTimeLeft}
              />
              <canvas
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                className="absolute top-0 left-0"
              />
              {boss && isBossActive && boss.type === '👵' && bossInsult && (
                <div className="absolute bg-white text-black p-2 rounded-lg text-sm max-w-xs text-center shadow-lg pointer-events-none" 
                     style={{ left: boss.x + BOSS_WIDTH / 2, top: boss.y - 40, transform: 'translateX(-50%)' }}>
                    {bossInsult}
                </div>
              )}
            </div>
        </div>
        <MobileControls show={settings.showMobileControls} onAction={handleTouchAction} />
    </div>
  );
};

export default Game;
