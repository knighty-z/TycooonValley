import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame, type ActiveMoveEvent, type ActiveTileEffect } from '../../context/GameContext.js';
import { BOARD_TILES, type GameState, type WorldThemeId } from '@tycoonvale/shared';
import {
  getThemeConfig,
  getThemeCssVars,
  getTileGridCell,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type GraphicsQuality
} from '../../themes/index.js';
import { BoardTileComponent } from './BoardTile.js';
import { CenterArea, type CenterAreaOverride } from './CenterArea.js';
import { TokenLayer } from './TokenLayer.js';

export function computeCircularTilePath(fromPosition: number, toPosition: number): number[] {
  if (fromPosition === toPosition) return [];
  const path: number[] = [];
  let curr = fromPosition;
  while (curr !== toPosition) {
    curr = (curr + 1) % 40;
    path.push(curr);
    if (path.length >= 40) break;
  }
  return path;
}

export interface GameBoardProps {
  /** Renders an empty or demo board in the given world theme (used for visual previews). */
  previewTheme?: WorldThemeId;
  /** Optional interactive demo GameState (uses exact same BoardTile, TokenLayer & CenterArea). */
  demoGameState?: GameState;
  demoMoveEvent?: ActiveMoveEvent | null;
  demoTileEffect?: ActiveTileEffect | null;
  centerOverride?: CenterAreaOverride;
  /** Currently hovered or pinned player ID from PlayerPanel for Richup-style board highlight */
  highlightedPlayerId?: string | null;
  /** Optional tile click handler override */
  onTileClick?: (tileId: number) => void;
  /** Graphics preset: 'high' enables 2.5D tilt, slab depth, shadows & subtle light parallax. */
  graphicsQuality?: GraphicsQuality;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  previewTheme,
  demoGameState,
  demoMoveEvent,
  demoTileEffect,
  centerOverride,
  highlightedPlayerId = null,
  onTileClick,
  graphicsQuality = 'high'
}) => {
  const ctx = useGame();
  const gameState = demoGameState ?? ctx.gameState;
  const activeMoveEvent = demoGameState ? demoMoveEvent ?? null : ctx.activeMoveEvent;
  const activeTileEffect = demoGameState ? demoTileEffect ?? null : ctx.activeTileEffect;

  const [pressedTileId, setPressedTileId] = useState<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
    };
  }, []);

  // Subtle mouse-driven lighting parallax (max 6px shift on desktop High Graphics)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (graphicsQuality !== 'high' || !stageRef.current || !planeRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      planeRef.current.style.setProperty('--light-x', `${(nx * 12).toFixed(1)}px`);
      planeRef.current.style.setProperty('--light-y', `${(ny * 12).toFixed(1)}px`);
    },
    [graphicsQuality]
  );

  const handleMouseLeave = useCallback(() => {
    if (!planeRef.current) return;
    planeRef.current.style.setProperty('--light-x', '0px');
    planeRef.current.style.setProperty('--light-y', '0px');
  }, []);

  const handleStepTile = useCallback((tileId: number, isFinal: boolean) => {
    if (!isFinal) return;
    setPressedTileId(tileId);
    if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = window.setTimeout(() => {
      setPressedTileId(null);
      pressTimerRef.current = null;
    }, 170);
  }, []);

  if (!gameState && !previewTheme) return null;

  const isEmptyPreview = Boolean(previewTheme && !demoGameState);
  const themeConfig = getThemeConfig(previewTheme ?? gameState?.settings.theme);
  const cssVars = getThemeCssVars(themeConfig);

  const players = gameState?.players ?? [];
  const colorMap = useMemo(() => resolveUniquePlayerColors(players), [players]);
  const tokenMap = useMemo(
    () => resolveWorldTokensForPlayers(players, themeConfig.tokens),
    [players, themeConfig.tokens]
  );

  const activePlayer = gameState
    ? gameState.players.find(p => p.id === gameState.turn.activePlayerId)
    : undefined;
  const activePlayerPos = activePlayer ? activePlayer.position : -1;

  return (
    <div
      className="tv-board-viewport"
      data-theme={themeConfig.id}
      data-graphics={graphicsQuality}
      style={cssVars}
    >
      <div
        ref={stageRef}
        className="tv-board-stage"
        data-fullsize={isEmptyPreview ? 'true' : 'false'}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={planeRef} className="tv-board-plane">
          {/* Subtle tiling surface grain (felt / paper / tactical / obsidian) */}
          <div className="tv-board-texture" aria-hidden="true" />
          {/* Top-left directional light + edge vignette */}
          <div className="tv-board-lighting" aria-hidden="true" />

          {/* Exact 11x11 CSS Grid (1.5fr corners, 9 x 1fr side tiles) */}
          <div className="tv-board-grid">
            {BOARD_TILES.map(tile => {
              const cell = getTileGridCell(tile.id);
              const tileDef = themeConfig.tiles[tile.id];
              const propertyState = gameState ? gameState.properties[tile.id] : undefined;
              const owner =
                gameState && propertyState?.ownerId
                  ? gameState.players.find(p => p.id === propertyState.ownerId)
                  : undefined;
              const ownerColor = owner ? colorMap[owner.id]?.hex ?? owner.color : undefined;
              const ownerTokenDef = owner ? tokenMap[owner.id] : undefined;

              const highlightMode: 'none' | 'highlighted' | 'dimmed' = highlightedPlayerId
                ? owner?.id === highlightedPlayerId
                  ? 'highlighted'
                  : 'dimmed'
                : 'none';

              const isCurrentTurnTile = !isEmptyPreview && activePlayerPos === tile.id;

              return (
                <div
                  key={tile.id}
                  style={{
                    gridRow: cell.row,
                    gridColumn: cell.col
                  }}
                  className="w-full h-full min-w-0 min-h-0"
                >
                  <BoardTileComponent
                    tile={tile}
                    tileDef={tileDef}
                    propertyState={propertyState}
                    playersOnTile={[]}
                    owner={owner}
                    ownerColor={ownerColor}
                    ownerTokenDef={ownerTokenDef}
                    highlightMode={highlightMode}
                    useTokenLayer={true}
                    isCurrentTurnTile={isCurrentTurnTile}
                    isPressed={pressedTileId === tile.id}
                    tileEffect={
                      activeTileEffect?.tileId === tile.id ? activeTileEffect : null
                    }
                    jackpotPool={
                      gameState?.settings.freeParkingJackpot ? gameState.jackpotPool : 0
                    }
                    passGoReward={gameState?.settings.passGoReward ?? 200}
                    edge={cell.edge}
                    theme={themeConfig}
                    onClick={() => {
                      if (onTileClick) {
                        onTileClick(tile.id);
                      } else if (!isEmptyPreview) {
                        ctx.setSelectedTile(tile);
                      }
                    }}
                  />
                </div>
              );
            })}

            {/* Center 9x9 Area */}
            <div className="tv-board-center">
              {/* Theme-specific subtle ambient layer (disabled on Low Graphics / reduced motion) */}
              {graphicsQuality === 'high' && (
                <div className="tv-board-ambient" data-world={themeConfig.id} aria-hidden="true" />
              )}

              {isEmptyPreview ? (
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-3 px-6">
                  <div
                    style={{
                      color: 'var(--accent)',
                      borderColor: 'var(--tile-border)',
                      borderRadius: 'var(--radius-tile)'
                    }}
                    className="px-4 py-1 border text-[11px] font-semibold uppercase tracking-[0.22em]"
                  >
                    {themeConfig.name}
                  </div>
                  <h1
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--board-ink)',
                      textTransform: themeConfig.fonts.headingUppercase
                        ? 'uppercase'
                        : 'none'
                    }}
                    className="text-3xl sm:text-4xl font-bold tracking-[0.14em]"
                  >
                    TYCOONVALE
                  </h1>
                  <div
                    style={{ backgroundColor: 'var(--accent)' }}
                    className="w-16 h-[2px]"
                  />
                  <p
                    style={{ color: 'var(--board-ink)', opacity: 0.78 }}
                    className="text-xs sm:text-sm max-w-xs tracking-wide"
                  >
                    {themeConfig.tagline}
                  </p>
                  <div
                    style={{ color: 'var(--accent)', opacity: 0.9 }}
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] mt-1"
                  >
                    {themeConfig.currencySymbol} {themeConfig.currencyName} &middot; {themeConfig.eventDeckNames.chance} &amp; {themeConfig.eventDeckNames.chest}
                  </div>
                </div>
              ) : (
                <CenterArea override={centerOverride} />
              )}
            </div>

            {/* Smooth 60fps Cross-Tile Token Layer */}
            {gameState && players.length > 0 && (
              <TokenLayer
                players={players}
                activePlayerId={gameState.turn.activePlayerId}
                highlightedPlayerId={highlightedPlayerId}
                activeMoveEvent={activeMoveEvent}
                themeConfig={themeConfig}
                graphicsQuality={graphicsQuality}
                onStepTile={handleStepTile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
