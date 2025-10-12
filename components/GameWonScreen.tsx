
import React from 'react';
import { audioManager } from '../utils/audioManager';

interface GameWonScreenProps {
  score: number;
  score2?: number;
  onRestart: () => void;
  onMenu: () => void;
  xpEarned: number;
  levelUpInfo: { old: number; new: number } | null;
}

const GameWonScreen: React.FC<GameWonScreenProps> = ({ score, score2, onRestart, onMenu, xpEarned, levelUpInfo }) => {
    const isMultiplayer = score2 !== undefined;
    let winnerText = '';
    if (isMultiplayer) {
        if (score > score2) {
        winnerText = 'Player 1 Wins!';
        } else if (score2 > score) {
        winnerText = 'Player 2 Wins!';
        } else {
        winnerText = "It's a Tie!";
        }
    }

  return (
    <div className="flex flex-col items-center justify-center bg-green-900/50 p-10 rounded-lg shadow-2xl border border-green-500/50 text-center">
      <h2 className="text-5xl font-bold text-green-400 mb-4">VICTORY!</h2>
       {isMultiplayer ? (
        <>
            <p className="text-3xl text-yellow-400 mb-4 font-bold">{winnerText}</p>
            <div className="flex justify-around w-full text-2xl mb-2">
                <p>P1 Score: <span className="font-bold text-white">{score}</span></p>
                <p>P2 Score: <span className="font-bold text-white">{score2}</span></p>
            </div>
        </>
      ) : (
        <>
            <p className="text-2xl text-white mb-2">You defeated the final boss and saved the day!</p>
            <p className="text-2xl text-white mb-2">Your final score: <span className="font-bold text-yellow-400">{score}</span></p>
        </>
      )}
      <div className="text-xl text-white my-4">
        <p>XP Gained: <span className="font-bold text-yellow-400">+{xpEarned}</span></p>
        {levelUpInfo && (
            <p className="mt-2 text-2xl font-bold text-cyan-300 animate-pulse">
                LEVEL UP! {levelUpInfo.old} ➜ {levelUpInfo.new}
            </p>
        )}
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          Level Select
        </button>
        <button
          onClick={onMenu}
          className="px-6 py-3 bg-gray-600 text-white font-bold text-lg rounded-lg transform transition-transform duration-200 hover:scale-110 hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
};

export default GameWonScreen;
