import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User, IUser } from '../models/User.js';
import { GameSession } from '../models/GameSession.js';
import { Statistics } from '../models/Statistics.js';
import { GameState } from '@tycoonvale/shared';

class PersistenceService {
  private isConnected: boolean = false;
  private memorySessions: Map<string, any> = new Map();
  private memoryUsers: Map<string, any> = new Map();
  private memoryStats: Map<string, any> = new Map();

  public async connect(): Promise<void> {
    if (!config.mongoUri) {
      console.log('ℹ️ MONGODB_URI not set. Operating in high-speed In-Memory persistence mode.');
      return;
    }

    try {
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      this.isConnected = true;
      console.log('✅ Connected to MongoDB Atlas successfully.');
    } catch (err: any) {
      console.warn('⚠️ MongoDB connection error. Gracefully falling back to In-Memory mode:', err.message);
      this.isConnected = false;
    }
  }

  public async saveUser(user: { sessionId: string; nickname: string; avatar: string; token: string; color: string }): Promise<void> {
    if (this.isConnected) {
      try {
        await User.findOneAndUpdate(
          { sessionId: user.sessionId },
          { ...user, lastActiveAt: new Date() },
          { upsert: true, new: true }
        );
        return;
      } catch (e) {
        console.error('Failed to persist user in DB:', e);
      }
    }
    this.memoryUsers.set(user.sessionId, { ...user, lastActiveAt: new Date() });
  }

  public async saveGameSnapshot(gameState: GameState): Promise<void> {
    const sessionData = {
      roomCode: gameState.roomCode,
      hostId: gameState.hostId,
      players: gameState.players,
      winner: gameState.winner,
      durationSeconds: 0,
      snapshot: gameState,
      endedAt: gameState.phase === 'ENDED' ? new Date() : undefined
    };

    if (this.isConnected) {
      try {
        await GameSession.findOneAndUpdate(
          { roomCode: gameState.roomCode },
          sessionData,
          { upsert: true, new: true }
        );
        return;
      } catch (e) {
        console.error('Failed to persist game snapshot:', e);
      }
    }
    this.memorySessions.set(gameState.roomCode, sessionData);
  }

  public async getGameSnapshot(roomCode: string): Promise<GameState | null> {
    if (this.isConnected) {
      try {
        const found = await GameSession.findOne({ roomCode });
        if (found && found.snapshot) {
          return found.snapshot as GameState;
        }
      } catch (e) {
        console.error('Failed to get game snapshot:', e);
      }
    }
    const mem = this.memorySessions.get(roomCode);
    return mem?.snapshot || null;
  }

  public async getActiveRooms(): Promise<GameState[]> {
    if (this.isConnected) {
      try {
        const activeSessions = await GameSession.find({
          $or: [
            { endedAt: { $exists: false } },
            { endedAt: null }
          ]
        });
        return activeSessions.map(s => s.snapshot as GameState).filter(Boolean);
      } catch (e: any) {
        console.error('Failed to get active rooms for restart hydration:', e.message);
      }
    }
    return Array.from(this.memorySessions.values())
      .filter(s => !s.endedAt)
      .map(s => s.snapshot as GameState)
      .filter(Boolean);
  }

  public async recordGameEnd(gameState: GameState): Promise<void> {
    await this.saveGameSnapshot(gameState);

    // Update stats for all players
    for (const player of gameState.players) {
      const isWinner = gameState.winner?.id === player.id;
      const earnings = player.balance;

      if (this.isConnected) {
        try {
          await Statistics.findOneAndUpdate(
            { sessionId: player.sessionId },
            {
              $inc: {
                gamesPlayed: 1,
                gamesWon: isWinner ? 1 : 0,
                totalEarnings: earnings,
                propertiesBought: player.properties.length
              },
              $set: { lastUpdated: new Date() }
            },
            { upsert: true }
          );
          continue;
        } catch (e) {
          console.error('Failed to record player stats in DB:', e);
        }
      }

      // Memory fallback
      const current = this.memoryStats.get(player.sessionId) || {
        sessionId: player.sessionId,
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
        propertiesBought: 0
      };
      current.gamesPlayed += 1;
      if (isWinner) current.gamesWon += 1;
      current.totalEarnings += earnings;
      current.propertiesBought += player.properties.length;
      this.memoryStats.set(player.sessionId, current);
    }
  }

  public async getPlayerStats(sessionId: string): Promise<any> {
    if (this.isConnected) {
      try {
        const stats = await Statistics.findOne({ sessionId });
        if (stats) return stats;
      } catch (e) {
        console.error('Failed to query statistics:', e);
      }
    }
    return this.memoryStats.get(sessionId) || {
      sessionId,
      gamesPlayed: 0,
      gamesWon: 0,
      totalEarnings: 0,
      propertiesBought: 0
    };
  }
}

export const persistenceService = new PersistenceService();
