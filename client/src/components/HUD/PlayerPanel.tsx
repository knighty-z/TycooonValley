import React, { useMemo, useState } from 'react';
import {
  getTileById,
  canBuildHouse,
  canSellHouse,
  canMortgage,
  canUnmortgage,
  type GameState,
  type Player,
  type PropertyState
} from '@tycoonvale/shared';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig
} from '../../themes/index.js';
import { validatePendingTrade } from '../../services/tradeValidation.js';
import { soundEngine } from '../../services/audio.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import { AnimatedCurrency } from './AnimatedCurrency.js';
import {
  Crown,
  Lock,
  Skull,
  WifiOff,
  Home,
  Building2,
  Ticket,
  CheckCircle2,
  Pin,
  Sparkles,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Shield,
  RotateCcw,
  FileText,
  Check,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export interface PlayerPanelProps {
  gameState: GameState;
  localPlayerId?: string;
  themeConfig?: ThemeConfig;
  hoveredPlayerId: string | null;
  pinnedPlayerId: string | null;
  onHoverPlayer: (playerId: string | null) => void;
  onTogglePinPlayer: (playerId: string) => void;
  onSelectTile?: (tileId: number) => void;
  onOpenTrade?: () => void;
  onAcceptTrade?: () => void;
  onRejectTrade?: () => void;
  onCounterTrade?: () => void;
  onBuildHouse?: (tileId: number) => void;
  onSellHouse?: (tileId: number) => void;
  onMortgageProperty?: (tileId: number) => void;
  onUnmortgageProperty?: (tileId: number) => void;
  initialExpandedTileId?: number | null;
}

function shortenRuleReason(reason?: string): string {
  if (!reason) return 'Unavailable';
  if (/full color set/i.test(reason)) return 'Need full set';
  if (/evenly/i.test(reason)) return 'Build evenly';
  if (/group is mortgaged/i.test(reason)) return 'Mortgaged in set';
  if (/already has a hotel/i.test(reason)) return 'Max built';
  if (/sell all houses/i.test(reason)) return 'Sell buildings first';
  if (/Insufficient funds/i.test(reason)) return 'Low cash';
  if (/No developments/i.test(reason)) return 'No buildings';
  if (/not a buildable/i.test(reason)) return 'Not buildable';
  return reason;
}

interface PortfolioSummary {
  groups: Array<{
    key: string;
    label: string;
    colorHex: string;
    ownedTiles: Array<{ id: number; name: string; state?: PropertyState }>;
    totalInGroup: number;
    isComplete: boolean;
  }>;
  totalHouses: number;
  totalHotels: number;
  mortgagedCount: number;
  completeSetsCount: number;
}

const EXPECTED_SET_SIZES = [2, 3, 3, 3, 3, 3, 3, 2];

function buildPlayerPortfolio(
  p: Player,
  properties: Record<number, PropertyState>,
  theme: ThemeConfig
): PortfolioSummary {
  const ownedIds = Object.values(properties)
    .filter(prop => prop.ownerId === p.id)
    .map(prop => prop.tileId)
    .sort((a, b) => a - b);

  // Also include player.properties fallback in case properties map is sparse
  const mergedIds = Array.from(new Set([...ownedIds, ...p.properties])).sort((a, b) => a - b);

  let totalHouses = 0;
  let totalHotels = 0;
  let mortgagedCount = 0;

  const byGroup = new Map<
    string,
    { label: string; colorHex: string; tiles: Array<{ id: number; name: string; state?: PropertyState }>; totalInGroup: number; order: number }
  >();

  for (const tid of mergedIds) {
    const def = theme.tiles[tid];
    const propState = properties[tid];
    if (!def) continue;

    if (propState?.hotel) totalHotels += 1;
    else if (propState?.houses) totalHouses += propState.houses;
    if (propState?.isMortgaged) mortgagedCount += 1;

    if (def.kind === 'property' && def.groupIndex !== undefined) {
      const key = `group-${def.groupIndex}`;
      const existing = byGroup.get(key) ?? {
        label: `Set ${def.groupIndex + 1}`,
        colorHex: theme.groupColors[def.groupIndex],
        tiles: [],
        totalInGroup: EXPECTED_SET_SIZES[def.groupIndex] ?? 3,
        order: def.groupIndex
      };
      existing.tiles.push({ id: tid, name: def.name, state: propState });
      byGroup.set(key, existing);
    } else if (def.kind === 'transport') {
      const key = 'transport';
      const existing = byGroup.get(key) ?? {
        label: 'Transit',
        colorHex: '#64748B',
        tiles: [],
        totalInGroup: 4,
        order: 8
      };
      existing.tiles.push({ id: tid, name: def.name, state: propState });
      byGroup.set(key, existing);
    } else if (def.kind === 'utility') {
      const key = 'utility';
      const existing = byGroup.get(key) ?? {
        label: 'Utilities',
        colorHex: '#0EA5E9',
        tiles: [],
        totalInGroup: 2,
        order: 9
      };
      existing.tiles.push({ id: tid, name: def.name, state: propState });
      byGroup.set(key, existing);
    }
  }

  const groups = Array.from(byGroup.entries())
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, g]) => ({
      key,
      label: g.label,
      colorHex: g.colorHex,
      ownedTiles: g.tiles,
      totalInGroup: g.totalInGroup,
      isComplete: g.order < 8 && g.tiles.length >= g.totalInGroup
    }));

  const completeSetsCount = groups.filter(g => g.isComplete).length;

  return {
    groups,
    totalHouses,
    totalHotels,
    mortgagedCount,
    completeSetsCount
  };
}

export const PlayerPanel: React.FC<PlayerPanelProps> = React.memo(
  ({
    gameState,
    localPlayerId,
    themeConfig,
    hoveredPlayerId,
    pinnedPlayerId,
    onHoverPlayer,
    onTogglePinPlayer,
    onSelectTile,
    onOpenTrade,
    onAcceptTrade,
    onRejectTrade,
    onCounterTrade,
    onBuildHouse,
    onSellHouse,
    onMortgageProperty,
    onUnmortgageProperty,
    initialExpandedTileId = null
  }) => {
    const [expandedTileId, setExpandedTileId] = useState<number | null>(initialExpandedTileId);
    const [confirmAction, setConfirmAction] = useState<{
      tileId: number;
      type: 'sell' | 'mortgage';
    } | null>(null);
    const theme = themeConfig ?? getThemeConfig(gameState.settings.theme);
    const currency = theme.currencySymbol;
    const totalTurnSec = Math.max(1, gameState.settings.turnTimeoutSeconds || 60);
    const turnTimerPct = Math.max(0, Math.min(1, gameState.turn.turnTimerSeconds / totalTurnSec));
    const timerRingRadius = 19;
    const timerRingCircumference = 2 * Math.PI * timerRingRadius;
    const timerRingOffset = timerRingCircumference * (1 - turnTimerPct);
    const isTimerLow = gameState.turn.turnTimerSeconds <= 10;
    const colorMap = useMemo(() => resolveUniquePlayerColors(gameState.players), [gameState.players]);
    const tokenMap = useMemo(
      () => resolveWorldTokensForPlayers(gameState.players, theme.tokens),
      [gameState.players, theme.tokens]
    );

    const activeHighlightId = hoveredPlayerId ?? pinnedPlayerId;

    // Richest active player (falls back to host if tied)
    const richestPlayerId = useMemo(() => {
      const alive = gameState.players.filter(p => !p.isBankrupt);
      if (alive.length === 0) return null;
      const sorted = [...alive].sort((a, b) => {
        const scoreA = a.netWorth || a.balance;
        const scoreB = b.netWorth || b.balance;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return Number(b.isHost) - Number(a.isHost);
      });
      return sorted[0]?.id ?? null;
    }, [gameState.players]);

    const portfolios = useMemo(() => {
      const map: Record<string, PortfolioSummary> = {};
      for (const p of gameState.players) {
        map[p.id] = buildPlayerPortfolio(p, gameState.properties, theme);
      }
      return map;
    }, [gameState.players, gameState.properties, theme]);

    const localPlayer =
      gameState.players.find(p => p.id === localPlayerId) ?? gameState.players[0];
    const myPortfolio = localPlayer ? portfolios[localPlayer.id] : null;

    return (
      <aside
        aria-label="Player Panel"
        className="w-full h-full flex flex-col gap-2.5 select-none relative min-h-0"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* 1. PLAYERS LIST CARD (Richup-style top-right standings with turn timer ring & status pills) */}
        <div
          data-chamfered={theme.chamfered ? 'true' : 'false'}
          className="tv-hud-panel p-2.5 flex flex-col min-h-0 shrink-0 max-h-[54%]"
        >
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)' }}
            className="flex items-center justify-between pb-1.5 mb-1.5 border-b shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--board-ink)',
                  textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-xs font-bold tracking-wider"
              >
                Players
              </span>
            </div>
            <span className="text-[11px] opacity-75 tabular-nums">
              {gameState.players.filter(p => !p.isBankrupt).length} active
            </span>
          </div>

          <div
            className="space-y-1.5 overflow-y-auto tv-hud-scroll pr-0.5 flex-1 min-h-0"
            onMouseLeave={() => onHoverPlayer(null)}
          >
            {gameState.players.map(p => {
              const isTurn = gameState.turn.activePlayerId === p.id;
              const isMe = p.id === localPlayer?.id;
              const isRichest = p.id === richestPlayerId;
              const isHighlighted = activeHighlightId === p.id;
              const isPinned = pinnedPlayerId === p.id;
              const pColor = colorMap[p.id]?.hex ?? p.color;
              const pInk = colorMap[p.id]?.ink ?? '#FFFFFF';
              const tokenDef = tokenMap[p.id];
              const summary = portfolios[p.id];
              const ownedCount = summary?.groups.reduce((acc, g) => acc + g.ownedTiles.length, 0) ?? 0;

              return (
                <div
                  key={p.id}
                  data-testid={`player-panel-row-${p.id}`}
                  data-highlighted={isHighlighted ? 'true' : 'false'}
                  onMouseEnter={() => onHoverPlayer(p.id)}
                  onClick={() => onTogglePinPlayer(p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTogglePinPlayer(p.id);
                    }
                  }}
                  style={{
                    backgroundColor: isHighlighted
                      ? `color-mix(in srgb, ${pColor} 18%, var(--bg))`
                      : 'color-mix(in srgb, var(--bg) 88%, var(--board))',
                    borderColor: isHighlighted
                      ? pColor
                      : isTurn
                      ? 'var(--accent)'
                      : 'color-mix(in srgb, var(--tile-border) 45%, transparent)',
                    borderLeftColor: pColor,
                    borderRadius: 'var(--radius-tile)',
                    boxShadow: isHighlighted
                      ? `0 0 12px ${pColor}44`
                      : isTurn
                      ? `0 0 0 1px var(--accent)`
                      : 'none'
                  }}
                  className={`relative p-2 border border-l-4 cursor-pointer transition-colors duration-100 ${
                    p.isBankrupt ? 'opacity-45 grayscale' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Left: Token + Name + Badges */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="relative w-9 h-9 flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--board) 70%, transparent)',
                          border: isTurn && !p.isBankrupt ? 'none' : `1.5px solid ${pColor}`,
                          borderRadius: theme.chamfered ? '2px' : '9999px'
                        }}
                      >
                        {/* Turn Timer Ring wrapping the active player's token */}
                        {isTurn && !p.isBankrupt && (
                          <svg
                            data-testid={`player-turn-ring-${p.id}`}
                            viewBox="0 0 42 42"
                            className="absolute -inset-[3px] w-[42px] h-[42px] -rotate-90 pointer-events-none"
                            aria-hidden="true"
                          >
                            <circle
                              cx="21"
                              cy="21"
                              r={timerRingRadius}
                              fill="none"
                              stroke="rgba(255,255,255,0.16)"
                              strokeWidth="2.5"
                            />
                            <circle
                              cx="21"
                              cy="21"
                              r={timerRingRadius}
                              fill="none"
                              stroke={isTimerLow ? '#EF4444' : pColor}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray={timerRingCircumference}
                              strokeDashoffset={timerRingOffset}
                              className="tv-turn-ring-circle"
                            />
                          </svg>
                        )}
                        <WorldTokenIcon
                          tokenId={tokenDef?.id ?? p.token}
                          tokenDef={tokenDef}
                          worldId={theme.id}
                          color={pColor}
                          size={tokenDef?.imageSrc ? 32 : 24}
                        />
                        {isRichest && !p.isBankrupt && (
                          <span
                            title="Richest Tycoon"
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow"
                            style={{ backgroundColor: 'var(--accent)', color: '#0B1218' }}
                          >
                            <Crown className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40"
                            style={{ backgroundColor: pColor }}
                            aria-hidden="true"
                          />
                          <span
                            className="text-xs font-bold truncate"
                            style={{ color: 'var(--board-ink)' }}
                          >
                            {p.nickname}
                          </span>
                          {isMe && (
                            <span
                              className="text-[9px] font-bold px-1 py-0.2 uppercase tracking-wider"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--accent) 22%, transparent)',
                                color: 'var(--accent)',
                                borderRadius: 'var(--radius-tile)'
                              }}
                            >
                              You
                            </span>
                          )}
                          {isPinned && (
                            <Pin className="w-3 h-3 shrink-0" style={{ color: pColor }} />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                          <span className="truncate">{tokenDef?.name ?? p.token}</span>
                          <span>&middot;</span>
                          <span className="tabular-nums">{ownedCount} deeds</span>
                          {isTurn && !p.isBankrupt && (
                            <span
                              className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: pColor,
                                color: pInk,
                                borderRadius: 'var(--radius-tile)'
                              }}
                            >
                              Turn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Animated Cash + Status Pills */}
                    <div className="text-right shrink-0">
                      <div
                        className="text-xs font-extrabold tabular-nums"
                        style={{ color: 'var(--board-ink)' }}
                      >
                        <AnimatedCurrency value={p.balance} prefix={currency} showDelta={true} />
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5 flex-wrap">
                        {p.isBankrupt && (
                          <span
                            data-testid={`status-bankrupt-${p.id}`}
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-rose-500/20 border border-rose-400/40 text-[9px] font-bold uppercase text-rose-300"
                          >
                            <Skull className="w-2.5 h-2.5" /> Bankrupt
                          </span>
                        )}
                        {p.inJail && !p.isBankrupt && (
                          <span
                            data-testid={`status-jail-${p.id}`}
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] font-bold uppercase text-amber-300"
                          >
                            <Lock className="w-2.5 h-2.5" /> Jail
                          </span>
                        )}
                        {p.isDisconnected && !p.isBankrupt && (
                          <span
                            data-testid={`status-disconnected-${p.id}`}
                            title="Player disconnected"
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-slate-500/25 border border-slate-400/35 text-[9px] font-bold uppercase text-slate-300"
                          >
                            <WifiOff className="w-2.5 h-2.5" /> Offline
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mini owned set dots bar */}
                  {summary && summary.groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-white/10">
                      {summary.groups.map(g =>
                        g.ownedTiles.map(t => (
                          <span
                            key={t.id}
                            title={t.name}
                            style={{
                              backgroundColor: g.colorHex,
                              borderColor: g.isComplete ? pColor : 'rgba(0,0,0,0.4)'
                            }}
                            className={`h-2 w-3.5 rounded-[2px] border ${
                              t.state?.isMortgaged ? 'opacity-35' : ''
                            }`}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Richup-style Portfolio Popover when hovered or pinned */}
                  {isHighlighted && summary && (
                    <div
                      data-testid={`player-popover-${p.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        backgroundColor: 'var(--bg)',
                        borderColor: pColor,
                        borderRadius: 'var(--radius-tile)',
                        color: 'var(--board-ink)',
                        boxShadow: `0 12px 28px rgba(0, 0, 0, 0.65), 0 0 0 1px ${pColor}66`
                      }}
                      className="lg:absolute lg:right-[calc(100%+10px)] lg:top-0 mt-2 lg:mt-0 w-full lg:w-64 p-3 border-2 z-50 text-left space-y-2 pointer-events-auto"
                    >
                      <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: pColor }}
                          />
                          <span className="text-xs font-bold truncate">{p.nickname}</span>
                        </div>
                        <span className="text-xs font-extrabold tabular-nums" style={{ color: 'var(--accent)' }}>
                          {currency}
                          {p.balance.toLocaleString()}
                        </span>
                      </div>

                      {/* Quick Metrics */}
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
                        <div className="p-1 bg-white/5 rounded">
                          <div className="opacity-70 flex items-center justify-center gap-0.5">
                            <Home className="w-2.5 h-2.5" /> Houses
                          </div>
                          <div className="font-bold tabular-nums">{summary.totalHouses}</div>
                        </div>
                        <div className="p-1 bg-white/5 rounded">
                          <div className="opacity-70 flex items-center justify-center gap-0.5">
                            <Building2 className="w-2.5 h-2.5" /> Hotels
                          </div>
                          <div className="font-bold tabular-nums">{summary.totalHotels}</div>
                        </div>
                        <div className="p-1 bg-white/5 rounded">
                          <div className="opacity-70 flex items-center justify-center gap-0.5">
                            <Ticket className="w-2.5 h-2.5" /> Pardon
                          </div>
                          <div className="font-bold tabular-nums">{p.getOutOfJailCards}</div>
                        </div>
                      </div>

                      {/* Properties Grouped by Color Set */}
                      {summary.groups.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                          {summary.groups.map(g => (
                            <div key={g.key} className="space-y-0.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1 font-bold">
                                  <span
                                    className="w-2.5 h-2.5 rounded-sm inline-block border border-black/40"
                                    style={{ backgroundColor: g.colorHex }}
                                  />
                                  <span>{g.label}</span>
                                  <span className="opacity-70 tabular-nums">
                                    ({g.ownedTiles.length}/{g.totalInGroup})
                                  </span>
                                </span>
                                {g.isComplete && (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase"
                                    style={{ color: 'var(--accent)' }}
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Full Set
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 pl-3.5">
                                {g.ownedTiles.map(t => (
                                  <span
                                    key={t.id}
                                    className={`text-[10px] px-1.5 py-0.5 rounded bg-white/10 ${
                                      t.state?.isMortgaged ? 'line-through opacity-55' : ''
                                    }`}
                                  >
                                    {t.name}
                                    {t.state?.hotel
                                      ? ' [H]'
                                      : t.state?.houses
                                      ? ` [${t.state.houses}]`
                                      : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] opacity-65 py-1">No properties claimed yet.</div>
                      )}

                      {summary.mortgagedCount > 0 && (
                        <div className="text-[10px] opacity-75 border-t border-white/10 pt-1">
                          Mortgaged: <strong className="tabular-nums">{summary.mortgagedCount}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[10px] opacity-65 pt-1 shrink-0">
            Hover a player to highlight owned tiles &middot; Click to pin
          </div>
        </div>

        {/* 2. TRADES SECTION (Create + Live Incoming/Outgoing Pending Offer Cards) */}
        {gameState.settings.tradingEnabled && (() => {
          const activeTrade = gameState.activeTrade && gameState.activeTrade.status === 'pending'
            ? gameState.activeTrade
            : null;
          const isAuctionActive = Boolean(gameState.auction && !gameState.auction.isFinished);
          const isIncoming = Boolean(activeTrade && localPlayer && activeTrade.targetId === localPlayer.id);
          const isOutgoing = Boolean(activeTrade && localPlayer && activeTrade.initiatorId === localPlayer.id);
          const otherPartyId = activeTrade
            ? isIncoming
              ? activeTrade.initiatorId
              : activeTrade.targetId
            : null;
          const otherParty = otherPartyId
            ? gameState.players.find(p => p.id === otherPartyId) ?? null
            : null;
          const otherColor = otherParty ? colorMap[otherParty.id]?.hex ?? otherParty.color : 'var(--accent)';
          const otherToken = otherParty ? tokenMap[otherParty.id] : undefined;
          const pendingCheck = activeTrade
            ? validatePendingTrade(activeTrade, gameState, currency)
            : null;

          const createBlockedReason = isAuctionActive
            ? 'Paused during active auction'
            : localPlayer?.isBankrupt
            ? 'Bankrupt players cannot trade'
            : null;

          return (
            <div
              data-testid="panel-trades-section"
              data-chamfered={theme.chamfered ? 'true' : 'false'}
              className="tv-hud-panel p-2.5 space-y-2 shrink-0"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
                    }}
                    className="text-xs font-bold tracking-wider truncate"
                  >
                    Trades
                  </span>
                  {activeTrade && (
                    <span
                      style={{
                        backgroundColor: isIncoming
                          ? 'var(--accent)'
                          : 'color-mix(in srgb, var(--tile-border) 35%, var(--bg))',
                        color: isIncoming ? '#0B1218' : 'var(--board-ink)',
                        borderRadius: 'var(--radius-tile)'
                      }}
                      className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase"
                    >
                      {isIncoming ? 'Incoming' : isOutgoing ? 'Outgoing' : 'Active'}
                    </span>
                  )}
                </div>

                {onOpenTrade && localPlayer && (
                  <button
                    type="button"
                    disabled={Boolean(createBlockedReason)}
                    title={createBlockedReason ?? 'Create a new trade offer'}
                    onClick={() => {
                      soundEngine.play('ui_click', theme.id);
                      onOpenTrade();
                    }}
                    data-testid="panel-trade-btn"
                    data-chamfered={theme.chamfered ? 'true' : 'false'}
                    className="tv-hud-btn tv-hud-btn-secondary px-2 py-0.5 text-[10px]"
                  >
                    Create
                  </button>
                )}
              </div>

              {createBlockedReason && (
                <div className="text-[10px] text-amber-300 opacity-90">{createBlockedReason}</div>
              )}

              {activeTrade && (isIncoming || isOutgoing) && otherParty ? (
                <div
                  data-testid={isIncoming ? 'incoming-trade-card' : 'outgoing-trade-card'}
                  style={{
                    borderColor: pendingCheck && !pendingCheck.valid ? '#EF4444' : otherColor,
                    borderRadius: 'var(--radius-tile)'
                  }}
                  className="tv-hud-subcard p-2 border space-y-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden"
                        style={{
                          border: `1.5px solid ${otherColor}`,
                          borderRadius: theme.chamfered ? '2px' : '9999px'
                        }}
                      >
                        <WorldTokenIcon
                          tokenId={otherToken?.id ?? otherParty.token}
                          tokenDef={otherToken}
                          worldId={theme.id}
                          color={otherColor}
                          size={otherToken?.imageSrc ? 18 : 13}
                        />
                      </div>
                      <span className="font-bold truncate" style={{ color: otherColor }}>
                        {isIncoming ? `From ${otherParty.nickname}` : `To ${otherParty.nickname}`}
                      </span>
                    </div>
                    {otherParty.isDisconnected && <WifiOff className="w-3 h-3 opacity-65 shrink-0" />}
                  </div>

                  {/* Compact Terms Summary */}
                  <div className="text-[10px] opacity-85 space-y-0.5 leading-snug">
                    <div>
                      <span className="text-emerald-400 font-bold">Get:</span>{' '}
                      {(isIncoming ? activeTrade.offerPropertyIds : activeTrade.requestPropertyIds)
                        .map(id => theme.tiles[id]?.name ?? `#${id}`)
                        .join(', ') || 'No deeds'}
                      {(isIncoming ? activeTrade.offerCash : activeTrade.requestCash) > 0 &&
                        ` + ${currency}${isIncoming ? activeTrade.offerCash : activeTrade.requestCash}`}
                    </div>
                    <div>
                      <span className="text-amber-300 font-bold">Give:</span>{' '}
                      {(isIncoming ? activeTrade.requestPropertyIds : activeTrade.offerPropertyIds)
                        .map(id => theme.tiles[id]?.name ?? `#${id}`)
                        .join(', ') || 'No deeds'}
                      {(isIncoming ? activeTrade.requestCash : activeTrade.offerCash) > 0 &&
                        ` + ${currency}${isIncoming ? activeTrade.requestCash : activeTrade.offerCash}`}
                    </div>
                  </div>

                  {pendingCheck && !pendingCheck.valid && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-300 font-semibold">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{pendingCheck.errors[0]}</span>
                    </div>
                  )}

                  {isIncoming ? (
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      <button
                        type="button"
                        data-testid="panel-trade-accept-btn"
                        disabled={Boolean(pendingCheck && !pendingCheck.valid) || !onAcceptTrade}
                        onClick={() => onAcceptTrade?.()}
                        data-chamfered={theme.chamfered ? 'true' : 'false'}
                        className="tv-hud-btn tv-hud-btn-primary py-1 text-[10px]"
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        data-testid="panel-trade-counter-btn"
                        disabled={!onCounterTrade}
                        onClick={() => onCounterTrade?.()}
                        data-chamfered={theme.chamfered ? 'true' : 'false'}
                        className="tv-hud-btn tv-hud-btn-secondary py-1 text-[10px]"
                      >
                        Counter
                      </button>
                      <button
                        type="button"
                        data-testid="panel-trade-decline-btn"
                        disabled={!onRejectTrade}
                        onClick={() => onRejectTrade?.()}
                        data-chamfered={theme.chamfered ? 'true' : 'false'}
                        className="tv-hud-btn tv-hud-btn-danger py-1 text-[10px]"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="panel-trade-cancel-btn"
                      disabled={!onRejectTrade}
                      onClick={() => onRejectTrade?.()}
                      data-chamfered={theme.chamfered ? 'true' : 'false'}
                      className="tv-hud-btn tv-hud-btn-danger w-full py-1 text-[10px]"
                    >
                      <XCircle className="w-3 h-3 shrink-0" />
                      <span>Cancel Offer</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[10px] opacity-60">No pending trade offers.</div>
              )}
            </div>
          );
        })()}

        {/* 3. MY PROPERTIES CARD (Grouped by Color Set + Inline Property Management Menu) */}
        <div
          data-chamfered={theme.chamfered ? 'true' : 'false'}
          className="tv-hud-panel p-2.5 flex flex-col flex-1 min-h-0"
        >
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)' }}
            className="flex items-center justify-between pb-1.5 mb-1.5 border-b shrink-0"
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
              }}
              className="text-xs font-bold tracking-wider"
            >
              My Properties
            </span>
            <span className="text-[11px] opacity-75 tabular-nums">
              {myPortfolio?.groups.reduce((a, g) => a + g.ownedTiles.length, 0) ?? 0} owned
            </span>
          </div>

          {myPortfolio && myPortfolio.groups.length > 0 ? (
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto tv-hud-scroll pr-0.5">
              {myPortfolio.groups.map(g => (
                <div key={g.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-85">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm border border-black/40"
                        style={{ backgroundColor: g.colorHex }}
                      />
                      <span>{g.label}</span>
                    </span>
                    {g.isComplete && (
                      <span
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                          color: 'var(--accent)',
                          borderRadius: 'var(--radius-tile)'
                        }}
                        className="px-1.5 py-0.2 text-[9px] font-extrabold"
                      >
                        Complete Set
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {g.ownedTiles.map(t => {
                      const isExpanded = expandedTileId === t.id;
                      const engineTile = getTileById(t.id);
                      const isPropertyTile = engineTile.type === 'property';
                      const buildCheck =
                        localPlayer && isPropertyTile
                          ? canBuildHouse(t.id, localPlayer.id, gameState.properties, localPlayer.balance)
                          : { canBuild: false, reason: 'Not buildable' };
                      const sellCheck =
                        localPlayer && isPropertyTile
                          ? canSellHouse(t.id, localPlayer.id, gameState.properties)
                          : { canSell: false, reason: 'No buildings' };
                      const mortgageCheck = localPlayer
                        ? canMortgage(t.id, localPlayer.id, gameState.properties)
                        : { canMortgage: false, reason: 'Unavailable' };
                      const unmortgageCheck = localPlayer
                        ? canUnmortgage(t.id, localPlayer.id, gameState.properties, localPlayer.balance)
                        : { canUnmortgage: false, cost: 0, reason: 'Unavailable' };

                      const houseCost = engineTile.houseCost ?? 50;
                      const sellPayout = Math.floor(houseCost / 2);
                      const mortgagePayout =
                        engineTile.mortgageValue ?? Math.floor((engineTile.price ?? 100) / 2);
                      const nextIsHotel = (t.state?.houses ?? 0) >= 4 && !t.state?.hotel;
                      const isConfirming = confirmAction?.tileId === t.id ? confirmAction.type : null;

                      return (
                        <div
                          key={t.id}
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--bg) 82%, var(--board))',
                            borderLeftColor: g.colorHex,
                            borderRadius: 'var(--radius-tile)'
                          }}
                          className="border border-white/10 border-l-4 overflow-hidden"
                        >
                          <button
                            type="button"
                            data-testid={`my-prop-row-${t.id}`}
                            aria-expanded={isExpanded}
                            onClick={() => {
                              soundEngine.play('ui_click', theme.id);
                              setConfirmAction(null);
                              setExpandedTileId(prev => (prev === t.id ? null : t.id));
                            }}
                            className="tv-hud-focus w-full px-2 py-1.5 flex items-center justify-between text-left hover:brightness-110 transition"
                          >
                            <div className="min-w-0 flex items-center gap-1.5">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  t.state?.isMortgaged ? 'line-through opacity-55' : ''
                                }`}
                              >
                                {t.name}
                              </span>
                              {t.state?.hotel ? (
                                <span
                                  style={{ backgroundColor: 'var(--accent)', color: '#0B1218' }}
                                  className="px-1 py-0.2 rounded text-[9px] font-extrabold uppercase shrink-0"
                                >
                                  {theme.hud.hotelLabel}
                                </span>
                              ) : (t.state?.houses ?? 0) > 0 ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 rounded bg-white/10 shrink-0 tabular-nums">
                                  <Home className="w-2.5 h-2.5" style={{ color: 'var(--accent)' }} />
                                  {t.state?.houses}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-[10px] font-bold tabular-nums opacity-85">
                                {t.state?.isMortgaged
                                  ? 'Mortgaged'
                                  : `${currency}${theme.tiles[t.id]?.price ?? engineTile.price ?? ''}`}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 opacity-70" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                              )}
                            </div>
                          </button>

                          {/* Inline Property Management Action Menu */}
                          {isExpanded && (
                            <div
                              data-testid={`prop-manage-menu-${t.id}`}
                              className="px-2 pb-2 pt-1.5 border-t border-white/10 space-y-1.5 bg-black/20"
                            >
                              {/* 2-Step Confirmation Guard for Sell / Mortgage */}
                              {isConfirming ? (
                                <div
                                  data-testid={`prop-confirm-${t.id}`}
                                  className="p-2 rounded border border-amber-500/50 bg-amber-500/10 space-y-1.5 text-[11px]"
                                >
                                  <div className="font-bold text-amber-200">
                                    {isConfirming === 'sell'
                                      ? `Sell 1 ${t.state?.hotel ? theme.hud.hotelLabel : theme.hud.unitLabel} for +${currency}${sellPayout}?`
                                      : `Mortgage ${t.name} for +${currency}${mortgagePayout}?`}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmAction(null)}
                                      className="tv-hud-btn tv-hud-btn-secondary py-1 text-[10px]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      data-testid={`prop-confirm-yes-${t.id}`}
                                      onClick={() => {
                                        if (isConfirming === 'sell') {
                                          soundEngine.play('receive_money', theme.id);
                                          onSellHouse?.(t.id);
                                        } else {
                                          soundEngine.play('receive_money', theme.id);
                                          onMortgageProperty?.(t.id);
                                        }
                                        setConfirmAction(null);
                                      }}
                                      className="tv-hud-btn tv-hud-btn-danger py-1 text-[10px]"
                                    >
                                      Confirm (+{currency}{isConfirming === 'sell' ? sellPayout : mortgagePayout})
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {isPropertyTile && (
                                    <>
                                      {/* Build House / Build Hotel */}
                                      <button
                                        type="button"
                                        data-testid={`prop-build-btn-${t.id}`}
                                        disabled={!buildCheck.canBuild || !onBuildHouse}
                                        onClick={() => {
                                          soundEngine.play('buy_property', theme.id);
                                          onBuildHouse?.(t.id);
                                        }}
                                        className="tv-hud-btn tv-hud-btn-secondary w-full px-2 py-1 text-[10px] justify-between"
                                      >
                                        <span className="inline-flex items-center gap-1">
                                          {nextIsHotel ? (
                                            <Building2 className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                                          ) : (
                                            <Home className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                                          )}
                                          <span>Build {nextIsHotel ? theme.hud.hotelLabel : theme.hud.unitLabel}</span>
                                        </span>
                                        <span className="tabular-nums opacity-85">
                                          {buildCheck.canBuild
                                            ? `-${currency}${houseCost}`
                                            : shortenRuleReason(buildCheck.reason)}
                                        </span>
                                      </button>

                                      {/* Sell House / Hotel (opens confirmation) */}
                                      <button
                                        type="button"
                                        data-testid={`prop-sell-btn-${t.id}`}
                                        disabled={!sellCheck.canSell || !onSellHouse}
                                        onClick={() => setConfirmAction({ tileId: t.id, type: 'sell' })}
                                        className="tv-hud-btn tv-hud-btn-secondary w-full px-2 py-1 text-[10px] justify-between"
                                      >
                                        <span className="inline-flex items-center gap-1">
                                          <RotateCcw className="w-3 h-3 shrink-0" />
                                          <span>Sell {t.state?.hotel ? theme.hud.hotelLabel : theme.hud.unitLabel}</span>
                                        </span>
                                        <span className="tabular-nums opacity-85">
                                          {sellCheck.canSell
                                            ? `+${currency}${sellPayout}`
                                            : shortenRuleReason(sellCheck.reason)}
                                        </span>
                                      </button>
                                    </>
                                  )}

                                  {/* Mortgage or Unmortgage */}
                                  {!t.state?.isMortgaged ? (
                                    <button
                                      type="button"
                                      data-testid={`prop-mortgage-btn-${t.id}`}
                                      disabled={!mortgageCheck.canMortgage || !onMortgageProperty}
                                      onClick={() => setConfirmAction({ tileId: t.id, type: 'mortgage' })}
                                      className="tv-hud-btn tv-hud-btn-danger w-full px-2 py-1 text-[10px] justify-between"
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        <Shield className="w-3 h-3 shrink-0" />
                                        <span>Mortgage</span>
                                      </span>
                                      <span className="tabular-nums">
                                        {mortgageCheck.canMortgage
                                          ? `+${currency}${mortgagePayout}`
                                          : shortenRuleReason(mortgageCheck.reason)}
                                      </span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      data-testid={`prop-unmortgage-btn-${t.id}`}
                                      disabled={!unmortgageCheck.canUnmortgage || !onUnmortgageProperty}
                                      onClick={() => {
                                        soundEngine.play('buy_property', theme.id);
                                        onUnmortgageProperty?.(t.id);
                                      }}
                                      className="tv-hud-btn tv-hud-btn-primary w-full px-2 py-1 text-[10px] justify-between"
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        <Shield className="w-3 h-3 shrink-0" />
                                        <span>Unmortgage</span>
                                      </span>
                                      <span className="tabular-nums">
                                        {unmortgageCheck.canUnmortgage
                                          ? `-${currency}${unmortgageCheck.cost}`
                                          : shortenRuleReason(unmortgageCheck.reason)}
                                      </span>
                                    </button>
                                  )}

                                  {onSelectTile && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectTile(t.id)}
                                      className="tv-hud-focus w-full py-0.5 text-[10px] opacity-75 hover:opacity-100 inline-flex items-center justify-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>View Full Deed</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs opacity-65 py-1">
              Buy properties as you land on them to build your portfolio.
            </p>
          )}
        </div>
      </aside>
    );
  }
);

PlayerPanel.displayName = 'PlayerPanel';
