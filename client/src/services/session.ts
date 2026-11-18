import { GuestSession, WorldThemeId } from '@tycoonvale/shared';
import { PLAYER_COLORS, PLAYER_TOKENS } from '@tycoonvale/shared';
import { AVATAR_DEFINITIONS } from '../components/Artwork/AvatarIcons.js';

const STORAGE_KEY = 'tycoonvale_guest_session';
const WORLD_STORAGE_KEY = 'tycoonvale_preferred_world';
const VALID_WORLDS: WorldThemeId[] = ['original', 'valorant', 'india', 'cyberpunk', 'wompwomp'];

export function getPreferredWorld(): WorldThemeId {
  try {
    const raw = localStorage.getItem(WORLD_STORAGE_KEY) as WorldThemeId | null;
    if (raw && VALID_WORLDS.includes(raw)) {
      return raw;
    }
  } catch {
    // Ignore storage read failures in restricted contexts
  }
  return 'original';
}

export function savePreferredWorld(world: WorldThemeId): void {
  try {
    localStorage.setItem(WORLD_STORAGE_KEY, world);
  } catch {
    // Ignore storage write failures in restricted contexts
  }
}

export function validateNickname(raw: string): { valid: boolean; trimmed: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, trimmed, error: 'Enter a player name (2–16 characters).' };
  }
  if (trimmed.length < 2) {
    return { valid: false, trimmed, error: 'Name must be at least 2 characters.' };
  }
  if (trimmed.length > 16) {
    return { valid: false, trimmed, error: 'Name cannot exceed 16 characters.' };
  }
  return { valid: true, trimmed };
}

export function extractRoomCode(raw: string): string {
  const trimmed = raw.trim();
  // Support pasting full invite URLs like https://host/?room=ABC123
  const urlMatch = trimmed.match(/[?&]room=([A-Za-z0-9]+)/i);
  const candidate = urlMatch ? urlMatch[1] : trimmed;
  return candidate.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

export const AVATAR_OPTIONS = AVATAR_DEFINITIONS.map(a => ({
  id: a.id,
  name: a.name,
  label: a.title
}));

export function getStoredSession(): GuestSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.sessionId && parsed.nickname) {
        // Upgrade legacy avatar IDs if needed
        if (parsed.avatar.startsWith('avatar-') && !AVATAR_DEFINITIONS.some(a => a.id === parsed.avatar)) {
          parsed.avatar = 'avatar-tycoon';
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read session from localStorage');
  }

  // Generate default guest session
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const randomColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
  const randomToken = PLAYER_TOKENS[Math.floor(Math.random() * PLAYER_TOKENS.length)].id;
  const randomAvatar = AVATAR_DEFINITIONS[Math.floor(Math.random() * AVATAR_DEFINITIONS.length)].id;

  const newSession: GuestSession = {
    sessionId: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    nickname: `Tycoon${randomSuffix}`,
    avatar: randomAvatar,
    token: randomToken,
    color: randomColor
  };

  saveSession(newSession);
  return newSession;
}

export function saveSession(session: GuestSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function bindAuthenticatedUserId(userId: string): GuestSession {
  const current = getStoredSession();
  if (current.sessionId === userId) {
    return current;
  }
  const updated: GuestSession = {
    ...current,
    sessionId: userId
  };
  saveSession(updated);
  return updated;
}
