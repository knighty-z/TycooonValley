import { BoardTile, BoardTheme } from '../types/index.js';

export const COLOR_GROUP_CONFIG = {
  brown: {
    name: 'Industrial Wharf',
    colorHex: '#8B5A2B',
    accentHex: '#D7A15C',
    houseCost: 50,
    tiles: [1, 3]
  },
  lightblue: {
    name: 'Bay Area',
    colorHex: '#0284C7',
    accentHex: '#38BDF8',
    houseCost: 50,
    tiles: [6, 8, 9]
  },
  pink: {
    name: 'Garden District',
    colorHex: '#DB2777',
    accentHex: '#F472B6',
    houseCost: 100,
    tiles: [11, 13, 14]
  },
  orange: {
    name: 'Civic Hub',
    colorHex: '#EA580C',
    accentHex: '#FB923C',
    houseCost: 100,
    tiles: [16, 18, 19]
  },
  red: {
    name: 'Cultural Quarter',
    colorHex: '#DC2626',
    accentHex: '#F87171',
    houseCost: 150,
    tiles: [21, 23, 24]
  },
  yellow: {
    name: 'Financial Core',
    colorHex: '#CA8A04',
    accentHex: '#FACC15',
    houseCost: 150,
    tiles: [26, 27, 29]
  },
  green: {
    name: 'Uptown Ridge',
    colorHex: '#16A34A',
    accentHex: '#4ADE80',
    houseCost: 200,
    tiles: [31, 32, 34]
  },
  darkblue: {
    name: 'Imperial Summit',
    colorHex: '#4338CA',
    accentHex: '#818CF8',
    houseCost: 200,
    tiles: [37, 39]
  },
  station: {
    name: 'Transit Network',
    colorHex: '#475569',
    accentHex: '#94A3B8',
    tiles: [5, 15, 25, 35]
  },
  utility: {
    name: 'Municipal Utilities',
    colorHex: '#0D9488',
    accentHex: '#2DD4BF',
    tiles: [12, 28]
  }
};

export const BOARD_TILES: BoardTile[] = [
  // Tile 0: Corner (Bottom-Right)
  {
    id: 0,
    name: 'GO: STARTING POINT',
    type: 'corner',
    cornerType: 'go',
    description: 'Collect $200 each time you pass or land on GO.'
  },
  // Tile 1: Brown 1
  {
    id: 1,
    name: 'Harbor Alley',
    type: 'property',
    group: 'brown',
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    houseCost: 50,
    mortgageValue: 30
  },
  // Tile 2: Card Opportunity
  {
    id: 2,
    name: 'Opportunity Vault',
    type: 'card',
    deckType: 'opportunity',
    description: 'Draw an Opportunity card to alter your destiny.'
  },
  // Tile 3: Brown 2
  {
    id: 3,
    name: 'Beacon Wharf',
    type: 'property',
    group: 'brown',
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    houseCost: 50,
    mortgageValue: 30
  },
  // Tile 4: City Tax
  {
    id: 4,
    name: 'Municipal Wealth Tax',
    type: 'tax',
    taxAmount: 200,
    description: 'Pay a flat wealth surcharge of $200 to the treasury.'
  },
  // Tile 5: Station 1
  {
    id: 5,
    name: 'Metro Central Station',
    type: 'station',
    group: 'station',
    price: 200,
    rent: [25, 50, 100, 200], // rent per 1, 2, 3, 4 stations owned
    mortgageValue: 100
  },
  // Tile 6: Light Blue 1
  {
    id: 6,
    name: 'Cobalt Terrace',
    type: 'property',
    group: 'lightblue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgageValue: 50
  },
  // Tile 7: Card Fortune
  {
    id: 7,
    name: 'Fortune Chest',
    type: 'card',
    deckType: 'fortune',
    description: 'Test your luck with a Fortune card.'
  },
  // Tile 8: Light Blue 2
  {
    id: 8,
    name: 'Azure Avenue',
    type: 'property',
    group: 'lightblue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgageValue: 50
  },
  // Tile 9: Light Blue 3
  {
    id: 9,
    name: 'Skyline Way',
    type: 'property',
    group: 'lightblue',
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgageValue: 60
  },
  // Tile 10: Corner (Bottom-Left)
  {
    id: 10,
    name: 'Detention Center',
    type: 'corner',
    cornerType: 'jail',
    description: 'Just Visiting or Serving Time.'
  },
  // Tile 11: Pink 1
  {
    id: 11,
    name: 'Orchid Boulevard',
    type: 'property',
    group: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgageValue: 70
  },
  // Tile 12: Utility 1
  {
    id: 12,
    name: 'Volt Energy Grid',
    type: 'utility',
    group: 'utility',
    price: 150,
    rent: [4, 10], // Multiplier: 4x dice if 1 owned, 10x if both
    mortgageValue: 75
  },
  // Tile 13: Pink 2
  {
    id: 13,
    name: 'Lotus Promenade',
    type: 'property',
    group: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgageValue: 70
  },
  // Tile 14: Pink 3
  {
    id: 14,
    name: 'Magnolia Plaza',
    type: 'property',
    group: 'pink',
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgageValue: 80
  },
  // Tile 15: Station 2
  {
    id: 15,
    name: 'Aero Skyport Express',
    type: 'station',
    group: 'station',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100
  },
  // Tile 16: Orange 1
  {
    id: 16,
    name: 'Amber Ridge',
    type: 'property',
    group: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgageValue: 90
  },
  // Tile 17: Card Opportunity
  {
    id: 17,
    name: 'Opportunity Vault',
    type: 'card',
    deckType: 'opportunity',
    description: 'Draw an Opportunity card to alter your destiny.'
  },
  // Tile 18: Orange 2
  {
    id: 18,
    name: 'Copper Square',
    type: 'property',
    group: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgageValue: 90
  },
  // Tile 19: Orange 3
  {
    id: 19,
    name: 'Sienna Heights',
    type: 'property',
    group: 'orange',
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgageValue: 100
  },
  // Tile 20: Corner (Top-Left)
  {
    id: 20,
    name: 'Grand Plaza Park',
    type: 'corner',
    cornerType: 'parking',
    description: 'Safe haven. Relax and take a breather.'
  },
  // Tile 21: Red 1
  {
    id: 21,
    name: 'Ruby Boulevard',
    type: 'property',
    group: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgageValue: 110
  },
  // Tile 22: Card Fortune
  {
    id: 22,
    name: 'Fortune Chest',
    type: 'card',
    deckType: 'fortune',
    description: 'Test your luck with a Fortune card.'
  },
  // Tile 23: Red 2
  {
    id: 23,
    name: 'Scarlet Row',
    type: 'property',
    group: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgageValue: 110
  },
  // Tile 24: Red 3
  {
    id: 24,
    name: 'Crimson Court',
    type: 'property',
    group: 'red',
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    houseCost: 150,
    mortgageValue: 120
  },
  // Tile 25: Station 3
  {
    id: 25,
    name: 'High-Speed Rail Link',
    type: 'station',
    group: 'station',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100
  },
  // Tile 26: Yellow 1
  {
    id: 26,
    name: 'Solaris Promenade',
    type: 'property',
    group: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 130
  },
  // Tile 27: Yellow 2
  {
    id: 27,
    name: 'Aureolin Way',
    type: 'property',
    group: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 130
  },
  // Tile 28: Utility 2
  {
    id: 28,
    name: 'Aqua Reservoir Works',
    type: 'utility',
    group: 'utility',
    price: 150,
    rent: [4, 10],
    mortgageValue: 75
  },
  // Tile 29: Yellow 3
  {
    id: 29,
    name: 'Gilded Parkway',
    type: 'property',
    group: 'yellow',
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    houseCost: 150,
    mortgageValue: 140
  },
  // Tile 30: Corner (Top-Right)
  {
    id: 30,
    name: 'Court Sanction',
    type: 'corner',
    cornerType: 'gotojail',
    description: 'Go directly to the Detention Center. Do not pass GO.'
  },
  // Tile 31: Green 1
  {
    id: 31,
    name: 'Emerald Crest',
    type: 'property',
    group: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgageValue: 150
  },
  // Tile 32: Green 2
  {
    id: 32,
    name: 'Jade Parkway',
    type: 'property',
    group: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgageValue: 150
  },
  // Tile 33: Card Opportunity
  {
    id: 33,
    name: 'Opportunity Vault',
    type: 'card',
    deckType: 'opportunity',
    description: 'Draw an Opportunity card to alter your destiny.'
  },
  // Tile 34: Green 3
  {
    id: 34,
    name: 'Verdant Summit',
    type: 'property',
    group: 'green',
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    houseCost: 200,
    mortgageValue: 160
  },
  // Tile 35: Station 4
  {
    id: 35,
    name: 'Interstellar Hyperloop',
    type: 'station',
    group: 'station',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100
  },
  // Tile 36: Card Fortune
  {
    id: 36,
    name: 'Fortune Chest',
    type: 'card',
    deckType: 'fortune',
    description: 'Test your luck with a Fortune card.'
  },
  // Tile 37: Dark Blue 1
  {
    id: 37,
    name: 'Obsidian Heights',
    type: 'property',
    group: 'darkblue',
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    houseCost: 200,
    mortgageValue: 175
  },
  // Tile 38: Luxury Tax
  {
    id: 38,
    name: 'Billionaire Luxury Duty',
    type: 'tax',
    taxAmount: 100,
    description: 'Pay luxury duty of $100.'
  },
  // Tile 39: Dark Blue 2
  {
    id: 39,
    name: 'Diamond Pinnacle',
    type: 'property',
    group: 'darkblue',
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    houseCost: 200,
    mortgageValue: 200
  }
];

export const PLAYER_COLORS = [
  '#00B4D8', // Electric Cerulean
  '#FF5E7E', // Coral Rose
  '#A855F7', // Royal Amethyst
  '#22C55E', // Emerald Mint
  '#F97316', // Vivid Tangerine
  '#EAB308', // Solar Gold
  '#EC4899', // Fuchsia Pulse
  '#14B8A6'  // Deep Lagoon
];

export const PLAYER_TOKENS = [
  { id: 'crown', name: 'Imperial Crown' },
  { id: 'rocket', name: 'Cosmic Rocket' },
  { id: 'cat', name: 'Sphinx Cat' },
  { id: 'diamond', name: 'Brilliant Diamond' },
  { id: 'train', name: 'Steam Locomotive' },
  { id: 'ship', name: 'Three-Masted Galleon' },
  { id: 'tophat', name: 'Classic Top Hat' },
  { id: 'dragon', name: 'Winged Dragon' },
  { id: 'car', name: 'Vintage Roadster' },
  { id: 'robot', name: 'Brass Automaton' },
  { id: 'chest', name: 'Treasure Chest' },
  { id: 'watch', name: 'Chronograph Pocketwatch' }
];

export const DEFAULT_GAME_SETTINGS = {
  maxPlayers: 6,
  startingBalance: 1500,
  passGoReward: 200,
  turnTimeoutSeconds: 45,
  auctionEnabled: true,
  tradingEnabled: true,
  mortgageEnabled: true,
  jailBailCost: 50,
  freeParkingJackpot: true,
  teamMode: false,
  theme: 'original' as BoardTheme
};
