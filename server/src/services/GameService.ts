import {
  GameState,
  Player,
  PropertyState,
  TradeOffer,
  AuctionState,
  ActivityLog,
  Card,
  BoardTile
} from '@tycoonvale/shared';
import {
  getTileById,
  calculateRent,
  canBuildHouse,
  canSellHouse,
  canMortgage,
  canUnmortgage,
  calculateNetWorth,
  advancePlayer,
  COLOR_GROUP_CONFIG,
  BOARD_TILES
} from '@tycoonvale/shared';
import { FORTUNE_CARDS, OPPORTUNITY_CARDS } from '@tycoonvale/shared';

export class GameService {
  private static addLog(gameState: GameState, text: string, type: ActivityLog['type'], playerId?: string, amount?: number) {
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      text,
      type,
      playerId,
      amount
    };
    gameState.activityLogs.unshift(log);
    if (gameState.activityLogs.length > 80) {
      gameState.activityLogs.pop();
    }
  }

  public static getPlayer(gameState: GameState, playerId: string): Player | undefined {
    return gameState.players.find(p => p.id === playerId);
  }

  public static checkBankruptcy(gameState: GameState, player: Player, creditorId?: string | null): boolean {
    if (player.balance < 0) {
      player.isBankrupt = true;
      this.addLog(gameState, `💀 ${player.nickname} has declared bankruptcy!`, 'bankrupt', player.id);

      // Surrender properties
      for (const tileId of player.properties) {
        const prop = gameState.properties[tileId];
        if (prop) {
          if (creditorId) {
            prop.ownerId = creditorId;
            const creditor = this.getPlayer(gameState, creditorId);
            if (creditor && !creditor.properties.includes(tileId)) {
              creditor.properties.push(tileId);
            }
          } else {
            prop.ownerId = null;
            prop.houses = 0;
            prop.hotel = false;
            prop.isMortgaged = false;
          }
        }
      }
      player.properties = [];

      // Check victory
      const activePlayers = gameState.players.filter(p => !p.isBankrupt);

      if (gameState.settings.teamMode) {
        const teamsRemaining = new Set(activePlayers.map(p => p.team || 'gold'));
        if (teamsRemaining.size === 1) {
          const winningTeam = Array.from(teamsRemaining)[0] as 'gold' | 'silver';
          gameState.phase = 'ENDED';
          gameState.winningTeam = winningTeam;
          gameState.winner = activePlayers[0] || null;
          this.addLog(gameState, `🏆 TEAM ${winningTeam.toUpperCase()} has achieved total economic victory!`, 'system');
          return true;
        }
      }

      if (activePlayers.length <= 1) {
        gameState.phase = 'ENDED';
        gameState.winner = activePlayers[0] || null;
        if (gameState.winner) {
          this.addLog(gameState, `🏆 ${gameState.winner.nickname} is the Tycoon Champion!`, 'system');
        }
      }
      return true;
    }
    return false;
  }

  public static rollDice(gameState: GameState, playerId: string): {
    dice: [number, number];
    isDouble: boolean;
    passedGo: boolean;
    newPosition: number;
    mustResolve: boolean;
  } {
    const player = this.getPlayer(gameState, playerId);
    if (!player || player.isBankrupt) {
      throw new Error('Invalid player or player is bankrupt.');
    }

    if (gameState.turn.activePlayerId !== playerId) {
      throw new Error("It's not your turn.");
    }

    if (!gameState.turn.canRoll) {
      throw new Error('Dice already rolled this turn.');
    }

    // Server-side random generation (1-6)
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const isDouble = die1 === die2;
    const diceSum = die1 + die2;

    gameState.turn.dice = [die1, die2];
    gameState.turn.rolledDouble = isDouble;
    player.lastRoll = [die1, die2];

    this.addLog(gameState, `🎲 ${player.nickname} rolled [${die1}] and [${die2}] (Total: ${diceSum})${isDouble ? ' — Doubles!' : ''}`, 'roll', player.id);

    // Jail handling
    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        this.addLog(gameState, `🔓 ${player.nickname} rolled doubles and broke out of Detention!`, 'jail', player.id);
        const moveRes = advancePlayer(player.position, diceSum);
        player.position = moveRes.newPosition;
        gameState.turn.canRoll = false;
        gameState.turn.canEndTurn = true;
        this.handleTileLanding(gameState, player, moveRes.newPosition, diceSum);
        return { dice: [die1, die2], isDouble, passedGo: moveRes.passedGo, newPosition: player.position, mustResolve: gameState.turn.mustResolveTile };
      } else {
        player.jailTurns += 1;
        if (player.jailTurns >= 3) {
          // Force bail
          const bail = gameState.settings.jailBailCost;
          player.balance -= bail;
          if (gameState.settings.freeParkingJackpot) {
            gameState.jackpotPool += bail;
          }
          player.inJail = false;
          player.jailTurns = 0;
          this.addLog(gameState, `⚖️ ${player.nickname} served 3 turns and paid $${bail} bail to leave Detention.`, 'jail', player.id, -bail);
          this.checkBankruptcy(gameState, player);
          const moveRes = advancePlayer(player.position, diceSum);
          player.position = moveRes.newPosition;
          gameState.turn.canRoll = false;
          gameState.turn.canEndTurn = true;
          this.handleTileLanding(gameState, player, moveRes.newPosition, diceSum);
          return { dice: [die1, die2], isDouble, passedGo: moveRes.passedGo, newPosition: player.position, mustResolve: gameState.turn.mustResolveTile };
        } else {
          this.addLog(gameState, `🔒 ${player.nickname} failed to roll doubles and remains in Detention (${player.jailTurns}/3 turns).`, 'jail', player.id);
          gameState.turn.canRoll = false;
          gameState.turn.canEndTurn = true;
          return { dice: [die1, die2], isDouble, passedGo: false, newPosition: player.position, mustResolve: false };
        }
      }
    }

    // Normal movement & doubles counter
    if (isDouble) {
      gameState.turn.consecutiveDoubles += 1;
      if (gameState.turn.consecutiveDoubles >= 3) {
        // 3 consecutive doubles -> Go to jail
        this.sendPlayerToJail(gameState, player, '3 consecutive doubles');
        gameState.turn.canRoll = false;
        gameState.turn.canEndTurn = true;
        return { dice: [die1, die2], isDouble: true, passedGo: false, newPosition: 10, mustResolve: false };
      }
    } else {
      gameState.turn.consecutiveDoubles = 0;
    }

    const { newPosition, passedGo } = advancePlayer(player.position, diceSum);
    player.position = newPosition;

    if (passedGo) {
      const reward = gameState.settings.passGoReward;
      player.balance += reward;
      this.addLog(gameState, `💰 ${player.nickname} passed GO and collected $${reward}!`, 'system', player.id, reward);
    }

    gameState.turn.canRoll = false;
    this.handleTileLanding(gameState, player, newPosition, diceSum);

    // Update net worth
    player.netWorth = calculateNetWorth(player, gameState.properties);
    gameState.revision += 1;

    return {
      dice: [die1, die2],
      isDouble,
      passedGo,
      newPosition,
      mustResolve: gameState.turn.mustResolveTile
    };
  }

  private static handleTileLanding(gameState: GameState, player: Player, tileId: number, diceSum: number) {
    const tile = getTileById(tileId);

    if (tile.type === 'corner') {
      if (tile.cornerType === 'gotojail') {
        this.sendPlayerToJail(gameState, player, 'Court Sanction');
        gameState.turn.canEndTurn = true;
      } else if (tile.cornerType === 'parking') {
        if (gameState.settings.freeParkingJackpot && gameState.jackpotPool > 0) {
          const pot = gameState.jackpotPool;
          player.balance += pot;
          gameState.jackpotPool = 0;
          this.addLog(gameState, `🎰 ${player.nickname} hit the Free Parking JACKPOT and collected $${pot}!`, 'system', player.id, pot);
        }
        gameState.turn.canEndTurn = true;
      } else {
        gameState.turn.canEndTurn = true;
      }
      return;
    }

    if (tile.type === 'tax') {
      const tax = tile.taxAmount ?? 100;
      player.balance -= tax;
      if (gameState.settings.freeParkingJackpot) {
        gameState.jackpotPool += tax;
      }
      this.addLog(gameState, `💸 ${player.nickname} landed on ${tile.name} and paid $${tax} in taxes.`, 'tax', player.id, -tax);
      this.checkBankruptcy(gameState, player);
      gameState.turn.canEndTurn = true;
      return;
    }

    if (tile.type === 'card') {
      this.drawCard(gameState, player, tile.deckType ?? 'fortune');
      gameState.turn.canEndTurn = true;
      return;
    }

    if (tile.type === 'property' || tile.type === 'station' || tile.type === 'utility') {
      const prop = gameState.properties[tileId];
      if (!prop || !prop.ownerId) {
        // Unowned property: player must decide to buy or auction
        gameState.turn.mustResolveTile = true;
        gameState.turn.pendingTileId = tileId;
        gameState.turn.canEndTurn = false;
        this.addLog(gameState, `🏷️ ${player.nickname} landed on unowned ${tile.name} ($${tile.price}). Buy or decline?`, 'system', player.id);
      } else if (prop.ownerId === player.id) {
        this.addLog(gameState, `🏡 ${player.nickname} landed on their own property ${tile.name}.`, 'system', player.id);
        gameState.turn.canEndTurn = true;
      } else {
        // Owned by another player: Rent is due!
        const owner = this.getPlayer(gameState, prop.ownerId);
        if (owner && !owner.isBankrupt && !prop.isMortgaged) {
          const rent = calculateRent(tileId, gameState.properties, diceSum);
          player.balance -= rent;
          owner.balance += rent;
          this.addLog(gameState, `💳 ${player.nickname} paid $${rent} rent to ${owner.nickname} for landing on ${tile.name}.`, 'rent', player.id, -rent);
          this.checkBankruptcy(gameState, player, owner.id);
          owner.netWorth = calculateNetWorth(owner, gameState.properties);
        } else if (prop.isMortgaged) {
          this.addLog(gameState, `🛡️ ${tile.name} is mortgaged. No rent owed.`, 'system', player.id);
        }
        gameState.turn.canEndTurn = true;
      }
    }
  }

  public static buyProperty(gameState: GameState, playerId: string, tileId: number): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player || player.isBankrupt) throw new Error('Invalid player.');

    if (gameState.turn.activePlayerId !== playerId) throw new Error("Not your turn.");
    if (!gameState.turn.mustResolveTile || gameState.turn.pendingTileId !== tileId) {
      throw new Error('Not currently resolving purchase of this property.');
    }

    const tile = getTileById(tileId);
    const prop = gameState.properties[tileId];

    if (!tile.price || !prop || prop.ownerId !== null) {
      throw new Error('Property is not available for purchase.');
    }

    if (player.balance < tile.price) {
      throw new Error(`Insufficient funds. Price is $${tile.price}, balance is $${player.balance}.`);
    }

    player.balance -= tile.price;
    prop.ownerId = player.id;
    if (!player.properties.includes(tileId)) {
      player.properties.push(tileId);
    }

    this.addLog(gameState, `🏢 ${player.nickname} purchased ${tile.name} for $${tile.price}!`, 'buy', player.id, -tile.price);

    gameState.turn.mustResolveTile = false;
    gameState.turn.pendingTileId = undefined;
    gameState.turn.canEndTurn = true;
    player.netWorth = calculateNetWorth(player, gameState.properties);
    gameState.revision += 1;
  }

  public static declineProperty(gameState: GameState, playerId: string, tileId: number): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player) throw new Error('Invalid player.');
    if (gameState.turn.activePlayerId !== playerId) throw new Error("Not your turn.");

    gameState.turn.mustResolveTile = false;
    gameState.turn.pendingTileId = undefined;
    gameState.turn.canEndTurn = true;

    this.addLog(gameState, `🚫 ${player.nickname} passed on buying ${getTileById(tileId).name}.`, 'system', player.id);

    if (gameState.settings.auctionEnabled) {
      this.startAuction(gameState, tileId);
    }
    gameState.revision += 1;
  }

  public static startAuction(gameState: GameState, tileId: number): void {
    const tile = getTileById(tileId);
    const activePlayers = gameState.players.filter(p => !p.isBankrupt).map(p => p.id);

    const startBid = 10;
    gameState.auction = {
      tileId,
      currentBid: 0,
      highestBidderId: null,
      activePlayerIds: activePlayers,
      timerSeconds: 20,
      isFinished: false,
      minNextBid: startBid
    };

    this.addLog(gameState, `📢 Auction started for ${tile.name}! Minimum starting bid: $${startBid}.`, 'auction');
    gameState.revision += 1;
  }

  public static bidAuction(gameState: GameState, playerId: string, bidAmount: number): void {
    const auction = gameState.auction;
    if (!auction || auction.isFinished) throw new Error('No active auction.');

    const player = this.getPlayer(gameState, playerId);
    if (!player || player.isBankrupt) throw new Error('Invalid player.');

    if (bidAmount < auction.minNextBid) {
      throw new Error(`Bid must be at least $${auction.minNextBid}.`);
    }

    if (player.balance < bidAmount) {
      throw new Error('Insufficient balance to place this bid.');
    }

    auction.currentBid = bidAmount;
    auction.highestBidderId = playerId;
    auction.minNextBid = bidAmount + 10;
    auction.timerSeconds = Math.max(auction.timerSeconds, 8); // Anti-snipe time boost

    this.addLog(gameState, `🔨 ${player.nickname} bid $${bidAmount} on ${getTileById(auction.tileId).name}.`, 'auction', player.id);
    gameState.revision += 1;
  }

  public static passAuction(gameState: GameState, playerId: string): void {
    const auction = gameState.auction;
    if (!auction || auction.isFinished) return;

    auction.activePlayerIds = auction.activePlayerIds.filter(id => id !== playerId);
    const player = this.getPlayer(gameState, playerId);
    if (player) {
      this.addLog(gameState, `👋 ${player.nickname} withdrew from the auction.`, 'auction', player.id);
    }

    if (auction.activePlayerIds.length === 1 && auction.highestBidderId) {
      this.finishAuction(gameState);
    } else if (auction.activePlayerIds.length === 0) {
      this.finishAuction(gameState);
    }
    gameState.revision += 1;
  }

  public static finishAuction(gameState: GameState): void {
    const auction = gameState.auction;
    if (!auction || auction.isFinished) return;

    auction.isFinished = true;
    const tile = getTileById(auction.tileId);
    const prop = gameState.properties[auction.tileId];

    if (auction.highestBidderId && auction.currentBid > 0 && prop) {
      const winner = this.getPlayer(gameState, auction.highestBidderId);
      if (winner && winner.balance >= auction.currentBid) {
        winner.balance -= auction.currentBid;
        prop.ownerId = winner.id;
        if (!winner.properties.includes(auction.tileId)) {
          winner.properties.push(auction.tileId);
        }
        this.addLog(gameState, `🏆 ${winner.nickname} won the auction for ${tile.name} at $${auction.currentBid}!`, 'auction', winner.id, -auction.currentBid);
        winner.netWorth = calculateNetWorth(winner, gameState.properties);
      }
    } else {
      this.addLog(gameState, `❌ Auction ended with no winning bids. ${tile.name} remains with the Bank.`, 'auction');
    }

    gameState.auction = null;
    gameState.revision += 1;
  }

  public static buildHouse(gameState: GameState, playerId: string, tileId: number): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player || player.isBankrupt) throw new Error('Invalid player.');

    const check = canBuildHouse(tileId, playerId, gameState.properties, player.balance);
    if (!check.canBuild) {
      throw new Error(check.reason || 'Cannot build here.');
    }

    const tile = getTileById(tileId);
    const prop = gameState.properties[tileId];
    const cost = tile.houseCost ?? 50;

    player.balance -= cost;
    if (prop.houses < 4) {
      prop.houses += 1;
      this.addLog(gameState, `🏗️ ${player.nickname} built a house on ${tile.name} ($${cost}). Total houses: ${prop.houses}.`, 'house', player.id, -cost);
    } else {
      prop.houses = 0;
      prop.hotel = true;
      this.addLog(gameState, `🏨 ${player.nickname} built a LUXURY HOTEL on ${tile.name} ($${cost})!`, 'house', player.id, -cost);
    }

    player.netWorth = calculateNetWorth(player, gameState.properties);
    gameState.revision += 1;
  }

  public static sellHouse(gameState: GameState, playerId: string, tileId: number): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player || player.isBankrupt) throw new Error('Invalid player.');

    const check = canSellHouse(tileId, playerId, gameState.properties);
    if (!check.canSell) throw new Error(check.reason || 'Cannot sell house.');

    const tile = getTileById(tileId);
    const prop = gameState.properties[tileId];
    const refund = Math.floor((tile.houseCost ?? 50) / 2);

    player.balance += refund;
    if (prop.hotel) {
      prop.hotel = false;
      prop.houses = 4;
      this.addLog(gameState, `🏚️ ${player.nickname} downgraded hotel to 4 houses on ${tile.name} (refund: +$${refund}).`, 'house', player.id, refund);
    } else {
      prop.houses -= 1;
      this.addLog(gameState, `🏚️ ${player.nickname} sold a house on ${tile.name} (refund: +$${refund}). Houses left: ${prop.houses}.`, 'house', player.id, refund);
    }

    player.netWorth = calculateNetWorth(player, gameState.properties);
    gameState.revision += 1;
  }

  public static mortgageProperty(gameState: GameState, playerId: string, tileId: number): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player || player.isBankrupt) throw new Error('Invalid player.');

    const check = canMortgage(tileId, playerId, gameState.properties);
    if (!check.canMortgage) throw new Error(check.reason || 'Cannot mortgage.');

    const tile = getTileById(tileId);
    const prop = gameState.properties[tileId];
    const mortgageVal = tile.mortgageValue ?? Math.floor((tile.price ?? 100) / 2);

    prop.isMortgaged = true;
    player.balance += mortgageVal;
    this.addLog(gameState, `📜 ${player.nickname} mortgaged ${tile.name} for +$${mortgageVal}.`, 'mortgage', player.id, mortgageVal);

    player.netWorth = calculateNetWorth(player, gameState.properties);
    gameState.revision += 1;
  }

  public static unmortgageProperty(gameState: GameState, playerId: string, tileId: number): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player || player.isBankrupt) throw new Error('Invalid player.');

    const check = canUnmortgage(tileId, playerId, gameState.properties, player.balance);
    if (!check.canUnmortgage) throw new Error(check.reason || 'Cannot unmortgage.');

    const tile = getTileById(tileId);
    const prop = gameState.properties[tileId];

    player.balance -= check.cost;
    prop.isMortgaged = false;
    this.addLog(gameState, `✨ ${player.nickname} lifted mortgage on ${tile.name} (-$${check.cost}).`, 'mortgage', player.id, -check.cost);

    player.netWorth = calculateNetWorth(player, gameState.properties);
    gameState.revision += 1;
  }

  public static payJailFine(gameState: GameState, playerId: string): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player || !player.inJail) throw new Error('Player is not in jail.');

    const bail = gameState.settings.jailBailCost;
    if (player.balance < bail) throw new Error('Insufficient balance to pay bail.');

    player.balance -= bail;
    if (gameState.settings.freeParkingJackpot) {
      gameState.jackpotPool += bail;
    }
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(gameState, `⚖️ ${player.nickname} paid $${bail} bail and walked out of Detention!`, 'jail', player.id, -bail);
    gameState.revision += 1;
  }

  public static useJailCard(gameState: GameState, playerId: string): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player || !player.inJail) throw new Error('Player is not in jail.');
    if (player.getOutOfJailCards <= 0) throw new Error('No pardon pass available.');

    player.getOutOfJailCards -= 1;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(gameState, `🎫 ${player.nickname} used an Executive Pardon Pass and left Detention!`, 'jail', player.id);
    gameState.revision += 1;
  }

  public static endTurn(gameState: GameState, playerId: string): void {
    const player = this.getPlayer(gameState, playerId);
    if (!player) throw new Error('Invalid player.');
    if (gameState.turn.activePlayerId !== playerId) throw new Error("Not your turn to end.");

    if (gameState.turn.mustResolveTile) {
      throw new Error('You must buy or decline the property first.');
    }

    if (gameState.turn.canRoll && !player.inJail) {
      throw new Error('You must roll the dice before ending turn.');
    }

    // Check double roll extra turn
    if (gameState.turn.rolledDouble && !player.inJail && !player.isBankrupt && gameState.turn.consecutiveDoubles < 3) {
      gameState.turn.canRoll = true;
      gameState.turn.canEndTurn = false;
      gameState.turn.rolledDouble = false;
      this.addLog(gameState, `🔁 ${player.nickname} rolled doubles and gets an extra roll!`, 'roll', player.id);
      gameState.revision += 1;
      return;
    }

    // Switch to next non-bankrupt player
    const activePlayers = gameState.players.filter(p => !p.isBankrupt);
    if (activePlayers.length <= 1) {
      gameState.phase = 'ENDED';
      gameState.winner = activePlayers[0] || null;
      return;
    }

    let currentIndex = gameState.players.findIndex(p => p.id === playerId);
    let nextIndex = (currentIndex + 1) % gameState.players.length;

    while (gameState.players[nextIndex].isBankrupt) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
    }

    const nextPlayer = gameState.players[nextIndex];
    gameState.turn.activePlayerId = nextPlayer.id;
    gameState.turn.turnIndex += 1;
    gameState.turn.canRoll = true;
    gameState.turn.canEndTurn = false;
    gameState.turn.rolledDouble = false;
    gameState.turn.consecutiveDoubles = 0;
    gameState.turn.mustResolveTile = false;
    gameState.turn.pendingTileId = undefined;
    gameState.turn.turnTimerSeconds = gameState.settings.turnTimeoutSeconds;

    this.addLog(gameState, `👉 It is now ${nextPlayer.nickname}'s turn.`, 'system', nextPlayer.id);
    gameState.revision += 1;
  }

  private static sendPlayerToJail(gameState: GameState, player: Player, reason: string) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    this.addLog(gameState, `🚨 ${player.nickname} was sent to Detention Center (${reason})!`, 'jail', player.id);
  }

  private static drawCard(gameState: GameState, player: Player, deck: 'fortune' | 'opportunity') {
    const deckCards = deck === 'fortune' ? FORTUNE_CARDS : OPPORTUNITY_CARDS;
    const card = deckCards[Math.floor(Math.random() * deckCards.length)];

    gameState.lastCardDrawn = card;
    gameState.cardDrawPlayerId = player.id;
    this.addLog(gameState, `🎴 ${player.nickname} drew ${card.deck === 'fortune' ? 'Fortune' : 'Opportunity'}: "${card.title}"`, 'card', player.id);

    switch (card.action) {
      case 'GIVE_MONEY':
        player.balance += (card.value ?? 100);
        this.addLog(gameState, `💵 ${card.description} (+${card.value})`, 'card', player.id, card.value);
        break;
      case 'TAKE_MONEY': {
        const deduction = card.value ?? 50;
        player.balance -= deduction;
        if (gameState.settings.freeParkingJackpot) {
          gameState.jackpotPool += deduction;
        }
        this.addLog(gameState, `💸 ${card.description} (-${deduction})`, 'card', player.id, -deduction);
        this.checkBankruptcy(gameState, player);
        break;
      }
      case 'MOVE_TO':
        if (card.targetPosition !== undefined) {
          const passedGo = card.targetPosition < player.position && card.targetPosition !== 0;
          player.position = card.targetPosition;
          if (passedGo) {
            player.balance += gameState.settings.passGoReward;
          }
          this.handleTileLanding(gameState, player, player.position, 7);
        }
        break;
      case 'GO_TO_JAIL':
        this.sendPlayerToJail(gameState, player, card.title);
        break;
      case 'GET_OUT_OF_JAIL':
        player.getOutOfJailCards += 1;
        this.addLog(gameState, `🎫 ${player.nickname} acquired an Executive Pardon Pass!`, 'card', player.id);
        break;
      case 'PAY_EACH_PLAYER':
        const payAmount = card.value ?? 50;
        const otherPlayers = gameState.players.filter(p => p.id !== player.id && !p.isBankrupt);
        for (const other of otherPlayers) {
          player.balance -= payAmount;
          other.balance += payAmount;
        }
        this.checkBankruptcy(gameState, player);
        break;
      case 'RECEIVE_FROM_EACH_PLAYER':
        const recvAmount = card.value ?? 50;
        const debtors = gameState.players.filter(p => p.id !== player.id && !p.isBankrupt);
        for (const debtor of debtors) {
          debtor.balance -= recvAmount;
          player.balance += recvAmount;
          this.checkBankruptcy(gameState, debtor, player.id);
        }
        break;
      case 'STREET_REPAIRS':
        let repairBill = 0;
        for (const tId of player.properties) {
          const p = gameState.properties[tId];
          if (p) {
            if (p.hotel) repairBill += (card.hotelCost ?? 100);
            else repairBill += p.houses * (card.houseCost ?? 25);
          }
        }
        if (repairBill > 0) {
          player.balance -= repairBill;
          this.addLog(gameState, `🛠️ Municipal repairs cost ${player.nickname} $${repairBill}.`, 'card', player.id, -repairBill);
          this.checkBankruptcy(gameState, player);
        }
        break;
    }

    player.netWorth = calculateNetWorth(player, gameState.properties);
  }
}
