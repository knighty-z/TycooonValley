import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, GuestSession } from '@tycoonvale/shared';
import { roomManager } from '../services/RoomManager.js';
import { GameService } from '../services/GameService.js';
import { persistenceService } from '../services/PersistenceService.js';

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    // Room Creation
    socket.on(SOCKET_EVENTS.ROOM_CREATE, async (payload: { session: GuestSession; settings?: any }, callback) => {
      try {
        if (!payload.session || !payload.session.nickname) {
          return callback?.({ success: false, error: 'Valid player session required.' });
        }

        await persistenceService.saveUser(payload.session);
        const gameState = roomManager.createRoom(payload.session, payload.settings);
        const player = gameState.players[0];
        player.socketId = socket.id;

        socket.join(gameState.roomCode);
        // Map socket
        roomManager['socketToRoom'].set(socket.id, gameState.roomCode);
        roomManager['socketToPlayerId'].set(socket.id, player.id);

        callback?.({ success: true, gameState, player });
        io.to(gameState.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, gameState);
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Room Joining
    socket.on(SOCKET_EVENTS.ROOM_JOIN, async (payload: { roomCode: string; session: GuestSession }, callback) => {
      try {
        if (!payload.roomCode || !payload.session) {
          return callback?.({ success: false, error: 'Room code and session required.' });
        }

        await persistenceService.saveUser(payload.session);
        const { gameState, player } = roomManager.joinRoom(payload.roomCode, payload.session, socket.id);

        socket.join(gameState.roomCode);
        callback?.({ success: true, gameState, player });
        io.to(gameState.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, gameState);
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Session Reconnect
    socket.on(SOCKET_EVENTS.ROOM_RECONNECT, (payload: { roomCode: string; sessionId: string }, callback) => {
      try {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room) return callback?.({ success: false, error: 'Room does not exist.' });

        const player = room.players.find(p => p.sessionId === payload.sessionId);
        if (!player) return callback?.({ success: false, error: 'Player session not found in this room.' });

        player.socketId = socket.id;
        player.isDisconnected = false;
        socket.join(room.roomCode);
        roomManager['socketToRoom'].set(socket.id, room.roomCode);
        roomManager['socketToPlayerId'].set(socket.id, player.id);

        callback?.({ success: true, gameState: room, player });
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Ready Toggle
    socket.on(SOCKET_EVENTS.PLAYER_READY, (payload: { roomCode: string; isReady: boolean }, callback) => {
      try {
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!playerId) return;

        const updated = roomManager.setPlayerReady(payload.roomCode, playerId, payload.isReady);
        io.to(updated.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, updated);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Team Selection
    socket.on(SOCKET_EVENTS.PLAYER_SET_TEAM, (payload: { roomCode: string; team: 'gold' | 'silver' }, callback) => {
      try {
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!playerId) return;

        const updated = roomManager.setPlayerTeam(payload.roomCode, playerId, payload.team);
        io.to(updated.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, updated);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Host Settings Update
    socket.on(SOCKET_EVENTS.SETTINGS_UPDATE, (payload: { roomCode: string; settings: any }, callback) => {
      try {
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!playerId) throw new Error('Unauthorized');

        const updated = roomManager.updateSettings(payload.roomCode, playerId, payload.settings);
        io.to(updated.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, updated);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Game Start
    socket.on(SOCKET_EVENTS.GAME_START, (payload: { roomCode: string }, callback) => {
      try {
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!playerId) throw new Error('Unauthorized');

        const updated = roomManager.startGame(payload.roomCode, playerId);
        io.to(updated.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, updated);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Dice Roll
    socket.on(SOCKET_EVENTS.DICE_ROLL, (callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        const playerBefore = GameService.getPlayer(room, playerId);
        const oldPosition = playerBefore?.position ?? 0;

        const rollResult = GameService.rollDice(room, playerId);

        // Broadcast animated roll action to all players
        io.to(room.roomCode).emit(SOCKET_EVENTS.DICE_ROLLED_ANIMATION, {
          playerId,
          dice: rollResult.dice,
          isDouble: rollResult.isDouble,
          newPosition: rollResult.newPosition
        });

        // Broadcast step-by-step movement animation
        io.to(room.roomCode).emit(SOCKET_EVENTS.PLAYER_MOVED_ANIMATION, {
          playerId,
          fromPosition: oldPosition,
          toPosition: rollResult.newPosition,
          dice: rollResult.dice,
          passedGo: rollResult.passedGo
        });

        // Broadcast updated state
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true, ...rollResult });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Property Buy
    socket.on(SOCKET_EVENTS.PROPERTY_BUY, (payload: { tileId: number }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.buyProperty(room, playerId, payload.tileId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Property Decline
    socket.on(SOCKET_EVENTS.PROPERTY_DECLINE, (payload: { tileId: number }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.declineProperty(room, playerId, payload.tileId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // End Turn
    socket.on(SOCKET_EVENTS.TURN_END, (callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.endTurn(room, playerId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // House Building
    socket.on(SOCKET_EVENTS.BUILD_HOUSE, (payload: { tileId: number }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.buildHouse(room, playerId, payload.tileId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // House Selling
    socket.on(SOCKET_EVENTS.SELL_HOUSE, (payload: { tileId: number }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.sellHouse(room, playerId, payload.tileId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Mortgage Property
    socket.on(SOCKET_EVENTS.MORTGAGE_PROPERTY, (payload: { tileId: number }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.mortgageProperty(room, playerId, payload.tileId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Lift Mortgage
    socket.on(SOCKET_EVENTS.UNMORTGAGE_PROPERTY, (payload: { tileId: number }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.unmortgageProperty(room, playerId, payload.tileId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Jail Actions
    socket.on(SOCKET_EVENTS.PAY_JAIL_FINE, (callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.payJailFine(room, playerId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.USE_JAIL_CARD, (callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.useJailCard(room, playerId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Auction Actions
    socket.on(SOCKET_EVENTS.AUCTION_BID, (payload: { amount: number }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.bidAuction(room, playerId, payload.amount);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.AUCTION_PASS, (callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        GameService.passAuction(room, playerId);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Trade Actions
    socket.on(SOCKET_EVENTS.TRADE_PROPOSE, (payload: {
      targetId: string;
      offerCash: number;
      requestCash: number;
      offerPropertyIds: number[];
      requestPropertyIds: number[];
    }, callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        const initiator = GameService.getPlayer(room, playerId);
        const target = GameService.getPlayer(room, payload.targetId);
        if (!initiator || !target) throw new Error('Invalid players for trade.');

        if (initiator.balance < payload.offerCash || target.balance < payload.requestCash) {
          throw new Error('Insufficient cash for trade.');
        }

        const tradeOffer = {
          id: `trade-${Date.now()}`,
          initiatorId: playerId,
          targetId: payload.targetId,
          offerCash: payload.offerCash,
          requestCash: payload.requestCash,
          offerPropertyIds: payload.offerPropertyIds,
          requestPropertyIds: payload.requestPropertyIds,
          status: 'pending' as const,
          createdAt: Date.now()
        };

        room.activeTrade = tradeOffer;
        room.activityLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          text: `🤝 ${initiator.nickname} proposed a trade with ${target.nickname}.`,
          type: 'trade',
          playerId
        });
        room.revision += 1;

        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true, tradeOffer });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.TRADE_ACCEPT, (callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) throw new Error('Game or player not found.');

        const trade = room.activeTrade;
        if (!trade || trade.status !== 'pending' || trade.targetId !== playerId) {
          throw new Error('No pending trade to accept.');
        }

        const initiator = GameService.getPlayer(room, trade.initiatorId);
        const target = GameService.getPlayer(room, trade.targetId);
        if (!initiator || !target) throw new Error('Invalid players.');

        // Verify balances & property ownership
        if (initiator.balance < trade.offerCash || target.balance < trade.requestCash) {
          throw new Error('One of the parties has insufficient cash.');
        }

        // Transfer cash
        initiator.balance -= trade.offerCash;
        initiator.balance += trade.requestCash;
        target.balance -= trade.requestCash;
        target.balance += trade.offerCash;

        // Transfer initiator properties to target
        for (const tileId of trade.offerPropertyIds) {
          initiator.properties = initiator.properties.filter(id => id !== tileId);
          if (!target.properties.includes(tileId)) target.properties.push(tileId);
          if (room.properties[tileId]) room.properties[tileId].ownerId = target.id;
        }

        // Transfer target properties to initiator
        for (const tileId of trade.requestPropertyIds) {
          target.properties = target.properties.filter(id => id !== tileId);
          if (!initiator.properties.includes(tileId)) initiator.properties.push(tileId);
          if (room.properties[tileId]) room.properties[tileId].ownerId = initiator.id;
        }

        trade.status = 'accepted';
        room.activeTrade = null;
        room.activityLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          text: `🤝 Trade agreement completed between ${initiator.nickname} and ${target.nickname}!`,
          type: 'trade'
        });
        room.revision += 1;

        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    socket.on(SOCKET_EVENTS.TRADE_REJECT, (callback) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId) return;

        if (room.activeTrade && (room.activeTrade.targetId === playerId || room.activeTrade.initiatorId === playerId)) {
          room.activeTrade = null;
          room.activityLogs.unshift({
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            text: `🚫 Trade offer was declined.`,
            type: 'trade'
          });
          room.revision += 1;
          io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        }
        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Chat Message
    socket.on(SOCKET_EVENTS.CHAT_SEND, (payload: { text: string; isReaction?: boolean }, callback?: (res: any) => void) => {
      try {
        const room = roomManager.getRoomBySocket(socket.id);
        const playerId = roomManager.getPlayerIdBySocket(socket.id);
        if (!room || !playerId || !payload.text) {
          callback?.({ success: false, error: 'Invalid message or player' });
          return;
        }

        roomManager.addChatMessage(room.roomCode, playerId, payload.text, payload.isReaction);
        io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        callback?.({ success: true });
      } catch (err: any) {
        console.error('Chat error:', err);
        callback?.({ success: false, error: err.message });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const res = roomManager.handleDisconnect(socket.id);
      if (res) {
        const room = roomManager.getRoom(res.roomCode);
        if (room) {
          io.to(room.roomCode).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, room);
        }
      }
    });
  });
}
