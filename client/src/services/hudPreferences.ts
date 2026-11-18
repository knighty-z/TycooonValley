export interface HudPreferences {
  soundEnabled: boolean;
  volume: number; // 0.0 to 1.0
  chatVisible: boolean;
}

const STORAGE_KEY = 'tycoonvale_hud_prefs_v1';

export const DEFAULT_HUD_PREFERENCES: HudPreferences = {
  soundEnabled: true,
  volume: 0.7,
  chatVisible: true
};

export function loadHudPreferences(): HudPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_HUD_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HUD_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<HudPreferences>;
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_HUD_PREFERENCES.soundEnabled,
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.max(0, Math.min(1, parsed.volume))
          : DEFAULT_HUD_PREFERENCES.volume,
      chatVisible: typeof parsed.chatVisible === 'boolean' ? parsed.chatVisible : DEFAULT_HUD_PREFERENCES.chatVisible
    };
  } catch {
    return { ...DEFAULT_HUD_PREFERENCES };
  }
}

export function saveHudPreferences(prefs: HudPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota or privacy-mode errors
  }
}
