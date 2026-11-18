import type { ThemeConfig } from './types.js';

export const WOMPWOMP_THEME: ThemeConfig = {
  id: 'wompwomp',
  name: 'WorldWompWomp',
  tagline: 'Dark plum tabletop, playful pastels & collectible 3D mascot buddies',
  currencySymbol: '$',
  currencyName: 'Womps',
  palette: {
    bg: '#1A1128',
    board: '#241838',
    boardSlab: '#120A1E',
    boardInk: '#FFF7F2',
    tile: '#32234E',
    tileBorder: '#5C4487',
    ink: '#FFF7F2',
    inkMuted: '#CCB9E8',
    accent: '#FF8AB8',
    accent2: '#5CE1E6'
  },
  groupColors: [
    '#FF9E7D', // G1 — Warm Peach Coral
    '#FF85B3', // G2 — Bubblegum Pink
    '#FFD166', // G3 — Sunny Buttercup
    '#6FE3B5', // G4 — Soft Mint
    '#6BC8FF', // G5 — Sky Pastel
    '#C49BFF', // G6 — Dreamy Lavender
    '#FF7E8A', // G7 — Berry Coral
    '#97E86B'  // G8 — Meadow Lime
  ],
  fonts: {
    heading: "'Fredoka', 'Nunito', 'Plus Jakarta Sans', sans-serif",
    body: "'Nunito', 'Plus Jakarta Sans', sans-serif",
    headingUppercase: false
  },
  radius: {
    tile: '8px',
    button: '10px'
  },
  chamfered: false,
  neonOutline: false,
  surfaceMaterial: 'plush',
  auctionTitle: 'WompWomp Bid Bash',
  eventDeckNames: {
    chance: 'Surprise',
    chest: 'Treasure'
  },
  tokens: [
    { id: 'womp_peach',    name: 'Peach',    frameColor: '#FFAF87', imageSrc: '/tokens/wompwomp/peach.png',    initial: 'P' },
    { id: 'womp_pink',     name: 'Pink',     frameColor: '#FF85B3', imageSrc: '/tokens/wompwomp/pink.png',     initial: 'K' },
    { id: 'womp_lavender', name: 'Lavender', frameColor: '#C49BFF', imageSrc: '/tokens/wompwomp/lavender.png', initial: 'L' },
    { id: 'womp_mint',     name: 'Mint',     frameColor: '#6FE3B5', imageSrc: '/tokens/wompwomp/mint.png',     initial: 'M' },
    { id: 'womp_sky',      name: 'Sky',      frameColor: '#6BC8FF', imageSrc: '/tokens/wompwomp/sky.png',      initial: 'S' },
    { id: 'womp_lemon',    name: 'Lemon',    frameColor: '#FFD166', imageSrc: '/tokens/wompwomp/lemon.png',    initial: 'Y' }
  ],
  movement: {
    id: 'bouncy',
    hopHeightPx: 18,
    minStepMs: 88,
    maxStepMs: 175,
    maxTotalDurationMs: 1280,
    directSlideMs: 390,
    squashStretch: {
      takeoff: [1.14, 0.86],
      apex: [0.92, 1.12],
      land: [1.16, 0.84]
    },
    landingEffect: 'pastel_pop',
    trailStyle: 'none',
    accentColor: '#FF8AB8'
  },
  dice: {
    material: 'toy_plush',
    faceBg: '#FFFBF7',
    faceBgAlt: '#EAE0F7',
    faceBorder: '#C49BFF',
    pipColor: '#2A1842',
    pipOneColor: '#FF4E98',
    pipGlow: 'rgba(255, 138, 184, 0.45)',
    borderRadius: '10px',
    soundStyle: 'wompwomp'
  },
  ownership: {
    claimStyle: 'pastel_pop',
    hoverStyle: 'pastel_glow'
  },
  sounds: {
    id: 'wompwomp',
    clickFreq: 660,
    stepFreq: 520,
    buyChord: [523.25, 659.25, 783.99, 1046.5],
    goChime: [659.25, 783.99, 1046.5, 1318.51],
    waveform: 'triangle'
  },
  tiles: [
    { index: 0,  name: 'GO',              subtitle: 'Collect',        kind: 'go',           icon: 'go_arrow' },
    { index: 1,  name: 'Wobbly Woods',    kind: 'property',           groupIndex: 0, price: 60,  icon: 'lotus' },
    { index: 2,  name: 'Treasure',        kind: 'chest',              icon: 'chest_vault' },
    { index: 3,  name: 'Bouncy Brook',    kind: 'property',           groupIndex: 0, price: 60,  icon: 'ghat' },
    { index: 4,  name: 'Snack Tax',       kind: 'tax',                taxAmount: 200, icon: 'tax_ledger' },
    { index: 5,  name: 'Cloud Express',   kind: 'transport',          price: 200, icon: 'airport' },
    { index: 6,  name: 'Bubblegum Bay',   kind: 'property',           groupIndex: 1, price: 100, icon: 'harbor' },
    { index: 7,  name: 'Surprise',        kind: 'chance',             icon: 'chance_card' },
    { index: 8,  name: 'Jellybean Pier',  kind: 'property',           groupIndex: 1, price: 100, icon: 'bridge' },
    { index: 9,  name: 'Cotton Cove',     kind: 'property',           groupIndex: 1, price: 120, icon: 'harbor' },

    { index: 10, name: 'Time Out',        subtitle: 'Just Visiting',  kind: 'jail',         icon: 'jail_bars' },
    { index: 11, name: 'Pancake Plaza',   kind: 'property',           groupIndex: 2, price: 140, icon: 'villa' },
    { index: 12, name: 'Spark Plant',     kind: 'utility',            price: 150, icon: 'electric' },
    { index: 13, name: 'Waffle Walk',     kind: 'property',           groupIndex: 2, price: 140, icon: 'arch' },
    { index: 14, name: 'Syrup Square',    kind: 'property',           groupIndex: 2, price: 160, icon: 'landmark' },
    { index: 15, name: 'Giggle Rail',     kind: 'transport',          price: 200, icon: 'train' },
    { index: 16, name: 'Mint Meadows',    kind: 'property',           groupIndex: 3, price: 180, icon: 'lotus' },
    { index: 17, name: 'Treasure',        kind: 'chest',              icon: 'chest_vault' },
    { index: 18, name: 'Clover Creek',    kind: 'property',           groupIndex: 3, price: 180, icon: 'villa' },
    { index: 19, name: 'Pudding Park',    kind: 'property',           groupIndex: 3, price: 200, icon: 'landmark' },

    { index: 20, name: 'Vacation',        subtitle: 'Free Pot',       kind: 'free_parking', icon: 'free_parking' },
    { index: 21, name: 'Cloud Nine',      kind: 'property',           groupIndex: 4, price: 220, icon: 'bridge' },
    { index: 22, name: 'Surprise',        kind: 'chance',             icon: 'chance_card' },
    { index: 23, name: 'Skyberry Hill',   kind: 'property',           groupIndex: 4, price: 220, icon: 'villa' },
    { index: 24, name: 'Breeze Terrace',  kind: 'property',           groupIndex: 4, price: 240, icon: 'tower' },
    { index: 25, name: 'Balloon Port',    kind: 'transport',          price: 200, icon: 'cable' },
    { index: 26, name: 'Plum Parade',     kind: 'property',           groupIndex: 5, price: 260, icon: 'arch' },
    { index: 27, name: 'Mochi Manor',     kind: 'property',           groupIndex: 5, price: 260, icon: 'villa' },
    { index: 28, name: 'Bubble Works',    kind: 'utility',            price: 150, icon: 'water' },
    { index: 29, name: 'Lavender Lane',   kind: 'property',           groupIndex: 5, price: 280, icon: 'lotus' },

    { index: 30, name: 'Womp Trap',       subtitle: 'Time Out',       kind: 'go_to_jail',   icon: 'go_to_jail' },
    { index: 31, name: 'Giggle Gardens',  kind: 'property',           groupIndex: 6, price: 300, icon: 'lotus' },
    { index: 32, name: 'Rainbow Ridge',   kind: 'property',           groupIndex: 6, price: 300, icon: 'landmark' },
    { index: 33, name: 'Treasure',        kind: 'chest',              icon: 'chest_vault' },
    { index: 34, name: 'Berry Heights',   kind: 'property',           groupIndex: 6, price: 320, icon: 'villa' },
    { index: 35, name: 'Star Shuttle',    kind: 'transport',          price: 200, icon: 'airport' },
    { index: 36, name: 'Surprise',        kind: 'chance',             icon: 'chance_card' },
    { index: 37, name: 'Mallow Palace',   kind: 'property',           groupIndex: 7, price: 350, icon: 'tower' },
    { index: 38, name: 'Treat Tax',       kind: 'tax',                taxAmount: 100, icon: 'tax_ledger' },
    { index: 39, name: 'Womp Wonderland', kind: 'property',           groupIndex: 7, price: 400, icon: 'temple' }
  ],
  hud: {
    chatTitle: 'Womp Chat',
    quickReactions: ['Womp!', 'Cute!', 'GG', 'Oops!'],
    unitLabel: 'Cottage',
    hotelLabel: 'Wonderland'
  }
};
