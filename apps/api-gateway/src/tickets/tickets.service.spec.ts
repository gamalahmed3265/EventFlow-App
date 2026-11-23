import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TicketsService } from './tickets.service';
import { CheckTicketDto, PurchaseTicketDto, SERVICE_PORTS } from '@app/common';

describe('TicketsService (API Gateway)', () => {
  let service: TicketsService;
  let httpService: { post: jest.Mock; get: jest.Mock; patch: jest.Mock };

  const baseUrl = `http://localhost:${SERVICE_PORTS.TICKET_SERVICE}`;

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should forward purchase to tickets-service', async () => {
    const dto: PurchaseTicketDto = { eventId: 'evt-1', quantity: 2 };
    const expected = { message: 'Tickets purchased successfully' };
    httpService.post.mockReturnValue(of({ data: expected }));

    const result = await service.purchase(dto, 'user-1');

    expect(httpService.post).toHaveBeenCalledWith(`${baseUrl}/purchase`, dto, {
      headers: { 'x-user-id': 'user-1' },
    });
    expect(result).toEqual(expected);
  });

  it('should forward findMyTickets to tickets-service', async () => {
    const expected = [{ id: 'tkt-1' }];
    httpService.get.mockReturnValue(of({ data: expected }));

    const result = await service.findMyTickets('user-1');

    expect(httpService.get).toHaveBeenCalledWith(`${baseUrl}/my-tickets`, {
      headers: { 'x-user-id': 'user-1' },
    });
    expect(result).toEqual(expected);
  });

  it('should forward findEventTickets to tickets-service', async () => {
    const expected = [{ id: 'tkt-1' }];
    httpService.get.mockReturnValue(of({ data: expected }));

    const result = await service.findEventTickets('evt-1', 'org-1');

    expect(httpService.get).toHaveBeenCalledWith(`${baseUrl}/event/evt-1`, {
      headers: { 'x-user-id': 'org-1' },
    });
    expect(result).toEqual(expected);
  });

  it('should forward checkIn to tickets-service', async () => {
    const dto: CheckTicketDto = { ticketCode: 'ABC123' };
    const expected = { message: 'Ticket checked in successfully' };
    httpService.post.mockReturnValue(of({ data: expected }));

    const result = await service.checkIn(dto, 'org-1');

    expect(httpService.post).toHaveBeenCalledWith(`${baseUrl}/check-in`, dto, {
      headers: { 'x-user-id': 'org-1' },
    });
    expect(result).toEqual(expected);
  });

  it('should forward findOne to tickets-service', async () => {
    const expected = { id: 'tkt-1' };
    httpService.get.mockReturnValue(of({ data: expected }));

    const result = await service.findOne('tkt-1', 'user-1');

    expect(httpService.get).toHaveBeenCalledWith(`${baseUrl}/tkt-1`, {
      headers: { 'x-user-id': 'user-1' },
    });
    expect(result).toEqual(expected);
  });

  it('should forward cancel to tickets-service', async () => {
    const expected = { message: 'Ticket Cancelled successfully' };
    httpService.patch.mockReturnValue(of({ data: expected }));

    const result = await service.cancel('tkt-1', 'user-1');

    expect(httpService.patch).toHaveBeenCalledWith(
      `${baseUrl}/tkt-1/cancel`,
      {},
      { headers: { 'x-user-id': 'user-1' } },
    );
    expect(result).toEqual(expected);
  });

  it('should forward downstream HTTP error from tickets-service', async () => {
    httpService.post.mockReturnValue(
      throwError(() => ({
        response: { status: 400, data: { message: 'Only 1 tickets remaining' } },
      })),
    );

    await expect(
      service.purchase({ eventId: 'evt-1', quantity: 5 }, 'user-1'),
    ).rejects.toThrow(
      new HttpException({ message: 'Only 1 tickets remaining' }, 400),
    );
  });

  it('should throw 503 when tickets-service is unavailable', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('ECONNREFUSED')),
    );

    await expect(service.findMyTickets('user-1')).rejects.toThrow(
      new HttpException('Tickets service unavailable', 503),
    );
  });
});

