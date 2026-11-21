import { CreateEventDto } from '@app/common/dto/create-event.dto';
import { DatabaseService } from '@app/database/database.service';
import { KAFKA_SERVICE } from '@app/kafka/kafka.module';
import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {events} from "@app/database"
import { KAFKA_TOPICS } from '@app/kafka';
import {eq} from "drizzle-orm"
import { UpdateEventDto } from '@app/common/dto/update-event.dto';
@Injectable()
export class EventsServiceService implements OnModuleInit {

  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly dbService: DatabaseService
  ){}


  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async createEvent(eventDataDto: CreateEventDto,organizerId:string) {
      const [event] = await this.dbService.db.insert(events ).values({
        ...eventDataDto,
        date: new Date(eventDataDto.date),
        price: eventDataDto.price ?? 0,
        organizerId
      }).returning();


      this.kafkaClient.emit(KAFKA_TOPICS.EVENT_CREATED, {
        eventId: event.id,
        organizerId: event.organizerId,
        title: event.title,
        timestamp: new Date().toISOString(),
      });
      return event;
  }
  async findAllEvents() {
   return await this.dbService.db.select().from(events).where(eq(events.status, "PUBLISHED"));
  }
  async findMyEvents(userId: string) {
    return await this.dbService.db
      .select()
      .from(events)
      .where(eq(events.organizerId, userId));
  }
  async findEventById(eventId: string) {
    const [event] = await this.dbService.db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    return event;
  }
  async updateEvent(eventId: string, updateData: UpdateEventDto,userId:string,userRole:string) {
    
    const event = await this.findEventById(eventId);
    
    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new NotFoundException(`You do not have permission to update this event`);
    }
    const updateFields :Record<string, unknown> = {...updateData};
    if (updateData.date) {
      updateFields.date = new Date(updateData.date);
    }
    const [updatedEvent] = await this.dbService.db
      .update(events)
      .set({
        ...updateFields,
        updateAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();
    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_UPDATED, {
      eventId: updatedEvent.id,
      changes:Object.keys(updateFields),
      title: updatedEvent.title,
      timestamp: new Date().toISOString(),
    });
    return updatedEvent;
  }
  async publishEvent(eventId: string,userId:string,userRole:string) {
    const event = await this.findEventById(eventId);

    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new NotFoundException(`You do not have permission to publish this event`);
    }
    const [publishedEvent] = await this.dbService.db
      .update(events)
      .set({
        status: "PUBLISHED",
        updateAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();
    if (!publishedEvent) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_PUBLISHED, {
      eventId: publishedEvent.id,
      organizerId: publishedEvent.organizerId,
      title: publishedEvent.title,
      timestamp: new Date().toISOString(),
    });
    return publishedEvent;
  }
  async cancelEvent(eventId: string,userId:string,userRole:string) {
    const event = await this.findEventById(eventId);

    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new NotFoundException(`You do not have permission to cancel this event`);
    }
    const [canceledEvent] = await this.dbService.db
      .update(events)
      .set({
        status: "CANCELED",
        updateAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();
    if (!canceledEvent) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_CANCELED, {
      eventId: canceledEvent.id,
      organizerId: canceledEvent.organizerId,
      title: canceledEvent.title,
      timestamp: new Date().toISOString(),
    });
    return canceledEvent;
  }
  async findEventsByOrganizer(organizerId: string) {
    return await this.dbService.db.select().from(events).where(eq(events.organizerId, organizerId));
  }
  }