import { Controller, Delete, Get, Param } from '@nestjs/common';
import { AvatarService } from './avatars.service';

@Controller('api/user')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Get('/:userId/avatar')
  async getUserAvatar(@Param('userId') userId: string) {
    return this.avatarService.getUserAvatar(userId);
  }

  @Delete('/:userId/avatar')
  async deleteUserAvatar(@Param('userId') userId: string) {
    await this.avatarService.deleteUserAvatar(userId);
    return { message: 'Avatar deleted successfully' };
  }
}
