import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  type GameState,
  type Player,
  type PropertyState,
  type TradeOffer
} from '@tycoonvale/shared';
import { useGame } from '../../context/GameContext.js';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig
} from '../../themes/index.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import {
  hasBuildingsInColorGroup,
  validateTradeDraft,
  validatePendingTrade,
  type TradeDraft
} from '../../services/tradeValidation.js';
import { soundEngine } from '../../services/audio.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import {
  X,
  ArrowLeftRight,
  Check,
  XCircle,
  Lock,
  WifiOff,
  AlertTriangle,
  Ticket,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export interface TradeModalProps {
  isOpen?: boolean;
  gameState?: GameState | null;
  localPlayer?: Player | null;
  themeConfig?: ThemeConfig;
  initialMode?: 'create' | 'incoming';
  initialDraft?: Partial<TradeDraft> | null;
  onClose?: () => void;
  onProposeTrade?: (payload: TradeDraft) => void;
  onAcceptTrade?: () => void;
  onRejectTrade?: () => void;
}

interface GroupedPickerSet {
  key: string;
  label: string;
  colorHex: string;
  order: number;
  tiles: Array<{
    id: number;
    name: string;
    state?: PropertyState;
    hasBuildings: boolean;
  }>;
}

function groupOwnedPropertiesForPicker(
  owner: Player | null | undefined,
  properties: Record<number, PropertyState>,
  theme: ThemeConfig
): GroupedPickerSet[] {
  if (!owner) return [];
  const ownedIds = Array.from(
    new Set([
      ...Object.values(properties)
        .filter(p => p.ownerId === owner.id)
        .map(p => p.tileId),
      ...owner.properties
    ])
  ).sort((a, b) => a - b);

  const byGroup = new Map<string, GroupedPickerSet>();

  for (const tid of ownedIds) {
    const def = theme.tiles[tid];
    const state = properties[tid];
    if (!def) continue;

    let key = 'other';
    let label = 'Other';
    let colorHex = '#64748B';
    let order = 10;

    if (def.kind === 'property' && def.groupIndex !== undefined) {
      key = `group-${def.groupIndex}`;
      label = `Set ${def.groupIndex + 1}`;
      colorHex = theme.groupColors[def.groupIndex];
      order = def.groupIndex;
    } else if (def.kind === 'transport') {
      key = 'transport';
      label = 'Transit';
      colorHex = '#64748B';
      order = 8;
    } else if (def.kind === 'utility') {
      key = 'utility';
      label = 'Utilities';
      colorHex = '#0EA5E9';
      order = 9;
    }

    const bucket = byGroup.get(key) ?? { key, label, colorHex, order, tiles: [] };
    bucket.tiles.push({
      id: tid,
      name: def.name,
      state,
      hasBuildings: hasBuildingsInColorGroup(tid, properties)
    });
    byGroup.set(key, bucket);
  }

  return Array.from(byGroup.values()).sort((a, b) => a.order - b.order);
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen: propIsOpen,
  gameState: propGameState,
  localPlayer: propLocalPlayer,
  themeConfig: propThemeConfig,
  initialMode,
  initialDraft = null,
  onClose: propOnClose,
  onProposeTrade: propOnPropose,
  onAcceptTrade: propOnAccept,
  onRejectTrade: propOnReject
}) => {
  let ctx: ReturnType<typeof useGame> | null = null;
  try {
    ctx = useGame();
  } catch {
    ctx = null;
  }

  const gameState = propGameState !== undefined ? propGameState : ctx?.gameState ?? null;
  const player = propLocalPlayer !== undefined ? propLocalPlayer : ctx?.player ?? null;
  const isOpen = propIsOpen !== undefined ? propIsOpen : Boolean(ctx?.isTradeModalOpen);
  const handleClose = propOnClose ?? (() => ctx?.setIsTradeModalOpen(false));
  const proposeTrade = propOnPropose ?? ctx?.proposeTrade;
  const acceptTrade = propOnAccept ?? ctx?.acceptTrade;
  const rejectTrade = propOnReject ?? ctx?.rejectTrade;

  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<'create' | 'incoming'>('create');
  const [targetId, setTargetId] = useState<string>('');
  const [offerCash, setOfferCash] = useState<number>(0);
  const [requestCash, setRequestCash] = useState<number>(0);
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [requestProps, setRequestProps] = useState<number[]>([]);
  const [completedBanner, setCompletedBanner] = useState<boolean>(false);
  const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusTrap(dialogRef, isOpen, handleClose);

  const theme = useMemo(
    () => propThemeConfig ?? (gameState ? getThemeConfig(gameState.settings.theme) : getThemeConfig('original')),
    [propThemeConfig, gameState]
  );

  const colorMap = useMemo(
    () => (gameState ? resolveUniquePlayerColors(gameState.players) : {}),
    [gameState]
  );

  const tokenMap = useMemo(
    () => (gameState ? resolveWorldTokensForPlayers(gameState.players, theme.tokens) : {}),
    [gameState, theme.tokens]
  );

  const otherPlayers = useMemo(
    () => (gameState && player ? gameState.players.filter(p => p.id !== player.id) : []),
    [gameState, player]
  );

  const activeTrade: TradeOffer | null = gameState?.activeTrade ?? null;
  const isIncomingForMe = Boolean(
    activeTrade && player && activeTrade.targetId === player.id && activeTrade.status === 'pending'
  );

  // Initialize mode & draft cleanly each time modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (initialDraft) {
      setMode('create');
      setTargetId(initialDraft.targetId ?? otherPlayers.find(p => !p.isBankrupt)?.id ?? '');
      setOfferCash(initialDraft.offerCash ?? 0);
      setRequestCash(initialDraft.requestCash ?? 0);
      setOfferProps(initialDraft.offerPropertyIds ?? []);
      setRequestProps(initialDraft.requestPropertyIds ?? []);
    } else if (initialMode) {
      setMode(initialMode);
      if (initialMode === 'create') {
        const firstEligible = otherPlayers.find(p => !p.isBankrupt)?.id ?? '';
        setTargetId(prev => prev || firstEligible);
      }
    } else if (isIncomingForMe) {
      setMode('incoming');
    } else {
      setMode('create');
      const firstEligible = otherPlayers.find(p => !p.isBankrupt)?.id ?? '';
      setTargetId(prev => prev || firstEligible);
    }
  }, [isOpen, initialMode, initialDraft, isIncomingForMe, otherPlayers]);

  useEffect(() => {
    return () => {
      if (completedTimerRef.current) clearTimeout(completedTimerRef.current);
    };
  }, []);

  if (!isOpen || !gameState || !player) return null;

  const currency = theme.currencySymbol;
  const chamferedAttr = theme.chamfered ? 'true' : 'false';

  const currentTargetId = targetId || otherPlayers.find(p => !p.isBankrupt)?.id || '';
  const targetPlayer = gameState.players.find(p => p.id === currentTargetId) ?? null;

  const myGroupedProps = groupOwnedPropertiesForPicker(player, gameState.properties, theme);
  const partnerGroupedProps = groupOwnedPropertiesForPicker(targetPlayer, gameState.properties, theme);

  const draft: TradeDraft = {
    targetId: currentTargetId,
    offerCash,
    requestCash,
    offerPropertyIds: offerProps,
    requestPropertyIds: requestProps
  };

  const draftValidation = validateTradeDraft(draft, player, gameState, currency);
  const netCashDiff = requestCash - offerCash; // Positive = you gain cash, negative = you pay cash

  const handleToggleOfferProp = (id: number, hasBuildings: boolean) => {
    if (hasBuildings) {
      soundEngine.play('error', theme.id);
      return;
    }
    soundEngine.play('ui_click', theme.id);
    setOfferProps(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleToggleRequestProp = (id: number, hasBuildings: boolean) => {
    if (hasBuildings) {
      soundEngine.play('error', theme.id);
      return;
    }
    soundEngine.play('ui_click', theme.id);
    setRequestProps(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftValidation.valid || !proposeTrade) {
      soundEngine.play('error', theme.id);
      return;
    }
    soundEngine.play('trade_received', theme.id);
    proposeTrade(draft);
    setOfferCash(0);
    setRequestCash(0);
    setOfferProps([]);
    setRequestProps([]);
    handleClose();
  };

  const handleStartCounter = () => {
    if (!activeTrade) return;
    soundEngine.play('ui_click', theme.id);
    // Flip terms cleanly so responder starts from the incoming proposal
    setTargetId(activeTrade.initiatorId);
    setOfferCash(activeTrade.requestCash);
    setRequestCash(activeTrade.offerCash);
    setOfferProps([...activeTrade.requestPropertyIds]);
    setRequestProps([...activeTrade.offerPropertyIds]);
    setMode('create');
  };

  const handleAccept = () => {
    if (!acceptTrade) return;
    soundEngine.play('trade_accepted', theme.id);
    acceptTrade();
    setCompletedBanner(true);
    if (completedTimerRef.current) clearTimeout(completedTimerRef.current);
    completedTimerRef.current = setTimeout(() => {
      setCompletedBanner(false);
      handleClose();
    }, 1400);
  };

  const initiatorPlayer = activeTrade
    ? gameState.players.find(p => p.id === activeTrade.initiatorId) ?? null
    : null;
  const pendingValidation = activeTrade
    ? validatePendingTrade(activeTrade, gameState, currency)
    : { valid: false, errors: [] };

  return (
    <AnimatePresence>
      <motion.div
        key="trade-backdrop"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Trade Negotiation"
        data-testid="trade-modal"
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      >
        <motion.div
          ref={dialogRef}
          onClick={e => e.stopPropagation()}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          data-chamfered={chamferedAttr}
          className="tv-hud-panel max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative select-none"
        >
          <div style={{ backgroundColor: 'var(--accent)' }} className="h-1 w-full shrink-0" />

          {/* Brief Trade Completed Confirmation Overlay */}
          {completedBanner && (
            <div
              data-testid="trade-completed-overlay"
              className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-center p-6"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <h3
                style={{ fontFamily: 'var(--font-heading)' }}
                className="text-xl font-extrabold uppercase tracking-wider"
              >
                Trade Completed
              </h3>
              <p className="text-xs opacity-80">
                Properties and cash transferred across player portfolios.
              </p>
            </div>
          )}

          {/* Modal Header */}
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)' }}
            className="px-4 py-2.5 border-b flex items-center justify-between gap-2 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ArrowLeftRight className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-sm font-extrabold tracking-wider truncate"
              >
                {mode === 'incoming' && isIncomingForMe ? 'Incoming Trade Offer' : 'Create Trade'}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close trade modal"
              data-testid="trade-modal-close"
              className="tv-hud-focus p-1 rounded opacity-75 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* INCOMING TRADE REVIEW VIEW */}
          {mode === 'incoming' && activeTrade && initiatorPlayer ? (
            <div className="p-4 space-y-4 overflow-y-auto tv-hud-scroll" data-testid="trade-incoming-view">
              <div className="tv-hud-subcard p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 shrink-0 flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: `2px solid ${colorMap[initiatorPlayer.id]?.hex ?? initiatorPlayer.color}`,
                      borderRadius: theme.chamfered ? '2px' : '9999px'
                    }}
                  >
                    <WorldTokenIcon
                      tokenId={tokenMap[initiatorPlayer.id]?.id ?? initiatorPlayer.token}
                      tokenDef={tokenMap[initiatorPlayer.id]}
                      worldId={theme.id}
                      color={colorMap[initiatorPlayer.id]?.hex ?? initiatorPlayer.color}
                      size={tokenMap[initiatorPlayer.id]?.imageSrc ? 30 : 22}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      Proposal from{' '}
                      <span style={{ color: colorMap[initiatorPlayer.id]?.hex ?? initiatorPlayer.color }}>
                        {initiatorPlayer.nickname}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-70">
                      Review assets carefully before accepting, declining, or countering.
                    </span>
                  </div>
                </div>
                {initiatorPlayer.isDisconnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    <WifiOff className="w-3 h-3" /> Sender Offline
                  </span>
                )}
              </div>

              {!pendingValidation.valid && (
                <div
                  data-testid="trade-invalid-banner"
                  className="px-3 py-2 rounded border border-rose-500/60 bg-rose-500/15 text-rose-200 text-xs flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <strong className="block">Offer No Longer Valid</strong>
                    <span>{pendingValidation.errors[0]}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* You Receive */}
                <div className="tv-hud-subcard p-3 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">
                    You Get
                  </span>
                  <div className="text-sm font-extrabold tabular-nums">
                    Cash: {currency}
                    {activeTrade.offerCash.toLocaleString()}
                  </div>
                  <div className="space-y-1">
                    {activeTrade.offerPropertyIds.map(tid => {
                      const def = theme.tiles[tid];
                      const bandHex =
                        def?.groupIndex !== undefined ? theme.groupColors[def.groupIndex] : '#64748B';
                      const isMort = gameState.properties[tid]?.isMortgaged;
                      return (
                        <div
                          key={tid}
                          style={{ borderLeftColor: bandHex, borderRadius: 'var(--radius-tile)' }}
                          className="px-2.5 py-1.5 border border-white/10 border-l-4 bg-black/20 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold">{def?.name ?? `Tile #${tid}`}</span>
                          {isMort && <span className="text-[9px] text-amber-300 uppercase">Mortgaged</span>}
                        </div>
                      );
                    })}
                    {activeTrade.offerPropertyIds.length === 0 && (
                      <span className="text-xs opacity-55">No properties offered</span>
                    )}
                  </div>
                </div>

                {/* You Give */}
                <div className="tv-hud-subcard p-3 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 block">
                    You Give
                  </span>
                  <div className="text-sm font-extrabold tabular-nums">
                    Cash: {currency}
                    {activeTrade.requestCash.toLocaleString()}
                  </div>
                  <div className="space-y-1">
                    {activeTrade.requestPropertyIds.map(tid => {
                      const def = theme.tiles[tid];
                      const bandHex =
                        def?.groupIndex !== undefined ? theme.groupColors[def.groupIndex] : '#64748B';
                      const isMort = gameState.properties[tid]?.isMortgaged;
                      return (
                        <div
                          key={tid}
                          style={{ borderLeftColor: bandHex, borderRadius: 'var(--radius-tile)' }}
                          className="px-2.5 py-1.5 border border-white/10 border-l-4 bg-black/20 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold">{def?.name ?? `Tile #${tid}`}</span>
                          {isMort && <span className="text-[9px] text-amber-300 uppercase">Mortgaged</span>}
                        </div>
                      );
                    })}
                    {activeTrade.requestPropertyIds.length === 0 && (
                      <span className="text-xs opacity-55">No properties requested</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  data-testid="trade-accept-btn"
                  disabled={!pendingValidation.valid}
                  onClick={handleAccept}
                  data-chamfered={chamferedAttr}
                  className="tv-hud-btn tv-hud-btn-primary py-2 text-xs"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  data-testid="trade-counter-btn"
                  onClick={handleStartCounter}
                  data-chamfered={chamferedAttr}
                  className="tv-hud-btn tv-hud-btn-secondary py-2 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Counter</span>
                </button>
                <button
                  type="button"
                  data-testid="trade-decline-btn"
                  onClick={() => {
                    rejectTrade?.();
                    handleClose();
                  }}
                  data-chamfered={chamferedAttr}
                  className="tv-hud-btn tv-hud-btn-danger py-2 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ) : (
            /* CREATE / COUNTER TRADE TWO-STEP BUILDER */
            <form onSubmit={handleSubmitProposal} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto tv-hud-scroll p-4 space-y-3.5">
                {/* Active Pending Trade Replacement Notice (Single-Active-Trade Backend Constraint) */}
                {activeTrade && activeTrade.status === 'pending' && (
                  <div className="px-3 py-1.5 rounded border border-amber-500/45 bg-amber-500/12 text-amber-200 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>
                      Sending a new proposal replaces the current pending trade (server supports one active offer per room).
                    </span>
                  </div>
                )}

                {/* STEP 1: Choose Partner */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold opacity-75">
                    <span>Step 1 &middot; Choose Partner</span>
                    <span>{otherPlayers.filter(p => !p.isBankrupt).length} eligible</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {otherPlayers.map(p => {
                      const pColor = colorMap[p.id]?.hex ?? p.color;
                      const pToken = tokenMap[p.id];
                      const selected = p.id === currentTargetId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={p.isBankrupt}
                          data-testid={`trade-partner-${p.id}`}
                          onClick={() => {
                            soundEngine.play('ui_click', theme.id);
                            setTargetId(p.id);
                            setRequestProps([]);
                            setRequestCash(0);
                          }}
                          style={{
                            borderColor: selected ? pColor : 'color-mix(in srgb, var(--tile-border) 50%, transparent)',
                            backgroundColor: selected
                              ? `color-mix(in srgb, ${pColor} 20%, var(--bg))`
                              : 'color-mix(in srgb, var(--bg) 82%, var(--board))',
                            borderRadius: 'var(--radius-tile)'
                          }}
                          className={`tv-hud-focus px-2.5 py-1.5 border flex items-center gap-2 text-xs transition ${
                            p.isBankrupt ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'
                          }`}
                        >
                          <div
                            className="w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden"
                            style={{
                              border: `1.5px solid ${pColor}`,
                              borderRadius: theme.chamfered ? '2px' : '9999px'
                            }}
                          >
                            <WorldTokenIcon
                              tokenId={pToken?.id ?? p.token}
                              tokenDef={pToken}
                              worldId={theme.id}
                              color={pColor}
                              size={pToken?.imageSrc ? 18 : 13}
                            />
                          </div>
                          <span className="font-bold">{p.nickname}</span>
                          <span className="text-[11px] opacity-75 tabular-nums">
                            {currency}
                            {p.balance.toLocaleString()}
                          </span>
                          {p.isDisconnected && <WifiOff className="w-3 h-3 opacity-60" />}
                          {p.isBankrupt && <span className="text-[9px] text-rose-300 uppercase">Out</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: Two-Column Asset Picker (You Give vs You Get) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* YOU GIVE COLUMN */}
                  <div className="tv-hud-subcard p-3 space-y-2.5 flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                        You Give ({player.nickname})
                      </span>
                      <span className="text-[11px] opacity-70 tabular-nums">
                        Max {currency}
                        {player.balance.toLocaleString()}
                      </span>
                    </div>

                    {/* Cash Input */}
                    <div className="space-y-1">
                      <label htmlFor="trade-offer-cash" className="text-[10px] uppercase tracking-wider opacity-70 block">
                        Cash ({currency})
                      </label>
                      <input
                        id="trade-offer-cash"
                        data-testid="trade-offer-cash"
                        type="number"
                        min={0}
                        max={player.balance}
                        value={offerCash}
                        onChange={e => setOfferCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--bg) 92%, #000)',
                          borderColor:
                            offerCash > player.balance
                              ? '#EF4444'
                              : 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                          color: 'var(--board-ink)',
                          borderRadius: 'var(--radius-button)'
                        }}
                        className="tv-hud-focus w-full border px-2.5 py-1.5 text-xs tabular-nums"
                      />
                    </div>

                    {/* Grouped Properties Picker */}
                    <div className="space-y-1.5 flex-1">
                      <span className="text-[10px] uppercase tracking-wider opacity-70 block">
                        Properties (Grouped by Set)
                      </span>
                      <div className="max-h-40 overflow-y-auto tv-hud-scroll space-y-2 pr-0.5">
                        {myGroupedProps.length === 0 ? (
                          <p className="text-xs opacity-55 py-2">You do not own any properties yet.</p>
                        ) : (
                          myGroupedProps.map(group => (
                            <div key={group.key} className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75">
                                <span
                                  className="w-2.5 h-2.5 rounded-sm border border-black/40"
                                  style={{ backgroundColor: group.colorHex }}
                                />
                                <span>{group.label}</span>
                              </div>
                              {group.tiles.map(t => {
                                const selected = offerProps.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    disabled={t.hasBuildings}
                                    data-testid={`trade-give-prop-${t.id}`}
                                    title={t.hasBuildings ? 'Sell all buildings in this set before trading' : t.name}
                                    onClick={() => handleToggleOfferProp(t.id, t.hasBuildings)}
                                    style={{
                                      borderLeftColor: group.colorHex,
                                      borderColor: selected
                                        ? 'var(--accent)'
                                        : 'color-mix(in srgb, var(--tile-border) 35%, transparent)',
                                      backgroundColor: selected
                                        ? 'color-mix(in srgb, var(--accent) 18%, var(--bg))'
                                        : 'color-mix(in srgb, var(--bg) 65%, var(--board))',
                                      borderRadius: 'var(--radius-tile)'
                                    }}
                                    className={`tv-hud-focus w-full px-2 py-1.5 border border-l-4 flex items-center justify-between gap-2 text-left text-xs ${
                                      t.hasBuildings ? 'opacity-45 cursor-not-allowed' : 'hover:brightness-110'
                                    }`}
                                  >
                                    <span className="truncate font-semibold">{t.name}</span>
                                    <span className="shrink-0 flex items-center gap-1 text-[10px]">
                                      {t.hasBuildings && (
                                        <span className="text-amber-300 inline-flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> Has buildings
                                        </span>
                                      )}
                                      {t.state?.isMortgaged && (
                                        <span className="text-rose-300 uppercase text-[9px]">Mortgaged</span>
                                      )}
                                      {selected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Jail Card Toggle (Explicitly labeled as not supported by server schema) */}
                    <div
                      title="Backend trades table does not support transferring Get Out of Jail cards yet"
                      className="px-2.5 py-1.5 rounded border border-white/10 bg-black/20 flex items-center justify-between text-[11px] opacity-60"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Jail Pardon Card ({player.getOutOfJailCards})</span>
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/10">
                        Not available
                      </span>
                    </div>
                  </div>

                  {/* YOU GET COLUMN */}
                  <div className="tv-hud-subcard p-3 space-y-2.5 flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                        You Get ({targetPlayer?.nickname ?? 'Partner'})
                      </span>
                      <span className="text-[11px] opacity-70 tabular-nums">
                        Max {currency}
                        {(targetPlayer?.balance ?? 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Request Cash Input */}
                    <div className="space-y-1">
                      <label htmlFor="trade-request-cash" className="text-[10px] uppercase tracking-wider opacity-70 block">
                        Cash ({currency})
                      </label>
                      <input
                        id="trade-request-cash"
                        data-testid="trade-request-cash"
                        type="number"
                        min={0}
                        max={targetPlayer?.balance ?? 0}
                        value={requestCash}
                        onChange={e => setRequestCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--bg) 92%, #000)',
                          borderColor:
                            targetPlayer && requestCash > targetPlayer.balance
                              ? '#EF4444'
                              : 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                          color: 'var(--board-ink)',
                          borderRadius: 'var(--radius-button)'
                        }}
                        className="tv-hud-focus w-full border px-2.5 py-1.5 text-xs tabular-nums"
                      />
                    </div>

                    {/* Partner Grouped Properties Picker */}
                    <div className="space-y-1.5 flex-1">
                      <span className="text-[10px] uppercase tracking-wider opacity-70 block">
                        Partner Properties (Grouped by Set)
                      </span>
                      <div className="max-h-40 overflow-y-auto tv-hud-scroll space-y-2 pr-0.5">
                        {partnerGroupedProps.length === 0 ? (
                          <p className="text-xs opacity-55 py-2">Partner owns no properties yet.</p>
                        ) : (
                          partnerGroupedProps.map(group => (
                            <div key={group.key} className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-75">
                                <span
                                  className="w-2.5 h-2.5 rounded-sm border border-black/40"
                                  style={{ backgroundColor: group.colorHex }}
                                />
                                <span>{group.label}</span>
                              </div>
                              {group.tiles.map(t => {
                                const selected = requestProps.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    disabled={t.hasBuildings}
                                    data-testid={`trade-get-prop-${t.id}`}
                                    title={t.hasBuildings ? 'Partner must sell buildings in this set before trading' : t.name}
                                    onClick={() => handleToggleRequestProp(t.id, t.hasBuildings)}
                                    style={{
                                      borderLeftColor: group.colorHex,
                                      borderColor: selected
                                        ? 'var(--accent)'
                                        : 'color-mix(in srgb, var(--tile-border) 35%, transparent)',
                                      backgroundColor: selected
                                        ? 'color-mix(in srgb, var(--accent) 18%, var(--bg))'
                                        : 'color-mix(in srgb, var(--bg) 65%, var(--board))',
                                      borderRadius: 'var(--radius-tile)'
                                    }}
                                    className={`tv-hud-focus w-full px-2 py-1.5 border border-l-4 flex items-center justify-between gap-2 text-left text-xs ${
                                      t.hasBuildings ? 'opacity-45 cursor-not-allowed' : 'hover:brightness-110'
                                    }`}
                                  >
                                    <span className="truncate font-semibold">{t.name}</span>
                                    <span className="shrink-0 flex items-center gap-1 text-[10px]">
                                      {t.hasBuildings && (
                                        <span className="text-amber-300 inline-flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> Has buildings
                                        </span>
                                      )}
                                      {t.state?.isMortgaged && (
                                        <span className="text-rose-300 uppercase text-[9px]">Mortgaged</span>
                                      )}
                                      {selected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Partner Jail Card Toggle (labeled not available) */}
                    <div
                      title="Backend trades table does not support transferring Get Out of Jail cards yet"
                      className="px-2.5 py-1.5 rounded border border-white/10 bg-black/20 flex items-center justify-between text-[11px] opacity-60"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Jail Pardon Card ({targetPlayer?.getOutOfJailCards ?? 0})</span>
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/10">
                        Not available
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Summary Footer + Validation + Send CTA */}
              <div
                style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)' }}
                className="px-4 py-3 border-t space-y-2 shrink-0 bg-black/15"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="opacity-75">
                      Give:{' '}
                      <strong className="text-amber-300">
                        {offerProps.length} {offerProps.length === 1 ? 'deed' : 'deeds'}
                        {offerCash > 0 ? ` + ${currency}${offerCash}` : ''}
                      </strong>
                    </span>
                    <span className="opacity-40">&rarr;</span>
                    <span className="opacity-75">
                      Get:{' '}
                      <strong className="text-emerald-300">
                        {requestProps.length} {requestProps.length === 1 ? 'deed' : 'deeds'}
                        {requestCash > 0 ? ` + ${currency}${requestCash}` : ''}
                      </strong>
                    </span>
                  </div>

                  <div className="tabular-nums font-bold" data-testid="trade-net-cash">
                    Net Cash:{' '}
                    <span
                      className={
                        netCashDiff > 0
                          ? 'text-emerald-400'
                          : netCashDiff < 0
                          ? 'text-amber-300'
                          : 'opacity-70'
                      }
                    >
                      {netCashDiff > 0
                        ? `+${currency}${netCashDiff}`
                        : netCashDiff < 0
                        ? `-${currency}${Math.abs(netCashDiff)}`
                        : `${currency}0`}
                    </span>
                  </div>
                </div>

                {!draftValidation.valid && (
                  <div data-testid="trade-validation-error" className="text-[11px] text-rose-300 font-semibold">
                    {draftValidation.errors[0]}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    data-chamfered={chamferedAttr}
                    className="tv-hud-btn tv-hud-btn-secondary px-3.5 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!draftValidation.valid}
                    data-testid="trade-submit-btn"
                    data-chamfered={chamferedAttr}
                    className="tv-hud-btn tv-hud-btn-primary px-4 py-1.5 text-xs"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                    <span>Send Offer</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
