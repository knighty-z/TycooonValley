// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DEFAULT_GAME_SETTINGS,
  getTileById,
  type GameState,
  type Player
} from '@tycoonvale/shared';
import { getThemeConfig } from '../index.js';
import { ChatBox } from '../../components/HUD/ChatBox.js';
import { TurnActionBar } from '../../components/HUD/TurnActionBar.js';
import { PlayerPanel } from '../../components/HUD/PlayerPanel.js';
import { SettingsMenu } from '../../components/HUD/SettingsMenu.js';
import { ToastStack, type HudToastItem } from '../../components/HUD/ToastStack.js';
import { PropertyDetailModal } from '../../components/Modals/PropertyDetailModal.js';
import { CardModal } from '../../components/Modals/CardModal.js';
import { GameOverModal } from '../../components/Modals/GameOverModal.js';
import { DEFAULT_HUD_PREFERENCES } from '../../services/hudPreferences.js';

function makeMockState(world: 'original' | 'valorant' | 'india' | 'cyberpunk' = 'valorant'): GameState {
  const theme = getThemeConfig(world);
  const players: Player[] = [
    {
      id: 'p1',
      sessionId: 'p1',
      socketId: '',
      nickname: 'Aria',
      avatar: 'avatar-tycoon',
      token: theme.tokens[0].id,
      color: '#38BDF8',
      balance: 1420,
      netWorth: 1840,
      position: 27,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 1,
      properties: [1, 3],
      isBankrupt: false,
      isHost: true,
      isReady: true,
      isDisconnected: false
    },
    {
      id: 'p2',
      sessionId: 'p2',
      socketId: '',
      nickname: 'Viper',
      avatar: 'avatar-tycoon',
      token: theme.tokens[1].id,
      color: '#FB7185',
      balance: 900,
      netWorth: 1200,
      position: 10,
      inJail: true,
      jailTurns: 1,
      getOutOfJailCards: 0,
      properties: [14],
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: true
    },
    {
      id: 'p3',
      sessionId: 'p3',
      socketId: '',
      nickname: 'Rohan',
      avatar: 'avatar-tycoon',
      token: theme.tokens[2].id,
      color: '#A78BFA',
      balance: 0,
      netWorth: 0,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      properties: [],
      isBankrupt: true,
      isHost: false,
      isReady: true,
      isDisconnected: false
    }
  ];

  return {
    roomCode: 'VAL999',
    phase: 'PLAYING',
    hostId: 'p1',
    settings: { ...DEFAULT_GAME_SETTINGS, theme: world },
    players,
    properties: {
      1: { tileId: 1, ownerId: 'p1', houses: 1, hotel: false, isMortgaged: false },
      3: { tileId: 3, ownerId: 'p1', houses: 1, hotel: false, isMortgaged: false },
      14: { tileId: 14, ownerId: 'p2', houses: 0, hotel: false, isMortgaged: false }
    },
    turn: {
      activePlayerId: 'p1',
      turnIndex: 0,
      rollState: 'CAN_ROLL',
      dice: [4, 2],
      rolledDouble: false,
      consecutiveDoubles: 0,
      canRoll: true,
      canEndTurn: false,
      mustResolveTile: false,
      turnTimerSeconds: 36
    },
    auction: null,
    activeTrade: null,
    winner: null,
    jackpotPool: 250,
    activityLogs: [
      { id: 'log-1', timestamp: 1000, text: 'Viper bought Lotus C Site', type: 'buy' }
    ],
    chatMessages: [
      {
        id: 'm1',
        senderId: 'p2',
        senderName: 'Viper',
        senderAvatar: 'avatar-tycoon',
        senderColor: '#FB7185',
        text: 'Good luck everyone',
        timestamp: 2000
      }
    ],
    revision: 1
  };
}

describe('Phase E — In-Game HUD, Chat, Modals, Toasts & Settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders ChatBox with player + system messages, blocks empty send, supports quick reactions & collapse unread badge', () => {
    const state = makeMockState('valorant');
    const theme = getThemeConfig('valorant');
    const onSend = vi.fn();

    const { rerender } = render(
      <ChatBox
        gameState={state}
        localPlayer={state.players[0]}
        themeConfig={theme}
        onSendChat={onSend}
      />
    );

    expect(screen.getByTestId('chat-system-message').textContent).toContain('Viper bought Lotus C Site');
    expect(screen.getByTestId('chat-player-message').textContent).toContain('Good luck everyone');

    // Empty send is blocked
    const sendBtn = screen.getByTestId('chat-send-btn') as HTMLButtonElement;
    expect(sendBtn.disabled).toBe(true);
    fireEvent.submit(sendBtn.closest('form')!);
    expect(onSend).not.toHaveBeenCalled();

    // Type message and submit
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Nice play!' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSend).toHaveBeenCalledWith('Nice play!', false);

    // Quick reaction chip sends emoji-free callout
    fireEvent.click(screen.getByTestId('quick-reaction-Clutch'));
    expect(onSend).toHaveBeenCalledWith('Clutch', true);

    // Collapsed chat shows unread count badge
    rerender(
      <ChatBox
        gameState={state}
        localPlayer={state.players[0]}
        themeConfig={theme}
        onSendChat={onSend}
        isCollapsed={true}
        unreadCount={3}
      />
    );
    expect(screen.getByTestId('chat-unread-badge').textContent).toBe('3');
  });

  it('renders TurnActionBar for Your Turn and Waiting for [Name] with contextual actions', () => {
    const state = makeMockState('cyberpunk');
    const theme = getThemeConfig('cyberpunk');
    const onRoll = vi.fn();
    const onBuy = vi.fn();
    const onDecline = vi.fn();
    const onEnd = vi.fn();

    const { rerender } = render(
      <TurnActionBar
        gameState={state}
        localPlayer={state.players[0]}
        themeConfig={theme}
        onRollDice={onRoll}
        onBuyProperty={onBuy}
        onDeclineProperty={onDecline}
        onEndTurn={onEnd}
      />
    );

    expect(screen.getByText('Your Turn')).toBeTruthy();
    expect(screen.getByTestId('turn-timer').textContent).toBe('36s');
    fireEvent.click(screen.getByTestId('hud-roll-btn'));
    expect(onRoll).toHaveBeenCalledTimes(1);

    // Switch to another player's turn
    const otherTurnState: GameState = {
      ...state,
      turn: { ...state.turn, activePlayerId: 'p2', canRoll: true }
    };
    rerender(
      <TurnActionBar
        gameState={otherTurnState}
        localPlayer={otherTurnState.players[0]}
        themeConfig={theme}
        onRollDice={onRoll}
        onBuyProperty={onBuy}
        onDeclineProperty={onDecline}
        onEndTurn={onEnd}
      />
    );
    expect(screen.getByText(/Waiting for/i)).toBeTruthy();
    expect(screen.getByText('Viper')).toBeTruthy();
    expect(screen.queryByTestId('hud-roll-btn')).toBeNull();
  });

  it('renders PlayerPanel turn timer ring and Jail / Offline / Bankrupt status indicators', () => {
    const state = makeMockState('india');
    const theme = getThemeConfig('india');

    render(
      <PlayerPanel
        gameState={state}
        localPlayerId="p1"
        themeConfig={theme}
        hoveredPlayerId={null}
        pinnedPlayerId={null}
        onHoverPlayer={() => {}}
        onTogglePinPlayer={() => {}}
        onOpenTrade={() => {}}
      />
    );

    expect(screen.getByTestId('player-turn-ring-p1')).toBeTruthy();
    expect(screen.getByTestId('status-jail-p2')).toBeTruthy();
    expect(screen.getByTestId('status-disconnected-p2')).toBeTruthy();
    expect(screen.getByTestId('status-bankrupt-p3')).toBeTruthy();
    expect(screen.getByTestId('panel-trade-btn')).toBeTruthy();
  });

  it('renders world-themed PropertyDetailModal with rent table and contextual Buy/Skip buttons', () => {
    const base = makeMockState('valorant');
    const state: GameState = {
      ...base,
      turn: {
        ...base.turn,
        rollState: 'TILE_ACTION',
        canRoll: false,
        mustResolveTile: true,
        pendingTileId: 27
      }
    };
    const theme = getThemeConfig('valorant');
    const onBuy = vi.fn();
    const onSkip = vi.fn();

    render(
      <PropertyDetailModal
        tile={getTileById(27)!}
        gameState={state}
        localPlayer={state.players[0]}
        themeConfig={theme}
        onClose={() => {}}
        onBuyProperty={onBuy}
        onDeclineProperty={onSkip}
      />
    );

    expect(screen.getByText('Bind Showers')).toBeTruthy();
    expect(screen.getByText('Rent Schedule')).toBeTruthy();
    fireEvent.click(screen.getByTestId('property-modal-buy-btn'));
    expect(onBuy).toHaveBeenCalledWith(27);
  });

  it('caps ToastStack strictly to 3 visible notifications', () => {
    const theme = getThemeConfig('original');
    const fiveToasts: HudToastItem[] = [
      { id: '1', kind: 'rent', title: 'T1', message: 'M1' },
      { id: '2', kind: 'money', title: 'T2', message: 'M2' },
      { id: '3', kind: 'card', title: 'T3', message: 'M3' },
      { id: '4', kind: 'jail', title: 'T4', message: 'M4' },
      { id: '5', kind: 'bankrupt', title: 'T5', message: 'M5' }
    ];

    render(<ToastStack toasts={fiveToasts} themeConfig={theme} onDismiss={() => {}} />);

    expect(screen.queryByText('T1')).toBeNull();
    expect(screen.queryByText('T2')).toBeNull();
    expect(screen.getByText('T3')).toBeTruthy();
    expect(screen.getByText('T4')).toBeTruthy();
    expect(screen.getByText('T5')).toBeTruthy();
  });

  it('renders world-themed CardModal and GameOverModal with OK / Play Again / Back to Lobby', () => {
    const base = makeMockState('cyberpunk');
    const theme = getThemeConfig('cyberpunk');
    const onCloseCard = vi.fn();

    render(
      <CardModal
        card={{
          id: 'c1',
          deck: 'opportunity',
          title: 'Zero-Day Bounty',
          description: 'Collect 150 credits.',
          action: 'GIVE_MONEY',
          value: 150
        }}
        drawerPlayer={base.players[0]}
        gameState={base}
        themeConfig={theme}
        onClose={onCloseCard}
      />
    );

    expect(screen.getByText('Zero-Day Bounty')).toBeTruthy();
    fireEvent.click(screen.getByTestId('card-modal-ok-btn'));
    expect(onCloseCard).toHaveBeenCalledTimes(1);

    const endedState: GameState = {
      ...base,
      phase: 'ENDED',
      winner: base.players[0]
    };
    const onPlayAgain = vi.fn();
    const onLobby = vi.fn();

    render(
      <GameOverModal
        gameState={endedState}
        themeConfig={theme}
        onPlayAgain={onPlayAgain}
        onBackToLobby={onLobby}
      />
    );

    expect(screen.getByText('Aria Wins')).toBeTruthy();
    fireEvent.click(screen.getByTestId('gameover-playagain-btn'));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('gameover-lobby-btn'));
    expect(onLobby).toHaveBeenCalledTimes(1);
  });

  it('requires 2-step confirmation for Leave Game in SettingsMenu and updates audio/chat preferences', () => {
    const theme = getThemeConfig('original');
    const onUpdate = vi.fn();
    const onLeave = vi.fn();

    render(
      <SettingsMenu
        themeConfig={theme}
        preferences={DEFAULT_HUD_PREFERENCES}
        onUpdatePreferences={onUpdate}
        onLeaveGame={onLeave}
      />
    );

    fireEvent.click(screen.getByTestId('settings-menu-trigger'));
    fireEvent.click(screen.getByTestId('settings-sound-toggle'));
    expect(onUpdate).toHaveBeenCalledWith({ soundEnabled: false });

    fireEvent.click(screen.getByTestId('settings-leave-btn'));
    expect(onLeave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('settings-leave-confirm-btn'));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});
