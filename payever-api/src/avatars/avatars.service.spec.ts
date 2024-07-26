import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AvatarService } from './avatars.service';
import { UserImageDocument } from './schema/user-image.schema';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('AvatarService', () => {
  let service: AvatarService;
  let httpService: HttpService;
  let userImageModel: Model<UserImageDocument>;

  const mockUserImageModel = {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    save: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        AvatarService,
        { provide: getModelToken('UserImage'), useValue: mockUserImageModel },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<AvatarService>(AvatarService);
    httpService = module.get<HttpService>(HttpService);
    userImageModel = module.get<Model<UserImageDocument>>(
      getModelToken('UserImage'),
    );

    // Ensure the image directory exists
    if (!fs.existsSync(service.imageDirectory)) {
      fs.mkdirSync(service.imageDirectory, { recursive: true });
    }
  });

  describe('getUserAvatar', () => {
    it('should return base64 representation of stored image', async () => {
      const userId = '1';
      const fileName = 'avatar.png';
      const imageData = Buffer.from('fakeImageData');
      const userImage = { userId, fileName };
      const filePath = path.join(service.imageDirectory, fileName);

      jest.spyOn(userImageModel, 'findOne').mockResolvedValue(userImage as any);
      fs.writeFileSync(filePath, imageData); // Mock saving image

      const result = await service.getUserAvatar(userId);

      expect(result).toEqual(
        `data:image/png;base64,${imageData.toString('base64')}`,
      );
    });

    it('should fetch and store new avatar if not found in db', async () => {
      const userId = '1';
      // const avatarUrl = 'https://reqres.in/img/faces/1-image.jpg';
      const imageData = Buffer.from('newImageData');
      const fileName = `${userId}_${crypto.createHash('sha256').update(imageData).digest('hex')}.png`;

      const userResponse: AxiosResponse = {
        data: imageData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(userImageModel, 'findOne').mockResolvedValue(null as any); // Ensure correct type
      jest.spyOn(httpService, 'get').mockImplementation(() => of(userResponse));
      jest
        .spyOn(userImageModel, 'save')
        .mockResolvedValue({ userId, fileName } as any);

      const result = await service.getUserAvatar(userId);

      expect(result).toEqual(
        `data:image/png;base64,${imageData.toString('base64')}`,
      );
      expect(fs.existsSync(path.join(service.imageDirectory, fileName))).toBe(
        true,
      );
    });

    it('should throw HttpException if fetch fails', async () => {
      const userId = '1';

      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() =>
          throwError(() => new Error('Failed to fetch')),
        );

      await expect(service.getUserAvatar(userId)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete the image file and metadata', async () => {
      const userId = '1';
      const fileName = 'avatar.png';
      const filePath = path.join(service.imageDirectory, fileName);
      const userImage = { userId, fileName };

      jest.spyOn(userImageModel, 'findOne').mockResolvedValue(userImage as any);
      jest.spyOn(userImageModel, 'deleteOne').mockResolvedValue({} as any);

      fs.writeFileSync(filePath, Buffer.from('deleteMe'));

      await service.deleteUserAvatar(userId);

      expect(fs.existsSync(filePath)).toBe(false);
      expect(await userImageModel.findOne({ userId })).toBe(null);
    });

    it('should throw HttpException if avatar not found', async () => {
      const userId = '1';

      jest.spyOn(userImageModel, 'findOne').mockResolvedValue(null);

      await expect(service.deleteUserAvatar(userId)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
