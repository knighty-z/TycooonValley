export type ColorGroup = 
  | 'brown' 
  | 'lightblue' 
  | 'pink' 
  | 'orange' 
  | 'red' 
  | 'yellow' 
  | 'green' 
  | 'darkblue' 
  | 'station' 
  | 'utility';

export type BoardTheme = 'classic' | 'luxury' | 'neon' | 'forest';

export type TileType = 
  | 'property' 
  | 'station' 
  | 'utility' 
  | 'tax' 
  | 'card' 
  | 'corner';

export type CornerType = 'go' | 'jail' | 'parking' | 'gotojail';

export type CardDeckType = 'fortune' | 'opportunity';

export interface BoardTile {
  id: number; // 0 to 39
  name: string;
  type: TileType;
  group?: ColorGroup;
  cornerType?: CornerType;
  deckType?: CardDeckType;
  price?: number;
  rent?: number[]; // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  houseCost?: number;
  mortgageValue?: number;
  taxAmount?: number;
  description?: string;
  icon?: string;
}

export interface PropertyState {
  tileId: number;
  ownerId: string | null;
  houses: number; // 0 to 4
  hotel: boolean;
  isMortgaged: boolean;
}

export interface PlayerToken {
  id: string;
  name: string;
  svgPath?: string;
  icon?: string;
}

export interface Player {
  id: string;
  sessionId: string;
  socketId: string;
  nickname: string;
  avatar: string;
  token: string;
  color: string;
  team?: 'gold' | 'silver';
  position: number; // 0 to 39
  balance: number;
  netWorth: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  isBankrupt: boolean;
  isHost: boolean;
  isReady: boolean;
  isDisconnected: boolean;
  properties: number[]; // tileIds owned
  lastRoll?: [number, number];
}

export type CardActionType = 
  | 'GIVE_MONEY' 
  | 'TAKE_MONEY' 
  | 'MOVE_TO' 
  | 'MOVE_STEPS' 
  | 'GO_TO_JAIL' 
  | 'GET_OUT_OF_JAIL' 
  | 'PAY_EACH_PLAYER' 
  | 'RECEIVE_FROM_EACH_PLAYER'
  | 'STREET_REPAIRS';

export interface Card {
  id: string;
  deck: CardDeckType;
  title: string;
  description: string;
  action: CardActionType;
  value?: number;
  targetPosition?: number;
  houseCost?: number;
  hotelCost?: number;
}

export interface TradeOffer {
  id: string;
  initiatorId: string;
  targetId: string;
  offerCash: number;
  requestCash: number;
  offerPropertyIds: number[];
  requestPropertyIds: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: number;
}

export interface AuctionState {
  tileId: number;
  currentBid: number;
  highestBidderId: string | null;
  activePlayerIds: string[];
  timerSeconds: number;
  isFinished: boolean;
  minNextBid: number;
}

export type GamePhase = 'LOBBY' | 'PLAYING' | 'ENDED';

export type RollState = 
  | 'CAN_ROLL' 
  | 'ROLLING' 
  | 'MOVING' 
  | 'TILE_ACTION' 
  | 'TURN_ACTIONS' 
  | 'AUCTION' 
  | 'TRADE';

export interface TurnState {
  activePlayerId: string;
  turnIndex: number;
  rollState: RollState;
  consecutiveDoubles: number;
  rolledDouble: boolean;
  dice: [number, number];
  canEndTurn: boolean;
  canRoll: boolean;
  mustResolveTile: boolean;
  pendingTileId?: number;
  turnTimerSeconds: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  text: string;
  type: 
    | 'roll' 
    | 'move' 
    | 'buy' 
    | 'rent' 
    | 'tax' 
    | 'card' 
    | 'jail' 
    | 'trade' 
    | 'auction' 
    | 'house' 
    | 'mortgage' 
    | 'bankrupt' 
    | 'chat' 
    | 'system';
  playerId?: string;
  amount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text: string;
  timestamp: number;
  isReaction?: boolean;
  isSystem?: boolean;
}

export interface GameSettings {
  maxPlayers: number;
  startingBalance: number;
  passGoReward: number;
  turnTimeoutSeconds: number;
  auctionEnabled: boolean;
  tradingEnabled: boolean;
  mortgageEnabled: boolean;
  jailBailCost: number;
  freeParkingJackpot: boolean;
  teamMode: boolean;
  theme: BoardTheme;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  hostId: string;
  players: Player[];
  properties: Record<number, PropertyState>;
  turn: TurnState;
  auction: AuctionState | null;
  activeTrade: TradeOffer | null;
  activityLogs: ActivityLog[];
  chatMessages: ChatMessage[];
  settings: GameSettings;
  jackpotPool: number;
  winner: Player | null;
  winningTeam?: 'gold' | 'silver' | null;
  lastCardDrawn?: Card | null;
  cardDrawPlayerId?: string | null;
  revision: number;
}

// Socket Event Names
export const SOCKET_EVENTS = {
  // Connection / Room
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_RECONNECT: 'room:reconnect',
  PLAYER_READY: 'player:ready',
  PLAYER_SET_TEAM: 'player:set_team',
  SETTINGS_UPDATE: 'room:settings_update',
  GAME_START: 'game:start',
  
  // Game Actions
  DICE_ROLL: 'game:roll',
  PROPERTY_BUY: 'game:buy_property',
  PROPERTY_DECLINE: 'game:decline_property',
  TURN_END: 'game:end_turn',
  BUILD_HOUSE: 'game:build_house',
  SELL_HOUSE: 'game:sell_house',
  MORTGAGE_PROPERTY: 'game:mortgage_property',
  UNMORTGAGE_PROPERTY: 'game:unmortgage_property',
  PAY_JAIL_FINE: 'game:pay_jail_fine',
  USE_JAIL_CARD: 'game:use_jail_card',
  
  // Auction
  AUCTION_START: 'auction:start',
  AUCTION_BID: 'auction:bid',
  AUCTION_PASS: 'auction:pass',
  
  // Trade
  TRADE_PROPOSE: 'trade:propose',
  TRADE_ACCEPT: 'trade:accept',
  TRADE_REJECT: 'trade:reject',
  TRADE_CANCEL: 'trade:cancel',

  // Chat
  CHAT_SEND: 'chat:send',

  // Server to Client Broadcasts
  GAME_STATE_UPDATE: 'game:state_update',
  DICE_ROLLED_ANIMATION: 'game:dice_rolled_animation',
  PLAYER_MOVED_ANIMATION: 'game:player_moved_animation',
  CARD_DRAWN_ANIMATION: 'game:card_drawn_animation',
  NOTIFICATION: 'game:notification',
  ERROR: 'game:error',
  GAME_OVER: 'game:over'
} as const;

export interface GuestSession {
  sessionId: string;
  nickname: string;
  avatar: string;
  token: string;
  color: string;
}
