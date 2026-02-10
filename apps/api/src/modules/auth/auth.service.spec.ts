import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { DRIZZLE } from '../../database/database.constants';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  // Mock database operations
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();

  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mockSelect,
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: mockInsert,
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: mockUpdate,
        }),
      }),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      companyName: 'Test Corp',
      email: 'admin@test.com',
      password: 'secureP@ss123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create a company and user on registration', async () => {
      // No existing user
      mockSelect.mockResolvedValueOnce([]);

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');

      // Mock company creation
      mockInsert.mockResolvedValueOnce([
        {
          id: 'company-uuid',
          name: 'Test Corp',
          slug: 'test-corp',
          plan: 'free',
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Mock user creation
      mockInsert.mockResolvedValueOnce([
        {
          id: 'user-uuid',
          companyId: 'company-uuid',
          email: 'admin@test.com',
          passwordHash: 'hashed-password',
          firstName: 'John',
          lastName: 'Doe',
          role: 'owner',
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockSelect.mockResolvedValueOnce([
        { id: 'existing-user', email: 'admin@test.com' },
      ]);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'admin@test.com',
      password: 'secureP@ss123',
    };

    it('should return tokens for valid credentials', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'user-uuid',
          companyId: 'company-uuid',
          email: 'admin@test.com',
          passwordHash: 'hashed-password',
          role: 'owner',
          isActive: true,
        },
      ]);

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      mockUpdate.mockResolvedValueOnce([{}]);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'user-uuid',
          companyId: 'company-uuid',
          email: 'admin@test.com',
          passwordHash: 'hashed-password',
          role: 'owner',
        },
      ]);

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockSelect.mockResolvedValueOnce([]);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
