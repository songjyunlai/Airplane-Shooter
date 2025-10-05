import { LevelConfig, Plane, BombType, Rarity, GunType, PowerUp } from './types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 50;
export const PLAYER_SPEED = 7;
export const PLAYER_LIVES = 3;

export const DRONE_WIDTH = 30;
export const DRONE_HEIGHT = 30;

export const BOMB_WIDTH = 25;
export const BOMB_HEIGHT = 25;
export const BOMB_SPEED = 10;
export const BOMB_COOLDOWN = 200; // ms

export const BULLET_WIDTH = 10;
export const BULLET_HEIGHT = 25;
export const BULLET_SPEED = 15;
export const GUN_COOLDOWN = 100; // ms
export const DRONE_FIRE_COOLDOWN = 500; // ms

export const ENEMY_WIDTH = 40;
export const ENEMY_HEIGHT = 40;
export const ENEMY_SPEED = 2;

export const BOSS_WIDTH = 100;
export const BOSS_HEIGHT = 100;
export const BOSS_SPEED = 3;

export const BOSS_PROJECTILE_WIDTH = 20;
export const BOSS_PROJECTILE_HEIGHT = 20;
export const BOSS_PROJECTILE_SPEED = 5;
export const BOSS_SHOOT_COOLDOWN = 1500; // ms

export const BOSS_POWER_UP_COOLDOWN = 12000; // ms
export const BOSS_POWER_UP_DURATIONS = {
  GRANDMA_YARN: 6000,
  GORILLA_POUND: 500,
  TREX_ROAR: 2500,
  DRAGON_BREATH: 3000,
  SCORPION_SLOW: 4000,
  SPIDER_COCOON: 1500,
  WIZARD_INVISIBILITY: 4500,
  EAGLE_GUST: 3500,
  EYE_HYPNOSIS: 4000,
  WHALE_MINIONS: 0, // Instant
  KING_DECREE: 5000,
};

// --- NEW CURRENCY & UPGRADES ---
export const ENEMY_CURRENCY_DROP = 10;
export const BOSS_CURRENCY_DROP = 100;
export const SUPPLY_DROP_COST = 300;
export const DUPLICATE_CURRENCY_AWARD = 150;
export const AMMO_DROP_CHANCE_ON_BOSS_HIT = 0.15; // 15% chance
export const AMMO_DROP_BASE_AMOUNT = 20;
// Fix: Add width and height for ammo drops to enable collision detection.
export const AMMO_DROP_WIDTH = 30;
export const AMMO_DROP_HEIGHT = 30;

// --- NEW LEVEL SYSTEM ---
export const ENEMY_XP_DROP = 15;
export const BOSS_XP_DROP_BASE = 200;
export const DAMAGE_BONUS_PER_LEVEL = 0.05; // 5% damage increase per level
export const getXpForNextLevel = (level: number) => 250 * level;

// --- NEW POWER-UPS ---
export const INVINCIBILITY_DURATION = 5000; // ms
export const RAPID_FIRE_DURATION = 10000; // ms
export const TIME_SLOW_DURATION = 8000; // ms
export const GOLD_RUSH_DURATION = 15000; // ms
export const AUTO_DODGE_COOLDOWN = 750; // ms
export const AUTO_DODGE_DISTANCE = 80; // pixels
export const AUTO_DODGE_DANGER_RADIUS = 120; // pixels

// --- AEGIS INTERCEPTOR UPGRADES ---
export const AEGIS_LASER_COOLDOWN = 400; // ms
export const AEGIS_LASER_DAMAGE = 0.5;
export const AEGIS_RETALIATION_PULSE_RADIUS = 75; // pixels
export const AEGIS_CURRENCY_BONUS = 1.1; // 10% bonus


export const POWER_UPS: PowerUp[] = [
    { id: 'pw1', name: 'Shield', emoji: '🛡️', cost: 250, rarity: 'Rare', description: 'Become invincible for 5 seconds.', quantityPerDrop: 3 },
    { id: 'pw2', name: 'Nuke', emoji: '☢️', cost: 400, rarity: 'Epic', description: 'Wipes out all enemies on screen.', quantityPerDrop: 2 },
    { id: 'pw3', name: 'Rapid Fire', emoji: '🔥', cost: 300, rarity: 'Rare', description: 'Doubles fire rate for 10 seconds.', quantityPerDrop: 3 },
    { id: 'pw4', name: 'Chrono Field', emoji: '⏳', cost: 350, rarity: 'Rare', description: 'Slows enemies & projectiles for 8 seconds.', quantityPerDrop: 3 },
    { id: 'pw5', name: 'Gold Rush', emoji: '💰', cost: 500, rarity: 'Epic', description: 'Doubles currency drops for 15 seconds.', quantityPerDrop: 2 },
    { id: 'pw6', name: 'Wingman Drone', emoji: '🤖', cost: 750, rarity: 'Epic', description: 'Spawns a drone that fights with you.', quantityPerDrop: 1 },
];


export const RARITY_COLORS: { [key in Rarity]: string } = {
    Common: 'border-gray-400',
    Rare: 'border-blue-500',
    Epic: 'border-purple-600',
    Legendary: 'border-yellow-500',
};

export const PLANES: Plane[] = [
    { id: 'p1', name: 'Heroplane', emoji: '✈️', cost: 0, rarity: 'Common', description: 'The reliable classic.'},
    { id: 'p2', name: 'Stealth Jet', emoji: '🚀', cost: 500, rarity: 'Rare', description: 'A faster, sleeker model.'},
    { id: 'p3', name: 'UFO', emoji: '🛸', cost: 1500, rarity: 'Epic', description: 'Alien tech for ultimate power.' },
    { id: 'p4', name: 'Cosmic Ghost', emoji: '👻', rarity: 'Legendary', findInSupplyDropOnly: true, description: 'A mysterious and powerful specter.' },
    { id: 'p5', name: 'Aegis Interceptor', emoji: '⚜️', cost: 0, rarity: 'Legendary', description: 'AI auto-dodge with retaliation pulse, integrated twin lasers, and a 10% currency bonus.' },
];

export const BOMBS: BombType[] = [
    { id: 'b1', name: 'Standard Bomb', emoji: '💣', cost: 0, rarity: 'Common', damage: 1, description: 'Deals 1 damage.' },
    { id: 'b2', name: 'Fire Bomb', emoji: '🔥', cost: 800, rarity: 'Rare', damage: 3, description: 'Deals 3 damage.' },
    { id: 'b3', name: 'Mega Bomb', emoji: '💥', cost: 2000, rarity: 'Epic', damage: 5, description: 'Deals 5 damage.' },
    { id: 'b4', name: 'Black Hole Bomb', emoji: '⚫', rarity: 'Legendary', findInSupplyDropOnly: true, damage: 10, description: 'Deals 10 damage.' },
];

export const GUNS: GunType[] = [
    { id: 'g1', name: 'Machine Gun', emoji: '•', cost: 1000, rarity: 'Rare', damage: 2, maxAmmo: 100, description: 'Fast-firing, standard issue.' },
    { id: 'g4', name: 'Twin Cannon', emoji: '‖', cost: 1500, rarity: 'Rare', damage: 2, maxAmmo: 120, description: 'Dual barrels for more uptime.' },
    { id: 'g2', name: 'Laser Blaster', emoji: '❘', cost: 2500, rarity: 'Epic', damage: 4, maxAmmo: 50, description: 'High-tech energy bolts.' },
    { id: 'g5', name: 'Heavy Cannon', emoji: '●', cost: 3000, rarity: 'Epic', damage: 5, maxAmmo: 40, description: 'Slower, but packs a punch.' },
    { id: 'g3', name: 'Plasma Cannon', emoji: '🔮', rarity: 'Legendary', findInSupplyDropOnly: true, damage: 8, maxAmmo: 25, description: 'Unleashes devastating power.' },
    { id: 'g6', name: 'Golden Gun', emoji: '✪', rarity: 'Legendary', findInSupplyDropOnly: true, damage: 15, maxAmmo: 10, description: 'Annihilates targets instantly.' },
];

export const LOOT_POOL: { id: string; weight: number }[] = [
    // Common
    { id: 'p1', weight: 100 },
    { id: 'b1', weight: 100 },
    // Rare
    { id: 'p2', weight: 50 },
    { id: 'b2', weight: 50 },
    { id: 'g1', weight: 45 },
    { id: 'g4', weight: 40 },
    { id: 'pw1', weight: 60 },
    { id: 'pw3', weight: 55 },
    { id: 'pw4', weight: 50 },
    // Epic
    { id: 'p3', weight: 20 },
    { id: 'b3', weight: 20 },
    { id: 'g2', weight: 18 },
    { id: 'g5', weight: 15 },
    { id: 'pw2', weight: 25 },
    { id: 'pw5', weight: 20 },
    { id: 'pw6', weight: 15 },
    // Legendary
    { id: 'p4', weight: 5 },
    { id: 'b4', weight: 5 },
    { id: 'g3', weight: 4 },
    { id: 'g6', weight: 3 },
];
// --- END NEW ---

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    enemies: { type: '👹', count: 8 },
    boss: { type: '🐙', health: 20 },
    background: 'bg-blue-800/70',
  },
  {
    level: 2,
    enemies: { type: '👺', count: 12 },
    boss: { type: '🦈', health: 40 },
    background: 'bg-indigo-900/70',
  },
  {
    level: 3,
    enemies: { type: '👻', count: 16 },
    boss: { type: '🦀', health: 60 },
    background: 'bg-purple-900/70',
  },
  {
    level: 4,
    enemies: { type: '🏯', count: 20 },
    boss: { type: '🐡', health: 80 },
    background: 'bg-slate-900/70',
  },
  {
    level: 5,
    enemies: { type: '💀', count: 25 },
    boss: { type: '🦞', health: 100 },
    background: 'bg-red-900/70',
  },
  {
    level: 6,
    enemies: { type: '👽', count: 30 },
    boss: { type: '🐚', health: 120 },
    background: 'bg-teal-900/70',
  },
  {
    level: 7,
    enemies: { type: '🤖', count: 35 },
    boss: { type: '🦪', health: 140 },
    background: 'bg-cyan-900/70',
  },
  {
    level: 8,
    enemies: { type: '👾', count: 40 },
    boss: { type: '🦑', health: 160 },
    background: 'bg-blue-900/70',
  },
  {
    level: 9,
    enemies: { type: '👿', count: 45 },
    boss: { type: '🐍', health: 180 },
    background: 'bg-indigo-900/70',
  },
  {
    level: 10,
    enemies: { type: '🔥', count: 50 },
    boss: { type: '👵', health: 250 },
    background: 'bg-rose-900/70',
  },
  {
    level: 11,
    enemies: { type: '🤡', count: 55 },
    boss: { type: '🦍', health: 300 },
    background: 'bg-green-900/70',
  },
  {
    level: 12,
    enemies: { type: '🦁', count: 60 },
    boss: { type: '🦖', health: 350 },
    background: 'bg-orange-900/70',
  },
  {
    level: 13,
    enemies: { type: '🦄', count: 65 },
    boss: { type: '🐉', health: 400 },
    background: 'bg-red-900/80',
  },
  {
    level: 14,
    enemies: { type: '🧛', count: 70 },
    boss: { type: '🦂', health: 450 },
    background: 'bg-purple-900/80',
  },
  {
    level: 15,
    enemies: { type: '🧟', count: 75 },
    boss: { type: '🕷️', health: 500 },
    background: 'bg-lime-900/70',
  },
  {
    level: 16,
    enemies: { type: '🧞', count: 80 },
    boss: { type: '🧙', health: 550 },
    background: 'bg-sky-900/70',
  },
  {
    level: 17,
    enemies: { type: '🧚', count: 85 },
    boss: { type: '🦅', health: 600 },
    background: 'bg-amber-900/70',
  },
  {
    level: 18,
    enemies: { type: '🧝', count: 90 },
    boss: { type: '👁️', health: 650 },
    background: 'bg-stone-900/70',
  },
  {
    level: 19,
    enemies: { type: '🧜‍♀️', count: 95 },
    boss: { type: '🐳', health: 700 },
    background: 'bg-cyan-900/80',
  },
  {
    level: 20,
    enemies: { type: '😈', count: 100 },
    boss: { type: '👑', health: 800 },
    background: 'bg-gray-900/90',
  },
  {
    level: 21,
    enemies: { type: '🐛', count: 105 },
    boss: { type: '🏺', health: 850 },
    background: 'bg-yellow-900/80',
  },
  {
    level: 22,
    enemies: { type: '☄️', count: 110 },
    boss: { type: '🪐', health: 900 },
    background: 'bg-black/80',
  },
  {
    level: 23,
    enemies: { type: '🔩', count: 115 },
    boss: { type: '🦾', health: 950 },
    background: 'bg-gray-800/90',
  },
  {
    level: 24,
    enemies: { type: '🦴', count: 120 },
    boss: { type: '🐺', health: 1000 },
    background: 'bg-red-900/90',
  },
  {
    level: 25,
    enemies: { type: '❄️', count: 125 },
    boss: { type: '🧊', health: 1100 },
    background: 'bg-blue-300/70',
  },
  {
    level: 26,
    enemies: { type: '🟠', count: 130 },
    boss: { type: '🌋', health: 1200 },
    background: 'bg-orange-900/90',
  },
  {
    level: 27,
    enemies: { type: '💠', count: 135 },
    boss: { type: '🌌', health: 1300 },
    background: 'bg-indigo-900/90',
  },
  {
    level: 28,
    enemies: { type: '🌟', count: 140 },
    boss: { type: '👼', health: 1400 },
    background: 'bg-sky-400/70',
  },
  {
    level: 29,
    enemies: { type: '❓', count: 150 },
    boss: { type: '⁉️', health: 1500 },
    background: 'bg-purple-900/90',
  },
  {
    level: 30,
    enemies: { type: '✨', count: 200 },
    boss: { type: '⚫️', health: 2000 },
    background: 'bg-black',
  },
];