import React from 'react';

export interface TokenDefinition {
  id: string;
  name: string;
  Component: React.FC<{ className?: string; color?: string }>;
}

export const TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    id: 'crown',
    name: 'Imperial Crown',
    Component: ({ className = 'w-full h-full', color = '#F59E0B' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="16" ry="4" fill="#000000" fillOpacity="0.35" />
        <path d="M10 36L12 18L18 26L24 14L30 26L36 18L38 36H10Z" fill={color} stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="10" y="32" width="28" height="5" rx="1" fill="#B45309" stroke="#FEF08A" strokeWidth="1" />
        <circle cx="24" cy="14" r="2.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="12" cy="18" r="2" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="36" cy="18" r="2" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="17" cy="34.5" r="1.5" fill="#FFFFFF" />
        <circle cx="24" cy="34.5" r="1.5" fill="#FFFFFF" />
        <circle cx="31" cy="34.5" r="1.5" fill="#FFFFFF" />
      </svg>
    )
  },
  {
    id: 'rocket',
    name: 'Cosmic Rocket',
    Component: ({ className = 'w-full h-full', color = '#3B82F6' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="42" rx="14" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <path d="M24 6C18 14 16 26 16 34H32C32 26 30 14 24 6Z" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="24" cy="20" r="3.5" fill="#BAE6FD" stroke="#1E293B" strokeWidth="1" />
        <path d="M16 28L8 35L14 38L17 34" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
        <path d="M32 28L40 35L34 38L31 34" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
        <polygon points="21,34 27,34 24,42" fill="#F59E0B" />
      </svg>
    )
  },
  {
    id: 'cat',
    name: 'Sphinx Cat',
    Component: ({ className = 'w-full h-full', color = '#10B981' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="14" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <path d="M16 40C16 30 20 22 24 22C28 22 32 30 32 40H16Z" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="24" cy="18" r="8" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <polygon points="17,14 18,6 23,12" fill={color} stroke="#FFFFFF" strokeWidth="1" />
        <polygon points="31,14 30,6 25,12" fill={color} stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="21" cy="17" r="1.5" fill="#FFFFFF" />
        <circle cx="27" cy="17" r="1.5" fill="#FFFFFF" />
        <circle cx="24" cy="28" r="2.5" fill="#D4AF37" />
      </svg>
    )
  },
  {
    id: 'diamond',
    name: 'Brilliant Diamond',
    Component: ({ className = 'w-full h-full', color = '#06B6D4' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="14" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <polygon points="12,18 36,18 24,38" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <polygon points="12,18 18,10 30,10 36,18" fill="#CFFAFE" stroke="#FFFFFF" strokeWidth="1.5" />
        <polygon points="18,18 24,10 30,18" fill="#A5F3FC" />
        <line x1="18" y1="18" x2="24" y2="38" stroke="#FFFFFF" strokeWidth="1" />
        <line x1="30" y1="18" x2="24" y2="38" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'train',
    name: 'Steam Locomotive',
    Component: ({ className = 'w-full h-full', color = '#64748B' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="16" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <rect x="10" y="22" width="28" height="14" rx="2" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="28" y="14" width="10" height="14" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="14" y="12" width="4" height="10" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1" />
        <polygon points="10,34 6,38 12,38" fill="#F59E0B" />
        <circle cx="16" cy="36" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="24" cy="36" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="32" cy="36" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'ship',
    name: 'Three-Masted Galleon',
    Component: ({ className = 'w-full h-full', color = '#0284C7' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="15" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <path d="M10 28L12 36C12 36 24 38 36 36L40 28H10Z" fill="#78350F" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="18" y1="28" x2="18" y2="12" stroke="#451A03" strokeWidth="1.5" />
        <line x1="26" y1="28" x2="26" y2="8" stroke="#451A03" strokeWidth="1.5" />
        <line x1="33" y1="28" x2="33" y2="14" stroke="#451A03" strokeWidth="1.5" />
        <path d="M19 14C23 14 24 20 19 24Z" fill={color} stroke="#FFFFFF" strokeWidth="1" />
        <path d="M27 10C32 10 33 18 27 24Z" fill={color} stroke="#FFFFFF" strokeWidth="1" />
        <path d="M34 16C37 16 38 22 34 25Z" fill={color} stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'tophat',
    name: 'Classic Top Hat',
    Component: ({ className = 'w-full h-full', color = '#1E293B' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="38" rx="16" ry="4" fill="#000000" fillOpacity="0.35" />
        <ellipse cx="24" cy="34" rx="17" ry="4" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M15 34L16 14H32L33 34Z" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <ellipse cx="24" cy="14" rx="8.5" ry="2.5" fill="#334155" stroke="#FFFFFF" strokeWidth="1" />
        <rect x="15.5" y="27" width="17" height="4" fill="#DC2626" />
      </svg>
    )
  },
  {
    id: 'dragon',
    name: 'Winged Dragon',
    Component: ({ className = 'w-full h-full', color = '#DC2626' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="14" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <path d="M18 38C16 28 22 24 26 24C30 24 34 30 32 38" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <circle cx="28" cy="18" r="5" fill={color} stroke="#FFFFFF" strokeWidth="1" />
        <polygon points="26,14 27,8 30,14" fill="#F59E0B" />
        <polygon points="30,15 33,10 33,16" fill="#F59E0B" />
        <path d="M22 24C14 18 10 24 12 30C16 28 20 28 22 28Z" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'car',
    name: 'Vintage Roadster',
    Component: ({ className = 'w-full h-full', color = '#D97706' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="16" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <path d="M8 28C12 28 14 22 22 22H32L38 28H42V34H8V28Z" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="16" cy="34" r="4.5" fill="#18181B" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="16" cy="34" r="1.5" fill="#D4AF37" />
        <circle cx="34" cy="34" r="4.5" fill="#18181B" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="34" cy="34" r="1.5" fill="#D4AF37" />
        <path d="M24 22L22 17H28L30 22" fill="#E0F2FE" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'robot',
    name: 'Brass Automaton',
    Component: ({ className = 'w-full h-full', color = '#EAB308' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="14" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <rect x="15" y="24" width="18" height="14" rx="2" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="17" y="12" width="14" height="10" rx="2" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="21" cy="16" r="1.5" fill="#10B981" />
        <circle cx="27" cy="16" r="1.5" fill="#10B981" />
        <line x1="24" y1="12" x2="24" y2="7" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="24" cy="6" r="1.5" fill="#EF4444" />
        <rect x="19" y="28" width="10" height="6" fill="#1E293B" />
      </svg>
    )
  },
  {
    id: 'chest',
    name: 'Treasure Coffer',
    Component: ({ className = 'w-full h-full', color = '#854D0E' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="15" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <rect x="11" y="22" width="26" height="15" rx="2" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M11 22C11 16 17 12 24 12C31 12 37 16 37 22H11Z" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="18" y="12" width="3" height="25" fill="#F59E0B" />
        <rect x="27" y="12" width="3" height="25" fill="#F59E0B" />
        <rect x="22" y="20" width="4" height="5" rx="1" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'watch',
    name: 'Chronograph Pocketwatch',
    Component: ({ className = 'w-full h-full', color = '#F59E0B' }) => (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="24" cy="40" rx="14" ry="3.5" fill="#000000" fillOpacity="0.35" />
        <circle cx="24" cy="24" r="14" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="11" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
        <line x1="24" y1="24" x2="24" y2="17" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="24" x2="29" y2="24" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="1.5" fill="#1E293B" />
        <circle cx="24" cy="8" r="2.5" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }
];

export function getTokenById(id: string): TokenDefinition {
  return TOKEN_DEFINITIONS.find(t => t.id === id) || TOKEN_DEFINITIONS[0];
}
