import React, { useState, useRef, useEffect } from 'react';
import type { ThemeConfig } from '../../themes/index.js';
import type { HudPreferences } from '../../services/hudPreferences.js';
import {
  Settings,
  Volume2,
  VolumeX,
  MessageSquare,
  LogOut,
  X,
  AlertTriangle
} from 'lucide-react';

export interface SettingsMenuProps {
  themeConfig: ThemeConfig;
  preferences: HudPreferences;
  onUpdatePreferences: (next: Partial<HudPreferences>) => void;
  onLeaveGame: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = React.memo(
  ({ themeConfig, preferences, onUpdatePreferences, onLeaveGame }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmingLeave, setConfirmingLeave] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!isOpen) {
        setConfirmingLeave(false);
        return undefined;
      }

      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    const chamferedAttr = themeConfig.chamfered ? 'true' : 'false';

    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label="Game Settings"
          data-testid="settings-menu-trigger"
          data-chamfered={chamferedAttr}
          className="tv-hud-btn tv-hud-btn-secondary p-1.5"
        >
          <Settings className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        </button>

        {isOpen && (
          <div
            role="dialog"
            aria-label="In-Game Settings"
            data-testid="settings-menu-popover"
            data-chamfered={chamferedAttr}
            className="tv-hud-panel absolute left-0 top-[calc(100%+6px)] w-60 p-3 z-50 space-y-3"
          >
            <div
              style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 48%, transparent)' }}
              className="flex items-center justify-between pb-1.5 border-b"
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-xs font-bold tracking-wider"
              >
                Settings
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close settings"
                className="tv-hud-focus p-0.5 rounded opacity-75 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sound On/Off Toggle */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium">
                {preferences.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 opacity-60" />
                )}
                <span>Sound Effects</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.soundEnabled}
                data-testid="settings-sound-toggle"
                onClick={() => onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })}
                style={{
                  backgroundColor: preferences.soundEnabled
                    ? 'var(--accent)'
                    : 'color-mix(in srgb, var(--bg) 70%, var(--tile-border))',
                  color: preferences.soundEnabled ? '#0B1218' : 'var(--board-ink)',
                  borderRadius: 'var(--radius-tile)'
                }}
                className="tv-hud-focus px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
              >
                {preferences.soundEnabled ? 'On' : 'Off'}
              </button>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] opacity-80">
                <span>Volume</span>
                <span className="tabular-nums font-bold">{Math.round(preferences.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(preferences.volume * 100)}
                disabled={!preferences.soundEnabled}
                aria-label="Audio volume"
                data-testid="settings-volume-slider"
                onChange={e => onUpdatePreferences({ volume: Number(e.target.value) / 100 })}
                className="tv-hud-slider w-full disabled:opacity-40"
              />
            </div>

            {/* Chat Show/Hide Toggle */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium">
                <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span>Show Chat</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.chatVisible}
                data-testid="settings-chat-toggle"
                onClick={() => onUpdatePreferences({ chatVisible: !preferences.chatVisible })}
                style={{
                  backgroundColor: preferences.chatVisible
                    ? 'var(--accent)'
                    : 'color-mix(in srgb, var(--bg) 70%, var(--tile-border))',
                  color: preferences.chatVisible ? '#0B1218' : 'var(--board-ink)',
                  borderRadius: 'var(--radius-tile)'
                }}
                className="tv-hud-focus px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
              >
                {preferences.chatVisible ? 'Shown' : 'Hidden'}
              </button>
            </div>

            {/* Leave Game with 2-Step Confirm */}
            <div
              style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 48%, transparent)' }}
              className="pt-2 border-t"
            >
              {!confirmingLeave ? (
                <button
                  type="button"
                  data-testid="settings-leave-btn"
                  data-chamfered={chamferedAttr}
                  onClick={() => setConfirmingLeave(true)}
                  className="tv-hud-btn tv-hud-btn-danger w-full py-1.5 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Game</span>
                </button>
              ) : (
                <div className="space-y-1.5" data-testid="settings-leave-confirm">
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-300 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Leave this match now?</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmingLeave(false)}
                      data-chamfered={chamferedAttr}
                      className="tv-hud-btn tv-hud-btn-secondary py-1 text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      data-testid="settings-leave-confirm-btn"
                      data-chamfered={chamferedAttr}
                      onClick={() => {
                        setIsOpen(false);
                        onLeaveGame();
                      }}
                      className="tv-hud-btn tv-hud-btn-danger py-1 text-[11px]"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SettingsMenu.displayName = 'SettingsMenu';
