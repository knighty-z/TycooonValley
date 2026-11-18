// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DEFAULT_GAME_SETTINGS, type GameState } from '@tycoonvale/shared';
import {
  WORLD_THEME_LIST,
  VALORANT_THEME,
  ORIGINAL_THEME,
  ACCESSIBLE_PLAYER_COLORS,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  buildMovePlan,
  computeClockwiseSteps
} from '../index.js';
import { WorldTokenIcon } from '../../components/Icons/WorldTokens.js';
import { Dice3D } from '../../components/Board/Dice3D.js';
import { PlayerPanel } from '../../components/HUD/PlayerPanel.js';
import { TokenPicker } from '../../components/HUD/TokenPicker.js';

describe('Phase D — Tokens, Movement Engine, 3D Dice, Player Colors & Panel', () => {
  it('defines movement, 3D dice, ownership configs and 6 unique tokens on all 4 worlds', () => {
    for (const world of WORLD_THEME_LIST) {
      expect(world.tokens).toHaveLength(6);
      expect(new Set(world.tokens.map(t => t.id)).size).toBe(6);
      expect(world.movement.hopHeightPx).toBeGreaterThan(0);
      expect(world.movement.maxTotalDurationMs).toBeLessThanOrEqual(1400);
      expect(world.dice.material).toBeTruthy();
      expect(world.ownership.claimStyle).toBeTruthy();
      expect(world.ownership.hoverStyle).toBeTruthy();
    }

    // VALORANT uses the 6 uploaded agent sprite files under /tokens/valorant/
    const valPaths = VALORANT_THEME.tokens.map(t => t.imageSrc);
    expect(valPaths).toEqual([
      '/tokens/valorant/jet.png',
      '/tokens/valorant/clove.png',
      '/tokens/valorant/sage.png',
      '/tokens/valorant/raze.png',
      '/tokens/valorant/chamber.png',
      '/tokens/valorant/miks.png'
    ]);
  });

  it('computes tile-by-tile corner paths, caps long roll duration, and uses direct slide for jail/teleports', () => {
    // Smooth corner crossing: 8 -> 13 crosses Jail corner (10)
    expect(computeClockwiseSteps(8, 13)).toEqual([9, 10, 11, 12, 13]);
    // Wrap-around GO corner: 37 -> 2 crosses GO (0)
    expect(computeClockwiseSteps(37, 2)).toEqual([38, 39, 0, 1, 2]);

    const shortPlan = buildMovePlan(1, 4, [1, 2], ORIGINAL_THEME.movement);
    const longPlan = buildMovePlan(1, 13, [6, 6], ORIGINAL_THEME.movement);

    expect(shortPlan.kind).toBe('step_by_step');
    expect(longPlan.kind).toBe('step_by_step');
    expect(longPlan.steps).toHaveLength(12);
    // Longer roll speeds up per step and stays capped
    expect(longPlan.stepDurationMs).toBeLessThan(shortPlan.stepDurationMs);
    expect(longPlan.totalDurationMs).toBeLessThanOrEqual(ORIGINAL_THEME.movement.maxTotalDurationMs);

    // Go To Jail (30 -> 10) uses fast direct slide
    const jailPlan = buildMovePlan(30, 10, [0, 0], VALORANT_THEME.movement);
    expect(jailPlan.kind).toBe('direct_slide');
    expect(jailPlan.steps).toEqual([10]);
    expect(jailPlan.totalDurationMs).toBe(VALORANT_THEME.movement.directSlideMs);
  });

  it('provides at least 8 unique accessible player colors and deduplicates player colors & tokens', () => {
    expect(ACCESSIBLE_PLAYER_COLORS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ACCESSIBLE_PLAYER_COLORS.map(c => c.hex.toLowerCase())).size).toBe(
      ACCESSIBLE_PLAYER_COLORS.length
    );

    const dupPlayers = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i + 1}`,
      color: ACCESSIBLE_PLAYER_COLORS[0].hex,
      token: 'jett'
    }));

    const uniqueColors = resolveUniquePlayerColors(dupPlayers);
    expect(new Set(Object.values(uniqueColors).map(c => c.hex)).size).toBe(6);

    const uniqueTokens = resolveWorldTokensForPlayers(dupPlayers, VALORANT_THEME.tokens);
    expect(new Set(Object.values(uniqueTokens).map(t => t.id)).size).toBe(6);
  });

  it('gracefully falls back to an initial emblem and warns when a VALORANT token image fails to load', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const brokenToken = {
      id: 'missing_agent',
      name: 'MissingAgent',
      frameColor: '#FF4655',
      imageSrc: '/tokens/valorant/does-not-exist.png',
      initial: 'M'
    };

    const { container, getByAltText } = render(
      <WorldTokenIcon tokenId="missing_agent" tokenDef={brokenToken} worldId="valorant" color="#00B4D8" />
    );

    const img = getByAltText('MissingAgent');
    fireEvent.error(img);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const fallback = container.querySelector('[data-token-fallback="missing_agent"]');
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toBe('M');
    warnSpy.mockRestore();
  });

  it('renders a true 6-face 3D cube die with world material styling and exact face value', () => {
    const { container } = render(
      <Dice3D value={5} index={0} isRolling={false} worldId="cyberpunk" />
    );

    const root = container.querySelector('[data-testid="dice-face-0"]');
    expect(root?.getAttribute('data-dice-value')).toBe('5');
    expect(root?.getAttribute('data-dice-material')).toBe('cyber_glass');
    expect(container.querySelectorAll('.tv-die-face')).toHaveLength(6);
  });

  it('renders PlayerPanel with My Properties, hover callback, and detailed portfolio popover', () => {
    const onHover = vi.fn();
    const onPin = vi.fn();

    const state: GameState = {
      roomCode: 'TEST4D',
      phase: 'PLAYING',
      hostId: 'p1',
      settings: { ...DEFAULT_GAME_SETTINGS, theme: 'original' },
      players: [
        {
          id: 'p1',
          sessionId: 'p1',
          socketId: '',
          nickname: 'Aria',
          avatar: 'avatar-tycoon',
          token: 'tophat',
          color: ACCESSIBLE_PLAYER_COLORS[0].hex,
          balance: 1500,
          position: 1,
          inJail: false,
          jailTurns: 0,
          getOutOfJailCards: 1,
          properties: [1, 3],
          isBankrupt: false,
          isHost: true,
          isReady: true,
          isDisconnected: false,
          netWorth: 2100
        },
        {
          id: 'p2',
          sessionId: 'p2',
          socketId: '',
          nickname: 'Viper',
          avatar: 'avatar-tycoon',
          token: 'crown',
          color: ACCESSIBLE_PLAYER_COLORS[1].hex,
          balance: 1200,
          position: 6,
          inJail: false,
          jailTurns: 0,
          getOutOfJailCards: 0,
          properties: [6],
          isBankrupt: false,
          isHost: false,
          isReady: true,
          isDisconnected: false,
          netWorth: 1300
        }
      ],
      properties: {
        1: { tileId: 1, ownerId: 'p1', houses: 2, hotel: false, isMortgaged: false },
        3: { tileId: 3, ownerId: 'p1', houses: 0, hotel: true, isMortgaged: false },
        6: { tileId: 6, ownerId: 'p2', houses: 0, hotel: false, isMortgaged: true }
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
        turnTimerSeconds: 45
      },
      auction: null,
      activeTrade: null,
      winner: null,
      jackpotPool: 0,
      activityLogs: [],
      chatMessages: [],
      revision: 1
    };

    const { getByTestId, getByText } = render(
      <PlayerPanel
        gameState={state}
        localPlayerId="p1"
        themeConfig={ORIGINAL_THEME}
        hoveredPlayerId="p1"
        pinnedPlayerId={null}
        onHoverPlayer={onHover}
        onTogglePinPlayer={onPin}
      />
    );

    fireEvent.mouseEnter(getByTestId('player-panel-row-p2'));
    expect(onHover).toHaveBeenCalledWith('p2');

    // Popover for hovered p1 displays Full Set, houses, hotels, and Pardon card
    const popover = getByTestId('player-popover-p1');
    expect(popover.textContent).toContain('Full Set');
    expect(popover.textContent).toContain('Cobble Lane');
    expect(popover.textContent).toContain('Old Mill Court');
    expect(getByText('My Properties')).toBeTruthy();
  });

  it('prevents selecting duplicate tokens in TokenPicker', () => {
    const onSelect = vi.fn();
    const { getByTestId } = render(
      <TokenPicker
        themeConfig={VALORANT_THEME}
        selectedTokenId="jett"
        takenTokenIds={['clove', 'sage']}
        playerColor="#00B4D8"
        onSelectToken={onSelect}
      />
    );

    const cloveBtn = getByTestId('token-option-clove') as HTMLButtonElement;
    const razeBtn = getByTestId('token-option-raze') as HTMLButtonElement;
    expect(cloveBtn.disabled).toBe(true);
    expect(razeBtn.disabled).toBe(false);

    fireEvent.click(razeBtn);
    expect(onSelect).toHaveBeenCalledWith('raze');
  });
});
