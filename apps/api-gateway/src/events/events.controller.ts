import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateEventDto, UpdateEventDto } from '@app/common';
import { EventsService } from './events.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email?: string;
    role?: string;
  };
}

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Creates a new event via the Events Service (requires JWT)',
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
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 503,
    description: 'Events service unavailable',
  })
  createEvent(
    @Body() createEventDto: CreateEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.eventsService.createEvent(createEventDto, req.user.userId);
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

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('my-events')
  @ApiOperation({
    summary: 'Get events created by the authenticated user',
    description:
      'Retrieves all events created by the authenticated user (requires JWT)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events created by the authenticated user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  findMyEvents(@Request() req: AuthenticatedRequest) {
    return this.eventsService.findMyEvents(req.user.userId);
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

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.eventsService.updateEvent(
      id,
      updateEventDto,
      req.user.userId,
      req.user.role,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Publish an event',
    description: 'Sets event status to PUBLISHED (requires JWT)',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Event published successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  publishEvent(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.publishEvent(id, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an event',
    description: 'Sets event status to CANCELED (requires JWT)',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Event canceled successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  cancelEvent(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.cancelEvent(id, req.user.userId, req.user.role);
  }
}
