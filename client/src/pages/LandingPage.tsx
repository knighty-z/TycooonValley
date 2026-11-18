import React, { useState, useEffect, useMemo } from 'react';
import { DEFAULT_GAME_SETTINGS, type GameSettings, type WorldThemeId } from '@tycoonvale/shared';
import { useGame } from '../context/GameContext.js';
import {
  ACCESSIBLE_PLAYER_COLORS,
  getThemeConfig,
  getThemeCssVars,
  type ThemeConfig
} from '../themes/index.js';
import {
  extractRoomCode,
  getPreferredWorld,
  savePreferredWorld,
  validateNickname
} from '../services/session.js';
import { soundEngine } from '../services/audio.js';
import { preloadWorldTokenImages, WorldTokenIcon } from '../components/Icons/WorldTokens.js';
import { HeroBoardBackdrop } from '../components/Pregame/HeroBoardBackdrop.js';
import { WorldSelector } from '../components/Pregame/WorldSelector.js';
import { LaunchTransitionOverlay } from '../components/Pregame/LaunchTransitionOverlay.js';
import { ConnectionStatusBanner } from '../components/Pregame/ConnectionStatusBanner.js';
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  Plus,
  X,
  AlertCircle,
  ClipboardPaste,
  Sliders,
  Check
} from 'lucide-react';

export interface LandingPageProps {
  onOpenRules: () => void;
  selectedWorld?: WorldThemeId;
  onChangeWorld?: (world: WorldThemeId) => void;
  /** Optional preview-only props for visual QA of error / connection-lost states */
  previewInitialMode?: 'idle' | 'create' | 'join';
  previewInitialJoinCode?: string;
  previewError?: string | null;
  previewConnectionLost?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenRules,
  selectedWorld: controlledWorld,
  onChangeWorld,
  previewInitialMode = 'idle',
  previewInitialJoinCode = '',
  previewError = null,
  previewConnectionLost = false
}) => {
  const {
    session,
    updateSession,
    createRoom,
    joinRoom,
    error: ctxError,
    clearError,
    connectionStatus,
    retryConnection
  } = useGame();

  const [internalWorld, setInternalWorld] = useState<WorldThemeId>(getPreferredWorld);
  const activeWorld = controlledWorld ?? internalWorld;
  const themeConfig: ThemeConfig = useMemo(() => getThemeConfig(activeWorld), [activeWorld]);
  const cssVars = useMemo(() => getThemeCssVars(themeConfig), [themeConfig]);

  const [activePanel, setActivePanel] = useState<'idle' | 'create' | 'join'>(previewInitialMode);
  const [joinCode, setJoinCode] = useState(previewInitialJoinCode);
  const [localError, setLocalError] = useState<string | null>(previewError);
  const [submittingMode, setSubmittingMode] = useState<'creating' | 'joining' | null>(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  // Real backend-supported initial room settings for Create Room
  const [createSettings, setCreateSettings] = useState<Partial<GameSettings>>({
    maxPlayers: DEFAULT_GAME_SETTINGS.maxPlayers,
    startingBalance: DEFAULT_GAME_SETTINGS.startingBalance,
    turnTimeoutSeconds: DEFAULT_GAME_SETTINGS.turnTimeoutSeconds,
    auctionEnabled: DEFAULT_GAME_SETTINGS.auctionEnabled,
    freeParkingJackpot: DEFAULT_GAME_SETTINGS.freeParkingJackpot
  });

  // Preload active world sprites (e.g., VALORANT custom 3D agent PNGs)
  useEffect(() => {
    preloadWorldTokenImages(themeConfig.tokens);
  }, [themeConfig.tokens]);

  // Detect invite URL ?room=XYZ
  useEffect(() => {
    if (previewInitialJoinCode) return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCode(extractRoomCode(roomParam));
      setActivePanel('join');
    }
  }, [previewInitialJoinCode]);

  const handleSelectWorld = (world: WorldThemeId) => {
    soundEngine.play('ui_click', world);
    setInternalWorld(world);
    savePreferredWorld(world);
    onChangeWorld?.(world);

    // Ensure session token maps smoothly into the newly previewed world
    const nextTheme = getThemeConfig(world);
    if (!nextTheme.tokens.some(t => t.id === session.token)) {
      updateSession({ token: nextTheme.tokens[0].id });
    }
  };

  const activeToken = useMemo(() => {
    return (
      themeConfig.tokens.find(t => t.id === session.token) ?? themeConfig.tokens[0]
    );
  }, [themeConfig.tokens, session.token]);

  const nameValidation = useMemo(() => validateNickname(session.nickname), [session.nickname]);
  const cleanJoinCode = useMemo(() => extractRoomCode(joinCode), [joinCode]);
  const joinCodeValid = cleanJoinCode.length === 6;

  const displayedError = localError || ctxError;

  const dismissAllErrors = () => {
    setLocalError(null);
    clearError();
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    dismissAllErrors();
    if (!nameValidation.valid) {
      setLocalError(nameValidation.error || 'Enter a valid player name.');
      return;
    }

    updateSession({ nickname: nameValidation.trimmed, token: activeToken.id });
    setSubmittingMode('creating');
    const ok = await createRoom({
      ...createSettings,
      theme: activeWorld
    });
    if (!ok) {
      setSubmittingMode(null);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dismissAllErrors();
    if (!nameValidation.valid) {
      setLocalError(nameValidation.error || 'Enter a valid player name.');
      return;
    }
    if (!joinCodeValid) {
      setLocalError('Room codes are 6 alphanumeric characters (e.g., TY4K9P).');
      return;
    }

    updateSession({ nickname: nameValidation.trimmed, token: activeToken.id });
    setSubmittingMode('joining');
    const ok = await joinRoom(cleanJoinCode);
    if (!ok) {
      setSubmittingMode(null);
    }
  };

  const handlePasteCode = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      const extracted = extractRoomCode(clip);
      if (extracted) {
        setJoinCode(extracted);
        setLocalError(null);
      }
    } catch {
      // Clipboard API unavailable — user can paste directly into input
    }
  };

  const isChamfered = themeConfig.chamfered;
  const headingTransform = themeConfig.fonts.headingUppercase ? 'uppercase' : 'none';
  const effectiveConnStatus = previewConnectionLost ? 'DISCONNECTED' : connectionStatus;

  return (
    <div
      data-theme={themeConfig.id}
      data-testid="landing-page"
      style={cssVars}
      className="tv-pregame-shell relative flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      {/* Animated 2.5D Board Preview Backdrop (auto-pauses on hidden tab & reduced motion) */}
      <HeroBoardBackdrop themeConfig={themeConfig} />

      {/* Connection Lost / Reconnecting Banner */}
      <div className="relative z-20 px-4 sm:px-6 pt-2">
        <ConnectionStatusBanner
          status={effectiveConnStatus}
          themeConfig={themeConfig}
          onRetry={retryConnection}
        />
      </div>

      {/* Main Single-Viewport Responsive Content */}
      <div className="relative z-10 flex-1 min-h-0 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5 flex flex-col justify-center gap-4 overflow-y-auto tv-hud-scroll">
        {/* Global / Validation Error Alert */}
        {displayedError && (
          <div
            role="alert"
            data-testid="landing-error-banner"
            style={{
              backgroundColor: 'rgba(153, 27, 27, 0.3)',
              borderColor: 'rgba(239, 68, 68, 0.65)',
              borderRadius: isChamfered ? '0px' : '4px'
            }}
            className="max-w-3xl px-3.5 py-2 border text-rose-100 text-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              <span className="font-medium truncate">{displayedError}</span>
            </div>
            <button
              type="button"
              onClick={dismissAllErrors}
              aria-label="Dismiss error"
              className="p-1 text-rose-200 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Two-Zone Asymmetric Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-8 items-stretch">
          {/* LEFT ZONE (7 cols): Brand Identity, 4-World Selector & 3 Main Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            {/* Hero Title & Tagline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent) 16%, var(--board))',
                    borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)',
                    color: 'var(--accent)',
                    borderRadius: isChamfered ? '0px' : '9999px'
                  }}
                  className="px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  2–6 Players · Real-Time Tabletop
                </span>
                <span className="text-[11px] opacity-65 hidden sm:inline">
                  Zero sign-up · Instant invite link
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    textTransform: headingTransform
                  }}
                  className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-wide leading-[1.06]"
                >
                  TYCOON<span style={{ color: 'var(--accent)' }}>VALE</span>
                </h1>
                {activeWorld === 'wompwomp' && (
                  <div
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--tile) 85%, var(--bg))',
                      borderColor: 'var(--accent)',
                      borderRadius: '9999px'
                    }}
                    className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 border shadow-md"
                  >
                    <img
                      src="/tokens/wompwomp/peach.png"
                      alt=""
                      draggable={false}
                      className="w-6 h-6 object-contain"
                    />
                    <span
                      style={{ fontFamily: 'var(--font-heading)', color: '#FFF7F2' }}
                      className="text-xs font-bold tracking-wide"
                    >
                      World<span style={{ color: '#FF8AB8' }}>Womp</span>
                      <span style={{ color: '#C49BFF' }}>Womp</span>
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm sm:text-base opacity-80 max-w-xl leading-snug">
                {activeWorld === 'wompwomp'
                  ? 'Bounce across cozy pastel streets, host chaotic WompWomp auctions, and collect adorable 3D mascot buddies with friends.'
                  : 'Acquire prime districts, spark live property auctions, and outlast rival syndicates across five distinct 2.5D tabletop worlds.'}
              </p>
            </div>

            {/* Four Distinct Game Worlds Selector */}
            <WorldSelector
              selectedWorld={activeWorld}
              onSelectWorld={handleSelectWorld}
              canEdit={true}
              layout="gallery"
            />

            {/* Main Actions Row (3 Visually Distinct Actions) */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. CREATE ROOM (Primary CTA) */}
                <button
                  type="button"
                  data-testid="landing-create-btn"
                  onClick={() => {
                    dismissAllErrors();
                    if (activePanel === 'create') {
                      void handleCreateSubmit();
                    } else {
                      soundEngine.play('ui_click', activeWorld);
                      setActivePanel('create');
                    }
                  }}
                  disabled={Boolean(submittingMode)}
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  className="tv-hud-btn tv-hud-btn-primary px-5 py-2.5 text-xs sm:text-sm uppercase tracking-[0.14em]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{activePanel === 'create' ? `Launch ${themeConfig.name} Room` : 'Create Room'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* 2. JOIN ROOM (Secondary Distinct Action) */}
                <button
                  type="button"
                  data-testid="landing-join-btn"
                  onClick={() => {
                    soundEngine.play('ui_click', activeWorld);
                    dismissAllErrors();
                    setActivePanel(prev => (prev === 'join' ? 'idle' : 'join'));
                  }}
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  style={
                    activePanel === 'join'
                      ? {
                          borderColor: 'var(--accent)',
                          backgroundColor: 'color-mix(in srgb, var(--accent) 18%, var(--bg))'
                        }
                      : undefined
                  }
                  className="tv-hud-btn tv-hud-btn-secondary px-4 py-2.5 text-xs sm:text-sm uppercase tracking-[0.12em]"
                >
                  <KeyRound className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span>Join Room</span>
                </button>

                {/* 3. HOW TO PLAY (Subtle Utility Action) */}
                <button
                  type="button"
                  data-testid="landing-rules-btn"
                  onClick={() => {
                    soundEngine.play('ui_click', activeWorld);
                    onOpenRules();
                  }}
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  className="tv-hud-btn px-3.5 py-2.5 text-xs uppercase tracking-[0.12em] opacity-80 hover:opacity-100 border border-transparent hover:border-white/15"
                >
                  <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span>How to Play</span>
                </button>
              </div>

              {/* Contextual Action Panel: Create Room Quick Config OR Join Room Code Entry */}
              {activePanel === 'create' && (
                <form
                  onSubmit={handleCreateSubmit}
                  data-testid="create-room-panel"
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  className="tv-pregame-surface p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                      <span
                        style={{ fontFamily: 'var(--font-heading)', textTransform: headingTransform }}
                        className="text-xs font-bold tracking-wider truncate"
                      >
                        New {themeConfig.name} Room
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateOptions(prev => !prev)}
                      className="tv-hud-focus inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-75 hover:opacity-100"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{showCreateOptions ? 'Hide Rules' : 'Quick Rules'}</span>
                    </button>
                  </div>

                  {/* Summary chips of real supported settings */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 bg-black/30 border border-white/10 font-semibold">
                      Up to {createSettings.maxPlayers} Players
                    </span>
                    <span className="px-2 py-0.5 bg-black/30 border border-white/10 font-semibold tabular-nums">
                      Start {themeConfig.currencySymbol}
                      {createSettings.startingBalance}
                    </span>
                    <span className="px-2 py-0.5 bg-black/30 border border-white/10 font-semibold tabular-nums">
                      {createSettings.turnTimeoutSeconds}s Turn
                    </span>
                    <span className="px-2 py-0.5 bg-black/30 border border-white/10 font-semibold">
                      Auctions {createSettings.auctionEnabled ? 'On' : 'Off'}
                    </span>
                  </div>

                  {showCreateOptions && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <label className="space-y-1">
                        <span className="opacity-70 block text-[10px] uppercase">Max Players</span>
                        <div className="flex gap-1">
                          {[2, 4, 6].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCreateSettings(s => ({ ...s, maxPlayers: n }))}
                              style={{
                                backgroundColor:
                                  createSettings.maxPlayers === n ? 'var(--accent)' : 'var(--bg)',
                                color:
                                  createSettings.maxPlayers === n
                                    ? activeWorld === 'valorant'
                                      ? '#FFFFFF'
                                      : '#0B1218'
                                    : 'var(--board-ink)',
                                borderColor: 'var(--tile-border)'
                              }}
                              className="flex-1 py-1 border text-[10px] font-bold"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </label>

                      <label className="space-y-1">
                        <span className="opacity-70 block text-[10px] uppercase">Starting Cash</span>
                        <div className="flex gap-1">
                          {[1500, 2000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setCreateSettings(s => ({ ...s, startingBalance: amt }))}
                              style={{
                                backgroundColor:
                                  createSettings.startingBalance === amt ? 'var(--accent)' : 'var(--bg)',
                                color:
                                  createSettings.startingBalance === amt
                                    ? activeWorld === 'valorant'
                                      ? '#FFFFFF'
                                      : '#0B1218'
                                    : 'var(--board-ink)',
                                borderColor: 'var(--tile-border)'
                              }}
                              className="flex-1 py-1 border text-[10px] font-bold tabular-nums"
                            >
                              {themeConfig.currencySymbol}
                              {amt}
                            </button>
                          ))}
                        </div>
                      </label>

                      <label className="space-y-1">
                        <span className="opacity-70 block text-[10px] uppercase">Turn Timer</span>
                        <div className="flex gap-1">
                          {[30, 45, 60].map(sec => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => setCreateSettings(s => ({ ...s, turnTimeoutSeconds: sec }))}
                              style={{
                                backgroundColor:
                                  createSettings.turnTimeoutSeconds === sec ? 'var(--accent)' : 'var(--bg)',
                                color:
                                  createSettings.turnTimeoutSeconds === sec
                                    ? activeWorld === 'valorant'
                                      ? '#FFFFFF'
                                      : '#0B1218'
                                    : 'var(--board-ink)',
                                borderColor: 'var(--tile-border)'
                              }}
                              className="flex-1 py-1 border text-[10px] font-bold tabular-nums"
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[10px] opacity-65">
                      You can adjust all match rules inside the lobby.
                    </span>
                    <button
                      type="submit"
                      data-testid="confirm-create-room-btn"
                      disabled={!nameValidation.valid || Boolean(submittingMode)}
                      data-chamfered={isChamfered ? 'true' : 'false'}
                      className="tv-hud-btn tv-hud-btn-primary px-4 py-1.5 text-[11px] uppercase tracking-wider"
                    >
                      <span>Create & Enter Lobby</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {activePanel === 'join' && (
                <form
                  onSubmit={handleJoinSubmit}
                  data-testid="join-room-panel"
                  data-chamfered={isChamfered ? 'true' : 'false'}
                  className="tv-pregame-surface p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="join-room-code-input"
                      style={{ fontFamily: 'var(--font-heading)', textTransform: headingTransform }}
                      className="text-xs font-bold tracking-wider"
                    >
                      Enter 6-Character Room Code
                    </label>
                    <button
                      type="button"
                      onClick={() => void handlePasteCode()}
                      className="tv-hud-focus inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-75 hover:opacity-100"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span>Paste</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="join-room-code-input"
                      type="text"
                      value={cleanJoinCode}
                      onChange={e => {
                        setJoinCode(extractRoomCode(e.target.value));
                        if (localError) setLocalError(null);
                      }}
                      onPaste={e => {
                        const pasted = e.clipboardData.getData('text');
                        const extracted = extractRoomCode(pasted);
                        if (extracted) {
                          e.preventDefault();
                          setJoinCode(extracted);
                          setLocalError(null);
                        }
                      }}
                      placeholder="A7K9P2"
                      maxLength={6}
                      autoComplete="off"
                      spellCheck={false}
                      data-testid="join-code-input"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg) 92%, #000000)',
                        borderColor:
                          cleanJoinCode.length > 0 && !joinCodeValid
                            ? 'rgba(245, 158, 11, 0.7)'
                            : joinCodeValid
                            ? 'var(--accent)'
                            : 'color-mix(in srgb, var(--tile-border) 65%, transparent)',
                        color: 'var(--accent)',
                        borderRadius: 'var(--radius-button)'
                      }}
                      className="tv-hud-focus flex-1 border px-3.5 py-2 font-mono font-extrabold text-base tracking-[0.28em] uppercase text-center placeholder:opacity-30"
                    />
                    <button
                      type="submit"
                      data-testid="confirm-join-room-btn"
                      disabled={!joinCodeValid || !nameValidation.valid || Boolean(submittingMode)}
                      data-chamfered={isChamfered ? 'true' : 'false'}
                      className="tv-hud-btn tv-hud-btn-primary px-5 py-2.5 text-xs uppercase tracking-wider"
                    >
                      <span>Join</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className={cleanJoinCode.length > 0 && !joinCodeValid ? 'text-amber-300' : 'opacity-65'}>
                      {cleanJoinCode.length === 0
                        ? 'Paste a 6-character code or full invite link.'
                        : joinCodeValid
                        ? 'Code format valid — ready to join.'
                        : `${6 - cleanJoinCode.length} more character${6 - cleanJoinCode.length === 1 ? '' : 's'} needed.`}
                    </span>
                    <span className="font-mono opacity-55">{cleanJoinCode.length}/6</span>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT ZONE (5 cols): Connected Player Identity & Live Collectible Pedestal */}
          <div
            data-testid="player-identity-card"
            data-chamfered={isChamfered ? 'true' : 'false'}
            className="lg:col-span-5 tv-pregame-surface p-4 flex flex-col justify-between gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)', textTransform: headingTransform }}
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
              >
                Player Identity
              </span>
              <span className="text-[10px] opacity-65">Saved locally</span>
            </div>

            {/* Live Selected Token Showcase Pedestal */}
            <div
              data-world={themeConfig.id}
              className={`tv-showcase-stage px-4 py-3 min-h-[188px] xl:min-h-[215px] justify-between ${
                activeWorld === 'valorant' ? 'tv-val-brackets' : ''
              }`}
            >
              <div className="w-full flex items-center justify-between text-[10px] z-10">
                <span className="uppercase tracking-[0.16em] opacity-65 font-bold">
                  {themeConfig.name}
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold opacity-90">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/40"
                    style={{ backgroundColor: session.color }}
                  />
                  <span>{activeToken.name}</span>
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-1 relative z-10">
                {activeToken.imageSrc ? (
                  <img
                    src={activeToken.imageSrc}
                    alt={activeToken.name}
                    draggable={false}
                    className="w-32 h-32 xl:w-36 xl:h-36 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.72)]"
                  />
                ) : (
                  <div className="p-2">
                    <WorldTokenIcon
                      tokenId={activeToken.id}
                      tokenDef={activeToken}
                      worldId={themeConfig.id}
                      color={session.color}
                      size={92}
                    />
                  </div>
                )}
                <div className="tv-figurine-shadow" aria-hidden="true" />
                <div className="tv-pedestal-base" aria-hidden="true" />
              </div>

              <div className="w-full text-center z-10">
                <div
                  style={{ fontFamily: 'var(--font-heading)', textTransform: headingTransform }}
                  className="text-sm font-extrabold tracking-wider truncate"
                >
                  {nameValidation.trimmed || 'Unnamed Challenger'}
                </div>
              </div>
            </div>

            {/* Player Name Input (Required, Trimmed, 2-16 chars, localStorage) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="player-name-input"
                  className="text-[11px] font-bold uppercase tracking-wider opacity-85"
                >
                  Display Name
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    nameValidation.valid ? 'opacity-60' : 'text-amber-300'
                  }`}
                >
                  {session.nickname.trim().length}/16
                </span>
              </div>
              <input
                id="player-name-input"
                type="text"
                value={session.nickname}
                onChange={e => {
                  updateSession({ nickname: e.target.value.slice(0, 16) });
                  if (localError) setLocalError(null);
                }}
                onBlur={() => {
                  const trimmed = session.nickname.trim();
                  if (trimmed !== session.nickname) {
                    updateSession({ nickname: trimmed });
                  }
                }}
                maxLength={16}
                placeholder="Enter your name..."
                data-testid="player-name-input"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--bg) 92%, #000000)',
                  borderColor: nameValidation.valid
                    ? 'color-mix(in srgb, var(--tile-border) 65%, transparent)'
                    : 'rgba(245, 158, 11, 0.7)',
                  color: 'var(--board-ink)',
                  borderRadius: 'var(--radius-button)'
                }}
                className="tv-hud-focus w-full border px-3 py-2 text-sm font-semibold placeholder:opacity-40"
              />
              {!nameValidation.valid && (
                <p className="text-[10px] text-amber-300">{nameValidation.error}</p>
              )}
            </div>

            {/* Quick 6-Token Selector Strip for Active World */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="uppercase tracking-wider font-bold opacity-75">
                  {activeWorld === 'valorant'
                    ? 'Starting Agent'
                    : activeWorld === 'wompwomp'
                    ? 'Starting Mascot'
                    : 'Starting Token'}
                </span>
                <span className="opacity-60">Change anytime in lobby</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {themeConfig.tokens.map(tok => {
                  const isSelected = tok.id === activeToken.id;
                  return (
                    <button
                      key={tok.id}
                      type="button"
                      onClick={() => {
                        soundEngine.play('ui_click', activeWorld);
                        updateSession({ token: tok.id });
                      }}
                      title={tok.name}
                      aria-label={`Select ${tok.name}`}
                      aria-pressed={isSelected}
                      data-testid={`landing-token-${tok.id}`}
                      style={{
                        backgroundColor: isSelected
                          ? `color-mix(in srgb, ${tok.frameColor} 24%, var(--bg))`
                          : 'color-mix(in srgb, var(--bg) 84%, var(--board))',
                        borderColor: isSelected
                          ? 'var(--accent)'
                          : 'color-mix(in srgb, var(--tile-border) 48%, transparent)',
                        borderRadius: isChamfered ? '0px' : '4px'
                      }}
                      className="tv-hud-focus relative aspect-square border p-1 flex items-center justify-center transition hover:brightness-110"
                    >
                      {tok.imageSrc ? (
                        <img
                          src={tok.imageSrc}
                          alt={tok.name}
                          draggable={false}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <WorldTokenIcon
                          tokenId={tok.id}
                          tokenDef={tok}
                          worldId={themeConfig.id}
                          color={session.color}
                          size={28}
                        />
                      )}
                      {isSelected && (
                        <span
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: activeWorld === 'valorant' ? '#FFFFFF' : '#0B1218'
                          }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-2 h-2" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player Seal Color Swatches */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Color Seal
              </span>
              <div className="flex items-center gap-1.5">
                {ACCESSIBLE_PLAYER_COLORS.map(spec => {
                  const active = spec.hex.toLowerCase() === session.color.toLowerCase();
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => updateSession({ color: spec.hex })}
                      title={spec.name}
                      aria-label={`Color ${spec.name}`}
                      style={{
                        backgroundColor: spec.hex,
                        boxShadow: active ? `0 0 0 2px var(--bg), 0 0 0 3.5px ${spec.hex}` : undefined
                      }}
                      className={`tv-hud-focus w-4 h-4 rounded-full transition-transform ${
                        active ? 'scale-110' : 'opacity-75 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Creation / Joining Transition Overlay */}
      <LaunchTransitionOverlay
        visible={Boolean(submittingMode)}
        mode={submittingMode ?? 'creating'}
        themeConfig={themeConfig}
        subtitle={
          submittingMode === 'joining'
            ? `Joining room ${cleanJoinCode}...`
            : `Initializing ${themeConfig.name} table...`
        }
      />
    </div>
  );
};
