import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BoardTile as TileType, PropertyState, Player, BoardTheme } from '@tycoonvale/shared';
import { COLOR_GROUP_CONFIG } from '@tycoonvale/shared';
import { THEME_CONFIGS } from '../../styles/themes.js';
import { getTokenById } from '../Artwork/TokenIcons.js';
import type { ActiveTileEffect } from '../../context/GameContext.js';
import { 
  Train, 
  Zap, 
  Droplet, 
  HelpCircle, 
  ShieldAlert, 
  ParkingCircle, 
  Lock, 
  Compass, 
  Building 
} from 'lucide-react';

interface BoardTileProps {
  tile: TileType;
  propertyState?: PropertyState;
  playersOnTile: Player[];
  owner?: Player;
  isCurrentTurnTile: boolean;
  walkingPlayerId?: string | null;
  tileEffect?: ActiveTileEffect | null;
  edge: 'bottom' | 'left' | 'top' | 'right' | 'corner';
  theme: BoardTheme;
  onClick: () => void;
}

const renderEffectBadge = (tileEffect?: ActiveTileEffect | null) => (
  <AnimatePresence>
    {tileEffect && (
      <motion.div
        key={tileEffect.timestamp}
        data-testid={`tile-effect-${tileEffect.type}`}
        initial={{ opacity: 0, y: 6, scale: 0.75 }}
        animate={{ opacity: 1, y: -10, scale: 1 }}
        exit={{ opacity: 0, y: -22, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        className={`pointer-events-none absolute inset-x-0 top-1 flex justify-center z-30`}
      >
        <span
          className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-black shadow-lg border whitespace-nowrap ${
            tileEffect.type === 'purchase'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-400'
              : tileEffect.type === 'jackpot'
              ? 'bg-amber-950/95 text-[#FCE794] border-[#D4AF37]'
              : 'bg-rose-950/95 text-rose-200 border-rose-400'
          }`}
        >
          {tileEffect.type === 'purchase'
            ? tileEffect.amount
              ? `SOLD $${tileEffect.amount}`
              : 'DEED CLAIMED'
            : tileEffect.type === 'rent'
            ? `RENT -$${tileEffect.amount ?? 0}`
            : tileEffect.type === 'jackpot'
            ? `+$${tileEffect.amount ?? 0}!`
            : `TAX -$${tileEffect.amount ?? 0}`}
        </span>
      </motion.div>
    )}
  </AnimatePresence>
);

export const BoardTileComponent: React.FC<BoardTileProps> = React.memo(({
  tile,
  propertyState,
  playersOnTile,
  owner,
  isCurrentTurnTile,
  walkingPlayerId,
  tileEffect,
  edge: _edge,
  theme,
  onClick
}) => {
  const themeConfig = THEME_CONFIGS[theme || 'classic'];
  const groupConfig = tile.group ? COLOR_GROUP_CONFIG[tile.group] : null;

  const renderIcon = () => {
    if (tile.type === 'station') return <Train className="w-4 h-4 opacity-75" />;
    if (tile.id === 12) return <Zap className="w-4 h-4 text-amber-500" />;
    if (tile.id === 28) return <Droplet className="w-4 h-4 text-cyan-500" />;
    if (tile.type === 'card') return <HelpCircle className="w-4 h-4 text-purple-500" />;
    if (tile.type === 'tax') return <span className="font-serif font-black text-xs text-red-600">$</span>;
    return null;
  };

  // Corner Tiles Rendering
  if (tile.type === 'corner') {
    return (
      <div
        onClick={onClick}
        className={`w-full h-full relative cursor-pointer select-none p-1.5 flex flex-col justify-between items-center transition ${themeConfig.tileBg} ${themeConfig.tileText} border ${themeConfig.tileBorder} hover:brightness-105 ${
          isCurrentTurnTile ? 'ring-2 ring-[#D4AF37] ring-inset shadow-brass-glow z-10' : ''
        }`}
      >
        {tile.cornerType === 'go' && (
          <div className="w-full h-full flex flex-col items-center justify-between py-1 text-center">
            <span className="text-[9px] font-serif font-bold text-emerald-700 uppercase tracking-widest">Collect $200</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100/80 border border-emerald-600/40 flex items-center justify-center shadow-inner">
              <Compass className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="font-display font-black text-sm tracking-widest text-[#170E08]">GO</span>
          </div>
        )}

        {tile.cornerType === 'jail' && (
          <div className="w-full h-full flex flex-col justify-between items-center text-center py-1">
            <span className="text-[8px] font-serif uppercase tracking-wider text-slate-500">Detention</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100/80 border border-orange-600/40 flex items-center justify-center shadow-inner">
              <Lock className="w-4 h-4 text-orange-700" />
            </div>
            <span className="text-[9px] font-serif font-bold text-orange-800">Just Visiting</span>
          </div>
        )}

        {tile.cornerType === 'parking' && (
          <div className="w-full h-full flex flex-col justify-between items-center text-center py-1">
            <span className="text-[8px] font-serif uppercase tracking-wider text-slate-500">Grand Plaza</span>
            <div className="w-8 h-8 rounded-full bg-blue-100/80 border border-blue-600/40 flex items-center justify-center shadow-inner">
              <ParkingCircle className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-[9px] font-serif font-bold text-blue-800">Free Rest</span>
          </div>
        )}

        {tile.cornerType === 'gotojail' && (
          <div className="w-full h-full flex flex-col justify-between items-center text-center py-1">
            <span className="text-[8px] font-serif uppercase tracking-wider text-red-600">Sanction</span>
            <div className="w-8 h-8 rounded-lg bg-red-100/80 border border-red-600/40 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-5 h-5 text-red-700" />
            </div>
            <span className="text-[9px] font-display font-black text-red-800 tracking-tight">GO TO JAIL</span>
          </div>
        )}

        {renderEffectBadge(tileEffect)}

        {/* Players occupying corner tile (Orbital non-overlapping grid) */}
        {playersOnTile.length > 0 && (
          <div className="absolute inset-x-1 bottom-1 flex flex-wrap justify-center gap-1 z-20 pointer-events-none">
            {playersOnTile.map(p => {
              const token = getTokenById(p.token);
              const isWalking = walkingPlayerId === p.id;
              return (
                <motion.div
                  key={`${p.id}-${tile.id}`}
                  initial={isWalking ? { y: -11, scale: 1.24 } : { scale: 0.9, opacity: 0.85 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                  title={`${p.nickname}`}
                  className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md animate-token-bob flex items-center justify-center will-change-transform"
                >
                  <token.Component color={p.color} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Edge Tiles Rendering
  return (
    <div
      onClick={onClick}
      className={`w-full h-full relative cursor-pointer select-none flex flex-col justify-between transition border ${themeConfig.tileBg} ${themeConfig.tileText} ${themeConfig.tileBorder} hover:brightness-105 ${
        isCurrentTurnTile ? 'ring-2 ring-[#D4AF37] ring-inset shadow-brass-glow z-10' : ''
      }`}
    >
      {/* Color District Bar */}
      {groupConfig && (
        <div
          style={{ backgroundColor: groupConfig.colorHex }}
          className="w-full h-3 sm:h-4 flex items-center justify-center relative shadow-sm border-b border-black/20"
        >
          {/* 3D-styled Houses or Luxury Hotel */}
          {propertyState && (
            <div className="flex items-center space-x-0.5 z-10">
              {propertyState.hotel ? (
                <div className="flex items-center space-x-0.5 px-1 bg-[#851818] rounded border border-[#FEF08A] text-[8px] font-black text-amber-200 shadow">
                  <Building className="w-2.5 h-2.5 text-amber-300" />
                  <span>HOTEL</span>
                </div>
              ) : propertyState.houses > 0 ? (
                Array.from({ length: propertyState.houses }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 rounded-[2px] bg-[#16A34A] border border-[#14532D] shadow-sm transform -rotate-6"
                    title={`${propertyState.houses} House(s)`}
                  />
                ))
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Main Title & Value */}
      <div className="flex-1 p-1 flex flex-col items-center justify-between text-center overflow-hidden">
        <span className="text-[8px] sm:text-[9.5px] font-serif font-bold leading-tight line-clamp-2 px-0.5 mt-0.5">
          {tile.name}
        </span>

        <div className="my-0.5">{renderIcon()}</div>

        <div className="w-full flex items-center justify-center">
          {tile.price ? (
            <span className="text-[8px] sm:text-[10px] font-mono font-bold opacity-80">
              ${tile.price}
            </span>
          ) : tile.taxAmount ? (
            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-red-600">
              Pay ${tile.taxAmount}
            </span>
          ) : null}
        </div>
      </div>

      {/* Mortgaged Wax-Seal Ribbon */}
      {propertyState?.isMortgaged && (
        <div className="absolute inset-0 bg-[#3B0E14]/85 backdrop-blur-[1px] flex items-center justify-center z-15">
          <span className="text-[8px] font-display font-black text-red-200 border border-red-400 px-1 py-0.5 rounded bg-black/60 rotate-[-12deg] shadow">
            MORTGAGED
          </span>
        </div>
      )}

      {renderEffectBadge(tileEffect)}

      {/* Owner Color Ribbon */}
      {owner && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{ backgroundColor: owner.color }}
          className="w-full h-1 sm:h-1.5 shadow origin-left"
          title={`Owned by ${owner.nickname}`}
        />
      )}

      {/* Multi-Token Occupancy (Orbital Layout) */}
      {playersOnTile.length > 0 && (
        <div className="absolute inset-x-0 bottom-2 flex flex-wrap justify-center gap-1 z-20 pointer-events-none">
          {playersOnTile.map(p => {
            const token = getTokenById(p.token);
            const isWalking = walkingPlayerId === p.id;
            return (
              <motion.div
                key={`${p.id}-${tile.id}`}
                initial={isWalking ? { y: -11, scale: 1.24 } : { scale: 0.9, opacity: 0.85 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                title={`${p.nickname}`}
                className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md animate-token-bob flex items-center justify-center will-change-transform"
              >
                <token.Component color={p.color} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});

BoardTileComponent.displayName = 'BoardTileComponent';
