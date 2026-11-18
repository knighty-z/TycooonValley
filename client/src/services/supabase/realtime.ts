import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './client.js';

export type RealtimeConnectionStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'ERROR';

export interface PlayerPresencePayload {
  userId: string;
  nickname: string;
  avatar: string;
  token: string;
  color: string;
  onlineAt: string;
}

export interface DiceRolledBroadcastPayload {
  playerId: string;
  dice: [number, number];
  isDouble: boolean;
  newPosition: number;
}

export interface PlayerMovedBroadcastPayload {
  playerId: string;
  fromPosition: number;
  toPosition: number;
  dice: [number, number];
  passedGo: boolean;
}

export interface NotificationBroadcastPayload {
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
  playerId?: string;
}

export interface AudioCueBroadcastPayload {
  cue: 'dice' | 'coin' | 'buy' | 'jail' | 'card' | 'turn' | 'step';
}

export interface TileEffectBroadcastPayload {
  tileId: number;
  type: 'purchase' | 'rent' | 'jackpot' | 'tax';
  amount?: number;
  playerId?: string;
  color?: string;
}

export type WatchedGameTable =
  | 'rooms'
  | 'room_members'
  | 'game_states'
  | 'properties'
  | 'chat_messages'
  | 'activity_logs'
  | 'trades'
  | 'auctions';

export interface PostgresTableChange {
  table: WatchedGameTable;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord: Record<string, any> | null;
  oldRecord: Record<string, any> | null;
}

export interface RoomChannelHandlers {
  onStatusChange?: (status: RealtimeConnectionStatus, error?: string) => void;
  onPresenceSync?: (onlinePlayers: PlayerPresencePayload[]) => void;
  onPresenceJoin?: (joined: PlayerPresencePayload[]) => void;
  onPresenceLeave?: (left: PlayerPresencePayload[]) => void;
  onDiceRolled?: (payload: DiceRolledBroadcastPayload) => void;
  onPlayerMoved?: (payload: PlayerMovedBroadcastPayload) => void;
  onNotification?: (payload: NotificationBroadcastPayload) => void;
  onAudioCue?: (payload: AudioCueBroadcastPayload) => void;
  onTileEffect?: (payload: TileEffectBroadcastPayload) => void;
  onDatabaseChange?: (change: PostgresTableChange) => void;
  onReconnected?: () => void;
}

export interface JoinRoomChannelOptions {
  roomCode: string;
  roomId?: string;
  presence: PlayerPresencePayload;
  handlers: RoomChannelHandlers;
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
}

export const REALTIME_BROADCAST_EVENTS = {
  DICE_ROLLED: 'dice_rolled',
  PLAYER_MOVED: 'player_moved',
  NOTIFICATION: 'notification',
  AUDIO_CUE: 'audio_cue',
  TILE_EFFECT: 'tile_effect'
} as const;

const ROOM_SCOPED_TABLES: WatchedGameTable[] = [
  'room_members',
  'game_states',
  'properties',
  'chat_messages',
  'activity_logs',
  'trades',
  'auctions'
];

export class SupabaseRealtimeClient {
  private clientOverride: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private status: RealtimeConnectionStatus = 'IDLE';
  private activeOptions: JoinRoomChannelOptions | null = null;
  private onlinePlayers: PlayerPresencePayload[] = [];
  private manualLeave = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private hasConnectedOnce = false;
  private browserListenersAttached = false;

  constructor(client?: SupabaseClient) {
    if (client) {
      this.clientOverride = client;
    }
  }

  private getClient(): SupabaseClient {
    return this.clientOverride ?? getSupabaseClient();
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public getOnlinePlayers(): PlayerPresencePayload[] {
    return [...this.onlinePlayers];
  }

  public getActiveRoomCode(): string | null {
    return this.activeOptions?.roomCode ?? null;
  }

  private setStatus(next: RealtimeConnectionStatus, error?: string): void {
    this.status = next;
    this.activeOptions?.handlers.onStatusChange?.(next, error);
  }

  /**
   * Subscribes to a private room Realtime channel combining:
   * 1. Broadcast (ephemeral dice roll, movement steps, audio cues, notifications)
   * 2. Presence (live online/disconnected status for all room members)
   * 3. Postgres Changes (authoritative state sync when roomId is supplied)
   */
  public async joinRoomChannel(options: JoinRoomChannelOptions): Promise<void> {
    await this.leaveRoomChannel();

    const normalizedCode = options.roomCode.trim().toUpperCase();
    this.activeOptions = {
      ...options,
      roomCode: normalizedCode,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 8,
      baseReconnectDelayMs: options.baseReconnectDelayMs ?? 1000
    };
    this.manualLeave = false;
    this.reconnectAttempts = 0;
    this.hasConnectedOnce = false;

    this.attachBrowserRecoveryListeners();
    this.connectChannel();
  }

  private connectChannel(): void {
    if (!this.activeOptions) return;

    const { roomCode, roomId, presence, handlers } = this.activeOptions;
    const client = this.getClient();
    const channelName = `room:${roomCode}`;

    this.setStatus(this.hasConnectedOnce ? 'RECONNECTING' : 'CONNECTING');

    const channel = client.channel(channelName, {
      config: {
        broadcast: { self: false, ack: true },
        presence: { key: presence.userId }
      }
    });

    // 1. Presence tracking
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PlayerPresencePayload>();
        const players = this.flattenPresenceState(state);
        this.onlinePlayers = players;
        handlers.onPresenceSync?.(players);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const joined = this.extractPresenceList(newPresences);
        if (joined.length > 0) {
          handlers.onPresenceJoin?.(joined);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const left = this.extractPresenceList(leftPresences);
        if (left.length > 0) {
          handlers.onPresenceLeave?.(left);
        }
      });

    // 2. Ephemeral Broadcast listeners
    channel
      .on('broadcast', { event: REALTIME_BROADCAST_EVENTS.DICE_ROLLED }, ({ payload }) => {
        if (payload) handlers.onDiceRolled?.(payload as DiceRolledBroadcastPayload);
      })
      .on('broadcast', { event: REALTIME_BROADCAST_EVENTS.PLAYER_MOVED }, ({ payload }) => {
        if (payload) handlers.onPlayerMoved?.(payload as PlayerMovedBroadcastPayload);
      })
      .on('broadcast', { event: REALTIME_BROADCAST_EVENTS.NOTIFICATION }, ({ payload }) => {
        if (payload) handlers.onNotification?.(payload as NotificationBroadcastPayload);
      })
      .on('broadcast', { event: REALTIME_BROADCAST_EVENTS.AUDIO_CUE }, ({ payload }) => {
        if (payload) handlers.onAudioCue?.(payload as AudioCueBroadcastPayload);
      })
      .on('broadcast', { event: REALTIME_BROADCAST_EVENTS.TILE_EFFECT }, ({ payload }) => {
        if (payload) handlers.onTileEffect?.(payload as TileEffectBroadcastPayload);
      });

    // 3. Authoritative Postgres Changes subscriptions (room-scoped via RLS + filter)
    if (roomId && handlers.onDatabaseChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload: any) => {
          handlers.onDatabaseChange?.({
            table: 'rooms',
            eventType: payload.eventType,
            newRecord: payload.new ?? null,
            oldRecord: payload.old ?? null
          });
        }
      );

      for (const table of ROOM_SCOPED_TABLES) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `room_id=eq.${roomId}`
          },
          (payload: any) => {
            handlers.onDatabaseChange?.({
              table,
              eventType: payload.eventType,
              newRecord: payload.new ?? null,
              oldRecord: payload.old ?? null
            });
          }
        );
      }
    }

    this.channel = channel;

    channel.subscribe(async (status, err) => {
      if (this.channel !== channel) {
        return; // Ignore callbacks from stale channels
      }

      if (status === 'SUBSCRIBED') {
        const wasReconnecting = this.hasConnectedOnce;
        this.hasConnectedOnce = true;
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();
        this.setStatus('CONNECTED');

        try {
          await channel.track({
            ...presence,
            onlineAt: new Date().toISOString()
          });
        } catch (trackErr: any) {
          console.warn('⚠️ Failed to track presence on channel:', trackErr?.message);
        }

        if (wasReconnecting) {
          handlers.onReconnected?.();
        }
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const errMsg = err?.message || `Realtime channel ${status.toLowerCase()}.`;
        this.scheduleReconnect(errMsg);
        return;
      }

      if (status === 'CLOSED') {
        if (this.manualLeave) {
          this.setStatus('DISCONNECTED');
        } else {
          this.scheduleReconnect('Realtime connection closed unexpectedly.');
        }
      }
    });
  }

  private scheduleReconnect(reason: string): void {
    if (this.manualLeave || !this.activeOptions) {
      return;
    }

    const maxAttempts = this.activeOptions.maxReconnectAttempts ?? 8;
    const baseDelay = this.activeOptions.baseReconnectDelayMs ?? 1000;

    if (this.reconnectAttempts >= maxAttempts) {
      this.setStatus('ERROR', `Unable to reconnect after ${maxAttempts} attempts: ${reason}`);
      return;
    }

    this.reconnectAttempts += 1;
    const delayMs = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), 15_000);
    this.setStatus('RECONNECTING', `${reason} Retrying (${this.reconnectAttempts}/${maxAttempts})...`);

    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(async () => {
      if (this.manualLeave || !this.activeOptions) return;

      await this.teardownChannelOnly();
      this.connectChannel();
    }, delayMs);
  }

  /**
   * Forces an immediate reconnection attempt (e.g. when network comes back online).
   */
  public async reconnectNow(): Promise<void> {
    if (this.manualLeave || !this.activeOptions) return;
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.clearReconnectTimer();
    this.reconnectAttempts = 0;
    await this.teardownChannelOnly();
    this.connectChannel();
  }

  public async updatePresence(partial: Partial<PlayerPresencePayload>): Promise<void> {
    if (!this.channel || !this.activeOptions || this.status !== 'CONNECTED') return;

    this.activeOptions.presence = {
      ...this.activeOptions.presence,
      ...partial,
      onlineAt: new Date().toISOString()
    };

    await this.channel.track(this.activeOptions.presence);
  }

  public async broadcastDiceRolled(payload: DiceRolledBroadcastPayload): Promise<boolean> {
    return this.sendBroadcast(REALTIME_BROADCAST_EVENTS.DICE_ROLLED, payload);
  }

  public async broadcastPlayerMoved(payload: PlayerMovedBroadcastPayload): Promise<boolean> {
    return this.sendBroadcast(REALTIME_BROADCAST_EVENTS.PLAYER_MOVED, payload);
  }

  public async broadcastNotification(payload: NotificationBroadcastPayload): Promise<boolean> {
    return this.sendBroadcast(REALTIME_BROADCAST_EVENTS.NOTIFICATION, payload);
  }

  public async broadcastAudioCue(payload: AudioCueBroadcastPayload): Promise<boolean> {
    return this.sendBroadcast(REALTIME_BROADCAST_EVENTS.AUDIO_CUE, payload);
  }

  public async broadcastTileEffect(payload: TileEffectBroadcastPayload): Promise<boolean> {
    return this.sendBroadcast(REALTIME_BROADCAST_EVENTS.TILE_EFFECT, payload);
  }

  private async sendBroadcast(event: string, payload: Record<string, any>): Promise<boolean> {
    if (!this.channel || this.status !== 'CONNECTED') {
      return false;
    }
    try {
      const response = await this.channel.send({
        type: 'broadcast',
        event,
        payload
      });
      return response === 'ok';
    } catch (err: any) {
      console.warn(`⚠️ Failed to broadcast ${event}:`, err?.message);
      return false;
    }
  }

  public async leaveRoomChannel(): Promise<void> {
    this.manualLeave = true;
    this.clearReconnectTimer();
    this.detachBrowserRecoveryListeners();
    await this.teardownChannelOnly();
    this.onlinePlayers = [];
    this.activeOptions = null;
    this.hasConnectedOnce = false;
    this.reconnectAttempts = 0;
    this.status = 'IDLE';
  }

  private async teardownChannelOnly(): Promise<void> {
    const current = this.channel;
    this.channel = null;
    if (!current) return;

    try {
      await current.untrack();
    } catch {
      // Ignore untrack failures on already closed channels
    }

    try {
      const client = this.getClient();
      await client.removeChannel(current);
    } catch {
      // Ignore remove errors during teardown
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleBrowserOnline = (): void => {
    if (!this.manualLeave && this.activeOptions && this.status !== 'CONNECTED') {
      void this.reconnectNow();
    }
  };

  private handleVisibilityChange = (): void => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      !this.manualLeave &&
      this.activeOptions &&
      (this.status === 'DISCONNECTED' || this.status === 'ERROR' || this.status === 'RECONNECTING')
    ) {
      void this.reconnectNow();
    }
  };

  private attachBrowserRecoveryListeners(): void {
    if (this.browserListenersAttached || typeof window === 'undefined') return;
    window.addEventListener('online', this.handleBrowserOnline);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.browserListenersAttached = true;
  }

  private detachBrowserRecoveryListeners(): void {
    if (!this.browserListenersAttached || typeof window === 'undefined') return;
    window.removeEventListener('online', this.handleBrowserOnline);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.browserListenersAttached = false;
  }

  private flattenPresenceState(
    state: Record<string, PlayerPresencePayload[]>
  ): PlayerPresencePayload[] {
    const byUser = new Map<string, PlayerPresencePayload>();
    for (const entries of Object.values(state)) {
      for (const entry of entries) {
        if (entry?.userId) {
          byUser.set(entry.userId, entry);
        }
      }
    }
    return Array.from(byUser.values());
  }

  private extractPresenceList(raw: any[]): PlayerPresencePayload[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is PlayerPresencePayload => Boolean(item && item.userId));
  }
}

export const supabaseRealtime = new SupabaseRealtimeClient();
