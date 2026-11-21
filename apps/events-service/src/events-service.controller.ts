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
import { EventsServiceService } from './events-service.service';

@ApiTags('Events')
@Controller('events')
export class EventsServiceController {
  constructor(private readonly eventsServiceService: EventsServiceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Creates a new event and publishes an event.created Kafka event',
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
  createEvent(
    @Body() createEventDto: CreateEventDto,
    @Headers('x-user-id') organizerId: string,
  ) {
    return this.eventsServiceService.createEvent(createEventDto, organizerId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all published events',
    description: 'Retrieves all events that have PUBLISHED status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of published events retrieved successfully',
  })
  findAllEvents() {
    return this.eventsServiceService.findAllEvents();
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
    description: 'List of events for the specified organizer retrieved successfully',
  })
  findEventsByOrganizer(@Param('organizerId') organizerId: string) {
    return this.eventsServiceService.findEventsByOrganizer(organizerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieves the details of a specific event by its ID',
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
    return this.eventsServiceService.findEventById(id);
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
    @Headers('x-user-role') userRole: string = 'USER',
  ) {
    return this.eventsServiceService.updateEvent(
      id,
      updateEventDto,
      userId,
      userRole || 'USER',
    );
  }

  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Publish an event',
    description:
      'Sets event status to PUBLISHED and publishes an event.published Kafka event.',
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
    @Headers('x-user-role') userRole: string = 'USER',
  ) {
    return this.eventsServiceService.publishEvent(
      id,
      userId,
      userRole || 'USER',
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an event',
    description:
      'Sets event status to CANCELED and publishes an event.canceled Kafka event.',
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
    @Headers('x-user-role') userRole: string = 'USER',
  ) {
    return this.eventsServiceService.cancelEvent(
      id,
      userId,
      userRole || 'USER',
    );
  }
}
