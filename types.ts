// Fix: Defined and exported all necessary types. Removed incorrect constants and circular dependency.
export enum GameState {
  MainMenu,
  LevelSelection,
  Playing,
  Paused,
  GameOver,
  GameWon,
  Shop,
  SupplyDrop,
  MultiplayerPlaying,
  MultiplayerPaused,
}

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Boat {
  id: string;
  name: string;
  emoji: string;
  cost?: number;
  rarity: Rarity;
  description: string;
  findInSupplyDropOnly?: boolean;
  hpMultiplier: number;
  damageReduction?: number;
}

// Base type for all weapons
export interface Weapon {
  id: string;
  name: string;
  emoji: string; // Emoji for the projectile
  cost?: number;
  rarity: Rarity;
  damage: number;
  description: string;
  findInSupplyDropOnly?: boolean;
}

export interface BombType extends Weapon {}

export interface GunType extends Weapon {
  maxAmmo: number;
}

export interface PowerUp {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  rarity: Rarity;
  description: string;
  quantityPerDrop?: number;
}


export type WeaponSelection = 'bomb' | 'gun';

export interface LevelConfig {
  level: number;
  enemies: { type: string; count: number };
  boss: { type: string; health: number };
  background: string;
}

export interface Player {
  id: string;
  playerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Drone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  emoji: string;
  lastFireTime: number;
}

export interface Bomb {
  id:string;
  playerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  emoji: string;
}

export interface Bullet {
  id: string;
  playerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  emoji: string;
}

// Fix: Add width and height for collision detection.
export interface AmmoDrop {
  id:string;
  x: number;
  y: number;
  width: number;
  height: number;
  amount: number;
  emoji: string;
}

export interface CurrencyDrop {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  amount: number;
  emoji: string;
}


export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  dx?: number;
  dy?: number;
  health?: number;
}

export interface Boss {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  health: number;
  maxHealth: number;
  powerUp?: {
    type: string;
    active: boolean;
    endTime: number;
    startTime: number;
  };
  lastDamagedTime?: number;
  attackState?: { [key: string]: any };
  subEntities?: Enemy[];
}

export interface BossProjectile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dx?: number;
  dy?: number;
  isStun?: boolean;
  stunDuration?: number;
  createdAt?: number;
  lifetime?: number;
  health?: number;
}

export interface Explosion {
    id: string;
    x: number;
    y: number;
    startTime: number;
    emoji?: string;
}

export interface Position {
    x: number;
    y: number;
}

export interface QTEDodgeState {
  isActive: boolean;
  startTime: number;
  sequence: string[];
  currentIndex: number;
  playerId: number;
  triggeringEntityId: string;
  entityType: 'enemy' | 'projectile';
}

export interface Settings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  showMobileControls: boolean;
}
