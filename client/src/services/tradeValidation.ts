import {
  COLOR_GROUP_CONFIG,
  getTileById,
  type GameState,
  type Player,
  type PropertyState,
  type TradeOffer
} from '@tycoonvale/shared';

export interface TradeDraft {
  targetId: string;
  offerCash: number;
  requestCash: number;
  offerPropertyIds: number[];
  requestPropertyIds: number[];
}

export interface TradeValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Returns true if the property or any tile in its color group currently has houses or a hotel.
 * Standard Monopoly / TycoonVale rule: developed sets must have buildings sold before trading.
 */
export function hasBuildingsInColorGroup(
  tileId: number,
  properties: Record<number, PropertyState>
): boolean {
  const tile = getTileById(tileId);
  const prop = properties[tileId];
  if ((prop?.houses ?? 0) > 0 || prop?.hotel) return true;

  if (tile.type === 'property' && tile.group) {
    const groupTiles = COLOR_GROUP_CONFIG[tile.group]?.tiles ?? [];
    return groupTiles.some(id => {
      const p = properties[id];
      return (p?.houses ?? 0) > 0 || Boolean(p?.hotel);
    });
  }
  return false;
}

export function validateTradeDraft(
  draft: TradeDraft,
  initiator: Player | null,
  gameState: GameState | null,
  currencySymbol = '$'
): TradeValidationResult {
  const errors: string[] = [];
  if (!initiator || !gameState) {
    return { valid: false, errors: ['Game state unavailable.'] };
  }

  if (gameState.auction && !gameState.auction.isFinished) {
    errors.push('Trading is paused while an auction is active.');
  }

  if (initiator.isBankrupt) {
    errors.push('Bankrupt players cannot trade.');
  }

  const target = gameState.players.find(p => p.id === draft.targetId);
  if (!target || target.id === initiator.id) {
    errors.push('Select a valid trade partner.');
  } else if (target.isBankrupt) {
    errors.push(`${target.nickname} is bankrupt and cannot trade.`);
  }

  if (draft.offerCash < 0 || draft.requestCash < 0) {
    errors.push('Cash amounts cannot be negative.');
  }

  if (draft.offerCash > initiator.balance) {
    errors.push(`Offer exceeds your available cash (${currencySymbol}${initiator.balance}).`);
  }

  if (target && draft.requestCash > target.balance) {
    errors.push(`Request exceeds ${target.nickname}'s cash (${currencySymbol}${target.balance}).`);
  }

  for (const tid of draft.offerPropertyIds) {
    const p = gameState.properties[tid];
    if (p?.ownerId !== initiator.id) {
      errors.push('You can only offer properties you currently own.');
      break;
    }
    if (hasBuildingsInColorGroup(tid, gameState.properties)) {
      errors.push('Sell all buildings in a color set before trading its properties.');
      break;
    }
  }

  if (target) {
    for (const tid of draft.requestPropertyIds) {
      const p = gameState.properties[tid];
      if (p?.ownerId !== target.id) {
        errors.push(`${target.nickname} no longer owns one of the requested properties.`);
        break;
      }
      if (hasBuildingsInColorGroup(tid, gameState.properties)) {
        errors.push(`Cannot request properties in a set with buildings.`);
        break;
      }
    }
  }

  const isEmpty =
    draft.offerCash === 0 &&
    draft.requestCash === 0 &&
    draft.offerPropertyIds.length === 0 &&
    draft.requestPropertyIds.length === 0;

  if (isEmpty) {
    errors.push('Add at least one property or cash amount to propose a trade.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates whether a pending TradeOffer is still executable against live game state
 * (detects mid-flight cash drops, deed transfers, bankruptcy, or new houses).
 */
export function validatePendingTrade(
  trade: TradeOffer,
  gameState: GameState,
  currencySymbol = '$'
): TradeValidationResult {
  const initiator = gameState.players.find(p => p.id === trade.initiatorId) ?? null;
  if (!initiator) {
    return { valid: false, errors: ['Trade sender is no longer in the match.'] };
  }
  return validateTradeDraft(
    {
      targetId: trade.targetId,
      offerCash: trade.offerCash,
      requestCash: trade.requestCash,
      offerPropertyIds: trade.offerPropertyIds,
      requestPropertyIds: trade.requestPropertyIds
    },
    initiator,
    gameState,
    currencySymbol
  );
}
