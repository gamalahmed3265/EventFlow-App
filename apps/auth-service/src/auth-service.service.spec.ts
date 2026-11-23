import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthServiceService } from './auth-service.service';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import { DatabaseService } from '@app/database';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthServiceService', () => {
  let service: AuthServiceService;
  let kafkaClient: { connect: jest.Mock; emit: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let dbMock: {
    select: jest.Mock;
    insert: jest.Mock;
  };
  let selectExecuteMock: jest.Mock;
  let insertExecuteMock: jest.Mock;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    kafkaClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    selectExecuteMock = jest.fn();
    insertExecuteMock = jest.fn();

    dbMock = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            execute: selectExecuteMock,
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            execute: insertExecuteMock,
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthServiceService,
        { provide: KAFKA_SERVICE, useValue: kafkaClient },
        { provide: DatabaseService, useValue: { db: dbMock } },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthServiceService>(AuthServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to Kafka broker', async () => {
      await service.onModuleInit();
      expect(kafkaClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should catch and log error when Kafka connection fails', async () => {
      kafkaClient.connect.mockRejectedValueOnce(new Error('Kafka offline'));
      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user, hash password, and emit USER_REGISTERED event', async () => {
      selectExecuteMock.mockResolvedValueOnce([]);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');
      insertExecuteMock.mockResolvedValueOnce([
        {
          id: 'user-1',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'user',
        },
      ]);

      const result = await service.register(
        'user@example.com',
        'password123',
        'John Doe',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_REGISTERED,
        expect.objectContaining({
          userId: 'user-1',
          email: 'user@example.com',
          name: 'John Doe',
          timestamp: expect.any(String),
        }),
      );
      expect(result).toEqual({
        message: 'User registered successfully',
        userId: 'user-1',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      selectExecuteMock.mockResolvedValueOnce([{ id: 'existing-id' }]);

      await expect(
        service.register('existing@example.com', 'password123', 'John'),
      ).rejects.toThrow(ConflictException);
      expect(kafkaClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const existingUser = {
      id: 'user-1',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'John Doe',
      role: 'user',
    };

    it('should sign JWT, emit USER_LOGGED_IN, and return user details', async () => {
      selectExecuteMock.mockResolvedValueOnce([existingUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login('user@example.com', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      });
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_LOGGED_IN,
        expect.objectContaining({
          userId: existingUser.id,
          email: existingUser.email,
        }),
      );
      expect(result).toEqual({
        message: 'Login successful',
        token: 'signed-jwt-token',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      selectExecuteMock.mockResolvedValueOnce([]);

      await expect(
        service.login('missing@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      selectExecuteMock.mockResolvedValueOnce([existingUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login('user@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const now = new Date();
      selectExecuteMock.mockResolvedValueOnce([
        {
          id: 'user-1',
          email: 'user@example.com',
          password: 'hashed-password',
          name: 'John Doe',
          role: 'user',
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await service.getProfile('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'user',
        createdAt: now,
        updatedAt: now,
      });
      expect((result as any).password).toBeUndefined();
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      selectExecuteMock.mockResolvedValueOnce([]);

      await expect(service.getProfile('unknown-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

