import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfigStatus {
  configured: boolean;
  url: string;
  reason?: string;
}

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

/**
 * Normalizes a Supabase project URL so that REST/Auth/Realtime endpoints
 * always resolve from the project root origin.
 * Example:
 *   "https://xyz.supabase.co/rest/v1/" -> "https://xyz.supabase.co"
 */
export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Strip accidental API sub-paths such as /rest/v1, /auth/v1, /realtime/v1
  const stripped = trimmed
    .replace(/\/(rest|auth|realtime|functions|storage)\/v\d+\/?$/i, '')
    .replace(/\/+$/, '');

  try {
    const parsed = new URL(stripped);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, ''));
  } catch {
    return '';
  }
}

/**
 * Safely decodes a JWT payload (if the key is JWT-shaped) to ensure
 * a secret `service_role` key is never accidentally exposed in browser code.
 */
function isServiceRoleJwt(key: string): boolean {
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

/**
 * Validates that the configured key is a safe public publishable/anon key
 * and never a secret or service_role credential.
 */
export function validatePublishableKey(rawKey?: string): { valid: boolean; reason?: string } {
  if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
    return { valid: false, reason: 'Missing VITE_SUPABASE_ANON_KEY in root .env.' };
  }
  const key = rawKey.trim();

  if (key.startsWith('sb_secret_') || key.toLowerCase().includes('service_role')) {
    return {
      valid: false,
      reason: 'SECURITY BLOCK: Secret or service_role keys must never be used in frontend code.'
    };
  }

  if (isServiceRoleJwt(key)) {
    return {
      valid: false,
      reason: 'SECURITY BLOCK: Detected a service_role JWT in VITE_SUPABASE_ANON_KEY. Use the publishable/anon key only.'
    };
  }

  return { valid: true };
}

function readEnvVars(): { rawUrl?: string; rawKey?: string } {
  const metaEnv = (import.meta as any)?.env;
  const procEnv = typeof process !== 'undefined' ? process.env : undefined;

  return {
    rawUrl: metaEnv?.VITE_SUPABASE_URL ?? procEnv?.VITE_SUPABASE_URL,
    rawKey: metaEnv?.VITE_SUPABASE_ANON_KEY ?? procEnv?.VITE_SUPABASE_ANON_KEY
  };
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { rawUrl, rawKey } = readEnvVars();
  const normalizedUrl = normalizeSupabaseUrl(rawUrl);

  if (!normalizedUrl) {
    return {
      configured: false,
      url: '',
      reason: 'Missing or invalid VITE_SUPABASE_URL in root .env.'
    };
  }

  const keyCheck = validatePublishableKey(rawKey);
  if (!keyCheck.valid) {
    return {
      configured: false,
      url: normalizedUrl,
      reason: keyCheck.reason
    };
  }

  return {
    configured: true,
    url: normalizedUrl
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().configured;
}

export function createTycoonSupabaseClient(url: string, anonKey: string): SupabaseClient {
  const normalizedUrl = normalizeSupabaseUrl(url);
  if (!normalizedUrl) {
    throw new SupabaseConfigError('Invalid Supabase URL provided.');
  }

  const keyCheck = validatePublishableKey(anonKey);
  if (!keyCheck.valid) {
    throw new SupabaseConfigError(keyCheck.reason || 'Invalid Supabase publishable key.');
  }

  return createClient(normalizedUrl, anonKey.trim(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'tycoonvale_supabase_auth'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client initialized from root `.env` variables.
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const status = getSupabaseConfigStatus();
  if (!status.configured) {
    throw new SupabaseConfigError(status.reason || 'Supabase is not configured.');
  }

  const { rawKey } = readEnvVars();
  cachedClient = createTycoonSupabaseClient(status.url, rawKey!);
  return cachedClient;
}

/**
 * Resets cached singleton (primarily useful for automated test isolation).
 */
export function resetSupabaseClientCache(): void {
  cachedClient = null;
}
