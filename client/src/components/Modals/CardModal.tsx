import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import { Sparkles, HelpCircle, X } from 'lucide-react';

export const CardModal: React.FC = () => {
  const { gameState } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);

  useEffect(() => {
    if (gameState?.lastCardDrawn && gameState.lastCardDrawn.id !== currentCardId) {
      setCurrentCardId(gameState.lastCardDrawn.id);
      setIsOpen(true);
    }
  }, [gameState?.lastCardDrawn, currentCardId]);

  if (!isOpen || !gameState?.lastCardDrawn) return null;

  const card = gameState.lastCardDrawn;
  const drawPlayer = gameState.players.find(p => p.id === gameState.cardDrawPlayerId);
  const isFortune = card.deck === 'fortune';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative select-none transform transition animate-float">
        {/* Card Header */}
        <div className={`p-6 text-center text-white relative ${
          isFortune 
            ? 'bg-gradient-to-br from-purple-800 to-indigo-900' 
            : 'bg-gradient-to-br from-cyan-800 to-blue-900'
        }`}>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3">
            {isFortune ? <Sparkles className="w-6 h-6 text-amber-300" /> : <HelpCircle className="w-6 h-6 text-cyan-300" />}
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
            {isFortune ? 'Fortune Chest' : 'Opportunity Vault'}
          </span>
          <h2 className="text-xl font-display font-black mt-1 text-white">{card.title}</h2>
          {drawPlayer && (
            <span className="text-xs text-white/80 block mt-1">Drawn by {drawPlayer.nickname}</span>
          )}
        </div>

        {/* Card Description */}
        <div className="p-6 text-center space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            "{card.description}"
          </p>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
          >
            Continue Match
          </button>
        </div>
      </div>
    </div>
  );
};
