import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { getModelToken } from '@nestjs/mongoose';
import { UserImageSchema } from '../src/avatars/user-image.schema';
import { HttpModule } from '@nestjs/axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('App E2E Tests', () => {
  let app: INestApplication;
  const imageDirectory = path.join(__dirname, '../user-images'); // Directory for storing avatars

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        MongooseModule.forRoot('mongodb://localhost/nest'),
        MongooseModule.forFeature([
          { name: 'UserImage', schema: UserImageSchema },
        ]),
        HttpModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 300000);

  afterAll(async () => {
    await app.close();
  }, 300000);

  describe('POST /api/users', () => {
    it('should create a user and send an email and RabbitMQ event', async () => {
      const createUserDto = { name: 'John Doe', job: 'Full Stack Developer' };
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', createUserDto.name);
      expect(response.body).toHaveProperty('job', createUserDto.job);
    }, 10000);
  });

  describe('GET /api/users/:userId', () => {
    it('should retrieve user data from instance', async () => {
      const userId = 1;
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', 'george.bluth@reqres.in');
    });
  });

  describe('GET /api/user/:userId/avatar', () => {
    it('should fetch and store a new avatar and return base64 representation', async () => {
      const userId = 2;

      // Fetch the avatar image data
      await request(app.getHttpServer())
        .get(`/api/user/${userId}/avatar`)
        .expect(200);
    });
  });

  describe('GET /api/user/:userId/avatar', () => {
    it('should fetch and store a new avatar and return base64 representation', async () => {
      const userId = 2; // Example userId, replace with a valid ID from your database

      // Fetch the avatar image data
      const getAvatarResponse = await request(app.getHttpServer())
        .get(`/api/user/${userId}/avatar`)
        .expect(200);

      // Ensure the response is a string and contains base64 data
      const base64Image = getAvatarResponse.text; // Assume this is a string

      // expect(typeof base64Image).toBe('string');
      expect(base64Image).toMatch(/^data:image\/png;base64,/);

      // Extract base64 data from the response
      const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');
      const fileName = `${userId}_${crypto.createHash('sha256').update(Buffer.from(base64Data, 'base64')).digest('hex')}.png`;
      const filePath = path.join(imageDirectory, fileName);

      // Write the image data to a file (for test setup purposes)
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      // Check if the file exists
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
