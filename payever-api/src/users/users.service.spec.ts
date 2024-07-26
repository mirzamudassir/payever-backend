import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './interface/user.interface';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let httpService: HttpService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userModel: Model<User>;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    httpService = module.get<HttpService>(HttpService);
    userModel = module.get<Model<User>>(getModelToken('User'));
  });

  describe('getUser', () => {
    it('should return user data', async () => {
      const userId = '1';
      const userResponse: AxiosResponse = {
        data: { id: userId, email: 'test@example.com' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(userResponse));

      expect(await service.getUser(userId)).toEqual(userResponse.data);
    });

    it('should throw an HttpException if the user is not found', async () => {
      const userId = '1';

      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(() => new Error('Not Found')));

      await expect(service.getUser(userId)).rejects.toThrow(HttpException);
    });
  });
});
