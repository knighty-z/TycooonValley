import mongoose, { Schema, Document } from 'mongoose';

export interface IStatistics extends Document {
  sessionId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalEarnings: number;
  propertiesBought: number;
  bankruptciesCaused: number;
  lastUpdated: Date;
}

const StatisticsSchema = new Schema<IStatistics>({
  sessionId: { type: String, required: true, unique: true, index: true },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  propertiesBought: { type: Number, default: 0 },
  bankruptciesCaused: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export const Statistics = mongoose.model<IStatistics>('Statistics', StatisticsSchema);
