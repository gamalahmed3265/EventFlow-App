import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO } from '@app/common';

describe('AuthController (API Gateway)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate register to AuthService', async () => {
    const dto: RegisterDTO = {
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe',
    };
    const expected = {
      id: 'user-1',
      email: dto.email,
      name: dto.name,
      role: 'user',
      createAt: '2026-01-01',
      updateAt: '2026-01-01',
    };
    authService.register.mockResolvedValue(expected);

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should delegate login to AuthService', async () => {
    const dto: LoginDTO = {
      email: 'user@example.com',
      password: 'password123',
    };
    const expected = { accessToken: 'jwt-token' };
    authService.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should delegate getProfile with authorization header to AuthService', async () => {
    const token = 'Bearer jwt-token';
    const expected = { accessToken: 'profile-data' };
    authService.getProfile.mockResolvedValue(expected);

    const result = await controller.getProfile(token);

    expect(authService.getProfile).toHaveBeenCalledWith(token);
    expect(result).toEqual(expected);
  });
});

