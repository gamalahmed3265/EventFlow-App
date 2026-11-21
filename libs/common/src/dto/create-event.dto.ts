import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    example: 'Tech Conference 2026',
    description: 'Title of the event',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must be less than 255 characters' })
  title: string;

  @ApiPropertyOptional({
    example: 'An annual conference gathering tech professionals',
    description: 'Detailed description of the event',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '2026-12-01T10:00:00Z',
    description: 'Date and time of the event (ISO 8601)',
  })
  @IsDateString({}, { message: 'Date must be a valid date string' })
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @ApiProperty({
    example: 'Cairo International Convention Centre',
    description: 'Physical or virtual location of the event',
  })
  @IsString({ message: 'Location must be a string' })
  @IsNotEmpty({ message: 'Location is required' })
  @MaxLength(255, { message: 'Location must be less than 255 characters' })
  location: string;

  @ApiProperty({
    example: 500,
    description: 'Maximum attendee capacity',
  })
  @IsInt({ message: 'Capacity must be a number' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Ticket price (0 for free)',
    default: 0,
  })
  @IsInt({ message: 'Price must be a number' })
  @Min(0, { message: 'Price must be at least 0' })
  @IsOptional()
  price?: number;
}
