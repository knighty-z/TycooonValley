import type React from 'react';
import type { BoardTheme, WorldThemeId } from '@tycoonvale/shared';
import type { ThemeConfig } from './types.js';
import { INDIA_THEME } from './india.js';
import { VALORANT_THEME } from './valorant.js';
import { ORIGINAL_THEME } from './original.js';
import { CYBERPUNK_THEME } from './cyberpunk.js';
import { WOMPWOMP_THEME } from './wompwomp.js';

export type {
  ThemeConfig,
  TileDef,
  TokenDef,
  TileIconId,
  TileKind,
  SoundPalette,
  MovementStyleConfig,
  DiceThemeConfig,
  OwnershipVisualConfig,
  GraphicsQuality,
  WorldThemeId
} from './types.js';
export {
  ACCESSIBLE_PLAYER_COLORS,
  getPlayerColorSpec,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type PlayerColorSpec
} from './playerColors.js';
export {
  computeClockwiseSteps,
  buildMovePlan,
  easeInOutCubic,
  easeOutQuart,
  type MovePlan,
  type MoveTransitionKind
} from './movementEngine.js';
export {
  getTileGridCell,
  getTileCenter,
  getStackOffset,
  getTokenZonePoint,
  CORNER_TRACK_UNITS,
  TOTAL_TRACK_UNITS,
  type BoardEdge,
  type TileGridCell,
  type TileCenter,
  type TokenZonePoint
} from './boardGeometry.js';
export { INDIA_THEME, INDIA_OPTIONAL_CITIES } from './india.js';
export { VALORANT_THEME } from './valorant.js';
export { ORIGINAL_THEME } from './original.js';
export { CYBERPUNK_THEME } from './cyberpunk.js';
export { WOMPWOMP_THEME } from './wompwomp.js';

export const WORLD_THEMES: Record<WorldThemeId, ThemeConfig> = {
  india: INDIA_THEME,
  valorant: VALORANT_THEME,
  original: ORIGINAL_THEME,
  cyberpunk: CYBERPUNK_THEME,
  wompwomp: WOMPWOMP_THEME
};

export const WORLD_THEME_LIST: ThemeConfig[] = [
  ORIGINAL_THEME,
  VALORANT_THEME,
  INDIA_THEME,
  CYBERPUNK_THEME,
  WOMPWOMP_THEME
];

const LEGACY_THEME_MAP: Record<string, WorldThemeId> = {
  classic: 'original',
  luxury: 'original',
  neon: 'cyberpunk',
  forest: 'india',
  original: 'original',
  india: 'india',
  valorant: 'valorant',
  cyberpunk: 'cyberpunk',
  wompwomp: 'wompwomp',
  worldwompwomp: 'wompwomp'
};

/**
 * Normalizes any persisted room theme ID (including legacy classic/luxury/neon/forest)
 * into one of the four canonical WorldThemeId values.
 */
export function normalizeWorldTheme(theme?: BoardTheme | string | null): WorldThemeId {
  if (!theme) return 'original';
  return LEGACY_THEME_MAP[theme.toLowerCase()] ?? 'original';
}

export function getThemeConfig(theme?: BoardTheme | string | null): ThemeConfig {
  const id = normalizeWorldTheme(theme);
  return WORLD_THEMES[id];
}

export function getRegisteredThemes(): ThemeConfig[] {
  return WORLD_THEME_LIST;
}

/**
 * Returns the complete CSS custom-property map applied to the board root
 * (`data-theme="..."`). Every board and tile component reads these variables.
 */
export function getThemeCssVars(theme: ThemeConfig): React.CSSProperties {
  const vars: Record<string, string> = {
    '--bg': theme.palette.bg,
    '--board': theme.palette.board,
    '--board-slab': theme.palette.boardSlab,
    '--board-ink': theme.palette.boardInk,
    '--tile': theme.palette.tile,
    '--tile-border': theme.palette.tileBorder,
    '--ink': theme.palette.ink,
    '--ink-muted': theme.palette.inkMuted,
    '--accent': theme.palette.accent,
    '--accent-2': theme.palette.accent2,
    '--font-heading': theme.fonts.heading,
    '--font-body': theme.fonts.body,
    '--radius-tile': theme.radius.tile,
    '--radius-button': theme.radius.button,
    '--group-0': theme.groupColors[0],
    '--group-1': theme.groupColors[1],
    '--group-2': theme.groupColors[2],
    '--group-3': theme.groupColors[3],
    '--group-4': theme.groupColors[4],
    '--group-5': theme.groupColors[5],
    '--group-6': theme.groupColors[6],
    '--group-7': theme.groupColors[7]
  };
  return vars as React.CSSProperties;
}
