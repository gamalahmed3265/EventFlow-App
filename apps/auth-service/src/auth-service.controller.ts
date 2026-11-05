import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthServiceService } from './auth-service.service';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / welcome endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHello(): string {
    return this.authServiceService.getHello();
  }

  @Post('register')
  @ApiOperation({
    summary: 'Simulate user registration and publish Kafka event',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered and event published to Kafka',
    schema: {
      example: {
        message: 'User user@example.com register event published successfully',
      },
    },
  })
  register(@Body() body: RegisterDto) {
    return this.authServiceService.simulateUserRegister(body.email);
  }
}
