import type { ThemeConfig } from './types.js';

/**
 * World 2: VALORANT Tactical (Original fan-made aesthetic).
 * Uses zero official Riot/VALORANT logos, fonts, or copied artwork.
 */
export const VALORANT_THEME: ThemeConfig = {
  id: 'valorant',
  name: 'Valorant Tactical',
  tagline: 'Angular tactical sites, slate charcoal and crimson steel',
  currencySymbol: '¤',
  currencyName: 'Creds',
  palette: {
    bg: '#0F1923',
    board: '#16232F',
    boardSlab: '#091017',
    boardInk: '#ECE8E1',
    tile: '#1C2B38',
    tileBorder: '#3A4B5A',
    ink: '#ECE8E1',
    inkMuted: '#9AA8B5',
    accent: '#FF4655',
    accent2: '#3DD2C3'
  },
  groupColors: [
    '#3DB8A8', // G1 Pearl
    '#E2703A', // G2 Sunset
    '#C2447A', // G3 Lotus
    '#7FC4E8', // G4 Icebox
    '#C9453B', // G5 Split
    '#D9A441', // G6 Bind
    '#8E6BD1', // G7 Haven
    '#4FA36B'  // G8 Ascent
  ],
  fonts: {
    heading: "'Oswald', sans-serif",
    body: "'Rajdhani', sans-serif",
    headingUppercase: true
  },
  radius: {
    tile: '0px',
    button: '0px'
  },
  chamfered: true,
  neonOutline: false,
  surfaceMaterial: 'tactical',
  auctionTitle: 'Contest for site control',
  eventDeckNames: {
    chance: 'Tactical Intel',
    chest: 'Team Fund'
  },
  tokens: [
    { id: 'jett',    name: 'Jett',    frameColor: '#7FC4E8', imageSrc: '/tokens/valorant/jet.png',     initial: 'J' },
    { id: 'clove',   name: 'Clove',   frameColor: '#C2447A', imageSrc: '/tokens/valorant/clove.png',   initial: 'C' },
    { id: 'sage',    name: 'Sage',    frameColor: '#3DD2C3', imageSrc: '/tokens/valorant/sage.png',    initial: 'S' },
    { id: 'raze',    name: 'Raze',    frameColor: '#E2703A', imageSrc: '/tokens/valorant/raze.png',    initial: 'R' },
    { id: 'chamber', name: 'Chamber', frameColor: '#D9A441', imageSrc: '/tokens/valorant/chamber.png', initial: 'H' },
    { id: 'reyna',   name: 'Reyna',   frameColor: '#8E6BD1', imageSrc: '/tokens/valorant/miks.png',    initial: 'M' }
  ],
  movement: {
    id: 'tactical',
    hopHeightPx: 13,
    minStepMs: 85,
    maxStepMs: 165,
    maxTotalDurationMs: 1220,
    directSlideMs: 360,
    squashStretch: {
      takeoff: [1.1, 0.88],
      apex: [0.92, 1.12],
      land: [1.12, 0.86]
    },
    landingEffect: 'red_pulse',
    trailStyle: 'none',
    accentColor: '#FF4655'
  },
  dice: {
    material: 'steel',
    faceBg: '#1C2936',
    faceBgAlt: '#111A24',
    faceBorder: '#4A5F72',
    pipColor: '#FF4655',
    pipOneColor: '#FF6B78',
    pipGlow: 'rgba(255, 70, 85, 0.55)',
    borderRadius: '3px',
    soundStyle: 'valorant'
  },
  ownership: {
    claimStyle: 'crimson_stamp',
    hoverStyle: 'crimson_edge'
  },
  sounds: {
    id: 'valorant',
    clickFreq: 840,
    stepFreq: 460,
    buyChord: [220, 277.18, 329.63],
    goChime: [783.99, 1046.5],
    waveform: 'triangle'
  },
  tiles: [
    { index: 0,  name: 'Round Start',      subtitle: 'Collect Creds', kind: 'go',           icon: 'go_arrow' },
    { index: 1,  name: 'Pearl A Site',     kind: 'property',          groupIndex: 0, price: 60,  icon: 'site_marker' },
    { index: 2,  name: 'Team Fund',        kind: 'chest',             icon: 'chest_vault' },
    { index: 3,  name: 'Pearl B Site',     kind: 'property',          groupIndex: 0, price: 60,  icon: 'site_marker' },
    { index: 4,  name: 'Eco Round Tax',    kind: 'tax',               taxAmount: 200, icon: 'tax_ledger' },
    { index: 5,  name: 'Vandal Armory',    kind: 'transport',         price: 200, icon: 'armory' },
    { index: 6,  name: 'Sunset A Site',    kind: 'property',          groupIndex: 1, price: 100, icon: 'site_marker' },
    { index: 7,  name: 'Tactical Intel',   kind: 'chance',            icon: 'crosshair' },
    { index: 8,  name: 'Sunset Mid',       kind: 'property',          groupIndex: 1, price: 100, icon: 'crosshair' },
    { index: 9,  name: 'Sunset B Site',    kind: 'property',          groupIndex: 1, price: 120, icon: 'site_marker' },

    { index: 10, name: 'Spectating',       subtitle: 'Just Visiting', kind: 'jail',         icon: 'jail_bars' },
    { index: 11, name: 'Lotus A Site',     kind: 'property',          groupIndex: 2, price: 140, icon: 'door' },
    { index: 12, name: 'Credit Vault',     kind: 'utility',           price: 150, icon: 'crate' },
    { index: 13, name: 'Lotus B Site',     kind: 'property',          groupIndex: 2, price: 140, icon: 'site_marker' },
    { index: 14, name: 'Lotus C Site',     kind: 'property',          groupIndex: 2, price: 160, icon: 'door' },
    { index: 15, name: 'Phantom Armory',   kind: 'transport',         price: 200, icon: 'armory' },
    { index: 16, name: 'Icebox Belt',      kind: 'property',          groupIndex: 3, price: 180, icon: 'ramp' },
    { index: 17, name: 'Team Fund',        kind: 'chest',             icon: 'chest_vault' },
    { index: 18, name: 'Icebox Tube',      kind: 'property',          groupIndex: 3, price: 180, icon: 'crate' },
    { index: 19, name: 'Icebox Kitchen',   kind: 'property',          groupIndex: 3, price: 200, icon: 'door' },

    { index: 20, name: 'Safe Site',        subtitle: 'Jackpot',       kind: 'free_parking', icon: 'spike' },
    { index: 21, name: 'Split Ramps',      kind: 'property',          groupIndex: 4, price: 220, icon: 'ramp' },
    { index: 22, name: 'Tactical Intel',   kind: 'chance',            icon: 'crosshair' },
    { index: 23, name: 'Split Mid',        kind: 'property',          groupIndex: 4, price: 220, icon: 'crosshair' },
    { index: 24, name: 'Split Heaven',     kind: 'property',          groupIndex: 4, price: 240, icon: 'ramp' },
    { index: 25, name: 'Operator Armory',  kind: 'transport',         price: 200, icon: 'armory' },
    { index: 26, name: 'Bind Hookah',      kind: 'property',          groupIndex: 5, price: 260, icon: 'crate' },
    { index: 27, name: 'Bind Showers',     kind: 'property',          groupIndex: 5, price: 260, icon: 'door' },
    { index: 28, name: 'Radianite Forge',  kind: 'utility',           price: 150, icon: 'spike' },
    { index: 29, name: 'Bind Teleporter',  kind: 'property',          groupIndex: 5, price: 280, icon: 'door' },

    { index: 30, name: 'Eliminated',       subtitle: 'Spectate',      kind: 'go_to_jail',   icon: 'go_to_jail' },
    { index: 31, name: 'Haven A Long',     kind: 'property',          groupIndex: 6, price: 300, icon: 'crosshair' },
    { index: 32, name: 'Haven Garage',     kind: 'property',          groupIndex: 6, price: 300, icon: 'door' },
    { index: 33, name: 'Team Fund',        kind: 'chest',             icon: 'chest_vault' },
    { index: 34, name: 'Haven C Long',     kind: 'property',          groupIndex: 6, price: 320, icon: 'site_marker' },
    { index: 35, name: 'Sheriff Armory',   kind: 'transport',         price: 200, icon: 'armory' },
    { index: 36, name: 'Tactical Intel',   kind: 'chance',            icon: 'crosshair' },
    { index: 37, name: 'Ascent A Site',    kind: 'property',          groupIndex: 7, price: 350, icon: 'site_marker' },
    { index: 38, name: 'Force Buy Tax',    kind: 'tax',               taxAmount: 100, icon: 'tax_ledger' },
    { index: 39, name: 'Ascent B Site',    kind: 'property',          groupIndex: 7, price: 400, icon: 'spike' }
  ],
  hud: {
    chatTitle: 'Team Comms',
    quickReactions: ['GG', 'NT', 'Clutch', 'Eco Diff'],
    unitLabel: 'Turret',
    hotelLabel: 'Citadel'
  }
};
