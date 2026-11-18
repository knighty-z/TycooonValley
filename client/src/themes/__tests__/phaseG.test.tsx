// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DEFAULT_GAME_SETTINGS, type GameState, type Player } from '@tycoonvale/shared';
import { getThemeConfig } from '../index.js';
import { extractRoomCode, validateNickname } from '../../services/session.js';
import { WorldSelector } from '../../components/Pregame/WorldSelector.js';
import { CharacterSelectPanel } from '../../components/Pregame/CharacterSelectPanel.js';
import { HostSettingsPanel } from '../../components/Pregame/HostSettingsPanel.js';
import { HowToPlayModal } from '../../components/Modals/HowToPlayModal.js';
import { LobbyPage } from '../../pages/LobbyPage.js';

beforeAll(() => {
  if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
    (Element.prototype as unknown as { scrollTo: () => void }).scrollTo = vi.fn();
  }
});

afterEach(() => {
  cleanup();
});

function makePlayers(): Player[] {
  return [
    {
      id: 'p1',
      sessionId: 'p1',
      socketId: '',
      nickname: 'Aria',
      avatar: 'avatar-tycoon',
      token: 'jett',
      color: '#00B4D8',
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
      id: 'p2',
      sessionId: 'p2',
      socketId: '',
      nickname: 'Kabir',
      avatar: 'avatar-tycoon',
      token: 'clove',
      color: '#FF5E7E',
      team: 'silver',
      position: 0,
      balance: 1500,
      netWorth: 1500,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: false,
      isReady: false,
      isDisconnected: false,
      properties: []
    }
  ];
}

function makeLobbyState(players: Player[]): GameState {
  return {
    roomCode: 'VAL92K',
    phase: 'LOBBY',
    hostId: 'p1',
    players,
    properties: {},
    turn: {
      activePlayerId: 'p1',
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
    activityLogs: [],
    chatMessages: [],
    settings: { ...DEFAULT_GAME_SETTINGS, theme: 'valorant' },
    jackpotPool: 0,
    winner: null,
    revision: 1
  };
}

describe('Phase G — Enhanced Pregame, World Selection, Lobby & Character Showcase', () => {
  it('validates nicknames (2-16 chars trimmed) and extracts room codes from raw text or invite URLs', () => {
    expect(validateNickname('  ').valid).toBe(false);
    expect(validateNickname('A').valid).toBe(false);
    expect(validateNickname('  Aria  ')).toEqual({ valid: true, trimmed: 'Aria' });
    expect(validateNickname('12345678901234567').valid).toBe(false);

    expect(extractRoomCode('ab12cd')).toBe('AB12CD');
    expect(extractRoomCode('  https://tycoonvale.app/?room=val92k  ')).toBe('VAL92K');
    expect(extractRoomCode('xy-78!9z')).toBe('XY789Z');
  });

  it('renders all five worlds in WorldSelector (including WorldWompWomp) and locks editing for non-hosts', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <WorldSelector selectedWorld="original" onSelectWorld={onSelect} canEdit={true} />
    );

    expect(screen.getByTestId('world-card-original')).toBeTruthy();
    expect(screen.getByTestId('world-card-valorant')).toBeTruthy();
    expect(screen.getByTestId('world-card-india')).toBeTruthy();
    expect(screen.getByTestId('world-card-cyberpunk')).toBeTruthy();
    expect(screen.getByTestId('world-card-wompwomp')).toBeTruthy();

    fireEvent.click(screen.getByTestId('world-card-wompwomp'));
    expect(onSelect).toHaveBeenCalledWith('wompwomp');

    onSelect.mockClear();
    rerender(<WorldSelector selectedWorld="valorant" onSelectWorld={onSelect} canEdit={false} />);
    expect(screen.getByText('Host Controlled')).toBeTruthy();
    fireEvent.click(screen.getByTestId('world-card-india'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders all 6 WorldWompWomp 3D mascot variants with duplicate prevention and showcase update', () => {
    const wompTheme = getThemeConfig('wompwomp');
    const onSelectToken = vi.fn();

    render(
      <CharacterSelectPanel
        themeConfig={wompTheme}
        selectedTokenId="womp_peach"
        localPlayerName="Aria"
        localPlayerColor="#00B4D8"
        takenByPlayerMap={{
          womp_pink: { id: 'p2', nickname: 'Viper', color: '#FF5E7E' },
          womp_lavender: { id: 'p3', nickname: 'Kabir', color: '#9D4EDD' }
        }}
        onSelectToken={onSelectToken}
      />
    );

    expect(screen.getByTestId('showcase-character-name').textContent).toBe('Peach');
    expect(wompTheme.tokens).toHaveLength(6);
    for (const tok of wompTheme.tokens) {
      expect(screen.getByTestId(`roster-token-${tok.id}`)).toBeTruthy();
      expect(tok.imageSrc).toMatch(/^\/tokens\/wompwomp\/.+\.png$/);
    }

    const takenPink = screen.getByTestId('roster-token-womp_pink') as HTMLButtonElement;
    expect(takenPink.disabled).toBe(true);
    expect(screen.getByTestId('taken-by-womp_pink').textContent).toContain('Viper');

    const mintBtn = screen.getByTestId('roster-token-womp_mint') as HTMLButtonElement;
    expect(mintBtn.disabled).toBe(false);
    fireEvent.click(mintBtn);
    expect(onSelectToken).toHaveBeenCalledWith('womp_mint');
  });

  it('renders VALORANT custom 3D agents, disables taken agents with owner label, and updates showcase', () => {
    const valTheme = getThemeConfig('valorant');
    const onSelectToken = vi.fn();

    render(
      <CharacterSelectPanel
        themeConfig={valTheme}
        selectedTokenId="jett"
        localPlayerName="Aria"
        localPlayerColor="#00B4D8"
        takenByPlayerMap={{
          clove: { id: 'p2', nickname: 'Viper', color: '#FF5E7E' }
        }}
        onSelectToken={onSelectToken}
      />
    );

    expect(screen.getByTestId('showcase-character-name').textContent).toBe('Jett');
    const takenBtn = screen.getByTestId('roster-token-clove') as HTMLButtonElement;
    expect(takenBtn.disabled).toBe(true);
    expect(screen.getByTestId('taken-by-clove').textContent).toContain('Viper');

    const sageBtn = screen.getByTestId('roster-token-sage') as HTMLButtonElement;
    expect(sageBtn.disabled).toBe(false);
    fireEvent.click(sageBtn);
    expect(onSelectToken).toHaveBeenCalledWith('sage');
  });

  it('shows host-only controls and reset button in HostSettingsPanel, and read-only badge for guests', () => {
    const valTheme = getThemeConfig('valorant');
    const onUpdate = vi.fn();

    const { rerender } = render(
      <HostSettingsPanel
        settings={{ ...DEFAULT_GAME_SETTINGS, theme: 'valorant', startingBalance: 2500 }}
        themeConfig={valTheme}
        isHost={true}
        currentPlayerCount={2}
        onUpdateSettings={onUpdate}
      />
    );

    fireEvent.click(screen.getByTestId('reset-settings-btn'));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ startingBalance: DEFAULT_GAME_SETTINGS.startingBalance })
    );

    rerender(
      <HostSettingsPanel
        settings={{ ...DEFAULT_GAME_SETTINGS, theme: 'valorant' }}
        themeConfig={valTheme}
        isHost={false}
        currentPlayerCount={2}
        onUpdateSettings={onUpdate}
      />
    );

    expect(screen.getByTestId('settings-readonly-badge')).toBeTruthy();
    expect(screen.queryByTestId('reset-settings-btn')).toBeNull();
  });

  it('disables Start Game in LobbyPage with exact unready player reason and displays connection-lost banner', () => {
    const players = makePlayers();
    const state = makeLobbyState(players);

    const { rerender } = render(
      <LobbyPage
        previewGameState={state}
        previewLocalPlayer={players[0]}
        previewConnectionStatus="DISCONNECTED"
      />
    );

    const startBtn = screen.getByTestId('start-game-btn') as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
    expect(screen.getByTestId('start-status-reason').textContent).toContain(
      'Waiting for Kabir to ready up.'
    );
    expect(screen.getByTestId('connection-status-banner')).toBeTruthy();

    // Mark Kabir ready -> Start Game becomes enabled
    const allReady = players.map(p => ({ ...p, isReady: true }));
    rerender(
      <LobbyPage
        previewGameState={makeLobbyState(allReady)}
        previewLocalPlayer={allReady[0]}
        previewConnectionStatus="CONNECTED"
      />
    );

    expect((screen.getByTestId('start-game-btn') as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByTestId('connection-status-banner')).toBeNull();
  });

  it('renders world-themed HowToPlayModal and closes cleanly', () => {
    const onClose = vi.fn();
    render(
      <HowToPlayModal
        isOpen={true}
        onClose={onClose}
        themeConfig={getThemeConfig('valorant')}
      />
    );

    expect(screen.getByTestId('how-to-play-modal')).toBeTruthy();
    expect(screen.getByText(/How to Play TycoonVale/i)).toBeTruthy();
    fireEvent.click(screen.getByTestId('close-rules-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
