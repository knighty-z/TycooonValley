import React, { useState, useRef } from 'react';
import type { WorldThemeId } from '@tycoonvale/shared';
import { WORLD_THEME_LIST, getThemeConfig, type ThemeConfig } from '../../themes/index.js';
import {
  soundEngine,
  SOUND_CATALOG,
  type SoundEventId,
  type SoundCategory
} from '../../services/audio.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { Volume2, VolumeX, Play, X, Sliders, AudioWaveform } from 'lucide-react';

export interface SoundPreviewPanelProps {
  isOpen: boolean;
  initialWorld: WorldThemeId;
  themeConfig: ThemeConfig;
  onClose: () => void;
}

const CATEGORIES: Array<{ id: SoundCategory; label: string }> = [
  { id: 'movement', label: 'Movement' },
  { id: 'economy', label: 'Economy' },
  { id: 'auction', label: 'Auctions' },
  { id: 'trade', label: 'Trading' },
  { id: 'events', label: 'Events' },
  { id: 'ui', label: 'UI Feedback' }
];

const WORLD_CHARACTER_DESC: Record<WorldThemeId, string> = {
  original: 'Soft chimes, warm wood taps, gentle sine harmonics',
  valorant: 'Sharp clicks, low sub hits, short metallic tones',
  india: 'Warm bell harmonics, resonant wood taps, pentatonic chimes',
  cyberpunk: 'Synth blips, micro pitch glitches, deep low pulses',
  wompwomp: 'Playful toy-marimba plucks, bouncy pastel pops & cheerful chimes'
};

export const SoundPreviewPanel: React.FC<SoundPreviewPanelProps> = ({
  isOpen,
  initialWorld,
  themeConfig,
  onClose
}) => {
  const [previewWorld, setPreviewWorld] = useState<WorldThemeId>(initialWorld);
  const [volume, setVolume] = useState<number>(() => Math.round(soundEngine.getVolume() * 100));
  const [muted, setMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [lastPlayed, setLastPlayed] = useState<SoundEventId | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  const activeWorldTheme = getThemeConfig(previewWorld);
  const chamferedAttr = themeConfig.chamfered ? 'true' : 'false';
  const categoryBalance = soundEngine.getCategoryBalance();

  const handleTrigger = (eventId: SoundEventId) => {
    soundEngine.unlock();
    soundEngine.play(eventId, previewWorld);
    setLastPlayed(eventId);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    soundEngine.setVolume(val / 100);
  };

  const handleToggleMute = () => {
    const next = soundEngine.toggleMute();
    setMuted(next);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Web Audio Sound Preview Panel"
      data-testid="sound-preview-panel"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
        data-chamfered={chamferedAttr}
        className="tv-hud-panel max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl select-none"
      >
        <div style={{ backgroundColor: 'var(--accent)' }} className="h-1 w-full shrink-0" />

        {/* Header */}
        <div
          style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)' }}
          className="px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AudioWaveform className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
            <div className="min-w-0">
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                }}
                className="text-sm font-extrabold tracking-wider truncate"
              >
                Web Audio Synth Lab (18 Cues &times; 5 Worlds)
              </h2>
              <p className="text-[11px] opacity-70 truncate">
                Pure Web Audio API &middot; Soft Limiter &middot; Max Polyphony: {soundEngine.getMaxPolyphony()} voices
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sound preview"
            className="tv-hud-focus p-1 rounded opacity-75 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* World Selector & Master Controls */}
        <div
          style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 42%, transparent)' }}
          className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-1 flex-wrap">
            {WORLD_THEME_LIST.map(w => {
              const selected = w.id === previewWorld;
              return (
                <button
                  key={w.id}
                  type="button"
                  data-testid={`sound-world-${w.id}`}
                  data-chamfered={chamferedAttr}
                  onClick={() => setPreviewWorld(w.id)}
                  className={`tv-hud-btn px-2.5 py-1 text-[11px] ${
                    selected ? 'tv-hud-btn-primary' : 'tv-hud-btn-secondary'
                  }`}
                >
                  {w.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-secondary px-2 py-1 text-[11px]"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
              <span>{muted ? 'Muted' : 'Active'}</span>
            </button>

            <div className="flex items-center gap-1.5 w-32">
              <Sliders className="w-3 h-3 opacity-65 shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                aria-label="Master preview volume"
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="tv-hud-slider flex-1"
              />
              <span className="text-[10px] font-bold tabular-nums w-7 text-right">{volume}%</span>
            </div>
          </div>
        </div>

        {/* Active World Acoustic Character Note */}
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[11px] shrink-0">
          <span className="opacity-80">
            <strong style={{ color: 'var(--accent)' }}>{activeWorldTheme.name}:</strong>{' '}
            {WORLD_CHARACTER_DESC[previewWorld]}
          </span>
          {lastPlayed && (
            <span className="text-[10px] font-mono opacity-75">
              Last played: <strong>{lastPlayed}</strong>
            </span>
          )}
        </div>

        {/* Categorized 18-Sound Preview Grid */}
        <div className="p-4 pt-2 overflow-y-auto tv-hud-scroll grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map(cat => {
            const entries = SOUND_CATALOG.filter(e => e.category === cat.id);
            return (
              <div key={cat.id} className="tv-hud-subcard p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold opacity-75 border-b border-white/10 pb-1">
                  <span>{cat.label}</span>
                  <span className="tabular-nums">Mix {Math.round(categoryBalance[cat.id] * 100)}%</span>
                </div>
                <div className="space-y-1">
                  {entries.map(item => {
                    const isLast = lastPlayed === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`sound-cue-${item.id}`}
                        onClick={() => handleTrigger(item.id)}
                        style={{
                          backgroundColor: isLast
                            ? 'color-mix(in srgb, var(--accent) 18%, var(--bg))'
                            : 'color-mix(in srgb, var(--bg) 70%, var(--board))',
                          borderColor: isLast
                            ? 'var(--accent)'
                            : 'color-mix(in srgb, var(--tile-border) 38%, transparent)',
                          borderRadius: 'var(--radius-tile)'
                        }}
                        className="tv-hud-focus w-full px-2.5 py-1.5 border flex items-center justify-between gap-2 text-left hover:brightness-110 transition"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                          <div className="text-[10px] opacity-65 truncate">{item.description}</div>
                        </div>
                        <span
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--accent) 22%, transparent)',
                            color: 'var(--accent)'
                          }}
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
