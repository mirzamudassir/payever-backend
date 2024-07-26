// src/users/user.schema.ts
import { Schema } from 'mongoose';
import { User } from './user.interface';

export const UserSchema = new Schema<User>({
  id: String,
  name: String,
  job: String,
});
