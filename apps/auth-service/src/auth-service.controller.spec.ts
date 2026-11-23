import { Test, TestingModule } from '@nestjs/testing';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { LoginDTO, RegisterDTO } from '@app/common';

describe('AuthServiceController', () => {
  let controller: AuthServiceController;
  let service: jest.Mocked<AuthServiceService>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthServiceController],
      providers: [
        {
          provide: AuthServiceService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = app.get<AuthServiceController>(AuthServiceController);
    service = app.get(AuthServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call register with email, password, and name in correct order', async () => {
    const dto: RegisterDTO = {
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe',
    };
    const expected = {
      message: 'User registered successfully',
      userId: 'user-1',
    };
    service.register.mockResolvedValue(expected);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await controller.register(dto);
    logSpy.mockRestore();

    expect(service.register).toHaveBeenCalledWith(
      dto.email,
      dto.password,
      dto.name,
    );
    expect(result).toEqual(expected);
  });

  it('should call login with email and password', async () => {
    const dto: LoginDTO = {
      email: 'user@example.com',
      password: 'password123',
    };
    const expected = {
      message: 'Login successful',
      token: 'jwt-token',
      user: {
        id: 'user-1',
        email: dto.email,
        name: 'John Doe',
        role: 'user' as const,
      },
    };
    service.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto.email, dto.password);
    expect(result).toEqual(expected);
  });

  it('should call getProfile with req.user.userId', async () => {
    const expected = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'user' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    service.getProfile.mockResolvedValue(expected);

    const result = await controller.getProfile({ user: { userId: 'user-1' } });

    expect(service.getProfile).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });
});
