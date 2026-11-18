export {
  getSupabaseClient,
  createTycoonSupabaseClient,
  isSupabaseConfigured,
  getSupabaseConfigStatus,
  normalizeSupabaseUrl,
  validatePublishableKey,
  resetSupabaseClientCache,
  SupabaseConfigError,
  type SupabaseConfigStatus
} from './client.js';

export {
  supabaseAuth,
  SupabaseGuestAuthService,
  type AnonymousAuthResult
} from './auth.js';

export {
  supabaseRealtime,
  SupabaseRealtimeClient,
  REALTIME_BROADCAST_EVENTS,
  type RealtimeConnectionStatus,
  type PlayerPresencePayload,
  type DiceRolledBroadcastPayload,
  type PlayerMovedBroadcastPayload,
  type NotificationBroadcastPayload,
  type AudioCueBroadcastPayload,
  type TileEffectBroadcastPayload,
  type WatchedGameTable,
  type PostgresTableChange,
  type RoomChannelHandlers,
  type JoinRoomChannelOptions
} from './realtime.js';

export {
  supabaseGameService,
  SupabaseGameService,
  mapSnapshotToGameState,
  type SupabaseActionResult,
  type RoomSnapshotPayload
} from './gameService.js';
