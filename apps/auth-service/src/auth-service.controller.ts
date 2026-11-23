import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthServiceService } from './auth-service.service';
import {RegisterDTO,LoginDTO} from "@app/common"
import { AuthGuard } from '@nestjs/passport';
@ApiTags('Auth')
@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

 

  @Post('register')
  @ApiOperation({
    summary: 'Simulate user registration and publish Kafka event',
  })
  @ApiBody({ type: RegisterDTO,})
  @ApiResponse({
    status: 201,
    description: 'User registered and event published to Kafka',
    schema: {
      example: {
        message: 'User user@example.com register event published successfully',
      },
    },
  })
  register(@Body() body: RegisterDTO) {
    console.log("--------------------------------------");
    
    console.log(body);
    
    console.log("--------------------------------------");
    return this.authServiceService.register(body.email, body.password, body.name);
  }

  

  @Post('login')
  @ApiOperation({
    summary: 'Simulate user Login and publish Kafka event',
  })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({
    status: 201,
    description: 'User Login and event published to Kafka',
    schema: {
      example: {
        message: 'User user@example.com Login event published successfully',
      },
    },
  })
  login(@Body() body: LoginDTO) {
    return this.authServiceService.login(body.email,body.password);
  }
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @Get('profile')
   @ApiOperation({
    summary: 'User get his data Profile',
  })
   @ApiResponse({
    status: 201,
    description: 'User User get his data Profile',
    schema: {
      example: {
        message: 'User user@example.com Get event published successfully',
      },
    },
  })
  getProfile(@Request() req:{user:{userId:string}} ){
    return this.authServiceService.getProfile(req.user.userId)
  }

}
