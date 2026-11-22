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
import { CheckTicketDto, PurchaseTicketDto } from '@app/common';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  @ApiOperation({
    summary: 'Purchase tickets for an event',
    description:
      'Purchases one or more tickets for a published event via the Tickets Service',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'User ID of the buyer (UUID)',
  })
  @ApiBody({
    description: 'Ticket purchase details',
    schema: {
      type: 'object',
      required: ['eventId', 'quantity'],
      properties: {
        eventId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
          description: 'Event ID (UUID v4)',
        },
        quantity: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          example: 2,
          description: 'Number of tickets to purchase (1-10)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tickets purchased successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Event is not published, not enough tickets remaining, or validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiResponse({
    status: 503,
    description: 'Tickets service unavailable',
  })
  purchase(
    @Body() purchaseDto: PurchaseTicketDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.ticketsService.purchase(purchaseDto, userId);
  }

  @Get('my-tickets')
  @ApiOperation({
    summary: 'Get tickets of the authenticated user',
    description:
      'Retrieves all tickets purchased by the user specified in the x-user-id header',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'User ID of the requester (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user tickets retrieved successfully',
  })
  @ApiResponse({
    status: 503,
    description: 'Tickets service unavailable',
  })
  findMyTickets(@Headers('x-user-id') userId: string) {
    return this.ticketsService.findMyTickets(userId);
  }

  @Get('event/:eventId')
  @ApiOperation({
    summary: 'Get all tickets for an event',
    description:
      'Retrieves all tickets for a specific event. Only the event organizer can access this endpoint.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID (UUID)',
    type: 'string',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'Organizer User ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets for the event retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requester is not the event organizer',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiResponse({
    status: 503,
    description: 'Tickets service unavailable',
  })
  findEventTickets(
    @Param('eventId') eventId: string,
    @Headers('x-user-id') organizerId: string,
  ) {
    return this.ticketsService.findEventTickets(eventId, organizerId);
  }

  @Post('check-in')
  @ApiOperation({
    summary: 'Check in a ticket',
    description:
      'Marks a ticket as CHECKED_IN using its ticket code. Organizer only.',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'Organizer User ID (UUID)',
  })
  @ApiBody({
    description: 'Ticket check-in payload',
    schema: {
      type: 'object',
      required: ['ticketCode'],
      properties: {
        ticketCode: {
          type: 'string',
          example: 'A1B2C3D4E5F6',
          description: 'Unique ticket code',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket checked in successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Ticket is already cancelled or validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requester is not the event organizer',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: 503,
    description: 'Tickets service unavailable',
  })
  checkIn(
    @Body() checkTicketDto: CheckTicketDto,
    @Headers('x-user-id') organizerId: string,
  ) {
    return this.ticketsService.checkIn(checkTicketDto, organizerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a ticket by ID',
    description:
      'Retrieves details of a single ticket owned by the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID (UUID)',
    type: 'string',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'User ID of the ticket owner (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - ticket does not belong to user',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: 503,
    description: 'Tickets service unavailable',
  })
  findOne(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.ticketsService.findOne(id, userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a ticket',
    description: 'Cancels a user ticket via the Tickets Service',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID (UUID)',
    type: 'string',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'User ID of the ticket owner (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Ticket is already cancelled or already checked in',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - ticket does not belong to user',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: 503,
    description: 'Tickets service unavailable',
  })
  cancel(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.ticketsService.cancel(id, userId);
  }
}

