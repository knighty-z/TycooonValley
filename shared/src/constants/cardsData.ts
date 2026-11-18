import { Card } from '../types/index.js';

export const FORTUNE_CARDS: Card[] = [
  {
    id: 'f1',
    deck: 'fortune',
    title: 'Venture Capital Dividend',
    description: 'A tech startup you seeded had a stellar IPO. Collect $200.',
    action: 'GIVE_MONEY',
    value: 200
  },
  {
    id: 'f2',
    deck: 'fortune',
    title: 'Federal Audit Penalty',
    description: 'Discrepancies found in offshore ledger. Pay $150 to the treasury.',
    action: 'TAKE_MONEY',
    value: 150
  },
  {
    id: 'f3',
    deck: 'fortune',
    title: 'High-Speed Express',
    description: 'Take the express train directly to Metro Central Station. If you pass GO, collect $200.',
    action: 'MOVE_TO',
    targetPosition: 5
  },
  {
    id: 'f4',
    deck: 'fortune',
    title: 'Insider Trading Indictment',
    description: 'Securities Commission subpoena. Go directly to Detention Center. Do not pass GO, do not collect $200.',
    action: 'GO_TO_JAIL'
  },
  {
    id: 'f5',
    deck: 'fortune',
    title: 'Executive Pardon Pass',
    description: 'This card grants unconditional release from Detention Center. Keep until needed.',
    action: 'GET_OUT_OF_JAIL'
  },
  {
    id: 'f6',
    deck: 'fortune',
    title: 'Prestige Gala Host',
    description: 'Host the annual Met Gala charity banquet. Pay each player $50 for their attendance.',
    action: 'PAY_EACH_PLAYER',
    value: 50
  },
  {
    id: 'f7',
    deck: 'fortune',
    title: 'Crypto Staking Yield',
    description: 'Yield farming protocol unlocked rewards. Collect $100.',
    action: 'GIVE_MONEY',
    value: 100
  },
  {
    id: 'f8',
    deck: 'fortune',
    title: 'Pinnacle Penthouse Advance',
    description: 'Charter helicopter to Diamond Pinnacle (Tile 39).',
    action: 'MOVE_TO',
    targetPosition: 39
  },
  {
    id: 'f9',
    deck: 'fortune',
    title: 'Infrastructure Maintenance',
    description: 'General repairs needed across all your developments: Pay $25 per house and $100 per hotel.',
    action: 'STREET_REPAIRS',
    houseCost: 25,
    hotelCost: 100
  },
  {
    id: 'f10',
    deck: 'fortune',
    title: 'Advance to GO',
    description: 'Advance directly to GO. Collect $200.',
    action: 'MOVE_TO',
    targetPosition: 0
  },
  {
    id: 'f11',
    deck: 'fortune',
    title: 'Speed Trap Violation',
    description: 'Caught test-driving your supercar above the limit. Pay $50.',
    action: 'TAKE_MONEY',
    value: 50
  },
  {
    id: 'f12',
    deck: 'fortune',
    title: 'Urban Redevelopment Grant',
    description: 'City awards you a heritage conservation subsidy. Collect $150.',
    action: 'GIVE_MONEY',
    value: 150
  }
];

export const OPPORTUNITY_CARDS: Card[] = [
  {
    id: 'o1',
    deck: 'opportunity',
    title: 'Consulting Retainer',
    description: 'Your strategic advisory services paid off. Collect $100 from every player.',
    action: 'RECEIVE_FROM_EACH_PLAYER',
    value: 50
  },
  {
    id: 'o2',
    deck: 'opportunity',
    title: 'Patent Royalty Surge',
    description: 'Renewable battery patent cleared worldwide. Collect $100.',
    action: 'GIVE_MONEY',
    value: 100
  },
  {
    id: 'o3',
    deck: 'opportunity',
    title: 'Detention Bail Bond',
    description: 'Judicial clearance card. Keep this to exit Detention Center free of charge.',
    action: 'GET_OUT_OF_JAIL'
  },
  {
    id: 'o4',
    deck: 'opportunity',
    title: 'Antitrust Legal Sanction',
    description: 'Regulatory injunction. Go directly to Detention Center. Do not pass GO, do not collect $200.',
    action: 'GO_TO_JAIL'
  },
  {
    id: 'o5',
    deck: 'opportunity',
    title: 'Hospital Philanthropy',
    description: 'Endow a new wing at St. Jude Pavilion. Pay $100.',
    action: 'TAKE_MONEY',
    value: 100
  },
  {
    id: 'o6',
    deck: 'opportunity',
    title: 'Inheritance Windfall',
    description: 'Distant baron bequeathed family estate trust. Collect $150.',
    action: 'GIVE_MONEY',
    value: 150
  },
  {
    id: 'o7',
    deck: 'opportunity',
    title: 'Advance to Harbor Alley',
    description: 'Inspect the shipping docks. Move to Harbor Alley (Tile 1).',
    action: 'MOVE_TO',
    targetPosition: 1
  },
  {
    id: 'o8',
    deck: 'opportunity',
    title: 'Commercial Renovation Assessment',
    description: 'Municipal zoning code upgrades: Pay $40 per house and $115 per hotel.',
    action: 'STREET_REPAIRS',
    houseCost: 40,
    hotelCost: 115
  },
  {
    id: 'o9',
    deck: 'opportunity',
    title: 'Art Auction Masterpiece',
    description: 'Sold a contemporary digital sculpture at Sotheby auction. Collect $50.',
    action: 'GIVE_MONEY',
    value: 50
  },
  {
    id: 'o10',
    deck: 'opportunity',
    title: 'Tax Refund Overpayment',
    description: 'Internal Revenue Service credit adjustment. Collect $20.',
    action: 'GIVE_MONEY',
    value: 20
  }
];
