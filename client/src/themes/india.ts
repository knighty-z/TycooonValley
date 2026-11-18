import type { ThemeConfig } from './types.js';

/**
 * Optional swap cities documented per Phase C spec (board holds 22 property slots).
 */
export const INDIA_OPTIONAL_CITIES = [
  'Ahmedabad',
  'Surat',
  'Srinagar',
  'Guwahati',
  'Jaipur'
] as const;

export const INDIA_THEME: ThemeConfig = {
  id: 'india',
  name: 'India',
  tagline: 'Warm architectural ivory, emerald felt and saffron accents',
  currencySymbol: '₹',
  currencyName: 'Rupees',
  palette: {
    bg: '#0B241D',
    board: '#0E3B2E',
    boardSlab: '#061C15',
    boardInk: '#FBF3E2',
    tile: '#FBF3E2',
    tileBorder: '#B8892E',
    ink: '#2A1F14',
    inkMuted: '#6E5A44',
    accent: '#F29A2E',
    accent2: '#1F8A5B'
  },
  groupColors: [
    '#A5523A', // G1 Terracotta
    '#3FA7B5', // G2 Turquoise
    '#D6336C', // G3 Rani Pink
    '#F29A2E', // G4 Saffron
    '#C8382B', // G5 Vermilion
    '#E8B923', // G6 Turmeric
    '#1F8A5B', // G7 Peacock Green
    '#2C3F8F'  // G8 Indigo
  ],
  fonts: {
    heading: "'Cormorant Garamond', Georgia, serif",
    body: "'Hind', sans-serif",
    headingUppercase: false
  },
  radius: {
    tile: '2px',
    button: '4px'
  },
  chamfered: false,
  neonOutline: false,
  surfaceMaterial: 'paper',
  auctionTitle: 'Real-estate auction',
  eventDeckNames: {
    chance: 'Opportunity',
    chest: 'Civic Fund'
  },
  tokens: [
    { id: 'elephant', name: 'Elephant',      frameColor: '#A5523A', initial: 'E' },
    { id: 'lotus',    name: 'Lotus',         frameColor: '#D6336C', initial: 'L' },
    { id: 'rickshaw', name: 'Auto-Rickshaw', frameColor: '#F29A2E', initial: 'R' },
    { id: 'peacock',  name: 'Peacock',       frameColor: '#1F8A5B', initial: 'P' },
    { id: 'temple',   name: 'Temple Dome',   frameColor: '#E8B923', initial: 'T' },
    { id: 'kite',     name: 'Kite',          frameColor: '#3FA7B5', initial: 'K' }
  ],
  movement: {
    id: 'bouncy',
    hopHeightPx: 17,
    minStepMs: 92,
    maxStepMs: 185,
    maxTotalDurationMs: 1350,
    directSlideMs: 410,
    squashStretch: {
      takeoff: [1.1, 0.9],
      apex: [0.94, 1.09],
      land: [1.12, 0.88]
    },
    landingEffect: 'petal_burst',
    trailStyle: 'none',
    accentColor: '#F29A2E'
  },
  dice: {
    material: 'carved_wood',
    faceBg: '#F4DFB8',
    faceBgAlt: '#DEC08A',
    faceBorder: '#B8892E',
    pipColor: '#7A2E19',
    pipOneColor: '#C8382B',
    pipGlow: 'rgba(242, 154, 46, 0.35)',
    borderRadius: '9px',
    soundStyle: 'india'
  },
  ownership: {
    claimStyle: 'saffron_seal',
    hoverStyle: 'warm_glow'
  },
  sounds: {
    id: 'india',
    clickFreq: 420,
    stepFreq: 310,
    buyChord: [392.0, 493.88, 587.33],
    goChime: [659.25, 987.77, 1318.51],
    waveform: 'sine'
  },
  tiles: [
    { index: 0,  name: 'Start',             subtitle: 'Collect',       kind: 'go',           icon: 'go_arrow' },
    { index: 1,  name: 'Darbhanga',         kind: 'property',          groupIndex: 0, price: 60,  icon: 'arch' },
    { index: 2,  name: 'Civic Fund',        kind: 'chest',             icon: 'chest_vault' },
    { index: 3,  name: 'Bhagalpur',         kind: 'property',          groupIndex: 0, price: 60,  icon: 'mill' },
    { index: 4,  name: 'Municipal Tax',     kind: 'tax',               taxAmount: 200, icon: 'tax_ledger' },
    { index: 5,  name: 'Howrah Junction',   kind: 'transport',         price: 200, icon: 'bridge' },
    { index: 6,  name: 'Muzaffarpur',       kind: 'property',          groupIndex: 1, price: 100, icon: 'lotus' },
    { index: 7,  name: 'Opportunity',       kind: 'chance',            icon: 'chance_card' },
    { index: 8,  name: 'Gaya',              kind: 'property',          groupIndex: 1, price: 100, icon: 'temple' },
    { index: 9,  name: 'Patna',             kind: 'property',          groupIndex: 1, price: 120, icon: 'ghat' },

    { index: 10, name: 'Detention',         subtitle: 'Just Visiting', kind: 'jail',         icon: 'jail_bars' },
    { index: 11, name: 'Gorakhpur',         kind: 'property',          groupIndex: 2, price: 140, icon: 'arch' },
    { index: 12, name: 'Power Grid',        subtitle: 'National Power Grid', kind: 'utility', price: 150, icon: 'electric' },
    { index: 13, name: 'Kanpur',            kind: 'property',          groupIndex: 2, price: 140, icon: 'mill' },
    { index: 14, name: 'Prayagraj',         kind: 'property',          groupIndex: 2, price: 160, icon: 'ghat' },
    { index: 15, name: 'Chennai Central',   kind: 'transport',         price: 200, icon: 'train' },
    { index: 16, name: 'Kolhapur',          kind: 'property',          groupIndex: 3, price: 180, icon: 'fort' },
    { index: 17, name: 'Civic Fund',        kind: 'chest',             icon: 'chest_vault' },
    { index: 18, name: 'Nashik',            kind: 'property',          groupIndex: 3, price: 180, icon: 'ghat' },
    { index: 19, name: 'Aurangabad',        subtitle: 'Chhatrapati Sambhajinagar', kind: 'property', groupIndex: 3, price: 200, icon: 'arch' },

    { index: 20, name: 'Tourist Plaza',     subtitle: 'Free Parking',  kind: 'free_parking', icon: 'lotus' },
    { index: 21, name: 'Amravati',          kind: 'property',          groupIndex: 4, price: 220, icon: 'fort' },
    { index: 22, name: 'Opportunity',       kind: 'chance',            icon: 'chance_card' },
    { index: 23, name: 'Nagpur',            kind: 'property',          groupIndex: 4, price: 220, icon: 'arch' },
    { index: 24, name: 'Thane',             kind: 'property',          groupIndex: 4, price: 240, icon: 'tower' },
    { index: 25, name: 'Kochi Metro',       kind: 'transport',         price: 200, icon: 'train' },
    { index: 26, name: 'Ayodhya',           kind: 'property',          groupIndex: 5, price: 260, icon: 'temple' },
    { index: 27, name: 'Agra',              kind: 'property',          groupIndex: 5, price: 260, icon: 'fort' },
    { index: 28, name: 'Jal Waterworks',    subtitle: 'Jal Board Waterworks', kind: 'utility', price: 150, icon: 'water' },
    { index: 29, name: 'Lucknow',           kind: 'property',          groupIndex: 5, price: 280, icon: 'arch' },

    { index: 30, name: 'Municipal Notice',  subtitle: 'Detention',     kind: 'go_to_jail',   icon: 'go_to_jail' },
    { index: 31, name: 'Varanasi',          kind: 'property',          groupIndex: 6, price: 300, icon: 'ghat' },
    { index: 32, name: 'Pune',              kind: 'property',          groupIndex: 6, price: 300, icon: 'fort' },
    { index: 33, name: 'Civic Fund',        kind: 'chest',             icon: 'chest_vault' },
    { index: 34, name: 'Bengaluru',         kind: 'property',          groupIndex: 6, price: 320, icon: 'lotus' },
    { index: 35, name: 'Goa Airport',       kind: 'transport',         price: 200, icon: 'airport' },
    { index: 36, name: 'Opportunity',       kind: 'chance',            icon: 'chance_card' },
    { index: 37, name: 'Delhi',             kind: 'property',          groupIndex: 7, price: 350, icon: 'arch' },
    { index: 38, name: 'Registration Fee',  subtitle: 'Property Registration Fee', kind: 'tax', taxAmount: 100, icon: 'tax_ledger' },
    { index: 39, name: 'Mumbai',            kind: 'property',          groupIndex: 7, price: 400, icon: 'tower' }
  ],
  hud: {
    chatTitle: 'Sabha Chat',
    quickReactions: ['GG', 'Shabaash', 'Nice', 'Wah'],
    unitLabel: 'Haveli',
    hotelLabel: 'Palace'
  }
};
