import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  GameState,
  Player,
  BoardTile,
  SOCKET_EVENTS,
  GuestSession
} from '@tycoonvale/shared';
import { socketService } from '../services/socket.js';
import { getStoredSession, saveSession, bindAuthenticatedUserId } from '../services/session.js';
import { soundEngine } from '../services/audio.js';
import {
  isSupabaseConfigured,
  supabaseAuth,
  supabaseRealtime,
  supabaseGameService,
  RealtimeConnectionStatus,
  PlayerPresencePayload
} from '../services/supabase/index.js';

export interface ActiveMoveEvent {
  playerId: string;
  fromPosition: number;
  toPosition: number;
  dice: [number, number];
  passedGo: boolean;
  timestamp: number;
}

export interface ActiveTileEffect {
  tileId: number;
  type: 'purchase' | 'rent' | 'jackpot' | 'tax';
  amount?: number;
  playerId?: string;
  color?: string;
  timestamp: number;
}

interface GameContextType {
  gameState: GameState | null;
  player: Player | null;
  session: GuestSession;
  updateSession: (updated: Partial<GuestSession>) => void;
  backendMode: 'supabase' | 'socket';
  connectionStatus: RealtimeConnectionStatus;
  onlineUserIds: string[];
  isConnected: boolean;
  isRolling: boolean;
  rollingDiceValues: [number, number];
  activeMoveEvent: ActiveMoveEvent | null;
  activeTileEffect: ActiveTileEffect | null;
  error: string | null;
  clearError: () => void;
  selectedTile: BoardTile | null;
  setSelectedTile: (tile: BoardTile | null) => void;
  isTradeModalOpen: boolean;
  setIsTradeModalOpen: (open: boolean) => void;
  isChatDrawerOpen: boolean;
  setIsChatDrawerOpen: (open: boolean) => void;
  unreadChatCount: number;
  resetUnreadChatCount: () => void;

  // Actions
  createRoom: (settings?: any) => Promise<boolean>;
  joinRoom: (roomCode: string) => Promise<boolean>;
  toggleReady: (ready: boolean) => void;
  setTeam: (team: 'gold' | 'silver') => void;
  updateSettings: (settings: any) => void;
  startGame: () => void;
  rollDice: () => void;
  buyProperty: (tileId: number) => void;
  declineProperty: (tileId: number) => void;
  endTurn: () => void;
  buildHouse: (tileId: number) => void;
  sellHouse: (tileId: number) => void;
  mortgageProperty: (tileId: number) => void;
  unmortgageProperty: (tileId: number) => void;
  payJailFine: () => void;
  useJailCard: () => void;
  bidAuction: (amount: number) => void;
  passAuction: () => void;
  proposeTrade: (payload: any) => void;
  acceptTrade: () => void;
  rejectTrade: () => void;
  sendChat: (text: string, isReaction?: boolean) => void;
  leaveRoom: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const USE_SUPABASE: boolean =
  isSupabaseConfigured() && import.meta.env.VITE_BACKEND_MODE !== 'socket';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<GuestSession>(getStoredSession);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('IDLE');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollingDiceValues, setRollingDiceValues] = useState<[number, number]>([1, 1]);
  const [activeMoveEvent, setActiveMoveEvent] = useState<ActiveMoveEvent | null>(null);
  const [activeTileEffect, setActiveTileEffect] = useState<ActiveTileEffect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<BoardTile | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  const activeRoomIdRef = useRef<string | null>(null);
  const onlineSetRef = useRef<Set<string>>(new Set());
  const isChatOpenRef = useRef<boolean>(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tileEffectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  isChatOpenRef.current = isChatDrawerOpen;

  const backendMode: 'supabase' | 'socket' = USE_SUPABASE ? 'supabase' : 'socket';
  const socket = !USE_SUPABASE ? socketService.getSocket() : null;

  const resetUnreadChatCount = useCallback(() => {
    setUnreadChatCount(0);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const triggerDiceAnimation = useCallback(
    (dice: [number, number], isDouble: boolean) => {
      if (diceIntervalRef.current) {
        clearInterval(diceIntervalRef.current);
      }
      setIsRolling(true);
      soundEngine.playDiceRoll();

      let tick = 0;
      diceIntervalRef.current = setInterval(() => {
        setRollingDiceValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
        tick++;
        if (tick >= 7) {
          if (diceIntervalRef.current) {
            clearInterval(diceIntervalRef.current);
            diceIntervalRef.current = null;
          }
          setRollingDiceValues(dice);
          setIsRolling(false);
          if (isDouble) {
            soundEngine.playCoin();
          }
        }
      }, 65);
    },
    []
  );

  const triggerTileEffect = useCallback(
    (effect: Omit<ActiveTileEffect, 'timestamp'>) => {
      if (tileEffectTimerRef.current) {
        clearTimeout(tileEffectTimerRef.current);
      }
      setActiveTileEffect({ ...effect, timestamp: Date.now() });
      tileEffectTimerRef.current = setTimeout(() => {
        setActiveTileEffect(null);
      }, 1500);
    },
    []
  );

  const applyGameState = useCallback(
    (nextState: GameState, targetSessionId: string) => {
      setGameState(prev => {
        if (prev && !isChatOpenRef.current && nextState.chatMessages.length > prev.chatMessages.length) {
          const diff = nextState.chatMessages.length - prev.chatMessages.length;
          setUnreadChatCount(c => c + diff);
        }
        return nextState;
      });
      const found = nextState.players.find(
        p => p.sessionId === targetSessionId || p.id === targetSessionId
      );
      if (found) {
        setPlayer(found);
      }
    },
    []
  );

  const refreshSupabaseRoomState = useCallback(
    async (roomId: string, userIdOverride?: string) => {
      const res = await supabaseGameService.fetchFullRoomState(
        roomId,
        onlineSetRef.current.size > 0 ? onlineSetRef.current : undefined
      );
      if (res.success && res.data) {
        const currentUid = userIdOverride || (await supabaseAuth.getCurrentUserId()) || session.sessionId;
        applyGameState(res.data, currentUid);
      }
    },
    [applyGameState, session.sessionId]
  );

  const scheduleCoalescedRefresh = useCallback(
    (roomId: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        void refreshSupabaseRoomState(roomId);
      }, 75);
    },
    [refreshSupabaseRoomState]
  );

  const subscribeToSupabaseRoom = useCallback(
    async (roomId: string, roomCode: string, userId: string, currentSession: GuestSession) => {
      activeRoomIdRef.current = roomId;
      onlineSetRef.current = new Set([userId]);
      setOnlineUserIds([userId]);

      const presencePayload: PlayerPresencePayload = {
        userId,
        nickname: currentSession.nickname,
        avatar: currentSession.avatar,
        token: currentSession.token,
        color: currentSession.color,
        onlineAt: new Date().toISOString()
      };

      await supabaseRealtime.joinRoomChannel({
        roomCode,
        roomId,
        presence: presencePayload,
        handlers: {
          onStatusChange: (status, errMsg) => {
            setConnectionStatus(status);
            setIsConnected(status === 'CONNECTED' || status === 'CONNECTING' || status === 'RECONNECTING');
            if (status === 'ERROR' && errMsg) {
              setError(errMsg);
            }
          },
          onPresenceSync: (players) => {
            const ids = players.map(p => p.userId);
            onlineSetRef.current = new Set(ids);
            setOnlineUserIds(ids);
            setGameState(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map(p => ({
                  ...p,
                  isDisconnected: !onlineSetRef.current.has(p.id)
                }))
              };
            });
          },
          onDiceRolled: (payload) => {
            triggerDiceAnimation(payload.dice, payload.isDouble);
          },
          onPlayerMoved: (payload) => {
            setActiveMoveEvent({ ...payload, timestamp: Date.now() });
          },
          onTileEffect: (payload) => {
            triggerTileEffect(payload);
            if (payload.type === 'purchase') soundEngine.playBuy();
            if (payload.type === 'rent' || payload.type === 'jackpot') soundEngine.playCoin();
          },
          onDatabaseChange: () => {
            scheduleCoalescedRefresh(roomId);
          },
          onReconnected: () => {
            void refreshSupabaseRoomState(roomId, userId);
          }
        }
      });
    },
    [refreshSupabaseRoomState, scheduleCoalescedRefresh, triggerDiceAnimation, triggerTileEffect]
  );

  const updateSession = useCallback(
    (updated: Partial<GuestSession>) => {
      setSession(prev => {
        const next = { ...prev, ...updated };
        saveSession(next);
        if (USE_SUPABASE) {
          void supabaseAuth.syncPlayerProfile(next);
          void supabaseRealtime.updatePresence({
            nickname: next.nickname,
            avatar: next.avatar,
            token: next.token,
            color: next.color
          });
        }
        return next;
      });
    },
    []
  );

  // Initialize backend connection & auto-reconnect across refreshes
  useEffect(() => {
    if (USE_SUPABASE) {
      let mounted = true;

      const initSupabase = async () => {
        const authRes = await supabaseAuth.ensureAnonymousSession(session);
        if (!mounted) return;

        if (!authRes.success || !authRes.user) {
          setIsConnected(false);
          setConnectionStatus('ERROR');
          if (authRes.error) setError(authRes.error);
          return;
        }

        const boundSession = bindAuthenticatedUserId(authRes.user.id);
        setSession(boundSession);
        setIsConnected(true);
        setConnectionStatus('CONNECTED');

        // Auto-reconnect if player refreshed mid-match
        const savedRoomCode = sessionStorage.getItem('tycoonvale_active_room');
        if (savedRoomCode) {
          const rejoin = await supabaseGameService.joinRoom(savedRoomCode, boundSession);
          if (mounted && rejoin.success && rejoin.data) {
            await subscribeToSupabaseRoom(
              rejoin.data.roomId,
              rejoin.data.roomCode,
              rejoin.data.userId,
              boundSession
            );
            await refreshSupabaseRoomState(rejoin.data.roomId, rejoin.data.userId);
          } else if (mounted) {
            sessionStorage.removeItem('tycoonvale_active_room');
          }
        }
      };

      void initSupabase();

      return () => {
        mounted = false;
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        if (diceIntervalRef.current) clearInterval(diceIntervalRef.current);
        if (tileEffectTimerRef.current) clearTimeout(tileEffectTimerRef.current);
      };
    }

    // Legacy Socket.IO mode (preserved intact until Supabase verification is complete)
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      setConnectionStatus('CONNECTED');
      const savedRoom = sessionStorage.getItem('tycoonvale_active_room');
      if (savedRoom) {
        socket.emit(
          SOCKET_EVENTS.ROOM_RECONNECT,
          { roomCode: savedRoom, sessionId: session.sessionId },
          (res: any) => {
            if (res?.success) {
              applyGameState(res.gameState, session.sessionId);
            } else {
              sessionStorage.removeItem('tycoonvale_active_room');
            }
          }
        );
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus('DISCONNECTED');
    };

    const onStateUpdate = (newState: GameState) => {
      applyGameState(newState, session.sessionId);
    };

    const onDiceAnimation = (data: { playerId: string; dice: [number, number]; isDouble: boolean }) => {
      triggerDiceAnimation(data.dice, data.isDouble);
    };

    const onPlayerMoved = (data: Omit<ActiveMoveEvent, 'timestamp'>) => {
      setActiveMoveEvent({ ...data, timestamp: Date.now() });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, onStateUpdate);
    socket.on(SOCKET_EVENTS.DICE_ROLLED_ANIMATION, onDiceAnimation);
    socket.on(SOCKET_EVENTS.PLAYER_MOVED_ANIMATION, onPlayerMoved);

    if (socket.connected) {
      setIsConnected(true);
      setConnectionStatus('CONNECTED');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE, onStateUpdate);
      socket.off(SOCKET_EVENTS.DICE_ROLLED_ANIMATION, onDiceAnimation);
      socket.off(SOCKET_EVENTS.PLAYER_MOVED_ANIMATION, onPlayerMoved);
    };
  }, [socket, session.sessionId]);

  // Turn sound notification
  useEffect(() => {
    if (gameState && player && gameState.phase === 'PLAYING') {
      if (gameState.turn.activePlayerId === player.id && gameState.turn.canRoll) {
        soundEngine.playTurnNotification();
      }
    }
  }, [gameState?.turn.activePlayerId, player?.id]);

  // Keep dice tray synced with authoritative dice when not actively rolling
  useEffect(() => {
    if (gameState?.turn.dice && !isRolling) {
      setRollingDiceValues(gameState.turn.dice);
    }
  }, [gameState?.turn.dice?.[0], gameState?.turn.dice?.[1], isRolling]);

  const createRoom = useCallback(
    async (settings?: any): Promise<boolean> => {
      soundEngine.playClick();

      if (USE_SUPABASE) {
        const res = await supabaseGameService.createRoom(session, settings);
        if (!res.success || !res.data) {
          setError(res.error || 'Failed to create room.');
          return false;
        }
        const bound = bindAuthenticatedUserId(res.data.userId);
        setSession(bound);
        sessionStorage.setItem('tycoonvale_active_room', res.data.roomCode);
        await subscribeToSupabaseRoom(res.data.roomId, res.data.roomCode, res.data.userId, bound);
        await refreshSupabaseRoomState(res.data.roomId, res.data.userId);
        return true;
      }

      return new Promise(resolve => {
        socket!.emit(SOCKET_EVENTS.ROOM_CREATE, { session, settings }, (res: any) => {
          if (res?.success) {
            applyGameState(res.gameState, session.sessionId);
            sessionStorage.setItem('tycoonvale_active_room', res.gameState.roomCode);
            resolve(true);
          } else {
            setError(res?.error || 'Failed to create room.');
            resolve(false);
          }
        });
      });
    },
    [socket, session, applyGameState, subscribeToSupabaseRoom, refreshSupabaseRoomState]
  );

  const joinRoom = useCallback(
    async (roomCode: string): Promise<boolean> => {
      soundEngine.playClick();

      if (USE_SUPABASE) {
        const res = await supabaseGameService.joinRoom(roomCode, session);
        if (!res.success || !res.data) {
          setError(res.error || 'Failed to join room.');
          return false;
        }
        const bound = bindAuthenticatedUserId(res.data.userId);
        setSession(bound);
        sessionStorage.setItem('tycoonvale_active_room', res.data.roomCode);
        await subscribeToSupabaseRoom(res.data.roomId, res.data.roomCode, res.data.userId, bound);
        await refreshSupabaseRoomState(res.data.roomId, res.data.userId);
        return true;
      }

      return new Promise(resolve => {
        socket!.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode: roomCode.trim().toUpperCase(), session }, (res: any) => {
          if (res?.success) {
            applyGameState(res.gameState, session.sessionId);
            sessionStorage.setItem('tycoonvale_active_room', res.gameState.roomCode);
            resolve(true);
          } else {
            setError(res?.error || 'Failed to join room.');
            resolve(false);
          }
        });
      });
    },
    [socket, session, applyGameState, subscribeToSupabaseRoom, refreshSupabaseRoomState]
  );

  const toggleReady = useCallback(
    (ready: boolean) => {
      if (!gameState) return;
      soundEngine.playClick();
      if (USE_SUPABASE && activeRoomIdRef.current && player) {
        void supabaseGameService.toggleReady(activeRoomIdRef.current, player.id, ready).then(res => {
          if (!res.success) setError(res.error || 'Could not update ready state.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.PLAYER_READY, { roomCode: gameState.roomCode, isReady: ready }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, gameState, player, refreshSupabaseRoomState]
  );

  const setTeam = useCallback(
    (team: 'gold' | 'silver') => {
      if (!gameState) return;
      soundEngine.playClick();
      if (USE_SUPABASE && activeRoomIdRef.current && player) {
        void supabaseGameService.setTeam(activeRoomIdRef.current, player.id, team).then(res => {
          if (!res.success) setError(res.error || 'Could not switch team.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.PLAYER_SET_TEAM, { roomCode: gameState.roomCode, team }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, gameState, player, refreshSupabaseRoomState]
  );

  const updateSettings = useCallback(
    (settingsPatch: any) => {
      if (!gameState) return;
      soundEngine.playClick();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        const merged = { ...gameState.settings, ...settingsPatch };
        void supabaseGameService.updateSettings(activeRoomIdRef.current, merged).then(res => {
          if (!res.success) setError(res.error || 'Could not update settings.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.SETTINGS_UPDATE, { roomCode: gameState.roomCode, settings: settingsPatch }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, gameState, refreshSupabaseRoomState]
  );

  const startGame = useCallback(() => {
    if (!gameState) return;
    soundEngine.playClick();
    if (USE_SUPABASE && activeRoomIdRef.current) {
      void supabaseGameService.startGame(activeRoomIdRef.current).then(res => {
        if (!res.success) setError(res.error || 'Could not start match.');
        else void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.GAME_START, { roomCode: gameState.roomCode }, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, gameState, refreshSupabaseRoomState]);

  const rollDice = useCallback(() => {
    soundEngine.playClick();
    if (USE_SUPABASE && activeRoomIdRef.current && player) {
      void supabaseGameService.rollDice(activeRoomIdRef.current, player.id, player.color).then(res => {
        if (!res.success) {
          setError(res.error || 'Could not roll dice.');
          return;
        }
        const d = res.data;
        if (d?.dice) {
          const diceTuple: [number, number] = [Number(d.dice[0]), Number(d.dice[1])];
          triggerDiceAnimation(diceTuple, Boolean(d.is_double));
          if (d.from_position !== undefined && d.new_position !== undefined && d.from_position !== d.new_position) {
            setActiveMoveEvent({
              playerId: player.id,
              fromPosition: Number(d.from_position),
              toPosition: Number(d.new_position),
              dice: diceTuple,
              passedGo: Boolean(d.passed_go),
              timestamp: Date.now()
            });
          }
          if (d.effect_type && d.effect_amount) {
            triggerTileEffect({
              tileId: Number(d.new_position),
              type: d.effect_type,
              amount: Number(d.effect_amount),
              playerId: player.id,
              color: player.color
            });
          }
        }
        void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.DICE_ROLL, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, player, triggerDiceAnimation, triggerTileEffect, refreshSupabaseRoomState]);

  const buyProperty = useCallback(
    (tileId: number) => {
      soundEngine.playBuy();
      if (USE_SUPABASE && activeRoomIdRef.current && player) {
        void supabaseGameService
          .buyProperty(activeRoomIdRef.current, tileId, player.id, player.color)
          .then(res => {
            if (!res.success) {
              setError(res.error || 'Purchase failed.');
              return;
            }
            triggerTileEffect({
              tileId,
              type: 'purchase',
              amount: Number(res.data?.price ?? 0),
              playerId: player.id,
              color: player.color
            });
            void refreshSupabaseRoomState(activeRoomIdRef.current!);
          });
        return;
      }
      socket!.emit(SOCKET_EVENTS.PROPERTY_BUY, { tileId }, (res: any) => {
        if (!res?.success) setError(res?.error);
        else if (player) {
          triggerTileEffect({ tileId, type: 'purchase', playerId: player.id, color: player.color });
        }
      });
    },
    [socket, player, triggerTileEffect, refreshSupabaseRoomState]
  );

  const declineProperty = useCallback(
    (tileId: number) => {
      soundEngine.playClick();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        void supabaseGameService.declineProperty(activeRoomIdRef.current, tileId).then(res => {
          if (!res.success) setError(res.error || 'Could not decline property.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.PROPERTY_DECLINE, { tileId }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, refreshSupabaseRoomState]
  );

  const endTurn = useCallback(() => {
    soundEngine.playClick();
    if (USE_SUPABASE && activeRoomIdRef.current) {
      void supabaseGameService.endTurn(activeRoomIdRef.current).then(res => {
        if (!res.success) setError(res.error || 'Could not end turn.');
        else void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.TURN_END, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, refreshSupabaseRoomState]);

  const buildHouse = useCallback(
    (tileId: number) => {
      soundEngine.playBuy();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        void supabaseGameService.buildHouse(activeRoomIdRef.current, tileId).then(res => {
          if (!res.success) setError(res.error || 'Cannot build house.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.BUILD_HOUSE, { tileId }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, refreshSupabaseRoomState]
  );

  const sellHouse = useCallback(
    (tileId: number) => {
      soundEngine.playCoin();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        void supabaseGameService.sellHouse(activeRoomIdRef.current, tileId).then(res => {
          if (!res.success) setError(res.error || 'Cannot sell house.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.SELL_HOUSE, { tileId }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, refreshSupabaseRoomState]
  );

  const mortgageProperty = useCallback(
    (tileId: number) => {
      soundEngine.playCoin();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        void supabaseGameService.mortgageProperty(activeRoomIdRef.current, tileId).then(res => {
          if (!res.success) setError(res.error || 'Cannot mortgage property.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.MORTGAGE_PROPERTY, { tileId }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, refreshSupabaseRoomState]
  );

  const unmortgageProperty = useCallback(
    (tileId: number) => {
      soundEngine.playBuy();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        void supabaseGameService.unmortgageProperty(activeRoomIdRef.current, tileId).then(res => {
          if (!res.success) setError(res.error || 'Cannot unmortgage property.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.UNMORTGAGE_PROPERTY, { tileId }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, refreshSupabaseRoomState]
  );

  const payJailFine = useCallback(() => {
    soundEngine.playCoin();
    if (USE_SUPABASE && activeRoomIdRef.current) {
      void supabaseGameService.payJailFine(activeRoomIdRef.current).then(res => {
        if (!res.success) setError(res.error || 'Cannot pay bail.');
        else void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.PAY_JAIL_FINE, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, refreshSupabaseRoomState]);

  const useJailCard = useCallback(() => {
    soundEngine.playClick();
    if (USE_SUPABASE && activeRoomIdRef.current) {
      void supabaseGameService.useJailCard(activeRoomIdRef.current).then(res => {
        if (!res.success) setError(res.error || 'Cannot use pardon card.');
        else void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.USE_JAIL_CARD, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, refreshSupabaseRoomState]);

  const bidAuction = useCallback(
    (amount: number) => {
      soundEngine.playCoin();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        void supabaseGameService.bidAuction(activeRoomIdRef.current, amount).then(res => {
          if (!res.success) setError(res.error || 'Bid rejected.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.AUCTION_BID, { amount }, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, refreshSupabaseRoomState]
  );

  const passAuction = useCallback(() => {
    soundEngine.playClick();
    if (USE_SUPABASE && activeRoomIdRef.current) {
      void supabaseGameService.passAuction(activeRoomIdRef.current).then(res => {
        if (!res.success) setError(res.error || 'Could not pass auction.');
        else void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.AUCTION_PASS, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, refreshSupabaseRoomState]);

  const proposeTrade = useCallback(
    (payload: any) => {
      soundEngine.playClick();
      if (USE_SUPABASE && activeRoomIdRef.current) {
        void supabaseGameService.proposeTrade(activeRoomIdRef.current, payload).then(res => {
          if (!res.success) setError(res.error || 'Could not propose trade.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.TRADE_PROPOSE, payload, (res: any) => {
        if (!res?.success) setError(res?.error);
      });
    },
    [socket, refreshSupabaseRoomState]
  );

  const acceptTrade = useCallback(() => {
    soundEngine.playBuy();
    if (USE_SUPABASE && activeRoomIdRef.current) {
      void supabaseGameService.acceptTrade(activeRoomIdRef.current, gameState?.activeTrade?.id).then(res => {
        if (!res.success) setError(res.error || 'Could not ratify trade.');
        else void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.TRADE_ACCEPT, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, gameState?.activeTrade?.id, refreshSupabaseRoomState]);

  const rejectTrade = useCallback(() => {
    soundEngine.playClick();
    if (USE_SUPABASE && activeRoomIdRef.current) {
      void supabaseGameService.rejectTrade(activeRoomIdRef.current, gameState?.activeTrade?.id).then(res => {
        if (!res.success) setError(res.error || 'Could not decline trade.');
        else void refreshSupabaseRoomState(activeRoomIdRef.current!);
      });
      return;
    }
    socket!.emit(SOCKET_EVENTS.TRADE_REJECT, (res: any) => {
      if (!res?.success) setError(res?.error);
    });
  }, [socket, gameState?.activeTrade?.id, refreshSupabaseRoomState]);

  const sendChat = useCallback(
    (text: string, isReaction: boolean = false) => {
      soundEngine.playClick();
      if (USE_SUPABASE && activeRoomIdRef.current && player) {
        void supabaseGameService.sendChat(activeRoomIdRef.current, player, text, isReaction).then(res => {
          if (!res.success) setError(res.error || 'Failed to send message.');
          else void refreshSupabaseRoomState(activeRoomIdRef.current!);
        });
        return;
      }
      socket!.emit(SOCKET_EVENTS.CHAT_SEND, { text, isReaction });
    },
    [socket, player, refreshSupabaseRoomState]
  );

  const leaveRoom = useCallback(() => {
    soundEngine.playClick();
    sessionStorage.removeItem('tycoonvale_active_room');
    setGameState(null);
    setPlayer(null);
    setActiveMoveEvent(null);
    setActiveTileEffect(null);

    if (USE_SUPABASE) {
      activeRoomIdRef.current = null;
      setOnlineUserIds([]);
      onlineSetRef.current = new Set();
      void supabaseRealtime.leaveRoomChannel();
      return;
    }

    socket!.disconnect();
    socket!.connect();
  }, [socket]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        player,
        session,
        updateSession,
        backendMode,
        connectionStatus,
        onlineUserIds,
        isConnected,
        isRolling,
        rollingDiceValues,
        activeMoveEvent,
        activeTileEffect,
        error,
        clearError,
        selectedTile,
        setSelectedTile,
        isTradeModalOpen,
        setIsTradeModalOpen,
        isChatDrawerOpen,
        setIsChatDrawerOpen,
        unreadChatCount,
        resetUnreadChatCount,
        createRoom,
        joinRoom,
        toggleReady,
        setTeam,
        updateSettings,
        startGame,
        rollDice,
        buyProperty,
        declineProperty,
        endTurn,
        buildHouse,
        sellHouse,
        mortgageProperty,
        unmortgageProperty,
        payJailFine,
        useJailCard,
        bidAuction,
        passAuction,
        proposeTrade,
        acceptTrade,
        rejectTrade,
        sendChat,
        leaveRoom
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
