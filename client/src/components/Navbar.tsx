import React, { useState } from 'react';
import { useGame } from '../context/GameContext.js';
import { soundEngine } from '../services/audio.js';
import { getThemeConfig, type ThemeConfig } from '../themes/index.js';
import {
  Volume2,
  VolumeX,
  BookOpen,
  Wifi,
  WifiOff,
  RefreshCw,
  Crown
} from 'lucide-react';

export interface NavbarProps {
  onOpenRules: () => void;
  themeConfig?: ThemeConfig;
  compact?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRules, themeConfig, compact = false }) => {
  const { gameState, connectionStatus, isConnected } = useGame();
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const theme =
    themeConfig ??
    (gameState ? getThemeConfig(gameState.settings.theme) : getThemeConfig('original'));
  const isChamfered = theme.chamfered;

  const handleToggleMute = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  const statusMeta =
    connectionStatus === 'RECONNECTING'
      ? { label: 'Reconnecting', dot: '#F59E0B', Icon: RefreshCw, spin: true }
      : isConnected
      ? { label: 'Live', dot: '#22C55E', Icon: Wifi, spin: false }
      : { label: 'Offline', dot: '#EF4444', Icon: WifiOff, spin: false };

  return (
    <header
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000000)',
        borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)',
        color: 'var(--board-ink)',
        fontFamily: 'var(--font-body)'
      }}
      className={`${
        compact ? 'h-12' : 'h-14'
      } border-b px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 transition-colors`}
    >
      {/* Brand Crest */}
      <div className="flex items-center gap-2.5 select-none">
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 18%, var(--board))',
            borderColor: 'var(--accent)',
            borderRadius: isChamfered ? '0px' : theme.id === 'wompwomp' ? '10px' : '4px',
            clipPath: isChamfered
              ? 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
              : undefined
          }}
          className="w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden"
        >
          {theme.id === 'wompwomp' ? (
            <img
              src="/tokens/wompwomp/peach.png"
              alt="WorldWompWomp"
              draggable={false}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <Crown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
            }}
            className="text-base sm:text-lg font-black tracking-[0.14em]"
          >
            TYCOON<span style={{ color: 'var(--accent)' }}>VALE</span>
          </span>
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] opacity-60">
            {theme.name}
          </span>
        </div>
      </div>

      {/* Right Utility Controls */}
      <div className="flex items-center gap-2">
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--board) 75%, var(--bg))',
            borderColor: 'color-mix(in srgb, var(--tile-border) 45%, transparent)',
            borderRadius: isChamfered ? '0px' : '9999px'
          }}
          className="px-2.5 py-1 border flex items-center gap-1.5 text-[11px]"
          title={`Connection: ${statusMeta.label}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${statusMeta.spin ? 'animate-ping' : ''}`}
            style={{ backgroundColor: statusMeta.dot }}
          />
          <statusMeta.Icon
            className={`w-3 h-3 opacity-80 ${statusMeta.spin ? 'animate-spin' : ''}`}
          />
          <span className="hidden sm:inline font-semibold opacity-85">{statusMeta.label}</span>
        </div>

        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          data-chamfered={isChamfered ? 'true' : 'false'}
          className="tv-hud-btn tv-hud-btn-secondary p-2"
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('ui_click', theme.id);
            onOpenRules();
          }}
          data-testid="navbar-rules-btn"
          data-chamfered={isChamfered ? 'true' : 'false'}
          className="tv-hud-btn tv-hud-btn-secondary px-3 py-1.5 text-[11px]"
        >
          <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span className="hidden sm:inline">How to Play</span>
        </button>
      </div>
    </header>
  );
};
