import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.js';
import { getTileById, type GameState, type Player } from '@tycoonvale/shared';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  type ThemeConfig
} from '../../themes/index.js';
import { Dice3D } from './Dice3D.js';
import { AnimatedCurrency } from '../HUD/AnimatedCurrency.js';
import {
  Dices,
  ShoppingCart,
  ArrowRight,
  Lock,
  Ticket,
  ArrowLeftRight,
  Timer,
  Gavel,
  Coins,
  Sparkles
} from 'lucide-react';

export interface CenterAreaOverride {
  gameState: GameState;
  player: Player;
  themeConfig: ThemeConfig;
  isRolling: boolean;
  rollingDiceValues: [number, number];
  midRollPreview?: boolean;
  onRollDice: () => void;
  onBuyProperty: (tileId: number) => void;
  onDeclineProperty: (tileId: number) => void;
  onEndTurn: () => void;
  onPayJailFine?: () => void;
  onUseJailCard?: () => void;
  onOpenTrade?: () => void;
}

interface CenterAreaProps {
  override?: CenterAreaOverride;
}

export const CenterArea: React.FC<CenterAreaProps> = ({ override }) => {
  const ctx = useGame();

  const gameState = override?.gameState ?? ctx.gameState;
  const player = override?.player ?? ctx.player;
  const isRolling = override?.isRolling ?? ctx.isRolling;
  const rollingDiceValues = override?.rollingDiceValues ?? ctx.rollingDiceValues;
  const midRollPreview = override?.midRollPreview ?? false;

  const rollDice = override?.onRollDice ?? ctx.rollDice;
  const buyProperty = override?.onBuyProperty ?? ctx.buyProperty;
  const declineProperty = override?.onDeclineProperty ?? ctx.declineProperty;
  const endTurn = override?.onEndTurn ?? ctx.endTurn;
  const payJailFine = override?.onPayJailFine ?? ctx.payJailFine;
  const useJailCard = override?.onUseJailCard ?? ctx.useJailCard;
  const openTrade = override?.onOpenTrade ?? (() => ctx.setIsTradeModalOpen(true));

  if (!gameState || !player) return null;

  const themeConfig = override?.themeConfig ?? getThemeConfig(gameState.settings.theme);
  const currency = themeConfig.currencySymbol;
  const colorMap = resolveUniquePlayerColors(gameState.players);

  const activePlayer = gameState.players.find(p => p.id === gameState.turn.activePlayerId);
  const activePlayerColor = activePlayer ? colorMap[activePlayer.id]?.hex ?? activePlayer.color : 'var(--accent)';
  const isMyTurn = gameState.turn.activePlayerId === player.id;
  const isPendingPurchase = gameState.turn.mustResolveTile && gameState.turn.pendingTileId !== undefined;
  const pendingEngineTile =
    isPendingPurchase && gameState.turn.pendingTileId !== undefined
      ? getTileById(gameState.turn.pendingTileId)
      : null;
  const pendingLocalizedTile =
    pendingEngineTile ? themeConfig.tiles[pendingEngineTile.id] : null;
  const pendingDisplayName = pendingLocalizedTile?.name ?? pendingEngineTile?.name ?? '';
  const pendingPrice = pendingEngineTile?.price ?? pendingLocalizedTile?.price ?? 0;

  // Short live messages strictly bounded inside the center area (max 3 recent entries)
  const recentEvents = gameState.activityLogs.slice(0, 3);
  const isValorant = themeConfig.id === 'valorant';
  const isWompWomp = themeConfig.id === 'wompwomp';

  const getEventDotColor = (text: string): string => {
    const lower = text.toLowerCase();
    for (const p of gameState.players) {
      if (lower.includes(p.nickname.toLowerCase())) {
        return colorMap[p.id]?.hex ?? p.color;
      }
    }
    return themeConfig.palette.accent;
  };

  return (
    <div
      className="relative z-10 w-full h-full flex flex-col justify-between items-center text-center select-none overflow-hidden"
      style={{ fontFamily: 'var(--font-body)', color: 'var(--board-ink)' }}
    >
      {/* Top Bar: World Title, Active Turn Indicator & Timer */}
      <div
        className="w-full flex items-center justify-between gap-2 pb-2 border-b"
        style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 48%, transparent)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0 border border-black/40"
            style={{
              backgroundColor: activePlayerColor,
              boxShadow: `0 0 8px ${activePlayerColor}`
            }}
          />
          <span className="text-xs sm:text-sm font-bold truncate">
            {isMyTurn ? 'Your Turn' : `${activePlayer?.nickname ?? 'Player'}'s Turn`}
          </span>
        </div>

        <span
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--accent)',
            textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
          }}
          className="hidden sm:inline-block text-xs font-bold tracking-[0.18em] opacity-90"
        >
          TYCOONVALE
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {gameState.settings.freeParkingJackpot && gameState.jackpotPool > 0 && (
            <div
              style={{
                borderColor: 'var(--tile-border)',
                borderRadius: 'var(--radius-tile)',
                color: 'var(--accent)'
              }}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold border bg-black/25 tabular-nums"
            >
              <Coins className="w-3 h-3" />
              <AnimatedCurrency value={gameState.jackpotPool} prefix={currency} showDelta={false} />
            </div>
          )}

          <div
            style={{
              borderColor: 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
              borderRadius: 'var(--radius-tile)'
            }}
            className="flex items-center gap-1 text-[11px] font-bold bg-black/30 px-2 py-0.5 border tabular-nums"
          >
            <Timer className="w-3 h-3" style={{ color: 'var(--accent)' }} />
            <span>{gameState.turn.turnTimerSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Center Stage: 3D World Dice + Live Event Log */}
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-3 py-2">
        {isValorant ? (
          <>
            {/* Intentional Tactical Title Lockup */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-px bg-[#FF4655]/80" aria-hidden="true" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.26em] text-[#9AA8B5]">
                  Tactical Protocol
                </span>
                <span className="w-5 h-px bg-[#FF4655]/80" aria-hidden="true" />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#ECE8E1'
                }}
                className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] leading-none"
              >
                TYCOONVALE
              </div>
            </div>

            {/* Larger Centered 3D Steel Dice with Soft Under-Glow */}
            <div className="relative px-8 py-4 flex items-center justify-center gap-9">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 bottom-1 h-10 rounded-full blur-md"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(255, 70, 85, 0.2) 0%, rgba(142, 163, 184, 0.12) 48%, rgba(15, 25, 35, 0) 76%)'
                }}
              />
              {rollingDiceValues.map((val, idx) => (
                <Dice3D
                  key={idx}
                  index={idx}
                  value={val}
                  isRolling={isRolling}
                  midRollPreview={midRollPreview}
                  isDouble={gameState.turn.rolledDouble}
                  worldId={themeConfig.id}
                  diceConfig={themeConfig.dice}
                  size={58}
                />
              ))}
            </div>
          </>
        ) : isWompWomp ? (
          <>
            {/* Playful WorldWompWomp Center Branding + Mascot Crest */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <img
                  src="/tokens/wompwomp/peach.png"
                  alt="WorldWompWomp Mascot"
                  draggable={false}
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]"
                />
                <div
                  style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-xl sm:text-2xl font-bold tracking-wide leading-none flex items-baseline"
                >
                  <span style={{ color: '#FFF7F2' }}>World</span>
                  <span style={{ color: '#FF8AB8' }}>Womp</span>
                  <span style={{ color: '#C49BFF' }}>Womp</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9E7D]" aria-hidden="true" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF85B3]" aria-hidden="true" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD166]" aria-hidden="true" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FE3B5]" aria-hidden="true" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6BC8FF]" aria-hidden="true" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C49BFF]" aria-hidden="true" />
              </div>
            </div>

            {/* Rounded Marshmallow-White 3D Toy Dice over Soft Pastel Glow */}
            <div className="relative px-8 py-4 flex items-center justify-center gap-9">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1 bottom-0.5 h-11 rounded-full blur-md"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(255, 138, 184, 0.28) 0%, rgba(196, 155, 255, 0.16) 52%, rgba(26, 17, 40, 0) 78%)'
                }}
              />
              {rollingDiceValues.map((val, idx) => (
                <Dice3D
                  key={idx}
                  index={idx}
                  value={val}
                  isRolling={isRolling}
                  midRollPreview={midRollPreview}
                  isDouble={gameState.turn.rolledDouble}
                  worldId={themeConfig.id}
                  diceConfig={themeConfig.dice}
                  size={56}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* World Crest Label */}
            <div
              style={{
                color: 'var(--accent)',
                borderColor: 'color-mix(in srgb, var(--tile-border) 60%, transparent)',
                borderRadius: 'var(--radius-tile)'
              }}
              className="px-3 py-0.5 border text-[10px] font-bold uppercase tracking-[0.2em] bg-black/20"
            >
              {themeConfig.name}
            </div>

            {/* 3D Dice Tray */}
            <div
              style={{
                borderColor: 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                borderRadius: 'var(--radius-tile)',
                backgroundColor: 'rgba(0, 0, 0, 0.24)'
              }}
              className="px-6 py-4 border flex items-center justify-center gap-7 shadow-inner"
            >
              {rollingDiceValues.map((val, idx) => (
                <Dice3D
                  key={idx}
                  index={idx}
                  value={val}
                  isRolling={isRolling}
                  midRollPreview={midRollPreview}
                  isDouble={gameState.turn.rolledDouble}
                  worldId={themeConfig.id}
                  diceConfig={themeConfig.dice}
                  size={50}
                />
              ))}
            </div>
          </>
        )}

        {/* Doubles Badge */}
        <AnimatePresence>
          {gameState.turn.rolledDouble && !isRolling && !midRollPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.18 }}
              style={{
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                borderRadius: 'var(--radius-tile)'
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-black/30"
            >
              <Sparkles className="w-3 h-3" />
              <span>Doubles! Roll Again</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Center Event Log (strictly bounded inside center area, fading cleanly) */}
        <div
          aria-live="polite"
          data-testid="center-event-log"
          className={
            isValorant
              ? 'w-full max-w-[270px] flex flex-col items-start gap-1.5 overflow-hidden px-2 pt-1'
              : 'w-full max-w-[300px] flex flex-col items-center gap-1 overflow-hidden'
          }
        >
          <AnimatePresence initial={false}>
            {recentEvents.map((ev, idx) =>
              isValorant ? (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{
                    opacity: idx === 0 ? 0.94 : idx === 1 ? 0.58 : 0.3,
                    x: 0
                  }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.22 }}
                  className="w-full flex items-center gap-2 text-left text-[11px] font-semibold tracking-wide text-[#DCE4EC] truncate"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: getEventDotColor(ev.text) }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{ev.text}</span>
                </motion.div>
              ) : (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{
                    opacity: idx === 0 ? 0.96 : idx === 1 ? 0.68 : 0.42,
                    y: 0,
                    scale: 1
                  }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    borderColor:
                      idx === 0
                        ? 'color-mix(in srgb, var(--accent) 55%, var(--tile-border))'
                        : 'color-mix(in srgb, var(--tile-border) 35%, transparent)',
                    borderRadius: 'var(--radius-tile)',
                    backgroundColor: 'rgba(0, 0, 0, 0.34)'
                  }}
                  className="w-full px-2.5 py-1 border text-[11px] font-semibold truncate"
                >
                  {ev.text}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls: Purchase Decision / Jail / Roll Dice / End Turn */}
      <div
        className="w-full flex flex-col gap-1.5 pt-2 border-t"
        style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 48%, transparent)' }}
      >
        <AnimatePresence>
          {isPendingPurchase && pendingEngineTile && isMyTurn && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.42)',
                borderColor: 'var(--accent)',
                borderRadius: 'var(--radius-tile)'
              }}
              className="p-2 border space-y-1.5"
            >
              <div className="text-xs font-semibold">
                Claim <strong>{pendingDisplayName}</strong> for{' '}
                <strong style={{ color: 'var(--accent)' }} className="tabular-nums">
                  {currency}
                  {pendingPrice}
                </strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="buy-property-btn"
                  onClick={() => buyProperty(pendingEngineTile.id)}
                  disabled={player.balance < pendingPrice}
                  style={{
                    backgroundColor: 'var(--accent-2)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-button)'
                  }}
                  className="flex-1 py-1.5 px-2.5 text-xs font-bold uppercase tracking-wider transition hover:brightness-110 disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Buy Deed</span>
                </button>
                <button
                  type="button"
                  onClick={() => declineProperty(pendingEngineTile.id)}
                  style={{
                    borderColor: 'var(--tile-border)',
                    color: 'var(--board-ink)',
                    borderRadius: 'var(--radius-button)'
                  }}
                  className="flex-1 py-1.5 px-2.5 text-xs font-bold uppercase tracking-wider border bg-black/35 hover:bg-black/55 transition flex items-center justify-center gap-1.5"
                >
                  <Gavel className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Auction</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jail Controls */}
        {player.inJail && isMyTurn && !gameState.turn.canEndTurn && (
          <div
            style={{
              borderColor: 'var(--accent)',
              borderRadius: 'var(--radius-tile)',
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }}
            className="p-2 border space-y-1.5"
          >
            <div className="text-[11px] font-bold flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>In Detention ({player.jailTurns}/3 turns)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={rollDice}
                disabled={!gameState.turn.canRoll || isRolling}
                style={{
                  borderColor: 'var(--tile-border)',
                  borderRadius: 'var(--radius-button)'
                }}
                className="py-1.5 px-2 border bg-black/35 font-bold disabled:opacity-40"
              >
                Roll Doubles
              </button>
              <button
                type="button"
                onClick={payJailFine}
                disabled={player.balance < gameState.settings.jailBailCost}
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#0B1218',
                  borderRadius: 'var(--radius-button)'
                }}
                className="py-1.5 px-2 font-bold disabled:opacity-40"
              >
                Pay {currency}
                {gameState.settings.jailBailCost}
              </button>
              {player.getOutOfJailCards > 0 && (
                <button
                  type="button"
                  onClick={useJailCard}
                  style={{
                    backgroundColor: 'var(--accent-2)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-button)'
                  }}
                  className="col-span-2 py-1.5 px-2 font-bold flex items-center justify-center gap-1"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Use Pardon Card</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Primary Roll Dice / End Turn Action Bar */}
        {!isPendingPurchase && (!player.inJail || gameState.turn.canEndTurn) && (
          <div className="flex justify-center gap-2">
            {isMyTurn && gameState.turn.canRoll ? (
              isValorant ? (
                <button
                  type="button"
                  data-testid="roll-dice-btn"
                  onClick={rollDice}
                  disabled={isRolling}
                  className="tv-val-cta-roll"
                >
                  <Dices className="w-3.5 h-3.5 text-[#FF4655]" />
                  <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
                </button>
              ) : isWompWomp ? (
                <button
                  type="button"
                  data-testid="roll-dice-btn"
                  onClick={rollDice}
                  disabled={isRolling}
                  className="tv-womp-cta-roll"
                >
                  <Dices className="w-4 h-4" />
                  <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="roll-dice-btn"
                  onClick={rollDice}
                  disabled={isRolling}
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#0B1218',
                    borderRadius: 'var(--radius-button)'
                  }}
                  className="w-full py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Dices className="w-4 h-4" />
                  <span>{isRolling ? 'Rolling Dice...' : 'Roll Dice'}</span>
                </button>
              )
            ) : isMyTurn && gameState.turn.canEndTurn ? (
              isValorant ? (
                <button
                  type="button"
                  data-testid="end-turn-btn"
                  onClick={endTurn}
                  className="tv-val-cta-end"
                >
                  <span>End Turn</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#3DD2C3]" />
                </button>
              ) : isWompWomp ? (
                <button
                  type="button"
                  data-testid="end-turn-btn"
                  onClick={endTurn}
                  className="tv-womp-cta-end"
                >
                  <span>End Turn</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="end-turn-btn"
                  onClick={endTurn}
                  style={{
                    backgroundColor: 'var(--accent-2)',
                    color: '#FFFFFF',
                    borderColor: 'var(--accent)',
                    borderRadius: 'var(--radius-button)'
                  }}
                  className="w-full py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider border shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2"
                >
                  <span>End Turn</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )
            ) : (
              <div
                style={{
                  borderColor: 'color-mix(in srgb, var(--tile-border) 45%, transparent)',
                  borderRadius: 'var(--radius-button)'
                }}
                className="w-full py-2 border bg-black/30 text-xs font-semibold opacity-75 flex items-center justify-center"
              >
                Waiting for {activePlayer?.nickname ?? 'player'}...
              </div>
            )}
          </div>
        )}

        {/* Trade Shortcut (live games) */}
        {!override && (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={openTrade}
              style={{
                borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)',
                color: 'var(--accent)',
                borderRadius: 'var(--radius-button)'
              }}
              className="py-0.5 px-2.5 border bg-black/25 hover:bg-black/45 text-[11px] font-bold transition flex items-center gap-1"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Trade</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
