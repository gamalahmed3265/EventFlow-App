import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TicketsServiceService } from './tickets-service.service';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import { DatabaseService } from '@app/database/database.service';

function createSelectChain(result: unknown) {
  const whereResult = Promise.resolve(result) as Promise<unknown> & {
    limit: jest.Mock;
    for: jest.Mock;
  };
  whereResult.limit = jest.fn().mockResolvedValue(result);
  whereResult.for = jest.fn().mockResolvedValue(result);

  const fromObj = {
    where: jest.fn().mockReturnValue(whereResult),
    innerJoin: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue(whereResult),
    }),
  };

  return {
    from: jest.fn().mockReturnValue(fromObj),
  };
}

describe('TicketsServiceService', () => {
  let service: TicketsServiceService;
  let kafkaClient: { connect: jest.Mock; emit: jest.Mock };
  let dbMock: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let insertReturningMock: jest.Mock;
  let updateSetMock: jest.Mock;
  let updateReturningMock: jest.Mock;

  const publishedEvent = {
    id: 'evt-1',
    title: 'Tech Conf',
    status: 'PUBLISHED',
    capacity: 10,
    price: 50,
    organizerId: 'org-1',
  };

  const sampleTicket = {
    id: 'tkt-1',
    eventId: 'evt-1',
    userId: 'user-1',
    quantity: 2,
    totalPrice: 100,
    ticketCode: 'A1B2C3D4E5F6',
    status: 'CONFIRMED',
    checkedInAt: null,
  };

  beforeEach(async () => {
    kafkaClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    };

    insertReturningMock = jest.fn();
    updateReturningMock = jest.fn();
    updateSetMock = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: updateReturningMock,
      }),
    });

    dbMock = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: insertReturningMock,
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: updateSetMock,
      }),
      transaction: jest.fn(async (cb: (tx: typeof dbMock) => Promise<unknown>) =>
        cb(dbMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsServiceService,
        { provide: KAFKA_SERVICE, useValue: kafkaClient },
        { provide: DatabaseService, useValue: { db: dbMock } },
      ],
    }).compile();

    service = module.get<TicketsServiceService>(TicketsServiceService);
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

  describe('purchase', () => {
    it('should purchase tickets inside a transaction and emit TICKET_PURCHASED with email & ticketCode', async () => {
      dbMock.select
        .mockReturnValueOnce(createSelectChain([publishedEvent]))
        .mockReturnValueOnce(createSelectChain([{ total: 3 }]))
        .mockReturnValueOnce(createSelectChain([{ email: 'buyer@example.com' }]));
      insertReturningMock.mockResolvedValueOnce([sampleTicket]);

      const result = await service.purchase(
        { eventId: 'evt-1', quantity: 2 },
        'user-1',
      );

      expect(dbMock.transaction).toHaveBeenCalledTimes(1);
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.TICKET_PURCHASED,
        expect.objectContaining({
          ticketId: sampleTicket.id,
          ticketCode: sampleTicket.ticketCode,
          eventId: sampleTicket.eventId,
          eventTitle: publishedEvent.title,
          userId: sampleTicket.userId,
          email: 'buyer@example.com',
          quantity: 2,
          totalPrice: 100,
        }),
      );
      expect(result).toEqual({
        message: 'Tickets purchased successfully',
        ticket: sampleTicket,
        remainingTickets: 5,
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([]));

      await expect(
        service.purchase({ eventId: 'missing', quantity: 1 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is not published', async () => {
      dbMock.select.mockReturnValueOnce(
        createSelectChain([{ ...publishedEvent, status: 'DRAFT' }]),
      );

      await expect(
        service.purchase({ eventId: 'evt-1', quantity: 1 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if requested quantity exceeds remaining capacity', async () => {
      dbMock.select
        .mockReturnValueOnce(createSelectChain([publishedEvent]))
        .mockReturnValueOnce(createSelectChain([{ total: 9 }]));

      await expect(
        service.purchase({ eventId: 'evt-1', quantity: 2 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMyTicket', () => {
    it('should return tickets purchased by user', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([sampleTicket]));

      const result = await service.findMyTicket('user-1');

      expect(result).toEqual([sampleTicket]);
    });
  });

  describe('findOne', () => {
    it('should return ticket belonging to user', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([sampleTicket]));

      const result = await service.findOne('tkt-1', 'user-1');

      expect(result).toEqual(sampleTicket);
    });

    it('should throw NotFoundException when ticket is not found', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([]));

      await expect(service.findOne('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if ticket belongs to another user', async () => {
      dbMock.select.mockReturnValueOnce(
        createSelectChain([{ ...sampleTicket, userId: 'other-user' }]),
      );

      await expect(service.findOne('tkt-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('cancel', () => {
    it('should update ticket status to CANCELLED and emit TICKET_CANCELLED with user email', async () => {
      dbMock.select
        .mockReturnValueOnce(createSelectChain([sampleTicket]))
        .mockReturnValueOnce(createSelectChain([{ email: 'buyer@example.com' }]));
      updateReturningMock.mockResolvedValueOnce([
        { ...sampleTicket, status: 'CANCELLED' },
      ]);

      const result = await service.cancel('tkt-1', 'user-1');

      expect(updateSetMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CANCELLED' }),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.TICKET_CANCELLED,
        expect.objectContaining({
          ticketId: sampleTicket.id,
          eventId: sampleTicket.eventId,
          userId: sampleTicket.userId,
          email: 'buyer@example.com',
        }),
      );
      expect(result).toEqual({ message: 'Ticket Cancelled successfully' });
    });

    it('should throw NotFoundException if ticket not found', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([]));

      await expect(service.cancel('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own ticket', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([sampleTicket]));

      await expect(service.cancel('tkt-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if ticket is already CANCELLED', async () => {
      dbMock.select.mockReturnValueOnce(
        createSelectChain([{ ...sampleTicket, status: 'CANCELLED' }]),
      );

      await expect(service.cancel('tkt-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if ticket is already CHECKED_IN', async () => {
      dbMock.select.mockReturnValueOnce(
        createSelectChain([{ ...sampleTicket, status: 'CHECKED_IN' }]),
      );

      await expect(service.cancel('tkt-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkIn', () => {
    it('should check in ticket as organizer and emit TICKET_CHECKED_IN', async () => {
      const checkedInAt = new Date();
      dbMock.select
        .mockReturnValueOnce(createSelectChain([sampleTicket]))
        .mockReturnValueOnce(createSelectChain([publishedEvent]));
      updateReturningMock.mockResolvedValueOnce([
        { ...sampleTicket, status: 'CHECKED_IN', checkedInAt },
      ]);

      const result = await service.checkIn(sampleTicket.ticketCode, 'org-1');

      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.TICKET_CHECKED_IN,
        expect.objectContaining({
          ticketId: sampleTicket.id,
          eventId: sampleTicket.eventId,
          userId: sampleTicket.userId,
        }),
      );
      expect(result).toEqual({
        message: 'Ticket checked in successfully',
        ticket: {
          id: sampleTicket.id,
          eventId: sampleTicket.eventId,
          userId: sampleTicket.userId,
          status: 'CHECKED_IN',
          quantity: sampleTicket.quantity,
          checkedInAt,
          ticketCode: sampleTicket.ticketCode,
        },
      });
    });

    it('should throw NotFoundException if ticket code is not found', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([]));

      await expect(service.checkIn('INVALID', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if caller is not the organizer', async () => {
      dbMock.select
        .mockReturnValueOnce(createSelectChain([sampleTicket]))
        .mockReturnValueOnce(createSelectChain([publishedEvent]));

      await expect(
        service.checkIn(sampleTicket.ticketCode, 'wrong-organizer'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if ticket is already CANCELLED', async () => {
      dbMock.select
        .mockReturnValueOnce(
          createSelectChain([{ ...sampleTicket, status: 'CANCELLED' }]),
        )
        .mockReturnValueOnce(createSelectChain([publishedEvent]));

      await expect(
        service.checkIn(sampleTicket.ticketCode, 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findEventTickets', () => {
    it('should return tickets for event organizer', async () => {
      dbMock.select
        .mockReturnValueOnce(createSelectChain([publishedEvent]))
        .mockReturnValueOnce(createSelectChain([sampleTicket]));

      const result = await service.findEventTickets('evt-1', 'org-1');

      expect(result).toEqual([sampleTicket]);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([]));

      await expect(
        service.findEventTickets('missing', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not the organizer', async () => {
      dbMock.select.mockReturnValueOnce(createSelectChain([publishedEvent]));

      await expect(
        service.findEventTickets('evt-1', 'wrong-org'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
