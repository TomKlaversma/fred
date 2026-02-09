import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DRIZZLE } from '../src/database/database.module';

describe('App (e2e)', () => {
  let app: NestFastifyApplication;

  // Mock database for e2e tests
  const mockDb = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
          groupBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE)
      .useValue(mockDb)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /health should return 200 with status ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('Auth', () => {
    it('POST /auth/register should accept valid registration', async () => {
      const mockCompany = {
        id: 'company-uuid',
        name: 'Test Corp',
        slug: 'test-corp',
        plan: 'free',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser = {
        id: 'user-uuid',
        companyId: 'company-uuid',
        email: 'admin@test.com',
        passwordHash: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        role: 'owner',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock: no existing user
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock: company insert
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCompany]),
        }),
      });

      // Mock: user insert
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          companyName: 'Test Corp',
          email: 'admin@test.com',
          password: 'secureP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('POST /auth/register should reject invalid body', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-valid',
        })
        .expect(400);
    });
  });

  describe('Protected routes', () => {
    it('GET /leads should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/leads')
        .expect(401);
    });

    it('GET /users should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('GET /campaigns should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/campaigns')
        .expect(401);
    });
  });
});
