// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AvatarModule } from './avatars/avatars.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      `mongodb+srv://root:root@fas.1msmmkd.mongodb.net/?retryWrites=true&w=majority&appName=fas`,
    ),
    UsersModule,
    AvatarModule,
  ],
})
export class AppModule {}
