import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NotificationsServiceService } from './notifications-service.service';
import { EmailService } from './email.service';

describe('NotificationsServiceService', () => {
  let service: NotificationsServiceService;
  let emailService: { sendEmail: jest.Mock };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsServiceService,
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<NotificationsServiceService>(
      NotificationsServiceService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with recipient name and userId', async () => {
      await service.sendWelcomeEmail({
        email: 'user@example.com',
        userId: 'user-1',
        name: 'John Doe',
      });

      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, html] = emailService.sendEmail.mock.calls[0];
      expect(to).toBe('user@example.com');
      expect(subject).toContain('Welcome to EventFlow');
      expect(html).toContain('John Doe');
      expect(html).toContain('user-1');
    });
  });

  describe('sendTicketPurchasedEmail', () => {
    it('should send ticket confirmation email with formatted price and escaped HTML', async () => {
      await service.sendTicketPurchasedEmail({
        userId: 'user-1',
        email: 'buyer@example.com',
        ticketCode: 'CODE123',
        eventTitle: 'Rock & Roll <Live>',
        quantity: 2,
        totalPrice: 150,
      });

      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, html] = emailService.sendEmail.mock.calls[0];
      expect(to).toBe('buyer@example.com');
      expect(subject).toBe('Ticket Purchase Confirmed - Rock & Roll <Live>');
      expect(html).toContain('Rock &amp; Roll &lt;Live&gt;');
      expect(html).toContain('CODE123');
      expect(html).toContain('$150.00');
    });

    it('should skip sending email when no email is provided', async () => {
      await service.sendTicketPurchasedEmail({
        userId: 'user-1',
        ticketCode: 'CODE123',
        quantity: 1,
        totalPrice: 50,
      });

      expect(emailService.sendEmail).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });
  });

  describe('sendTicketCancelledEmail', () => {
    it('should send cancellation email to provided address', async () => {
      await service.sendTicketCancelledEmail({
        ticketId: 'tkt-1',
        userId: 'user-1',
        email: 'buyer@example.com',
      });

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'buyer@example.com',
        'Ticket Cancelled',
        expect.stringContaining('tkt-1'),
      );
    });

    it('should skip sending email when email is omitted', async () => {
      await service.sendTicketCancelledEmail({
        ticketId: 'tkt-2',
        userId: 'user-1',
      });

      expect(emailService.sendEmail).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });
  });

  describe('sendEventCancelledEmail', () => {
    it('should send event cancellation email to organizer email (not UUID)', async () => {
      await service.sendEventCancelledEmail({
        eventId: 'evt-1',
        eventTitle: 'Tech Summit',
        organizerId: 'org-uuid-1',
        email: 'org@example.com',
      });

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'org@example.com',
        'Event Cancelled - Tech Summit',
        expect.stringContaining('evt-1'),
      );
    });

    it('should skip sending email when organizer email is omitted', async () => {
      await service.sendEventCancelledEmail({
        eventId: 'evt-1',
        eventTitle: 'Tech Summit',
        organizerId: 'org-uuid-1',
      });

      expect(emailService.sendEmail).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });

    it('should log and rethrow error when emailService fails', async () => {
      emailService.sendEmail.mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        service.sendEventCancelledEmail({
          eventId: 'evt-1',
          organizerId: 'org-uuid-1',
          email: 'org@example.com',
        }),
      ).rejects.toThrow('SMTP down');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
