import React, { useEffect } from 'react';
import type { ThemeConfig } from '../../themes/types.js';
import { WorldTokenIcon, preloadWorldTokenImages } from '../Icons/WorldTokens.js';
import { Check } from 'lucide-react';

export interface TokenPickerProps {
  themeConfig: ThemeConfig;
  selectedTokenId: string;
  /** Token IDs already claimed by other players in the same game (cannot be duplicated) */
  takenTokenIds?: string[];
  playerColor: string;
  onSelectToken: (tokenId: string) => void;
  compact?: boolean;
}

/**
 * Simple, world-aware token selector displaying all 6 world pieces (including VALORANT
 * agent names and preloaded sprites) while enforcing zero duplicate tokens per match.
 */
export const TokenPicker: React.FC<TokenPickerProps> = React.memo(
  ({
    themeConfig,
    selectedTokenId,
    takenTokenIds = [],
    playerColor,
    onSelectToken,
    compact = false
  }) => {
    useEffect(() => {
      preloadWorldTokenImages(themeConfig.tokens);
    }, [themeConfig.tokens]);

    const takenSet = new Set(takenTokenIds.filter(id => id !== selectedTokenId));

    return (
      <div
        className="space-y-2"
        style={{ fontFamily: 'var(--font-body)' }}
        data-testid="world-token-picker"
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--accent)' }}
          >
            {themeConfig.name} Tokens
          </span>
          <span className="text-[10px] opacity-70">Unique per player</span>
        </div>

        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'} gap-2`}>
          {themeConfig.tokens.map(tok => {
            const isSelected = tok.id === selectedTokenId;
            const isTaken = takenSet.has(tok.id);

            return (
              <button
                key={tok.id}
                type="button"
                disabled={isTaken}
                onClick={() => onSelectToken(tok.id)}
                data-testid={`token-option-${tok.id}`}
                style={{
                  backgroundColor: isSelected
                    ? `color-mix(in srgb, ${playerColor} 22%, var(--bg))`
                    : 'color-mix(in srgb, var(--bg) 85%, var(--board))',
                  borderColor: isSelected
                    ? playerColor
                    : 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                  borderRadius: 'var(--radius-tile)',
                  color: 'var(--board-ink)'
                }}
                className={`relative p-2 border flex flex-col items-center justify-center gap-1 transition ${
                  isTaken
                    ? 'opacity-35 cursor-not-allowed grayscale'
                    : 'hover:brightness-110 cursor-pointer'
                }`}
              >
                <WorldTokenIcon
                  tokenId={tok.id}
                  tokenDef={tok}
                  worldId={themeConfig.id}
                  color={playerColor}
                  size={tok.imageSrc ? (compact ? 42 : 48) : compact ? 30 : 34}
                />
                <span className="text-[10px] font-bold leading-tight text-center truncate max-w-full">
                  {tok.name}
                </span>
                {isSelected && (
                  <span
                    className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: playerColor, color: '#0B1218' }}
                  >
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                )}
                {isTaken && (
                  <span className="absolute inset-x-1 bottom-1 text-[8px] font-bold uppercase tracking-wider bg-black/75 text-white/80 rounded px-1">
                    Taken
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

TokenPicker.displayName = 'TokenPicker';
