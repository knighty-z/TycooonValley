import React from 'react';
import {
  ChevronsLeft,
  Lock,
  Palmtree,
  Gavel,
  Landmark,
  Building2,
  Castle,
  Crown,
  Anchor,
  TrainFront,
  Plane,
  CableCar,
  Zap,
  Droplets,
  Receipt,
  Briefcase,
  HelpCircle,
  Gem,
  Flower2,
  Waves,
  Factory,
  Compass,
  Crosshair,
  Target,
  Shield,
  Radar,
  Swords,
  Flame,
  Cpu,
  Radio,
  DoorOpen,
  Box,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Server,
  Bot,
  FlaskConical,
  Orbit,
  Satellite,
  Terminal,
  Database,
  Sparkles,
  ShieldAlert,
  Ban,
  Home,
  Navigation,
  Gift,
  type LucideIcon
} from 'lucide-react';
import type { TileIconId, TileKind, WorldThemeId } from '../../themes/types.js';

interface TileIconProps {
  id: TileIconId;
  worldId?: WorldThemeId;
  kind?: TileKind;
  groupIndex?: number;
  size?: number;
  /** Responsive board-tile sizing variant (overrides fixed pixel box when provided) */
  variant?: 'portrait' | 'landscape' | 'corner' | 'jail';
  chamfered?: boolean;
  className?: string;
}

const STROKE_WIDTH = 2.2;

/**
 * Selects a crisp, expressive Lucide icon tuned to both the tile role and world aesthetic.
 * Single consistent library (lucide-react) and uniform stroke weight across all 4 worlds.
 */
function resolveLucideIcon(id: TileIconId, worldId: WorldThemeId = 'original'): LucideIcon {
  // World-specific corner & special flair
  if (id === 'free_parking') {
    if (worldId === 'india') return Flower2;
    if (worldId === 'valorant') return ShieldCheck;
    if (worldId === 'cyberpunk') return Orbit;
    return Palmtree;
  }
  if (id === 'go_to_jail') {
    if (worldId === 'valorant') return ShieldAlert;
    if (worldId === 'cyberpunk') return Ban;
    return Gavel;
  }
  if (id === 'go_arrow') {
    if (worldId === 'cyberpunk') return Navigation;
    return ChevronsLeft;
  }
  if (id === 'chance_card') {
    if (worldId === 'india') return Sparkles;
    if (worldId === 'valorant') return Crosshair;
    if (worldId === 'cyberpunk') return Terminal;
    return HelpCircle;
  }
  if (id === 'chest_vault') {
    if (worldId === 'valorant') return Shield;
    if (worldId === 'cyberpunk') return Database;
    if (worldId === 'india') return Landmark;
    if (worldId === 'wompwomp') return Gift;
    return Briefcase;
  }

  switch (id) {
    case 'jail_bars':
      return Lock;
    case 'arch':
      return worldId === 'cyberpunk' ? Radio : Landmark;
    case 'temple':
      return Crown;
    case 'fort':
      return Castle;
    case 'mill':
      return Factory;
    case 'lotus':
      return Flower2;
    case 'ghat':
      return Waves;
    case 'tower':
      return Building2;
    case 'train':
      return TrainFront;
    case 'bridge':
      return Compass;
    case 'harbor':
      return Anchor;
    case 'cable':
      return CableCar;
    case 'airport':
      return Plane;
    case 'electric':
      return Zap;
    case 'water':
      return Droplets;
    case 'tax_ledger':
      return worldId === 'valorant' || worldId === 'cyberpunk' ? AlertTriangle : Receipt;
    case 'villa':
      return Home;
    case 'landmark':
      return Landmark;
    case 'exchange':
      return Gem;
    case 'crosshair':
      return Crosshair;
    case 'site_marker':
      return Target;
    case 'door':
      return DoorOpen;
    case 'ramp':
      return Radar;
    case 'crate':
      return Box;
    case 'spike':
      return Flame;
    case 'armory':
      return Swords;
    case 'chip':
      return Cpu;
    case 'server':
      return Server;
    case 'bio':
      return FlaskConical;
    case 'drone_pad':
      return Satellite;
    case 'reactor':
      return Zap;
    case 'maglev':
      return TrainFront;
    case 'sky_tower':
      return Bot;
    case 'lockdown':
      return Ban;
    default:
      return Eye;
  }
}

interface MedallionTone {
  bg: string;
  fg: string;
  border: string;
  glow: string;
}

function getMedallionTone(
  id: TileIconId,
  kind: TileKind | undefined,
  worldId: WorldThemeId,
  groupIndex: number | undefined
): MedallionTone {
  const isDarkTile = worldId === 'valorant' || worldId === 'cyberpunk' || worldId === 'wompwomp';
  const isWomp = worldId === 'wompwomp';

  if (kind === 'property' && groupIndex !== undefined) {
    const groupVar = `var(--group-${groupIndex})`;
    return {
      bg: isWomp
        ? `color-mix(in srgb, ${groupVar} 26%, #24163A)`
        : isDarkTile
        ? `color-mix(in srgb, ${groupVar} 30%, #090E16)`
        : `color-mix(in srgb, ${groupVar} 22%, #FFFFFF)`,
      fg: isDarkTile
        ? `color-mix(in srgb, ${groupVar} 80%, #FFFFFF)`
        : `color-mix(in srgb, ${groupVar} 66%, #16110C)`,
      border: isDarkTile
        ? `color-mix(in srgb, ${groupVar} 85%, transparent)`
        : `color-mix(in srgb, ${groupVar} 76%, #16110C)`,
      glow: `color-mix(in srgb, ${groupVar} 42%, transparent)`
    };
  }

  if (kind === 'chance') {
    return {
      bg: isWomp ? '#FF7EB6' : 'var(--accent)',
      fg: worldId === 'valorant' || isWomp ? '#FFFFFF' : '#0B1218',
      border: isWomp ? '#FFC2DF' : 'color-mix(in srgb, var(--accent) 82%, #FFFFFF)',
      glow: isWomp ? 'rgba(255, 126, 182, 0.55)' : 'color-mix(in srgb, var(--accent) 48%, transparent)'
    };
  }

  if (kind === 'chest') {
    return {
      bg: isWomp ? '#F59E0B' : 'var(--accent-2)',
      fg: worldId === 'valorant' ? '#0B141D' : isWomp ? '#2A1405' : '#FFFFFF',
      border: isWomp ? '#FDE68A' : 'color-mix(in srgb, var(--accent-2) 80%, #FFFFFF)',
      glow: isWomp ? 'rgba(245, 158, 11, 0.52)' : 'color-mix(in srgb, var(--accent-2) 45%, transparent)'
    };
  }

  if (kind === 'tax') {
    return {
      bg: isWomp ? '#4B2259' : isDarkTile ? '#4C141E' : '#FDE8E4',
      fg: isWomp ? '#FF9EB8' : isDarkTile ? '#FF6B78' : '#B8291E',
      border: isWomp ? '#FF7BA8' : isDarkTile ? '#FF4655' : '#D9534F',
      glow: isWomp ? 'rgba(255, 123, 168, 0.36)' : 'rgba(217, 65, 58, 0.34)'
    };
  }

  if (kind === 'utility') {
    const isElectric = id === 'electric' || id === 'reactor' || id === 'spike';
    if (isElectric) {
      return {
        bg: isWomp ? '#463315' : isDarkTile ? '#3D2E0A' : '#FEF3C7',
        fg: isDarkTile ? '#FFD95A' : '#B45309',
        border: '#FACC15',
        glow: 'rgba(250, 204, 21, 0.44)'
      };
    }
    return {
      bg: isWomp ? '#173A54' : isDarkTile ? '#0B2F40' : '#E0F2FE',
      fg: isDarkTile ? '#5CE1E6' : '#0369A1',
      border: '#5CE1E6',
      glow: 'rgba(92, 225, 230, 0.42)'
    };
  }

  if (kind === 'transport') {
    return {
      bg: isWomp ? '#3C2B63' : isDarkTile ? '#233242' : '#24292F',
      fg: isWomp ? '#C49BFF' : isDarkTile ? 'var(--accent)' : '#F8FAFC',
      border: isWomp ? '#8F6FD1' : isDarkTile ? 'var(--tile-border)' : '#475569',
      glow: isWomp ? 'rgba(196, 155, 255, 0.38)' : 'rgba(0, 0, 0, 0.35)'
    };
  }

  if (kind === 'go') {
    return {
      bg: isWomp ? '#97E86B' : 'var(--accent)',
      fg: worldId === 'valorant' ? '#FFFFFF' : '#181026',
      border: isWomp ? '#D9FFB8' : 'color-mix(in srgb, var(--accent) 75%, #FFFFFF)',
      glow: isWomp ? 'rgba(151, 232, 107, 0.52)' : 'color-mix(in srgb, var(--accent) 50%, transparent)'
    };
  }

  if (kind === 'free_parking') {
    return {
      bg: isWomp ? '#5CE1E6' : 'var(--accent-2)',
      fg: worldId === 'valorant' || isWomp ? '#141B2D' : '#FFFFFF',
      border: isWomp ? '#B9F7FA' : 'color-mix(in srgb, var(--accent-2) 75%, #FFFFFF)',
      glow: isWomp ? 'rgba(92, 225, 230, 0.52)' : 'color-mix(in srgb, var(--accent-2) 48%, transparent)'
    };
  }

  if (kind === 'go_to_jail') {
    return {
      bg: isWomp ? '#FF6B8B' : '#B8291E',
      fg: '#FFFFFF',
      border: isWomp ? '#FFC2D1' : '#FF6B78',
      glow: isWomp ? 'rgba(255, 107, 139, 0.48)' : 'rgba(184, 41, 30, 0.45)'
    };
  }

  // Jail / default
  return {
    bg: isWomp ? '#422F69' : isDarkTile ? '#283444' : '#E7DBC5',
    fg: isDarkTile ? '#FFF7F2' : '#2A1F14',
    border: isWomp ? '#9D81D4' : isDarkTile ? '#64748B' : '#B89B63',
    glow: 'rgba(0, 0, 0, 0.32)'
  };
}

/**
 * Expressive, alive Lucide icon medallion with consistent stroke weight (2.2),
 * themed semantic colors, inner specular highlight, and crisp contrast across all 4 worlds.
 */
export const TileIcon: React.FC<TileIconProps> = React.memo(
  ({
    id,
    worldId = 'original',
    kind,
    groupIndex,
    size = 18,
    variant,
    chamfered = false,
    className = ''
  }) => {
    const IconComp = resolveLucideIcon(id, worldId);
    const tone = getMedallionTone(id, kind, worldId, groupIndex);
    const boxSize = Math.round(size * 1.42);

    return (
      <span
        className={`tv-icon-medallion ${className}`}
        data-chamfered-icon={chamfered ? 'true' : 'false'}
        data-icon-variant={variant}
        style={{
          ...(variant ? undefined : { width: `${boxSize}px`, height: `${boxSize}px` }),
          backgroundColor: tone.bg,
          color: tone.fg,
          borderColor: tone.border,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.32), 0 2px 6px ${tone.glow}`
        }}
        aria-hidden="true"
      >
        {variant ? (
          <IconComp className="tv-icon-glyph" strokeWidth={STROKE_WIDTH} />
        ) : (
          <IconComp size={size} strokeWidth={STROKE_WIDTH} />
        )}
      </span>
    );
  }
);

TileIcon.displayName = 'TileIcon';
