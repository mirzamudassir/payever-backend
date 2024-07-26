import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios'; // Correct import
import { AvatarController } from './avatars.controller';
import { AvatarService } from './avatars.service';
import { UserImageSchema } from './schema/user-image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'UserImage', schema: UserImageSchema }]),
    HttpModule, // Import HttpModule from @nestjs/axios
  ],
  controllers: [AvatarController],
  providers: [AvatarService],
})
export class AvatarModule {}
