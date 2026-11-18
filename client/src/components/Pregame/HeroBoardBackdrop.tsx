import React, { useEffect, useState, useMemo } from 'react';
import type { ThemeConfig } from '../../themes/types.js';
import { getTileGridCell, getTileCenter } from '../../themes/boardGeometry.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import { ACCESSIBLE_PLAYER_COLORS } from '../../themes/playerColors.js';

interface HeroBoardBackdropProps {
  themeConfig: ThemeConfig;
}

const DEMO_START_INDICES = [0, 10, 20, 30];

/**
 * Lightweight 2.5D tabletop board backdrop for the Landing Page.
 * Uses the active world's real 40-tile group palette and world tokens,
 * automatically pauses when the browser tab is hidden, and respects prefers-reduced-motion.
 */
export const HeroBoardBackdrop: React.FC<HeroBoardBackdropProps> = React.memo(({ themeConfig }) => {
  const [stepOffset, setStepOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const computePaused = () =>
      Boolean(document.hidden || (motionQuery && motionQuery.matches));

    setIsPaused(computePaused());

    const handleChange = () => setIsPaused(computePaused());
    document.addEventListener('visibilitychange', handleChange);
    motionQuery?.addEventListener?.('change', handleChange);

    return () => {
      document.removeEventListener('visibilitychange', handleChange);
      motionQuery?.removeEventListener?.('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setStepOffset(prev => (prev + 1) % 40);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const animatedTokens = useMemo(() => {
    return DEMO_START_INDICES.map((baseIdx, i) => {
      const tileIdx = (baseIdx + stepOffset) % 40;
      const center = getTileCenter(tileIdx);
      const tokenDef = themeConfig.tokens[i % themeConfig.tokens.length];
      const color = ACCESSIBLE_PLAYER_COLORS[i % ACCESSIBLE_PLAYER_COLORS.length].hex;
      return { tileIdx, center, tokenDef, color, id: `hero-tok-${i}` };
    });
  }, [stepOffset, themeConfig.tokens]);

  return (
    <div
      className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Tilted 2.5D Architectural Board Preview anchored in upper-right/center backdrop */}
      <div className="tv-hero-board-perspective absolute -right-24 -bottom-28 sm:-right-14 sm:-bottom-20 lg:right-[-4%] lg:top-[8%] w-[560px] h-[560px] xl:w-[680px] xl:h-[680px] opacity-[0.34]">
        <div
          className="tv-hero-board-slab relative w-full h-full p-2.5 border-2"
          style={{
            backgroundColor: 'var(--board)',
            borderColor: 'var(--tile-border)',
            borderRadius: 'var(--radius-tile)'
          }}
        >
          <div
            className="grid w-full h-full gap-[2px]"
            style={{
              gridTemplateColumns: '1.48fr repeat(9, 1fr) 1.48fr',
              gridTemplateRows: '1.48fr repeat(9, 1fr) 1.48fr'
            }}
          >
            {/* Center tabletop field */}
            <div
              style={{
                gridColumn: '2 / 11',
                gridRow: '2 / 11',
                backgroundColor: 'var(--bg)',
                borderColor: 'color-mix(in srgb, var(--tile-border) 55%, transparent)'
              }}
              className="border flex flex-col items-center justify-center relative"
            >
              {themeConfig.id === 'wompwomp' && (
                <img
                  src="/tokens/wompwomp/peach.png"
                  alt=""
                  draggable={false}
                  className="w-16 h-16 object-contain opacity-65 mb-2 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
                />
              )}
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--accent)',
                  textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-2xl font-black tracking-[0.26em] opacity-40"
              >
                {themeConfig.id === 'wompwomp' ? 'WorldWompWomp' : 'TYCOONVALE'}
              </span>
              <span className="text-[10px] uppercase tracking-[0.24em] opacity-30 mt-1">
                {themeConfig.id === 'wompwomp' ? 'TycoonVale Edition' : themeConfig.name}
              </span>
            </div>

            {/* Perimeter 40 tiles rendered with actual world group bands */}
            {themeConfig.tiles.map(tile => {
              const cell = getTileGridCell(tile.index);
              const isCorner = cell.edge === 'corner';
              const bandColor =
                tile.groupIndex !== undefined ? themeConfig.groupColors[tile.groupIndex] : undefined;

              return (
                <div
                  key={tile.index}
                  style={{
                    gridRow: cell.row,
                    gridColumn: cell.col,
                    backgroundColor: 'var(--tile)',
                    borderColor: 'color-mix(in srgb, var(--tile-border) 65%, transparent)',
                    borderRadius: themeConfig.chamfered ? '0px' : '2px'
                  }}
                  className="relative border overflow-hidden"
                >
                  {bandColor && (
                    <div
                      style={{ backgroundColor: bandColor }}
                      className={
                        cell.edge === 'bottom'
                          ? 'absolute inset-x-0 top-0 h-[24%]'
                          : cell.edge === 'top'
                          ? 'absolute inset-x-0 bottom-0 h-[24%]'
                          : cell.edge === 'left'
                          ? 'absolute inset-y-0 right-0 w-[24%]'
                          : 'absolute inset-y-0 left-0 w-[24%]'
                      }
                    />
                  )}
                  {isCorner && (
                    <div
                      style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 26%, transparent)' }}
                      className="absolute inset-1.5 rounded-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Smoothly orbiting world tokens */}
          <div className="absolute inset-2.5">
            {animatedTokens.map(tok => (
              <div
                key={tok.id}
                style={{
                  left: `${tok.center.xPercent}%`,
                  top: `${tok.center.yPercent}%`,
                  transform: 'translate(-50%, -62%)',
                  transition: isPaused ? 'none' : 'left 900ms cubic-bezier(0.22,1,0.36,1), top 900ms cubic-bezier(0.22,1,0.36,1)'
                }}
                className="absolute z-10"
              >
                <WorldTokenIcon
                  tokenId={tok.tokenDef.id}
                  tokenDef={tok.tokenDef}
                  worldId={themeConfig.id}
                  color={tok.color}
                  size={tok.tokenDef.imageSrc ? 36 : 26}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Soft directional vignette so foreground typography stays razor-crisp */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 75% at 28% 45%, color-mix(in srgb, var(--bg) 78%, transparent) 0%, color-mix(in srgb, var(--bg) 35%, transparent) 58%, color-mix(in srgb, var(--bg) 88%, #000000) 100%)'
        }}
      />
    </div>
  );
});

HeroBoardBackdrop.displayName = 'HeroBoardBackdrop';
