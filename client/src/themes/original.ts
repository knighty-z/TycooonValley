import type { ThemeConfig } from './types.js';

export const ORIGINAL_THEME: ThemeConfig = {
  id: 'original',
  name: 'Original',
  tagline: 'Luxury emerald felt, antique gold and ivory tabletop',
  currencySymbol: '$',
  currencyName: 'Dollars',
  palette: {
    bg: '#0B1F19',
    board: '#12372C',
    boardSlab: '#081A14',
    boardInk: '#F4EEDC',
    tile: '#F4EEDC',
    tileBorder: '#C9A24B',
    ink: '#1B1B1B',
    inkMuted: '#5C5343',
    accent: '#C9A24B',
    accent2: '#2F7D4F'
  },
  groupColors: [
    '#7A4B2E', // G1
    '#8CC7D9', // G2
    '#C8567F', // G3
    '#D9822B', // G4
    '#B8322F', // G5
    '#E3C23A', // G6
    '#2F7D4F', // G7
    '#23408E'  // G8
  ],
  fonts: {
    heading: "'Cinzel', Georgia, serif",
    body: "'Barlow Condensed', sans-serif",
    headingUppercase: false
  },
  radius: {
    tile: '2px',
    button: '2px'
  },
  chamfered: false,
  neonOutline: false,
  surfaceMaterial: 'felt',
  auctionTitle: 'Luxury acquisition',
  eventDeckNames: {
    chance: 'Opportunity',
    chest: 'Estate Fund'
  },
  tokens: [
    { id: 'tophat', name: 'Top Hat',   frameColor: '#C9A24B', initial: 'T' },
    { id: 'car',    name: 'Roadster',  frameColor: '#2F7D4F', initial: 'R' },
    { id: 'ship',   name: 'Galleon',   frameColor: '#23408E', initial: 'G' },
    { id: 'crown',  name: 'Crown',     frameColor: '#D9822B', initial: 'C' },
    { id: 'key',    name: 'Vault Key', frameColor: '#7A4B2E', initial: 'K' },
    { id: 'chess',  name: 'Knight',    frameColor: '#C8567F', initial: 'N' }
  ],
  movement: {
    id: 'graceful',
    hopHeightPx: 14,
    minStepMs: 92,
    maxStepMs: 180,
    maxTotalDurationMs: 1320,
    directSlideMs: 420,
    squashStretch: {
      takeoff: [1.06, 0.94],
      apex: [0.96, 1.06],
      land: [1.08, 0.92]
    },
    landingEffect: 'gold_sparkle',
    trailStyle: 'none',
    accentColor: '#C9A24B'
  },
  dice: {
    material: 'ivory',
    faceBg: '#FAF4E4',
    faceBgAlt: '#EAE0C6',
    faceBorder: '#C9A24B',
    pipColor: '#A67C23',
    pipOneColor: '#B8322F',
    pipGlow: 'rgba(201, 162, 75, 0.35)',
    borderRadius: '8px',
    soundStyle: 'original'
  },
  ownership: {
    claimStyle: 'gold_sweep',
    hoverStyle: 'gold_glow'
  },
  sounds: {
    id: 'original',
    clickFreq: 520,
    stepFreq: 380,
    buyChord: [440, 554.37, 659.25],
    goChime: [587.33, 880, 1174.66],
    waveform: 'sine'
  },
  tiles: [
    { index: 0,  name: 'GO',                   subtitle: 'Collect', kind: 'go',           icon: 'go_arrow' },
    { index: 1,  name: 'Cobble Lane',          kind: 'property',    groupIndex: 0, price: 60,  icon: 'arch' },
    { index: 2,  name: 'Estate Fund',          kind: 'chest',       icon: 'chest_vault' },
    { index: 3,  name: 'Old Mill Court',       kind: 'property',    groupIndex: 0, price: 60,  icon: 'mill' },
    { index: 4,  name: 'Luxury Levy',          kind: 'tax',         taxAmount: 200, icon: 'tax_ledger' },
    { index: 5,  name: 'Harbor Port',          kind: 'transport',   price: 200, icon: 'harbor' },
    { index: 6,  name: 'Marina Walk',          kind: 'property',    groupIndex: 1, price: 100, icon: 'bridge' },
    { index: 7,  name: 'Opportunity',          kind: 'chance',      icon: 'chance_card' },
    { index: 8,  name: 'Lantern Quay',         kind: 'property',    groupIndex: 1, price: 100, icon: 'harbor' },
    { index: 9,  name: 'Saltwater Pier',       kind: 'property',    groupIndex: 1, price: 120, icon: 'bridge' },

    { index: 10, name: 'The Vault',            subtitle: 'Just Visiting', kind: 'jail',   icon: 'jail_bars' },
    { index: 11, name: 'Rosewood Gardens',     kind: 'property',    groupIndex: 2, price: 140, icon: 'villa' },
    { index: 12, name: 'Electric Company',     kind: 'utility',     price: 150, icon: 'electric' },
    { index: 13, name: 'Linden Terrace',       kind: 'property',    groupIndex: 2, price: 140, icon: 'arch' },
    { index: 14, name: 'Willow Heights',       kind: 'property',    groupIndex: 2, price: 160, icon: 'villa' },
    { index: 15, name: 'Central Rail',         kind: 'transport',   price: 200, icon: 'train' },
    { index: 16, name: 'Gallery District',     kind: 'property',    groupIndex: 3, price: 180, icon: 'arch' },
    { index: 17, name: 'Estate Fund',          kind: 'chest',       icon: 'chest_vault' },
    { index: 18, name: 'Opera Quarter',        kind: 'property',    groupIndex: 3, price: 180, icon: 'landmark' },
    { index: 19, name: 'Atelier Row',          kind: 'property',    groupIndex: 3, price: 200, icon: 'arch' },

    { index: 20, name: 'The Lounge',           subtitle: 'Free Parking', kind: 'free_parking', icon: 'free_parking' },
    { index: 21, name: 'Crown Exchange',       kind: 'property',    groupIndex: 4, price: 220, icon: 'exchange' },
    { index: 22, name: 'Opportunity',          kind: 'chance',      icon: 'chance_card' },
    { index: 23, name: 'Bullion Street',       kind: 'property',    groupIndex: 4, price: 220, icon: 'exchange' },
    { index: 24, name: 'Merchant Plaza',       kind: 'property',    groupIndex: 4, price: 240, icon: 'landmark' },
    { index: 25, name: 'Skyline Cable',        kind: 'transport',   price: 200, icon: 'cable' },
    { index: 26, name: 'Azure Resort',         kind: 'property',    groupIndex: 5, price: 260, icon: 'villa' },
    { index: 27, name: 'Coral Bay Villas',     kind: 'property',    groupIndex: 5, price: 260, icon: 'villa' },
    { index: 28, name: 'Water Works',          kind: 'utility',     price: 150, icon: 'water' },
    { index: 29, name: 'Palm Atoll',           kind: 'property',    groupIndex: 5, price: 280, icon: 'landmark' },

    { index: 30, name: 'Audit',                subtitle: 'Go To Vault', kind: 'go_to_jail', icon: 'go_to_jail' },
    { index: 31, name: 'Summit Residences',    kind: 'property',    groupIndex: 6, price: 300, icon: 'tower' },
    { index: 32, name: 'Aurelia Estate',       kind: 'property',    groupIndex: 6, price: 300, icon: 'villa' },
    { index: 33, name: 'Estate Fund',          kind: 'chest',       icon: 'chest_vault' },
    { index: 34, name: "Regent's Park",        kind: 'property',    groupIndex: 6, price: 320, icon: 'landmark' },
    { index: 35, name: 'Aerodrome',            kind: 'transport',   price: 200, icon: 'airport' },
    { index: 36, name: 'Opportunity',          kind: 'chance',      icon: 'chance_card' },
    { index: 37, name: 'Grand Meridian Hotel', kind: 'property',    groupIndex: 7, price: 350, icon: 'tower' },
    { index: 38, name: 'Estate Duty',          kind: 'tax',         taxAmount: 100, icon: 'tax_ledger' },
    { index: 39, name: 'TycoonVale Tower',     kind: 'property',    groupIndex: 7, price: 400, icon: 'tower' }
  ],
  hud: {
    chatTitle: 'Table Chat',
    quickReactions: ['GG', 'Well Played', 'Nice', 'Bold Move'],
    unitLabel: 'House',
    hotelLabel: 'Hotel'
  }
};
