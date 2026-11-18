import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  normalizeSupabaseUrl,
  validatePublishableKey,
  createTycoonSupabaseClient,
  SupabaseConfigError,
  resetSupabaseClientCache
} from '../client.js';
import { SupabaseGuestAuthService } from '../auth.js';
import {
  SupabaseRealtimeClient,
  REALTIME_BROADCAST_EVENTS,
  RealtimeConnectionStatus,
  PlayerPresencePayload
} from '../realtime.js';

function createFakeJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

describe('Stage 3 — Supabase Client, Auth & Realtime', () => {
  beforeEach(() => {
    resetSupabaseClientCache();
  });

  describe('1. Environment Variable Handling & Security Guards', () => {
    it('normalizes Supabase URLs that include /rest/v1/ or trailing slashes', () => {
      expect(normalizeSupabaseUrl('https://sopcfroyamjwtiyfazmw.supabase.co/rest/v1/')).toBe(
        'https://sopcfroyamjwtiyfazmw.supabase.co'
      );
      expect(normalizeSupabaseUrl('https://sopcfroyamjwtiyfazmw.supabase.co/rest/v1')).toBe(
        'https://sopcfroyamjwtiyfazmw.supabase.co'
      );
      expect(normalizeSupabaseUrl('https://sopcfroyamjwtiyfazmw.supabase.co///')).toBe(
        'https://sopcfroyamjwtiyfazmw.supabase.co'
      );
      expect(normalizeSupabaseUrl('not-a-url')).toBe('');
      expect(normalizeSupabaseUrl('')).toBe('');
    });

    it('accepts publishable and anon keys while blocking secret and service_role keys', () => {
      expect(validatePublishableKey('sb_publishable_testKey123').valid).toBe(true);
      expect(validatePublishableKey(createFakeJwt({ role: 'anon' })).valid).toBe(true);

      const secretCheck = validatePublishableKey('sb_secret_dangerous123');
      expect(secretCheck.valid).toBe(false);
      expect(secretCheck.reason).toContain('SECURITY BLOCK');

      const serviceRoleJwtCheck = validatePublishableKey(createFakeJwt({ role: 'service_role' }));
      expect(serviceRoleJwtCheck.valid).toBe(false);
      expect(serviceRoleJwtCheck.reason).toContain('service_role');
    });

    it('throws SupabaseConfigError when creating client with secret key', () => {
      expect(() =>
        createTycoonSupabaseClient('https://example.supabase.co', 'sb_secret_leaked')
      ).toThrow(SupabaseConfigError);
    });

    it('reads valid root .env configuration and protects .env in .gitignore', () => {
      const rootDir = path.resolve(__dirname, '../../../../..');
      const envPath = path.join(rootDir, '.env');
      const gitignorePath = path.join(rootDir, '.gitignore');

      expect(fs.existsSync(envPath)).toBe(true);
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      expect(gitignore).toContain('.env');

      const envContent = fs.readFileSync(envPath, 'utf-8');
      const urlMatch = envContent.match(/^VITE_SUPABASE_URL=(.+)$/m);
      const keyMatch = envContent.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m);

      expect(urlMatch).not.toBeNull();
      expect(keyMatch).not.toBeNull();
      expect(normalizeSupabaseUrl(urlMatch![1])).toBe('https://sopcfroyamjwtiyfazmw.supabase.co');
      expect(validatePublishableKey(keyMatch![1]).valid).toBe(true);
    });
  });

  describe('2. Anonymous Guest Authentication', () => {
    it('reuses existing persisted session across page refreshes without creating a new user', async () => {
      const mockSession = {
        access_token: 'tok',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'anon-uuid-existing', is_anonymous: true }
      };

      const mockClient: any = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
          signInAnonymously: vi.fn(),
          refreshSession: vi.fn()
        }
      };

      const authService = new SupabaseGuestAuthService(mockClient);
      const res = await authService.ensureAnonymousSession({ nickname: 'Baron' });

      expect(res.success).toBe(true);
      expect(res.isNewAnonymousUser).toBe(false);
      expect(res.user?.id).toBe('anon-uuid-existing');
      expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
    });

    it('signs in anonymously when no session exists and syncs player profile', async () => {
      const newSession = {
        access_token: 'new-tok',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'anon-uuid-new', is_anonymous: true }
      };

      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      const mockClient: any = {
        auth: {
          getSession: vi
            .fn()
            .mockResolvedValueOnce({ data: { session: null }, error: null })
            .mockResolvedValueOnce({ data: { session: newSession }, error: null }),
          signInAnonymously: vi.fn().mockResolvedValue({
            data: { user: newSession.user, session: newSession },
            error: null
          }),
          updateUser: vi.fn().mockResolvedValue({ data: { user: newSession.user }, error: null })
        },
        from: vi.fn().mockReturnValue({ upsert: upsertMock })
      };

      const authService = new SupabaseGuestAuthService(mockClient);
      const res = await authService.ensureAnonymousSession({
        nickname: 'LadySterling',
        avatar: 'avatar-heiress',
        token: 'crown',
        color: '#D4AF37'
      });

      expect(res.success).toBe(true);
      expect(res.isNewAnonymousUser).toBe(true);
      expect(res.user?.id).toBe('anon-uuid-new');
      expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
      expect(upsertMock).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent ensureAnonymousSession calls', async () => {
      const newSession = {
        access_token: 'dedup-tok',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'anon-uuid-dedup', is_anonymous: true }
      };

      const mockClient: any = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signInAnonymously: vi.fn().mockImplementation(
            () =>
              new Promise(resolve =>
                setTimeout(
                  () => resolve({ data: { user: newSession.user, session: newSession }, error: null }),
                  20
                )
              )
          )
        }
      };

      const authService = new SupabaseGuestAuthService(mockClient);
      const [r1, r2] = await Promise.all([
        authService.ensureAnonymousSession(),
        authService.ensureAnonymousSession()
      ]);

      expect(r1.user?.id).toBe('anon-uuid-dedup');
      expect(r2.user?.id).toBe('anon-uuid-dedup');
      expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
    });

    it('returns helpful error if anonymous sign-ins are disabled in Supabase dashboard', async () => {
      const mockClient: any = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signInAnonymously: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Anonymous sign-ins are disabled' }
          })
        }
      };

      const authService = new SupabaseGuestAuthService(mockClient);
      const res = await authService.ensureAnonymousSession();

      expect(res.success).toBe(false);
      expect(res.error).toContain('Authentication -> Providers');
    });
  });

  describe('3. Realtime Channel, Presence, Broadcast & Reconnection', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function createMockRealtimeEnv() {
      const listeners: Array<{ type: string; filter: any; cb: Function }> = [];
      let subscribeCb: ((status: string, err?: Error) => void) | null = null;
      let presenceStateData: Record<string, PlayerPresencePayload[]> = {};

      const channelMock: any = {
        on: vi.fn((type: string, filter: any, cb: Function) => {
          listeners.push({ type, filter, cb });
          return channelMock;
        }),
        subscribe: vi.fn((cb: (status: string, err?: Error) => void) => {
          subscribeCb = cb;
          return channelMock;
        }),
        track: vi.fn().mockResolvedValue('ok'),
        untrack: vi.fn().mockResolvedValue('ok'),
        send: vi.fn().mockResolvedValue('ok'),
        presenceState: vi.fn(() => presenceStateData)
      };

      const clientMock: any = {
        channel: vi.fn().mockReturnValue(channelMock),
        removeChannel: vi.fn().mockResolvedValue('ok')
      };

      return {
        clientMock,
        channelMock,
        listeners,
        triggerSubscribe: (status: string, err?: Error) => subscribeCb?.(status, err),
        setPresenceState: (data: Record<string, PlayerPresencePayload[]>) => {
          presenceStateData = data;
        },
        emitListener: (type: string, event: string, payload: any) => {
          listeners
            .filter(l => l.type === type && l.filter?.event === event)
            .forEach(l => l.cb(payload));
        }
      };
    }

    it('connects to private room channel, tracks presence, and handles broadcasts + DB changes', async () => {
      const env = createMockRealtimeEnv();
      const rt = new SupabaseRealtimeClient(env.clientMock);

      const statuses: RealtimeConnectionStatus[] = [];
      const onPresenceSync = vi.fn();
      const onDiceRolled = vi.fn();
      const onDatabaseChange = vi.fn();

      const selfPresence: PlayerPresencePayload = {
        userId: 'u-1',
        nickname: 'AlphaTycoon',
        avatar: 'avatar-tycoon',
        token: 'crown',
        color: '#D4AF37',
        onlineAt: new Date().toISOString()
      };

      await rt.joinRoomChannel({
        roomCode: 'abc123',
        roomId: 'room-uuid-1',
        presence: selfPresence,
        handlers: {
          onStatusChange: s => statuses.push(s),
          onPresenceSync,
          onDiceRolled,
          onDatabaseChange
        }
      });

      expect(env.clientMock.channel).toHaveBeenCalledWith(
        'room:ABC123',
        expect.objectContaining({
          config: expect.objectContaining({
            presence: { key: 'u-1' }
          })
        })
      );

      // Verify all 8 tables subscribed via postgres_changes
      const pgListeners = env.listeners.filter(l => l.type === 'postgres_changes');
      expect(pgListeners.length).toBe(8);

      // Simulate SUBSCRIBED
      await env.triggerSubscribe('SUBSCRIBED');
      expect(rt.getStatus()).toBe('CONNECTED');
      expect(statuses).toEqual(['CONNECTING', 'CONNECTED']);
      expect(env.channelMock.track).toHaveBeenCalledTimes(1);

      // Simulate Presence Sync
      env.setPresenceState({
        'u-1': [selfPresence],
        'u-2': [{ ...selfPresence, userId: 'u-2', nickname: 'BetaTycoon' }]
      });
      env.emitListener('presence', 'sync', {});
      expect(onPresenceSync).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ userId: 'u-1' }),
        expect.objectContaining({ userId: 'u-2' })
      ]));
      expect(rt.getOnlinePlayers()).toHaveLength(2);

      // Simulate Broadcast send & receive
      const sent = await rt.broadcastDiceRolled({
        playerId: 'u-1',
        dice: [4, 5],
        isDouble: false,
        newPosition: 9
      });
      expect(sent).toBe(true);
      expect(env.channelMock.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: REALTIME_BROADCAST_EVENTS.DICE_ROLLED,
        payload: { playerId: 'u-1', dice: [4, 5], isDouble: false, newPosition: 9 }
      });

      env.emitListener('broadcast', REALTIME_BROADCAST_EVENTS.DICE_ROLLED, {
        payload: { playerId: 'u-2', dice: [6, 6], isDouble: true, newPosition: 12 }
      });
      expect(onDiceRolled).toHaveBeenCalledWith({
        playerId: 'u-2',
        dice: [6, 6],
        isDouble: true,
        newPosition: 12
      });

      // Clean leave
      await rt.leaveRoomChannel();
      expect(rt.getStatus()).toBe('IDLE');
      expect(env.channelMock.untrack).toHaveBeenCalled();
      expect(env.clientMock.removeChannel).toHaveBeenCalled();
    });

    it('reconnects with exponential backoff on CHANNEL_ERROR and fires onReconnected', async () => {
      vi.useFakeTimers();
      const env = createMockRealtimeEnv();
      const rt = new SupabaseRealtimeClient(env.clientMock);

      const onReconnected = vi.fn();
      const statuses: RealtimeConnectionStatus[] = [];

      await rt.joinRoomChannel({
        roomCode: 'RETRY1',
        presence: {
          userId: 'u-1',
          nickname: 'Alpha',
          avatar: 'avatar-tycoon',
          token: 'crown',
          color: '#10B981',
          onlineAt: new Date().toISOString()
        },
        baseReconnectDelayMs: 500,
        maxReconnectAttempts: 3,
        handlers: {
          onStatusChange: s => statuses.push(s),
          onReconnected
        }
      });

      // Initial connect
      await env.triggerSubscribe('SUBSCRIBED');
      expect(rt.getStatus()).toBe('CONNECTED');

      // Drop connection
      env.triggerSubscribe('CHANNEL_ERROR', new Error('Socket dropped'));
      expect(rt.getStatus()).toBe('RECONNECTING');

      // Advance timer to trigger retry
      await vi.advanceTimersByTimeAsync(550);
      expect(env.clientMock.channel).toHaveBeenCalledTimes(2);

      // Re-subscribe succeeds
      await env.triggerSubscribe('SUBSCRIBED');
      expect(rt.getStatus()).toBe('CONNECTED');
      expect(onReconnected).toHaveBeenCalledTimes(1);

      await rt.leaveRoomChannel();
    });
  });
});
