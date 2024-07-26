import { Schema, Document } from 'mongoose';

export const UserImageSchema = new Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
});

export interface UserImageDocument extends Document {
  userId: string;
  fileName: string;
}
