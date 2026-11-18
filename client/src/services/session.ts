import { GuestSession } from '@tycoonvale/shared';
import { PLAYER_COLORS, PLAYER_TOKENS } from '@tycoonvale/shared';
import { AVATAR_DEFINITIONS } from '../components/Artwork/AvatarIcons.js';

const STORAGE_KEY = 'tycoonvale_guest_session';

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
