import React, { useState, useMemo } from 'react';
import {
  DEFAULT_GAME_SETTINGS,
  type GameSettings,
  type GameState,
  type Player,
  type WorldThemeId
} from '@tycoonvale/shared';
import type { RealtimeConnectionStatus } from '../../services/supabase/realtime.js';
import {
  ACCESSIBLE_PLAYER_COLORS,
  getThemeConfig,
  getThemeCssVars
} from '../../themes/index.js';
import { Navbar } from '../Navbar.js';
import { LandingPage } from '../../pages/LandingPage.js';
import { LobbyPage } from '../../pages/LobbyPage.js';
import { HowToPlayModal } from '../Modals/HowToPlayModal.js';

export interface PregamePreviewProps {
  mode: string;
  initialWorld: WorldThemeId;
  asGuest?: boolean;
  disconnected?: boolean;
  openRules?: boolean;
  invalidCode?: boolean;
}

function buildSimulatedLobbyState(world: WorldThemeId, includeUnready: boolean): GameState {
  const theme = getThemeConfig(world);
  const tokens = theme.tokens;
  const now = Date.now();

  const players: Player[] = [
    {
      id: 'sim-p1',
      sessionId: 'sim-p1',
      socketId: '',
      nickname: 'Aria',
      avatar: 'avatar-tycoon',
      token: tokens[0].id,
      color: ACCESSIBLE_PLAYER_COLORS[0].hex,
      team: 'gold',
      position: 0,
      balance: 1500,
      netWorth: 1500,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: true,
      isReady: true,
      isDisconnected: false,
      properties: []
    },
    {
      id: 'sim-p2',
      sessionId: 'sim-p2',
      socketId: '',
      nickname: 'Viper',
      avatar: 'avatar-tycoon',
      token: tokens[1].id,
      color: ACCESSIBLE_PLAYER_COLORS[1].hex,
      team: 'silver',
      position: 0,
      balance: 1500,
      netWorth: 1500,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false,
      properties: []
    },
    {
      id: 'sim-p3',
      sessionId: 'sim-p3',
      socketId: '',
      nickname: 'Kabir',
      avatar: 'avatar-tycoon',
      token: tokens[2].id,
      color: ACCESSIBLE_PLAYER_COLORS[2].hex,
      team: 'gold',
      position: 0,
      balance: 1500,
      netWorth: 1500,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: false,
      isReady: !includeUnready,
      isDisconnected: false,
      properties: []
    },
    {
      id: 'sim-p4',
      sessionId: 'sim-p4',
      socketId: '',
      nickname: 'Nova',
      avatar: 'avatar-tycoon',
      token: tokens[3].id,
      color: ACCESSIBLE_PLAYER_COLORS[3].hex,
      team: 'silver',
      position: 0,
      balance: 1500,
      netWorth: 1500,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false,
      properties: []
    }
  ];

  return {
    roomCode: 'TV7K9P',
    phase: 'LOBBY',
    hostId: 'sim-p1',
    players,
    properties: {},
    turn: {
      activePlayerId: 'sim-p1',
      turnIndex: 0,
      rollState: 'CAN_ROLL',
      consecutiveDoubles: 0,
      rolledDouble: false,
      dice: [1, 1],
      canEndTurn: false,
      canRoll: true,
      mustResolveTile: false,
      turnTimerSeconds: 45
    },
    auction: null,
    activeTrade: null,
    activityLogs: [
      {
        id: 'log-1',
        timestamp: now - 35000,
        text: 'Table TV7K9P created. Awaiting challengers.',
        type: 'system'
      },
      {
        id: 'log-2',
        timestamp: now - 24000,
        text: 'Viper has taken a seat at the table.',
        type: 'system'
      },
      {
        id: 'log-3',
        timestamp: now - 16000,
        text: 'Kabir has taken a seat at the table.',
        type: 'system'
      },
      {
        id: 'log-4',
        timestamp: now - 8000,
        text: 'Nova has taken a seat at the table.',
        type: 'system'
      }
    ],
    chatMessages: [
      {
        id: 'chat-1',
        senderId: 'sim-p2',
        senderName: 'Viper',
        senderAvatar: 'avatar-tycoon',
        senderColor: ACCESSIBLE_PLAYER_COLORS[1].hex,
        text: 'Locked in and ready for round one.',
        timestamp: now - 12000
      },
      {
        id: 'chat-2',
        senderId: 'sim-p4',
        senderName: 'Nova',
        senderAvatar: 'avatar-tycoon',
        senderColor: ACCESSIBLE_PLAYER_COLORS[3].hex,
        text: 'Picking my character — almost set!',
        timestamp: now - 5000
      }
    ],
    settings: {
      ...DEFAULT_GAME_SETTINGS,
      theme: world
    },
    jackpotPool: 0,
    winner: null,
    revision: 1
  };
}

/**
 * Clearly labeled visual preview harness (`?previewPregame=...`) used for deterministic
 * visual verification of 4-player lobbies, taken tokens, error alerts, and connection-lost states.
 * Never replaces real multiplayer testing.
 */
export const PregamePreview: React.FC<PregamePreviewProps> = ({
  mode,
  initialWorld,
  asGuest = false,
  disconnected = false,
  openRules = false,
  invalidCode = false
}) => {
  const [world, setWorld] = useState<WorldThemeId>(initialWorld);
  const [isRulesOpen, setIsRulesOpen] = useState(openRules);
  const [lobbyState, setLobbyState] = useState<GameState>(() =>
    buildSimulatedLobbyState(initialWorld, mode !== 'lobby-all-ready')
  );

  const themeConfig = useMemo(() => getThemeConfig(world), [world]);
  const cssVars = useMemo(() => getThemeCssVars(themeConfig), [themeConfig]);

  if (mode === 'landing' || mode === 'invalid-code' || mode === 'connection-lost' || mode === 'rules') {
    return (
      <div
        data-theme={themeConfig.id}
        style={cssVars}
        className="h-screen w-full overflow-hidden flex flex-col"
      >
        <Navbar onOpenRules={() => setIsRulesOpen(true)} themeConfig={themeConfig} />
        <LandingPage
          onOpenRules={() => setIsRulesOpen(true)}
          selectedWorld={world}
          onChangeWorld={setWorld}
          previewInitialMode={invalidCode || mode === 'invalid-code' ? 'join' : 'idle'}
          previewInitialJoinCode={invalidCode || mode === 'invalid-code' ? 'ZZ99XX' : ''}
          previewError={
            invalidCode || mode === 'invalid-code'
              ? 'Room "ZZ99XX" was not found or has expired. Double-check the 6-character code.'
              : null
          }
          previewConnectionLost={disconnected || mode === 'connection-lost'}
        />
        <HowToPlayModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          themeConfig={themeConfig}
        />
      </div>
    );
  }

  const localPlayer = asGuest ? lobbyState.players[1] : lobbyState.players[0];
  const connStatus: RealtimeConnectionStatus = disconnected ? 'DISCONNECTED' : 'CONNECTED';

  const handleUpdateSettings = (patch: Partial<GameSettings>) => {
    setLobbyState(prev => {
      const nextTheme = (patch.theme as WorldThemeId) ?? (prev.settings.theme as WorldThemeId);
      if (patch.theme) {
        setWorld(nextTheme);
      }
      const nextThemeCfg = getThemeConfig(nextTheme);
      return {
        ...prev,
        settings: { ...prev.settings, ...patch },
        players: patch.theme
          ? prev.players.map((p, idx) => ({
              ...p,
              token: nextThemeCfg.tokens[idx % nextThemeCfg.tokens.length].id
            }))
          : prev.players
      };
    });
  };

  const handleSelectToken = (tokenId: string) => {
    setLobbyState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === localPlayer.id ? { ...p, token: tokenId } : p))
    }));
  };

  const handleSelectColor = (colorHex: string) => {
    setLobbyState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === localPlayer.id ? { ...p, color: colorHex } : p))
    }));
  };

  const handleToggleReady = (ready: boolean) => {
    setLobbyState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === localPlayer.id ? { ...p, isReady: ready } : p))
    }));
  };

  const handleSetTeam = (team: 'gold' | 'silver') => {
    setLobbyState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === localPlayer.id ? { ...p, team } : p))
    }));
  };

  const handleSendChat = (text: string, isReaction?: boolean) => {
    setLobbyState(prev => ({
      ...prev,
      chatMessages: [
        ...prev.chatMessages,
        {
          id: `sim-chat-${Date.now()}`,
          senderId: localPlayer.id,
          senderName: localPlayer.nickname,
          senderAvatar: localPlayer.avatar,
          senderColor: localPlayer.color,
          text,
          timestamp: Date.now(),
          isReaction: Boolean(isReaction)
        }
      ]
    }));
  };

  return (
    <>
      <LobbyPage
        onOpenRules={() => setIsRulesOpen(true)}
        previewGameState={lobbyState}
        previewLocalPlayer={localPlayer}
        previewConnectionStatus={connStatus}
        previewBannerLabel={`${themeConfig.name} · 4-Player Simulated Lobby${
          asGuest ? ' (Guest Read-Only View)' : ' (Host View)'
        }`}
        onPreviewUpdateSettings={handleUpdateSettings}
        onPreviewSelectToken={handleSelectToken}
        onPreviewSelectColor={handleSelectColor}
        onPreviewToggleReady={handleToggleReady}
        onPreviewSetTeam={handleSetTeam}
        onPreviewSendChat={handleSendChat}
      />
      <HowToPlayModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        themeConfig={themeConfig}
      />
    </>
  );
};
