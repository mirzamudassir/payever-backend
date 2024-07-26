// src/avatars/avatar.schema.ts
import { Schema } from 'mongoose';

export const AvatarSchema = new Schema({
  userId: String,
  hash: String,
  data: Buffer,
});
