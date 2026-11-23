import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt-strategy';

describe('JwtStrategy (Auth Service)', () => {
  let strategy: JwtStrategy;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    const mockConfigService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    strategy = new JwtStrategy(mockConfigService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and map JWT payload to user object', async () => {
    const result = await strategy.validate({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'user',
    });

    expect(result).toEqual({
      userId: 'user-1',
      username: 'user@example.com',
      role: 'user',
    });
  });

  it('should throw in production if JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new JwtStrategy(mockConfigService)).toThrow(
      'JWT_SECRET environment variable is required in production',
    );
  });
});
