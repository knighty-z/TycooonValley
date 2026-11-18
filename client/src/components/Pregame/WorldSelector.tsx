import React from 'react';
import type { WorldThemeId } from '@tycoonvale/shared';
import { WORLD_THEME_LIST, type ThemeConfig } from '../../themes/index.js';
import { Check, Lock } from 'lucide-react';

export interface WorldSelectorProps {
  selectedWorld: WorldThemeId;
  onSelectWorld: (world: WorldThemeId) => void;
  /** When false (e.g. non-host in lobby), renders clearly as read-only host-controlled */
  canEdit?: boolean;
  /** Compact 2x2 grid for lobby right column vs rich 4-card gallery for landing/world modal */
  layout?: 'gallery' | 'compact';
}

const WORLD_DESCRIPTORS: Record<WorldThemeId, { subtitle: string; vibe: string }> = {
  original: {
    subtitle: 'Emerald Felt & Gold',
    vibe: 'Classic heritage estates, brass trim & ivory deeds'
  },
  valorant: {
    subtitle: 'Tactical Protocol',
    vibe: 'Dark steel sites, crimson optics & 3D agent tokens'
  },
  india: {
    subtitle: 'Architectural Heritage',
    vibe: 'Warm sandstone ivory, saffron & 22 Indian cities'
  },
  cyberpunk: {
    subtitle: 'Obsidian Megacity',
    vibe: 'Dark chrome grid, restrained cyan & magenta accents'
  },
  wompwomp: {
    subtitle: 'Plum & Pastel Playland',
    vibe: 'Playful dark plum board, pastel districts & cute 3D mascots'
  }
};

/**
 * Distinct miniature 11x11 board preview rendered strictly from each world's real ThemeConfig
 * (board material, tile surface, 8 real group colors, corners, and world-specific center motif).
 */
const MiniWorldBoardPreview: React.FC<{ world: ThemeConfig; compact?: boolean }> = ({
  world,
  compact = false
}) => {
  const g = world.groupColors;
  const isChamfered = world.chamfered;

  return (
    <div
      style={{
        backgroundColor: world.palette.board,
        borderColor: world.palette.tileBorder,
        borderRadius: isChamfered ? '0px' : '4px',
        clipPath: isChamfered
          ? 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
          : undefined
      }}
      className={`relative border overflow-hidden shrink-0 ${compact ? 'w-12 h-12 p-1' : 'w-full h-20 p-1.5'}`}
      aria-hidden="true"
    >
      {/* Top Edge Strip */}
      <div className="absolute top-1 left-1 right-1 h-2 flex gap-[1px]">
        <span style={{ backgroundColor: world.palette.accent }} className="w-2.5 h-full opacity-85" />
        <span style={{ backgroundColor: g[4] }} className="flex-1 h-full" />
        <span style={{ backgroundColor: g[5] }} className="flex-1 h-full" />
        <span style={{ backgroundColor: world.palette.accent2 }} className="w-2.5 h-full opacity-85" />
      </div>
      {/* Bottom Edge Strip */}
      <div className="absolute bottom-1 left-1 right-1 h-2 flex gap-[1px]">
        <span style={{ backgroundColor: world.palette.tileBorder }} className="w-2.5 h-full opacity-85" />
        <span style={{ backgroundColor: g[1] }} className="flex-1 h-full" />
        <span style={{ backgroundColor: g[0] }} className="flex-1 h-full" />
        <span style={{ backgroundColor: world.palette.accent }} className="w-2.5 h-full" />
      </div>
      {/* Left Edge Strip */}
      <div className="absolute top-3.5 bottom-3.5 left-1 w-2 flex flex-col gap-[1px]">
        <span style={{ backgroundColor: g[3] }} className="flex-1 w-full" />
        <span style={{ backgroundColor: g[2] }} className="flex-1 w-full" />
      </div>
      {/* Right Edge Strip */}
      <div className="absolute top-3.5 bottom-3.5 right-1 w-2 flex flex-col gap-[1px]">
        <span style={{ backgroundColor: g[6] }} className="flex-1 w-full" />
        <span style={{ backgroundColor: g[7] }} className="flex-1 w-full" />
      </div>

      {/* World-specific interior material & center emblem */}
      <div
        style={{
          backgroundColor: world.palette.bg,
          borderColor: `color-mix(in srgb, ${world.palette.tileBorder} 50%, transparent)`
        }}
        className="absolute inset-[13px] border flex items-center justify-center overflow-hidden"
      >
        {world.id === 'valorant' && (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 46%, #FF4655 48%, #FF4655 52%, transparent 54%)'
            }}
          />
        )}
        {world.id === 'cyberpunk' && (
          <div
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(25,240,255,0.45) 0 1px, transparent 1px 4px)'
            }}
          />
        )}
        {world.id === 'india' && (
          <div
            className="w-3.5 h-3.5 rotate-45 border"
            style={{
              borderColor: world.palette.accent,
              backgroundColor: 'rgba(242, 154, 46, 0.22)'
            }}
          />
        )}
        {world.id === 'original' && (
          <div
            className="w-4 h-4 rounded-full border"
            style={{
              borderColor: world.palette.accent,
              backgroundColor: 'rgba(201, 162, 75, 0.2)'
            }}
          />
        )}
        {world.id === 'wompwomp' && (
          <div className="relative z-10 flex items-center justify-center gap-1">
            <img
              src="/tokens/wompwomp/peach.png"
              alt=""
              draggable={false}
              className={compact ? 'w-5 h-5 object-contain' : 'w-7 h-7 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'}
            />
            {!compact && (
              <span
                style={{ fontFamily: world.fonts.heading, color: world.palette.boardInk }}
                className="text-[9.5px] font-bold tracking-wide"
              >
                Womp!
              </span>
            )}
          </div>
        )}
        {!compact && world.id !== 'wompwomp' && (
          <span
            style={{
              fontFamily: world.fonts.heading,
              color: world.palette.boardInk,
              textTransform: world.fonts.headingUppercase ? 'uppercase' : 'none'
            }}
            className="relative z-10 text-[10px] font-bold tracking-[0.18em] opacity-90"
          >
            {world.currencySymbol} {world.name}
          </span>
        )}
      </div>
    </div>
  );
};

export const WorldSelector: React.FC<WorldSelectorProps> = React.memo(
  ({ selectedWorld, onSelectWorld, canEdit = true, layout = 'gallery' }) => {
    const isCompact = layout === 'compact';

    return (
      <div className="space-y-2" data-testid="world-selector">
        <div className="flex items-center justify-between gap-2">
          <span
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
          >
            Game World
          </span>
          {!canEdit ? (
            <span className="inline-flex items-center gap-1 text-[10px] opacity-70">
              <Lock className="w-3 h-3" />
              <span>Host Controlled</span>
            </span>
          ) : (
            <span className="text-[10px] opacity-65">5 Distinct Environments</span>
          )}
        </div>

        <div className={isCompact ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2'}>
          {WORLD_THEME_LIST.map((world, idx) => {
            const isSelected = world.id === selectedWorld;
            const meta = WORLD_DESCRIPTORS[world.id];
            const spanFullCompact = isCompact && WORLD_THEME_LIST.length % 2 === 1 && idx === WORLD_THEME_LIST.length - 1;
            const paletteStrip = [
              world.palette.board,
              world.palette.tile,
              world.palette.accent,
              world.palette.accent2,
              world.groupColors[0]
            ];

            return (
              <button
                key={world.id}
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && onSelectWorld(world.id)}
                data-testid={`world-card-${world.id}`}
                data-selected={isSelected ? 'true' : 'false'}
                style={{
                  backgroundColor: isSelected
                    ? `color-mix(in srgb, ${world.palette.accent} 16%, ${world.palette.board})`
                    : world.palette.board,
                  borderColor: isSelected ? world.palette.accent : world.palette.tileBorder,
                  color: world.palette.boardInk,
                  borderRadius: world.chamfered ? '0px' : world.id === 'wompwomp' ? '10px' : '4px',
                  clipPath: world.chamfered
                    ? 'polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px))'
                    : undefined,
                  boxShadow: isSelected
                    ? `inset 0 0 0 1px ${world.palette.accent}, 0 6px 18px rgba(0,0,0,0.38)`
                    : '0 4px 12px rgba(0,0,0,0.22)'
                }}
                className={`tv-world-card-sweep tv-hud-focus relative overflow-hidden border text-left transition-all ${
                  isCompact ? 'p-2 flex items-center gap-2' : 'p-2 flex flex-col gap-1.5'
                } ${spanFullCompact ? 'col-span-2' : ''} ${!canEdit ? 'cursor-default opacity-90' : 'cursor-pointer hover:-translate-y-0.5'}`}
              >
                <MiniWorldBoardPreview world={world} compact={isCompact} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      style={{
                        fontFamily: world.fonts.heading,
                        textTransform: world.fonts.headingUppercase ? 'uppercase' : 'none'
                      }}
                      className={`font-bold leading-tight truncate ${isCompact ? 'text-[11px]' : 'text-xs'}`}
                    >
                      {world.name}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          backgroundColor: world.palette.accent,
                          color: world.id === 'valorant' ? '#FFFFFF' : '#0B1218'
                        }}
                        className="w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0"
                        aria-label="Selected world"
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {!isCompact && (
                    <p className="text-[10px] leading-snug opacity-75 line-clamp-2 mt-0.5">
                      {meta.vibe}
                    </p>
                  )}

                  {/* Curated 5-swatch palette strip */}
                  <div className="flex items-center gap-1 mt-1.5" aria-hidden="true">
                    {paletteStrip.map((swatch, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: swatch,
                          borderColor: 'rgba(255,255,255,0.22)'
                        }}
                        className={`border ${isCompact ? 'h-1.5 flex-1' : 'h-1.5 w-4'} rounded-[1px]`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

WorldSelector.displayName = 'WorldSelector';
