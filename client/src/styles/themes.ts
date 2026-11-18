import { BoardTheme } from '@tycoonvale/shared';

export interface ThemeConfig {
  id: BoardTheme;
  name: string;
  tagline: string;
  canvasBg: string;
  boardBg: string;
  boardBorder: string;
  centerBg: string;
  tileBg: string;
  tileText: string;
  tileBorder: string;
  accentGold: string;
  accentClass: string;
  previewColor: string;
}

export const THEME_CONFIGS: Record<BoardTheme, ThemeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Tabletop',
    tagline: 'Warm parchment, mahogany wood trim and authentic gaming felt',
    canvasBg: 'bg-[#0E1E16]',
    boardBg: 'bg-[#183626]',
    boardBorder: 'border-[#8B5A2B]',
    centerBg: 'bg-[#122B1E]',
    tileBg: 'bg-[#F9F5EC]',
    tileText: 'text-[#1C1917]',
    tileBorder: 'border-[#D9D0BE]',
    accentGold: '#D4AF37',
    accentClass: 'text-amber-500',
    previewColor: '#183626'
  },
  luxury: {
    id: 'luxury',
    name: 'Modern Luxury',
    tagline: 'Imperial navy, polished marble tiles and brushed gold leaf',
    canvasBg: 'bg-[#060D1A]',
    boardBg: 'bg-[#0B1B33]',
    boardBorder: 'border-[#D4AF37]',
    centerBg: 'bg-[#08152B]',
    tileBg: 'bg-[#FFFFFF]',
    tileText: 'text-[#0F172A]',
    tileBorder: 'border-[#CBD5E1]',
    accentGold: '#EAB308',
    accentClass: 'text-yellow-400',
    previewColor: '#0B1B33'
  },
  neon: {
    id: 'neon',
    name: 'Neon Metropolis',
    tagline: 'Cybernetic obsidian tiles with vibrant illuminated neon borders',
    canvasBg: 'bg-[#04060C]',
    boardBg: 'bg-[#090D1A]',
    boardBorder: 'border-[#38BDF8]',
    centerBg: 'bg-[#070B16]',
    tileBg: 'bg-[#0B1120]',
    tileText: 'text-[#F8FAFC]',
    tileBorder: 'border-[#1E293B]',
    accentGold: '#38BDF8',
    accentClass: 'text-cyan-400',
    previewColor: '#090D1A'
  },
  forest: {
    id: 'forest',
    name: 'Forest Estate',
    tagline: 'Deep pine velvet, natural cedarwood texture and botanical grace',
    canvasBg: 'bg-[#071710]',
    boardBg: 'bg-[#0F291E]',
    boardBorder: 'border-[#5C3D2E]',
    centerBg: 'bg-[#0B2117]',
    tileBg: 'bg-[#F4F1EA]',
    tileText: 'text-[#1A261E]',
    tileBorder: 'border-[#CBD5E1]',
    accentGold: '#10B981',
    accentClass: 'text-emerald-400',
    previewColor: '#0F291E'
  }
};
