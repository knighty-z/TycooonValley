import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Player } from '@tycoonvale/shared';
import type { ActiveMoveEvent } from '../../context/GameContext.js';
import {
  getTokenZonePoint,
  buildMovePlan,
  easeInOutCubic,
  easeOutQuart,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig,
  type GraphicsQuality
} from '../../themes/index.js';
import { WorldTokenIcon, preloadWorldTokenImages } from '../Icons/WorldTokens.js';
import { soundEngine } from '../../services/audio.js';

export interface TokenLayerProps {
  players: Player[];
  activePlayerId?: string;
  highlightedPlayerId?: string | null;
  activeMoveEvent?: ActiveMoveEvent | null;
  themeConfig: ThemeConfig;
  graphicsQuality: GraphicsQuality;
  onStepTile?: (tileId: number, isFinal: boolean) => void;
  onMovementComplete?: (playerId: string, finalPos: number) => void;
}

interface LandingFxState {
  playerId: string;
  xPercent: number;
  yPercent: number;
  color: string;
  key: number;
}

/**
 * Computes static seated coordinates strictly inside each tile's dedicated Token Zone.
 * Multiple tokens on one tile line up neatly side-by-side without covering names, icons, or prices.
 */
function computeSeatedCoords(
  players: Player[],
  movingPlayerId: string | null
): Record<string, { xPercent: number; yPercent: number; totalOnTile: number; edge: string }> {
  const byTile = new Map<number, Player[]>();
  for (const p of players) {
    if (p.isBankrupt) continue;
    const list = byTile.get(p.position) ?? [];
    list.push(p);
    byTile.set(p.position, list);
  }

  const coords: Record<string, { xPercent: number; yPercent: number; totalOnTile: number; edge: string }> = {};

  for (const [tileIdx, group] of byTile.entries()) {
    const total = group.length;
    group.forEach((p, slotIdx) => {
      const pt = getTokenZonePoint(tileIdx, slotIdx, total);
      coords[p.id] = {
        xPercent: pt.xPercent,
        yPercent: pt.yPercent,
        totalOnTile: movingPlayerId === p.id ? 1 : total,
        edge: pt.edge
      };
    });
  }

  return coords;
}

export const TokenLayer: React.FC<TokenLayerProps> = React.memo(
  ({
    players,
    activePlayerId,
    highlightedPlayerId,
    activeMoveEvent,
    themeConfig,
    graphicsQuality,
    onStepTile,
    onMovementComplete
  }) => {
    const activePlayers = useMemo(() => players.filter(p => !p.isBankrupt), [players]);
    const colorMap = useMemo(() => resolveUniquePlayerColors(activePlayers), [activePlayers]);
    const tokenMap = useMemo(
      () => resolveWorldTokensForPlayers(activePlayers, themeConfig.tokens),
      [activePlayers, themeConfig.tokens]
    );

    const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
    const [landingFx, setLandingFx] = useState<LandingFxState | null>(null);
    const [boardPx, setBoardPx] = useState<number>(685);

    const layerRef = useRef<HTMLDivElement | null>(null);
    const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const bodyRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const shadowRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const trailRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const rafRef = useRef<number | null>(null);
    const landingTimerRef = useRef<number | null>(null);

    // Measure live board size so tokens scale proportionally with tiles on any screen
    useEffect(() => {
      const el = layerRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const updateSize = () => {
        const w = el.clientWidth;
        if (w > 120) setBoardPx(w);
      };
      updateSize();
      const ro = new ResizeObserver(updateSize);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // Preload any raster sprites (VALORANT agents) as soon as the world activates
    useEffect(() => {
      preloadWorldTokenImages(themeConfig.tokens);
    }, [themeConfig.tokens]);

    const seatedCoords = useMemo(
      () => computeSeatedCoords(activePlayers, movingPlayerId),
      [activePlayers, movingPlayerId]
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        if (landingTimerRef.current !== null) window.clearTimeout(landingTimerRef.current);
      };
    }, []);

    // 60fps requestAnimationFrame tile-by-tile / direct-slide movement settling into each tile's Token Zone
    useEffect(() => {
      if (!activeMoveEvent) return;

      const { playerId, fromPosition, toPosition, dice } = activeMoveEvent;
      const moveStyle = themeConfig.movement;
      const plan = buildMovePlan(fromPosition, toPosition, dice, moveStyle);

      if (plan.steps.length === 0) return;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      setMovingPlayerId(playerId);

      // Every waypoint targets the exact Token Zone of each traversed tile
      const waypoints = [plan.fromPosition, ...plan.steps].map(idx => getTokenZonePoint(idx, 0, 1));
      const segmentCount = waypoints.length - 1;
      const startTime = performance.now();
      let lastCompletedSegment = -1;
      let prevTrailX = waypoints[0].xPercent;
      let prevTrailY = waypoints[0].yPercent;

      const animate = (now: number) => {
        const elapsed = Math.max(0, now - startTime);
        const anchorEl = anchorRefs.current[playerId];
        const bodyEl = bodyRefs.current[playerId];
        const shadowEl = shadowRefs.current[playerId];
        const trailEl = trailRefs.current[playerId];

        const segFloat = plan.stepDurationMs > 0 ? elapsed / plan.stepDurationMs : segmentCount;
        const segIdx = Math.max(0, Math.min(segmentCount - 1, Math.floor(segFloat)));
        const rawT = Math.min(1, Math.max(0, segFloat - segIdx));

        if (segIdx > lastCompletedSegment) {
          lastCompletedSegment = segIdx;
          const stepTileId = plan.steps[segIdx];
          if (plan.kind === 'step_by_step') {
            soundEngine.playTokenStep();
            if (stepTileId === 0) soundEngine.playCoin();
          }
          onStepTile?.(stepTileId, false);
        }

        const fromWp = waypoints[segIdx];
        const toWp = waypoints[Math.min(waypoints.length - 1, segIdx + 1)];
        const easedT =
          moveStyle.id === 'tactical' || plan.kind === 'direct_slide'
            ? easeOutQuart(rawT)
            : easeInOutCubic(rawT);

        const currX = fromWp.xPercent + (toWp.xPercent - fromWp.xPercent) * easedT;
        const currY = fromWp.yPercent + (toWp.yPercent - fromWp.yPercent) * easedT;

        // Parabolic vertical hop arc (may rise briefly over the tile, then settles into Token Zone)
        const hopMultiplier = plan.kind === 'direct_slide' ? 1.45 : 1;
        const arc = 4 * rawT * (1 - rawT);
        const liftPx = arc * moveStyle.hopHeightPx * hopMultiplier;

        let sx = 1;
        let sy = 1;
        if (rawT < 0.18) {
          const k = rawT / 0.18;
          sx = 1 + (moveStyle.squashStretch.takeoff[0] - 1) * Math.sin(k * Math.PI);
          sy = 1 + (moveStyle.squashStretch.takeoff[1] - 1) * Math.sin(k * Math.PI);
        } else if (rawT > 0.82) {
          const k = (rawT - 0.82) / 0.18;
          sx = 1 + (moveStyle.squashStretch.land[0] - 1) * Math.sin(k * Math.PI);
          sy = 1 + (moveStyle.squashStretch.land[1] - 1) * Math.sin(k * Math.PI);
        } else {
          sx = 1 + (moveStyle.squashStretch.apex[0] - 1) * arc;
          sy = 1 + (moveStyle.squashStretch.apex[1] - 1) * arc;
        }

        if (anchorEl) {
          anchorEl.style.left = `${currX}%`;
          anchorEl.style.top = `${currY}%`;
        }
        if (bodyEl) {
          bodyEl.style.transform = `translate3d(0, ${(-liftPx).toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
        }
        if (shadowEl) {
          const shScale = Math.max(0.45, 1 - 0.42 * arc);
          const shOpacity = Math.max(0.22, 0.56 - 0.28 * arc);
          shadowEl.style.transform = `translateX(-50%) scale(${shScale.toFixed(3)})`;
          shadowEl.style.opacity = shOpacity.toFixed(2);
        }
        if (trailEl && moveStyle.trailStyle === 'neon') {
          trailEl.style.opacity = '0.48';
          trailEl.style.left = `${prevTrailX}%`;
          trailEl.style.top = `${prevTrailY}%`;
          prevTrailX += (currX - prevTrailX) * 0.35;
          prevTrailY += (currY - prevTrailY) * 0.35;
        }

        if (elapsed < plan.totalDurationMs) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          rafRef.current = null;
          if (bodyEl) bodyEl.style.transform = 'translate3d(0, 0, 0) scale(1, 1)';
          if (shadowEl) {
            shadowEl.style.transform = 'translateX(-50%) scale(1)';
            shadowEl.style.opacity = '0.56';
          }
          if (trailEl) trailEl.style.opacity = '0';

          const finalCenter = waypoints[waypoints.length - 1];
          const playerColor = colorMap[playerId]?.hex ?? moveStyle.accentColor;

          onStepTile?.(plan.toPosition, true);
          setLandingFx({
            playerId,
            xPercent: finalCenter.xPercent,
            yPercent: finalCenter.yPercent,
            color: playerColor,
            key: Date.now()
          });
          if (landingTimerRef.current !== null) window.clearTimeout(landingTimerRef.current);
          landingTimerRef.current = window.setTimeout(() => {
            setLandingFx(null);
          }, 420);

          setMovingPlayerId(null);
          onMovementComplete?.(playerId, plan.toPosition);
        }
      };

      rafRef.current = requestAnimationFrame(animate);

      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, [activeMoveEvent?.timestamp]);

    if (activePlayers.length === 0) return null;

    const isSpriteWorld = themeConfig.tokens.some(t => Boolean(t.imageSrc));
    // Collectible figurine scale: VALORANT 3D agent PNGs render ~48px at 768p / ~68px at 1080p;
    // sculpted world tokens render ~36px at 768p / ~52px at 1080p.
    const baseSinglePx = Math.max(26, Math.round(boardPx * (isSpriteWorld ? 0.068 : 0.052)));

    return (
      <div
        ref={layerRef}
        className="tv-token-layer"
        data-world={themeConfig.id}
        data-graphics={graphicsQuality}
        aria-label="Board Tokens"
      >
        {/* Subtle world-specific landing burst anchored inside the Token Zone */}
        {landingFx && (
          <div
            key={landingFx.key}
            className={`tv-landing-fx tv-landing-${themeConfig.movement.landingEffect}`}
            style={{
              left: `${landingFx.xPercent}%`,
              top: `${landingFx.yPercent}%`,
              ['--fx-color' as string]: themeConfig.movement.accentColor,
              ['--player-color' as string]: landingFx.color
            }}
            aria-hidden="true"
          />
        )}

        {/* Cyberpunk subtle neon motion trail ghost */}
        {themeConfig.movement.trailStyle === 'neon' &&
          activePlayers.map(p => (
            <div
              key={`trail-${p.id}`}
              ref={el => {
                trailRefs.current[p.id] = el;
              }}
              className="tv-token-neon-trail"
              style={{
                opacity: 0,
                backgroundColor: colorMap[p.id]?.hex ?? '#19F0FF'
              }}
              aria-hidden="true"
            />
          ))}

        {/* Standing Tokens — strictly inside each tile's dedicated Token Zone */}
        {activePlayers.map(p => {
          const coord = seatedCoords[p.id] ?? {
            xPercent: 92.44,
            yPercent: 90.4,
            totalOnTile: 1,
            edge: 'corner'
          };
          const playerColor = colorMap[p.id]?.hex ?? p.color;
          const tokenDef = tokenMap[p.id];
          const isTurn = activePlayerId === p.id;
          const isHovered = highlightedPlayerId === p.id;
          const isMoving = movingPlayerId === p.id;

          // Gentle formation scaling when multiple tokens share a tile — never crush into tiny dots
          const stackScale =
            coord.totalOnTile >= 4
              ? 0.74
              : coord.totalOnTile === 3
              ? 0.82
              : coord.totalOnTile === 2
              ? 0.88
              : 1;
          const tokenPx = Math.max(22, Math.round(baseSinglePx * stackScale));
          // Painter's-algorithm depth layering: lower feet (higher yPercent) render cleanly in front
          const depthZ = Math.round(coord.yPercent * 2);

          return (
            <div
              key={p.id}
              ref={el => {
                anchorRefs.current[p.id] = el;
              }}
              data-testid={`board-token-${p.id}`}
              data-token-id={tokenDef?.id ?? p.token}
              data-player-position={p.position}
              data-active-turn={isTurn ? 'true' : 'false'}
              data-hovered-player={isHovered ? 'true' : 'false'}
              data-moving={isMoving ? 'true' : 'false'}
              className="tv-token-anchor"
              style={{
                left: `${coord.xPercent}%`,
                top: `${coord.yPercent}%`,
                zIndex: isMoving ? 400 : isHovered ? 350 : 40 + depthZ
              }}
            >
              {/* Soft elliptical contact shadow on the board plane */}
              <div
                ref={el => {
                  shadowRefs.current[p.id] = el;
                }}
                className="tv-token-shadow"
                style={{
                  width: Math.round(tokenPx * (isSpriteWorld ? 0.64 : 0.78)),
                  height: Math.round(tokenPx * 0.2)
                }}
                aria-hidden="true"
              />

              {/* Subtle thin active-turn / hover base ring (never a loud halo) */}
              {(isTurn || isHovered) && (
                <div
                  className={`tv-token-ring ${isHovered ? 'tv-token-ring-hover' : 'tv-token-ring-turn'}`}
                  style={{
                    width: Math.round(tokenPx * (isSpriteWorld ? 0.78 : 0.94)),
                    height: Math.round(tokenPx * 0.26),
                    borderColor: playerColor,
                    boxShadow: `0 0 8px ${playerColor}88`
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Upright billboard counter-tilt wrapper */}
              <div className="tv-token-billboard" data-sprite={isSpriteWorld ? 'true' : 'false'}>
                <div
                  ref={el => {
                    bodyRefs.current[p.id] = el;
                  }}
                  className={`tv-token-body ${isHovered ? 'tv-token-body-pulse' : ''}`}
                >
                  <WorldTokenIcon
                    tokenId={tokenDef?.id ?? p.token}
                    tokenDef={tokenDef}
                    worldId={themeConfig.id}
                    color={playerColor}
                    size={tokenPx}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

TokenLayer.displayName = 'TokenLayer';
