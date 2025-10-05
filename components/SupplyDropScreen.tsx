import React, { useState, useCallback } from 'react';
import { Plane, BombType, GunType } from '../types';
import { SUPPLY_DROP_COST, RARITY_COLORS, DUPLICATE_CURRENCY_AWARD } from '../constants';

interface SupplyDropScreenProps {
  currency: number;
  onOpenSupplyDrop: () => { item: Plane | BombType | GunType, isDuplicate: boolean };
  onBack: () => void;
}

const SupplyDropScreen: React.FC<SupplyDropScreenProps> = ({ currency, onOpenSupplyDrop, onBack }) => {
    const [isOpening, setIsOpening] = useState(false);
    const [wonItem, setWonItem] = useState<{ item: Plane | BombType | GunType, isDuplicate: boolean } | null>(null);

    const handleOpen = useCallback(() => {
        if (currency < SUPPLY_DROP_COST || isOpening) return;
        
        setIsOpening(true);
        setWonItem(null);

        setTimeout(() => {
            const result = onOpenSupplyDrop();
            setWonItem(result);
            setIsOpening(false);
        }, 2000); // 2-second animation
    }, [currency, isOpening, onOpenSupplyDrop]);

    const renderResult = () => {
        if (!wonItem) return null;

        const { item, isDuplicate } = wonItem;
        const borderColor = RARITY_COLORS[item.rarity] || 'border-cyan-500/50';

        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
                <div className={`bg-gray-800 p-8 rounded-lg border-4 ${borderColor} max-w-sm w-full text-center`}>
                    <h2 className="text-2xl font-bold mb-2">{isDuplicate ? "DUPLICATE!" : "YOU GOT:"}</h2>
                    <div className="text-7xl my-4">{item.emoji}</div>
                    <h3 className="text-3xl font-bold" style={{ color: borderColor.split('-')[1] ? `var(--tw-color-${borderColor.split('-')[1]}-500)` : 'white' }}>{item.name}</h3>
                    <p className="text-lg text-gray-300 mb-4">{item.description}</p>
                    {isDuplicate && (
                        <p className="text-xl text-yellow-400 font-bold mb-4">You received 💰{DUPLICATE_CURRENCY_AWARD} back!</p>
                    )}
                    <button
                        onClick={() => setWonItem(null)}
                        className="px-6 py-2 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-2xl bg-gray-900/70 p-6 rounded-lg shadow-2xl border border-purple-500/50 text-center">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-bold text-white">Supply Drop</h2>
                <div className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-full text-2xl">
                    💰 {currency}
                </div>
            </div>

            <div className="my-8">
                <div className={`text-9xl cursor-pointer transition-transform duration-200 ${isOpening ? 'animate-shake' : 'hover:scale-110'}`} onClick={handleOpen}>
                    🎁
                </div>
                <p className="text-lg mt-4 text-gray-300">A chance to win rare and legendary weapons!</p>
            </div>
            
            <button
                onClick={handleOpen}
                disabled={currency < SUPPLY_DROP_COST || isOpening}
                className="w-full mt-2 px-4 py-3 bg-purple-500 text-gray-900 font-bold text-xl rounded-lg hover:bg-purple-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isOpening ? 'Opening...' : `Buy Crate for 💰${SUPPLY_DROP_COST}`}
            </button>

            <div className="text-center mt-8">
                <button
                onClick={onBack}
                className="px-8 py-3 bg-gray-600 text-white font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400"
                >
                Back to Menu
                </button>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
                    transform: translate3d(0, 0, 0);
                }
                 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
            
            {renderResult()}
        </div>
    );
};

export default SupplyDropScreen;