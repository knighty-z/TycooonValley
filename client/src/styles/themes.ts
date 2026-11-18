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
  original: {
    id: 'original',
    name: 'Original',
    tagline: 'Luxury emerald felt, antique gold and ivory tabletop',
    canvasBg: 'bg-[#0B1F19]',
    boardBg: 'bg-[#12372C]',
    boardBorder: 'border-[#C9A24B]',
    centerBg: 'bg-[#12372C]',
    tileBg: 'bg-[#F4EEDC]',
    tileText: 'text-[#1B1B1B]',
    tileBorder: 'border-[#C9A24B]',
    accentGold: '#C9A24B',
    accentClass: 'text-[#C9A24B]',
    previewColor: '#12372C'
  },
  india: {
    id: 'india',
    name: 'India',
    tagline: 'Ivory architectural tiles on deep emerald felt with saffron accents',
    canvasBg: 'bg-[#0B241D]',
    boardBg: 'bg-[#0E3B2E]',
    boardBorder: 'border-[#B8892E]',
    centerBg: 'bg-[#0E3B2E]',
    tileBg: 'bg-[#FBF3E2]',
    tileText: 'text-[#2A1F14]',
    tileBorder: 'border-[#B8892E]',
    accentGold: '#F29A2E',
    accentClass: 'text-[#F29A2E]',
    previewColor: '#0E3B2E'
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant Tactical',
    tagline: 'Sharp angular tactical arena in slate navy and crimson',
    canvasBg: 'bg-[#0F1923]',
    boardBg: 'bg-[#16232F]',
    boardBorder: 'border-[#3A4B5A]',
    centerBg: 'bg-[#16232F]',
    tileBg: 'bg-[#1C2B38]',
    tileText: 'text-[#ECE8E1]',
    tileBorder: 'border-[#3A4B5A]',
    accentGold: '#FF4655',
    accentClass: 'text-[#FF4655]',
    previewColor: '#16232F'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    tagline: 'Dark megacity obsidian with restrained cyan and magenta neon',
    canvasBg: 'bg-[#07070F]',
    boardBg: 'bg-[#0D0D1A]',
    boardBorder: 'border-[#2A2A44]',
    centerBg: 'bg-[#0D0D1A]',
    tileBg: 'bg-[#12121F]',
    tileText: 'text-[#E8EAF6]',
    tileBorder: 'border-[#2A2A44]',
    accentGold: '#19F0FF',
    accentClass: 'text-[#19F0FF]',
    previewColor: '#0D0D1A'
  },
  wompwomp: {
    id: 'wompwomp',
    name: 'WorldWompWomp',
    tagline: 'Dark plum tabletop, playful pastels & collectible 3D mascot buddies',
    canvasBg: 'bg-[#1A1128]',
    boardBg: 'bg-[#241838]',
    boardBorder: 'border-[#5C4487]',
    centerBg: 'bg-[#241838]',
    tileBg: 'bg-[#32234E]',
    tileText: 'text-[#FFF7F2]',
    tileBorder: 'border-[#5C4487]',
    accentGold: '#FF8AB8',
    accentClass: 'text-[#FF8AB8]',
    previewColor: '#241838'
  },
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
