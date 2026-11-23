import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy (API Gateway)', () => {
  let strategy: JwtStrategy;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    strategy = new JwtStrategy();
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
      role: 'ADMIN',
    });

    expect(result).toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'ADMIN',
    });
  });

  it('should throw in production if JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(() => new JwtStrategy()).toThrow(
      'JWT_SECRET environment variable is required in production',
    );
  });
});
