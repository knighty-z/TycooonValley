// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { BOARD_TILES, GuestSession } from '@tycoonvale/shared';
import {
  SupabaseGameService,
  mapSnapshotToGameState,
  RoomSnapshotPayload
} from '../gameService.js';
import { SupabaseGuestAuthService } from '../auth.js';
import {
  SupabaseRealtimeClient,
  DiceRolledBroadcastPayload,
  PlayerMovedBroadcastPayload,
  TileEffectBroadcastPayload
} from '../realtime.js';
import { DiceFace } from '../../../components/Board/DiceFace.js';
import { AnimatedCurrency } from '../../../components/HUD/AnimatedCurrency.js';
import { BoardTileComponent } from '../../../components/Board/BoardTile.js';
import { computeCircularTilePath } from '../../../components/Board/GameBoard.js';

/**
 * In-memory multi-client Supabase backend bus simulating PostgreSQL ACID RPCs,
 * Realtime Broadcast fanout, and Presence across 6 independent player sessions.
 */
function createSixPlayerSupabaseHarness() {
  const roomId = 'room-uuid-6p';
  const roomCode = 'TYCOON';

  const db = {
    room: null as any,
    game_state: null as any,
    members: [] as any[],
    properties: [] as any[],
    auction: null as any,
    active_trade: null as any,
    chat_messages: [] as any[],
    activity_logs: [] as any[]
  };

  // Shared Broadcast & Presence bus across all connected channels
  const connectedChannels: Array<{
    userId: string;
    listeners: Array<{ type: string; filter: any; cb: Function }>;
    presence: any;
  }> = [];

  const syncAllPresences = () => {
    const presenceMap: Record<string, any[]> = {};
    for (const ch of connectedChannels) {
      if (ch.presence) {
        presenceMap[ch.userId] = [ch.presence];
      }
    }
    for (const ch of connectedChannels) {
      ch.listeners
        .filter(l => l.type === 'presence' && l.filter?.event === 'sync')
        .forEach(l => l.cb());
    }
    return presenceMap;
  };

  const getPresenceSnapshot = () => {
    const presenceMap: Record<string, any[]> = {};
    for (const ch of connectedChannels) {
      if (ch.presence) {
        presenceMap[ch.userId] = [ch.presence];
      }
    }
    return presenceMap;
  };

  function createPlayerClient(userId: string) {
    const sessionObj = {
      access_token: `jwt-${userId}`,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, is_anonymous: true }
    };

    const mockClient: any = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: sessionObj }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({ data: { user: sessionObj.user, session: sessionObj }, error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: { user: sessionObj.user }, error: null })
      },
      from: vi.fn((table: string) => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn((row: any) => {
          if (table === 'chat_messages') {
            db.chat_messages.push({
              id: `chat-${db.chat_messages.length + 1}`,
              ...row,
              created_at: new Date().toISOString()
            });
          }
          return Promise.resolve({ error: null });
        }),
        update: vi.fn((patch: any) => ({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn((_col: string, uid: string) => {
              const member = db.members.find(m => m.user_id === uid);
              if (member) Object.assign(member, patch);
              return Promise.resolve({ error: null });
            })
          })
        }))
      })),
      rpc: vi.fn(async (fnName: string, args: any) => {
        if (fnName === 'create_room') {
          db.room = {
            id: roomId,
            room_code: roomCode,
            host_id: userId,
            phase: 'LOBBY',
            settings: args.p_settings,
            jackpot_pool: 0
          };
          db.members = [
            {
              user_id: userId,
              nickname: args.p_profile.nickname,
              avatar: args.p_profile.avatar,
              token: args.p_profile.token,
              color: args.p_profile.color,
              team: 'gold',
              position: 0,
              balance: 1500,
              net_worth: 1500,
              in_jail: false,
              jail_turns: 0,
              get_out_of_jail_cards: 0,
              is_bankrupt: false,
              is_host: true,
              is_ready: true,
              turn_order: 0
            }
          ];
          db.properties = Array.from({ length: 40 }).map((_, i) => ({
            tile_id: i,
            owner_id: null,
            houses: 0,
            hotel: false,
            is_mortgaged: false
          }));
          db.game_state = {
            room_id: roomId,
            active_player_id: userId,
            turn_index: 0,
            roll_state: 'CAN_ROLL',
            dice: [1, 1],
            consecutive_doubles: 0,
            rolled_double: false,
            can_roll: true,
            can_end_turn: false,
            must_resolve_tile: false,
            pending_tile_id: null,
            revision: 1
          };
          return { data: { success: true, room_id: roomId, room_code: roomCode }, error: null };
        }

        if (fnName === 'join_room') {
          const existing = db.members.find(m => m.user_id === userId);
          if (existing) {
            return { data: { success: true, room_id: roomId, room_code: roomCode, reconnected: true }, error: null };
          }
          const idx = db.members.length;
          db.members.push({
            user_id: userId,
            nickname: args.p_profile.nickname,
            avatar: args.p_profile.avatar,
            token: args.p_profile.token,
            color: args.p_profile.color,
            team: idx % 2 === 0 ? 'gold' : 'silver',
            position: 0,
            balance: 1500,
            net_worth: 1500,
            in_jail: false,
            jail_turns: 0,
            get_out_of_jail_cards: 0,
            is_bankrupt: false,
            is_host: false,
            is_ready: false,
            turn_order: idx
          });
          return { data: { success: true, room_id: roomId, room_code: roomCode }, error: null };
        }

        if (fnName === 'start_game') {
          if (db.room.host_id !== userId) {
            return { data: { success: false, error: 'Only host can start.' }, error: null };
          }
          db.room.phase = 'PLAYING';
          db.game_state.active_player_id = db.members[0].user_id;
          return { data: { success: true }, error: null };
        }

        if (fnName === 'roll_dice_turn') {
          if (db.game_state.active_player_id !== userId) {
            return { data: { success: false, error: 'It is not your turn to roll.' }, error: null };
          }
          if (!db.game_state.can_roll) {
            return { data: { success: false, error: 'Dice already rolled this turn.' }, error: null };
          }
          const member = db.members.find(m => m.user_id === userId);
          const oldPos = member.position;
          const die1 = 2;
          const die2 = 1; // Deterministic 3 -> Harbor Alley (1) or Beacon Wharf (3)
          const newPos = (oldPos + die1 + die2) % 40;
          member.position = newPos;
          db.game_state.dice = [die1, die2];
          db.game_state.can_roll = false;
          db.game_state.must_resolve_tile = true;
          db.game_state.pending_tile_id = newPos;
          db.game_state.revision += 1;
          return {
            data: {
              success: true,
              dice: [die1, die2],
              is_double: false,
              from_position: oldPos,
              new_position: newPos,
              passed_go: false,
              must_resolve: true
            },
            error: null
          };
        }

        if (fnName === 'buy_property') {
          if (db.game_state.active_player_id !== userId) {
            return { data: { success: false, error: 'Not your turn.' }, error: null };
          }
          const tileDef = BOARD_TILES.find(t => t.id === args.p_tile_id)!;
          const member = db.members.find(m => m.user_id === userId);
          const prop = db.properties.find(p => p.tile_id === args.p_tile_id);
          member.balance -= tileDef.price || 60;
          prop.owner_id = userId;
          db.game_state.must_resolve_tile = false;
          db.game_state.pending_tile_id = null;
          db.game_state.can_end_turn = true;
          db.game_state.revision += 1;
          return { data: { success: true, price: tileDef.price || 60, tile_name: tileDef.name }, error: null };
        }

        if (fnName === 'propose_trade') {
          db.active_trade = {
            id: 'trade-1',
            initiator_id: userId,
            target_id: args.p_target_id,
            offer_cash: args.p_offer_cash,
            request_cash: args.p_request_cash,
            offer_property_ids: args.p_offer_props,
            request_property_ids: args.p_request_props,
            status: 'pending',
            created_at: new Date().toISOString()
          };
          return { data: { success: true, trade_id: 'trade-1' }, error: null };
        }

        if (fnName === 'accept_trade') {
          const t = db.active_trade;
          if (!t || t.target_id !== userId) {
            return { data: { success: false, error: 'No pending trade for you.' }, error: null };
          }
          const init = db.members.find(m => m.user_id === t.initiator_id);
          const target = db.members.find(m => m.user_id === t.target_id);
          init.balance = init.balance - t.offer_cash + t.request_cash;
          target.balance = target.balance - t.request_cash + t.offer_cash;
          for (const tid of t.offer_property_ids) {
            db.properties.find(p => p.tile_id === tid).owner_id = target.user_id;
          }
          db.active_trade = null;
          db.game_state.revision += 1;
          return { data: { success: true }, error: null };
        }

        if (fnName === 'get_full_room_state') {
          return {
            data: {
              success: true,
              ...JSON.parse(JSON.stringify(db))
            } as RoomSnapshotPayload,
            error: null
          };
        }

        return { data: { success: true }, error: null };
      }),
      channel: vi.fn(() => {
        const entry = { userId, listeners: [] as any[], presence: null as any };
        const chMock: any = {
          on: vi.fn((type: string, filter: any, cb: Function) => {
            entry.listeners.push({ type, filter, cb });
            return chMock;
          }),
          subscribe: vi.fn((cb: Function) => {
            connectedChannels.push(entry);
            Promise.resolve().then(() => cb('SUBSCRIBED'));
            return chMock;
          }),
          track: vi.fn(async (p: any) => {
            entry.presence = p;
            syncAllPresences();
            return 'ok';
          }),
          untrack: vi.fn(async () => {
            entry.presence = null;
            syncAllPresences();
            return 'ok';
          }),
          send: vi.fn(async ({ event, payload }: any) => {
            for (const other of connectedChannels) {
              if (other.userId !== userId) {
                other.listeners
                  .filter(l => l.type === 'broadcast' && l.filter?.event === event)
                  .forEach(l => l.cb({ payload }));
              }
            }
            return 'ok';
          }),
          presenceState: vi.fn(() => getPresenceSnapshot())
        };
        return chMock;
      }),
      removeChannel: vi.fn(async () => {
        const idx = connectedChannels.findIndex(c => c.userId === userId);
        if (idx >= 0) connectedChannels.splice(idx, 1);
        syncAllPresences();
        return 'ok';
      })
    };

    const auth = new SupabaseGuestAuthService(mockClient);
    const realtime = new SupabaseRealtimeClient(mockClient);
    const service = new SupabaseGameService({ client: mockClient, auth, realtime });
    const guestSession: GuestSession = {
      sessionId: userId,
      nickname: `Tycoon_${userId}`,
      avatar: 'avatar-tycoon',
      token: 'crown',
      color: '#D4AF37'
    };

    return { userId, mockClient, auth, realtime, service, guestSession };
  }

  return { createPlayerClient, db, roomId, roomCode };
}

describe('Stage 4 — Multi-Player Integration (6 Independent Sessions) & Animations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Six-Player Independent Session Sync, Atomic Validation, Chat & Reconnect', () => {
    it('synchronizes 6 independent guest sessions across room lifecycle, dice/move/purchase broadcasts, chat, trades, and disconnect/reconnect', async () => {
      const harness = createSixPlayerSupabaseHarness();
      const players = Array.from({ length: 6 }).map((_, i) =>
        harness.createPlayerClient(`player-${i + 1}`)
      );

      // Track synchronized broadcasts received by Player 2..6
      const diceBroadcastsReceived: DiceRolledBroadcastPayload[] = [];
      const moveBroadcastsReceived: PlayerMovedBroadcastPayload[] = [];
      const tileEffectsReceived: TileEffectBroadcastPayload[] = [];

      // Player 1 creates the room
      const createRes = await players[0].service.createRoom(players[0].guestSession, {
        teamMode: true,
        theme: 'luxury'
      });
      expect(createRes.success).toBe(true);

      // Players 2..6 join independently
      for (let i = 1; i < 6; i++) {
        const joinRes = await players[i].service.joinRoom(harness.roomCode, players[i].guestSession);
        expect(joinRes.success).toBe(true);
      }

      // Connect all 6 independent Realtime channels with Presence & Broadcast listeners
      for (let i = 0; i < 6; i++) {
        await players[i].realtime.joinRoomChannel({
          roomCode: harness.roomCode,
          roomId: harness.roomId,
          presence: {
            userId: players[i].userId,
            nickname: players[i].guestSession.nickname,
            avatar: players[i].guestSession.avatar,
            token: players[i].guestSession.token,
            color: players[i].guestSession.color,
            onlineAt: new Date().toISOString()
          },
          handlers: {
            onDiceRolled: i === 5 ? p => diceBroadcastsReceived.push(p) : undefined,
            onPlayerMoved: i === 5 ? p => moveBroadcastsReceived.push(p) : undefined,
            onTileEffect: i === 5 ? p => tileEffectsReceived.push(p) : undefined
          }
        });
      }

      // Allow microtask SUBSCRIBED + track() to resolve
      await new Promise(r => setTimeout(r, 15));

      // Verify all 6 players see 6 online players via Presence
      expect(players[0].realtime.getOnlinePlayers()).toHaveLength(6);
      expect(players[5].realtime.getOnlinePlayers()).toHaveLength(6);

      // Non-host Player 2 cannot start game (server-side authorization check)
      const unauthorizedStart = await players[1].service.startGame(harness.roomId);
      expect(unauthorizedStart.success).toBe(false);

      // Host Player 1 starts the match
      const startRes = await players[0].service.startGame(harness.roomId);
      expect(startRes.success).toBe(true);

      // Out-of-turn roll from Player 2 is rejected atomically
      const outOfTurnRoll = await players[1].service.rollDice(harness.roomId, players[1].userId);
      expect(outOfTurnRoll.success).toBe(false);
      expect(outOfTurnRoll.error).toContain('not your turn');

      // Player 1 rolls dice -> broadcasts dice_rolled & player_moved to peers (verified on Player 6)
      const rollRes = await players[0].service.rollDice(harness.roomId, players[0].userId, '#D4AF37');
      expect(rollRes.success).toBe(true);
      expect(diceBroadcastsReceived).toHaveLength(1);
      expect(diceBroadcastsReceived[0].dice).toEqual([2, 1]);
      expect(moveBroadcastsReceived).toHaveLength(1);
      expect(moveBroadcastsReceived[0]).toMatchObject({ fromPosition: 0, toPosition: 3 });

      // Player 1 purchases Beacon Wharf (Tile 3, $60) -> broadcasts purchase tile effect
      const buyRes = await players[0].service.buyProperty(harness.roomId, 3, players[0].userId, '#D4AF37');
      expect(buyRes.success).toBe(true);
      expect(tileEffectsReceived).toHaveLength(1);
      expect(tileEffectsReceived[0]).toMatchObject({ tileId: 3, type: 'purchase', amount: 60 });

      // Player 3 sends a real-time chat message -> visible to all 6 sessions
      const stateBeforeChat = await players[2].service.fetchFullRoomState(harness.roomId);
      const p3Obj = stateBeforeChat.data!.players.find(p => p.id === 'player-3')!;
      const chatRes = await players[2].service.sendChat(harness.roomId, p3Obj, 'Nice opening move!');
      expect(chatRes.success).toBe(true);

      // Bilateral trade: Player 1 trades Tile 3 to Player 2 for $120 cash
      const propRes = await players[0].service.proposeTrade(harness.roomId, {
        targetId: 'player-2',
        offerCash: 0,
        requestCash: 120,
        offerPropertyIds: [3],
        requestPropertyIds: []
      });
      expect(propRes.success).toBe(true);

      const acceptRes = await players[1].service.acceptTrade(harness.roomId, 'trade-1');
      expect(acceptRes.success).toBe(true);

      // Disconnect Player 4 -> Presence marks Player 4 disconnected across remaining sessions
      await players[3].realtime.leaveRoomChannel();
      const onlineIdsAfterDrop = new Set(players[0].realtime.getOnlinePlayers().map(p => p.userId));
      expect(onlineIdsAfterDrop.has('player-4')).toBe(false);
      expect(onlineIdsAfterDrop.size).toBe(5);

      const stateAfterDrop = await players[0].service.fetchFullRoomState(harness.roomId, onlineIdsAfterDrop);
      const p4InState = stateAfterDrop.data!.players.find(p => p.id === 'player-4')!;
      expect(p4InState.isDisconnected).toBe(true);

      // Reconnect Player 4 -> recovers identical full state (trade, chat, balances, property ownership)
      const rejoinRes = await players[3].service.joinRoom(harness.roomCode, players[3].guestSession);
      expect(rejoinRes.success).toBe(true);
      expect(rejoinRes.data?.reconnected).toBe(true);

      const recovered = await players[3].service.fetchFullRoomState(harness.roomId);
      const p1State = recovered.data!.players.find(p => p.id === 'player-1')!;
      const p2State = recovered.data!.players.find(p => p.id === 'player-2')!;
      expect(p1State.balance).toBe(1500 - 60 + 120); // $1560
      expect(p2State.balance).toBe(1500 - 120); // $1380
      expect(recovered.data!.properties[3].ownerId).toBe('player-2');
      expect(recovered.data!.chatMessages.some(m => m.text === 'Nice opening move!')).toBe(true);
    });
  });

  describe('2. Animation Verification (Dice, Currency Ticker, Circular Movement, Tile Effects)', () => {
    it('renders realistic pip layouts for every die face (1 through 6)', () => {
      for (let face = 1; face <= 6; face++) {
        const { container, unmount } = render(
          <DiceFace value={face} index={0} isRolling={false} isDouble={face === 6} />
        );
        const activePips = container.querySelectorAll('[data-pip="active"]');
        expect(activePips.length).toBe(face);
        unmount();
      }
    });

    it('animates currency changes smoothly and displays +/- floating delta indicators', () => {
      const { rerender } = render(<AnimatedCurrency value={1500} durationMs={10} />);
      expect(screen.getByText('$1,500')).toBeTruthy();

      // Credit +$200 (Pass GO)
      act(() => {
        rerender(<AnimatedCurrency value={1700} durationMs={10} />);
      });
      expect(screen.getByText('+$200')).toBeTruthy();

      // Debit -$150 (Property Purchase)
      act(() => {
        rerender(<AnimatedCurrency value={1550} durationMs={10} />);
      });
      expect(screen.getByText('-$150')).toBeTruthy();
    });

    it('computes exact step-by-step circular movement paths including GO corner wrap-around', () => {
      expect(computeCircularTilePath(0, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(computeCircularTilePath(38, 2)).toEqual([39, 0, 1, 2]);
      expect(computeCircularTilePath(10, 10)).toEqual([]);
    });

    it('renders synchronized purchase and rent effects on BoardTileComponent', () => {
      const harborAlley = BOARD_TILES[1];

      const { rerender } = render(
        <BoardTileComponent
          tile={harborAlley}
          playersOnTile={[]}
          isCurrentTurnTile={true}
          edge="bottom"
          theme="classic"
          tileEffect={{ tileId: 1, type: 'purchase', amount: 60, timestamp: 1 }}
          onClick={() => {}}
        />
      );
      expect(screen.getByTestId('tile-effect-purchase').textContent).toContain('SOLD $60');

      rerender(
        <BoardTileComponent
          tile={harborAlley}
          playersOnTile={[]}
          isCurrentTurnTile={true}
          edge="bottom"
          theme="luxury"
          tileEffect={{ tileId: 1, type: 'rent', amount: 25, timestamp: 2 }}
          onClick={() => {}}
        />
      );
      expect(screen.getByTestId('tile-effect-rent').textContent).toContain('RENT -$25');
    });
  });
});
