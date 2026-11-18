import { SupabaseClient } from '@supabase/supabase-js';
import {
  ActivityLog,
  AuctionState,
  ChatMessage,
  DEFAULT_GAME_SETTINGS,
  GameSettings,
  GameState,
  GuestSession,
  Player,
  PropertyState,
  TradeOffer,
  calculateNetWorth
} from '@tycoonvale/shared';
import { getSupabaseClient } from './client.js';
import { supabaseAuth, SupabaseGuestAuthService } from './auth.js';
import { supabaseRealtime, SupabaseRealtimeClient } from './realtime.js';

export interface SupabaseActionResult<T = Record<string, any>> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RoomSnapshotPayload {
  success: boolean;
  room: Record<string, any>;
  game_state: Record<string, any>;
  members: Record<string, any>[];
  properties: Record<string, any>[];
  auction: Record<string, any> | null;
  active_trade: Record<string, any> | null;
  chat_messages: Record<string, any>[];
  activity_logs: Record<string, any>[];
  error?: string;
}

/**
 * Pure mapper translating normalized Supabase PostgreSQL records + Presence IDs
 * into the canonical `@tycoonvale/shared` `GameState` structure consumed by all UI components.
 */
export function mapSnapshotToGameState(
  snapshot: RoomSnapshotPayload,
  onlineUserIds?: Set<string>
): GameState {
  const room = snapshot.room;
  const gs = snapshot.game_state || {};
  const settings: GameSettings = {
    ...DEFAULT_GAME_SETTINGS,
    ...(room?.settings || {})
  };

  // Map 40 properties
  const properties: Record<number, PropertyState> = {};
  for (const row of snapshot.properties || []) {
    properties[row.tile_id] = {
      tileId: row.tile_id,
      ownerId: row.owner_id ?? null,
      houses: row.houses ?? 0,
      hotel: Boolean(row.hotel),
      isMortgaged: Boolean(row.is_mortgaged)
    };
  }

  // Map players
  const players: Player[] = (snapshot.members || []).map((m: Record<string, any>) => {
    const ownedTileIds = Object.values(properties)
      .filter(p => p.ownerId === m.user_id)
      .map(p => p.tileId);

    const isDisconnected = onlineUserIds ? !onlineUserIds.has(m.user_id) : false;

    const basePlayer: Player = {
      id: m.user_id,
      sessionId: m.user_id,
      socketId: '',
      nickname: m.nickname,
      avatar: m.avatar,
      token: m.token,
      color: m.color,
      team: m.team === 'silver' ? 'silver' : 'gold',
      position: m.position ?? 0,
      balance: m.balance ?? settings.startingBalance,
      netWorth: m.net_worth ?? m.balance ?? settings.startingBalance,
      inJail: Boolean(m.in_jail),
      jailTurns: m.jail_turns ?? 0,
      getOutOfJailCards: m.get_out_of_jail_cards ?? 0,
      isBankrupt: Boolean(m.is_bankrupt),
      isHost: Boolean(m.is_host),
      isReady: Boolean(m.is_ready),
      isDisconnected,
      properties: ownedTileIds
    };

    basePlayer.netWorth = calculateNetWorth(basePlayer, properties);
    return basePlayer;
  });

  // Map active auction
  let auction: AuctionState | null = null;
  if (snapshot.auction && !snapshot.auction.is_finished) {
    const expiresMs = snapshot.auction.expires_at
      ? new Date(snapshot.auction.expires_at).getTime()
      : Date.now() + 20_000;
    const remaining = Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000));

    auction = {
      tileId: snapshot.auction.tile_id,
      currentBid: snapshot.auction.current_bid ?? 0,
      highestBidderId: snapshot.auction.highest_bidder_id ?? null,
      activePlayerIds: Array.isArray(snapshot.auction.active_player_ids)
        ? snapshot.auction.active_player_ids
        : [],
      timerSeconds: remaining,
      isFinished: Boolean(snapshot.auction.is_finished),
      minNextBid: snapshot.auction.min_next_bid ?? 10
    };
  }

  // Map active trade
  let activeTrade: TradeOffer | null = null;
  if (snapshot.active_trade && snapshot.active_trade.status === 'pending') {
    activeTrade = {
      id: snapshot.active_trade.id,
      initiatorId: snapshot.active_trade.initiator_id,
      targetId: snapshot.active_trade.target_id,
      offerCash: snapshot.active_trade.offer_cash ?? 0,
      requestCash: snapshot.active_trade.request_cash ?? 0,
      offerPropertyIds: snapshot.active_trade.offer_property_ids ?? [],
      requestPropertyIds: snapshot.active_trade.request_property_ids ?? [],
      status: snapshot.active_trade.status,
      createdAt: snapshot.active_trade.created_at
        ? new Date(snapshot.active_trade.created_at).getTime()
        : Date.now()
    };
  }

  // Map chat messages
  const chatMessages: ChatMessage[] = (snapshot.chat_messages || []).map((c: Record<string, any>) => ({
    id: c.id,
    senderId: c.sender_id || 'system',
    senderName: c.sender_name,
    senderAvatar: c.sender_avatar || 'avatar-tycoon',
    senderColor: c.sender_color || '#D4AF37',
    text: c.text,
    timestamp: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
    isReaction: Boolean(c.is_reaction),
    isSystem: Boolean(c.is_system)
  }));

  // Map activity logs
  const activityLogs: ActivityLog[] = (snapshot.activity_logs || []).map((l: Record<string, any>) => ({
    id: l.id,
    timestamp: l.created_at ? new Date(l.created_at).getTime() : Date.now(),
    text: l.text,
    type: l.log_type || 'system',
    playerId: l.player_id ?? undefined,
    amount: l.amount ?? undefined
  }));

  const diceArr = Array.isArray(gs.dice) && gs.dice.length === 2 ? gs.dice : [1, 1];
  const winner = room?.winner_id ? players.find(p => p.id === room.winner_id) || null : null;

  return {
    roomCode: room.room_code,
    phase: room.phase || 'LOBBY',
    hostId: room.host_id,
    players,
    properties,
    turn: {
      activePlayerId: gs.active_player_id || room.host_id,
      turnIndex: gs.turn_index ?? 0,
      rollState: gs.roll_state || 'CAN_ROLL',
      consecutiveDoubles: gs.consecutive_doubles ?? 0,
      rolledDouble: Boolean(gs.rolled_double),
      dice: [Number(diceArr[0]) || 1, Number(diceArr[1]) || 1],
      canEndTurn: Boolean(gs.can_end_turn),
      canRoll: gs.can_roll !== undefined ? Boolean(gs.can_roll) : true,
      mustResolveTile: Boolean(gs.must_resolve_tile),
      pendingTileId: gs.pending_tile_id ?? undefined,
      turnTimerSeconds: settings.turnTimeoutSeconds
    },
    auction,
    activeTrade,
    activityLogs,
    chatMessages,
    settings,
    jackpotPool: room.jackpot_pool ?? 0,
    winner,
    winningTeam: room.winning_team ?? null,
    lastCardDrawn: gs.last_card_drawn ?? null,
    cardDrawPlayerId: gs.card_draw_player_id ?? null,
    revision: gs.revision ?? 1
  };
}

export class SupabaseGameService {
  private clientOverride: SupabaseClient | null = null;
  private authService: SupabaseGuestAuthService;
  private realtimeClient: SupabaseRealtimeClient;
  private inFlightActions: Set<string> = new Set();

  constructor(deps?: {
    client?: SupabaseClient;
    auth?: SupabaseGuestAuthService;
    realtime?: SupabaseRealtimeClient;
  }) {
    if (deps?.client) this.clientOverride = deps.client;
    this.authService = deps?.auth ?? supabaseAuth;
    this.realtimeClient = deps?.realtime ?? supabaseRealtime;
  }

  private getClient(): SupabaseClient {
    return this.clientOverride ?? getSupabaseClient();
  }

  private async runLocked<T>(
    actionKey: string,
    fn: () => Promise<SupabaseActionResult<T>>
  ): Promise<SupabaseActionResult<T>> {
    if (this.inFlightActions.has(actionKey)) {
      return { success: false, error: 'Action already in progress.' };
    }
    this.inFlightActions.add(actionKey);
    try {
      return await fn();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unexpected Supabase error.' };
    } finally {
      this.inFlightActions.delete(actionKey);
    }
  }

  public async createRoom(
    session: GuestSession,
    settings?: Partial<GameSettings>
  ): Promise<SupabaseActionResult<{ roomId: string; roomCode: string; userId: string }>> {
    return this.runLocked('create_room', async () => {
      const authRes = await this.authService.ensureAnonymousSession(session);
      if (!authRes.success || !authRes.user) {
        return { success: false, error: authRes.error || 'Guest authentication failed.' };
      }

      const client = this.getClient();
      const mergedSettings = { ...DEFAULT_GAME_SETTINGS, ...(settings || {}) };
      const { data, error } = await client.rpc('create_room', {
        p_settings: mergedSettings,
        p_profile: {
          nickname: session.nickname,
          avatar: session.avatar,
          token: session.token,
          color: session.color
        }
      });

      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not create room.' };

      return {
        success: true,
        data: {
          roomId: data.room_id,
          roomCode: data.room_code,
          userId: authRes.user.id
        }
      };
    });
  }

  public async joinRoom(
    roomCode: string,
    session: GuestSession
  ): Promise<SupabaseActionResult<{ roomId: string; roomCode: string; userId: string; reconnected?: boolean }>> {
    return this.runLocked('join_room', async () => {
      const authRes = await this.authService.ensureAnonymousSession(session);
      if (!authRes.success || !authRes.user) {
        return { success: false, error: authRes.error || 'Guest authentication failed.' };
      }

      const client = this.getClient();
      const { data, error } = await client.rpc('join_room', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_profile: {
          nickname: session.nickname,
          avatar: session.avatar,
          token: session.token,
          color: session.color
        }
      });

      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not join room.' };

      return {
        success: true,
        data: {
          roomId: data.room_id,
          roomCode: data.room_code,
          userId: authRes.user.id,
          reconnected: Boolean(data.reconnected)
        }
      };
    });
  }

  public async fetchFullRoomState(
    roomId: string,
    onlineUserIds?: Set<string>
  ): Promise<SupabaseActionResult<GameState>> {
    try {
      const client = this.getClient();
      const { data, error } = await client.rpc('get_full_room_state', { p_room_id: roomId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Failed to load room state.' };

      const mapped = mapSnapshotToGameState(data as RoomSnapshotPayload, onlineUserIds);
      return { success: true, data: mapped };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to load room state.' };
    }
  }

  public async toggleReady(roomId: string, userId: string, isReady: boolean): Promise<SupabaseActionResult> {
    return this.runLocked('toggle_ready', async () => {
      const client = this.getClient();
      const { error } = await client
        .from('room_members')
        .update({ is_ready: isReady, updated_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    });
  }

  public async setTeam(roomId: string, userId: string, team: 'gold' | 'silver'): Promise<SupabaseActionResult> {
    return this.runLocked('set_team', async () => {
      const client = this.getClient();
      const { error } = await client
        .from('room_members')
        .update({ team, updated_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    });
  }

  public async updateSettings(roomId: string, mergedSettings: GameSettings): Promise<SupabaseActionResult> {
    return this.runLocked('update_settings', async () => {
      const client = this.getClient();
      const { error } = await client
        .from('rooms')
        .update({ settings: mergedSettings, updated_at: new Date().toISOString() })
        .eq('id', roomId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    });
  }

  public async startGame(roomId: string): Promise<SupabaseActionResult> {
    return this.runLocked('start_game', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('start_game', { p_room_id: roomId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Failed to start match.' };
      return { success: true };
    });
  }

  public async rollDice(roomId: string, playerId: string, playerColor?: string): Promise<SupabaseActionResult> {
    return this.runLocked('roll_dice', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('roll_dice_turn', { p_room_id: roomId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not roll dice.' };

      const dice: [number, number] = [Number(data.dice?.[0] ?? 1), Number(data.dice?.[1] ?? 1)];
      const fromPosition = Number(data.from_position ?? 0);
      const newPosition = Number(data.new_position ?? 0);

      // Broadcast synchronized animations after ACID commit
      void this.realtimeClient.broadcastDiceRolled({
        playerId,
        dice,
        isDouble: Boolean(data.is_double),
        newPosition
      });

      if (fromPosition !== newPosition) {
        void this.realtimeClient.broadcastPlayerMoved({
          playerId,
          fromPosition,
          toPosition: newPosition,
          dice,
          passedGo: Boolean(data.passed_go)
        });
      }

      if (data.effect_type && data.effect_amount) {
        void this.realtimeClient.broadcastTileEffect({
          tileId: newPosition,
          type: data.effect_type,
          amount: Number(data.effect_amount),
          playerId,
          color: playerColor
        });
      }

      return { success: true, data };
    });
  }

  public async buyProperty(
    roomId: string,
    tileId: number,
    playerId: string,
    playerColor?: string
  ): Promise<SupabaseActionResult> {
    return this.runLocked(`buy_${tileId}`, async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('buy_property', {
        p_room_id: roomId,
        p_tile_id: tileId
      });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Purchase failed.' };

      void this.realtimeClient.broadcastTileEffect({
        tileId,
        type: 'purchase',
        amount: Number(data.price ?? 0),
        playerId,
        color: playerColor
      });

      return { success: true, data };
    });
  }

  public async declineProperty(roomId: string, tileId: number): Promise<SupabaseActionResult> {
    return this.runLocked(`decline_${tileId}`, async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('decline_property', {
        p_room_id: roomId,
        p_tile_id: tileId
      });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Decline failed.' };
      return { success: true };
    });
  }

  public async endTurn(roomId: string): Promise<SupabaseActionResult> {
    return this.runLocked('end_turn', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('end_turn', { p_room_id: roomId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not end turn.' };
      return { success: true, data };
    });
  }

  public async buildHouse(roomId: string, tileId: number): Promise<SupabaseActionResult> {
    return this.runLocked(`build_${tileId}`, async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('build_house', { p_room_id: roomId, p_tile_id: tileId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Cannot build house.' };
      return { success: true };
    });
  }

  public async sellHouse(roomId: string, tileId: number): Promise<SupabaseActionResult> {
    return this.runLocked(`sell_${tileId}`, async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('sell_house', { p_room_id: roomId, p_tile_id: tileId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Cannot sell house.' };
      return { success: true };
    });
  }

  public async mortgageProperty(roomId: string, tileId: number): Promise<SupabaseActionResult> {
    return this.runLocked(`mortgage_${tileId}`, async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('mortgage_property', { p_room_id: roomId, p_tile_id: tileId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Cannot mortgage property.' };
      return { success: true };
    });
  }

  public async unmortgageProperty(roomId: string, tileId: number): Promise<SupabaseActionResult> {
    return this.runLocked(`unmortgage_${tileId}`, async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('unmortgage_property', { p_room_id: roomId, p_tile_id: tileId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Cannot lift mortgage.' };
      return { success: true };
    });
  }

  public async payJailFine(roomId: string): Promise<SupabaseActionResult> {
    return this.runLocked('pay_jail_fine', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('pay_jail_fine', { p_room_id: roomId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Cannot pay bail.' };
      return { success: true };
    });
  }

  public async useJailCard(roomId: string): Promise<SupabaseActionResult> {
    return this.runLocked('use_jail_card', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('use_jail_card', { p_room_id: roomId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'No pardon pass available.' };
      return { success: true };
    });
  }

  public async bidAuction(roomId: string, amount: number): Promise<SupabaseActionResult> {
    return this.runLocked('bid_auction', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('bid_auction', { p_room_id: roomId, p_amount: amount });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Bid rejected.' };
      return { success: true, data };
    });
  }

  public async passAuction(roomId: string): Promise<SupabaseActionResult> {
    return this.runLocked('pass_auction', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('pass_auction', { p_room_id: roomId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not pass auction.' };
      return { success: true };
    });
  }

  public async proposeTrade(
    roomId: string,
    payload: {
      targetId: string;
      offerCash: number;
      requestCash: number;
      offerPropertyIds: number[];
      requestPropertyIds: number[];
    }
  ): Promise<SupabaseActionResult> {
    return this.runLocked('propose_trade', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('propose_trade', {
        p_room_id: roomId,
        p_target_id: payload.targetId,
        p_offer_cash: payload.offerCash,
        p_request_cash: payload.requestCash,
        p_offer_props: payload.offerPropertyIds,
        p_request_props: payload.requestPropertyIds
      });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not propose trade.' };
      return { success: true, data };
    });
  }

  public async acceptTrade(roomId: string, tradeId?: string): Promise<SupabaseActionResult> {
    return this.runLocked('accept_trade', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('accept_trade', {
        p_room_id: roomId,
        p_trade_id: tradeId ?? null
      });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not accept trade.' };
      return { success: true };
    });
  }

  public async rejectTrade(roomId: string, tradeId?: string): Promise<SupabaseActionResult> {
    return this.runLocked('reject_trade', async () => {
      const client = this.getClient();
      const { data, error } = await client.rpc('reject_trade', {
        p_room_id: roomId,
        p_trade_id: tradeId ?? null
      });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error || 'Could not decline trade.' };
      return { success: true };
    });
  }

  public async sendChat(
    roomId: string,
    sender: Player,
    text: string,
    isReaction: boolean = false
  ): Promise<SupabaseActionResult> {
    const cleanText = text.trim().slice(0, 280);
    if (!cleanText) return { success: false, error: 'Message cannot be empty.' };

    try {
      const client = this.getClient();
      const { error } = await client.from('chat_messages').insert({
        room_id: roomId,
        sender_id: sender.id,
        sender_name: sender.nickname,
        sender_avatar: sender.avatar,
        sender_color: sender.color,
        text: cleanText,
        is_reaction: isReaction,
        is_system: false
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send chat message.' };
    }
  }
}

export const supabaseGameService = new SupabaseGameService();
