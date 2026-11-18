import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  BOARD_TILES,
  DEFAULT_GAME_SETTINGS,
  getTileById,
  type BoardTile,
  type Card,
  type ChatMessage,
  type GameState,
  type Player,
  type PropertyState,
  type WorldThemeId
} from '@tycoonvale/shared';
import type { ActiveMoveEvent, ActiveTileEffect } from '../../context/GameContext.js';
import {
  ACCESSIBLE_PLAYER_COLORS,
  getThemeConfig,
  getThemeCssVars,
  WORLD_THEME_LIST,
  type GraphicsQuality
} from '../../themes/index.js';
import { GameBoard } from './GameBoard.js';
import { PlayerPanel } from '../HUD/PlayerPanel.js';
import { TokenPicker } from '../HUD/TokenPicker.js';
import { ChatBox } from '../HUD/ChatBox.js';
import { GameInfoCard } from '../HUD/GameInfoCard.js';
import { TurnActionBar } from '../HUD/TurnActionBar.js';
import { ToastStack, type HudToastItem } from '../HUD/ToastStack.js';
import { PropertyDetailModal } from '../Modals/PropertyDetailModal.js';
import { CardModal } from '../Modals/CardModal.js';
import { GameOverModal } from '../Modals/GameOverModal.js';
import {
  AuctionModal,
  type AuctionBidEntry,
  type AuctionResultBanner
} from '../Modals/AuctionModal.js';
import { TradeModal } from '../Modals/TradeModal.js';
import { SoundPreviewPanel } from '../HUD/SoundPreviewPanel.js';
import type { TradeDraft } from '../../services/tradeValidation.js';
import { preloadWorldTokenImages } from '../Icons/WorldTokens.js';
import { soundEngine } from '../../services/audio.js';
import {
  loadHudPreferences,
  saveHudPreferences,
  type HudPreferences
} from '../../services/hudPreferences.js';
import { useHudToasts } from '../../hooks/useHudToasts.js';

interface PhaseDPreviewProps {
  initialWorld: WorldThemeId;
  initialGraphics: GraphicsQuality;
  hideSwitcher: boolean;
  closeupParam: string | null;
  initialDiceMidRoll: boolean;
  initialHoverPlayerId: string | null;
  emptyBoardOnly: boolean;
  initialModalParam?: string | null;
  initialToastParam?: boolean;
  initialHudMode?: boolean;
  initialSoundPanel?: boolean;
  initialPropManageId?: number | null;
}

function buildSampleChatMessages(worldId: WorldThemeId): ChatMessage[] {
  const theme = getThemeConfig(worldId);
  const now = Date.now();
  return [
    {
      id: 'chat-demo-1',
      senderId: 'p2',
      senderName: 'Viper',
      senderAvatar: 'avatar-tycoon',
      senderColor: ACCESSIBLE_PLAYER_COLORS[1].hex,
      text: `Claimed ${theme.tiles[14].name} early. Rent is going to sting.`,
      timestamp: now - 42000
    },
    {
      id: 'chat-demo-2',
      senderId: 'p3',
      senderName: 'Kabir',
      senderAvatar: 'avatar-tycoon',
      senderColor: ACCESSIBLE_PLAYER_COLORS[2].hex,
      text: theme.hud.quickReactions[2] ?? 'Nice',
      timestamp: now - 26000,
      isReaction: true
    },
    {
      id: 'chat-demo-3',
      senderId: 'p1',
      senderName: 'Aria',
      senderAvatar: 'avatar-tycoon',
      senderColor: ACCESSIBLE_PLAYER_COLORS[0].hex,
      text: `Watch out — I am one deed away from locking ${theme.tiles[1].name}'s set.`,
      timestamp: now - 11000
    }
  ];
}

function buildSampleCard(worldId: WorldThemeId): Card {
  const theme = getThemeConfig(worldId);
  const c = theme.currencySymbol;
  if (worldId === 'valorant') {
    return {
      id: 'card-demo-val',
      deck: 'opportunity',
      title: 'Spike Defuse Bonus',
      description: `Clean retake secured under pressure. Collect ${c}150 tactical bounty from the syndicate reserve.`,
      action: 'GIVE_MONEY',
      value: 150
    };
  }
  if (worldId === 'india') {
    return {
      id: 'card-demo-ind',
      deck: 'opportunity',
      title: 'Festive Trade Dividend',
      description: `Seasonal commerce surges across your holdings. Collect ${c}150 from the municipal treasury.`,
      action: 'GIVE_MONEY',
      value: 150
    };
  }
  if (worldId === 'cyberpunk') {
    return {
      id: 'card-demo-cyb',
      deck: 'opportunity',
      title: 'Zero-Day Bounty Payout',
      description: `Your encrypted contract cleared cleanly on the net. Collect ${c}150 directly to your ledger.`,
      action: 'GIVE_MONEY',
      value: 150
    };
  }
  if (worldId === 'wompwomp') {
    return {
      id: 'card-demo-womp',
      deck: 'opportunity',
      title: 'Marshmallow Jackpot!',
      description: `A giggling parade dropped pastel treats across your street! Collect ${c}150 bonus from the Womp Bank.`,
      action: 'GIVE_MONEY',
      value: 150
    };
  }
  return {
    id: 'card-demo-orig',
    deck: 'opportunity',
    title: 'Harbor Dividend Payout',
    description: `Your commercial syndicate cleared quarterly profits ahead of forecast. Collect ${c}150 from the treasury.`,
    action: 'GIVE_MONEY',
    value: 150
  };
}

function buildSampleToasts(worldId: WorldThemeId): HudToastItem[] {
  const theme = getThemeConfig(worldId);
  const c = theme.currencySymbol;
  return [
    {
      id: 'demo-toast-1',
      kind: 'rent',
      title: 'Rent Paid',
      message: `Kabir paid Viper ${c}180 rent on ${theme.tiles[14].name}.`
    },
    {
      id: 'demo-toast-2',
      kind: 'money',
      title: 'Funds Received',
      message: `Aria collected ${c}200 passing ${theme.tiles[0].name}.`
    },
    {
      id: 'demo-toast-3',
      kind: 'jail',
      title: 'Detained',
      message: `Rohan was sent directly to ${theme.tiles[10].name}.`
    }
  ];
}

function buildInitialDemoState(worldId: WorldThemeId, closeupMode: string | null): GameState {
  const theme = getThemeConfig(worldId);
  const tokens = theme.tokens;

  const basePositions =
    closeupMode === 'valorant-tokens' || closeupMode === 'bottom-row'
      ? [0, 1, 2, 3, 4, 5] // All 6 tokens along GO & bottom edge for close-up inspection
      : closeupMode === 'stacked-3'
      ? [3, 3, 3, 1, 5, 0] // 3 tokens in tactical formation on tile 3, plus neighboring bottom-row tiles & GO
      : closeupMode === 'property-single'
      ? [3, 16, 24, 32, 8, 20] // Single token cleanly seated on tile 3 (bottom row) beside unowned/owned neighbors
      : closeupMode === 'corner'
      ? [0, 1, 3, 16, 24, 32] // Single token on GO corner (0) & adjacent tile 1 for corner-vs-regular proportion check
      : [8, 16, 24, 32, 3, 20]; // Spread around all 4 edges (Player 1 at tile 8, right before corner 10!)

  const players: Player[] = [
    {
      id: 'p1',
      sessionId: 'p1',
      socketId: '',
      nickname: 'Aria',
      avatar: 'avatar-tycoon',
      token: tokens[0].id,
      color: ACCESSIBLE_PLAYER_COLORS[0].hex, // Electric Cerulean
      balance: 1420,
      position: basePositions[0],
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 1,
      properties: [1, 3, 5],
      isBankrupt: false,
      isHost: true,
      isReady: true,
      isDisconnected: false,
      netWorth: 1840
    },
    {
      id: 'p2',
      sessionId: 'p2',
      socketId: '',
      nickname: 'Viper',
      avatar: 'avatar-tycoon',
      token: tokens[1].id,
      color: ACCESSIBLE_PLAYER_COLORS[1].hex, // Coral Rose
      balance: 1680,
      position: basePositions[1],
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 1,
      properties: [11, 13, 14, 15],
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false,
      netWorth: 2560
    },
    {
      id: 'p3',
      sessionId: 'p3',
      socketId: '',
      nickname: 'Kabir',
      avatar: 'avatar-tycoon',
      token: tokens[2].id,
      color: ACCESSIBLE_PLAYER_COLORS[2].hex, // Royal Amethyst
      balance: 1290,
      position: basePositions[2],
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      properties: [21, 23, 24, 28],
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false,
      netWorth: 2290
    },
    {
      id: 'p4',
      sessionId: 'p4',
      socketId: '',
      nickname: 'Nova',
      avatar: 'avatar-tycoon',
      token: tokens[3].id,
      color: ACCESSIBLE_PLAYER_COLORS[3].hex, // Emerald Mint
      balance: 1150,
      position: basePositions[3],
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      properties: [31, 32, 37],
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false,
      netWorth: 2100
    },
    {
      id: 'p5',
      sessionId: 'p5',
      socketId: '',
      nickname: 'Rohan',
      avatar: 'avatar-tycoon',
      token: tokens[4].id,
      color: ACCESSIBLE_PLAYER_COLORS[4].hex, // Vivid Tangerine
      balance: 980,
      position: basePositions[4],
      inJail: true,
      jailTurns: 1,
      getOutOfJailCards: 0,
      properties: [6, 8],
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false,
      netWorth: 1180
    },
    {
      id: 'p6',
      sessionId: 'p6',
      socketId: '',
      nickname: 'Zara',
      avatar: 'avatar-tycoon',
      token: tokens[5].id,
      color: ACCESSIBLE_PLAYER_COLORS[5].hex, // Solar Gold
      balance: 1050,
      position: basePositions[5],
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      properties: [26, 29],
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: true,
      netWorth: 1590
    }
  ];

  const properties: Record<number, PropertyState> = {
    1:  { tileId: 1,  ownerId: 'p1', houses: 1, hotel: false, isMortgaged: false },
    3:  { tileId: 3,  ownerId: 'p1', houses: 1, hotel: false, isMortgaged: false },
    5:  { tileId: 5,  ownerId: 'p1', houses: 0, hotel: false, isMortgaged: false },
    6:  { tileId: 6,  ownerId: 'p5', houses: 0, hotel: false, isMortgaged: false },
    8:  { tileId: 8,  ownerId: 'p5', houses: 0, hotel: false, isMortgaged: true },
    11: { tileId: 11, ownerId: 'p2', houses: 2, hotel: false, isMortgaged: false },
    13: { tileId: 13, ownerId: 'p2', houses: 2, hotel: false, isMortgaged: false },
    14: { tileId: 14, ownerId: 'p2', houses: 0, hotel: true,  isMortgaged: false },
    15: { tileId: 15, ownerId: 'p2', houses: 0, hotel: false, isMortgaged: false },
    21: { tileId: 21, ownerId: 'p3', houses: 1, hotel: false, isMortgaged: false },
    23: { tileId: 23, ownerId: 'p3', houses: 1, hotel: false, isMortgaged: false },
    24: { tileId: 24, ownerId: 'p3', houses: 2, hotel: false, isMortgaged: false },
    28: { tileId: 28, ownerId: 'p3', houses: 0, hotel: false, isMortgaged: false },
    26: { tileId: 26, ownerId: 'p6', houses: 0, hotel: false, isMortgaged: false },
    29: { tileId: 29, ownerId: 'p6', houses: 0, hotel: false, isMortgaged: false },
    31: { tileId: 31, ownerId: 'p4', houses: 0, hotel: false, isMortgaged: false },
    32: { tileId: 32, ownerId: 'p4', houses: 1, hotel: false, isMortgaged: false },
    37: { tileId: 37, ownerId: 'p4', houses: 0, hotel: false, isMortgaged: false }
  };

  const now = Date.now();
  return {
    roomCode: 'DEMO4D',
    phase: 'PLAYING',
    hostId: 'p1',
    settings: {
      ...DEFAULT_GAME_SETTINGS,
      theme: worldId
    },
    players,
    properties,
    turn: {
      activePlayerId: 'p1',
      turnIndex: 0,
      rollState: 'CAN_ROLL',
      dice: [4, 3],
      rolledDouble: false,
      consecutiveDoubles: 0,
      canRoll: true,
      canEndTurn: false,
      mustResolveTile: false,
      turnTimerSeconds: 42
    },
    auction: null,
    activeTrade: null,
    winner: null,
    jackpotPool: 350,
    activityLogs: [
      { id: 'ev-1', timestamp: now - 30000, text: `Viper bought ${theme.tiles[14].name}`, type: 'buy' },
      { id: 'ev-2', timestamp: now - 20000, text: `Kabir rolled 8`, type: 'roll' },
      { id: 'ev-3', timestamp: now - 15000, text: `Aria claimed ${theme.tiles[3].name}`, type: 'buy' },
      { id: 'ev-4', timestamp: now - 6000, text: `Rohan was sent to ${theme.tiles[10].name}`, type: 'jail' }
    ],
    chatMessages: buildSampleChatMessages(worldId),
    revision: 1
  };
}

export const PhaseDPreview: React.FC<PhaseDPreviewProps> = ({
  initialWorld,
  initialGraphics,
  hideSwitcher,
  closeupParam,
  initialDiceMidRoll,
  initialHoverPlayerId,
  emptyBoardOnly,
  initialModalParam = null,
  initialToastParam = false,
  initialSoundPanel = false,
  initialPropManageId = null
}) => {
  const [worldId, setWorldId] = useState<WorldThemeId>(initialWorld);
  const [graphicsQuality] = useState<GraphicsQuality>(initialGraphics);
  const [demoState, setDemoState] = useState<GameState>(() => {
    const base = buildInitialDemoState(initialWorld, closeupParam);
    if (initialModalParam === 'gameover') {
      return {
        ...base,
        phase: 'ENDED',
        winner: base.players[1],
        players: base.players.map(p =>
          p.id === 'p5' ? { ...p, isBankrupt: true, balance: 0, netWorth: 0 } : p
        )
      };
    }
    if (initialModalParam === 'property') {
      return {
        ...base,
        players: base.players.map(p => (p.id === 'p1' ? { ...p, position: 27 } : p)),
        turn: {
          ...base.turn,
          rollState: 'TILE_ACTION',
          canRoll: false,
          canEndTurn: false,
          mustResolveTile: true,
          pendingTileId: 27
        }
      };
    }
    if (initialModalParam === 'auction') {
      return {
        ...base,
        players: base.players.map(p =>
          p.id === 'p5'
            ? { ...p, balance: 120 } // Can't afford next bid (240)
            : p
        ),
        auction: {
          tileId: 27,
          currentBid: 230,
          highestBidderId: 'p2',
          activePlayerIds: ['p1', 'p2', 'p3', 'p5'],
          timerSeconds: 7,
          isFinished: false,
          minNextBid: 240
        }
      };
    }
    if (initialModalParam === 'trade-incoming') {
      return {
        ...base,
        properties: {
          ...base.properties,
          1: { tileId: 1, ownerId: 'p1', houses: 0, hotel: false, isMortgaged: false },
          3: { tileId: 3, ownerId: 'p1', houses: 0, hotel: false, isMortgaged: false },
          26: { tileId: 26, ownerId: 'p6', houses: 0, hotel: false, isMortgaged: false }
        },
        activeTrade: {
          id: 'trade-demo-1',
          initiatorId: 'p6',
          targetId: 'p1',
          offerCash: 180,
          requestCash: 0,
          offerPropertyIds: [26],
          requestPropertyIds: [5],
          status: 'pending',
          createdAt: Date.now() - 8000
        }
      };
    }
    if (initialModalParam === 'trade-create') {
      return {
        ...base,
        properties: {
          ...base.properties,
          // Keep Set 1 (tiles 1 & 3) with 1 house so "Has buildings" lock is visible while tile 5 (Station) & tile 18 are clean!
          18: { tileId: 18, ownerId: 'p1', houses: 0, hotel: false, isMortgaged: false },
          26: { tileId: 26, ownerId: 'p6', houses: 0, hotel: false, isMortgaged: false },
          29: { tileId: 29, ownerId: 'p6', houses: 0, hotel: false, isMortgaged: true }
        },
        players: base.players.map(p =>
          p.id === 'p1' ? { ...p, properties: [1, 3, 5, 18] } : p
        )
      };
    }
    if (initialPropManageId !== null) {
      // Give p1 uneven houses (tile 1 = 2H, tile 3 = 1H) so Build shows "Build evenly" disabled reason while Sell shows +$25 and Mortgage shows "Sell buildings first"!
      return {
        ...base,
        properties: {
          ...base.properties,
          1: { tileId: 1, ownerId: 'p1', houses: 2, hotel: false, isMortgaged: false },
          3: { tileId: 3, ownerId: 'p1', houses: 1, hotel: false, isMortgaged: false }
        }
      };
    }
    return base;
  });
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [diceValues, setDiceValues] = useState<[number, number]>([5, 3]);
  const [moveEvent, setMoveEvent] = useState<ActiveMoveEvent | null>(null);
  const [tileEffect, setTileEffect] = useState<ActiveTileEffect | null>(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(initialHoverPlayerId);
  const [pinnedPlayerId, setPinnedPlayerId] = useState<string | null>(initialHoverPlayerId);
  const [showTokenPicker] = useState<boolean>(false);
  const [selectedTile, setSelectedTile] = useState<BoardTile | null>(() =>
    initialModalParam === 'property' ? getTileById(27) ?? null : null
  );
  const [previewCard, setPreviewCard] = useState<Card | null>(() =>
    initialModalParam === 'card' ? buildSampleCard(initialWorld) : null
  );
  const [isTradeOpen, setIsTradeOpen] = useState<boolean>(
    initialModalParam === 'trade-create'
  );
  const [tradeModalMode, setTradeModalMode] = useState<'create' | 'incoming'>(
    initialModalParam === 'trade-incoming' ? 'incoming' : 'create'
  );
  const [tradeInitialDraft, setTradeInitialDraft] = useState<Partial<TradeDraft> | null>(() =>
    initialModalParam === 'trade-create'
      ? {
          targetId: 'p6',
          offerCash: 120,
          requestCash: 40,
          offerPropertyIds: [5, 18],
          requestPropertyIds: [26, 29]
        }
      : null
  );
  const [isSoundPanelOpen, setIsSoundPanelOpen] = useState<boolean>(initialSoundPanel);
  const [auctionResultPreview] = useState<AuctionResultBanner | null>(() =>
    initialModalParam === 'auction-result'
      ? {
          tileId: 27,
          propertyName: getThemeConfig(initialWorld).tiles[27].name,
          winnerId: 'p2',
          winnerName: 'Viper',
          amount: 290
        }
      : null
  );
  const [prefs, setPrefs] = useState<HudPreferences>(() => loadHudPreferences());
  const rollTimeoutRef = useRef<number | null>(null);

  const demoAuctionBids = useMemo<AuctionBidEntry[] | undefined>(() => {
    if (initialModalParam !== 'auction') return undefined;
    const now = Date.now();
    return [
      { id: 'b4', bidderId: 'p2', bidderName: 'Viper', amount: 230, timestamp: now - 2000 },
      { id: 'b3', bidderId: 'p3', bidderName: 'Kabir', amount: 210, timestamp: now - 6000 },
      { id: 'b2', bidderId: 'p1', bidderName: 'Aria', amount: 160, timestamp: now - 11000 },
      { id: 'b1', bidderId: 'p2', bidderName: 'Viper', amount: 110, timestamp: now - 15000 }
    ];
  }, [initialModalParam]);

  const initialToasts = useMemo(
    () => (initialToastParam ? buildSampleToasts(initialWorld) : []),
    [initialToastParam, initialWorld]
  );
  const { toasts, pushToast, dismissToast } = useHudToasts(demoState.activityLogs, null, initialToasts);

  useEffect(() => {
    soundEngine.setMuted(!prefs.soundEnabled);
    soundEngine.setVolume(prefs.volume);
    soundEngine.setWorld(worldId);
  }, [prefs.soundEnabled, prefs.volume, worldId]);

  // Dev shortcut Alt+Shift+S opens Sound Preview Panel in preview mode too
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSoundPanelOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleUpdatePrefs = useCallback((patch: Partial<HudPreferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      saveHudPreferences(next);
      return next;
    });
  }, []);

  const themeConfig = useMemo(() => getThemeConfig(worldId), [worldId]);
  const cssVars = useMemo(() => getThemeCssVars(themeConfig), [themeConfig]);

  useEffect(() => {
    preloadWorldTokenImages(themeConfig.tokens);
  }, [themeConfig.tokens]);

  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current !== null) window.clearTimeout(rollTimeoutRef.current);
    };
  }, []);

  const appendEventLog = useCallback((text: string, type: GameState['activityLogs'][number]['type'] = 'system') => {
    setDemoState(prev => ({
      ...prev,
      activityLogs: [
        { id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), text, type },
        ...prev.activityLogs.slice(0, 12)
      ]
    }));
  }, []);

  const handleSwitchWorld = useCallback((nextWorld: WorldThemeId) => {
    setWorldId(nextWorld);
    const nextTheme = getThemeConfig(nextWorld);
    setDemoState(prev => ({
      ...prev,
      settings: { ...prev.settings, theme: nextWorld },
      players: prev.players.map((p, idx) => ({
        ...p,
        token: nextTheme.tokens[idx % nextTheme.tokens.length].id
      })),
      activityLogs: [
        { id: `ev-sw-${Date.now()}`, timestamp: Date.now() - 30000, text: `Viper bought ${nextTheme.tiles[14].name}`, type: 'buy' },
        { id: `ev-sw2-${Date.now()}`, timestamp: Date.now() - 20000, text: `Kabir rolled 8`, type: 'roll' },
        { id: `ev-sw3-${Date.now()}`, timestamp: Date.now() - 15000, text: `Aria claimed ${nextTheme.tiles[3].name}`, type: 'buy' },
        { id: `ev-sw4-${Date.now()}`, timestamp: Date.now() - 6000, text: `Rohan was sent to ${nextTheme.tiles[10].name}`, type: 'jail' }
      ],
      chatMessages: buildSampleChatMessages(nextWorld)
    }));
    if (previewCard) {
      setPreviewCard(buildSampleCard(nextWorld));
    }
    if (typeof window !== 'undefined') {
      const next = new URLSearchParams(window.location.search);
      next.set('previewBoard', nextWorld);
      window.history.replaceState({}, '', `${window.location.pathname}?${next.toString()}`);
    }
  }, []);

  const executeMove = useCallback(
    (d1: number, d2: number, forceToPos?: number, forceDirectLabel?: string) => {
      const activeP = demoState.players.find(p => p.id === demoState.turn.activePlayerId);
      if (!activeP) return;

      const fromPos = activeP.position;
      const sum = d1 + d2;
      const toPos = forceToPos !== undefined ? forceToPos : (fromPos + sum) % 40;
      const passedGo = forceToPos === undefined && fromPos + sum >= 40;
      const isDouble = d1 > 0 && d1 === d2;

      const engineTile = BOARD_TILES[toPos];
      const localizedName = themeConfig.tiles[toPos]?.name ?? engineTile.name;
      const isBuyable =
        (engineTile.type === 'property' || engineTile.type === 'station' || engineTile.type === 'utility') &&
        !demoState.properties[toPos]?.ownerId;

      setMoveEvent({
        playerId: activeP.id,
        fromPosition: fromPos,
        toPosition: toPos,
        dice: forceDirectLabel ? [0, 0] : [d1, d2],
        passedGo,
        timestamp: Date.now()
      });

      setDemoState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === activeP.id
            ? {
                ...p,
                position: toPos,
                balance: passedGo ? p.balance + 200 : p.balance,
                inJail: forceDirectLabel ? toPos === 10 : p.inJail
              }
            : p
        ),
        turn: {
          ...prev.turn,
          dice: forceDirectLabel ? prev.turn.dice : [d1, d2],
          rolledDouble: isDouble,
          canRoll: isDouble && !isBuyable,
          canEndTurn: !isBuyable && !isDouble,
          mustResolveTile: isBuyable,
          pendingTileId: isBuyable ? toPos : undefined
        }
      }));

      appendEventLog(
        forceDirectLabel
          ? `${activeP.nickname} sent to ${localizedName}`
          : `${activeP.nickname} rolled ${sum} -> ${localizedName}`,
        'roll'
      );
    },
    [demoState, themeConfig, appendEventLog]
  );

  const handleRollDice = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    if (rollTimeoutRef.current !== null) window.clearTimeout(rollTimeoutRef.current);
    rollTimeoutRef.current = window.setTimeout(() => {
      setDiceValues([d1, d2]);
      setIsRolling(false);
      executeMove(d1, d2);
    }, 560);
  }, [isRolling, executeMove]);

  const handleCornerHopTest = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    // Deterministic 5-step roll (3 + 2 = 5) moving around the next corner smoothly (e.g. 8 -> 13 or +5 around corner)
    if (rollTimeoutRef.current !== null) window.clearTimeout(rollTimeoutRef.current);
    rollTimeoutRef.current = window.setTimeout(() => {
      setDiceValues([3, 2]);
      setIsRolling(false);
      executeMove(3, 2);
    }, 480);
  }, [isRolling, executeMove]);

  const handleDirectSlideTest = useCallback(() => {
    if (isRolling) return;
    executeMove(0, 0, 10, 'Detention');
  }, [isRolling, executeMove]);

  const handleBuyProperty = useCallback(
    (tileId: number) => {
      const activeP = demoState.players.find(p => p.id === demoState.turn.activePlayerId);
      const engineTile = BOARD_TILES[tileId];
      if (!activeP || !engineTile || !engineTile.price) return;
      const localizedName = themeConfig.tiles[tileId]?.name ?? engineTile.name;

      setDemoState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === activeP.id
            ? {
                ...p,
                balance: Math.max(0, p.balance - (engineTile.price ?? 0)),
                properties: Array.from(new Set([...p.properties, tileId]))
              }
            : p
        ),
        properties: {
          ...prev.properties,
          [tileId]: {
            tileId,
            ownerId: activeP.id,
            houses: 0,
            hotel: false,
            isMortgaged: false
          }
        },
        turn: {
          ...prev.turn,
          mustResolveTile: false,
          pendingTileId: undefined,
          canRoll: prev.turn.rolledDouble,
          canEndTurn: !prev.turn.rolledDouble
        }
      }));

      setTileEffect({
        tileId,
        type: 'purchase',
        amount: engineTile.price,
        playerId: activeP.id,
        color: activeP.color,
        timestamp: Date.now()
      });
      window.setTimeout(() => setTileEffect(null), 1500);

      appendEventLog(`${activeP.nickname} bought ${localizedName}`, 'buy');
    },
    [demoState, themeConfig, appendEventLog]
  );

  const handleDeclineProperty = useCallback(
    (tileId: number) => {
      const localizedName = themeConfig.tiles[tileId]?.name ?? BOARD_TILES[tileId]?.name ?? '';
      setDemoState(prev => ({
        ...prev,
        turn: {
          ...prev.turn,
          mustResolveTile: false,
          pendingTileId: undefined,
          canRoll: prev.turn.rolledDouble,
          canEndTurn: !prev.turn.rolledDouble
        }
      }));
      appendEventLog(`${localizedName} passed to auction`, 'auction');
    },
    [themeConfig, appendEventLog]
  );

  const handleEndTurn = useCallback(() => {
    setDemoState(prev => {
      const nextIdx = (prev.turn.turnIndex + 1) % prev.players.length;
      const nextPlayer = prev.players[nextIdx];
      return {
        ...prev,
        turn: {
          ...prev.turn,
          turnIndex: nextIdx,
          activePlayerId: nextPlayer.id,
          rolledDouble: false,
          canRoll: true,
          canEndTurn: false,
          mustResolveTile: false,
          pendingTileId: undefined
        }
      };
    });
  }, []);

  const handleTogglePinPlayer = useCallback((pid: string) => {
    setPinnedPlayerId(prev => (prev === pid ? null : pid));
  }, []);

  const handleSelectMyToken = useCallback((tokenId: string) => {
    setDemoState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === 'p1' ? { ...p, token: tokenId } : p))
    }));
  }, []);

  const handleSendDemoChat = useCallback((text: string, isReaction = false) => {
    setDemoState(prev => {
      const me = prev.players[0];
      const msg: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: me.id,
        senderName: me.nickname,
        senderAvatar: me.avatar,
        senderColor: me.color,
        text,
        timestamp: Date.now(),
        isReaction
      };
      return {
        ...prev,
        chatMessages: [...prev.chatMessages, msg]
      };
    });
  }, []);

  const handleOpenDemoTrade = useCallback(() => {
    setTradeInitialDraft(null);
    setTradeModalMode('create');
    setIsTradeOpen(true);
  }, []);

  const handleDemoBid = useCallback(
    (amount: number) => {
      setDemoState(prev => {
        if (!prev.auction) return prev;
        return {
          ...prev,
          auction: {
            ...prev.auction,
            currentBid: amount,
            highestBidderId: 'p1',
            minNextBid: amount + 10,
            timerSeconds: Math.max(prev.auction.timerSeconds, 8)
          }
        };
      });
    },
    []
  );

  const handleDemoPassAuction = useCallback(() => {
    setDemoState(prev => {
      if (!prev.auction) return prev;
      const remaining = prev.auction.activePlayerIds.filter(id => id !== 'p1');
      if (remaining.length <= 1) {
        return { ...prev, auction: null };
      }
      return {
        ...prev,
        auction: { ...prev.auction, activePlayerIds: remaining }
      };
    });
  }, []);

  const handleDemoProposeTrade = useCallback(
    (draft: TradeDraft) => {
      setDemoState(prev => ({
        ...prev,
        activeTrade: {
          id: `trade-${Date.now()}`,
          initiatorId: 'p1',
          targetId: draft.targetId,
          offerCash: draft.offerCash,
          requestCash: draft.requestCash,
          offerPropertyIds: draft.offerPropertyIds,
          requestPropertyIds: draft.requestPropertyIds,
          status: 'pending',
          createdAt: Date.now()
        }
      }));
      pushToast('info', 'Trade Sent', 'Pending trade offer created.');
    },
    [pushToast]
  );

  const handleDemoAcceptTrade = useCallback(() => {
    setDemoState(prev => {
      const tr = prev.activeTrade;
      if (!tr) return prev;
      const nextProps = { ...prev.properties };
      tr.offerPropertyIds.forEach(id => {
        if (nextProps[id]) nextProps[id] = { ...nextProps[id], ownerId: tr.targetId };
      });
      tr.requestPropertyIds.forEach(id => {
        if (nextProps[id]) nextProps[id] = { ...nextProps[id], ownerId: tr.initiatorId };
      });
      const nextPlayers = prev.players.map(p => {
        if (p.id === tr.initiatorId) {
          return {
            ...p,
            balance: p.balance - tr.offerCash + tr.requestCash,
            properties: Object.values(nextProps).filter(pr => pr.ownerId === p.id).map(pr => pr.tileId)
          };
        }
        if (p.id === tr.targetId) {
          return {
            ...p,
            balance: p.balance - tr.requestCash + tr.offerCash,
            properties: Object.values(nextProps).filter(pr => pr.ownerId === p.id).map(pr => pr.tileId)
          };
        }
        return p;
      });
      return { ...prev, properties: nextProps, players: nextPlayers, activeTrade: null };
    });
    pushToast('money', 'Trade Completed', 'Properties and cash exchanged.');
  }, [pushToast]);

  const handleDemoRejectTrade = useCallback(() => {
    setDemoState(prev => ({ ...prev, activeTrade: null }));
    pushToast('info', 'Trade Closed', 'Trade offer dismissed.');
  }, [pushToast]);

  const handleDemoBuildHouse = useCallback((tileId: number) => {
    const cost = getTileById(tileId).houseCost ?? 50;
    setDemoState(prev => {
      const prop = prev.properties[tileId];
      if (!prop) return prev;
      const nextProp =
        prop.houses < 4 ? { ...prop, houses: prop.houses + 1 } : { ...prop, houses: 0, hotel: true };
      return {
        ...prev,
        properties: { ...prev.properties, [tileId]: nextProp },
        players: prev.players.map(p => (p.id === 'p1' ? { ...p, balance: p.balance - cost } : p))
      };
    });
  }, []);

  const handleDemoSellHouse = useCallback((tileId: number) => {
    const refund = Math.floor((getTileById(tileId).houseCost ?? 50) / 2);
    setDemoState(prev => {
      const prop = prev.properties[tileId];
      if (!prop) return prev;
      const nextProp = prop.hotel
        ? { ...prop, hotel: false, houses: 4 }
        : { ...prop, houses: Math.max(0, prop.houses - 1) };
      return {
        ...prev,
        properties: { ...prev.properties, [tileId]: nextProp },
        players: prev.players.map(p => (p.id === 'p1' ? { ...p, balance: p.balance + refund } : p))
      };
    });
  }, []);

  const handleDemoMortgage = useCallback((tileId: number) => {
    const tile = getTileById(tileId);
    const payout = tile.mortgageValue ?? Math.floor((tile.price ?? 100) / 2);
    setDemoState(prev => ({
      ...prev,
      properties: { ...prev.properties, [tileId]: { ...prev.properties[tileId], isMortgaged: true } },
      players: prev.players.map(p => (p.id === 'p1' ? { ...p, balance: p.balance + payout } : p))
    }));
  }, []);

  const handleDemoUnmortgage = useCallback((tileId: number) => {
    const tile = getTileById(tileId);
    const val = tile.mortgageValue ?? Math.floor((tile.price ?? 100) / 2);
    const cost = Math.ceil(val * 1.1);
    setDemoState(prev => ({
      ...prev,
      properties: { ...prev.properties, [tileId]: { ...prev.properties[tileId], isMortgaged: false } },
      players: prev.players.map(p => (p.id === 'p1' ? { ...p, balance: p.balance - cost } : p))
    }));
  }, []);

  const activePlayer =
    demoState.players.find(p => p.id === demoState.turn.activePlayerId) ?? demoState.players[0];
  const localPlayer = demoState.players[0];
  const activeHighlightId = hoveredPlayerId ?? pinnedPlayerId;

  // Empty board mode preserved for Phase C compatibility
  if (emptyBoardOnly) {
    return (
      <div
        data-theme={worldId}
        style={cssVars}
        className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[var(--bg)]"
      >
        <div
          className="w-full flex items-center justify-center"
          style={
            closeupParam === 'top-left'
              ? { transform: 'translate(200px, 285px) scale(1.85)', transformOrigin: 'center center' }
              : closeupParam === 'top-right'
              ? { transform: 'translate(-200px, 285px) scale(1.85)', transformOrigin: 'center center' }
              : undefined
          }
        >
          <GameBoard previewTheme={worldId} graphicsQuality={graphicsQuality} />
        </div>
      </div>
    );
  }

  // Dedicated close-ups: bottom row, single property tile, corner tile, 3-token stacked tile, or owned tiles
  if (
    closeupParam === 'valorant-tokens' ||
    closeupParam === 'valorant-owned' ||
    closeupParam === 'bottom-row' ||
    closeupParam === 'stacked-3' ||
    closeupParam === 'property-single' ||
    closeupParam === 'corner'
  ) {
    const transformStyle =
      closeupParam === 'valorant-owned'
        ? { transform: 'translate(225px, -110px) scale(1.9)', transformOrigin: 'center center' }
        : closeupParam === 'stacked-3'
        ? { transform: 'translate(-220px, -460px) scale(2.45)', transformOrigin: 'center center' }
        : closeupParam === 'property-single'
        ? { transform: 'translate(-220px, -480px) scale(2.65)', transformOrigin: 'center center' }
        : closeupParam === 'corner'
        ? { transform: 'translate(-510px, -455px) scale(2.4)', transformOrigin: 'center center' }
        : { transform: 'translate(-145px, -340px) scale(1.95)', transformOrigin: 'center center' };
    return (
      <div
        data-theme={worldId}
        style={{ ...cssVars, backgroundColor: 'var(--bg)', color: 'var(--board-ink)' }}
        className="h-screen w-full flex items-center justify-center overflow-hidden"
      >
        <div className="w-full h-full flex items-center justify-center" style={transformStyle}>
          <GameBoard
            previewTheme={worldId}
            demoGameState={demoState}
            graphicsQuality={graphicsQuality}
            centerOverride={{
              gameState: demoState,
              player: activePlayer,
              themeConfig,
              isRolling: false,
              rollingDiceValues: diceValues,
              onRollDice: handleRollDice,
              onBuyProperty: handleBuyProperty,
              onDeclineProperty: handleDeclineProperty,
              onEndTurn: handleEndTurn
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme={worldId}
      style={{ ...cssVars, backgroundColor: 'var(--bg)', color: 'var(--board-ink)' }}
      className="h-screen w-full overflow-hidden p-2 flex flex-col gap-2"
    >
      {/* Three-Zone Phase E In-Game Layout: Left (World Switcher + Info + Chat), Center (Turn HUD + Board), Right (Players + Trades + My Properties) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 items-stretch">
        {/* LEFT COLUMN: Compact World Switcher (Preview) + Game Info + Chat */}
        <div className="lg:w-[244px] xl:w-[274px] 2xl:w-[304px] shrink-0 flex flex-col gap-2 min-h-0">
          {!hideSwitcher && (
            <nav
              aria-label="World Switcher"
              data-chamfered={themeConfig.chamfered ? 'true' : 'false'}
              className="tv-hud-panel p-1 grid grid-cols-5 gap-1 shrink-0"
            >
              {WORLD_THEME_LIST.map(w => {
                const active = w.id === worldId;
                const shortLabel =
                  w.id === 'original'
                    ? 'ORIG'
                    : w.id === 'valorant'
                    ? 'VAL'
                    : w.id === 'cyberpunk'
                    ? 'CYBER'
                    : w.id === 'wompwomp'
                    ? 'WOMP'
                    : w.name;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleSwitchWorld(w.id)}
                    style={{
                      backgroundColor: active ? 'var(--accent)' : 'transparent',
                      color: active ? (w.id === 'valorant' ? '#FFFFFF' : '#0B1218') : 'var(--board-ink)',
                      borderRadius: 'var(--radius-button)',
                      fontFamily: 'var(--font-body)'
                    }}
                    className="tv-hud-focus py-1 text-[10px] font-bold uppercase tracking-wider transition-colors truncate"
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </nav>
          )}

          <GameInfoCard
            roomCode={demoState.roomCode}
            themeConfig={themeConfig}
            isConnected={true}
            jackpotPool={demoState.jackpotPool}
            preferences={prefs}
            onUpdatePreferences={handleUpdatePrefs}
            onLeaveGame={() => pushToast('info', 'Leave Match', 'Returned to lobby (preview mode).')}
          />

          <ChatBox
            gameState={demoState}
            localPlayer={localPlayer}
            themeConfig={themeConfig}
            onSendChat={handleSendDemoChat}
            isCollapsed={!prefs.chatVisible}
            onToggleCollapse={() => handleUpdatePrefs({ chatVisible: !prefs.chatVisible })}
          />
        </div>

        {/* CENTER COLUMN: Contextual Turn & Action HUD + Untouched 2.5D GameBoard */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col items-center justify-between gap-1.5">
          <div className="relative z-40 w-full flex justify-center shrink-0">
            <TurnActionBar
              gameState={demoState}
              localPlayer={localPlayer}
              themeConfig={themeConfig}
              isRolling={isRolling}
              onRollDice={handleRollDice}
              onBuyProperty={handleBuyProperty}
              onDeclineProperty={handleDeclineProperty}
              onEndTurn={handleEndTurn}
              onInspectTile={tileId => setSelectedTile(getTileById(tileId) ?? null)}
              onOpenTrade={handleOpenDemoTrade}
            />
          </div>

          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-visible">
            <GameBoard
              previewTheme={worldId}
              demoGameState={demoState}
              demoMoveEvent={moveEvent}
              demoTileEffect={tileEffect}
              highlightedPlayerId={activeHighlightId}
              graphicsQuality={graphicsQuality}
              onTileClick={tileId => {
                const t = getTileById(tileId);
                if (t) setSelectedTile(t);
              }}
              centerOverride={{
                gameState: demoState,
                player: activePlayer,
                themeConfig,
                isRolling,
                midRollPreview: initialDiceMidRoll && !isRolling,
                rollingDiceValues: diceValues,
                onRollDice: handleRollDice,
                onBuyProperty: handleBuyProperty,
                onDeclineProperty: handleDeclineProperty,
                onEndTurn: handleEndTurn
              }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Players (Timer Ring, Status Pills, Delta Cash) + Trades Hook + My Properties */}
        <div className="lg:w-[254px] xl:w-[284px] 2xl:w-[316px] shrink-0 min-h-0 flex flex-col gap-2">
          {showTokenPicker && (
            <div
              data-chamfered={themeConfig.chamfered ? 'true' : 'false'}
              className="tv-hud-panel p-2.5 shrink-0"
            >
              <TokenPicker
                themeConfig={themeConfig}
                selectedTokenId={demoState.players[0].token}
                takenTokenIds={demoState.players.slice(1).map(p => p.token)}
                playerColor={demoState.players[0].color}
                onSelectToken={handleSelectMyToken}
                compact={true}
              />
            </div>
          )}

          <PlayerPanel
            gameState={demoState}
            localPlayerId="p1"
            themeConfig={themeConfig}
            hoveredPlayerId={hoveredPlayerId}
            pinnedPlayerId={pinnedPlayerId}
            onHoverPlayer={setHoveredPlayerId}
            onTogglePinPlayer={handleTogglePinPlayer}
            onSelectTile={tileId => setSelectedTile(getTileById(tileId) ?? null)}
            onOpenTrade={handleOpenDemoTrade}
            onAcceptTrade={handleDemoAcceptTrade}
            onRejectTrade={handleDemoRejectTrade}
            onCounterTrade={() => {
              if (!demoState.activeTrade) return;
              setTradeInitialDraft({
                targetId: demoState.activeTrade.initiatorId,
                offerCash: demoState.activeTrade.requestCash,
                requestCash: demoState.activeTrade.offerCash,
                offerPropertyIds: [...demoState.activeTrade.requestPropertyIds],
                requestPropertyIds: [...demoState.activeTrade.offerPropertyIds]
              });
              setTradeModalMode('create');
              setIsTradeOpen(true);
            }}
            onBuildHouse={handleDemoBuildHouse}
            onSellHouse={handleDemoSellHouse}
            onMortgageProperty={handleDemoMortgage}
            onUnmortgageProperty={handleDemoUnmortgage}
            initialExpandedTileId={initialPropManageId}
          />
        </div>
      </div>

      {/* Corner Event Toasts (max 3, auto-dismiss) */}
      <ToastStack toasts={toasts} themeConfig={themeConfig} onDismiss={dismissToast} />

      {/* World-Themed Property Card Popup */}
      <PropertyDetailModal
        tile={selectedTile}
        gameState={demoState}
        localPlayer={localPlayer}
        themeConfig={themeConfig}
        onClose={() => setSelectedTile(null)}
        onBuyProperty={handleBuyProperty}
        onDeclineProperty={handleDeclineProperty}
        onBuildHouse={handleDemoBuildHouse}
        onSellHouse={handleDemoSellHouse}
        onMortgageProperty={handleDemoMortgage}
        onUnmortgageProperty={handleDemoUnmortgage}
      />

      {/* World-Themed Event Card Modal */}
      <CardModal
        card={previewCard}
        drawerPlayer={localPlayer}
        gameState={demoState}
        themeConfig={themeConfig}
        onClose={() => setPreviewCard(null)}
      />

      {/* World-Themed Game Over Modal */}
      <GameOverModal
        gameState={demoState}
        themeConfig={themeConfig}
        onPlayAgain={() => setDemoState(buildInitialDemoState(worldId, closeupParam))}
        onBackToLobby={() => setDemoState(buildInitialDemoState(worldId, closeupParam))}
      />

      {/* World-Themed Auction Modal */}
      <AuctionModal
        gameState={demoState}
        localPlayer={localPlayer}
        themeConfig={themeConfig}
        onBid={handleDemoBid}
        onPass={handleDemoPassAuction}
        initialBidHistory={demoAuctionBids}
        forcedResult={auctionResultPreview}
        initialTimerExtended={initialModalParam === 'auction'}
      />

      {/* World-Themed Trade Modal */}
      <TradeModal
        isOpen={isTradeOpen}
        gameState={demoState}
        localPlayer={localPlayer}
        themeConfig={themeConfig}
        initialMode={tradeModalMode}
        initialDraft={tradeInitialDraft}
        onClose={() => setIsTradeOpen(false)}
        onProposeTrade={handleDemoProposeTrade}
        onAcceptTrade={handleDemoAcceptTrade}
        onRejectTrade={handleDemoRejectTrade}
      />

      {/* Dev Sound Preview Lab */}
      <SoundPreviewPanel
        isOpen={isSoundPanelOpen}
        initialWorld={worldId}
        themeConfig={themeConfig}
        onClose={() => setIsSoundPanelOpen(false)}
      />
    </div>
  );
};
