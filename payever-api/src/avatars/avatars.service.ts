import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';
import { UserImageDocument } from './user-image.schema';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AvatarService {
  public imageDirectory = path.join(__dirname, '../../user-images'); // Directory to save images

  constructor(
    @InjectModel('UserImage')
    private readonly userImageModel: Model<UserImageDocument>,
    private readonly httpService: HttpService,
  ) {
    // Ensure the image directory exists
    if (!fs.existsSync(this.imageDirectory)) {
      fs.mkdirSync(this.imageDirectory, { recursive: true });
    }
  }

  async getUserAvatar(userId: string): Promise<string> {
    // Check if the image is already stored in the database
    const userImage = await this.userImageModel.findOne({ userId }).exec();

    if (userImage) {
      // Image is already stored, return its base64 representation
      const filePath = path.join(this.imageDirectory, userImage.fileName);
      const imageData = fs.readFileSync(filePath);
      return `data:image/png;base64,${imageData.toString('base64')}`;
    }

    // Fetch the user from the ReqRes API to get the avatar URL
    const avatarUrl = await this.fetchAvatarUrl(userId);
    const response = await firstValueFrom(
      this.httpService.get(avatarUrl, { responseType: 'arraybuffer' }),
    );
    const imageData = response.data;

    // Generate a hash for the image
    const hash = crypto.createHash('sha256').update(imageData).digest('hex');
    const fileName = `${userId}_${hash}.png`;
    const filePath = path.join(this.imageDirectory, fileName);

    // Save the image to the file system
    fs.writeFileSync(filePath, imageData);

    // Save image metadata to MongoDB
    await new this.userImageModel({ userId, fileName }).save();

    // Return the base64 representation of the image
    return `data:image/png;base64,${imageData.toString('base64')}`;
  }

  async deleteUserAvatar(userId: string): Promise<void> {
    // Find the image metadata from the database
    const userImage = await this.userImageModel.findOne({ userId }).exec();

    if (!userImage) {
      throw new HttpException('Avatar not found', HttpStatus.NOT_FOUND);
    }

    // Remove the file from the file system
    const filePath = path.join(this.imageDirectory, userImage.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove the metadata from the database
    await this.userImageModel.deleteOne({ userId }).exec();
  }

  public async fetchAvatarUrl(userId: string): Promise<string> {
    const url = `https://reqres.in/api/users/${userId}`;
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return response.data.data.avatar;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch user with ID ${userId}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
