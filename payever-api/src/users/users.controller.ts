// src/users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  NotFoundException,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() userDto: { name: string; job: string }) {
    return this.usersService.createUser(userDto);
  }

  @Get('/:userId')
  async getUser(@Param('userId') userId: string) {
    try {
      const user = await this.usersService.getUser(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      return user.data;
    } catch (error) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }
}
