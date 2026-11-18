import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw } from 'lucide-react';
import { getAvatarById } from '../Artwork/AvatarIcons.js';

export const GameOverModal: React.FC = () => {
  const { gameState, leaveRoom } = useGame();

  useEffect(() => {
    if (gameState?.phase === 'ENDED') {
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // silent fallback
      }
    }
  }, [gameState?.phase]);

  if (!gameState || gameState.phase !== 'ENDED') return null;

  const winner = gameState.winner;
  const winningTeam = gameState.winningTeam;
  const isTeamWin = gameState.settings.teamMode && winningTeam;
  const sortedPlayers = [...gameState.players].sort((a, b) => b.netWorth - a.netWorth);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#122419] border-4 border-[#B58A30] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 sm:p-8 text-center space-y-6 text-[#EDE6D6]">
        {/* Crest & Winner Announcement */}
        <div>
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1E3B2B] border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-3 shadow-gold-seal">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="text-xs uppercase font-serif font-black tracking-widest text-[#D4AF37]">
            Official Match Adjudication
          </span>
          <h2 className="text-3xl font-display font-black text-white mt-1">
            {isTeamWin ? `TEAM ${winningTeam.toUpperCase()} PREVAILS!` : `${winner?.nickname} WINS!`}
          </h2>
          <p className="text-xs font-serif text-[#C8BCAB] mt-1">
            {isTeamWin 
              ? 'The rival cartel has been bankrupted and purged from the municipal council.' 
              : 'All other tycoons succumbed to financial defeat. The metropolis belongs to one ruler.'}
          </p>
        </div>

        {/* Final Standings Table */}
        <div className="bg-[#0A160F] rounded-2xl border border-[#3B281A] p-4 text-left">
          <div className="text-xs font-serif uppercase tracking-widest text-[#D4AF37] mb-3">
            Final Standings & Net Worth
          </div>
          <div className="space-y-2">
            {sortedPlayers.map((p, idx) => {
              const av = getAvatarById(p.avatar);
              const isWinner = isTeamWin ? p.team === winningTeam : idx === 0;

              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isWinner
                      ? 'bg-[#183626] border-[#D4AF37] text-[#FCE794] font-bold shadow-sm'
                      : 'bg-[#122419] border-[#2D3E32] text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[#8C7A65] w-5">#{idx + 1}</span>
                    <div className="w-7 h-7 rounded-lg overflow-hidden border" style={{ borderColor: p.color }}>
                      <av.Component className="w-full h-full" />
                    </div>
                    <div>
                      <span className="font-display font-bold block">{p.nickname}</span>
                      {gameState.settings.teamMode && (
                        <span className="text-[9px] font-mono text-[#8C7A65] uppercase">
                          Team {p.team}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-right">
                    <span className="text-[#8C7A65] mr-2 text-[10px]">{p.properties.length} deeds</span>
                    <span className="font-bold text-white">${p.netWorth}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Button */}
        <button
          type="button"
          onClick={leaveRoom}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E2B755] to-[#B8860B] text-[#12241A] font-display font-black text-sm uppercase tracking-widest shadow-gold-seal hover:brightness-110 transition flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return to Great Hall</span>
        </button>
      </div>
    </div>
  );
};
