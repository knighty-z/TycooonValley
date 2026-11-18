import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { GameSettings, GameState, Player, WorldThemeId } from '@tycoonvale/shared';
import { useGame } from '../context/GameContext.js';
import type { RealtimeConnectionStatus } from '../services/supabase/realtime.js';
import {
  getThemeConfig,
  getThemeCssVars,
  normalizeWorldTheme,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers
} from '../themes/index.js';
import { soundEngine } from '../services/audio.js';
import { WorldSelector } from '../components/Pregame/WorldSelector.js';
import { CharacterSelectPanel } from '../components/Pregame/CharacterSelectPanel.js';
import { LobbyPlayerSlots } from '../components/Pregame/LobbyPlayerSlots.js';
import { HostSettingsPanel } from '../components/Pregame/HostSettingsPanel.js';
import { LaunchTransitionOverlay } from '../components/Pregame/LaunchTransitionOverlay.js';
import { ConnectionStatusBanner } from '../components/Pregame/ConnectionStatusBanner.js';
import { ChatBox } from '../components/HUD/ChatBox.js';
import {
  Copy,
  Check,
  Link2,
  Play,
  CheckCircle2,
  LogOut,
  Crown,
  BookOpen,
  Volume2,
  VolumeX,
  AlertCircle,
  X
} from 'lucide-react';

export interface LobbyPageProps {
  onOpenRules?: () => void;
  /** Optional preview overrides (used strictly in ?previewPregame=... QA mode) */
  previewGameState?: GameState;
  previewLocalPlayer?: Player;
  previewConnectionStatus?: RealtimeConnectionStatus;
  previewBannerLabel?: string;
  onPreviewUpdateSettings?: (patch: Partial<GameSettings>) => void;
  onPreviewSelectToken?: (tokenId: string) => void;
  onPreviewSelectColor?: (colorHex: string) => void;
  onPreviewToggleReady?: (ready: boolean) => void;
  onPreviewSetTeam?: (team: 'gold' | 'silver') => void;
  onPreviewSendChat?: (text: string, isReaction?: boolean) => void;
  onPreviewStartGame?: () => void;
  onPreviewLeave?: () => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({
  onOpenRules,
  previewGameState,
  previewLocalPlayer,
  previewConnectionStatus,
  previewBannerLabel,
  onPreviewUpdateSettings,
  onPreviewSelectToken,
  onPreviewSelectColor,
  onPreviewToggleReady,
  onPreviewSetTeam,
  onPreviewSendChat,
  onPreviewStartGame,
  onPreviewLeave
}) => {
  let ctx: ReturnType<typeof useGame> | null = null;
  try {
    ctx = useGame();
  } catch {
    ctx = null;
  }

  const gameState = previewGameState ?? ctx?.gameState ?? null;
  const player = previewLocalPlayer ?? ctx?.player ?? null;
  const connectionStatus = previewConnectionStatus ?? ctx?.connectionStatus ?? 'CONNECTED';
  const error = previewGameState ? null : ctx?.error ?? null;
  const clearError = ctx?.clearError;
  const retryConnection = ctx?.retryConnection;

  const toggleReady = onPreviewToggleReady ?? ctx?.toggleReady;
  const setTeam = onPreviewSetTeam ?? ctx?.setTeam;
  const updateSettings = onPreviewUpdateSettings ?? ctx?.updateSettings;
  const selectToken = onPreviewSelectToken ?? ctx?.selectToken;
  const selectColor = onPreviewSelectColor ?? ctx?.selectColor;
  const startGame = onPreviewStartGame ?? ctx?.startGame;
  const sendChat = onPreviewSendChat ?? ctx?.sendChat;
  const leaveRoom = onPreviewLeave ?? ctx?.leaveRoom;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const autoAssignRef = useRef<string>('');

  const worldId: WorldThemeId = normalizeWorldTheme(gameState?.settings.theme);
  const themeConfig = useMemo(() => getThemeConfig(worldId), [worldId]);
  const cssVars = useMemo(() => getThemeCssVars(themeConfig), [themeConfig]);

  // Sync audio world character with active lobby world
  useEffect(() => {
    soundEngine.setWorld(worldId);
  }, [worldId]);

  const players = gameState?.players ?? [];

  const colorMap = useMemo(() => resolveUniquePlayerColors(players), [players]);
  const tokenMap = useMemo(
    () => resolveWorldTokensForPlayers(players, themeConfig.tokens),
    [players, themeConfig.tokens]
  );

  // Auto-assign the first unclaimed world token if local player's token doesn't belong to the active
  // world or collides with an earlier player (keeps lobby state cleanly synchronized across browsers)
  useEffect(() => {
    if (!gameState || !player || !selectToken || previewGameState) return;
    const validIds = new Set(themeConfig.tokens.map(t => t.id));
    const otherPlayerHasSame = players.some(
      (p, idx) =>
        p.id !== player.id &&
        p.token === player.token &&
        idx < players.findIndex(me => me.id === player.id)
    );
    const needsAutoAssign = !validIds.has(player.token) || otherPlayerHasSame;
    const assignKey = `${worldId}-${player.id}-${player.token}-${players.length}`;

    if (needsAutoAssign && autoAssignRef.current !== assignKey) {
      autoAssignRef.current = assignKey;
      const resolved = tokenMap[player.id];
      if (resolved && resolved.id !== player.token) {
        void selectToken(resolved.id);
      }
    }
  }, [gameState, player, players, worldId, themeConfig.tokens, tokenMap, selectToken, previewGameState]);

  // Map of tokens claimed by OTHER players (for taken-state UI + duplicate prevention)
  const takenByPlayerMap = useMemo(() => {
    const map: Record<string, Pick<Player, 'id' | 'nickname' | 'color'>> = {};
    if (!player) return map;
    for (const p of players) {
      if (p.id === player.id) continue;
      const resolved = tokenMap[p.id];
      if (resolved) {
        map[resolved.id] = {
          id: p.id,
          nickname: p.nickname,
          color: colorMap[p.id]?.hex ?? p.color
        };
      }
    }
    return map;
  }, [players, player, tokenMap, colorMap]);

  // Countdown sequence before invoking real startGame()
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setIsLaunching(true);
      startGame?.();
      const safetyReset = window.setTimeout(() => setIsLaunching(false), 3500);
      return () => window.clearTimeout(safetyReset);
    }

    soundEngine.play('token_step', worldId);
    const timer = window.setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 850);
    return () => window.clearTimeout(timer);
  }, [countdown, startGame, worldId]);

  if (!gameState || !player) return null;

  const isHost = player.isHost;
  const isReady = player.isReady;
  const myResolvedToken = tokenMap[player.id] ?? themeConfig.tokens[0];
  const myColor = colorMap[player.id]?.hex ?? player.color;

  // Authoritative Start Game readiness evaluation with exact dynamic disable reason
  const unreadyPlayers = players.filter(p => !p.isReady);
  let startDisabledReason: string | null = null;
  if (players.length < 2) {
    startDisabledReason = 'Need at least 2 players to start.';
  } else if (unreadyPlayers.length === 1) {
    startDisabledReason = `Waiting for ${unreadyPlayers[0].nickname} to ready up.`;
  } else if (unreadyPlayers.length > 1) {
    startDisabledReason = `Waiting for ${unreadyPlayers.length} players to ready up.`;
  }
  const canStart = isHost && startDisabledReason === null && countdown === null && !isLaunching;

  const handleCopyCode = () => {
    soundEngine.play('ui_click', worldId);
    navigator.clipboard?.writeText(gameState.roomCode).catch(() => {});
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleCopyInviteLink = () => {
    soundEngine.play('ui_click', worldId);
    const url = `${window.location.origin}?room=${gameState.roomCode}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleInitiateStart = () => {
    if (!canStart) return;
    soundEngine.play('turn_start', worldId);
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsLaunching(true);
      startGame?.();
    } else {
      setCountdown(3);
    }
  };

  const handleSelectToken = (tokenId: string) => {
    soundEngine.play('ui_click', worldId);
    void selectToken?.(tokenId);
  };

  const handleSelectColor = (colorHex: string) => {
    soundEngine.play('ui_click', worldId);
    void selectColor?.(colorHex);
  };

  const handleWorldChange = (nextWorld: WorldThemeId) => {
    if (!isHost) return;
    soundEngine.play('ui_click', nextWorld);
    updateSettings?.({ theme: nextWorld });
  };

  const isChamfered = themeConfig.chamfered;
  const headingTransform = themeConfig.fonts.headingUppercase ? 'uppercase' : 'none';

  return (
    <div
      data-theme={themeConfig.id}
      data-testid="lobby-page"
      style={cssVars}
      className="tv-pregame-shell h-screen w-full overflow-hidden flex flex-col p-2.5 sm:p-3 gap-2.5"
    >
      {/* Optional Preview Mode Label (never shown in live multiplayer) */}
      {previewBannerLabel && (
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 18%, var(--bg))',
            borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)',
            color: 'var(--accent)'
          }}
          className="px-3 py-1 border text-[10px] font-bold uppercase tracking-widest flex items-center justify-between shrink-0"
        >
          <span>Simulated Preview Data · {previewBannerLabel}</span>
          <span>Phase G Visual Verification</span>
        </div>
      )}

      {/* Connection Lost / Reconnecting Alert */}
      <ConnectionStatusBanner
        status={connectionStatus}
        themeConfig={themeConfig}
        errorDetail={error}
        onRetry={retryConnection}
      />

      {/* Area A: ROOM INFORMATION HEADER */}
      <header
        data-testid="lobby-room-header"
        data-chamfered={isChamfered ? 'true' : 'false'}
        className="tv-pregame-surface px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0"
      >
        {/* Left: Brand + Room Name + World Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent) 18%, var(--bg))',
              borderColor: 'var(--accent)',
              borderRadius: isChamfered ? '0px' : worldId === 'wompwomp' ? '10px' : '4px'
            }}
            className="w-9 h-9 border flex items-center justify-center shrink-0 overflow-hidden"
          >
            {worldId === 'wompwomp' ? (
              <img
                src="/tokens/wompwomp/peach.png"
                alt="WorldWompWomp"
                draggable={false}
                className="w-7 h-7 object-contain"
              />
            ) : (
              <Crown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  textTransform: headingTransform
                }}
                className="text-sm sm:text-base font-black tracking-wider truncate"
              >
                {themeConfig.name} Lobby
              </h1>
              <span
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 16%, var(--bg))',
                  borderColor: 'color-mix(in srgb, var(--accent) 48%, transparent)',
                  color: 'var(--accent)',
                  borderRadius: isChamfered ? '0px' : '9999px'
                }}
                className="px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider tabular-nums shrink-0"
              >
                {players.length}/{gameState.settings.maxPlayers} Players
              </span>
            </div>
            <div className="text-[11px] opacity-70 truncate">
              {isHost
                ? 'You are the room host · Configure world & rules, then launch when ready'
                : `Hosted by ${players.find(p => p.isHost)?.nickname ?? 'Host'} · Pick your character & ready up`}
            </div>
          </div>
        </div>

        {/* Center: Prominent Room Code + Copy Code + Copy Invite Link */}
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000000)',
            borderColor: 'color-mix(in srgb, var(--tile-border) 62%, transparent)',
            borderRadius: isChamfered ? '0px' : '4px'
          }}
          className="px-3 py-1.5 border flex items-center gap-2.5"
        >
          <div>
            <span className="block text-[9px] uppercase tracking-[0.18em] opacity-55 leading-none">
              Room Code
            </span>
            <span
              data-testid="lobby-room-code"
              style={{ color: 'var(--accent)' }}
              className="font-mono font-black text-lg tracking-[0.22em] leading-tight"
            >
              {gameState.roomCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCode}
              data-testid="copy-code-btn"
              data-chamfered={isChamfered ? 'true' : 'false'}
              className="tv-hud-btn tv-hud-btn-secondary px-2.5 py-1.5 text-[10px] uppercase tracking-wider"
              title="Copy 6-character room code"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCode ? 'Copied' : 'Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              data-testid="copy-invite-link-btn"
              data-chamfered={isChamfered ? 'true' : 'false'}
              className="tv-hud-btn tv-hud-btn-primary px-2.5 py-1.5 text-[10px] uppercase tracking-wider"
              title="Copy direct join link"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              <span>{copiedLink ? 'Link Copied' : 'Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Right: Audio, Rules & Leave Room */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMuted(soundEngine.toggleMute())}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            data-chamfered={isChamfered ? 'true' : 'false'}
            className="tv-hud-btn tv-hud-btn-secondary p-2"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            )}
          </button>

          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              data-chamfered={isChamfered ? 'true' : 'false'}
              className="tv-hud-btn tv-hud-btn-secondary px-2.5 py-1.5 text-[11px]"
            >
              <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="hidden xl:inline">Rules</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => leaveRoom?.()}
            data-testid="lobby-leave-btn"
            data-chamfered={isChamfered ? 'true' : 'false'}
            className="tv-hud-btn tv-hud-btn-danger px-2.5 py-1.5 text-[11px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Non-blocking Error Banner inside Lobby */}
      {error && (
        <div
          role="alert"
          data-testid="lobby-error-banner"
          style={{
            backgroundColor: 'rgba(153, 27, 27, 0.28)',
            borderColor: 'rgba(239, 68, 68, 0.6)',
            borderRadius: isChamfered ? '0px' : '4px'
          }}
          className="px-3.5 py-1.5 border text-rose-100 text-xs flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => clearError?.()}
            className="text-rose-200 hover:text-white"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN 3-COLUMN LOBBY WORKSPACE (Zero page scroll at 1366x768 and 1920x1080) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* LEFT COLUMN (4 cols): Player Roster Slots + Compact Lobby Social Chat */}
        <div className="lg:col-span-4 min-h-0 flex flex-col gap-2.5">
          <div className="flex-[1.25] min-h-0 flex flex-col">
            <LobbyPlayerSlots
              players={players}
              maxPlayers={gameState.settings.maxPlayers}
              localPlayerId={player.id}
              themeConfig={themeConfig}
              tokenMap={tokenMap}
              colorMap={colorMap}
              teamMode={gameState.settings.teamMode}
              connectionStatus={connectionStatus}
              onSetTeam={team => setTeam?.(team)}
            />
          </div>

          <div className="flex-1 min-h-[165px] flex flex-col">
            <ChatBox
              gameState={gameState}
              localPlayer={player}
              themeConfig={themeConfig}
              onSendChat={(text, isReaction) => sendChat?.(text, isReaction)}
            />
          </div>
        </div>

        {/* CENTER COLUMN (5 cols): Dedicated Character / VALORANT Agent Selection & Showcase */}
        <div className="lg:col-span-5 min-h-0 flex flex-col">
          <CharacterSelectPanel
            themeConfig={themeConfig}
            selectedTokenId={myResolvedToken.id}
            localPlayerName={player.nickname}
            localPlayerColor={myColor}
            isLocalReady={isReady}
            takenByPlayerMap={takenByPlayerMap}
            onSelectToken={handleSelectToken}
            onSelectColor={handleSelectColor}
            onToggleReady={!isHost ? () => toggleReady?.(!isReady) : undefined}
            showReadyAction={!isHost}
          />
        </div>

        {/* RIGHT COLUMN (3 cols): World Selector + Host Settings + Ready / Start Game Controls */}
        <div
          data-chamfered={isChamfered ? 'true' : 'false'}
          className="lg:col-span-3 tv-pregame-surface min-h-0 flex flex-col justify-between p-3.5 gap-3 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-y-auto tv-hud-scroll space-y-4 pr-0.5">
            {/* World Selector (Live synced by Host; Read-only for non-hosts) */}
            <WorldSelector
              selectedWorld={worldId}
              onSelectWorld={handleWorldChange}
              canEdit={isHost}
              layout="compact"
            />

            {/* Divider */}
            <div
              style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 42%, transparent)' }}
              className="border-t"
            />

            {/* Real Backend Match Settings */}
            <HostSettingsPanel
              settings={gameState.settings}
              themeConfig={themeConfig}
              isHost={isHost}
              currentPlayerCount={players.length}
              onUpdateSettings={patch => updateSettings?.(patch)}
            />
          </div>

          {/* Bottom Ready & Launch Action Footer */}
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 48%, transparent)' }}
            className="pt-3 border-t space-y-2 shrink-0"
          >
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={handleInitiateStart}
                  disabled={!canStart}
                  data-testid="start-game-btn"
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  className="tv-hud-btn tv-hud-btn-primary w-full py-3 text-xs sm:text-sm uppercase tracking-[0.16em]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Game</span>
                </button>
                <div
                  data-testid="start-status-reason"
                  className={`text-[11px] text-center font-semibold ${
                    canStart ? 'text-emerald-300' : 'opacity-75'
                  }`}
                >
                  {startDisabledReason ?? `All ${players.length} players ready · Launch match`}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => toggleReady?.(!isReady)}
                  data-testid="ready-toggle-btn"
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  className={`tv-hud-btn w-full py-3 text-xs sm:text-sm uppercase tracking-[0.16em] ${
                    isReady ? 'tv-hud-btn-secondary' : 'tv-hud-btn-primary'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isReady ? 'Ready (Click to Unready)' : 'Ready Up'}</span>
                </button>
                <div className="text-[11px] text-center opacity-70">
                  {isReady
                    ? 'Waiting for host to launch the match.'
                    : 'Select your character and ready up when set.'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Themed 3, 2, 1 Launch Countdown & World Transition Overlay */}
      <LaunchTransitionOverlay
        visible={countdown !== null || isLaunching}
        mode={countdown !== null ? 'countdown' : 'launching'}
        countdownValue={countdown ?? 1}
        themeConfig={themeConfig}
        subtitle={
          countdown !== null
            ? `Deploying ${players.length} players into ${themeConfig.name}...`
            : 'Loading live tabletop board...'
        }
      />
    </div>
  );
};
