import {
  GameState,
  Player,
  ChatMessage,
  GuestSession,
  createInitialGameState,
  DEFAULT_GAME_SETTINGS,
  GameSettings
} from '@tycoonvale/shared';
import { GameService } from './GameService.js';
import { persistenceService } from './PersistenceService.js';

export class RoomManager {
  private rooms: Map<string, GameState> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private socketToPlayerId: Map<string, string> = new Map();
  private turnIntervals: Map<string, NodeJS.Timeout> = new Map();

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public createRoom(hostSession: GuestSession, settings?: Partial<GameSettings>): GameState {
    let roomCode = this.generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = this.generateRoomCode();
    }

    const hostPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId: hostSession.sessionId,
      socketId: '',
      nickname: hostSession.nickname.trim() || 'TycoonHost',
      avatar: hostSession.avatar,
      token: hostSession.token,
      color: hostSession.color,
      position: 0,
      balance: settings?.startingBalance ?? DEFAULT_GAME_SETTINGS.startingBalance,
      netWorth: settings?.startingBalance ?? DEFAULT_GAME_SETTINGS.startingBalance,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: true,
      isReady: true,
      isDisconnected: false,
      properties: []
    };

    const gameState = createInitialGameState(roomCode, hostPlayer, settings);
    this.rooms.set(roomCode, gameState);
    persistenceService.saveGameSnapshot(gameState);
    return gameState;
  }

  public getRoom(roomCode: string): GameState | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public joinRoom(roomCode: string, session: GuestSession, socketId: string): { gameState: GameState; player: Player } {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error(`Room with code "${roomCode}" was not found.`);
    }

    // Check if player is already in the room with same session
    const existing = room.players.find(p => p.sessionId === session.sessionId);
    if (existing) {
      existing.socketId = socketId;
      existing.isDisconnected = false;
      this.socketToRoom.set(socketId, room.roomCode);
      this.socketToPlayerId.set(socketId, existing.id);
      return { gameState: room, player: existing };
    }

    if (room.phase !== 'LOBBY') {
      throw new Error('Game is already in progress.');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error(`Room is full (max ${room.settings.maxPlayers} players).`);
    }

    // Check nickname collision
    const nameTaken = room.players.some(p => p.nickname.toLowerCase() === session.nickname.toLowerCase().trim());
    const finalNickname = nameTaken ? `${session.nickname.trim()} (${room.players.length + 1})` : session.nickname.trim();

    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId: session.sessionId,
      socketId,
      nickname: finalNickname,
      avatar: session.avatar,
      token: session.token,
      color: session.color,
      position: 0,
      balance: room.settings.startingBalance,
      netWorth: room.settings.startingBalance,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isHost: false,
      isReady: false,
      isDisconnected: false,
      properties: []
    };

    room.players.push(newPlayer);
    this.socketToRoom.set(socketId, room.roomCode);
    this.socketToPlayerId.set(socketId, newPlayer.id);

    room.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      text: `👋 ${newPlayer.nickname} joined the lobby.`,
      type: 'system',
      playerId: newPlayer.id
    });
    room.revision += 1;

    persistenceService.saveGameSnapshot(room);
    return { gameState: room, player: newPlayer };
  }

  public setPlayerReady(roomCode: string, playerId: string, isReady: boolean): GameState {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found.');
    const player = room.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found.');

    player.isReady = isReady;
    room.revision += 1;
    return room;
  }

  public setPlayerTeam(roomCode: string, playerId: string, team: 'gold' | 'silver'): GameState {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found.');
    const player = room.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found.');

    player.team = team;
    room.revision += 1;
    return room;
  }

  public updateSettings(roomCode: string, hostPlayerId: string, newSettings: Partial<GameSettings>): GameState {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found.');
    if (room.hostId !== hostPlayerId) throw new Error('Only the host can modify game settings.');
    if (room.phase !== 'LOBBY') throw new Error('Settings cannot be changed once game has started.');

    room.settings = {
      ...room.settings,
      ...newSettings
    };

    // If starting balance was modified, update lobby players' balances
    if (newSettings.startingBalance) {
      for (const p of room.players) {
        p.balance = newSettings.startingBalance;
        p.netWorth = newSettings.startingBalance;
      }
    }

    room.revision += 1;
    persistenceService.saveGameSnapshot(room);
    return room;
  }

  public startGame(roomCode: string, hostPlayerId: string): GameState {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found.');

    if (room.hostId !== hostPlayerId) {
      throw new Error('Only the room host can start the game.');
    }

    if (room.players.length < 2) {
      throw new Error('At least 2 players are required to start a match.');
    }

    // Check all non-host players are ready
    const unreadyPlayers = room.players.filter(p => !p.isHost && !p.isReady);
    if (unreadyPlayers.length > 0) {
      throw new Error(`Waiting for players to ready up: ${unreadyPlayers.map(p => p.nickname).join(', ')}.`);
    }

    room.phase = 'PLAYING';
    room.turn.activePlayerId = room.players[0].id;
    room.turn.canRoll = true;
    room.turn.canEndTurn = false;
    room.turn.turnTimerSeconds = room.settings.turnTimeoutSeconds;

    room.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      text: `🚀 The game has officially begun! First turn: ${room.players[0].nickname}.`,
      type: 'system'
    });
    room.revision += 1;

    persistenceService.saveGameSnapshot(room);
    return room;
  }

  public addChatMessage(
    roomCode: string, 
    senderPlayerId: string, 
    text: string, 
    isReaction: boolean = false,
    isSystem: boolean = false
  ): ChatMessage {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found.');

    let msg: ChatMessage;

    if (isSystem || senderPlayerId === 'system') {
      msg = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: 'system',
        senderName: 'Game Master',
        senderAvatar: 'avatar-tycoon',
        senderColor: '#D4AF37',
        text: text.slice(0, 200),
        timestamp: Date.now(),
        isReaction: false,
        isSystem: true
      };
    } else {
      const player = room.players.find(p => p.id === senderPlayerId);
      if (!player) throw new Error('Sender player not found.');

      msg = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: player.id,
        senderName: player.nickname,
        senderAvatar: player.avatar,
        senderColor: player.color,
        text: text.slice(0, 200),
        timestamp: Date.now(),
        isReaction,
        isSystem: false
      };
    }

    room.chatMessages.push(msg);
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }
    room.revision += 1;
    return msg;
  }

  public handleDisconnect(socketId: string): { roomCode: string; player: Player } | null {
    const roomCode = this.socketToRoom.get(socketId);
    const playerId = this.socketToPlayerId.get(socketId);
    if (!roomCode || !playerId) return null;

    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    player.isDisconnected = true;
    room.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      text: `⚠️ ${player.nickname} disconnected. Session preserved for reconnect.`,
      type: 'system',
      playerId: player.id
    });
    room.revision += 1;

    this.socketToRoom.delete(socketId);
    this.socketToPlayerId.delete(socketId);

    return { roomCode, player };
  }

  public getRoomBySocket(socketId: string): GameState | undefined {
    const code = this.socketToRoom.get(socketId);
    return code ? this.getRoom(code) : undefined;
  }

  public getPlayerIdBySocket(socketId: string): string | undefined {
    return this.socketToPlayerId.get(socketId);
  }

  public async hydrateActiveRooms(): Promise<void> {
    const activeRooms = await persistenceService.getActiveRooms();
    for (const room of activeRooms) {
      // Mark all players disconnected so they can seamlessly rebind when reconnecting
      room.players.forEach(p => {
        p.isDisconnected = true;
        p.socketId = '';
      });
      this.rooms.set(room.roomCode, room);
    }
    if (activeRooms.length > 0) {
      console.log(`📦 Hydrated ${activeRooms.length} active room(s) from database into memory.`);
    }
  }
}

export const roomManager = new RoomManager();
