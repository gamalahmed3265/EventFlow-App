import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Please Provide a Valid Email' })
  @IsNotEmpty({ message: 'Email is Reuired' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password of the user (at least 6 characters)',
  })
  @IsString({ message: 'Password Must be a string' })
  @MinLength(6, { message: 'Password must be at least 8 charachers long' })
  @IsNotEmpty({ message: 'Password is Reuired' })
  password: string;
}
