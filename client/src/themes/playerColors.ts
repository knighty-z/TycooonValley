import type { Player } from '@tycoonvale/shared';
import type { TokenDef } from './types.js';

export interface PlayerColorSpec {
  id: string;
  name: string;
  hex: string;
  /** High-contrast foreground ink when text/icon sits inside a filled badge of `hex` */
  ink: string;
  /** Soft translucent halo tint used for glows and hover highlights */
  glow: string;
}

/**
 * 8 clearly distinct, colorblind-friendly player colors designed to stay
 * legible across all 4 worlds (dark VALORANT & Cyberpunk, warm India, emerald Original)
 * and visually distinct from property set-band strips.
 */
export const ACCESSIBLE_PLAYER_COLORS: readonly PlayerColorSpec[] = [
  { id: 'cerulean',  name: 'Electric Cerulean', hex: '#00B4D8', ink: '#06131A', glow: 'rgba(0, 180, 216, 0.48)' },
  { id: 'coral',     name: 'Coral Rose',        hex: '#FF5E7E', ink: '#FFFFFF', glow: 'rgba(255, 94, 126, 0.48)' },
  { id: 'amethyst',  name: 'Royal Amethyst',    hex: '#A855F7', ink: '#FFFFFF', glow: 'rgba(168, 85, 247, 0.48)' },
  { id: 'mint',      name: 'Emerald Mint',      hex: '#22C55E', ink: '#06190D', glow: 'rgba(34, 197, 94, 0.48)' },
  { id: 'tangerine', name: 'Vivid Tangerine',   hex: '#F97316', ink: '#1A0B02', glow: 'rgba(249, 115, 22, 0.48)' },
  { id: 'solar',     name: 'Solar Gold',        hex: '#EAB308', ink: '#1A1302', glow: 'rgba(234, 179, 8, 0.48)' },
  { id: 'fuchsia',   name: 'Fuchsia Pulse',     hex: '#EC4899', ink: '#FFFFFF', glow: 'rgba(236, 72, 153, 0.48)' },
  { id: 'lagoon',    name: 'Deep Lagoon',       hex: '#14B8A6', ink: '#041A18', glow: 'rgba(20, 184, 166, 0.48)' }
] as const;

export function getPlayerColorSpec(colorHex: string | undefined, fallbackIndex = 0): PlayerColorSpec {
  if (colorHex) {
    const exact = ACCESSIBLE_PLAYER_COLORS.find(
      c => c.hex.toLowerCase() === colorHex.toLowerCase()
    );
    if (exact) return exact;
    return {
      id: 'custom',
      name: 'Custom',
      hex: colorHex,
      ink: '#FFFFFF',
      glow: `${colorHex}7A`
    };
  }
  return ACCESSIBLE_PLAYER_COLORS[fallbackIndex % ACCESSIBLE_PLAYER_COLORS.length];
}

/**
 * Ensures every player in a match has a unique accessible color even if legacy
 * sessions share a color. Does not mutate server state; deterministic per seat index.
 */
export function resolveUniquePlayerColors(players: Pick<Player, 'id' | 'color'>[]): Record<string, PlayerColorSpec> {
  const used = new Set<string>();
  const map: Record<string, PlayerColorSpec> = {};

  players.forEach((p, idx) => {
    const normalized = p.color?.toLowerCase();
    const known = ACCESSIBLE_PLAYER_COLORS.find(c => c.hex.toLowerCase() === normalized);
    if (known && !used.has(known.hex.toLowerCase())) {
      used.add(known.hex.toLowerCase());
      map[p.id] = known;
      return;
    }

    // Pick next unused accessible color
    const nextFree =
      ACCESSIBLE_PLAYER_COLORS.find(c => !used.has(c.hex.toLowerCase())) ??
      ACCESSIBLE_PLAYER_COLORS[idx % ACCESSIBLE_PLAYER_COLORS.length];
    used.add(nextFree.hex.toLowerCase());
    map[p.id] = nextFree;
  });

  return map;
}

/**
 * Resolves a player's token to one of the active world's 6 tokens with guaranteed
 * no-duplicate assignment across all players in the same match.
 */
export function resolveWorldTokensForPlayers(
  players: Pick<Player, 'id' | 'token'>[],
  worldTokens: TokenDef[]
): Record<string, TokenDef> {
  const taken = new Set<string>();
  const assigned: Record<string, TokenDef> = {};

  players.forEach((p, idx) => {
    const exact = worldTokens.find(t => t.id === p.token);
    if (exact && !taken.has(exact.id)) {
      taken.add(exact.id);
      assigned[p.id] = exact;
      return;
    }
    const nextAvailable =
      worldTokens.find(t => !taken.has(t.id)) ??
      worldTokens[idx % worldTokens.length];
    taken.add(nextAvailable.id);
    assigned[p.id] = nextAvailable;
  });

  return assigned;
}
