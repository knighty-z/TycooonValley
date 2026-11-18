import React from 'react';
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '@tycoonvale/shared';
import type { ThemeConfig } from '../../themes/types.js';
import { Lock, RotateCcw, Sliders } from 'lucide-react';

export interface HostSettingsPanelProps {
  settings: GameSettings;
  themeConfig: ThemeConfig;
  isHost: boolean;
  currentPlayerCount: number;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
}

const MAX_PLAYER_OPTIONS = [2, 3, 4, 5, 6] as const;
const STARTING_CASH_OPTIONS = [1000, 1500, 2000, 2500] as const;
const TURN_TIMER_OPTIONS = [30, 45, 60, 90] as const;
const PASS_GO_OPTIONS = [100, 200, 300, 400] as const;

export const HostSettingsPanel: React.FC<HostSettingsPanelProps> = React.memo(
  ({ settings, themeConfig, isHost, currentPlayerCount, onUpdateSettings }) => {
    const c = themeConfig.currencySymbol;
    const isChamfered = themeConfig.chamfered;
    const headingTransform = themeConfig.fonts.headingUppercase ? 'uppercase' : 'none';

    const handleResetDefaults = () => {
      if (!isHost) return;
      onUpdateSettings({
        maxPlayers: Math.max(DEFAULT_GAME_SETTINGS.maxPlayers, currentPlayerCount),
        startingBalance: DEFAULT_GAME_SETTINGS.startingBalance,
        turnTimeoutSeconds: DEFAULT_GAME_SETTINGS.turnTimeoutSeconds,
        passGoReward: DEFAULT_GAME_SETTINGS.passGoReward,
        auctionEnabled: DEFAULT_GAME_SETTINGS.auctionEnabled,
        freeParkingJackpot: DEFAULT_GAME_SETTINGS.freeParkingJackpot,
        teamMode: DEFAULT_GAME_SETTINGS.teamMode
      });
    };

    const pillBtnClass = (active: boolean, disabled: boolean) =>
      `tv-hud-focus px-2 py-1 text-[10px] font-bold tabular-nums border transition ${
        disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'
      } ${active ? '' : 'opacity-75 hover:opacity-100'}`;

    const pillStyle = (active: boolean): React.CSSProperties => ({
      backgroundColor: active
        ? 'var(--accent)'
        : 'color-mix(in srgb, var(--bg) 86%, var(--board))',
      color: active
        ? themeConfig.id === 'valorant'
          ? '#FFFFFF'
          : '#0B1218'
        : 'var(--board-ink)',
      borderColor: active
        ? 'var(--accent)'
        : 'color-mix(in srgb, var(--tile-border) 48%, transparent)',
      borderRadius: 'var(--radius-button)'
    });

    const toggleRows: Array<{
      key: 'auctionEnabled' | 'freeParkingJackpot' | 'teamMode';
      label: string;
      hint: string;
      value: boolean;
    }> = [
      {
        key: 'auctionEnabled',
        label: 'Auctions',
        hint: 'Bid on declined deeds',
        value: settings.auctionEnabled
      },
      {
        key: 'freeParkingJackpot',
        label: 'Free Parking Pot',
        hint: 'Taxes collect in center',
        value: settings.freeParkingJackpot
      },
      {
        key: 'teamMode',
        label: 'Team Mode',
        hint: 'Gold vs Silver cartels',
        value: settings.teamMode
      }
    ];

    return (
      <section
        aria-label="Match Settings"
        data-testid="host-settings-panel"
        data-host-editable={isHost ? 'true' : 'false'}
        className="space-y-2.5"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--accent)',
                textTransform: headingTransform
              }}
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
            >
              Match Rules
            </h3>
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={handleResetDefaults}
              data-testid="reset-settings-btn"
              className="tv-hud-focus inline-flex items-center gap-1 text-[10px] font-semibold opacity-75 hover:opacity-100 transition"
              title="Reset match rules to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          ) : (
            <span
              data-testid="settings-readonly-badge"
              className="inline-flex items-center gap-1 text-[10px] font-semibold opacity-70"
            >
              <Lock className="w-3 h-3" />
              <span>Host Only</span>
            </span>
          )}
        </div>

        {/* Numeric Segmented Controls */}
        <div className="space-y-2">
          {/* Max Players */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] opacity-85">Max Players</span>
            {isHost ? (
              <div className="flex items-center gap-1">
                {MAX_PLAYER_OPTIONS.map(n => {
                  const disabled = n < currentPlayerCount;
                  const active = settings.maxPlayers === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={disabled}
                      onClick={() => onUpdateSettings({ maxPlayers: n })}
                      style={pillStyle(active)}
                      className={pillBtnClass(active, disabled)}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs font-bold tabular-nums">{settings.maxPlayers} Players</span>
            )}
          </div>

          {/* Starting Cash */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] opacity-85">Starting Cash</span>
            {isHost ? (
              <div className="flex items-center gap-1">
                {STARTING_CASH_OPTIONS.map(amt => {
                  const active = settings.startingBalance === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => onUpdateSettings({ startingBalance: amt })}
                      style={pillStyle(active)}
                      className={pillBtnClass(active, false)}
                    >
                      {c}
                      {amt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                {c}
                {settings.startingBalance.toLocaleString()}
              </span>
            )}
          </div>

          {/* Turn Timer */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] opacity-85">Turn Timer</span>
            {isHost ? (
              <div className="flex items-center gap-1">
                {TURN_TIMER_OPTIONS.map(sec => {
                  const active = settings.turnTimeoutSeconds === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onUpdateSettings({ turnTimeoutSeconds: sec })}
                      style={pillStyle(active)}
                      className={pillBtnClass(active, false)}
                    >
                      {sec}s
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs font-bold tabular-nums">{settings.turnTimeoutSeconds}s</span>
            )}
          </div>

          {/* Pass GO Reward */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] opacity-85">Pass Start Bonus</span>
            {isHost ? (
              <div className="flex items-center gap-1">
                {PASS_GO_OPTIONS.map(amt => {
                  const active = settings.passGoReward === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => onUpdateSettings({ passGoReward: amt })}
                      style={pillStyle(active)}
                      className={pillBtnClass(active, false)}
                    >
                      +{c}
                      {amt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs font-bold tabular-nums text-emerald-300">
                +{c}
                {settings.passGoReward}
              </span>
            )}
          </div>
        </div>

        {/* Boolean Rule Toggles */}
        <div
          style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 38%, transparent)' }}
          className="pt-2 border-t space-y-1.5"
        >
          {toggleRows.map(row => (
            <div key={row.key} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold leading-tight">{row.label}</div>
                <div className="text-[9px] opacity-60 leading-tight">{row.hint}</div>
              </div>

              {isHost ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.value}
                  aria-label={row.label}
                  data-testid={`setting-toggle-${row.key}`}
                  onClick={() => onUpdateSettings({ [row.key]: !row.value })}
                  style={{
                    backgroundColor: row.value
                      ? 'var(--accent)'
                      : 'color-mix(in srgb, var(--bg) 88%, #000000)',
                    borderColor: row.value
                      ? 'var(--accent)'
                      : 'color-mix(in srgb, var(--tile-border) 55%, transparent)',
                    borderRadius: isChamfered ? '0px' : '9999px'
                  }}
                  className="tv-hud-focus relative w-9 h-5 border transition-colors shrink-0 cursor-pointer"
                >
                  <span
                    style={{
                      backgroundColor: row.value
                        ? themeConfig.id === 'valorant'
                          ? '#FFFFFF'
                          : '#0B1218'
                        : '#94A3B8',
                      borderRadius: isChamfered ? '0px' : '9999px',
                      transform: row.value ? 'translateX(16px)' : 'translateX(2px)'
                    }}
                    className="block w-3.5 h-3.5 transition-transform"
                  />
                </button>
              ) : (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
                    row.value
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                      : 'bg-white/5 opacity-60 border-white/15'
                  }`}
                >
                  {row.value ? 'On' : 'Off'}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }
);

HostSettingsPanel.displayName = 'HostSettingsPanel';
