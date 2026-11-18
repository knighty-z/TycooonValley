import React, { useMemo } from 'react';
import {
  getTileById,
  canBuildHouse,
  canMortgage,
  canUnmortgage,
  type GameState,
  type Player
} from '@tycoonvale/shared';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig
} from '../../themes/index.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import { AnimatedCurrency } from './AnimatedCurrency.js';
import {
  Dices,
  ShoppingBag,
  Gavel,
  Home,
  Shield,
  ArrowLeftRight,
  SkipForward,
  Clock,
  Lock,
  Ticket
} from 'lucide-react';

export interface TurnActionBarProps {
  gameState: GameState;
  localPlayer: Player | null;
  themeConfig?: ThemeConfig;
  isRolling?: boolean;
  onRollDice: () => void;
  onBuyProperty: (tileId: number) => void;
  onDeclineProperty: (tileId: number) => void;
  onEndTurn: () => void;
  onPayJailFine?: () => void;
  onUseJailCard?: () => void;
  onInspectTile?: (tileId: number) => void;
  onOpenTrade?: () => void;
}

function getPhaseLabel(gameState: GameState, isInJail: boolean): string {
  if (isInJail && gameState.turn.canRoll) return 'In Jail';
  switch (gameState.turn.rollState) {
    case 'CAN_ROLL':
      return 'Roll';
    case 'ROLLING':
    case 'MOVING':
      return 'Move';
    case 'TILE_ACTION':
      return 'Buy or Auction';
    case 'AUCTION':
      return 'Auction';
    case 'TRADE':
      return 'Trade';
    case 'TURN_ACTIONS':
      return 'End Turn';
    default:
      return 'Turn';
  }
}

export const TurnActionBar: React.FC<TurnActionBarProps> = React.memo(
  ({
    gameState,
    localPlayer,
    themeConfig,
    isRolling = false,
    onRollDice,
    onBuyProperty,
    onDeclineProperty,
    onEndTurn,
    onPayJailFine,
    onUseJailCard,
    onInspectTile,
    onOpenTrade
  }) => {
    const theme = themeConfig ?? getThemeConfig(gameState.settings.theme);
    const currency = theme.currencySymbol;
    const colorMap = useMemo(() => resolveUniquePlayerColors(gameState.players), [gameState.players]);
    const tokenMap = useMemo(
      () => resolveWorldTokensForPlayers(gameState.players, theme.tokens),
      [gameState.players, theme.tokens]
    );

    const activePlayer =
      gameState.players.find(p => p.id === gameState.turn.activePlayerId) ?? gameState.players[0];
    const isMyTurn = Boolean(localPlayer && activePlayer && localPlayer.id === activePlayer.id && !localPlayer.isBankrupt);

    const activeColor = activePlayer ? colorMap[activePlayer.id]?.hex ?? activePlayer.color : 'var(--accent)';
    const activeToken = activePlayer ? tokenMap[activePlayer.id] : undefined;

    const timerSec = gameState.turn.turnTimerSeconds;
    const isTimerUrgent = timerSec <= 10;

    // Determine pending unowned buyable tile when mustResolveTile is active
    const pendingTileId = gameState.turn.pendingTileId ?? localPlayer?.position;
    const pendingEngineTile = pendingTileId !== undefined ? getTileById(pendingTileId) : undefined;
    const pendingWorldTile = pendingTileId !== undefined ? theme.tiles[pendingTileId] : undefined;
    const pendingPropState = pendingTileId !== undefined ? gameState.properties[pendingTileId] : undefined;

    const canResolvePurchase =
      isMyTurn &&
      gameState.turn.mustResolveTile &&
      Boolean(pendingEngineTile?.price) &&
      !pendingPropState?.ownerId;

    const pendingPrice = pendingEngineTile?.price ?? pendingWorldTile?.price ?? 0;
    const canAffordPending = Boolean(localPlayer && localPlayer.balance >= pendingPrice);

    // Find first buildable & mortgageable tiles for contextual Build / Mortgage shortcuts
    const { firstBuildableTileId, firstMortgageTileId } = useMemo(() => {
      if (!localPlayer) return { firstBuildableTileId: null as number | null, firstMortgageTileId: null as number | null };
      let buildId: number | null = null;
      let mortId: number | null = null;

      for (const tid of localPlayer.properties) {
        if (buildId === null && canBuildHouse(tid, localPlayer.id, gameState.properties, localPlayer.balance).canBuild) {
          buildId = tid;
        }
        if (
          mortId === null &&
          (canMortgage(tid, localPlayer.id, gameState.properties).canMortgage ||
            canUnmortgage(tid, localPlayer.id, gameState.properties, localPlayer.balance).canUnmortgage)
        ) {
          mortId = tid;
        }
      }
      return { firstBuildableTileId: buildId, firstMortgageTileId: mortId };
    }, [localPlayer, gameState.properties]);

    const phaseLabel = getPhaseLabel(gameState, Boolean(activePlayer?.inJail));
    const headingTransform = theme.fonts.headingUppercase ? 'uppercase' : 'none';
    const chamferedAttr = theme.chamfered ? 'true' : 'false';

    return (
      <div
        role="region"
        aria-label="Turn and Action HUD"
        data-testid="turn-action-bar"
        data-chamfered={chamferedAttr}
        className="tv-hud-panel w-full max-w-[740px] px-3 py-1.5 flex items-center justify-between gap-2 shrink-0"
      >
        {/* Left: Turn State, Active Player / Cash & Timer */}
        <div className="flex items-center gap-2.5 min-w-0">
          {isMyTurn && localPlayer ? (
            <>
              <span
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#0B1218',
                  borderRadius: 'var(--radius-tile)',
                  fontFamily: 'var(--font-heading)',
                  textTransform: headingTransform
                }}
                className="px-2 py-0.5 text-[11px] font-extrabold tracking-wider shrink-0"
              >
                Your Turn
              </span>

              <span
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--bg) 82%, var(--board))',
                  borderColor: 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                  borderRadius: 'var(--radius-tile)'
                }}
                data-testid="turn-phase-badge"
                className="px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider shrink-0 opacity-90"
              >
                {phaseLabel}
              </span>

              <div
                className="flex items-center gap-1 text-xs font-extrabold tabular-nums shrink-0"
                style={{ color: 'var(--board-ink)' }}
                title="Your current cash"
              >
                <AnimatedCurrency value={localPlayer.balance} prefix={currency} showDelta={true} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 shrink-0 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--bg) 86%, var(--board))',
                  border: `1.5px solid ${activeColor}`,
                  borderRadius: theme.chamfered ? '2px' : '9999px'
                }}
              >
                {activePlayer && (
                  <WorldTokenIcon
                    tokenId={activeToken?.id ?? activePlayer.token}
                    tokenDef={activeToken}
                    worldId={theme.id}
                    color={activeColor}
                    size={activeToken?.imageSrc ? 22 : 16}
                  />
                )}
              </div>
              <span className="text-xs font-semibold truncate">
                Waiting for{' '}
                <strong style={{ color: activeColor }}>{activePlayer?.nickname ?? 'Player'}</strong>
              </span>
              <span className="hidden sm:inline-block text-[10px] opacity-65 uppercase tracking-wider shrink-0">
                &middot; {phaseLabel}
              </span>
            </div>
          )}

          {/* Turn Timer Pill */}
          <div
            data-testid="turn-timer"
            style={{
              backgroundColor: isTimerUrgent
                ? 'rgba(220, 38, 38, 0.22)'
                : 'color-mix(in srgb, var(--bg) 82%, var(--board))',
              borderColor: isTimerUrgent
                ? 'rgba(239, 68, 68, 0.7)'
                : 'color-mix(in srgb, var(--tile-border) 50%, transparent)',
              color: isTimerUrgent ? '#FCA5A5' : 'var(--board-ink)',
              borderRadius: 'var(--radius-tile)'
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] font-bold tabular-nums shrink-0 ${
              isTimerUrgent ? 'animate-pulse' : ''
            }`}
          >
            <Clock className="w-3 h-3" style={{ color: isTimerUrgent ? '#F87171' : 'var(--accent)' }} />
            <span>{timerSec}s</span>
          </div>
        </div>

        {/* Right: Contextual Action Buttons (strictly shown when valid) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Jail escape options when jailed & can roll */}
          {isMyTurn && localPlayer?.inJail && gameState.turn.canRoll && (
            <>
              {onPayJailFine && (
                <button
                  type="button"
                  onClick={onPayJailFine}
                  disabled={localPlayer.balance < gameState.settings.jailBailCost}
                  data-chamfered={chamferedAttr}
                  className="tv-hud-btn tv-hud-btn-secondary px-2 py-1 text-[11px]"
                >
                  <Lock className="w-3 h-3" />
                  <span>Bail {currency}{gameState.settings.jailBailCost}</span>
                </button>
              )}
              {onUseJailCard && localPlayer.getOutOfJailCards > 0 && (
                <button
                  type="button"
                  onClick={onUseJailCard}
                  data-chamfered={chamferedAttr}
                  className="tv-hud-btn tv-hud-btn-secondary px-2 py-1 text-[11px]"
                >
                  <Ticket className="w-3 h-3" />
                  <span>Pardon</span>
                </button>
              )}
            </>
          )}

          {/* Roll Dice */}
          {isMyTurn && gameState.turn.canRoll && (
            <button
              type="button"
              onClick={onRollDice}
              disabled={isRolling}
              data-testid="hud-roll-btn"
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-primary px-3 py-1 text-xs"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
            </button>
          )}

          {/* Buy & Skip/Auction when standing on an unowned property */}
          {canResolvePurchase && pendingTileId !== undefined && (
            <>
              <button
                type="button"
                onClick={() => onBuyProperty(pendingTileId)}
                disabled={!canAffordPending}
                title={canAffordPending ? `Buy ${pendingWorldTile?.name}` : 'Insufficient cash'}
                data-testid="hud-buy-btn"
                data-chamfered={chamferedAttr}
                className="tv-hud-btn tv-hud-btn-primary px-2.5 py-1 text-[11px]"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>
                  Buy {currency}
                  {pendingPrice}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeclineProperty(pendingTileId)}
                data-testid="hud-skip-btn"
                data-chamfered={chamferedAttr}
                className="tv-hud-btn tv-hud-btn-secondary px-2.5 py-1 text-[11px]"
              >
                <Gavel className="w-3 h-3" />
                <span>{gameState.settings.auctionEnabled ? 'Auction' : 'Skip'}</span>
              </button>
            </>
          )}

          {/* Contextual Property Management Shortcuts (Build / Mortgage) */}
          {localPlayer && !localPlayer.isBankrupt && firstBuildableTileId !== null && onInspectTile && (
            <button
              type="button"
              onClick={() => onInspectTile(firstBuildableTileId)}
              title={`Build ${theme.hud.unitLabel}`}
              data-testid="hud-build-btn"
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-secondary px-2 py-1 text-[11px]"
            >
              <Home className="w-3 h-3" />
              <span className="hidden xl:inline">Build</span>
            </button>
          )}

          {localPlayer && !localPlayer.isBankrupt && firstMortgageTileId !== null && onInspectTile && (
            <button
              type="button"
              onClick={() => onInspectTile(firstMortgageTileId)}
              title="Mortgage / Unmortgage property"
              data-testid="hud-mortgage-btn"
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-secondary px-2 py-1 text-[11px]"
            >
              <Shield className="w-3 h-3" />
              <span className="hidden xl:inline">Mortgage</span>
            </button>
          )}

          {/* Trade Hook */}
          {localPlayer && !localPlayer.isBankrupt && gameState.settings.tradingEnabled && onOpenTrade && (
            <button
              type="button"
              onClick={onOpenTrade}
              title="Propose a trade"
              data-testid="hud-trade-btn"
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-secondary px-2 py-1 text-[11px]"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span className="hidden md:inline">Trade</span>
            </button>
          )}

          {/* End Turn */}
          {isMyTurn && gameState.turn.canEndTurn && (
            <button
              type="button"
              onClick={onEndTurn}
              data-testid="hud-end-turn-btn"
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-primary px-3 py-1 text-xs"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>End Turn</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);

TurnActionBar.displayName = 'TurnActionBar';
