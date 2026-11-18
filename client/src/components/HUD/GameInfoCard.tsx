import React, { useState, useRef, useEffect } from 'react';
import type { ThemeConfig } from '../../themes/index.js';
import type { HudPreferences } from '../../services/hudPreferences.js';
import { SettingsMenu } from './SettingsMenu.js';
import { Copy, Check, BookOpen, Wifi, WifiOff } from 'lucide-react';

export interface GameInfoCardProps {
  roomCode: string;
  themeConfig: ThemeConfig;
  isConnected: boolean;
  jackpotPool?: number;
  preferences: HudPreferences;
  onUpdatePreferences: (next: Partial<HudPreferences>) => void;
  onLeaveGame: () => void;
  onOpenRules?: () => void;
}

export const GameInfoCard: React.FC<GameInfoCardProps> = React.memo(
  ({
    roomCode,
    themeConfig,
    isConnected,
    jackpotPool = 0,
    preferences,
    onUpdatePreferences,
    onLeaveGame,
    onOpenRules
  }) => {
    const [copied, setCopied] = useState(false);
    const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      };
    }, []);

    const handleCopyRoom = () => {
      if (typeof window === 'undefined' || !navigator.clipboard) return;
      const url = `${window.location.origin}?room=${roomCode}`;
      void navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    };

    const chamferedAttr = themeConfig.chamfered ? 'true' : 'false';

    return (
      <div
        data-testid="game-info-card"
        data-chamfered={chamferedAttr}
        className="tv-hud-panel p-2.5 space-y-2 shrink-0"
      >
        {/* Top row: Brand / World Name + Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--accent)',
                  textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-xs font-extrabold tracking-widest truncate"
              >
                TycoonVale
              </span>
              <span className="text-[10px] opacity-60">&middot;</span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate">
                {themeConfig.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] opacity-70 mt-0.5">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Live Sync</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Reconnecting...</span>
                </>
              )}
              {jackpotPool > 0 && (
                <>
                  <span>&middot;</span>
                  <span className="tabular-nums font-semibold" style={{ color: 'var(--accent)' }}>
                    Pot {themeConfig.currencySymbol}
                    {jackpotPool}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenRules && (
              <button
                type="button"
                onClick={onOpenRules}
                aria-label="How to Play"
                title="How to Play"
                data-chamfered={chamferedAttr}
                className="tv-hud-btn tv-hud-btn-secondary p-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            )}
            <SettingsMenu
              themeConfig={themeConfig}
              preferences={preferences}
              onUpdatePreferences={onUpdatePreferences}
              onLeaveGame={onLeaveGame}
            />
          </div>
        </div>

        {/* Room Code & Copy Invite Link */}
        <div className="tv-hud-subcard px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider opacity-65">Room</span>
            <span
              className="font-mono font-extrabold tracking-widest text-xs truncate"
              style={{ color: 'var(--accent)' }}
            >
              {roomCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyRoom}
            aria-label="Copy room invite link"
            data-testid="copy-room-code-btn"
            className="tv-hud-focus inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-85 hover:opacity-100 transition"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Invite</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
);

GameInfoCard.displayName = 'GameInfoCard';
