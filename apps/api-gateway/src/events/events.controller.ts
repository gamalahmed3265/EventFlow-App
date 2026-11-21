import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEventDto, UpdateEventDto } from '@app/common';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Creates a new event via the Events Service',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'Organizer User ID (UUID)',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed / Invalid input data',
  })
  @ApiResponse({
    status: 503,
    description: 'Events service unavailable',
  })
  createEvent(
    @Body() createEventDto: CreateEventDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.eventsService.createEvent(createEventDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all published events',
    description: 'Retrieves all events with status PUBLISHED',
  })
  @ApiResponse({
    status: 200,
    description: 'List of published events retrieved successfully',
  })
  findAllEvents() {
    return this.eventsService.findAllEvents();
  }

  @Get('organizer/:organizerId')
  @ApiOperation({
    summary: 'Get events by organizer ID',
    description: 'Retrieves all events created by a specific organizer',
  })
  @ApiParam({
    name: 'organizerId',
    description: 'Organizer User ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of organizer events retrieved successfully',
  })
  findEventsByOrganizer(@Param('organizerId') organizerId: string) {
    return this.eventsService.findEventsByOrganizer(organizerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieves single event details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  findEventById(@Param('id') id: string) {
    return this.eventsService.findEventById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an event',
    description:
      'Updates event details. Only the organizer or an ADMIN can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (UUID)',
    type: 'string',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'User ID of the requester (UUID)',
  })
  @ApiHeader({
    name: 'x-user-role',
    required: false,
    description: 'Role of the user (e.g. USER, ADMIN)',
    schema: { default: 'USER' },
  })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed / Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found or insufficient permissions',
  })
  updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    return this.eventsService.updateEvent(id, updateEventDto, userId, userRole);
  }

  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Publish an event',
    description: 'Sets event status to PUBLISHED',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (UUID)',
    type: 'string',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'User ID of the requester (UUID)',
  })
  @ApiHeader({
    name: 'x-user-role',
    required: false,
    description: 'Role of the user (e.g. USER, ADMIN)',
    schema: { default: 'USER' },
  })
  @ApiResponse({
    status: 200,
    description: 'Event published successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found or insufficient permissions',
  })
  publishEvent(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    return this.eventsService.publishEvent(id, userId, userRole);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an event',
    description: 'Sets event status to CANCELED',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (UUID)',
    type: 'string',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'User ID of the requester (UUID)',
  })
  @ApiHeader({
    name: 'x-user-role',
    required: false,
    description: 'Role of the user (e.g. USER, ADMIN)',
    schema: { default: 'USER' },
  })
  @ApiResponse({
    status: 200,
    description: 'Event canceled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found or insufficient permissions',
  })
  cancelEvent(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    return this.eventsService.cancelEvent(id, userId, userRole);
  }
}

