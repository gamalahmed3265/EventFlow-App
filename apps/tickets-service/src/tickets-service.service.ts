import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { DatabaseService } from '@app/database/database.service';
import { randomBytes } from 'crypto';
import { PurchaseTicketDto } from '@app/common';
import { events, tickets } from '@app/database';
import { and, eq, sql } from 'drizzle-orm';

@Injectable()
export class TicketsServiceService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly dbService: DatabaseService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  private generateTicketCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  async purchase(purchaseDto: PurchaseTicketDto, userId: string) {
    const { eventId, quantity } = purchaseDto;

    // 1. Get event
    const [event] = await this.dbService.db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // 2. Check event status
    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException(`Event is not published`);
    }

    // 3. Get total sold tickets
    const soldTickets = await this.dbService.db
      .select({
        total: sql<number>`
        COALESCE(SUM(${tickets.quantity}), 0)
      `,
      })
      .from(tickets)
      .where(
        and(eq(tickets.eventId, eventId), eq(tickets.status, 'CONFIRMED')),
      );

    // 4. Calculate remaining tickets
    const currentSold = Number(soldTickets[0]?.total || 0);
    const remaining = event.capacity - currentSold;

    // 5. Check availability
    if (quantity > remaining) {
      throw new BadRequestException(`Only ${remaining} tickets remaining`);
    }

    // 6. Calculate total price
    const totalPrice = Number(event.price) * quantity;

    // 7. Insert ticket
    const [ticket] = await this.dbService.db
      .insert(tickets)
      .values({
        eventId,
        userId,
        quantity,
        totalPrice,
        ticketCode: this.generateTicketCode(),
        status: 'CONFIRMED',
      })
      .returning();

    // 8. Emit Kafka event
    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_PURCHASED, {
      ticketId: ticket.id,
      eventId: ticket.eventId,
      userId: ticket.userId,
      quantity: ticket.quantity,
      totalPrice: ticket.totalPrice,
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Tickets purchased successfully',
      ticket,
      remainingTickets: remaining - quantity,
    };
  }

  async findMyTicket(userId: string) {
    return await this.dbService.db
      .select({
        id: tickets.id,
        quantity: tickets.quantity,
        totalPrice: tickets.totalPrice,
        status: tickets.status,
        purchasedAt: tickets.purchasedAt,
        checkedInAt: tickets.checkedInAt,
        eventId: events.id,
        eventsTitle: events.title,
        eventsDate: events.date,
        eventsLocation: events.location,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, userId));
  }
  async findOne(id: string, userId: string) {
    const [ticket] = await this.dbService.db
      .select({
        id: tickets.id,
        quantity: tickets.quantity,
        totalPrice: tickets.totalPrice,
        status: tickets.status,
        purchasedAt: tickets.purchasedAt,
        checkedInAt: tickets.checkedInAt,
        userId: tickets.userId,
        eventId: events.id,
        eventsTitle: events.title,
        eventsDate: events.date,
        eventsLocation: events.location,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(and(eq(tickets.userId, userId), eq(tickets.id, id)))
      .limit(1);
    if (!ticket) {
      throw new NotFoundException(`Ticket Not Found`);
    }
    if (ticket.userId !== userId) {
      throw new ForbiddenException(`Ticket does not belong to user`);
    }
    return ticket;
  }
  async cancel(id: string, userId: string) {
    const [ticket] = await this.dbService.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException(`Ticket Not Found`);
    }
    if (ticket.userId !== userId) {
      throw new ForbiddenException(`Ticket does not belong to user`);
    }
    if (ticket.status === 'CANCELLED') {
      throw new BadRequestException(`Ticket is already cancelled`);
    }
    if (ticket.status === 'CHECKED_IN') {
      throw new BadRequestException(`Ticket is already Checked in`);
    }
    const [cancelled] = await this.dbService.db
      .update(tickets)
      .set({ status: 'CONFIRMED', updateAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_CANCELLED, {
      ticketId: cancelled.id,
      eventId: cancelled.eventId,
      userId: cancelled.userId,
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Ticket Cancelled successfully',
    };
  }
  async checkIn(ticketCode: string, organizerId: string) {
    const [ticket] = await this.dbService.db
      .select({
        id: tickets.id,
        status: tickets.status,
        eventId: events.id,
        quantity: tickets.quantity,
      })
      .from(tickets)
      .where(eq(tickets.ticketCode, ticketCode))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException(`Ticket Not Found`);
    }
    const [event] = await this.dbService.db
      .select()
      .from(events)
      .where(eq(events.id, ticket.eventId))
      .limit(1);
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(
        `You are not organizer to check in this ticket`,
      );
    }
    if (ticket.status === 'CANCELLED') {
      throw new BadRequestException(`Ticket is already cancelled`);
    }

    const [checkIn] = await this.dbService.db
      .update(tickets)
      .set({
        status: 'CHECKED_IN',

        checkedInAt: new Date(),
        updateAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_CHECKED_IN, {
      ticketId: checkIn.id,
      eventId: checkIn.eventId,
      userId: checkIn.userId,
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Ticket checked in successfully',
      ticket:{
        id: checkIn.id,
        eventId: checkIn.eventId,
        userId: checkIn.userId,
        status: checkIn.status,
        quantity: checkIn.quantity,
        checkedInAt:checkIn.checkedInAt
        , ticketCode:checkIn.ticketCode
      }
    };
  }
  async findEventTickets(eventId:string,organizerId:string){
     const [event] = await this.dbService.db
      .select()
       .from(events)
      .where( eq(events.id, eventId))
      .limit(1);
    if (!event) {
      throw new NotFoundException(`event Not Found`);
    }
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException(`You are not Authorized to check in this ticket`);
    }
    return this.dbService.db
      .select()
      .from(tickets)
      .where(eq(tickets.eventId,event.id))
  }
}
