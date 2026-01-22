import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Set NODE_ENV to development for tests
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '7d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/dev-login', () => {
    it('should return 200 and access_token for valid request', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .send({
          role: 'KITCHEN',
          restaurantId: 'rest_1',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('token_type', 'Bearer');
          expect(res.body).toHaveProperty('expires_in');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('role', 'KITCHEN');
          expect(res.body.user).toHaveProperty('restaurantId', 'rest_1');
        });
    });

    it('should return 400 for invalid role', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .send({
          role: 'INVALID_ROLE',
          restaurantId: 'rest_1',
        })
        .expect(400);
    });

    it('should return 400 for missing restaurantId', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .send({
          role: 'KITCHEN',
        })
        .expect(400);
    });

    it('should accept optional userId', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .send({
          role: 'WAITER',
          restaurantId: 'rest_1',
          userId: 'custom-user-id',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toHaveProperty('id', 'custom-user-id');
        });
    });
  });
});
