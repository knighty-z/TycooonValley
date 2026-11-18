import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  sessionId: string;
  nickname: string;
  avatar: string;
  token: string;
  color: string;
  createdAt: Date;
  lastActiveAt: Date;
}

const UserSchema = new Schema<IUser>({
  sessionId: { type: String, required: true, unique: true, index: true },
  nickname: { type: String, required: true },
  avatar: { type: String, default: 'avatar-1' },
  token: { type: String, default: 'supercar' },
  color: { type: String, default: '#3B82F6' },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);
