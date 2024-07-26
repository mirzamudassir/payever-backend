// src/users/user.interface.ts
import { Document } from 'mongoose';

export interface User extends Document {
  id: string;
  name: string;
  job: string;
}
