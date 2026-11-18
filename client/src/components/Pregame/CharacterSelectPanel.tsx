import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@tycoonvale/shared';
import type { ThemeConfig, TokenDef } from '../../themes/types.js';
import { ACCESSIBLE_PLAYER_COLORS } from '../../themes/playerColors.js';
import { WorldTokenIcon, preloadWorldTokenImages } from '../Icons/WorldTokens.js';
import { Check, Lock, ShieldCheck, Sparkles } from 'lucide-react';

const SafeAgentSprite: React.FC<{
  token: TokenDef;
  className: string;
  fallbackColor: string;
  sizeClass?: string;
}> = ({ token, className, fallbackColor, sizeClass = 'w-16 h-16' }) => {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [token.imageSrc]);

  if (!token.imageSrc || broken) {
    const initial = (token.initial || token.name[0] || '?').toUpperCase();
    return (
      <div
        className={`${sizeClass} inline-flex items-center justify-center font-bold border-2 select-none`}
        style={{
          backgroundColor: '#16232F',
          color: '#ECE8E1',
          borderColor: fallbackColor
        }}
        aria-label={token.name}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={token.imageSrc}
      alt={token.name}
      draggable={false}
      decoding="async"
      onError={() => {
        console.warn(`[TycoonVale] Missing agent artwork: ${token.imageSrc}`);
        setBroken(true);
      }}
      className={className}
    />
  );
};

export interface CharacterSelectPanelProps {
  themeConfig: ThemeConfig;
  selectedTokenId: string;
  localPlayerName: string;
  localPlayerColor: string;
  isLocalReady?: boolean;
  /** Map of tokenId -> owner player (for players OTHER than the local player) */
  takenByPlayerMap: Record<string, Pick<Player, 'id' | 'nickname' | 'color'>>;
  onSelectToken: (tokenId: string) => void;
  onSelectColor?: (colorHex: string) => void;
  /** Optional quick ready toggle inside the showcase when in lobby */
  onToggleReady?: () => void;
  showReadyAction?: boolean;
}

const WORLD_COPY: Record<
  ThemeConfig['id'],
  { title: string; subtitle: string; unitLabel: string; pedestalLabel: string }
> = {
  valorant: {
    title: 'Agent Selection',
    subtitle: 'Unique tactical operative per player',
    unitLabel: 'Operative',
    pedestalLabel: 'Tactical Collectible'
  },
  original: {
    title: 'Tabletop Piece',
    subtitle: 'Select your brass & ivory token',
    unitLabel: 'Figurine',
    pedestalLabel: 'Collector Edition'
  },
  india: {
    title: 'Heritage Token',
    subtitle: 'Choose your handcrafted emblem',
    unitLabel: 'Emblem',
    pedestalLabel: 'Artisan Piece'
  },
  cyberpunk: {
    title: 'Avatar Rig',
    subtitle: 'Claim a unique neural piece',
    unitLabel: 'Unit',
    pedestalLabel: 'Holo-Plinth'
  },
  wompwomp: {
    title: 'Mascot Selection',
    subtitle: 'Pick your collectible WompWomp buddy',
    unitLabel: 'Mascot',
    pedestalLabel: 'Plush Collectible'
  }
};

export const CharacterSelectPanel: React.FC<CharacterSelectPanelProps> = React.memo(
  ({
    themeConfig,
    selectedTokenId,
    localPlayerName,
    localPlayerColor,
    isLocalReady = false,
    takenByPlayerMap,
    onSelectToken,
    onSelectColor,
    onToggleReady,
    showReadyAction = false
  }) => {
    useEffect(() => {
      preloadWorldTokenImages(themeConfig.tokens);
    }, [themeConfig.tokens]);

    const copy = WORLD_COPY[themeConfig.id];
    const isValorant = themeConfig.id === 'valorant';
    const isChamfered = themeConfig.chamfered;

    const selectedToken: TokenDef = useMemo(() => {
      return (
        themeConfig.tokens.find(t => t.id === selectedTokenId) ?? themeConfig.tokens[0]
      );
    }, [themeConfig.tokens, selectedTokenId]);

    const headingTransform = themeConfig.fonts.headingUppercase ? 'uppercase' : 'none';

    return (
      <section
        aria-label={copy.title}
        data-testid="character-select-panel"
        data-world={themeConfig.id}
        data-chamfered={isChamfered ? 'true' : 'false'}
        className="tv-pregame-surface h-full flex flex-col p-3.5 overflow-hidden"
      >
        {/* Panel Header */}
        <div
          style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 48%, transparent)' }}
          className="flex items-center justify-between pb-2.5 mb-3 border-b shrink-0"
        >
          <div className="min-w-0">
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--board-ink)',
                textTransform: headingTransform
              }}
              className="text-sm font-bold tracking-wider truncate"
            >
              {copy.title}
            </h2>
            <p className="text-[11px] opacity-70 truncate">{copy.subtitle}</p>
          </div>
          <span
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent) 16%, var(--bg))',
              borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
              color: 'var(--accent)',
              borderRadius: isChamfered ? '0px' : '9999px'
            }}
            className="px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider shrink-0"
          >
            {themeConfig.tokens.length}{' '}
            {isValorant ? 'Agents' : themeConfig.id === 'wompwomp' ? 'Mascots' : 'Pieces'}
          </span>
        </div>

        {/* Two-Part Composition: Left Roster Grid + Right Selected Showcase Pedestal */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3">
          {/* LEFT: Agent / Token Roster Grid */}
          <div className="xl:col-span-7 flex flex-col min-h-0 justify-between gap-2.5">
            <div
              className="grid grid-cols-3 gap-2 flex-1 min-h-0"
              role="radiogroup"
              aria-label={copy.title}
            >
              {themeConfig.tokens.map(tok => {
                const isSelected = tok.id === selectedToken.id;
                const ownerOther = takenByPlayerMap[tok.id];
                const isTaken = Boolean(ownerOther);

                return (
                  <button
                    key={tok.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isTaken}
                    onClick={() => !isTaken && onSelectToken(tok.id)}
                    data-testid={`roster-token-${tok.id}`}
                    data-taken={isTaken ? 'true' : 'false'}
                    data-selected={isSelected ? 'true' : 'false'}
                    data-chamfered={isChamfered ? 'true' : 'false'}
                    style={{
                      backgroundColor: isSelected
                        ? `color-mix(in srgb, ${tok.frameColor} 22%, var(--bg))`
                        : isTaken
                        ? 'color-mix(in srgb, var(--bg) 92%, #000000)'
                        : 'color-mix(in srgb, var(--bg) 78%, var(--board))',
                      borderColor: isSelected
                        ? isValorant
                          ? '#FF4655'
                          : localPlayerColor
                        : isTaken
                        ? 'color-mix(in srgb, var(--tile-border) 32%, transparent)'
                        : 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                      borderRadius: isChamfered ? '0px' : '4px',
                      boxShadow: isSelected
                        ? `inset 0 0 0 1px ${isValorant ? '#FF4655' : localPlayerColor}, 0 6px 16px rgba(0,0,0,0.36)`
                        : undefined
                    }}
                    className={`tv-roster-card border p-2 flex flex-col items-center justify-between text-center min-h-[104px] ${
                      isTaken ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {/* Top character accent stripe */}
                    <span
                      style={{
                        backgroundColor: isTaken ? '#475569' : tok.frameColor
                      }}
                      className="absolute inset-x-0 top-0 h-[2.5px] opacity-85"
                      aria-hidden="true"
                    />

                    {/* Selected / Locked status badge */}
                    {isSelected && (
                      <span
                        style={{
                          backgroundColor: isValorant ? '#FF4655' : localPlayerColor,
                          color: isValorant ? '#FFFFFF' : '#0B1218'
                        }}
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow"
                        title="Your selection"
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    )}

                    {isTaken && (
                      <span
                        style={{
                          backgroundColor: 'rgba(9, 14, 20, 0.86)',
                          borderColor: 'rgba(148, 163, 184, 0.4)'
                        }}
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full border flex items-center justify-center text-slate-300"
                        title={`Taken by ${ownerOther.nickname}`}
                      >
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}

                    {/* Uncropped Artwork Preview (preserves exact PNG aspect ratio & transparency) */}
                    <div
                      className={`flex-1 w-full flex items-center justify-center py-0.5 ${
                        isTaken ? 'opacity-40 saturate-[0.35]' : ''
                      }`}
                    >
                      {tok.imageSrc ? (
                        <SafeAgentSprite
                          token={tok}
                          fallbackColor={isTaken ? ownerOther.color : tok.frameColor}
                          sizeClass="w-16 h-16"
                          className="w-16 h-16 xl:w-[72px] xl:h-[72px] 2xl:w-24 2xl:h-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
                        />
                      ) : (
                        <WorldTokenIcon
                          tokenId={tok.id}
                          tokenDef={tok}
                          worldId={themeConfig.id}
                          color={isTaken ? ownerOther.color : localPlayerColor}
                          size={46}
                        />
                      )}
                    </div>

                    {/* Token Name + Taken Owner Tag */}
                    <div className="w-full pt-1">
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          textTransform: headingTransform
                        }}
                        className={`text-[11px] font-bold leading-tight truncate ${
                          isTaken ? 'opacity-60' : ''
                        }`}
                      >
                        {tok.name}
                      </div>
                      {isTaken ? (
                        <div
                          data-testid={`taken-by-${tok.id}`}
                          className="mt-0.5 flex items-center justify-center gap-1 text-[9px] font-semibold truncate"
                          style={{ color: ownerOther.color }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: ownerOther.color }}
                          />
                          <span className="truncate">{ownerOther.nickname}</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[9px] uppercase tracking-wider opacity-55">
                          {isSelected ? 'Selected' : 'Available'}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Seal / Player Color Selector Strip */}
            {onSelectColor && (
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--bg) 78%, var(--board))',
                  borderColor: 'color-mix(in srgb, var(--tile-border) 42%, transparent)',
                  borderRadius: 'var(--radius-tile)'
                }}
                className="px-2.5 py-2 border flex items-center justify-between gap-2 shrink-0"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                  Player Color
                </span>
                <div className="flex items-center gap-1.5">
                  {ACCESSIBLE_PLAYER_COLORS.map(spec => {
                    const active = spec.hex.toLowerCase() === localPlayerColor.toLowerCase();
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => onSelectColor(spec.hex)}
                        title={spec.name}
                        aria-label={`Select player color ${spec.name}`}
                        aria-pressed={active}
                        style={{
                          backgroundColor: spec.hex,
                          boxShadow: active ? `0 0 0 2px var(--bg), 0 0 0 3.5px ${spec.hex}` : undefined
                        }}
                        className={`tv-hud-focus w-4 h-4 rounded-full transition-transform ${
                          active ? 'scale-110' : 'opacity-75 hover:opacity-100 hover:scale-105'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Selected Agent / Collectible Figurine Showcase Pedestal */}
          <div
            data-testid="selected-character-showcase"
            data-world={themeConfig.id}
            className={`xl:col-span-5 tv-showcase-stage p-3.5 justify-between ${
              isValorant ? 'tv-val-brackets' : ''
            }`}
          >
            {/* Top Meta Strip */}
            <div className="w-full flex items-center justify-between gap-2 z-10">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70 truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {copy.pedestalLabel}
              </span>
              <span
                style={{
                  backgroundColor: isLocalReady
                    ? 'rgba(16, 185, 129, 0.18)'
                    : `color-mix(in srgb, ${localPlayerColor} 18%, var(--bg))`,
                  borderColor: isLocalReady ? '#10B981' : localPlayerColor,
                  color: isLocalReady ? '#6EE7B7' : localPlayerColor,
                  borderRadius: isChamfered ? '0px' : '9999px'
                }}
                className="px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shrink-0"
              >
                {isLocalReady ? <ShieldCheck className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                <span>{isLocalReady ? 'Locked In' : 'Active'}</span>
              </span>
            </div>

            {/* Center Physical Figurine on Pedestal */}
            <div className="flex-1 w-full flex flex-col items-center justify-center py-2 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${themeConfig.id}-${selectedToken.id}`}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="relative z-10 flex items-center justify-center"
                >
                  {selectedToken.imageSrc ? (
                    <SafeAgentSprite
                      token={selectedToken}
                      fallbackColor={localPlayerColor}
                      sizeClass="w-32 h-32"
                      className="w-36 h-36 xl:w-44 xl:h-44 2xl:w-56 2xl:h-56 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.72)]"
                    />
                  ) : (
                    <div className="p-2">
                      <WorldTokenIcon
                        tokenId={selectedToken.id}
                        tokenDef={selectedToken}
                        worldId={themeConfig.id}
                        color={localPlayerColor}
                        size={104}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Natural contact shadow + World-authentic display pedestal */}
              <div className="tv-figurine-shadow" aria-hidden="true" />
              <div className="tv-pedestal-base" aria-hidden="true" />
            </div>

            {/* Bottom Character Name + Player Identity Confirmation */}
            <div className="w-full text-center space-y-2 z-10 pt-1">
              <div>
                <h3
                  data-testid="showcase-character-name"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    textTransform: headingTransform,
                    color: 'var(--board-ink)'
                  }}
                  className="text-lg font-extrabold tracking-wider leading-none"
                >
                  {selectedToken.name}
                </h3>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] opacity-80">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: localPlayerColor }}
                  />
                  <span className="font-semibold truncate max-w-[160px]">
                    {localPlayerName || 'Player'}
                  </span>
                </div>
              </div>

              {showReadyAction && onToggleReady && (
                <button
                  type="button"
                  onClick={onToggleReady}
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  className={`tv-hud-btn w-full py-1.5 text-[11px] ${
                    isLocalReady ? 'tv-hud-btn-secondary' : 'tv-hud-btn-primary'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isLocalReady ? 'Change Selection' : `Confirm ${selectedToken.name}`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

CharacterSelectPanel.displayName = 'CharacterSelectPanel';
