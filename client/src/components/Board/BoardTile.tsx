import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BoardTile as EngineTile, PropertyState, Player, BoardTheme } from '@tycoonvale/shared';
import type { ActiveTileEffect } from '../../context/GameContext.js';
import {
  getThemeConfig,
  getPlayerColorSpec,
  type ThemeConfig,
  type TileDef,
  type TokenDef,
  type BoardEdge
} from '../../themes/index.js';
import { TileIcon } from '../Icons/TileIcons.js';
import { getTokenById } from '../Artwork/TokenIcons.js';

export interface BoardTileProps {
  /** Authoritative engine tile (prices/types remain single source of truth) */
  tile: EngineTile;
  /** World-specific presentation definition for this tile index (0..39) */
  tileDef?: TileDef;
  propertyState?: PropertyState;
  playersOnTile: Player[];
  owner?: Player;
  /** Unique resolved accessible player color for the owner (used across panel, markers, hover) */
  ownerColor?: string;
  /** Optional owner token metadata for badge label */
  ownerTokenDef?: TokenDef;
  /** Hover highlight state driven by PlayerPanel hover / pin */
  highlightMode?: 'none' | 'highlighted' | 'dimmed';
  /** When true, skips inline tile tokens because TokenLayer renders smooth cross-tile tokens */
  useTokenLayer?: boolean;
  isCurrentTurnTile: boolean;
  isPressed?: boolean;
  walkingPlayerId?: string | null;
  tileEffect?: ActiveTileEffect | null;
  jackpotPool?: number;
  passGoReward?: number;
  edge: BoardEdge;
  theme: BoardTheme | ThemeConfig;
  onClick: () => void;
}

/**
 * Computes a prominent, responsive upright font size (`clamp(...)`) for every property
 * title across all 4 worlds so titles are effortlessly readable at both 1366x768 and
 * 1920x1080 with clean wrapping (max 2 lines when genuinely needed) and ZERO clipping.
 */
function getFittedNameFontSize(name: string, worldId: string, edge: BoardEdge): string {
  const words = name.trim().split(/\s+/);
  const maxWordLen = words.reduce((max, w) => Math.max(max, w.length), 0);
  const isLandscape = edge === 'left' || edge === 'right';

  // Cyberpunk uses wider geometric display glyphs (Chakra Petch); scale slightly gentler
  if (worldId === 'cyberpunk') {
    if (isLandscape) {
      if (maxWordLen >= 10 || words.length >= 3 || name.length >= 16) {
        return 'clamp(8.2px, 0.68vw, 11.4px)';
      }
      if (maxWordLen >= 8 || name.length >= 12) {
        return 'clamp(8.8px, 0.74vw, 12.2px)';
      }
      return 'clamp(9.4px, 0.80vw, 13px)';
    }
    if (maxWordLen >= 10) return 'clamp(8.4px, 0.70vw, 11.6px)';
    if (maxWordLen >= 8 || words.length >= 3 || name.length >= 14) {
      return 'clamp(9.1px, 0.77vw, 12.6px)';
    }
    return 'clamp(9.8px, 0.84vw, 13.4px)';
  }

  // India has several single long proper city names (e.g. "Aurangabad", "Waterworks", "Muzaffarpur")
  if (worldId === 'india') {
    if (isLandscape) {
      if (maxWordLen >= 10 || name.length >= 16) return 'clamp(7.5px, 0.62vw, 10.8px)';
      if (maxWordLen >= 9 || name.length >= 12) return 'clamp(8.3px, 0.70vw, 11.8px)';
      return 'clamp(9.6px, 0.82vw, 13.4px)';
    }
    if (maxWordLen >= 10) return 'clamp(7.6px, 0.63vw, 10.8px)';
    if (maxWordLen >= 9) return 'clamp(8.5px, 0.72vw, 12px)';
    if (maxWordLen >= 8 || name.length >= 13) return 'clamp(9.4px, 0.80vw, 13px)';
    return 'clamp(10.2px, 0.88vw, 14px)';
  }

  // VALORANT (Rajdhani — slightly condensed, super crisp at larger sizes!)
  if (worldId === 'valorant') {
    if (isLandscape) {
      if (maxWordLen >= 10 || words.length >= 3 || name.length >= 16) {
        return 'clamp(8.8px, 0.74vw, 12.2px)';
      }
      if (maxWordLen >= 8 || name.length >= 12) {
        return 'clamp(9.6px, 0.81vw, 13.2px)';
      }
      return 'clamp(10.4px, 0.88vw, 14.2px)';
    }
    if (maxWordLen >= 10) return 'clamp(9.2px, 0.78vw, 12.6px)';
    if (words.length >= 3 || name.length >= 14) return 'clamp(9.8px, 0.83vw, 13.4px)';
    if (maxWordLen >= 8 || name.length >= 12) return 'clamp(10.2px, 0.87vw, 13.8px)';
    return 'clamp(10.8px, 0.92vw, 14.6px)';
  }

  // WorldWompWomp (Nunito — rounded friendly display font, crisp with zero clipping at 1366x768 & 1920x1080)
  if (worldId === 'wompwomp') {
    if (isLandscape) {
      if (maxWordLen >= 10 || words.length >= 3 || name.length >= 15) {
        return 'clamp(7.4px, 0.62vw, 10.8px)';
      }
      if (maxWordLen >= 8 || name.length >= 12) {
        return 'clamp(8.2px, 0.70vw, 11.8px)';
      }
      return 'clamp(9.2px, 0.78vw, 12.8px)';
    }
    if (maxWordLen >= 9) return 'clamp(7.8px, 0.66vw, 11.4px)';
    if (maxWordLen >= 7 || words.length >= 3 || name.length >= 13) {
      return 'clamp(8.5px, 0.74vw, 12.2px)';
    }
    return 'clamp(9.5px, 0.82vw, 13.4px)';
  }

  // Original (clean modern sans — generous readability for "Crown Exchange", "Mint Row", etc.)
  if (isLandscape) {
    if (words.length >= 3 || name.length >= 17) {
      return 'clamp(7.8px, 0.65vw, 11.4px)';
    }
    if (maxWordLen >= 10 || name.length >= 13) {
      return 'clamp(8.5px, 0.72vw, 12.2px)';
    }
    if (maxWordLen >= 8 || name.length >= 11) {
      return 'clamp(9.2px, 0.78vw, 12.8px)';
    }
    return 'clamp(9.8px, 0.84vw, 13.6px)';
  }

  if (maxWordLen >= 10) return 'clamp(8.8px, 0.74vw, 12.2px)';
  if (words.length >= 3 || name.length >= 15) return 'clamp(9.5px, 0.80vw, 13px)';
  if (maxWordLen >= 8 || name.length >= 12) return 'clamp(10px, 0.85vw, 13.6px)';
  return 'clamp(10.6px, 0.90vw, 14.4px)';
}

const renderEffectBadge = (
  tileEffect: ActiveTileEffect | null | undefined,
  currencySymbol: string
) => (
  <AnimatePresence>
    {tileEffect && (
      <motion.div
        key={tileEffect.timestamp}
        data-testid={`tile-effect-${tileEffect.type}`}
        initial={{ opacity: 0, y: 6, scale: 0.8 }}
        animate={{ opacity: 1, y: -8, scale: 1 }}
        exit={{ opacity: 0, y: -18, scale: 0.9 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-x-0 top-1 flex justify-center z-30"
      >
        <span
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--accent)',
            borderColor: 'var(--accent)',
            borderRadius: 'var(--radius-tile)'
          }}
          className="px-1.5 py-0.5 text-[10px] font-bold border whitespace-nowrap shadow"
        >
          {tileEffect.type === 'purchase'
            ? tileEffect.amount
              ? `SOLD ${currencySymbol}${tileEffect.amount}`
              : 'DEED CLAIMED'
            : tileEffect.type === 'rent'
            ? `RENT -${currencySymbol}${tileEffect.amount ?? 0}`
            : tileEffect.type === 'jackpot'
            ? `+${currencySymbol}${tileEffect.amount ?? 0}`
            : `TAX -${currencySymbol}${tileEffect.amount ?? 0}`}
        </span>
      </motion.div>
    )}
  </AnimatePresence>
);

export const BoardTileComponent: React.FC<BoardTileProps> = React.memo(({
  tile,
  tileDef,
  propertyState,
  playersOnTile,
  owner,
  ownerColor,
  ownerTokenDef,
  highlightMode = 'none',
  useTokenLayer = false,
  isCurrentTurnTile,
  isPressed = false,
  walkingPlayerId,
  tileEffect,
  jackpotPool = 0,
  passGoReward = 200,
  edge,
  theme,
  onClick
}) => {
  const themeConfig: ThemeConfig = typeof theme === 'string' ? getThemeConfig(theme) : theme;
  const resolvedDef: TileDef = tileDef ?? themeConfig.tiles[tile.id] ?? themeConfig.tiles[0];
  const currency = themeConfig.currencySymbol;
  const displayName = resolvedDef.name;
  // Engine tile prices remain authoritative source of truth
  const displayPrice = tile.price ?? resolvedDef.price;
  const displayTax = tile.taxAmount ?? resolvedDef.taxAmount;
  const isOwned = Boolean(owner);
  const isMortgaged = Boolean(propertyState?.isMortgaged);
  const resolvedOwnerHex = owner ? ownerColor ?? owner.color : undefined;
  const ownerColorSpec = resolvedOwnerHex ? getPlayerColorSpec(resolvedOwnerHex) : undefined;

  const prevOwnerIdRef = useRef<string | undefined>(owner?.id);
  const [claimAnimKey, setClaimAnimKey] = useState<number | null>(null);

  useEffect(() => {
    const prevId = prevOwnerIdRef.current;
    const nextId = owner?.id;
    prevOwnerIdRef.current = nextId;
    if (nextId && nextId !== prevId) {
      setClaimAnimKey(Date.now());
      const timer = window.setTimeout(() => setClaimAnimKey(null), 560);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [owner?.id]);

  const renderInlineTokens = () => {
    if (useTokenLayer || playersOnTile.length === 0) return null;
    return (
      <div className="absolute inset-x-1 top-1 flex flex-wrap justify-center gap-1 z-20 pointer-events-none">
        {playersOnTile.map(p => {
          const token = getTokenById(p.token);
          const isWalking = walkingPlayerId === p.id;
          return (
            <motion.div
              key={`${p.id}-${tile.id}`}
              initial={isWalking ? { y: -11, scale: 1.2 } : { scale: 0.92, opacity: 0.9 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 440, damping: 24 }}
              title={p.nickname}
              className="w-5 h-5 flex items-center justify-center drop-shadow"
            >
              <token.Component color={p.color} />
            </motion.div>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // CORNER TILES (0 GO, 10 JAIL, 20 FREE PARKING, 30 GO TO JAIL)
  // Reference stacked card aesthetic: generous padding, clear icon, readable text
  // =========================================================================
  if (edge === 'corner') {
    return (
      <div
        className="tv-tile-wrapper"
        data-tile-index={tile.id}
        data-owned="false"
        data-hover-state={highlightMode}
        data-hover-style={themeConfig.ownership.hoverStyle}
        data-active={isCurrentTurnTile ? 'true' : 'false'}
        data-pressed={isPressed ? 'true' : 'false'}
        data-chamfered={themeConfig.chamfered ? 'true' : 'false'}
        data-neon={themeConfig.neonOutline ? 'true' : 'false'}
      >
        <div
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') onClick();
          }}
          className="tv-tile-surface"
        >
          {resolvedDef.kind === 'go' && (
            <div className="tv-corner-cell">
              <span className="tv-corner-sub">
                {resolvedDef.subtitle || 'Collect'} {currency}
                {passGoReward}
              </span>
              <div className="tv-corner-token-zone" aria-hidden="true" />
              <div className="tv-corner-footer">
                <TileIcon
                  id={resolvedDef.icon}
                  worldId={themeConfig.id}
                  kind="go"
                  variant="corner"
                  chamfered={themeConfig.chamfered}
                />
                <span
                  className="tv-corner-heading"
                  style={{
                    fontSize: displayName.length > 6 ? 'clamp(9.5px, 0.86vw, 13.5px)' : undefined,
                    textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                  }}
                >
                  {displayName}
                </span>
              </div>
            </div>
          )}

          {resolvedDef.kind === 'jail' && (
            <div className="tv-jail-layout">
              <div className="tv-jail-cell">
                <div className="tv-jail-token-zone" aria-hidden="true" />
                <div className="tv-corner-footer">
                  <TileIcon
                    id="jail_bars"
                    worldId={themeConfig.id}
                    kind="jail"
                    variant="jail"
                    chamfered={themeConfig.chamfered}
                  />
                  <span
                    className="tv-corner-heading"
                    style={{
                      fontSize:
                        displayName.length >= 9
                          ? 'clamp(8.5px, 0.76vw, 11.8px)'
                          : 'clamp(9.5px, 0.86vw, 13px)',
                      letterSpacing: '0.02em',
                      textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                    }}
                  >
                    {displayName}
                  </span>
                </div>
              </div>
              <div className="tv-jail-visiting-bottom">
                {resolvedDef.subtitle || 'Just Visiting'}
              </div>
            </div>
          )}

          {resolvedDef.kind === 'free_parking' && (
            <div className="tv-corner-cell">
              <div className="flex items-center justify-center gap-1">
                <span className="tv-corner-sub">{resolvedDef.subtitle || 'Free Parking'}</span>
                {jackpotPool > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: '#0B1218',
                      borderRadius: 'var(--radius-tile)'
                    }}
                    className="px-1 py-0.2 text-[9px] font-bold leading-none tabular-nums"
                  >
                    {currency}
                    {jackpotPool}
                  </span>
                )}
              </div>
              <div className="tv-corner-token-zone" aria-hidden="true" />
              <div className="tv-corner-footer">
                <TileIcon
                  id={resolvedDef.icon}
                  worldId={themeConfig.id}
                  kind="free_parking"
                  variant="corner"
                  chamfered={themeConfig.chamfered}
                />
                <span
                  className="tv-corner-heading"
                  style={{
                    fontSize:
                      displayName.length > 10
                        ? 'clamp(9px, 0.80vw, 12.5px)'
                        : 'clamp(10px, 0.90vw, 13.8px)',
                    textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                  }}
                >
                  {displayName}
                </span>
              </div>
            </div>
          )}

          {resolvedDef.kind === 'go_to_jail' && (
            <div className="tv-corner-cell">
              <span className="tv-corner-sub">{resolvedDef.subtitle || 'Go To Jail'}</span>
              <div className="tv-corner-token-zone" aria-hidden="true" />
              <div className="tv-corner-footer">
                <TileIcon
                  id={resolvedDef.icon}
                  worldId={themeConfig.id}
                  kind="go_to_jail"
                  variant="corner"
                  chamfered={themeConfig.chamfered}
                />
                <span
                  className="tv-corner-heading"
                  style={{
                    fontSize:
                      displayName.length > 10
                        ? 'clamp(8.8px, 0.78vw, 12px)'
                        : 'clamp(10px, 0.90vw, 13.8px)',
                    textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                  }}
                >
                  {displayName}
                </span>
              </div>
            </div>
          )}

          {renderEffectBadge(tileEffect, currency)}
          {renderInlineTokens()}
        </div>
      </div>
    );
  }

  // =========================================================================
  // REGULAR EDGE TILES — UNIFIED CORNER-STYLE STACKED CARD ARCHITECTURE
  // Stacked top-to-bottom: Token Zone -> Centered Icon -> Name -> Price
  // (On left/right rows: outer Token Zone beside the centered Icon -> Name -> Price stack)
  // =========================================================================
  const isProperty = resolvedDef.kind === 'property' && resolvedDef.groupIndex !== undefined;
  const bandColorVar = isProperty ? `var(--group-${resolvedDef.groupIndex})` : undefined;
  const isLandscape = edge === 'left' || edge === 'right';
  const bandComesFirst = edge === 'bottom' || edge === 'right';

  const colorBandEl = isProperty ? (
    <div className="tv-tile-band" style={{ backgroundColor: bandColorVar }}>
      {propertyState?.hotel ? (
        <div className="tv-hotel-3d" title="Hotel" />
      ) : propertyState && propertyState.houses > 0 ? (
        Array.from({ length: propertyState.houses }).map((_, idx) => (
          <div key={idx} className="tv-house-3d" title={`${propertyState.houses} houses`} />
        ))
      ) : null}
    </div>
  ) : null;

  const priceEl = displayPrice ? (
    <span className="tv-tile-price">
      {currency}
      {displayPrice}
    </span>
  ) : displayTax ? (
    <span className="tv-tile-price" style={{ color: 'var(--accent)' }}>
      {currency}
      {displayTax}
    </span>
  ) : null;

  // Responsive icon medallion variant scales smoothly between 1366x768 and 1920x1080
  const iconVariant = isLandscape ? 'landscape' : 'portrait';

  const cardStackEl = (
    <div className="tv-tile-card-stack" data-edge={edge}>
      <div className="tv-tile-icon-slot">
        <TileIcon
          id={resolvedDef.icon}
          worldId={themeConfig.id}
          kind={resolvedDef.kind}
          groupIndex={resolvedDef.groupIndex}
          variant={iconVariant}
          chamfered={themeConfig.chamfered}
        />
      </div>
      <span
        className="tv-tile-name"
        style={{ fontSize: getFittedNameFontSize(displayName, themeConfig.id, edge) }}
        title={resolvedDef.subtitle || displayName}
      >
        {displayName}
      </span>
      {priceEl}
    </div>
  );

  const tokenZoneEl = <div className="tv-token-zone" data-edge={edge} aria-hidden="true" />;

  const bodyEl = (
    <div className="tv-tile-body" data-edge={edge} data-property={isProperty ? 'true' : 'false'}>
      {edge === 'right' ? (
        <>
          {cardStackEl}
          {tokenZoneEl}
        </>
      ) : (
        <>
          {tokenZoneEl}
          {cardStackEl}
        </>
      )}
    </div>
  );

  const ownerInitial = (owner?.nickname?.[0] || ownerTokenDef?.initial || 'P').toUpperCase();

  return (
    <div
      className="tv-tile-wrapper"
      data-tile-index={tile.id}
      data-edge={edge}
      data-owned={isOwned ? 'true' : 'false'}
      data-owner-id={owner?.id ?? ''}
      data-hover-state={highlightMode}
      data-hover-style={themeConfig.ownership.hoverStyle}
      data-active={isCurrentTurnTile ? 'true' : 'false'}
      data-pressed={isPressed ? 'true' : 'false'}
      data-chamfered={themeConfig.chamfered ? 'true' : 'false'}
      data-neon={themeConfig.neonOutline ? 'true' : 'false'}
      style={
        resolvedOwnerHex
          ? ({
              ['--owner-color' as string]: resolvedOwnerHex,
              ['--owner-ink' as string]: ownerColorSpec?.ink ?? '#FFFFFF',
              ['--owner-glow' as string]: ownerColorSpec?.glow ?? `${resolvedOwnerHex}80`
            } as React.CSSProperties)
          : undefined
      }
    >
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') onClick();
        }}
        data-mortgaged={isMortgaged ? 'true' : 'false'}
        data-owned={isOwned ? 'true' : 'false'}
        className="tv-tile-surface"
      >
        <div className="tv-tile-inner" data-edge={edge}>
          {/* Permanent Inner-Edge Owner Color Strip + Compact Owner Marker (never recolors set band) */}
          {owner && resolvedOwnerHex && (
            <>
              <div
                className="tv-owner-strip"
                style={{ backgroundColor: resolvedOwnerHex }}
                title={`Owned by ${owner.nickname}`}
              />
              {(themeConfig.id === 'valorant' || themeConfig.id === 'wompwomp') && ownerTokenDef?.imageSrc ? (
                <span
                  className="tv-owner-portrait-badge"
                  data-edge={edge}
                  style={{
                    borderColor: resolvedOwnerHex,
                    backgroundColor: themeConfig.id === 'wompwomp' ? '#241838' : '#0F1923'
                  }}
                  title={`Owned by ${owner.nickname} (${ownerTokenDef.name})`}
                >
                  <img
                    src={ownerTokenDef.imageSrc}
                    alt={ownerTokenDef.name}
                    draggable={false}
                    className={
                      themeConfig.id === 'wompwomp'
                        ? 'w-full h-full object-contain p-[0.5px]'
                        : 'w-full h-full object-cover object-[50%_18%]'
                    }
                  />
                </span>
              ) : (
                <span
                  className="tv-owner-badge"
                  data-edge={edge}
                  data-chamfered={themeConfig.chamfered ? 'true' : 'false'}
                  style={{
                    backgroundColor: resolvedOwnerHex,
                    color: ownerColorSpec?.ink ?? '#FFFFFF'
                  }}
                  title={`Owned by ${owner.nickname} (${ownerTokenDef?.name ?? owner.token})`}
                >
                  {ownerInitial}
                </span>
              )}
            </>
          )}

          {bandComesFirst ? (
            <>
              {colorBandEl}
              {bodyEl}
            </>
          ) : (
            <>
              {bodyEl}
              {colorBandEl}
            </>
          )}

          {/* World-styled claim sweep / stamp overlay (zero layout shift) */}
          {claimAnimKey && resolvedOwnerHex && (
            <div
              key={claimAnimKey}
              className={`tv-claim-fx tv-claim-${themeConfig.ownership.claimStyle}`}
              aria-hidden="true"
            />
          )}

          {/* Mortgaged State: Single Diagonal Line + Small "M" Mark */}
          {isMortgaged && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <svg
                viewBox="0 0 100 150"
                preserveAspectRatio="none"
                className="w-full h-full"
                aria-hidden="true"
              >
                <line
                  x1="0"
                  y1="150"
                  x2="100"
                  y2="0"
                  stroke="var(--ink)"
                  strokeWidth="2.5"
                />
              </svg>
              <span
                style={{
                  backgroundColor: 'var(--tile)',
                  color: 'var(--ink)',
                  borderColor: 'var(--ink)'
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-bold border leading-none"
              >
                M
              </span>
            </div>
          )}
        </div>

        {renderEffectBadge(tileEffect, currency)}
        {renderInlineTokens()}
      </div>
    </div>
  );
});

BoardTileComponent.displayName = 'BoardTileComponent';
