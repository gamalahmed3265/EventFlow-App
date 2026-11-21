import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO } from '@app/common';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Registers a new user and returns user info with a token',
  })
  @ApiBody({ type: RegisterDTO })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (missing or invalid fields)',
  })
  register(@Body() registerDTO: RegisterDTO) {
    return this.authService.register(registerDTO);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Logs in a user with email and password, returning a JWT token',
  })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieves profile information using the Bearer JWT token',
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    description: 'Bearer <token>',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@Headers('authorization') authorization: string) {
    return this.authService.getProfile(authorization);
  }
}
