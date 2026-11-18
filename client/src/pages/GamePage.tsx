import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getTileById } from '@tycoonvale/shared';
import { useGame } from '../context/GameContext.js';
import { GameBoard } from '../components/Board/GameBoard.js';
import { PlayerPanel } from '../components/HUD/PlayerPanel.js';
import { ChatBox } from '../components/HUD/ChatBox.js';
import { GameInfoCard } from '../components/HUD/GameInfoCard.js';
import { TurnActionBar } from '../components/HUD/TurnActionBar.js';
import { ToastStack } from '../components/HUD/ToastStack.js';
import { PropertyDetailModal } from '../components/Modals/PropertyDetailModal.js';
import { AuctionModal } from '../components/Modals/AuctionModal.js';
import { TradeModal } from '../components/Modals/TradeModal.js';
import { CardModal } from '../components/Modals/CardModal.js';
import { GameOverModal } from '../components/Modals/GameOverModal.js';
import { SoundPreviewPanel } from '../components/HUD/SoundPreviewPanel.js';
import type { TradeDraft } from '../services/tradeValidation.js';
import { getThemeConfig, getThemeCssVars } from '../themes/index.js';
import { soundEngine } from '../services/audio.js';
import {
  loadHudPreferences,
  saveHudPreferences,
  type HudPreferences
} from '../services/hudPreferences.js';
import { useHudToasts } from '../hooks/useHudToasts.js';
import { Users, MessageSquare, LayoutGrid } from 'lucide-react';

export interface GamePageProps {
  onOpenRules?: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onOpenRules }) => {
  const {
    gameState,
    player,
    isConnected,
    isRolling,
    error,
    setSelectedTile,
    setIsTradeModalOpen,
    unreadChatCount,
    resetUnreadChatCount,
    rollDice,
    buyProperty,
    declineProperty,
    endTurn,
    buildHouse,
    sellHouse,
    mortgageProperty,
    unmortgageProperty,
    acceptTrade,
    rejectTrade,
    payJailFine,
    useJailCard,
    leaveRoom
  } = useGame();

  const [mobileTab, setMobileTab] = useState<'board' | 'players' | 'chat'>('board');
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [pinnedPlayerId, setPinnedPlayerId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<HudPreferences>(() => loadHudPreferences());
  const [counterDraft, setCounterDraft] = useState<Partial<TradeDraft> | null>(null);
  const [isSoundLabOpen, setIsSoundLabOpen] = useState<boolean>(false);

  // Sync persisted audio preferences & active world character with SoundEngine
  useEffect(() => {
    soundEngine.setMuted(!prefs.soundEnabled);
    soundEngine.setVolume(prefs.volume);
  }, [prefs.soundEnabled, prefs.volume]);

  const worldIdForAudio = gameState ? getThemeConfig(gameState.settings.theme).id : 'original';
  useEffect(() => {
    soundEngine.setWorld(worldIdForAudio);
  }, [worldIdForAudio]);

  // Dev keyboard shortcut (Alt+Shift+S) to toggle Sound Preview Panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSoundLabOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Sound hooks for live game state transitions (turn start, incoming trade, match end, error)
  const prevTurnPlayerRef = useRef<string | null>(null);
  const prevTradeIdRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!gameState || !player) return;

    // Turn start sound when turn passes to local player
    const currActive = gameState.turn.activePlayerId;
    if (prevTurnPlayerRef.current && prevTurnPlayerRef.current !== currActive && currActive === player.id) {
      soundEngine.play('turn_start', worldIdForAudio);
    }
    prevTurnPlayerRef.current = currActive;

    // Incoming trade notification + sound
    const currTrade = gameState.activeTrade;
    if (
      currTrade &&
      currTrade.status === 'pending' &&
      currTrade.id !== prevTradeIdRef.current &&
      currTrade.targetId === player.id
    ) {
      soundEngine.play('trade_received', worldIdForAudio);
    }
    prevTradeIdRef.current = currTrade?.id ?? null;

    // Match win sound
    if (prevPhaseRef.current && prevPhaseRef.current !== 'ENDED' && gameState.phase === 'ENDED') {
      soundEngine.play('win', worldIdForAudio);
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState, player, worldIdForAudio]);

  useEffect(() => {
    if (error) {
      soundEngine.play('error', worldIdForAudio);
    }
  }, [error, worldIdForAudio]);

  const handleUpdatePrefs = useCallback((patch: Partial<HudPreferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      saveHudPreferences(next);
      return next;
    });
  }, []);

  const handleTogglePinPlayer = useCallback((pid: string) => {
    setPinnedPlayerId(prev => (prev === pid ? null : pid));
  }, []);

  // Auto-open the property card popup when the local player lands on an unowned buyable tile
  const lastPromptedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!gameState || !player) return;
    const isMyTurn = gameState.turn.activePlayerId === player.id;
    const pendingId = gameState.turn.pendingTileId ?? player.position;
    if (isMyTurn && gameState.turn.mustResolveTile && pendingId !== undefined) {
      const tile = getTileById(pendingId);
      const prop = gameState.properties[pendingId];
      const promptKey = `${gameState.revision}-${pendingId}`;
      if (tile?.price && !prop?.ownerId && lastPromptedRef.current !== promptKey) {
        lastPromptedRef.current = promptKey;
        setSelectedTile(tile);
      }
    } else {
      lastPromptedRef.current = null;
    }
  }, [gameState, player, setSelectedTile]);

  const { toasts, dismissToast } = useHudToasts(gameState?.activityLogs, error);

  if (!gameState) return null;

  const worldTheme = getThemeConfig(gameState.settings.theme);
  const cssVars = getThemeCssVars(worldTheme);
  const activeHighlightId = hoveredPlayerId ?? pinnedPlayerId;

  return (
    <div
      data-theme={worldTheme.id}
      style={{ ...cssVars, backgroundColor: 'var(--bg)', color: 'var(--board-ink)' }}
      className="h-screen w-full overflow-hidden p-2 flex flex-col gap-2"
    >
      {/* Mobile / Tablet Compact Switcher Bar */}
      <div
        style={{ backgroundColor: 'var(--board)', borderColor: 'var(--tile-border)', borderRadius: 'var(--radius-tile)' }}
        className="flex lg:hidden border p-1 gap-1 shrink-0"
      >
        <button
          type="button"
          onClick={() => setMobileTab('board')}
          style={
            mobileTab === 'board'
              ? { backgroundColor: 'var(--accent)', color: '#0B1218', borderRadius: 'var(--radius-button)' }
              : { color: 'var(--board-ink)', borderRadius: 'var(--radius-button)' }
          }
          className="tv-hud-focus flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Board</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('players')}
          style={
            mobileTab === 'players'
              ? { backgroundColor: 'var(--accent)', color: '#0B1218', borderRadius: 'var(--radius-button)' }
              : { color: 'var(--board-ink)', borderRadius: 'var(--radius-button)' }
          }
          className="tv-hud-focus flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Players</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileTab('chat');
            resetUnreadChatCount();
          }}
          style={
            mobileTab === 'chat'
              ? { backgroundColor: 'var(--accent)', color: '#0B1218', borderRadius: 'var(--radius-button)' }
              : { color: 'var(--board-ink)', borderRadius: 'var(--radius-button)' }
          }
          className="tv-hud-focus flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          {unreadChatCount > 0 && mobileTab !== 'chat' && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* Three-Zone In-Game Layout: Left (Info + Chat), Center (Turn HUD + Board), Right (Players + Trades + My Properties) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 items-stretch">
        {/* LEFT COLUMN: Game Info & Chat */}
        <div
          className={`lg:w-[244px] xl:w-[274px] 2xl:w-[304px] shrink-0 flex flex-col gap-2 min-h-0 ${
            mobileTab === 'chat' ? 'flex flex-1 lg:flex-none' : 'hidden lg:flex'
          }`}
        >
          <GameInfoCard
            roomCode={gameState.roomCode}
            themeConfig={worldTheme}
            isConnected={isConnected}
            jackpotPool={gameState.jackpotPool}
            preferences={prefs}
            onUpdatePreferences={handleUpdatePrefs}
            onLeaveGame={leaveRoom}
            onOpenRules={onOpenRules}
          />

          <ChatBox
            gameState={gameState}
            localPlayer={player}
            themeConfig={worldTheme}
            isCollapsed={!prefs.chatVisible}
            onToggleCollapse={() => handleUpdatePrefs({ chatVisible: !prefs.chatVisible })}
            unreadCount={unreadChatCount}
            onResetUnread={resetUnreadChatCount}
          />
        </div>

        {/* CENTER COLUMN: Contextual Turn & Action HUD + Existing 2.5D GameBoard */}
        <div
          className={`flex-1 min-w-0 min-h-0 flex flex-col items-center justify-between gap-1.5 ${
            mobileTab === 'board' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="relative z-40 w-full flex justify-center shrink-0">
            <TurnActionBar
              gameState={gameState}
              localPlayer={player}
              themeConfig={worldTheme}
              isRolling={isRolling}
              onRollDice={rollDice}
              onBuyProperty={buyProperty}
              onDeclineProperty={declineProperty}
              onEndTurn={endTurn}
              onPayJailFine={payJailFine}
              onUseJailCard={useJailCard}
              onInspectTile={tileId => setSelectedTile(getTileById(tileId))}
              onOpenTrade={() => setIsTradeModalOpen(true)}
            />
          </div>

          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-visible">
            <GameBoard highlightedPlayerId={activeHighlightId} />
          </div>
        </div>

        {/* RIGHT COLUMN: Players (with timer ring, status pills, delta cash), Trades Hook & My Properties */}
        <div
          className={`lg:w-[254px] xl:w-[284px] 2xl:w-[316px] shrink-0 min-h-0 ${
            mobileTab === 'players' ? 'flex flex-1 lg:flex-none' : 'hidden lg:flex'
          }`}
        >
          <PlayerPanel
            gameState={gameState}
            localPlayerId={player?.id}
            themeConfig={worldTheme}
            hoveredPlayerId={hoveredPlayerId}
            pinnedPlayerId={pinnedPlayerId}
            onHoverPlayer={setHoveredPlayerId}
            onTogglePinPlayer={handleTogglePinPlayer}
            onSelectTile={tileId => setSelectedTile(getTileById(tileId))}
            onOpenTrade={() => {
              setCounterDraft(null);
              setIsTradeModalOpen(true);
            }}
            onAcceptTrade={() => {
              soundEngine.play('trade_accepted', worldTheme.id);
              acceptTrade();
            }}
            onRejectTrade={() => {
              soundEngine.play('ui_click', worldTheme.id);
              rejectTrade();
            }}
            onCounterTrade={() => {
              if (!gameState.activeTrade) return;
              setCounterDraft({
                targetId: gameState.activeTrade.initiatorId,
                offerCash: gameState.activeTrade.requestCash,
                requestCash: gameState.activeTrade.offerCash,
                offerPropertyIds: [...gameState.activeTrade.requestPropertyIds],
                requestPropertyIds: [...gameState.activeTrade.offerPropertyIds]
              });
              setIsTradeModalOpen(true);
            }}
            onBuildHouse={buildHouse}
            onSellHouse={sellHouse}
            onMortgageProperty={mortgageProperty}
            onUnmortgageProperty={unmortgageProperty}
          />
        </div>
      </div>

      {/* Corner Event Toasts (max 3, auto-dismiss) */}
      <ToastStack toasts={toasts} themeConfig={worldTheme} onDismiss={dismissToast} />

      {/* Interactive Modals */}
      <PropertyDetailModal />
      <CardModal />
      <GameOverModal />
      <AuctionModal />
      <TradeModal
        initialDraft={counterDraft}
        onClose={() => {
          setCounterDraft(null);
          setIsTradeModalOpen(false);
        }}
      />
      <SoundPreviewPanel
        isOpen={isSoundLabOpen}
        initialWorld={worldTheme.id}
        themeConfig={worldTheme}
        onClose={() => setIsSoundLabOpen(false)}
      />
    </div>
  );
};
