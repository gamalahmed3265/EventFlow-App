import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { CheckTicketDto, PurchaseTicketDto } from '@app/common';

describe('TicketsController (API Gateway)', () => {
  let controller: TicketsController;
  let ticketsService: jest.Mocked<TicketsService>;

  beforeEach(async () => {
    const mockTicketsService = {
      purchase: jest.fn(),
      findMyTickets: jest.fn(),
      findEventTickets: jest.fn(),
      checkIn: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    ticketsService = module.get(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate purchase using verified JWT userId', async () => {
    const dto: PurchaseTicketDto = { eventId: 'evt-1', quantity: 2 };
    const expected = [{ id: 'tkt-1' }] as any;
    ticketsService.purchase.mockResolvedValue(expected);

    const result = await controller.purchase(dto, {
      user: { userId: 'user-1' },
    });

    expect(ticketsService.purchase).toHaveBeenCalledWith(dto, 'user-1');
    expect(result).toEqual(expected);
  });

  it('should delegate findMyTickets using verified JWT userId', async () => {
    const expected = [{ id: 'tkt-1' }] as any;
    ticketsService.findMyTickets.mockResolvedValue(expected);

    const result = await controller.findMyTickets({
      user: { userId: 'user-1' },
    });

    expect(ticketsService.findMyTickets).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });

  it('should delegate findEventTickets using verified JWT userId', async () => {
    const expected = [{ id: 'tkt-1' }] as any;
    ticketsService.findEventTickets.mockResolvedValue(expected);

    const result = await controller.findEventTickets('evt-1', {
      user: { userId: 'org-1' },
    });

    expect(ticketsService.findEventTickets).toHaveBeenCalledWith(
      'evt-1',
      'org-1',
    );
    expect(result).toEqual(expected);
  });

  it('should delegate checkIn using verified JWT userId', async () => {
    const dto: CheckTicketDto = { ticketCode: 'ABC123' };
    const expected = { id: 'tkt-1', status: 'CHECKED_IN' } as any;
    ticketsService.checkIn.mockResolvedValue(expected);

    const result = await controller.checkIn(dto, {
      user: { userId: 'org-1' },
    });

    expect(ticketsService.checkIn).toHaveBeenCalledWith(dto, 'org-1');
    expect(result).toEqual(expected);
  });

  it('should delegate findOne using verified JWT userId', async () => {
    const expected = { id: 'tkt-1' } as any;
    ticketsService.findOne.mockResolvedValue(expected);

    const result = await controller.findOne('tkt-1', {
      user: { userId: 'user-1' },
    });

    expect(ticketsService.findOne).toHaveBeenCalledWith('tkt-1', 'user-1');
    expect(result).toEqual(expected);
  });

  it('should delegate cancel using verified JWT userId', async () => {
    const expected = { id: 'tkt-1', status: 'CANCELLED' } as any;
    ticketsService.cancel.mockResolvedValue(expected);

    const result = await controller.cancel('tkt-1', {
      user: { userId: 'user-1' },
    });

    expect(ticketsService.cancel).toHaveBeenCalledWith('tkt-1', 'user-1');
    expect(result).toEqual(expected);
  });
});
