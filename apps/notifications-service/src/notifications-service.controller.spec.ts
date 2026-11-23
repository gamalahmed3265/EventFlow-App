import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NotificationsServiceController } from './notifications-service.controller';
import { NotificationsServiceService } from './notifications-service.service';

describe('NotificationsServiceController', () => {
  let controller: NotificationsServiceController;
  let service: jest.Mocked<NotificationsServiceService>;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    const mockNotificationsService = {
      sendWelcomeEmail: jest.fn(),
      sendTicketPurchasedEmail: jest.fn(),
      sendTicketCancelledEmail: jest.fn(),
      sendEventCancelledEmail: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsServiceController],
      providers: [
        {
          provide: NotificationsServiceService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = app.get<NotificationsServiceController>(
      NotificationsServiceController,
    );
    service = app.get(NotificationsServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return ok status on healthCheck', () => {
    expect(controller.healthCheck()).toEqual({
      status: 'Ok',
      service: 'Notifications Service',
    });
  });

  it('should handle user-registered event and call sendWelcomeEmail', async () => {
    const payload = {
      userId: 'user-1',
      email: 'user@example.com',
      name: 'John Doe',
    };
    service.sendWelcomeEmail.mockResolvedValue(undefined);

    await controller.handleUserRegistered(payload);

    expect(service.sendWelcomeEmail).toHaveBeenCalledWith(payload);
  });

  it('should handle ticket-purchased event and call sendTicketPurchasedEmail', async () => {
    const payload = {
      ticketId: 'tkt-1',
      ticketCode: 'ABC123',
      userId: 'user-1',
      email: 'buyer@example.com',
      eventTitle: 'Tech Conf',
      quantity: 2,
      totalPrice: 100,
      eventId: 'evt-1',
    };
    service.sendTicketPurchasedEmail.mockResolvedValue(undefined);

    await controller.handleTicketPurchased(payload);

    expect(service.sendTicketPurchasedEmail).toHaveBeenCalledWith(payload);
  });

  it('should handle ticket-cancelled event and call sendTicketCancelledEmail', async () => {
    const payload = {
      ticketId: 'tkt-1',
      userId: 'user-1',
      email: 'buyer@example.com',
    };
    service.sendTicketCancelledEmail.mockResolvedValue(undefined);

    await controller.handleTicketCancelled(payload);

    expect(service.sendTicketCancelledEmail).toHaveBeenCalledWith(payload);
  });

  it('should handle event-canceled event and call sendEventCancelledEmail', async () => {
    const payload = {
      eventId: 'evt-1',
      organizerId: 'org-1',
      email: 'org@example.com',
      title: 'Tech Summit',
    };
    service.sendEventCancelledEmail.mockResolvedValue(undefined);

    await controller.handleEventCancelled(payload);

    expect(service.sendEventCancelledEmail).toHaveBeenCalledWith({
      eventId: 'evt-1',
      organizerId: 'org-1',
      email: 'org@example.com',
      eventTitle: 'Tech Summit',
    });
  });
});
