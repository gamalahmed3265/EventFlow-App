import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO } from '@app/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDTO: RegisterDTO) {
    return this.authService.register(registerDTO);
  }
  @Post('login')
  login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }
  @Get('profile')
  async getProfile(@Headers('authorization') authorization: string) {
    return this.authService.getProfile(authorization);
  }
}
