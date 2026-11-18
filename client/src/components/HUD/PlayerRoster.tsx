import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { getAvatarById } from '../Artwork/AvatarIcons.js';
import { getTokenById } from '../Artwork/TokenIcons.js';
import { COLOR_GROUP_CONFIG, getTileById } from '@tycoonvale/shared';
import { Crown, Lock, Skull, WifiOff, TrendingUp } from 'lucide-react';
import { AnimatedCurrency } from './AnimatedCurrency.js';

export const PlayerRoster: React.FC = () => {
  const { gameState, player } = useGame();

  if (!gameState) return null;

  return (
    <div className="bg-[#0F2218] border-2 border-[#4A3828] rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#3B281A] pb-2">
        <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
          High Council Standings
        </span>
        <span className="text-[11px] font-mono text-[#8C7A65]">
          {gameState.players.filter(p => !p.isBankrupt).length} Active
        </span>
      </div>

      <div className="space-y-2.5">
        {gameState.players.map((p) => {
          const isActiveTurn = gameState.turn.activePlayerId === p.id;
          const isMe = p.id === player?.id;
          const avatar = getAvatarById(p.avatar);
          const token = getTokenById(p.token);

          return (
            <div
              key={p.id}
              style={{ borderLeftColor: p.color }}
              className={`p-2.5 rounded-xl bg-[#0A160F] border-y border-r border-l-4 border-[#2D3E32] transition relative ${
                isActiveTurn ? 'ring-2 ring-[#D4AF37] shadow-brass-glow' : ''
              } ${p.isBankrupt ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-9 h-9 rounded-xl bg-[#142B1F] border p-0.5 relative flex items-center justify-center shadow"
                    style={{ borderColor: p.color }}
                  >
                    <avatar.Component className="w-full h-full" />
                    {p.isHost && (
                      <div className="absolute -top-1 -right-1 bg-[#D4AF37] rounded-full p-0.5">
                        <Crown className="w-2.5 h-2.5 text-[#12241A]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-display font-bold text-white truncate max-w-[100px]">
                        {p.nickname}
                      </span>
                      {isMe && (
                        <span className="text-[9px] bg-[#1E3B2B] text-[#D4AF37] px-1 py-0.2 rounded font-mono">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-[#A99D8D] font-serif">
                      <div className="w-3.5 h-3.5">
                        <token.Component color={p.color} />
                      </div>
                      <span>{token.name}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center space-x-1">
                  {p.isBankrupt ? (
                    <span className="text-[9px] font-serif text-red-400 flex items-center space-x-0.5 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                      <Skull className="w-3 h-3" />
                      <span>Bankrupt</span>
                    </span>
                  ) : p.inJail ? (
                    <span className="text-[9px] font-serif text-orange-400 flex items-center space-x-0.5 bg-orange-950/80 px-1.5 py-0.5 rounded border border-orange-800">
                      <Lock className="w-3 h-3" />
                      <span>Detention</span>
                    </span>
                  ) : p.isDisconnected ? (
                    <span className="text-[9px] text-slate-500 flex items-center space-x-0.5 bg-slate-900 px-1.5 py-0.5 rounded">
                      <WifiOff className="w-3 h-3" />
                    </span>
                  ) : null}

                  {gameState.settings.teamMode && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      p.team === 'silver' ? 'bg-slate-700 text-slate-200' : 'bg-amber-700/80 text-amber-200'
                    }`}>
                      {p.team === 'silver' ? 'Silver' : 'Gold'}
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Metrics: Cash & Net Worth */}
              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                  <span>Cash:</span>
                  <AnimatedCurrency value={p.balance} showDelta={true} />
                </div>
                <div className="flex items-center space-x-1 text-[#C8BCAB]">
                  <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                  <span>Equity: </span>
                  <AnimatedCurrency value={p.netWorth} showDelta={false} />
                </div>
              </div>

              {/* Property Portfolio color chips */}
              {p.properties.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-[#1C2C22]">
                  {p.properties.map((tileId) => {
                    const tile = getTileById(tileId);
                    const colorHex = tile.group ? COLOR_GROUP_CONFIG[tile.group]?.colorHex : '#475569';
                    const prop = gameState.properties[tileId];

                    return (
                      <div
                        key={tileId}
                        title={`${tile.name}${prop?.hotel ? ' (Hotel)' : prop?.houses ? ` (${prop.houses}H)` : ''}`}
                        style={{ backgroundColor: colorHex }}
                        className={`h-2.5 px-1 rounded-sm text-[8px] font-bold text-white flex items-center justify-center ${
                          prop?.isMortgaged ? 'opacity-40 line-through' : ''
                        }`}
                      >
                        {prop?.hotel ? '★' : prop?.houses ? prop.houses : ''}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
