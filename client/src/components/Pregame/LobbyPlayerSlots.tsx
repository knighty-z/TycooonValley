import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@tycoonvale/shared';
import type { ThemeConfig, TokenDef } from '../../themes/types.js';
import type { RealtimeConnectionStatus } from '../../services/supabase/realtime.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import {
  Crown,
  CheckCircle2,
  Clock,
  WifiOff,
  RefreshCw,
  UserPlus,
  Users
} from 'lucide-react';

export interface LobbyPlayerSlotsProps {
  players: Player[];
  maxPlayers: number;
  localPlayerId: string;
  themeConfig: ThemeConfig;
  tokenMap: Record<string, TokenDef>;
  colorMap: Record<string, { hex: string; ink: string }>;
  teamMode: boolean;
  connectionStatus?: RealtimeConnectionStatus;
  onSetTeam?: (team: 'gold' | 'silver') => void;
}

export const LobbyPlayerSlots: React.FC<LobbyPlayerSlotsProps> = React.memo(
  ({
    players,
    maxPlayers,
    localPlayerId,
    themeConfig,
    tokenMap,
    colorMap,
    teamMode,
    connectionStatus = 'CONNECTED',
    onSetTeam
  }) => {
    const isChamfered = themeConfig.chamfered;
    const headingTransform = themeConfig.fonts.headingUppercase ? 'uppercase' : 'none';
    const readyCount = players.filter(p => p.isReady).length;
    const clampedMax = Math.max(2, Math.min(6, maxPlayers));
    const emptySlotCount = Math.max(0, clampedMax - players.length);

    // Deliberate balanced layout: 2-player rooms use spacious 1-col or 2-col cards; 3-6 use 2-col grid
    const gridColsClass = clampedMax <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2';

    return (
      <section
        aria-label="Lobby Players"
        data-testid="lobby-player-slots"
        data-chamfered={isChamfered ? 'true' : 'false'}
        className="tv-pregame-surface flex flex-col p-3.5 overflow-hidden"
      >
        {/* Header */}
        <div
          style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 48%, transparent)' }}
          className="flex items-center justify-between pb-2 mb-2.5 border-b shrink-0"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                textTransform: headingTransform
              }}
              className="text-sm font-bold tracking-wider"
            >
              Table Roster
            </h2>
            <span
              style={{
                backgroundColor: 'color-mix(in srgb, var(--bg) 85%, var(--board))',
                borderColor: 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                borderRadius: isChamfered ? '0px' : '9999px'
              }}
              className="px-2 py-0.5 border text-[10px] font-bold tabular-nums"
            >
              {players.length} / {clampedMax}
            </span>
          </div>

          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ color: readyCount === players.length && players.length >= 2 ? '#34D399' : 'var(--accent)' }}
          >
            {readyCount}/{players.length} Ready
          </span>
        </div>

        {/* Player Profile Grid */}
        <div className={`grid ${gridColsClass} gap-2 overflow-y-auto tv-hud-scroll pr-0.5`}>
          <AnimatePresence initial={false}>
            {players.map(p => {
              const isMe = p.id === localPlayerId;
              const tokenDef = tokenMap[p.id] ?? themeConfig.tokens[0];
              const pColor = colorMap[p.id]?.hex ?? p.color;
              const isReconnectingMe = isMe && connectionStatus === 'RECONNECTING';
              const isOffline = !isReconnectingMe && p.isDisconnected;

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  data-testid={`lobby-slot-${p.id}`}
                  data-ready={p.isReady ? 'true' : 'false'}
                  data-disconnected={isOffline ? 'true' : 'false'}
                  style={{
                    backgroundColor: isMe
                      ? `color-mix(in srgb, ${pColor} 12%, var(--bg))`
                      : 'color-mix(in srgb, var(--bg) 82%, var(--board))',
                    borderTopColor: isMe
                      ? pColor
                      : p.isReady
                      ? 'rgba(16, 185, 129, 0.45)'
                      : 'color-mix(in srgb, var(--tile-border) 48%, transparent)',
                    borderRightColor: isMe
                      ? pColor
                      : p.isReady
                      ? 'rgba(16, 185, 129, 0.45)'
                      : 'color-mix(in srgb, var(--tile-border) 48%, transparent)',
                    borderBottomColor: isMe
                      ? pColor
                      : p.isReady
                      ? 'rgba(16, 185, 129, 0.45)'
                      : 'color-mix(in srgb, var(--tile-border) 48%, transparent)',
                    borderLeftColor: pColor,
                    borderRadius: isChamfered ? '0px' : '4px'
                  }}
                  className={`relative border border-l-[3px] p-2.5 flex flex-col gap-2 transition-colors ${
                    isOffline ? 'opacity-65' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Prominent Token / Collectible Figurine Preview */}
                    <div
                      style={{
                        backgroundColor: `color-mix(in srgb, ${pColor} 14%, var(--bg))`,
                        borderColor: `color-mix(in srgb, ${pColor} 58%, transparent)`,
                        borderRadius: isChamfered ? '0px' : '6px'
                      }}
                      className="relative w-14 h-14 shrink-0 border flex items-center justify-center overflow-visible"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${themeConfig.id}-${tokenDef.id}`}
                          initial={{ opacity: 0, scale: 0.85, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.16 }}
                          className="flex items-center justify-center"
                        >
                          {tokenDef.imageSrc ? (
                            <img
                              src={tokenDef.imageSrc}
                              alt={tokenDef.name}
                              draggable={false}
                              className="w-[52px] h-[52px] object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,0.68)]"
                            />
                          ) : (
                            <WorldTokenIcon
                              tokenId={tokenDef.id}
                              tokenDef={tokenDef}
                              worldId={themeConfig.id}
                              color={pColor}
                              size={42}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {p.isHost && (
                        <span
                          title="Room Host"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: themeConfig.id === 'valorant' ? '#FFFFFF' : '#0B1218'
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                        >
                          <Crown className="w-3 h-3" strokeWidth={2.5} />
                        </span>
                      )}
                    </div>

                    {/* Player Identity + Character Name + Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: pColor }}
                          aria-hidden="true"
                        />
                        <span className="font-bold text-xs sm:text-[13px] truncate leading-tight">
                          {p.nickname}
                        </span>
                        {isMe && (
                          <span
                            style={{
                              backgroundColor: `color-mix(in srgb, ${pColor} 22%, var(--bg))`,
                              borderColor: `color-mix(in srgb, ${pColor} 60%, transparent)`,
                              color: pColor,
                              borderRadius: isChamfered ? '0px' : '3px'
                            }}
                            className="px-1 py-0.2 border text-[9px] font-extrabold uppercase tracking-wider shrink-0"
                          >
                            You
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] opacity-75 truncate mt-0.5">
                        {tokenDef.name}
                        {p.isHost && <span className="opacity-70"> · Host</span>}
                      </div>

                      {/* Connection + Readiness Status Pill */}
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {isReconnectingMe ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-sm">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>Reconnecting</span>
                          </span>
                        ) : isOffline ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/40 rounded-sm">
                            <WifiOff className="w-2.5 h-2.5" />
                            <span>Disconnected</span>
                          </span>
                        ) : p.isReady ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/18 text-emerald-300 border border-emerald-400/40 rounded-sm">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Ready</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-200/90 border border-amber-400/35 rounded-sm">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Selecting</span>
                          </span>
                        )}

                        {teamMode && (
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border ${
                              p.team === 'silver'
                                ? 'bg-slate-600/30 text-slate-200 border-slate-400/40'
                                : 'bg-amber-600/25 text-amber-200 border-amber-400/40'
                            }`}
                          >
                            Team {p.team === 'silver' ? 'Silver' : 'Gold'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Switcher for Local Player when Team Mode is enabled */}
                  {teamMode && isMe && onSetTeam && (
                    <div
                      style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 38%, transparent)' }}
                      className="pt-1.5 border-t flex items-center justify-between gap-2 text-[10px]"
                    >
                      <span className="opacity-70 uppercase tracking-wider font-semibold">Team</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSetTeam('gold')}
                          className={`px-2 py-0.5 font-bold uppercase tracking-wider border transition ${
                            p.team !== 'silver'
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-transparent opacity-70 hover:opacity-100 border-white/20'
                          }`}
                        >
                          Gold
                        </button>
                        <button
                          type="button"
                          onClick={() => onSetTeam('silver')}
                          className={`px-2 py-0.5 font-bold uppercase tracking-wider border transition ${
                            p.team === 'silver'
                              ? 'bg-slate-200 text-slate-950 border-white'
                              : 'bg-transparent opacity-70 hover:opacity-100 border-white/20'
                          }`}
                        >
                          Silver
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Architectural Empty Seats */}
          {Array.from({ length: emptySlotCount }).map((_, idx) => {
            const seatNumber = players.length + idx + 1;
            return (
              <div
                key={`empty-seat-${seatNumber}`}
                data-testid={`lobby-empty-slot-${seatNumber}`}
                style={{
                  borderColor: 'color-mix(in srgb, var(--tile-border) 34%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--bg) 55%, transparent)',
                  borderRadius: isChamfered ? '0px' : '4px'
                }}
                className="border border-dashed p-2.5 min-h-[76px] flex items-center gap-2.5 opacity-60"
              >
                <div
                  style={{
                    borderColor: 'color-mix(in srgb, var(--tile-border) 42%, transparent)',
                    borderRadius: isChamfered ? '0px' : '6px'
                  }}
                  className="w-11 h-11 border border-dashed flex items-center justify-center shrink-0"
                >
                  <UserPlus className="w-4 h-4 opacity-60" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold opacity-85">Seat {seatNumber} Open</div>
                  <div className="text-[10px] opacity-65 truncate">Waiting for challenger</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
);

LobbyPlayerSlots.displayName = 'LobbyPlayerSlots';
