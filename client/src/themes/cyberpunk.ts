import type { ThemeConfig } from './types.js';

export const CYBERPUNK_THEME: ThemeConfig = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  tagline: 'Dark obsidian megacity with restrained cyan and magenta neon',
  currencySymbol: '₵',
  currencyName: 'Credits',
  palette: {
    bg: '#07070F',
    board: '#0D0D1A',
    boardSlab: '#04040A',
    boardInk: '#E8EAF6',
    tile: '#12121F',
    tileBorder: '#2A2A44',
    ink: '#E8EAF6',
    inkMuted: '#8A8FA8',
    accent: '#19F0FF',
    accent2: '#FF2BD6'
  },
  groupColors: [
    '#8A8FA8', // G1 Industrial Rust
    '#FF8A3D', // G2 Market Amber
    '#19F0FF', // G3 Data Cyan
    '#46E39A', // G4 Bio Mint
    '#B26BFF', // G5 Robotics Violet
    '#FF2BD6', // G6 Skyline Magenta
    '#F5E642', // G7 Quantum Gold
    '#FF3B3B'  // G8 Corporate Red
  ],
  fonts: {
    heading: "'Chakra Petch', sans-serif",
    body: "'Rajdhani', sans-serif",
    headingUppercase: true
  },
  radius: {
    tile: '0px',
    button: '0px'
  },
  chamfered: true,
  neonOutline: true,
  surfaceMaterial: 'obsidian',
  auctionTitle: 'Corporate territory bid',
  eventDeckNames: {
    chance: 'Black Market',
    chest: 'Corp Directive'
  },
  tokens: [
    { id: 'drone',      name: 'Drone',      frameColor: '#FF2BD6', initial: 'D' },
    { id: 'mech',       name: 'Mech Head',  frameColor: '#B26BFF', initial: 'M' },
    { id: 'hover_car',  name: 'Hover Car',  frameColor: '#19F0FF', initial: 'H' },
    { id: 'chip',       name: 'Neural Chip',frameColor: '#F5E642', initial: 'N' },
    { id: 'robot',      name: 'Cyber Unit', frameColor: '#46E39A', initial: 'C' },
    { id: 'holo_glyph', name: 'Holo-Glyph', frameColor: '#FF8A3D', initial: 'G' }
  ],
  movement: {
    id: 'hover',
    hopHeightPx: 9,
    minStepMs: 88,
    maxStepMs: 170,
    maxTotalDurationMs: 1260,
    directSlideMs: 340,
    squashStretch: {
      takeoff: [1.03, 0.98],
      apex: [0.98, 1.03],
      land: [1.05, 0.96]
    },
    landingEffect: 'glitch_flicker',
    trailStyle: 'neon',
    accentColor: '#19F0FF'
  },
  dice: {
    material: 'cyber_glass',
    faceBg: '#121426',
    faceBgAlt: '#090B17',
    faceBorder: '#19F0FF',
    pipColor: '#19F0FF',
    pipOneColor: '#FF2BD6',
    pipGlow: 'rgba(25, 240, 255, 0.72)',
    borderRadius: '4px',
    soundStyle: 'cyberpunk'
  },
  ownership: {
    claimStyle: 'neon_scan',
    hoverStyle: 'neon_outline'
  },
  sounds: {
    id: 'cyberpunk',
    clickFreq: 960,
    stepFreq: 540,
    buyChord: [196.0, 246.94, 293.66],
    goChime: [659.25, 880, 1318.51],
    waveform: 'sawtooth'
  },
  tiles: [
    { index: 0,  name: 'Uplink',             subtitle: 'Collect',               kind: 'go',           icon: 'go_arrow' },
    { index: 1,  name: 'Rust Alley',         kind: 'property',                  groupIndex: 0, price: 60,  icon: 'mill' },
    { index: 2,  name: 'Corp Directive',     kind: 'chest',                     icon: 'chest_vault' },
    { index: 3,  name: 'Scrap Yard',         kind: 'property',                  groupIndex: 0, price: 60,  icon: 'crate' },
    { index: 4,  name: 'Corporate Levy',     kind: 'tax',                       taxAmount: 200, icon: 'tax_ledger' },
    { index: 5,  name: 'Maglev Line',        kind: 'transport',                 price: 200, icon: 'maglev' },
    { index: 6,  name: 'Neon Bazaar',        kind: 'property',                  groupIndex: 1, price: 100, icon: 'arch' },
    { index: 7,  name: 'Market Signal',      subtitle: 'Black Market',          kind: 'chance', icon: 'chip' },
    { index: 8,  name: 'Noodle Row',         kind: 'property',                  groupIndex: 1, price: 100, icon: 'door' },
    { index: 9,  name: 'Chrome Market',      kind: 'property',                  groupIndex: 1, price: 120, icon: 'crate' },

    { index: 10, name: 'Quarantine',         subtitle: 'Just Visiting',         kind: 'jail',         icon: 'jail_bars' },
    { index: 11, name: 'Data Haven',         kind: 'property',                  groupIndex: 2, price: 140, icon: 'server' },
    { index: 12, name: 'Fusion Reactor',     kind: 'utility',                   price: 150, icon: 'reactor' },
    { index: 13, name: 'Server Farm',        kind: 'property',                  groupIndex: 2, price: 140, icon: 'server' },
    { index: 14, name: 'Relay Station',      kind: 'property',                  groupIndex: 2, price: 160, icon: 'chip' },
    { index: 15, name: 'Hyperloop Underground', kind: 'transport',             price: 200, icon: 'maglev' },
    { index: 16, name: 'Bio Lab',            kind: 'property',                  groupIndex: 3, price: 180, icon: 'bio' },
    { index: 17, name: 'Corp Directive',     kind: 'chest',                     icon: 'chest_vault' },
    { index: 18, name: 'Synth Labs',         kind: 'property',                  groupIndex: 3, price: 180, icon: 'bio' },
    { index: 19, name: 'Cyber Clinic',       kind: 'property',                  groupIndex: 3, price: 200, icon: 'bio' },

    { index: 20, name: 'Black Market',       subtitle: 'Safe Node',             kind: 'free_parking', icon: 'chip' },
    { index: 21, name: 'Robotics Works',     kind: 'property',                  groupIndex: 4, price: 220, icon: 'chip' },
    { index: 22, name: 'Market Signal',      subtitle: 'Black Market',          kind: 'chance', icon: 'chip' },
    { index: 23, name: 'Drone Foundry',      kind: 'property',                  groupIndex: 4, price: 220, icon: 'drone_pad' },
    { index: 24, name: 'Mech Hangar',        kind: 'property',                  groupIndex: 4, price: 240, icon: 'crate' },
    { index: 25, name: 'Sky Tram',           kind: 'transport',                 price: 200, icon: 'cable' },
    { index: 26, name: 'Skyline Residences', kind: 'property',                  groupIndex: 5, price: 260, icon: 'sky_tower' },
    { index: 27, name: 'Aero Heights',       kind: 'property',                  groupIndex: 5, price: 260, icon: 'sky_tower' },
    { index: 28, name: 'Data Grid',          kind: 'utility',                   price: 150, icon: 'server' },
    { index: 29, name: 'Orbital Lofts',      kind: 'property',                  groupIndex: 5, price: 280, icon: 'sky_tower' },

    { index: 30, name: 'System Lockdown',    subtitle: 'Quarantine',            kind: 'go_to_jail',   icon: 'lockdown' },
    { index: 31, name: 'Quantum Campus',     kind: 'property',                  groupIndex: 6, price: 300, icon: 'reactor' },
    { index: 32, name: 'Neural Institute',   kind: 'property',                  groupIndex: 6, price: 300, icon: 'chip' },
    { index: 33, name: 'Corp Directive',     kind: 'chest',                     icon: 'chest_vault' },
    { index: 34, name: 'AI Core',            kind: 'property',                  groupIndex: 6, price: 320, icon: 'server' },
    { index: 35, name: 'Cargo Drone Port',   kind: 'transport',                 price: 200, icon: 'drone_pad' },
    { index: 36, name: 'Market Signal',      subtitle: 'Black Market',          kind: 'chance', icon: 'chip' },
    { index: 37, name: 'Helix Tower',        kind: 'property',                  groupIndex: 7, price: 350, icon: 'sky_tower' },
    { index: 38, name: 'Security Fee',       kind: 'tax',                       taxAmount: 100, icon: 'tax_ledger' },
    { index: 39, name: 'Apex Corporate Plaza', kind: 'property',                groupIndex: 7, price: 400, icon: 'sky_tower' }
  ],
  hud: {
    chatTitle: 'NetLink Comms',
    quickReactions: ['GG', 'Preem', 'Nice', 'Nova'],
    unitLabel: 'Node',
    hotelLabel: 'Megatower'
  }
};
