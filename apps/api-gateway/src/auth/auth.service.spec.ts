import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { SERVICE_PORTS } from '@app/common';

describe('AuthService (API Gateway)', () => {
  let service: AuthService;
  let httpService: { post: jest.Mock; get: jest.Mock };

  const baseUrl = `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`;

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should forward POST /register to auth-service', async () => {
      const payload = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
      };
      const responseData = { message: 'User registered successfully', userId: '1' };
      httpService.post.mockReturnValue(of({ data: responseData }));

      const result = await service.register(payload);

      expect(httpService.post).toHaveBeenCalledWith(`${baseUrl}/register`, payload);
      expect(result).toEqual(responseData);
    });

    it('should forward downstream HTTP error status and data', async () => {
      httpService.post.mockReturnValue(
        throwError(() => ({
          response: { status: 409, data: { message: 'User already exists' } },
        })),
      );

      await expect(
        service.register({ email: 'a@b.com', password: 'password123', name: 'A' }),
      ).rejects.toThrow(new HttpException({ message: 'User already exists' }, 409));
    });

    it('should throw 503 when auth-service is unavailable', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('ECONNREFUSED')),
      );

      await expect(
        service.register({ email: 'a@b.com', password: 'password123', name: 'A' }),
      ).rejects.toThrow(new HttpException('Auth service unavailable', 503));
    });
  });

  describe('login', () => {
    it('should forward POST /login to auth-service', async () => {
      const payload = { email: 'user@example.com', password: 'password123' };
      const responseData = { token: 'jwt-token' };
      httpService.post.mockReturnValue(of({ data: responseData }));

      const result = await service.login(payload);

      expect(httpService.post).toHaveBeenCalledWith(`${baseUrl}/login`, payload);
      expect(result).toEqual(responseData);
    });

    it('should forward 401 error from auth-service', async () => {
      httpService.post.mockReturnValue(
        throwError(() => ({
          response: { status: 401, data: { message: 'Invalid credentials' } },
        })),
      );

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toThrow(new HttpException({ message: 'Invalid credentials' }, 401));
    });
  });

  describe('getProfile', () => {
    it('should forward GET /profile with Authorization header', async () => {
      const token = 'Bearer jwt-token';
      const responseData = { id: 'user-1', email: 'user@example.com' };
      httpService.get.mockReturnValue(of({ data: responseData }));

      const result = await service.getProfile(token);

      expect(httpService.get).toHaveBeenCalledWith(`${baseUrl}/profile`, {
        headers: { Authorization: token },
      });
      expect(result).toEqual(responseData);
    });

    it('should throw 503 when auth-service cannot be reached', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(service.getProfile('Bearer token')).rejects.toThrow(
        new HttpException('Auth service unavailable', 503),
      );
    });
  });
});

