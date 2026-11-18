import React, { useEffect, useMemo } from 'react';
import {
  canBuildHouse,
  canSellHouse,
  canMortgage,
  canUnmortgage,
  type BoardTile,
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
import { X, Home, Shield, RotateCcw, ShoppingBag, Gavel } from 'lucide-react';

export interface PropertyDetailModalProps {
  tile?: BoardTile | null;
  gameState?: GameState | null;
  localPlayer?: Player | null;
  themeConfig?: ThemeConfig;
  onClose?: () => void;
  onBuyProperty?: (tileId: number) => void;
  onDeclineProperty?: (tileId: number) => void;
  onBuildHouse?: (tileId: number) => void;
  onSellHouse?: (tileId: number) => void;
  onMortgageProperty?: (tileId: number) => void;
  onUnmortgageProperty?: (tileId: number) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  tile: propTile,
  gameState: propGameState,
  localPlayer: propLocalPlayer,
  themeConfig: propThemeConfig,
  onClose: propOnClose,
  onBuyProperty: propOnBuy,
  onDeclineProperty: propOnDecline,
  onBuildHouse: propOnBuild,
  onSellHouse: propOnSell,
  onMortgageProperty: propOnMortgage,
  onUnmortgageProperty: propOnUnmortgage
}) => {
  let ctx: ReturnType<typeof useGame> | null = null;
  try {
    ctx = useGame();
  } catch {
    ctx = null;
  }

  const selectedTile = propTile !== undefined ? propTile : ctx?.selectedTile ?? null;
  const gameState = propGameState !== undefined ? propGameState : ctx?.gameState ?? null;
  const player = propLocalPlayer !== undefined ? propLocalPlayer : ctx?.player ?? null;

  const handleClose = propOnClose ?? (() => ctx?.setSelectedTile(null));
  const buyProperty = propOnBuy ?? ctx?.buyProperty;
  const declineProperty = propOnDecline ?? ctx?.declineProperty;
  const buildHouse = propOnBuild ?? ctx?.buildHouse;
  const sellHouse = propOnSell ?? ctx?.sellHouse;
  const mortgageProperty = propOnMortgage ?? ctx?.mortgageProperty;
  const unmortgageProperty = propOnUnmortgage ?? ctx?.unmortgageProperty;

  useEffect(() => {
    if (!selectedTile) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedTile, handleClose]);

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

  if (!selectedTile || !gameState) return null;

  const tileDef = theme.tiles[selectedTile.id];
  const displayName = tileDef?.name ?? selectedTile.name;
  const currency = theme.currencySymbol;
  const prop = gameState.properties[selectedTile.id];
  const owner = prop?.ownerId ? gameState.players.find(p => p.id === prop.ownerId) : null;
  const isOwner = Boolean(player && prop?.ownerId === player.id);

  const headerColor =
    tileDef?.groupIndex !== undefined
      ? theme.groupColors[tileDef.groupIndex]
      : 'color-mix(in srgb, var(--accent) 40%, var(--board))';
  const isLightHeader = tileDef?.groupIndex === 5 || tileDef?.groupIndex === 1;
  const headerInkClass = isLightHeader ? 'text-[#111827]' : 'text-white';

  const ownerColor = owner ? colorMap[owner.id]?.hex ?? owner.color : undefined;
  const ownerToken = owner ? tokenMap[owner.id] : undefined;

  const isMyTurn = Boolean(player && gameState.turn.activePlayerId === player.id);
  const pendingTileId = gameState.turn.pendingTileId ?? player?.position;
  const canBuyNow =
    isMyTurn &&
    gameState.turn.mustResolveTile &&
    pendingTileId === selectedTile.id &&
    Boolean(selectedTile.price) &&
    !owner;

  const canAfford = Boolean(player && selectedTile.price && player.balance >= selectedTile.price);

  const buildCheck =
    isOwner && player
      ? canBuildHouse(selectedTile.id, player.id, gameState.properties, player.balance)
      : { canBuild: false, reason: undefined };
  const sellCheck =
    isOwner && player
      ? canSellHouse(selectedTile.id, player.id, gameState.properties)
      : { canSell: false, reason: undefined };
  const mortgageCheck =
    isOwner && player
      ? canMortgage(selectedTile.id, player.id, gameState.properties)
      : { canMortgage: false, reason: undefined };
  const unmortgageCheck =
    isOwner && player
      ? canUnmortgage(selectedTile.id, player.id, gameState.properties, player.balance)
      : { canUnmortgage: false, cost: 0, reason: undefined };

  const activeTierIdx = prop?.hotel ? 5 : prop?.houses ?? 0;
  const chamferedAttr = theme.chamfered ? 'true' : 'false';
  const mortgageVal = selectedTile.mortgageValue ?? (selectedTile.price ? Math.floor(selectedTile.price / 2) : 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} Property Card`}
      data-testid="property-card-modal"
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        data-chamfered={chamferedAttr}
        className="tv-hud-panel max-w-sm w-full overflow-hidden shadow-2xl relative select-none"
      >
        {/* Colored Set Header Band */}
        <div
          style={{
            backgroundColor: headerColor,
            borderBottom: '2px solid rgba(0, 0, 0, 0.35)'
          }}
          className={`px-4 py-3.5 ${headerInkClass} relative flex items-center gap-3`}
        >
          <div className="shrink-0">
            <TileIcon
              id={tileDef?.icon ?? 'landmark'}
              worldId={theme.id}
              kind={tileDef?.kind ?? 'property'}
              groupIndex={tileDef?.groupIndex}
              size={18}
              chamfered={theme.chamfered}
            />
          </div>

          <div className="min-w-0 flex-1 pr-7">
            <span className="text-[10px] uppercase tracking-widest opacity-85 block font-bold">
              {tileDef?.groupIndex !== undefined
                ? `Set ${tileDef.groupIndex + 1} · Title Deed`
                : selectedTile.type === 'station'
                ? 'Transit Hub'
                : selectedTile.type === 'utility'
                ? 'Utility Network'
                : 'Board Space'}
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
              }}
              className="text-lg font-extrabold tracking-wide leading-tight truncate"
            >
              {displayName}
            </h2>
            {selectedTile.price && (
              <span className="text-xs font-bold tabular-nums opacity-95">
                Price: {currency}
                {selectedTile.price}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close property card"
            data-testid="property-card-close"
            className="tv-hud-focus absolute top-2.5 right-2.5 w-7 h-7 rounded bg-black/35 hover:bg-black/60 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Themed Card Body */}
        <div className="p-4 space-y-3">
          {/* Ownership Strip */}
          <div className="tv-hud-subcard px-3 py-2 flex items-center justify-between text-xs">
            <span className="opacity-70 font-medium">Owner</span>
            {owner ? (
              <div className="flex items-center gap-1.5 font-bold">
                <div
                  className="w-5 h-5 flex items-center justify-center overflow-hidden"
                  style={{
                    border: `1.5px solid ${ownerColor}`,
                    borderRadius: theme.chamfered ? '2px' : '9999px'
                  }}
                >
                  <WorldTokenIcon
                    tokenId={ownerToken?.id ?? owner.token}
                    tokenDef={ownerToken}
                    worldId={theme.id}
                    color={ownerColor ?? owner.color}
                    size={ownerToken?.imageSrc ? 18 : 14}
                  />
                </div>
                <span style={{ color: ownerColor }}>
                  {owner.nickname}
                  {isOwner && ' (You)'}
                </span>
                {prop?.isMortgaged && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 uppercase">
                    Mortgaged
                  </span>
                )}
              </div>
            ) : selectedTile.price ? (
              <span className="font-bold" style={{ color: 'var(--accent)' }}>
                Available from Bank
              </span>
            ) : (
              <span className="opacity-70">Special Space</span>
            )}
          </div>

          {/* Standard Property Rent Table */}
          {selectedTile.type === 'property' && selectedTile.rent && (
            <div className="tv-hud-subcard p-3 text-xs space-y-1 tabular-nums">
              <div className="text-[10px] uppercase tracking-widest opacity-65 font-bold pb-1 mb-1 border-b border-white/10">
                Rent Schedule
              </div>
              {[
                { label: 'Base Rent', value: selectedTile.rent[0], tier: 0 },
                { label: 'Full Set Bonus (Unimproved)', value: selectedTile.rent[0] * 2, tier: -1 },
                { label: `1 ${theme.hud.unitLabel}`, value: selectedTile.rent[1], tier: 1 },
                { label: `2 ${theme.hud.unitLabel}s`, value: selectedTile.rent[2], tier: 2 },
                { label: `3 ${theme.hud.unitLabel}s`, value: selectedTile.rent[3], tier: 3 },
                { label: `4 ${theme.hud.unitLabel}s`, value: selectedTile.rent[4], tier: 4 },
                { label: theme.hud.hotelLabel, value: selectedTile.rent[5], tier: 5 }
              ].map(row => {
                const isActive = owner && !prop?.isMortgaged && row.tier === activeTierIdx;
                return (
                  <div
                    key={row.label}
                    style={
                      isActive
                        ? {
                            backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                            color: 'var(--accent)',
                            borderRadius: 'var(--radius-tile)'
                          }
                        : undefined
                    }
                    className={`flex items-center justify-between px-1.5 py-0.5 ${
                      row.tier === 5 ? 'font-bold pt-1 mt-1 border-t border-white/10' : ''
                    }`}
                  >
                    <span className={isActive ? 'font-bold' : 'opacity-85'}>{row.label}</span>
                    <span className="font-bold">
                      {currency}
                      {row.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Transit Rent Table */}
          {selectedTile.type === 'station' && (
            <div className="tv-hud-subcard p-3 text-xs space-y-1 tabular-nums">
              <div className="text-[10px] uppercase tracking-widest opacity-65 font-bold pb-1 mb-1 border-b border-white/10">
                Transit Tariff
              </div>
              {[
                ['1 Hub Owned', 25],
                ['2 Hubs Owned', 50],
                ['3 Hubs Owned', 100],
                ['4 Hubs Owned', 200]
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between px-1 py-0.5">
                  <span className="opacity-85">{label}</span>
                  <span className="font-bold">
                    {currency}
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Utility Multipliers */}
          {selectedTile.type === 'utility' && (
            <div className="tv-hud-subcard p-3 text-xs space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest opacity-65 font-bold pb-1 border-b border-white/10">
                Utility Multiplier
              </div>
              <div className="flex justify-between">
                <span className="opacity-85">1 Utility Owned</span>
                <span className="font-bold">4x Dice Roll</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-85">Both Utilities Owned</span>
                <span className="font-bold" style={{ color: 'var(--accent)' }}>
                  10x Dice Roll
                </span>
              </div>
            </div>
          )}

          {/* House Cost & Mortgage Value */}
          {selectedTile.price && (
            <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
              <div className="tv-hud-subcard p-2 text-center">
                <span className="text-[10px] uppercase tracking-wider opacity-65 block">
                  {theme.hud.unitLabel} / {theme.hud.hotelLabel} Cost
                </span>
                <span className="font-extrabold">
                  {selectedTile.houseCost ? `${currency}${selectedTile.houseCost}` : 'N/A'}
                </span>
              </div>
              <div className="tv-hud-subcard p-2 text-center">
                <span className="text-[10px] uppercase tracking-wider opacity-65 block">
                  Mortgage Value
                </span>
                <span className="font-extrabold" style={{ color: 'var(--accent)' }}>
                  {currency}
                  {mortgageVal}
                </span>
              </div>
            </div>
          )}

          {/* Buy / Skip Actions when landing on an unowned property */}
          {canBuyNow && buyProperty && declineProperty && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={!canAfford}
                data-testid="property-modal-buy-btn"
                data-chamfered={chamferedAttr}
                onClick={() => {
                  buyProperty(selectedTile.id);
                  handleClose();
                }}
                className="tv-hud-btn tv-hud-btn-primary py-2 px-3 text-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Buy ({currency}
                  {selectedTile.price})
                </span>
              </button>
              <button
                type="button"
                data-testid="property-modal-skip-btn"
                data-chamfered={chamferedAttr}
                onClick={() => {
                  declineProperty(selectedTile.id);
                  handleClose();
                }}
                className="tv-hud-btn tv-hud-btn-secondary py-2 px-3 text-xs"
              >
                <Gavel className="w-3.5 h-3.5 shrink-0" />
                <span>{gameState.settings.auctionEnabled ? 'Skip / Auction' : 'Skip'}</span>
              </button>
            </div>
          )}

          {/* Owner Build / Sell / Mortgage Controls */}
          {isOwner && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              {selectedTile.type === 'property' && buildHouse && sellHouse && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => buildHouse(selectedTile.id)}
                    disabled={!buildCheck.canBuild}
                    title={buildCheck.reason}
                    data-chamfered={chamferedAttr}
                    className="tv-hud-btn tv-hud-btn-primary py-2 px-2.5 text-xs"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>
                      Build ({currency}
                      {selectedTile.houseCost})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sellHouse(selectedTile.id)}
                    disabled={!sellCheck.canSell}
                    title={sellCheck.reason}
                    data-chamfered={chamferedAttr}
                    className="tv-hud-btn tv-hud-btn-secondary py-2 px-2.5 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sell {theme.hud.unitLabel}</span>
                  </button>
                </div>
              )}

              {!prop?.isMortgaged && mortgageProperty ? (
                <button
                  type="button"
                  onClick={() => mortgageProperty(selectedTile.id)}
                  disabled={!mortgageCheck.canMortgage}
                  title={mortgageCheck.reason}
                  data-chamfered={chamferedAttr}
                  className="tv-hud-btn tv-hud-btn-danger w-full py-2 px-3 text-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    Mortgage (+{currency}
                    {mortgageVal})
                  </span>
                </button>
              ) : (
                unmortgageProperty && (
                  <button
                    type="button"
                    onClick={() => unmortgageProperty(selectedTile.id)}
                    disabled={!unmortgageCheck.canUnmortgage}
                    title={unmortgageCheck.reason}
                    data-chamfered={chamferedAttr}
                    className="tv-hud-btn tv-hud-btn-primary w-full py-2 px-3 text-xs"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>
                      Unmortgage (-{currency}
                      {unmortgageCheck.cost})
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
