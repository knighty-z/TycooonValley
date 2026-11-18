import { 
  BoardTile, 
  ColorGroup, 
  GameState, 
  Player, 
  PropertyState, 
  GameSettings,
  Card 
} from '../types/index.js';
import { BOARD_TILES, COLOR_GROUP_CONFIG, DEFAULT_GAME_SETTINGS } from '../constants/boardData.js';
import { FORTUNE_CARDS, OPPORTUNITY_CARDS } from '../constants/cardsData.js';

export function getTileById(id: number): BoardTile {
  const tile = BOARD_TILES.find(t => t.id === id);
  if (!tile) {
    throw new Error(`Tile with id ${id} not found.`);
  }
  return tile;
}

export function isMonopolyOwned(
  group: ColorGroup, 
  ownerId: string, 
  properties: Record<number, PropertyState>
): boolean {
  const config = COLOR_GROUP_CONFIG[group];
  if (!config) return false;
  return config.tiles.every(tileId => properties[tileId]?.ownerId === ownerId);
}

export function calculateRent(
  tileId: number, 
  properties: Record<number, PropertyState>, 
  diceSum: number = 7
): number {
  const tile = getTileById(tileId);
  const prop = properties[tileId];

  if (!prop || !prop.ownerId || prop.isMortgaged) {
    return 0;
  }

  if (tile.type === 'property' && tile.group && tile.rent) {
    // Hotel
    if (prop.hotel) {
      return tile.rent[5] ?? tile.rent[tile.rent.length - 1];
    }
    // Houses
    if (prop.houses > 0) {
      return tile.rent[prop.houses] ?? tile.rent[0];
    }
    // Base rent - double if full group owned and no houses on any
    const ownsMonopoly = isMonopolyOwned(tile.group, prop.ownerId, properties);
    const baseRent = tile.rent[0] ?? 0;
    return ownsMonopoly ? baseRent * 2 : baseRent;
  }

  if (tile.type === 'station') {
    const stationConfig = COLOR_GROUP_CONFIG.station;
    const stationsOwned = stationConfig.tiles.filter(
      id => properties[id]?.ownerId === prop.ownerId && !properties[id]?.isMortgaged
    ).length;

    const stationRents = [0, 25, 50, 100, 200];
    return stationRents[stationsOwned] ?? 25;
  }

  if (tile.type === 'utility') {
    const utilityConfig = COLOR_GROUP_CONFIG.utility;
    const utilitiesOwned = utilityConfig.tiles.filter(
      id => properties[id]?.ownerId === prop.ownerId && !properties[id]?.isMortgaged
    ).length;

    const multiplier = utilitiesOwned >= 2 ? 10 : 4;
    return diceSum * multiplier;
  }

  return 0;
}

export function canBuildHouse(
  tileId: number, 
  ownerId: string, 
  properties: Record<number, PropertyState>, 
  balance: number
): { canBuild: boolean; reason?: string } {
  const tile = getTileById(tileId);
  const prop = properties[tileId];

  if (!tile || tile.type !== 'property' || !tile.group) {
    return { canBuild: false, reason: 'Tile is not a buildable property.' };
  }

  if (!prop || prop.ownerId !== ownerId) {
    return { canBuild: false, reason: 'You do not own this property.' };
  }

  if (prop.isMortgaged) {
    return { canBuild: false, reason: 'Cannot build on a mortgaged property.' };
  }

  if (!isMonopolyOwned(tile.group, ownerId, properties)) {
    return { canBuild: false, reason: 'Must own the full color set to build.' };
  }

  // Any mortgaged property in color group blocks building
  const groupTiles = COLOR_GROUP_CONFIG[tile.group].tiles;
  const anyMortgaged = groupTiles.some(id => properties[id]?.isMortgaged);
  if (anyMortgaged) {
    return { canBuild: false, reason: 'Cannot build while any property in the group is mortgaged.' };
  }

  if (prop.hotel) {
    return { canBuild: false, reason: 'Property already has a hotel.' };
  }

  const cost = tile.houseCost ?? 50;
  if (balance < cost) {
    return { canBuild: false, reason: `Insufficient funds. House costs $${cost}.` };
  }

  // Even-building rule: this property cannot have more houses than the min houses in the group
  const houseCounts = groupTiles.map(id => {
    const p = properties[id];
    return p?.hotel ? 5 : (p?.houses ?? 0);
  });
  const minHouses = Math.min(...houseCounts);
  const currentLevel = prop.hotel ? 5 : prop.houses;

  if (currentLevel > minHouses) {
    return { canBuild: false, reason: 'Must build evenly across the color group.' };
  }

  return { canBuild: true };
}

export function canSellHouse(
  tileId: number, 
  ownerId: string, 
  properties: Record<number, PropertyState>
): { canSell: boolean; reason?: string } {
  const tile = getTileById(tileId);
  const prop = properties[tileId];

  if (!tile || tile.type !== 'property' || !tile.group) {
    return { canSell: false, reason: 'Tile is not a developable property.' };
  }

  if (!prop || prop.ownerId !== ownerId) {
    return { canSell: false, reason: 'You do not own this property.' };
  }

  const currentLevel = prop.hotel ? 5 : prop.houses;
  if (currentLevel <= 0) {
    return { canSell: false, reason: 'No developments to sell on this property.' };
  }

  const groupTiles = COLOR_GROUP_CONFIG[tile.group].tiles;
  const houseCounts = groupTiles.map(id => {
    const p = properties[id];
    return p?.hotel ? 5 : (p?.houses ?? 0);
  });
  const maxHouses = Math.max(...houseCounts);

  if (currentLevel < maxHouses) {
    return { canSell: false, reason: 'Must sell developments evenly across the color group.' };
  }

  return { canSell: true };
}

export function canMortgage(
  tileId: number, 
  ownerId: string, 
  properties: Record<number, PropertyState>
): { canMortgage: boolean; reason?: string } {
  const tile = getTileById(tileId);
  const prop = properties[tileId];

  if (!prop || prop.ownerId !== ownerId) {
    return { canMortgage: false, reason: 'You do not own this property.' };
  }

  if (prop.isMortgaged) {
    return { canMortgage: false, reason: 'Property is already mortgaged.' };
  }

  // Check if any property in its group has houses
  if (tile.group && tile.type === 'property') {
    const groupTiles = COLOR_GROUP_CONFIG[tile.group].tiles;
    const hasBuildings = groupTiles.some(id => {
      const p = properties[id];
      return (p?.houses ?? 0) > 0 || p?.hotel;
    });
    if (hasBuildings) {
      return { canMortgage: false, reason: 'Must sell all houses in group before mortgaging.' };
    }
  }

  return { canMortgage: true };
}

export function canUnmortgage(
  tileId: number, 
  ownerId: string, 
  properties: Record<number, PropertyState>, 
  balance: number
): { canUnmortgage: boolean; cost: number; reason?: string } {
  const tile = getTileById(tileId);
  const prop = properties[tileId];

  if (!prop || prop.ownerId !== ownerId) {
    return { canUnmortgage: false, cost: 0, reason: 'You do not own this property.' };
  }

  if (!prop.isMortgaged) {
    return { canUnmortgage: false, cost: 0, reason: 'Property is not mortgaged.' };
  }

  const mortgageVal = tile.mortgageValue ?? Math.floor((tile.price ?? 100) / 2);
  const unmortgageCost = Math.round(mortgageVal * 1.1); // 10% interest

  if (balance < unmortgageCost) {
    return { 
      canUnmortgage: false, 
      cost: unmortgageCost, 
      reason: `Insufficient funds. Unmortgaging costs $${unmortgageCost}.` 
    };
  }

  return { canUnmortgage: true, cost: unmortgageCost };
}

export function calculateNetWorth(
  player: Player, 
  properties: Record<number, PropertyState>
): number {
  let netWorth = player.balance;

  for (const tileId of player.properties) {
    const tile = getTileById(tileId);
    const prop = properties[tileId];
    if (!tile || !prop) continue;

    if (prop.isMortgaged) {
      netWorth += (tile.mortgageValue ?? Math.floor((tile.price ?? 100) / 2));
    } else {
      netWorth += (tile.price ?? 0);
      if (tile.houseCost) {
        if (prop.hotel) {
          netWorth += 5 * tile.houseCost;
        } else {
          netWorth += prop.houses * tile.houseCost;
        }
      }
    }
  }

  return Math.max(0, netWorth);
}

export function advancePlayer(
  currentPos: number, 
  steps: number
): { newPosition: number; passedGo: boolean } {
  const target = currentPos + steps;
  const newPosition = target % 40;
  const passedGo = target >= 40 && newPosition !== 0; // If lands directly on 0, passedGo or landed on GO
  return {
    newPosition,
    passedGo: target >= 40
  };
}

export function createInitialProperties(): Record<number, PropertyState> {
  const props: Record<number, PropertyState> = {};
  for (const tile of BOARD_TILES) {
    if (tile.type === 'property' || tile.type === 'station' || tile.type === 'utility') {
      props[tile.id] = {
        tileId: tile.id,
        ownerId: null,
        houses: 0,
        hotel: false,
        isMortgaged: false
      };
    }
  }
  return props;
}

export function calculateTeamNetWorth(
  team: 'gold' | 'silver',
  players: Player[]
): number {
  return players
    .filter(p => p.team === team && !p.isBankrupt)
    .reduce((sum, p) => sum + p.netWorth, 0);
}

export function createInitialGameState(
  roomCode: string, 
  hostPlayer: Player, 
  settings: Partial<GameSettings> = {}
): GameState {
  const mergedSettings: GameSettings = {
    ...DEFAULT_GAME_SETTINGS,
    ...settings
  };

  return {
    roomCode,
    phase: 'LOBBY',
    hostId: hostPlayer.id,
    players: [hostPlayer],
    properties: createInitialProperties(),
    turn: {
      activePlayerId: hostPlayer.id,
      turnIndex: 0,
      rollState: 'CAN_ROLL',
      consecutiveDoubles: 0,
      rolledDouble: false,
      dice: [1, 1],
      canEndTurn: false,
      canRoll: true,
      mustResolveTile: false,
      turnTimerSeconds: mergedSettings.turnTimeoutSeconds
    },
    auction: null,
    activeTrade: null,
    activityLogs: [
      {
        id: 'log-init',
        timestamp: Date.now(),
        text: `Room ${roomCode} created by ${hostPlayer.nickname}. Waiting for players.`,
        type: 'system'
      }
    ],
    chatMessages: [],
    settings: mergedSettings,
    jackpotPool: 0,
    winner: null,
    winningTeam: null,
    lastCardDrawn: null,
    cardDrawPlayerId: null,
    revision: 1
  };
}
