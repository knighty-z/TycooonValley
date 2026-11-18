import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  getTileById,
  type AuctionState,
  type GameState,
  type Player
} from '@tycoonvale/shared';
import { useGame } from '../../context/GameContext.js';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig
} from '../../themes/index.js';
import { TileIcon } from '../Icons/TileIcons.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import { AnimatedCurrency } from '../HUD/AnimatedCurrency.js';
import { soundEngine } from '../../services/audio.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import {
  Gavel,
  Timer,
  XCircle,
  Trophy,
  WifiOff,
  Skull,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye
} from 'lucide-react';

export interface AuctionBidEntry {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
}

export interface AuctionResultBanner {
  tileId: number;
  propertyName: string;
  winnerId: string | null;
  winnerName: string | null;
  amount: number;
}

export interface AuctionModalProps {
  gameState?: GameState | null;
  localPlayer?: Player | null;
  themeConfig?: ThemeConfig;
  onBid?: (amount: number) => void;
  onPass?: () => void;
  /** Optional seeded bid history (for preview/tests; live mode tracks transitions & logs automatically) */
  initialBidHistory?: AuctionBidEntry[];
  /** Optional forced result state (for preview/tests) */
  forcedResult?: AuctionResultBanner | null;
  /** Optional flag indicating timer was just extended by anti-sniping */
  initialTimerExtended?: boolean;
}

const DEFAULT_AUCTION_DURATION_SEC = 20;

export const AuctionModal: React.FC<AuctionModalProps> = ({
  gameState: propGameState,
  localPlayer: propLocalPlayer,
  themeConfig: propThemeConfig,
  onBid: propOnBid,
  onPass: propOnPass,
  initialBidHistory,
  forcedResult = null,
  initialTimerExtended = false
}) => {
  let ctx: ReturnType<typeof useGame> | null = null;
  try {
    ctx = useGame();
  } catch {
    ctx = null;
  }

  const gameState = propGameState !== undefined ? propGameState : ctx?.gameState ?? null;
  const player = propLocalPlayer !== undefined ? propLocalPlayer : ctx?.player ?? null;
  const bidAuction = propOnBid ?? ctx?.bidAuction;
  const passAuction = propOnPass ?? ctx?.passAuction;

  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [customBid, setCustomBid] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState<number>(DEFAULT_AUCTION_DURATION_SEC);
  const [timerExtendedNotice, setTimerExtendedNotice] = useState<boolean>(initialTimerExtended);
  const [bidHistory, setBidHistory] = useState<AuctionBidEntry[]>(() => initialBidHistory ?? []);
  const [resultBanner, setResultBanner] = useState<AuctionResultBanner | null>(forcedResult);

  const prevAuctionRef = useRef<AuctionState | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const auction = gameState?.auction ?? null;
  const isModalOpen = Boolean((auction || resultBanner) && gameState);

  // Active auction MUST NOT be dismissed via Escape; only focus-trapped
  useFocusTrap(dialogRef, isModalOpen, undefined);

  // Sync forcedResult prop when preview switches
  useEffect(() => {
    setResultBanner(forcedResult);
  }, [forcedResult]);

  // Sync live countdown timer & detect start / new bid / +8s extension / conclusion
  useEffect(() => {
    const prev = prevAuctionRef.current;

    if (auction) {
      setDisplaySeconds(Math.max(0, auction.timerSeconds));

      // Auction just opened
      if (!prev || prev.tileId !== auction.tileId) {
        soundEngine.play('auction_start', theme.id);
        if (!initialBidHistory) {
          // Recover recent auction bids from activityLogs on mid-auction refresh
          const recovered: AuctionBidEntry[] = [];
          for (const log of (gameState?.activityLogs ?? []).slice(0, 15)) {
            if (log.type === 'auction' && log.playerId) {
              const match = log.text.match(/bid\s+[$¤₹₵]?(\d+)/i);
              if (match) {
                const p = gameState?.players.find(pl => pl.id === log.playerId);
                recovered.push({
                  id: log.id,
                  bidderId: log.playerId,
                  bidderName: p?.nickname ?? 'Bidder',
                  amount: Number(match[1]),
                  timestamp: log.timestamp
                });
              }
            }
          }
          setBidHistory(recovered.slice(0, 5));
        }
      } else if (auction.currentBid > prev.currentBid && auction.highestBidderId) {
        // New bid landed!
        soundEngine.play('auction_bid', theme.id);
        const bidder = gameState?.players.find(p => p.id === auction.highestBidderId);
        setBidHistory(curr => [
          {
            id: `bid-${Date.now()}-${auction.currentBid}`,
            bidderId: auction.highestBidderId!,
            bidderName: bidder?.nickname ?? 'Bidder',
            amount: auction.currentBid,
            timestamp: Date.now()
          },
          ...curr.slice(0, 4)
        ]);

        // Detect +8s anti-sniping timer extension from backend
        if (auction.timerSeconds >= prev.timerSeconds && prev.timerSeconds <= 8) {
          setTimerExtendedNotice(true);
          if (extTimerRef.current) clearTimeout(extTimerRef.current);
          extTimerRef.current = setTimeout(() => setTimerExtendedNotice(false), 2200);
        }
      }
    } else if (prev && !forcedResult && gameState) {
      // Auction just concluded -> show 2-second result banner
      const worldTileName = theme.tiles[prev.tileId]?.name ?? getTileById(prev.tileId).name;
      const winner = prev.highestBidderId
        ? gameState.players.find(p => p.id === prev.highestBidderId) ?? null
        : null;

      setResultBanner({
        tileId: prev.tileId,
        propertyName: worldTileName,
        winnerId: winner?.id ?? null,
        winnerName: winner?.nickname ?? null,
        amount: prev.currentBid
      });

      soundEngine.play(winner && prev.currentBid > 0 ? 'auction_won' : 'ui_click', theme.id);

      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = setTimeout(() => {
        setResultBanner(null);
      }, 2000);
    }

    prevAuctionRef.current = auction;
  }, [auction, forcedResult, gameState, initialBidHistory, theme]);

  // Client 1-second countdown ticker while auction is live
  useEffect(() => {
    if (!auction || auction.isFinished) return undefined;
    const interval = setInterval(() => {
      setDisplaySeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [auction?.tileId, auction?.currentBid, auction?.isFinished]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (extTimerRef.current) clearTimeout(extTimerRef.current);
    };
  }, []);

  if (!isModalOpen || !gameState) return null;

  const currency = theme.currencySymbol;
  const chamferedAttr = theme.chamfered ? 'true' : 'false';

  // Result Banner View (2s auto-close after auction resolves)
  if (resultBanner && !auction) {
    const winnerColor = resultBanner.winnerId
      ? colorMap[resultBanner.winnerId]?.hex ?? 'var(--accent)'
      : 'var(--accent)';
    const winnerToken = resultBanner.winnerId ? tokenMap[resultBanner.winnerId] : undefined;
    const resultTileDef = theme.tiles[resultBanner.tileId];
    const hasWinner = Boolean(resultBanner.winnerName && resultBanner.amount > 0);

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Auction Result"
        data-testid="auction-result-screen"
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          ref={dialogRef}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          data-chamfered={chamferedAttr}
          className="tv-hud-panel max-w-md w-full overflow-hidden shadow-2xl text-center select-none"
        >
          <div style={{ backgroundColor: hasWinner ? winnerColor : 'var(--tile-border)' }} className="h-1.5 w-full" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 18%, var(--bg))',
                  border: '1.5px solid var(--accent)',
                  borderRadius: theme.chamfered ? '2px' : '9999px',
                  color: 'var(--accent)'
                }}
              >
                {hasWinner ? <Trophy className="w-6 h-6" /> : <Gavel className="w-6 h-6" />}
              </div>
              {hasWinner && resultBanner.winnerId && (
                <div
                  className="w-12 h-12 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: `2px solid ${winnerColor}`,
                    borderRadius: theme.chamfered ? '2px' : '9999px'
                  }}
                >
                  <WorldTokenIcon
                    tokenId={winnerToken?.id ?? theme.tokens[0].id}
                    tokenDef={winnerToken}
                    worldId={theme.id}
                    color={winnerColor}
                    size={winnerToken?.imageSrc ? 42 : 30}
                  />
                </div>
              )}
            </div>

            <span
              style={{ color: 'var(--accent)' }}
              className="text-[10px] uppercase font-extrabold tracking-[0.22em] block"
            >
              {theme.auctionTitle} &middot; Hammer Down
            </span>

            {hasWinner ? (
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-xl sm:text-2xl font-extrabold leading-snug"
              >
                <span style={{ color: winnerColor }}>{resultBanner.winnerName}</span> won{' '}
                {resultTileDef?.name ?? resultBanner.propertyName} for{' '}
                <span style={{ color: 'var(--accent)' }} className="tabular-nums">
                  {currency}
                  {resultBanner.amount}
                </span>
              </h2>
            ) : (
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-xl font-extrabold"
              >
                No bids, property stays unowned
              </h2>
            )}

            <p className="text-xs opacity-70">
              {hasWinner
                ? 'Ownership marker and balances updated across the board.'
                : `${resultTileDef?.name ?? resultBanner.propertyName} remains available in the bank.`}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!auction) return null;

  const engineTile = getTileById(auction.tileId);
  const tileDef = theme.tiles[auction.tileId];
  const displayName = tileDef?.name ?? engineTile.name;
  const headerColor =
    tileDef?.groupIndex !== undefined
      ? theme.groupColors[tileDef.groupIndex]
      : 'color-mix(in srgb, var(--accent) 40%, var(--board))';
  const isLightHeader = tileDef?.groupIndex === 5 || tileDef?.groupIndex === 1;
  const headerInkClass = isLightHeader ? 'text-[#111827]' : 'text-white';
  const mortgageVal = engineTile.mortgageValue ?? (engineTile.price ? Math.floor(engineTile.price / 2) : 0);

  const highestBidder = auction.highestBidderId
    ? gameState.players.find(p => p.id === auction.highestBidderId) ?? null
    : null;
  const highestBidderColor = highestBidder
    ? colorMap[highestBidder.id]?.hex ?? highestBidder.color
    : 'var(--accent)';
  const highestBidderToken = highestBidder ? tokenMap[highestBidder.id] : undefined;

  const isSpectatorOrBankrupt = !player || player.isBankrupt;
  const isHighestBidder = Boolean(player && auction.highestBidderId === player.id);
  const isActiveBidder = Boolean(player && !player.isBankrupt && auction.activePlayerIds.includes(player.id));
  const minBid = Math.max(auction.minNextBid, auction.currentBid > 0 ? auction.currentBid + 1 : 10);
  const canAffordMin = Boolean(player && player.balance >= minBid);

  // Determine exact disabled reason when player cannot bid
  let disabledReason: string | null = null;
  if (isSpectatorOrBankrupt) {
    disabledReason = 'Read-only view (bankrupt or spectating)';
  } else if (!isActiveBidder) {
    disabledReason = 'You passed on this property';
  } else if (isHighestBidder) {
    disabledReason = 'You hold the highest bid — awaiting rivals';
  } else if (!canAffordMin) {
    disabledReason = `Insufficient cash (need at least ${currency}${minBid})`;
  }

  const canAct = Boolean(isActiveBidder && !isHighestBidder && canAffordMin && bidAuction);

  // Quick bid targets: +10, +50, +100 above current bid (respecting minNextBid)
  const quickBidSteps = [10, 50, 100].map(inc => ({
    increment: inc,
    targetAmount: Math.max(minBid, auction.currentBid + inc)
  }));

  const handleQuickBid = (targetAmount: number) => {
    if (!canAct || !player || !bidAuction) return;
    if (targetAmount > player.balance) {
      setCustomError(`Exceeds your cash (${currency}${player.balance})`);
      soundEngine.play('error', theme.id);
      return;
    }
    setCustomError(null);
    bidAuction(targetAmount);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player || !bidAuction || !isActiveBidder) return;
    const parsed = parseInt(customBid, 10);
    if (Number.isNaN(parsed)) {
      setCustomError('Enter a valid bid amount.');
      soundEngine.play('error', theme.id);
      return;
    }
    if (parsed < minBid) {
      setCustomError(`Bid must be at least ${currency}${minBid}.`);
      soundEngine.play('error', theme.id);
      return;
    }
    if (parsed > player.balance) {
      setCustomError(`Cannot exceed your cash (${currency}${player.balance}).`);
      soundEngine.play('error', theme.id);
      return;
    }
    setCustomError(null);
    bidAuction(parsed);
    setCustomBid('');
  };

  const isUrgent = displaySeconds <= 5;
  const timerProgressPct = Math.max(0, Math.min(100, (displaySeconds / DEFAULT_AUCTION_DURATION_SEC) * 100));

  return (
    <AnimatePresence>
      <motion.div
        key="auction-backdrop"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`${theme.auctionTitle} for ${displayName}`}
        data-testid="auction-modal"
        className="fixed inset-0 z-50 bg-black/82 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      >
        <motion.div
          ref={dialogRef}
          key="auction-dialog"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          data-chamfered={chamferedAttr}
          className="tv-hud-panel max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col select-none"
        >
          {/* Top Bar: World Auction Header + Countdown Status */}
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)' }}
            className="px-4 py-2.5 border-b flex items-center justify-between gap-3 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Gavel className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-sm font-extrabold tracking-wider truncate"
              >
                {theme.auctionTitle}
              </span>
              <span className="text-[10px] opacity-65 hidden sm:inline">
                &middot; Live for all players
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {timerExtendedNotice && (
                <span
                  data-testid="auction-timer-extended"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent) 20%, var(--bg))',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                    borderRadius: 'var(--radius-tile)'
                  }}
                  className="px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> +8s extended
                </span>
              )}
              <div
                data-testid="auction-timer"
                style={{
                  backgroundColor: isUrgent ? 'rgba(220, 38, 38, 0.24)' : 'color-mix(in srgb, var(--bg) 82%, var(--board))',
                  borderColor: isUrgent ? 'rgba(239, 68, 68, 0.8)' : 'var(--tile-border)',
                  color: isUrgent ? '#FCA5A5' : 'var(--board-ink)',
                  borderRadius: 'var(--radius-tile)'
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border text-xs font-extrabold tabular-nums ${
                  isUrgent && !prefersReducedMotion ? 'animate-pulse' : ''
                }`}
              >
                <Timer className="w-3.5 h-3.5" style={{ color: isUrgent ? '#F87171' : 'var(--accent)' }} />
                <span>{displaySeconds}s</span>
              </div>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="h-1 w-full bg-black/35 shrink-0 overflow-hidden">
            <div
              style={{
                width: `${timerProgressPct}%`,
                backgroundColor: isUrgent ? '#EF4444' : 'var(--accent)',
                transition: prefersReducedMotion ? 'none' : 'width 900ms linear, background-color 250ms ease'
              }}
              className="h-full"
            />
          </div>

          {/* Main Two-Column Body: Left = Property Card, Right = Bidding Floor */}
          <div className="flex-1 min-h-0 overflow-y-auto tv-hud-scroll p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* LEFT COLUMN (5 cols): World-Themed Property Deed Card */}
            <div className="md:col-span-5 flex flex-col">
              <div
                style={{
                  borderColor: 'color-mix(in srgb, var(--tile-border) 60%, transparent)',
                  borderRadius: 'var(--radius-tile)',
                  backgroundColor: 'color-mix(in srgb, var(--bg) 84%, var(--board))'
                }}
                className="border overflow-hidden flex flex-col flex-1"
              >
                <div
                  style={{
                    backgroundColor: headerColor,
                    borderBottom: '2px solid rgba(0,0,0,0.3)'
                  }}
                  className={`px-3.5 py-3 ${headerInkClass} flex items-center gap-2.5`}
                >
                  <TileIcon
                    id={tileDef?.icon ?? 'landmark'}
                    worldId={theme.id}
                    kind={tileDef?.kind ?? 'property'}
                    groupIndex={tileDef?.groupIndex}
                    size={16}
                    chamfered={theme.chamfered}
                  />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-widest opacity-85 font-bold block">
                      {tileDef?.groupIndex !== undefined
                        ? `Set ${tileDef.groupIndex + 1} · Title Deed`
                        : engineTile.type === 'station'
                        ? 'Transit Hub'
                        : 'Utility Network'}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'var(--font-heading)',
                        textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
                      }}
                      className="text-base font-extrabold leading-tight truncate"
                    >
                      {displayName}
                    </h3>
                    <span className="text-[11px] font-bold tabular-nums opacity-90">
                      List Price: {currency}
                      {engineTile.price ?? 0}
                    </span>
                  </div>
                </div>

                {/* Rent Schedule & Mortgage */}
                <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between text-xs tabular-nums">
                  {engineTile.type === 'property' && engineTile.rent ? (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider opacity-65 font-bold pb-1 border-b border-white/10">
                        Rent Schedule
                      </div>
                      {[
                        ['Base Rent', engineTile.rent[0]],
                        ['Full Set (2x)', engineTile.rent[0] * 2],
                        [`1 ${theme.hud.unitLabel}`, engineTile.rent[1]],
                        [`2 ${theme.hud.unitLabel}s`, engineTile.rent[2]],
                        [`3 ${theme.hud.unitLabel}s`, engineTile.rent[3]],
                        [`4 ${theme.hud.unitLabel}s`, engineTile.rent[4]],
                        [theme.hud.hotelLabel, engineTile.rent[5]]
                      ].map(([label, val], idx) => (
                        <div
                          key={String(label)}
                          className={`flex justify-between ${
                            idx === 6 ? 'font-bold pt-1 border-t border-white/10' : 'opacity-85'
                          }`}
                        >
                          <span>{label}</span>
                          <span className="font-bold">
                            {currency}
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : engineTile.type === 'station' ? (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider opacity-65 font-bold pb-1 border-b border-white/10">
                        Transit Tariff
                      </div>
                      {[
                        ['1 Hub', 25],
                        ['2 Hubs', 50],
                        ['3 Hubs', 100],
                        ['4 Hubs', 200]
                      ].map(([label, val]) => (
                        <div key={String(label)} className="flex justify-between opacity-85">
                          <span>{label}</span>
                          <span className="font-bold">
                            {currency}
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs opacity-85">
                      <div>1 Utility: <strong>4x</strong> dice roll</div>
                      <div>2 Utilities: <strong>10x</strong> dice roll</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-center">
                    <div className="p-1.5 rounded bg-black/20">
                      <span className="text-[9px] uppercase opacity-65 block">
                        {theme.hud.unitLabel} Cost
                      </span>
                      <span className="font-extrabold">
                        {engineTile.houseCost ? `${currency}${engineTile.houseCost}` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-black/20">
                      <span className="text-[9px] uppercase opacity-65 block">Mortgage</span>
                      <span className="font-extrabold" style={{ color: 'var(--accent)' }}>
                        {currency}
                        {mortgageVal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (7 cols): Highest Bid, Participants, History & Controls */}
            <div className="md:col-span-7 flex flex-col gap-3 min-w-0">
              {/* Current Highest Bid Card (flashes cleanly when bid updates) */}
              <motion.div
                key={`bid-flash-${auction.currentBid}-${auction.highestBidderId ?? 'none'}`}
                initial={prefersReducedMotion ? false : { scale: 1.02 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  borderColor: highestBidder ? highestBidderColor : 'var(--tile-border)',
                  backgroundColor: highestBidder
                    ? `color-mix(in srgb, ${highestBidderColor} 14%, var(--bg))`
                    : 'color-mix(in srgb, var(--bg) 84%, var(--board))',
                  borderRadius: 'var(--radius-tile)'
                }}
                className="border p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {highestBidder ? (
                    <div
                      className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: 'var(--bg)',
                        border: `2px solid ${highestBidderColor}`,
                        borderRadius: theme.chamfered ? '2px' : '9999px'
                      }}
                    >
                      <WorldTokenIcon
                        tokenId={highestBidderToken?.id ?? highestBidder.token}
                        tokenDef={highestBidderToken}
                        worldId={theme.id}
                        color={highestBidderColor}
                        size={highestBidderToken?.imageSrc ? 34 : 24}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 shrink-0 rounded bg-white/5 border border-white/15 flex items-center justify-center">
                      <Gavel className="w-5 h-5 opacity-60" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider opacity-70 block">
                      Current Highest Bid
                    </span>
                    <div className="text-xs font-bold truncate" style={{ color: highestBidder ? highestBidderColor : 'var(--board-ink)' }}>
                      {highestBidder ? `${highestBidder.nickname} leads` : 'No bids yet — opening floor'}
                    </div>
                  </div>
                </div>

                <div
                  data-testid="auction-highest-bid"
                  className="text-2xl font-extrabold tabular-nums shrink-0"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}
                >
                  {auction.currentBid > 0 ? (
                    <AnimatedCurrency value={auction.currentBid} prefix={currency} showDelta={false} durationMs={220} />
                  ) : (
                    `${currency}0`
                  )}
                </div>
              </motion.div>

              {/* Participants + Last 5 Bids Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Participants List */}
                <div className="tv-hud-subcard p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider opacity-70 font-bold pb-1 border-b border-white/10">
                    <span>Participants</span>
                    <span className="tabular-nums">{auction.activePlayerIds.length} active</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto tv-hud-scroll pr-0.5">
                    {gameState.players.map(p => {
                      const pColor = colorMap[p.id]?.hex ?? p.color;
                      const pToken = tokenMap[p.id];
                      const isLead = auction.highestBidderId === p.id;
                      const inRing = auction.activePlayerIds.includes(p.id);
                      const cantAfford = inRing && !isLead && p.balance < minBid;

                      let statusLabel = 'Passed';
                      let statusTone = 'opacity-55';
                      if (p.isBankrupt) {
                        statusLabel = 'Bankrupt';
                        statusTone = 'text-rose-300';
                      } else if (isLead) {
                        statusLabel = 'Leading';
                        statusTone = 'text-emerald-300 font-bold';
                      } else if (!inRing) {
                        statusLabel = 'Passed';
                        statusTone = 'opacity-55';
                      } else if (cantAfford) {
                        statusLabel = "Can't afford";
                        statusTone = 'text-amber-300';
                      } else {
                        statusLabel = 'Bidding';
                        statusTone = 'opacity-90';
                      }

                      return (
                        <div
                          key={p.id}
                          data-testid={`auction-participant-${p.id}`}
                          style={{
                            backgroundColor: isLead ? `color-mix(in srgb, ${pColor} 16%, transparent)` : 'transparent',
                            borderRadius: 'var(--radius-tile)'
                          }}
                          className={`px-1.5 py-1 flex items-center justify-between gap-1.5 text-[11px] ${
                            !inRing || p.isBankrupt ? 'opacity-55' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
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
                            <span className="font-bold truncate">{p.nickname}</span>
                            {p.isDisconnected && <WifiOff className="w-2.5 h-2.5 opacity-70 shrink-0" />}
                            {p.isBankrupt && <Skull className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                          </div>

                          <div className="text-right shrink-0 tabular-nums">
                            <span className="text-[10px] opacity-70 mr-1.5">
                              {currency}
                              {p.balance}
                            </span>
                            <span className={`text-[9px] uppercase ${statusTone}`}>{statusLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Bid History (Last 5 Bids) */}
                <div className="tv-hud-subcard p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider opacity-70 font-bold pb-1 border-b border-white/10">
                    <span>Recent Bids</span>
                    <span className="tabular-nums">Last 5</span>
                  </div>
                  {bidHistory.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-[11px] opacity-55 text-center px-2">
                      Awaiting opening bid ({currency}{minBid} minimum)
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto tv-hud-scroll pr-0.5">
                      {bidHistory.slice(0, 5).map((entry, idx) => {
                        const bColor = colorMap[entry.bidderId]?.hex ?? 'var(--accent)';
                        return (
                          <div
                            key={entry.id}
                            data-testid="auction-bid-history-row"
                            className={`px-1.5 py-1 rounded flex items-center justify-between text-[11px] ${
                              idx === 0 ? 'bg-white/10 font-bold' : 'opacity-75'
                            }`}
                          >
                            <span className="truncate" style={{ color: bColor }}>
                              {entry.bidderName}
                            </span>
                            <span className="tabular-nums font-bold">
                              {currency}
                              {entry.amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Disabled / Read-only Status Notice */}
              {disabledReason && (
                <div
                  data-testid="auction-disabled-reason"
                  className="tv-hud-subcard px-3 py-2 flex items-center gap-2 text-xs"
                >
                  {isHighestBidder ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isSpectatorOrBankrupt ? (
                    <Eye className="w-4 h-4 opacity-70 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium opacity-90">{disabledReason}</span>
                </div>
              )}

              {/* Bidding Controls */}
              {!isSpectatorOrBankrupt && (
                <div className="tv-hud-subcard p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] tabular-nums">
                    <span className="opacity-75">
                      Your Cash: <strong style={{ color: 'var(--board-ink)' }}>{currency}{player.balance}</strong>
                    </span>
                    <span className="opacity-75">
                      Min Next Bid: <strong style={{ color: 'var(--accent)' }}>{currency}{minBid}</strong>
                    </span>
                  </div>

                  {/* Quick Bid Buttons: +10, +50, +100 */}
                  <div className="grid grid-cols-3 gap-2">
                    {quickBidSteps.map(({ increment, targetAmount }) => {
                      const tooHigh = player.balance < targetAmount;
                      const isDisabled = !canAct || tooHigh;
                      return (
                        <button
                          key={increment}
                          type="button"
                          data-testid={`auction-quick-bid-${increment}`}
                          disabled={isDisabled}
                          title={tooHigh ? `Exceeds cash (${currency}${player.balance})` : disabledReason ?? `Bid ${currency}${targetAmount}`}
                          onClick={() => handleQuickBid(targetAmount)}
                          data-chamfered={chamferedAttr}
                          className={`tv-hud-btn py-2 px-2 text-xs ${
                            increment === 10 ? 'tv-hud-btn-primary' : 'tv-hud-btn-secondary'
                          }`}
                        >
                          <span>+{currency}{increment}</span>
                          <span className="text-[10px] opacity-80 tabular-nums">({currency}{targetAmount})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Bid Input + Pass */}
                  <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
                    <input
                      type="number"
                      min={minBid}
                      max={player.balance}
                      value={customBid}
                      disabled={!canAct}
                      onChange={e => {
                        setCustomBid(e.target.value);
                        setCustomError(null);
                      }}
                      placeholder={`Custom bid (min ${currency}${minBid})`}
                      aria-label="Custom bid amount"
                      data-testid="auction-custom-input"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg) 92%, #000)',
                        borderColor: customError ? '#EF4444' : 'color-mix(in srgb, var(--tile-border) 60%, transparent)',
                        color: 'var(--board-ink)',
                        borderRadius: 'var(--radius-button)'
                      }}
                      className="tv-hud-focus flex-1 border px-2.5 py-1.5 text-xs tabular-nums disabled:opacity-45"
                    />
                    <button
                      type="submit"
                      disabled={!canAct || !customBid}
                      data-testid="auction-custom-submit"
                      data-chamfered={chamferedAttr}
                      className="tv-hud-btn tv-hud-btn-primary px-3.5 py-1.5 text-xs"
                    >
                      Bid
                    </button>
                    <button
                      type="button"
                      disabled={!isActiveBidder || !passAuction}
                      onClick={() => passAuction?.()}
                      data-testid="auction-pass-btn"
                      data-chamfered={chamferedAttr}
                      className="tv-hud-btn tv-hud-btn-danger px-3 py-1.5 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Pass</span>
                    </button>
                  </form>

                  {customError && (
                    <div data-testid="auction-custom-error" className="text-[11px] text-rose-400 font-semibold">
                      {customError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
