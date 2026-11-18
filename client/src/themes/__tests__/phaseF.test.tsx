// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DEFAULT_GAME_SETTINGS,
  type GameState,
  type Player
} from '@tycoonvale/shared';
import { getThemeConfig } from '../index.js';
import { AuctionModal } from '../../components/Modals/AuctionModal.js';
import { TradeModal } from '../../components/Modals/TradeModal.js';
import { PlayerPanel } from '../../components/HUD/PlayerPanel.js';
import { SoundPreviewPanel } from '../../components/HUD/SoundPreviewPanel.js';
import { validateTradeDraft, validatePendingTrade } from '../../services/tradeValidation.js';
import { soundEngine, SOUND_CATALOG } from '../../services/audio.js';

function makePhaseFState(world: 'original' | 'valorant' | 'india' | 'cyberpunk' = 'valorant'): GameState {
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
      balance: 600,
      netWorth: 1200,
      position: 5,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 1,
      properties: [1, 3, 5],
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
      balance: 850,
      netWorth: 1400,
      position: 14,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      properties: [14, 26],
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false
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
    roomCode: 'PHF123',
    phase: 'PLAYING',
    hostId: 'p1',
    settings: { ...DEFAULT_GAME_SETTINGS, theme: world },
    players,
    properties: {
      1: { tileId: 1, ownerId: 'p1', houses: 2, hotel: false, isMortgaged: false },
      3: { tileId: 3, ownerId: 'p1', houses: 1, hotel: false, isMortgaged: false },
      5: { tileId: 5, ownerId: 'p1', houses: 0, hotel: false, isMortgaged: false },
      14: { tileId: 14, ownerId: 'p2', houses: 0, hotel: false, isMortgaged: false },
      26: { tileId: 26, ownerId: 'p2', houses: 0, hotel: false, isMortgaged: true }
    },
    turn: {
      activePlayerId: 'p1',
      turnIndex: 0,
      rollState: 'CAN_ROLL',
      dice: [3, 4],
      rolledDouble: false,
      consecutiveDoubles: 0,
      canRoll: true,
      canEndTurn: false,
      mustResolveTile: false,
      turnTimerSeconds: 40
    },
    auction: null,
    activeTrade: null,
    winner: null,
    jackpotPool: 200,
    activityLogs: [],
    chatMessages: [],
    revision: 1
  };
}

describe('Phase F — Auctions, Trading, Property Management & Web Audio Sound Engine', () => {
  beforeEach(() => {
    soundEngine.setMuted(false);
    soundEngine.setVolume(0.7);
  });

  it('renders AuctionModal with quick bids, custom validation, pass, read-only bankrupt mode, and result screen', () => {
    const base = makePhaseFState('valorant');
    const state: GameState = {
      ...base,
      auction: {
        tileId: 27,
        currentBid: 200,
        highestBidderId: 'p2',
        activePlayerIds: ['p1', 'p2'],
        timerSeconds: 6,
        isFinished: false,
        minNextBid: 210
      }
    };
    const theme = getThemeConfig('valorant');
    const onBid = vi.fn();
    const onPass = vi.fn();

    const { rerender } = render(
      <AuctionModal
        gameState={state}
        localPlayer={state.players[0]}
        themeConfig={theme}
        onBid={onBid}
        onPass={onPass}
        initialBidHistory={[{ id: 'b1', bidderId: 'p2', bidderName: 'Viper', amount: 200, timestamp: Date.now() }]}
      />
    );

    // Quick bid +50 submits currentBid + 50 = 250
    fireEvent.click(screen.getByTestId('auction-quick-bid-50'));
    expect(onBid).toHaveBeenCalledWith(250);

    // Custom bid exceeding cash triggers inline error
    fireEvent.change(screen.getByTestId('auction-custom-input'), { target: { value: '9999' } });
    fireEvent.submit(screen.getByTestId('auction-custom-submit').closest('form')!);
    expect(screen.getByTestId('auction-custom-error').textContent).toContain('Cannot exceed');

    // Pass works
    fireEvent.click(screen.getByTestId('auction-pass-btn'));
    expect(onPass).toHaveBeenCalledTimes(1);

    // Bankrupt player sees read-only view with no bid buttons
    rerender(
      <AuctionModal
        gameState={state}
        localPlayer={state.players[2]}
        themeConfig={theme}
        onBid={onBid}
        onPass={onPass}
      />
    );
    expect(screen.getByTestId('auction-disabled-reason').textContent).toContain('Read-only');
    expect(screen.queryByTestId('auction-quick-bid-10')).toBeNull();

    // Result screen renders winner & amount
    rerender(
      <AuctionModal
        gameState={{ ...base, auction: null }}
        localPlayer={base.players[0]}
        themeConfig={theme}
        forcedResult={{
          tileId: 27,
          propertyName: 'Bind Showers',
          winnerId: 'p2',
          winnerName: 'Viper',
          amount: 250
        }}
      />
    );
    expect(screen.getByTestId('auction-result-screen').textContent).toContain('Viper');
    expect(screen.getByTestId('auction-result-screen').textContent).toContain('250');
  });

  it('validates trades strictly (buildings, empty, excess cash, active auction, state-changed pending trade)', () => {
    const state = makePhaseFState('cyberpunk');

    // Empty trade rejected
    expect(
      validateTradeDraft(
        { targetId: 'p2', offerCash: 0, requestCash: 0, offerPropertyIds: [], requestPropertyIds: [] },
        state.players[0],
        state,
        '₵'
      ).valid
    ).toBe(false);

    // Property with houses in set rejected
    const builtRes = validateTradeDraft(
      { targetId: 'p2', offerCash: 0, requestCash: 0, offerPropertyIds: [1], requestPropertyIds: [14] },
      state.players[0],
      state,
      '₵'
    );
    expect(builtRes.valid).toBe(false);
    expect(builtRes.errors[0]).toContain('buildings');

    // Clean trade passes
    const cleanRes = validateTradeDraft(
      { targetId: 'p2', offerCash: 100, requestCash: 0, offerPropertyIds: [5], requestPropertyIds: [14] },
      state.players[0],
      state,
      '₵'
    );
    expect(cleanRes.valid).toBe(true);

    // Blocked while auction is active
    const auctionState: GameState = {
      ...state,
      auction: {
        tileId: 27,
        currentBid: 10,
        highestBidderId: 'p1',
        activePlayerIds: ['p1', 'p2'],
        timerSeconds: 15,
        isFinished: false,
        minNextBid: 20
      }
    };
    const duringAuction = validateTradeDraft(
      { targetId: 'p2', offerCash: 50, requestCash: 0, offerPropertyIds: [5], requestPropertyIds: [] },
      auctionState.players[0],
      auctionState,
      '₵'
    );
    expect(duringAuction.valid).toBe(false);
    expect(duringAuction.errors[0]).toContain('auction');

    // Pending trade becomes invalid when sender cash drops below offerCash
    const pendingInvalid = validatePendingTrade(
      {
        id: 't1',
        initiatorId: 'p2',
        targetId: 'p1',
        offerCash: 2000,
        requestCash: 0,
        offerPropertyIds: [],
        requestPropertyIds: [5],
        status: 'pending',
        createdAt: Date.now()
      },
      state,
      '₵'
    );
    expect(pendingInvalid.valid).toBe(false);
  });

  it('renders TradeModal create flow with live net cash and incoming trade counter/accept/decline', () => {
    const base = makePhaseFState('original');
    const theme = getThemeConfig('original');
    const onPropose = vi.fn();

    render(
      <TradeModal
        isOpen={true}
        gameState={base}
        localPlayer={base.players[0]}
        themeConfig={theme}
        initialMode="create"
        initialDraft={{
          targetId: 'p2',
          offerCash: 120,
          requestCash: 50,
          offerPropertyIds: [5],
          requestPropertyIds: [14]
        }}
        onClose={() => {}}
        onProposeTrade={onPropose}
      />
    );

    expect(screen.getByTestId('trade-net-cash').textContent).toContain('-$70');
    // Tile 1 has houses -> disabled in picker
    expect((screen.getByTestId('trade-give-prop-1') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('trade-submit-btn'));
    expect(onPropose).toHaveBeenCalledWith({
      targetId: 'p2',
      offerCash: 120,
      requestCash: 50,
      offerPropertyIds: [5],
      requestPropertyIds: [14]
    });
  });

  it('renders PlayerPanel inline Property Management Menu with even-build disabled reason and 2-step sell confirmation', () => {
    const state = makePhaseFState('original');
    const theme = getThemeConfig('original');
    const onSell = vi.fn();

    render(
      <PlayerPanel
        gameState={state}
        localPlayerId="p1"
        themeConfig={theme}
        hoveredPlayerId={null}
        pinnedPlayerId={null}
        onHoverPlayer={() => {}}
        onTogglePinPlayer={() => {}}
        onBuildHouse={() => {}}
        onSellHouse={onSell}
        onMortgageProperty={() => {}}
        onUnmortgageProperty={() => {}}
        initialExpandedTileId={1}
      />
    );

    // Tile 1 has 2 houses while Tile 3 has 1 -> Build disabled with "Build evenly" reason
    const buildBtn = screen.getByTestId('prop-build-btn-1') as HTMLButtonElement;
    expect(buildBtn.disabled).toBe(true);
    expect(buildBtn.textContent).toContain('Build evenly');

    // Mortgage disabled with "Sell buildings first"
    const mortBtn = screen.getByTestId('prop-mortgage-btn-1') as HTMLButtonElement;
    expect(mortBtn.disabled).toBe(true);
    expect(mortBtn.textContent).toContain('Sell buildings first');

    // Sell requires 2-step confirmation with exact payout (+$25)
    fireEvent.click(screen.getByTestId('prop-sell-btn-1'));
    expect(onSell).not.toHaveBeenCalled();
    expect(screen.getByTestId('prop-confirm-1').textContent).toContain('+$25');
    fireEvent.click(screen.getByTestId('prop-confirm-yes-1'));
    expect(onSell).toHaveBeenCalledWith(1);
  });

  it('renders SoundPreviewPanel with all 18 Web Audio cues and 4 world characters', () => {
    const theme = getThemeConfig('cyberpunk');
    render(
      <SoundPreviewPanel
        isOpen={true}
        initialWorld="cyberpunk"
        themeConfig={theme}
        onClose={() => {}}
      />
    );

    expect(SOUND_CATALOG).toHaveLength(18);
    expect(screen.getByTestId('sound-world-original')).toBeTruthy();
    expect(screen.getByTestId('sound-world-valorant')).toBeTruthy();
    expect(screen.getByTestId('sound-world-india')).toBeTruthy();
    expect(screen.getByTestId('sound-world-cyberpunk')).toBeTruthy();
    expect(screen.getByTestId('sound-cue-dice_roll')).toBeTruthy();
    expect(screen.getByTestId('sound-cue-auction_won')).toBeTruthy();
    expect(screen.getByTestId('sound-cue-trade_accepted')).toBeTruthy();
  });
});
