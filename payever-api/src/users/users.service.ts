// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.interface';
import axios from 'axios';
import { Client, connect } from 'amqplib';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UsersService {
  private rabbitClient: Client;

  constructor(
    @InjectModel('User') private userModel: Model<User>,
    private readonly httpService: HttpService,
  ) {
    this.connectRabbitMQ();
  }

  async createUser(userDto: { name: string; job: string }): Promise<User> {
    // Create user via ReqRes API
    const response = await axios.post('https://reqres.in/api/users', userDto);
    const reqresUser = response.data;

    // Save user to MongoDB
    const user = new this.userModel({
      id: reqresUser.id,
      name: reqresUser.name,
      job: reqresUser.job,
    });
    await user.save();

    // Dummy email sending
    await this.sendEmail(user);

    // Dummy RabbitMQ event sending
    await this.sendRabbitEvent(user);

    return user;
  }

  async getUser(userId: string): Promise<any> {
    const url = `https://reqres.in/api/users/${userId}`;
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user with ID ${userId}`);
    }
  }

  private async sendEmail(user: User) {
    console.log(`Sending email to ${user.name}`);
  }

  private async sendRabbitEvent(user: User) {
    if (!this.rabbitClient) return;
    const channel = await this.rabbitClient.createChannel();
    await channel.assertQueue('user_queue');
    channel.sendToQueue('user_queue', Buffer.from(JSON.stringify(user)));
  }

  private async connectRabbitMQ() {
    try {
      this.rabbitClient = await connect(
        `amqps://fruhnvir:m1T7F8-QLFTs7zGDmyi5xsii3MclfvEy@rattlesnake.rmq.cloudamqp.com/fruhnvir`,
      );
      //   console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  }
}
