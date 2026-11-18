import type { WorldThemeId } from '@tycoonvale/shared';

export type { WorldThemeId };

export type GraphicsQuality = 'high' | 'low';

export type TileKind =
  | 'go'
  | 'property'
  | 'chest'
  | 'chance'
  | 'tax'
  | 'transport'
  | 'utility'
  | 'jail'
  | 'free_parking'
  | 'go_to_jail';

export type TileIconId =
  // Corner icons
  | 'go_arrow'
  | 'jail_bars'
  | 'free_parking'
  | 'go_to_jail'
  // Universal / Original icons
  | 'arch'
  | 'temple'
  | 'fort'
  | 'mill'
  | 'lotus'
  | 'ghat'
  | 'tower'
  | 'train'
  | 'bridge'
  | 'harbor'
  | 'cable'
  | 'airport'
  | 'electric'
  | 'water'
  | 'tax_ledger'
  | 'chance_card'
  | 'chest_vault'
  | 'villa'
  | 'landmark'
  | 'exchange'
  // Tactical / VALORANT icons
  | 'crosshair'
  | 'site_marker'
  | 'door'
  | 'ramp'
  | 'crate'
  | 'spike'
  | 'armory'
  // Cyberpunk icons
  | 'chip'
  | 'server'
  | 'bio'
  | 'drone_pad'
  | 'reactor'
  | 'maglev'
  | 'sky_tower'
  | 'lockdown';

export interface TileDef {
  index: number; // 0..39
  name: string;
  subtitle?: string;
  kind: TileKind;
  groupIndex?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  price?: number;
  taxAmount?: number;
  icon: TileIconId;
}

export interface TokenDef {
  id: string;
  name: string;
  frameColor: string;
  /** Optional transparent PNG sprite rendered as an upright 2.5D billboard figurine */
  imageSrc?: string;
  /** Fallback initial shown if imageSrc fails to load */
  initial?: string;
}

export interface MovementStyleConfig {
  id: 'graceful' | 'tactical' | 'bouncy' | 'hover';
  hopHeightPx: number;
  minStepMs: number;
  maxStepMs: number;
  maxTotalDurationMs: number;
  directSlideMs: number;
  squashStretch: {
    takeoff: [number, number];
    apex: [number, number];
    land: [number, number];
  };
  landingEffect: 'gold_sparkle' | 'red_pulse' | 'petal_burst' | 'glitch_flicker' | 'pastel_pop';
  trailStyle: 'none' | 'neon';
  accentColor: string;
}

export interface DiceThemeConfig {
  material: 'ivory' | 'steel' | 'carved_wood' | 'cyber_glass' | 'toy_plush';
  faceBg: string;
  faceBgAlt: string;
  faceBorder: string;
  pipColor: string;
  pipOneColor: string;
  pipGlow?: string;
  borderRadius: string;
  soundStyle: WorldThemeId;
}

export interface OwnershipVisualConfig {
  claimStyle: 'gold_sweep' | 'crimson_stamp' | 'saffron_seal' | 'neon_scan' | 'pastel_pop';
  hoverStyle: 'gold_glow' | 'crimson_edge' | 'warm_glow' | 'neon_outline' | 'pastel_glow';
}

export interface SoundPalette {
  id: WorldThemeId;
  clickFreq: number;
  stepFreq: number;
  buyChord: number[];
  goChime: number[];
  waveform: OscillatorType;
}

export interface ThemePalette {
  bg: string;
  board: string;
  boardSlab: string;
  boardInk: string;
  tile: string;
  tileBorder: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accent2: string;
}

export interface HudThemeConfig {
  chatTitle: string;
  quickReactions: string[];
  unitLabel: string;
  hotelLabel: string;
}

export interface ThemeConfig {
  id: WorldThemeId;
  name: string;
  tagline: string;
  currencySymbol: string;
  currencyName: string;
  palette: ThemePalette;
  groupColors: [string, string, string, string, string, string, string, string];
  fonts: {
    heading: string;
    body: string;
    headingUppercase?: boolean;
  };
  radius: {
    tile: string;
    button: string;
  };
  chamfered: boolean;
  neonOutline: boolean;
  surfaceMaterial: 'felt' | 'paper' | 'tactical' | 'obsidian' | 'plush';
  auctionTitle: string;
  tiles: TileDef[];
  tokens: TokenDef[];
  movement: MovementStyleConfig;
  dice: DiceThemeConfig;
  ownership: OwnershipVisualConfig;
  eventDeckNames: {
    chance: string;
    chest: string;
  };
  hud: HudThemeConfig;
  sounds: SoundPalette;
}
