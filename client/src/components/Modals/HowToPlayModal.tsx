import React, { useRef } from 'react';
import { getThemeConfig, getThemeCssVars, type ThemeConfig } from '../../themes/index.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import {
  X,
  BookOpen,
  Building2,
  Gavel,
  ArrowLeftRight,
  Lock,
  Trophy,
  Dices
} from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig?: ThemeConfig;
}

const RULE_SECTIONS = [
  {
    icon: Trophy,
    title: '1. Objective & Victory',
    body: 'TycoonVale is a real-time multiplayer property board game for 2–6 players. Acquire complete color sets, develop properties to raise rent, and bankrupt your opponents. In Team Mode, Gold and Silver cartels share victory.'
  },
  {
    icon: Dices,
    title: '2. Movement & Doubles',
    body: 'Roll two six-sided dice on your turn to move clockwise around the 40-tile board. Passing or landing on the Start corner awards the configured Pass Start bonus. Rolling doubles grants an extra turn — three consecutive doubles sends you directly to detention.'
  },
  {
    icon: Building2,
    title: '3. Monopolies, Building & Mortgages',
    body: 'Owning every property in a color group doubles base rent and unlocks construction (up to 4 houses, then a hotel), built evenly across the set. Need liquidity? Sell houses or mortgage unimproved properties from your My Properties panel.'
  },
  {
    icon: Gavel,
    title: '4. Live Public Auctions',
    body: 'When Auctions are enabled and a player declines an unowned property they land on, an immediate timed auction opens for every active player. Last-second bids trigger a brief extension so every bidder gets a fair shot.'
  },
  {
    icon: ArrowLeftRight,
    title: '5. Player-to-Player Trading',
    body: 'Negotiate bilateral deals at any time during the match. Combine unmortgaged title deeds and cash on either side, or send counter-offers directly from the Trade panel.'
  },
  {
    icon: Lock,
    title: '6. Detention & Free Parking Pot',
    body: 'Leave detention by rolling doubles, paying the bail fee, or using a Pardon Pass. When Free Parking Pot is active, all taxes and penalties accumulate in the center pot and pay out to the next player who lands on the Free Parking corner.'
  }
];

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  themeConfig
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  const theme = themeConfig ?? getThemeConfig('original');
  const cssVars = getThemeCssVars(theme);
  const isChamfered = theme.chamfered;
  const headingTransform = theme.fonts.headingUppercase ? 'uppercase' : 'none';

  return (
    <div
      data-theme={theme.id}
      style={cssVars}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        data-testid="how-to-play-modal"
        data-chamfered={isChamfered ? 'true' : 'false'}
        style={{ fontFamily: 'var(--font-body)', color: 'var(--board-ink)' }}
        className="tv-pregame-surface max-w-2xl w-full max-h-[84vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000000)',
            borderColor: 'color-mix(in srgb, var(--tile-border) 55%, transparent)'
          }}
          className="px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <h2
                id="how-to-play-title"
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: headingTransform
                }}
                className="text-base sm:text-lg font-extrabold tracking-wider leading-tight"
              >
                How to Play TycoonVale
              </h2>
              <p className="text-[11px] opacity-65">
                Core rules across Original, VALORANT Tactical, India & Cyberpunk worlds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close rulebook"
            data-testid="close-rules-btn"
            className="tv-hud-btn tv-hud-btn-secondary p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rule Cards Grid */}
        <div className="p-5 overflow-y-auto tv-hud-scroll grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RULE_SECTIONS.map(sec => {
            const IconComp = sec.icon;
            return (
              <section
                key={sec.title}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--bg) 82%, var(--board))',
                  borderColor: 'color-mix(in srgb, var(--tile-border) 42%, transparent)',
                  borderRadius: 'var(--radius-tile)'
                }}
                className="p-3.5 border space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <IconComp className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      textTransform: headingTransform
                    }}
                    className="text-xs font-bold tracking-wider"
                  >
                    {sec.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed opacity-80">{sec.body}</p>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000000)',
            borderColor: 'color-mix(in srgb, var(--tile-border) 45%, transparent)'
          }}
          className="px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0"
        >
          <span className="text-[11px] opacity-65">
            Press <kbd className="px-1.5 py-0.5 border border-white/20 text-[10px]">Esc</kbd> to return
          </span>
          <button
            type="button"
            onClick={onClose}
            data-chamfered={isChamfered ? 'true' : 'false'}
            className="tv-hud-btn tv-hud-btn-primary px-6 py-2 text-xs uppercase tracking-wider"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
