import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
  roomCode: string;
  hostId: string;
  players: any[];
  winner: any;
  finalRankings: any[];
  durationSeconds: number;
  createdAt: Date;
  endedAt?: Date;
  snapshot?: any;
}

const GameSessionSchema = new Schema<IGameSession>({
  roomCode: { type: String, required: true, index: true },
  hostId: { type: String, required: true },
  players: [{ type: Schema.Types.Mixed }],
  winner: { type: Schema.Types.Mixed, default: null },
  finalRankings: [{ type: Schema.Types.Mixed }],
  durationSeconds: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  snapshot: { type: Schema.Types.Mixed }
});

export const GameSession = mongoose.model<IGameSession>('GameSession', GameSessionSchema);
