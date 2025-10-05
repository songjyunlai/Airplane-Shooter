import React from 'react';
import { PLANES, BOMBS, GUNS, POWER_UPS, RARITY_COLORS } from '../constants';
import { Plane, BombType, GunType, PowerUp } from '../types';

interface ShopScreenProps {
  currency: number;
  ownedPlanes: Set<string>;
  ownedBombs: Set<string>;
  ownedGuns: Set<string>;
  ownedPowerUps: { [key: string]: number };
  equippedPlaneId: string;
  equippedBombId: string;
  equippedGunId: string | null;
  equippedPowerUpId: string | null;
  onBuyItem: (itemId: string, itemType: 'plane' | 'bomb' | 'gun' | 'powerup', cost: number) => void;
  onEquipPlane: (planeId: string) => void;
  onEquipBomb: (bombId: string) => void;
  onEquipGun: (gunId: string | null) => void;
  onEquipPowerUp: (powerUpId: string | null) => void;
  onBack: () => void;
}

const ShopItemCard: React.FC<{
    item: Plane | BombType | GunType,
    isOwned: boolean,
    isEquipped: boolean,
    canAfford: boolean,
    onBuy: () => void,
    onEquip: () => void,
}> = ({ item, isOwned, isEquipped, canAfford, onBuy, onEquip }) => {

    const getButton = () => {
        if (isEquipped) {
            return <button disabled className="w-full mt-2 px-4 py-2 bg-green-700 text-white font-bold rounded-lg cursor-not-allowed">Equipped</button>;
        }
        if (isOwned) {
            return <button onClick={onEquip} className="w-full mt-2 px-4 py-2 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400">Equip</button>;
        }
        if (item.findInSupplyDropOnly) {
            return <button disabled className="w-full mt-2 px-4 py-2 bg-purple-800 text-white font-bold rounded-lg cursor-not-allowed">Find in Supply Drop</button>;
        }
        return (
            <button onClick={onBuy} disabled={!canAfford} className="w-full mt-2 px-4 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed">
                Buy for 💰{item.cost}
            </button>
        );
    };

    const borderColor = RARITY_COLORS[item.rarity] || 'border-cyan-500/50';
    const equippedBorderColor = isEquipped ? 'border-green-500' : borderColor;

    return (
        <div className={`p-4 rounded-lg border-4 flex flex-col justify-between ${isEquipped ? 'bg-green-900/50' : 'bg-gray-800/50'} ${equippedBorderColor}`}>
            <div>
              <div className="text-5xl text-center mb-2">{item.emoji}</div>
              <h3 className="text-xl font-bold text-center">{item.name}</h3>
              <p className="text-gray-300 text-center text-sm h-10">{item.description}</p>
              {'damage' in item && <p className="text-center text-red-400 font-bold">Damage: {item.damage}</p>}
              {'maxAmmo' in item && <p className="text-center text-blue-400 font-bold">Ammo: {item.maxAmmo}</p>}
            </div>
            {getButton()}
        </div>
    );
};

const PowerUpItemCard: React.FC<{
    item: PowerUp,
    quantity: number,
    isEquipped: boolean,
    canAfford: boolean,
    onBuy: () => void,
    onEquip: () => void,
}> = ({ item, quantity, isEquipped, canAfford, onBuy, onEquip }) => {

    const getButtons = () => {
        return (
            <div className="flex flex-col space-y-2 mt-2">
                <button onClick={onBuy} disabled={!canAfford} className="w-full px-4 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Buy for 💰{item.cost}
                </button>
                {quantity > 0 && (
                    isEquipped ?
                    <button disabled className="w-full px-4 py-2 bg-green-700 text-white font-bold rounded-lg cursor-not-allowed">Equipped</button> :
                    <button onClick={onEquip} className="w-full px-4 py-2 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400">Equip</button>
                )}
            </div>
        );
    };

    const borderColor = RARITY_COLORS[item.rarity] || 'border-cyan-500/50';
    const equippedBorderColor = isEquipped ? 'border-green-500' : borderColor;

    return (
        <div className={`p-4 rounded-lg border-4 flex flex-col justify-between ${isEquipped ? 'bg-green-900/50' : 'bg-gray-800/50'} ${equippedBorderColor}`}>
            <div>
              <div className="text-5xl text-center mb-2">{item.emoji}</div>
              <h3 className="text-xl font-bold text-center">{item.name}</h3>
              <p className="text-gray-300 text-center text-sm h-10">{item.description}</p>
              <p className="text-center text-blue-400 font-bold">Owned: {quantity}</p>
            </div>
            {getButtons()}
        </div>
    );
};


const ShopScreen: React.FC<ShopScreenProps> = ({
  currency,
  ownedPlanes,
  ownedBombs,
  ownedGuns,
  ownedPowerUps,
  equippedPlaneId,
  equippedBombId,
  equippedGunId,
  equippedPowerUpId,
  onBuyItem,
  onEquipPlane,
  onEquipBomb,
  onEquipGun,
  onEquipPowerUp,
  onBack,
}) => {
  const visiblePlanes = PLANES.filter(p => !p.findInSupplyDropOnly || ownedPlanes.has(p.id));
  const visibleBombs = BOMBS.filter(b => !b.findInSupplyDropOnly || ownedBombs.has(b.id));
  const visibleGuns = GUNS.filter(g => !g.findInSupplyDropOnly || ownedGuns.has(g.id));

  return (
    <div className="w-full max-w-5xl bg-gray-900/70 p-6 rounded-lg shadow-2xl border border-cyan-500/50">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold text-white">Armory</h2>
            <div className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-full text-2xl">
                💰 {currency}
            </div>
        </div>

        {/* Planes Section */}
        <div className="mb-8">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-400/50 pb-2">Planes</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {visiblePlanes.map(plane => (
                    <ShopItemCard 
                        key={plane.id}
                        item={plane}
                        isOwned={ownedPlanes.has(plane.id)}
                        isEquipped={equippedPlaneId === plane.id}
                        canAfford={currency >= (plane.cost || 0)}
                        onBuy={() => onBuyItem(plane.id, 'plane', plane.cost!)}
                        onEquip={() => onEquipPlane(plane.id)}
                    />
                ))}
            </div>
        </div>

        {/* Weapons Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-4 border-b-2 border-yellow-400/50 pb-2">Bombs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleBombs.map(bomb => (
                        <ShopItemCard 
                            key={bomb.id}
                            item={bomb}
                            isOwned={ownedBombs.has(bomb.id)}
                            isEquipped={equippedBombId === bomb.id}
                            canAfford={currency >= (bomb.cost || 0)}
                            onBuy={() => onBuyItem(bomb.id, 'bomb', bomb.cost!)}
                            onEquip={() => onEquipBomb(bomb.id)}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold text-green-400 mb-4 border-b-2 border-green-400/50 pb-2">Guns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleGuns.map(gun => (
                        <ShopItemCard 
                            key={gun.id}
                            item={gun}
                            isOwned={ownedGuns.has(gun.id)}
                            isEquipped={equippedGunId === gun.id}
                            canAfford={currency >= (gun.cost || 0)}
                            onBuy={() => onBuyItem(gun.id, 'gun', gun.cost!)}
                            onEquip={() => onEquipGun(gun.id)}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Power-ups Section */}
        <div className="mt-8">
            <h3 className="text-2xl font-bold text-red-400 mb-4 border-b-2 border-red-400/50 pb-2">Consumables</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {POWER_UPS.map(powerUp => {
                    const quantity = ownedPowerUps[powerUp.id] || 0;
                    return (
                        <PowerUpItemCard 
                            key={powerUp.id}
                            item={powerUp}
                            quantity={quantity}
                            isEquipped={equippedPowerUpId === powerUp.id}
                            canAfford={currency >= powerUp.cost}
                            onBuy={() => onBuyItem(powerUp.id, 'powerup', powerUp.cost)}
                            onEquip={() => onEquipPowerUp(powerUp.id)}
                        />
                    )
                })}
            </div>
        </div>

        <div className="text-center mt-8">
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

export default ShopScreen;