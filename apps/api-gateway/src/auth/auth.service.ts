import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, SERVICE_PORTS, UserProfileReponse } from '@app/common';
@Injectable()
export class AuthService {
  private readonly authServiceUrl = `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`;

  constructor(private readonly httpService: HttpService) {}
  async register(data: { email: string; password: string; name: string }):Promise<UserProfileReponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/register`, data),
      );
      return response.data;
    } catch (error) {
      this.handError(error);
    }
  }
  async login(data: { email: string; password: string }):Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/login`, data),
      );
      return response.data;
    } catch (error) {
      this.handError(error);
    }
  }
  async getProfile(token: string):Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/profile`, {
          headers: { Authorization: token },
        }),
      );
      return response.data;
    } catch (error) {
      this.handError(error);
    }
  }
  private handError(error: any): never {
    if (error.response) {
      throw new HttpException(error.response.data, error.response.status);
    }
    throw new HttpException('Auth service unavailable', 503);
  }
}
