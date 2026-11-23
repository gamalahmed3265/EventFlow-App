import { Test, TestingModule } from '@nestjs/testing';
import { TicketsServiceController } from './tickets-service.controller';
import { TicketsServiceService } from './tickets-service.service';
import { CheckTicketDto, PurchaseTicketDto } from '@app/common';

describe('TicketsServiceController', () => {
  let controller: TicketsServiceController;
  let service: jest.Mocked<TicketsServiceService>;

  beforeEach(async () => {
    const mockTicketsService = {
      purchase: jest.fn(),
      findMyTicket: jest.fn(),
      findEventTickets: jest.fn(),
      checkIn: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [TicketsServiceController],
      providers: [
        {
          provide: TicketsServiceService,
          useValue: mockTicketsService,
        },
      ],
    }).compile();

    controller = app.get<TicketsServiceController>(TicketsServiceController);
    service = app.get(TicketsServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call purchase', async () => {
    const dto: PurchaseTicketDto = { eventId: 'evt-1', quantity: 2 };
    const expected = {
      message: 'Tickets purchased successfully',
      ticket: { id: 'tkt-1' },
      remainingTickets: 8,
    } as any;
    service.purchase.mockResolvedValue(expected);

    const result = await controller.purchase(dto, 'user-1');

    expect(service.purchase).toHaveBeenCalledWith(dto, 'user-1');
    expect(result).toEqual(expected);
  });

  it('should call findMyTicket', async () => {
    const expected = [{ id: 'tkt-1' }] as any;
    service.findMyTicket.mockResolvedValue(expected);

    const result = await controller.findMyTickets('user-1');

    expect(service.findMyTicket).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });

  it('should call findEventTickets', async () => {
    const expected = [{ id: 'tkt-1' }] as any;
    service.findEventTickets.mockResolvedValue(expected);

    const result = await controller.findEventTickets('evt-1', 'org-1');

    expect(service.findEventTickets).toHaveBeenCalledWith('evt-1', 'org-1');
    expect(result).toEqual(expected);
  });

  it('should call checkIn with ticketCode and organizerId', async () => {
    const dto: CheckTicketDto = { ticketCode: 'ABC123DEF456' };
    const expected = { message: 'Ticket checked in successfully' } as any;
    service.checkIn.mockResolvedValue(expected);

    const result = await controller.checkIn(dto, 'org-1');

    expect(service.checkIn).toHaveBeenCalledWith('ABC123DEF456', 'org-1');
    expect(result).toEqual(expected);
  });

  it('should call findOne', async () => {
    const expected = { id: 'tkt-1' } as any;
    service.findOne.mockResolvedValue(expected);

    const result = await controller.findOne('tkt-1', 'user-1');

    expect(service.findOne).toHaveBeenCalledWith('tkt-1', 'user-1');
    expect(result).toEqual(expected);
  });

  it('should call cancel', async () => {
    const expected = { message: 'Ticket Cancelled successfully' };
    service.cancel.mockResolvedValue(expected);

    const result = await controller.cancel('tkt-1', 'user-1');

    expect(service.cancel).toHaveBeenCalledWith('tkt-1', 'user-1');
    expect(result).toEqual(expected);
  });
});
