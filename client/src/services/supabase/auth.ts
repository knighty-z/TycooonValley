import { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { GuestSession } from '@tycoonvale/shared';
import { getSupabaseClient } from './client.js';

export interface AnonymousAuthResult {
  success: boolean;
  user: User | null;
  session: Session | null;
  isNewAnonymousUser: boolean;
  error?: string;
}

export class SupabaseGuestAuthService {
  private clientOverride: SupabaseClient | null = null;
  private inFlightAuth: Promise<AnonymousAuthResult> | null = null;

  constructor(client?: SupabaseClient) {
    if (client) {
      this.clientOverride = client;
    }
  }

  private getClient(): SupabaseClient {
    return this.clientOverride ?? getSupabaseClient();
  }

  /**
   * Ensures the current browser holds a valid Supabase Anonymous Auth session.
   * - Reuses existing persisted session across page refreshes.
   * - Deduplicates concurrent calls (safe for React StrictMode).
   * - Automatically refreshes expired tokens or creates a new anonymous identity.
   */
  public async ensureAnonymousSession(
    guestProfile?: Partial<GuestSession>
  ): Promise<AnonymousAuthResult> {
    if (this.inFlightAuth) {
      return this.inFlightAuth;
    }

    this.inFlightAuth = this.executeEnsureSession(guestProfile).finally(() => {
      this.inFlightAuth = null;
    });

    return this.inFlightAuth;
  }

  private async executeEnsureSession(
    guestProfile?: Partial<GuestSession>
  ): Promise<AnonymousAuthResult> {
    try {
      const client = this.getClient();

      // 1. Check persisted session first
      const { data: existingData, error: sessionErr } = await client.auth.getSession();
      if (sessionErr) {
        console.warn('⚠️ Failed to read existing Supabase session, attempting fresh anonymous sign-in:', sessionErr.message);
      }

      if (existingData?.session?.user) {
        const existingSession = existingData.session;
        const expiresAtMs = (existingSession.expires_at ?? 0) * 1000;
        const isExpiringSoon = expiresAtMs > 0 && expiresAtMs - Date.now() < 60_000;

        if (isExpiringSoon) {
          const { data: refreshed, error: refreshErr } = await client.auth.refreshSession();
          if (!refreshErr && refreshed?.session?.user) {
            return {
              success: true,
              user: refreshed.session.user,
              session: refreshed.session,
              isNewAnonymousUser: false
            };
          }
        }

        return {
          success: true,
          user: existingSession.user,
          session: existingSession,
          isNewAnonymousUser: false
        };
      }

      // 2. No active session -> Sign in anonymously
      const metadata = this.buildMetadata(guestProfile);
      const { data: signInData, error: signInError } = await client.auth.signInAnonymously({
        options: {
          data: metadata
        }
      });

      if (signInError || !signInData?.user || !signInData?.session) {
        const rawMsg = signInError?.message || 'Anonymous sign-in failed.';
        const friendlyMsg = rawMsg.toLowerCase().includes('anonymous')
          ? `${rawMsg} (Verify that Anonymous Sign-Ins are enabled in Supabase Dashboard -> Authentication -> Providers.)`
          : rawMsg;

        return {
          success: false,
          user: null,
          session: null,
          isNewAnonymousUser: false,
          error: friendlyMsg
        };
      }

      // 3. Best-effort sync to public.player_profiles
      if (guestProfile?.nickname) {
        await this.syncPlayerProfile({
          sessionId: signInData.user.id,
          nickname: guestProfile.nickname,
          avatar: guestProfile.avatar || 'avatar-tycoon',
          token: guestProfile.token || 'crown',
          color: guestProfile.color || '#10B981'
        });
      }

      return {
        success: true,
        user: signInData.user,
        session: signInData.session,
        isNewAnonymousUser: true
      };
    } catch (err: any) {
      return {
        success: false,
        user: null,
        session: null,
        isNewAnonymousUser: false,
        error: err?.message || 'Unexpected error during anonymous authentication.'
      };
    }
  }

  /**
   * Synchronizes the player's customized nickname, avatar, token, and color
   * to Supabase Auth metadata and the `public.player_profiles` table.
   */
  public async syncPlayerProfile(profile: GuestSession): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        return { success: false, error: 'No authenticated guest session found.' };
      }

      const nickname = profile.nickname.trim().slice(0, 32) || 'Tycoon';

      const { error: upsertErr } = await client
        .from('player_profiles')
        .upsert(
          {
            id: userId,
            nickname,
            avatar: profile.avatar,
            token: profile.token,
            color: profile.color,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );

      if (upsertErr) {
        // Non-fatal if migrations aren't pushed yet; return structured error
        return { success: false, error: upsertErr.message };
      }

      // Keep Auth user_metadata in sync as well
      await client.auth.updateUser({
        data: {
          nickname,
          avatar: profile.avatar,
          token: profile.token,
          color: profile.color
        }
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sync player profile.' };
    }
  }

  public async getCurrentUserId(): Promise<string | null> {
    try {
      const client = this.getClient();
      const { data } = await client.auth.getSession();
      return data?.session?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  public onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): () => void {
    const client = this.getClient();
    const { data } = client.auth.onAuthStateChange(callback);
    return () => {
      data.subscription.unsubscribe();
    };
  }

  public async signOut(): Promise<void> {
    const client = this.getClient();
    await client.auth.signOut();
  }

  private buildMetadata(profile?: Partial<GuestSession>): Record<string, string> {
    return {
      nickname: profile?.nickname?.trim().slice(0, 32) || 'TycoonGuest',
      avatar: profile?.avatar || 'avatar-tycoon',
      token: profile?.token || 'crown',
      color: profile?.color || '#10B981'
    };
  }
}

export const supabaseAuth = new SupabaseGuestAuthService();
