import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsServiceService } from './events-service.service';
import { KAFKA_SERVICE } from '@app/kafka/kafka.module';
import { KAFKA_TOPICS } from '@app/kafka';
import { DatabaseService } from '@app/database/database.service';
import { CreateEventDto } from '@app/common/dto/create-event.dto';

describe('EventsServiceService', () => {
  let service: EventsServiceService;
  let kafkaClient: { connect: jest.Mock; emit: jest.Mock };
  let insertReturningMock: jest.Mock;
  let insertValuesMock: jest.Mock;
  let selectWhereMock: jest.Mock;
  let selectLimitMock: jest.Mock;
  let updateReturningMock: jest.Mock;
  let updateSetMock: jest.Mock;

  const sampleEvent = {
    id: 'evt-1',
    title: 'Tech Conference 2026',
    description: 'Annual conf',
    date: new Date('2026-12-01T10:00:00Z'),
    location: 'Cairo',
    capacity: 500,
    price: 50,
    status: 'DRAFT',
    organizerId: 'org-1',
    createAt: new Date(),
    updateAt: new Date(),
  };

  beforeEach(async () => {
    kafkaClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    };

    insertReturningMock = jest.fn();
    insertValuesMock = jest.fn().mockReturnValue({
      returning: insertReturningMock,
    });

    selectLimitMock = jest.fn();
    selectWhereMock = jest.fn();

    updateReturningMock = jest.fn();
    updateSetMock = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: updateReturningMock,
      }),
    });

    const dbMock = {
      insert: jest.fn().mockReturnValue({
        values: insertValuesMock,
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: selectWhereMock,
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: updateSetMock,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsServiceService,
        { provide: KAFKA_SERVICE, useValue: kafkaClient },
        { provide: DatabaseService, useValue: { db: dbMock } },
      ],
    }).compile();

    service = module.get<EventsServiceService>(EventsServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to Kafka on module init', async () => {
    await service.onModuleInit();
    expect(kafkaClient.connect).toHaveBeenCalledTimes(1);
  });

  describe('createEvent', () => {
    it('should insert event with default price 0 and emit EVENT_CREATED', async () => {
      const dto: CreateEventDto = {
        title: 'Free Meetup',
        date: '2026-12-01T10:00:00Z',
        location: 'Cairo',
        capacity: 50,
      };
      const created = { ...sampleEvent, title: dto.title, price: 0 };
      insertReturningMock.mockResolvedValueOnce([created]);

      const result = await service.createEvent(dto, 'org-1');

      expect(insertValuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          price: 0,
          organizerId: 'org-1',
          date: expect.any(Date),
        }),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.EVENT_CREATED,
        expect.objectContaining({
          eventId: created.id,
          organizerId: created.organizerId,
          title: created.title,
        }),
      );
      expect(result).toEqual(created);
    });
  });

  describe('findAllEvents', () => {
    it('should return all published events', async () => {
      selectWhereMock.mockResolvedValueOnce([
        { ...sampleEvent, status: 'PUBLISHED' },
      ]);

      const result = await service.findAllEvents();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('PUBLISHED');
    });
  });

  describe('findMyEvents', () => {
    it('should return events belonging to the user', async () => {
      selectWhereMock.mockResolvedValueOnce([sampleEvent]);

      const result = await service.findMyEvents('org-1');

      expect(result).toEqual([sampleEvent]);
    });
  });

  describe('findEventsByOrganizer', () => {
    it('should return events for the organizer', async () => {
      selectWhereMock.mockResolvedValueOnce([sampleEvent]);

      const result = await service.findEventsByOrganizer('org-1');

      expect(result).toEqual([sampleEvent]);
    });
  });

  describe('findEventById', () => {
    it('should return event when found', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);

      const result = await service.findEventById('evt-1');

      expect(result).toEqual(sampleEvent);
    });

    it('should throw NotFoundException when event is missing', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([]);

      await expect(service.findEventById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEvent', () => {
    it('should update event as organizer and emit EVENT_UPDATED', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);
      const updated = { ...sampleEvent, title: 'Updated Title' };
      updateReturningMock.mockResolvedValueOnce([updated]);

      const result = await service.updateEvent(
        'evt-1',
        { title: 'Updated Title', date: '2026-12-10T10:00:00Z' },
        'org-1',
        'USER',
      );

      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.EVENT_UPDATED,
        expect.objectContaining({
          eventId: updated.id,
          title: updated.title,
          changes: expect.arrayContaining(['title', 'date']),
        }),
      );
      expect(result).toEqual(updated);
    });

    it('should allow lowercase admin role from DB to update another organizer event', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);
      const updated = { ...sampleEvent, title: 'Admin Edit' };
      updateReturningMock.mockResolvedValueOnce([updated]);

      const result = await service.updateEvent(
        'evt-1',
        { title: 'Admin Edit' },
        'other-user',
        'admin',
      );

      expect(result).toEqual(updated);
    });

    it('should throw ForbiddenException when non-owner USER tries to update', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);

      await expect(
        service.updateEvent('evt-1', { title: 'Hack' }, 'other-user', 'user'),
      ).rejects.toThrow(ForbiddenException);
      expect(kafkaClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('publishEvent', () => {
    it('should publish event and emit EVENT_PUBLISHED', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);
      const published = { ...sampleEvent, status: 'PUBLISHED' };
      updateReturningMock.mockResolvedValueOnce([published]);

      const result = await service.publishEvent('evt-1', 'org-1', 'USER');

      expect(updateSetMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PUBLISHED' }),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.EVENT_PUBLISHED,
        expect.objectContaining({ eventId: published.id }),
      );
      expect(result).toEqual(published);
    });

    it('should throw ForbiddenException when unauthorized user tries to publish', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);

      await expect(
        service.publishEvent('evt-1', 'other-user', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelEvent', () => {
    it('should cancel event, include organizer email, and emit EVENT_CANCELED', async () => {
      const organizerLimitMock = jest
        .fn()
        .mockResolvedValueOnce([{ email: 'org@example.com' }]);
      selectWhereMock
        .mockReturnValueOnce({ limit: selectLimitMock })
        .mockReturnValueOnce({ limit: organizerLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);

      const canceled = { ...sampleEvent, status: 'CANCELED' };
      updateReturningMock.mockResolvedValueOnce([canceled]);

      const result = await service.cancelEvent('evt-1', 'org-1', 'USER');

      expect(updateSetMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CANCELED' }),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.EVENT_CANCELED,
        expect.objectContaining({
          eventId: canceled.id,
          organizerId: canceled.organizerId,
          email: 'org@example.com',
          eventTitle: canceled.title,
        }),
      );
      expect(result).toEqual(canceled);
    });

    it('should throw ForbiddenException when unauthorized user tries to cancel', async () => {
      selectWhereMock.mockReturnValueOnce({ limit: selectLimitMock });
      selectLimitMock.mockResolvedValueOnce([sampleEvent]);

      await expect(
        service.cancelEvent('evt-1', 'other-user', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
