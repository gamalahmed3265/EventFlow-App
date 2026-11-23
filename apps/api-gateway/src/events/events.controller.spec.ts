import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from '@app/common';

describe('EventsController (API Gateway)', () => {
  let controller: EventsController;
  let eventsService: jest.Mocked<EventsService>;

  beforeEach(async () => {
    const mockEventsService = {
      createEvent: jest.fn(),
      findAllEvents: jest.fn(),
      findEventsByOrganizer: jest.fn(),
      findMyEvents: jest.fn(),
      findEventById: jest.fn(),
      updateEvent: jest.fn(),
      publishEvent: jest.fn(),
      cancelEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createEvent using authenticated req.user.userId', async () => {
    const dto: CreateEventDto = {
      title: 'Tech Conf',
      description: 'Annual conf',
      date: '2026-12-01T10:00:00Z',
      location: 'Cairo',
      capacity: 100,
      price: 50,
    };
    const expected = { id: 'evt-1', ...dto } as any;
    eventsService.createEvent.mockResolvedValue(expected);

    const result = await controller.createEvent(dto, {
      user: { userId: 'user-1', role: 'user' },
    });

    expect(eventsService.createEvent).toHaveBeenCalledWith(dto, 'user-1');
    expect(result).toEqual(expected);
  });

  it('should call findAllEvents', async () => {
    const expected = [{ id: 'evt-1' }] as any;
    eventsService.findAllEvents.mockResolvedValue(expected);

    const result = await controller.findAllEvents();

    expect(eventsService.findAllEvents).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should call findEventsByOrganizer', async () => {
    const expected = [{ id: 'evt-1', organizerId: 'org-1' }];
    eventsService.findEventsByOrganizer.mockResolvedValue(expected);

    const result = await controller.findEventsByOrganizer('org-1');

    expect(eventsService.findEventsByOrganizer).toHaveBeenCalledWith('org-1');
    expect(result).toEqual(expected);
  });

  it('should call findMyEvents using authenticated req.user.userId', async () => {
    const expected = [{ id: 'evt-1' }] as any;
    eventsService.findMyEvents.mockResolvedValue(expected);

    const result = await controller.findMyEvents({
      user: { userId: 'user-1' },
    });

    expect(eventsService.findMyEvents).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });

  it('should call findEventById', async () => {
    const expected = { id: 'evt-1' } as any;
    eventsService.findEventById.mockResolvedValue(expected);

    const result = await controller.findEventById('evt-1');

    expect(eventsService.findEventById).toHaveBeenCalledWith('evt-1');
    expect(result).toEqual(expected);
  });

  it('should call updateEvent using verified JWT userId and role', async () => {
    const dto: UpdateEventDto = { title: 'Updated Title' };
    const expected = { id: 'evt-1', title: 'Updated Title' } as any;
    eventsService.updateEvent.mockResolvedValue(expected);

    const result = await controller.updateEvent('evt-1', dto, {
      user: { userId: 'user-1', role: 'admin' },
    });

    expect(eventsService.updateEvent).toHaveBeenCalledWith(
      'evt-1',
      dto,
      'user-1',
      'admin',
    );
    expect(result).toEqual(expected);
  });

  it('should call publishEvent using verified JWT userId and role', async () => {
    const expected = { id: 'evt-1', status: 'PUBLISHED' } as any;
    eventsService.publishEvent.mockResolvedValue(expected);

    const result = await controller.publishEvent('evt-1', {
      user: { userId: 'user-1', role: 'user' },
    });

    expect(eventsService.publishEvent).toHaveBeenCalledWith(
      'evt-1',
      'user-1',
      'user',
    );
    expect(result).toEqual(expected);
  });

  it('should call cancelEvent using verified JWT userId and role', async () => {
    const expected = { id: 'evt-1', status: 'CANCELED' } as any;
    eventsService.cancelEvent.mockResolvedValue(expected);

    const result = await controller.cancelEvent('evt-1', {
      user: { userId: 'user-1', role: 'admin' },
    });

    expect(eventsService.cancelEvent).toHaveBeenCalledWith(
      'evt-1',
      'user-1',
      'admin',
    );
    expect(result).toEqual(expected);
  });
});
