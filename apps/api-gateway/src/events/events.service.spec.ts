import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { EventsService } from './events.service';
import { CreateEventDto, SERVICE_PORTS, UpdateEventDto } from '@app/common';

describe('EventsService (API Gateway)', () => {
  let service: EventsService;
  let httpService: { post: jest.Mock; get: jest.Mock; patch: jest.Mock };

  const baseUrl = `http://localhost:${SERVICE_PORTS.EVENT_SERVICE}`;

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should forward createEvent with x-user-id header', async () => {
    const dto: CreateEventDto = {
      title: 'Tech Conf',
      date: '2026-12-01T10:00:00Z',
      location: 'Cairo',
      capacity: 100,
    };
    const expected = { id: 'evt-1', ...dto };
    httpService.post.mockReturnValue(of({ data: expected }));

    const result = await service.createEvent(dto, 'user-1');

    expect(httpService.post).toHaveBeenCalledWith(baseUrl, dto, {
      headers: { 'x-user-id': 'user-1' },
    });
    expect(result).toEqual(expected);
  });

  it('should forward findAllEvents', async () => {
    const expected = [{ id: 'evt-1' }];
    httpService.get.mockReturnValue(of({ data: expected }));

    const result = await service.findAllEvents();

    expect(httpService.get).toHaveBeenCalledWith(baseUrl);
    expect(result).toEqual(expected);
  });

  it('should forward findEventsByOrganizer', async () => {
    const expected = [{ id: 'evt-1' }];
    httpService.get.mockReturnValue(of({ data: expected }));

    const result = await service.findEventsByOrganizer('org-1');

    expect(httpService.get).toHaveBeenCalledWith(`${baseUrl}/organizer/org-1`);
    expect(result).toEqual(expected);
  });

  it('should forward findMyEvents with x-user-id header', async () => {
    const expected = [{ id: 'evt-1' }];
    httpService.get.mockReturnValue(of({ data: expected }));

    const result = await service.findMyEvents('user-1');

    expect(httpService.get).toHaveBeenCalledWith(`${baseUrl}/my-events`, {
      headers: { 'x-user-id': 'user-1' },
    });
    expect(result).toEqual(expected);
  });

  it('should forward findEventById', async () => {
    const expected = { id: 'evt-1' };
    httpService.get.mockReturnValue(of({ data: expected }));

    const result = await service.findEventById('evt-1');

    expect(httpService.get).toHaveBeenCalledWith(`${baseUrl}/evt-1`);
    expect(result).toEqual(expected);
  });

  it('should forward updateEvent with x-user-id and x-user-role headers', async () => {
    const dto: UpdateEventDto = { title: 'New Title' };
    const expected = { id: 'evt-1', title: 'New Title' };
    httpService.patch.mockReturnValue(of({ data: expected }));

    const result = await service.updateEvent('evt-1', dto, 'user-1', 'ADMIN');

    expect(httpService.patch).toHaveBeenCalledWith(`${baseUrl}/evt-1`, dto, {
      headers: { 'x-user-id': 'user-1', 'x-user-role': 'ADMIN' },
    });
    expect(result).toEqual(expected);
  });

  it('should omit x-user-role when not provided in updateEvent', async () => {
    const dto: UpdateEventDto = { title: 'New Title' };
    httpService.patch.mockReturnValue(of({ data: { id: 'evt-1' } }));

    await service.updateEvent('evt-1', dto, 'user-1');

    expect(httpService.patch).toHaveBeenCalledWith(`${baseUrl}/evt-1`, dto, {
      headers: { 'x-user-id': 'user-1' },
    });
  });

  it('should forward publishEvent', async () => {
    const expected = { id: 'evt-1', status: 'PUBLISHED' };
    httpService.patch.mockReturnValue(of({ data: expected }));

    const result = await service.publishEvent('evt-1', 'user-1', 'ADMIN');

    expect(httpService.patch).toHaveBeenCalledWith(
      `${baseUrl}/evt-1/publish`,
      {},
      { headers: { 'x-user-id': 'user-1', 'x-user-role': 'ADMIN' } },
    );
    expect(result).toEqual(expected);
  });

  it('should forward cancelEvent', async () => {
    const expected = { id: 'evt-1', status: 'CANCELED' };
    httpService.patch.mockReturnValue(of({ data: expected }));

    const result = await service.cancelEvent('evt-1', 'user-1');

    expect(httpService.patch).toHaveBeenCalledWith(
      `${baseUrl}/evt-1/cancel`,
      {},
      { headers: { 'x-user-id': 'user-1' } },
    );
    expect(result).toEqual(expected);
  });

  it('should forward downstream HTTP error from events-service', async () => {
    httpService.get.mockReturnValue(
      throwError(() => ({
        response: { status: 404, data: { message: 'Event not found' } },
      })),
    );

    await expect(service.findEventById('missing')).rejects.toThrow(
      new HttpException({ message: 'Event not found' }, 404),
    );
  });

  it('should throw 503 when events-service is unavailable', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('ECONNREFUSED')),
    );

    await expect(service.findAllEvents()).rejects.toThrow(
      new HttpException('Events service unavailable', 503),
    );
  });
});

