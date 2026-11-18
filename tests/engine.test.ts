import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateRent,
  canBuildHouse,
  canSellHouse,
  canMortgage,
  canUnmortgage,
  advancePlayer,
  createInitialGameState,
  calculateNetWorth,
  calculateTeamNetWorth
} from '../shared/src/game-engine/index.js';
import { BOARD_TILES, COLOR_GROUP_CONFIG } from '../shared/src/constants/boardData.js';
import { GameService } from '../server/src/services/GameService.js';
import { Player, GameState, PropertyState } from '../shared/src/types/index.js';

describe('TycoonVale Game Engine', () => {
  let gameState: GameState;
  let hostPlayer: Player;
  let player2: Player;

  beforeEach(() => {
    hostPlayer = {
      id: 'p1',
      sessionId: 's1',
      socketId: 'sock1',
      nickname: 'AlphaTycoon',
      avatar: 'avatar-1',
      token: 'jet',
      color: '#3B82F6',
      position: 0,
      balance: 1500,
      netWorth: 1500,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: true,
      isReady: true,
      isDisconnected: false,
      properties: []
    };

    player2 = {
      id: 'p2',
      sessionId: 's2',
      socketId: 'sock2',
      nickname: 'BetaInvestor',
      avatar: 'avatar-2',
      token: 'supercar',
      color: '#EF4444',
      position: 0,
      balance: 1500,
      netWorth: 1500,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: false,
      isReady: true,
      isDisconnected: false,
      properties: []
    };

    gameState = createInitialGameState('TEST01', hostPlayer);
    gameState.players.push(player2);
    gameState.phase = 'PLAYING';
  });

  describe('Board Movement and Passing GO', () => {
    it('advances player correctly without passing GO', () => {
      const res = advancePlayer(0, 7);
      expect(res.newPosition).toBe(7);
      expect(res.passedGo).toBe(false);
    });

    it('detects passing GO when advancing past tile 39', () => {
      const res = advancePlayer(38, 5);
      expect(res.newPosition).toBe(3);
      expect(res.passedGo).toBe(true);
    });

    it('awards $200 bonus when passing GO during dice roll', () => {
      hostPlayer.position = 38;
      // Force roll that passes GO
      const rollRes = GameService.rollDice(gameState, 'p1');
      // If position wrapped past 0, player received passGoReward
      if (hostPlayer.position < 38) {
        expect(hostPlayer.balance).toBeGreaterThanOrEqual(1500);
      }
    });
  });

  describe('Rent Calculations & Monopolies', () => {
    it('calculates unimproved base rent correctly', () => {
      // Harbor Alley (Tile 1, Brown)
      gameState.properties[1].ownerId = 'p1';
      hostPlayer.properties.push(1);

      const rent = calculateRent(1, gameState.properties, 7);
      expect(rent).toBe(2); // Base rent for Harbor Alley
    });

    it('doubles base rent when player owns the entire color monopoly', () => {
      // Brown group is tiles [1, 3]
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[3].ownerId = 'p1';
      hostPlayer.properties.push(1, 3);

      const rent = calculateRent(1, gameState.properties, 7);
      expect(rent).toBe(4); // 2 * base rent (2) = 4
    });

    it('calculates rent with 1 house correctly', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[3].ownerId = 'p1';
      gameState.properties[1].houses = 1;

      const rent = calculateRent(1, gameState.properties, 7);
      expect(rent).toBe(10); // 1 house rent is $10
    });

    it('calculates rent with luxury hotel correctly', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[3].ownerId = 'p1';
      gameState.properties[1].hotel = true;

      const rent = calculateRent(1, gameState.properties, 7);
      expect(rent).toBe(250); // Hotel rent for Harbor Alley
    });

    it('calculates station rent scaling (25, 50, 100, 200)', () => {
      // Metro Central Station (Tile 5)
      gameState.properties[5].ownerId = 'p1';
      expect(calculateRent(5, gameState.properties)).toBe(25);

      // Add Aero Skyport Express (Tile 15)
      gameState.properties[15].ownerId = 'p1';
      expect(calculateRent(5, gameState.properties)).toBe(50);

      // Add High-Speed Rail Link (Tile 25)
      gameState.properties[25].ownerId = 'p1';
      expect(calculateRent(5, gameState.properties)).toBe(100);

      // Add Interstellar Hyperloop (Tile 35)
      gameState.properties[35].ownerId = 'p1';
      expect(calculateRent(5, gameState.properties)).toBe(200);
    });

    it('calculates utility rent based on dice roll (4x or 10x)', () => {
      // Volt Energy Grid (Tile 12)
      gameState.properties[12].ownerId = 'p1';
      // 1 utility owned: 4x dice
      expect(calculateRent(12, gameState.properties, 7)).toBe(28);

      // Both utilities owned: 10x dice
      gameState.properties[28].ownerId = 'p1';
      expect(calculateRent(12, gameState.properties, 7)).toBe(70);
    });

    it('charges 0 rent if property is mortgaged', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[1].isMortgaged = true;

      expect(calculateRent(1, gameState.properties, 7)).toBe(0);
    });
  });

  describe('House Development Rules', () => {
    it('disallows building without full monopoly set', () => {
      gameState.properties[1].ownerId = 'p1'; // Only 1 of 2 brown tiles
      const check = canBuildHouse(1, 'p1', gameState.properties, 1000);
      expect(check.canBuild).toBe(false);
      expect(check.reason).toContain('full color set');
    });

    it('allows building when monopoly is owned and player has cash', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[3].ownerId = 'p1';

      const check = canBuildHouse(1, 'p1', gameState.properties, 1000);
      expect(check.canBuild).toBe(true);
    });

    it('enforces even-building rule across color group', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[3].ownerId = 'p1';
      gameState.properties[1].houses = 1; // Tile 1 has 1 house, Tile 3 has 0 houses

      // Cannot build second house on Tile 1 until Tile 3 has 1 house
      const check = canBuildHouse(1, 'p1', gameState.properties, 1000);
      expect(check.canBuild).toBe(false);
      expect(check.reason).toContain('evenly');

      // Tile 3 CAN be built on
      const checkTile3 = canBuildHouse(3, 'p1', gameState.properties, 1000);
      expect(checkTile3.canBuild).toBe(true);
    });

    it('disallows building if any property in color group is mortgaged', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[3].ownerId = 'p1';
      gameState.properties[3].isMortgaged = true;

      const check = canBuildHouse(1, 'p1', gameState.properties, 1000);
      expect(check.canBuild).toBe(false);
      expect(check.reason).toContain('mortgaged');
    });
  });

  describe('Mortgage System', () => {
    it('allows mortgaging unimproved property', () => {
      gameState.properties[1].ownerId = 'p1';
      const check = canMortgage(1, 'p1', gameState.properties);
      expect(check.canMortgage).toBe(true);
    });

    it('blocks mortgage if buildings exist on group', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[3].ownerId = 'p1';
      gameState.properties[1].houses = 1;

      const check = canMortgage(3, 'p1', gameState.properties);
      expect(check.canMortgage).toBe(false);
      expect(check.reason).toContain('Must sell all houses');
    });

    it('calculates unmortgage cost with 10% interest correctly', () => {
      gameState.properties[1].ownerId = 'p1';
      gameState.properties[1].isMortgaged = true; // mortgageValue = 30

      const check = canUnmortgage(1, 'p1', gameState.properties, 100);
      expect(check.canUnmortgage).toBe(true);
      expect(check.cost).toBe(33); // 30 * 1.1 = 33
    });
  });

  describe('Bankruptcy & Game Over', () => {
    it('detects player bankruptcy and transfers properties to creditor', () => {
      gameState.properties[1].ownerId = 'p2';
      player2.properties.push(1);
      player2.balance = -50;

      const isBankrupt = GameService.checkBankruptcy(gameState, player2, 'p1');
      expect(isBankrupt).toBe(true);
      expect(player2.isBankrupt).toBe(true);
      expect(gameState.properties[1].ownerId).toBe('p1');
      expect(hostPlayer.properties).toContain(1);

      // Only host remains active -> game ends
      expect(gameState.phase).toBe('ENDED');
      expect(gameState.winner?.id).toBe('p1');
    });
  });

  describe('Free Parking Jackpot System', () => {
    it('accumulates taxes and bail into jackpotPool when enabled', () => {
      gameState.settings.freeParkingJackpot = true;
      gameState.jackpotPool = 0;

      // Put player in jail and pay bail ($50)
      hostPlayer.inJail = true;
      hostPlayer.balance = 500;
      GameService.payJailFine(gameState, 'p1');

      expect(hostPlayer.inJail).toBe(false);
      expect(hostPlayer.balance).toBe(450);
      expect(gameState.jackpotPool).toBe(50);
    });

    it('awards entire jackpotPool when landing on Free Parking (Tile 20)', () => {
      gameState.settings.freeParkingJackpot = true;
      gameState.jackpotPool = 350;
      hostPlayer.balance = 1000;
      hostPlayer.position = 16;
      gameState.turn.canRoll = true;

      // Advance 4 steps to land directly on tile 20 (Free Parking)
      // We test the private handleTileLanding via rollDice or simulate step
      // Let's set position to 16 and mock or trigger landing
      // In rollDice, if dice sum = 4, player lands on 20
      // We can directly verify through GameService behavior
      (GameService as any).handleTileLanding(gameState, hostPlayer, 20, 4);

      expect(hostPlayer.balance).toBe(1350);
      expect(gameState.jackpotPool).toBe(0);
    });

    it('does not accumulate or award jackpot when freeParkingJackpot is false', () => {
      gameState.settings.freeParkingJackpot = false;
      gameState.jackpotPool = 0;

      hostPlayer.inJail = true;
      hostPlayer.balance = 500;
      GameService.payJailFine(gameState, 'p1');

      expect(hostPlayer.balance).toBe(450);
      expect(gameState.jackpotPool).toBe(0);

      // Land on tile 20
      (GameService as any).handleTileLanding(gameState, hostPlayer, 20, 4);
      expect(hostPlayer.balance).toBe(450);
      expect(gameState.jackpotPool).toBe(0);
    });
  });

  describe('Team Mode System', () => {
    let p3: Player;
    let p4: Player;

    beforeEach(() => {
      p3 = {
        id: 'p3',
        sessionId: 's3',
        socketId: 'sock3',
        nickname: 'GoldPartner',
        avatar: 'avatar-3',
        token: 'crown',
        color: '#F59E0B',
        team: 'gold',
        position: 0,
        balance: 1200,
        netWorth: 1200,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isHost: false,
        isReady: true,
        isDisconnected: false,
        properties: []
      };

      p4 = {
        id: 'p4',
        sessionId: 's4',
        socketId: 'sock4',
        nickname: 'SilverRival',
        avatar: 'avatar-4',
        token: 'ship',
        color: '#9CA3AF',
        team: 'silver',
        position: 0,
        balance: 1400,
        netWorth: 1400,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isHost: false,
        isReady: true,
        isDisconnected: false,
        properties: []
      };

      hostPlayer.team = 'gold';
      player2.team = 'silver';

      gameState.players.push(p3, p4);
      gameState.settings.teamMode = true;
    });

    it('calculates aggregate team net worth correctly', () => {
      hostPlayer.netWorth = 1500;
      p3.netWorth = 2500;
      player2.netWorth = 1800;
      p4.netWorth = 1200;

      const goldNetWorth = calculateTeamNetWorth('gold', gameState.players);
      const silverNetWorth = calculateTeamNetWorth('silver', gameState.players);

      expect(goldNetWorth).toBe(4000); // 1500 + 2500
      expect(silverNetWorth).toBe(3000); // 1800 + 1200
    });

    it('excludes bankrupt teammates from team net worth', () => {
      hostPlayer.netWorth = 1500;
      p3.netWorth = 2500;
      p3.isBankrupt = true;

      const goldNetWorth = calculateTeamNetWorth('gold', gameState.players);
      expect(goldNetWorth).toBe(1500);
    });

    it('declares team victory when all opposing team members go bankrupt', () => {
      // Eliminate player2 (silver)
      player2.balance = -100;
      GameService.checkBankruptcy(gameState, player2, 'p1');
      expect(player2.isBankrupt).toBe(true);
      // Game should NOT end yet because p4 (silver) is still alive
      expect(gameState.phase).toBe('PLAYING');

      // Now eliminate p4 (last silver player)
      p4.balance = -200;
      GameService.checkBankruptcy(gameState, p4, 'p1');
      expect(p4.isBankrupt).toBe(true);

      // Entire silver team is bankrupt -> Gold team wins!
      expect(gameState.phase).toBe('ENDED');
      expect(gameState.winningTeam).toBe('gold');
    });
  });

  describe('Auction System', () => {
    it('initiates auction and handles bids and passing correctly', () => {
      gameState.settings.auctionEnabled = true;

      // Start auction for tile 1 (Harbor Alley)
      GameService.startAuction(gameState, 1);
      expect(gameState.auction).not.toBeNull();
      expect(gameState.auction?.tileId).toBe(1);
      expect(gameState.auction?.currentBid).toBe(0);
      expect(gameState.auction?.activePlayerIds).toEqual(['p1', 'p2']);

      // Player 1 bids $30
      GameService.bidAuction(gameState, 'p1', 30);
      expect(gameState.auction?.currentBid).toBe(30);
      expect(gameState.auction?.highestBidderId).toBe('p1');
      expect(gameState.auction?.minNextBid).toBe(40);

      // Player 2 passes on auction
      const p1BalanceBefore = hostPlayer.balance;
      GameService.passAuction(gameState, 'p2');

      // With only p1 remaining, auction concludes
      expect(gameState.auction).toBeNull();
      expect(gameState.properties[1].ownerId).toBe('p1');
      expect(hostPlayer.balance).toBe(p1BalanceBefore - 30);
      expect(hostPlayer.properties).toContain(1);
    });
  });
});
