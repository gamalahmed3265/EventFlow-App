import { Test, TestingModule } from '@nestjs/testing';
import { EventsServiceController } from './events-service.controller';
import { EventsServiceService } from './events-service.service';
import { CreateEventDto, UpdateEventDto } from '@app/common';

describe('EventsServiceController', () => {
  let controller: EventsServiceController;
  let service: jest.Mocked<EventsServiceService>;

  beforeEach(async () => {
    const mockEventsService = {
      createEvent: jest.fn(),
      findAllEvents: jest.fn(),
      findEventById: jest.fn(),
      updateEvent: jest.fn(),
      publishEvent: jest.fn(),
      cancelEvent: jest.fn(),
      findEventsByOrganizer: jest.fn(),
      findMyEvents: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [EventsServiceController],
      providers: [
        {
          provide: EventsServiceService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = app.get<EventsServiceController>(EventsServiceController);
    service = app.get(EventsServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an event', async () => {
    const dto: CreateEventDto = {
      title: 'Tech Conf',
      description: 'Desc',
      date: '2026-12-01T10:00:00Z',
      location: 'Cairo',
      capacity: 100,
      price: 50,
    };
    const expected = { id: 'evt-1', ...dto } as any;
    service.createEvent.mockResolvedValue(expected);

    const result = await controller.createEvent(dto, 'org-1');

    expect(service.createEvent).toHaveBeenCalledWith(dto, 'org-1');
    expect(result).toEqual(expected);
  });

  it('should return all published events', async () => {
    const expected = [{ id: 'evt-1' }] as any;
    service.findAllEvents.mockResolvedValue(expected);

    const result = await controller.findAllEvents();

    expect(service.findAllEvents).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return events by organizer', async () => {
    const expected = [{ id: 'evt-1', organizerId: 'org-1' }] as any;
    service.findEventsByOrganizer.mockResolvedValue(expected);

    const result = await controller.findEventsByOrganizer('org-1');

    expect(service.findEventsByOrganizer).toHaveBeenCalledWith('org-1');
    expect(result).toEqual(expected);
  });

  it('should return my events', async () => {
    const expected = [{ id: 'evt-1' }] as any;
    service.findMyEvents.mockResolvedValue(expected);

    const result = await controller.findMyEvents('user-1');

    expect(service.findMyEvents).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });

  it('should return event by id', async () => {
    const expected = { id: 'evt-1' } as any;
    service.findEventById.mockResolvedValue(expected);

    const result = await controller.findEventById('evt-1');

    expect(service.findEventById).toHaveBeenCalledWith('evt-1');
    expect(result).toEqual(expected);
  });

  it('should update event with default USER role when role is empty', async () => {
    const dto: UpdateEventDto = { title: 'Updated' };
    const expected = { id: 'evt-1', title: 'Updated' } as any;
    service.updateEvent.mockResolvedValue(expected);

    const result = await controller.updateEvent('evt-1', dto, 'user-1', '');

    expect(service.updateEvent).toHaveBeenCalledWith(
      'evt-1',
      dto,
      'user-1',
      'USER',
    );
    expect(result).toEqual(expected);
  });

  it('should publish event', async () => {
    const expected = { id: 'evt-1', status: 'PUBLISHED' } as any;
    service.publishEvent.mockResolvedValue(expected);

    const result = await controller.publishEvent('evt-1', 'user-1', 'ADMIN');

    expect(service.publishEvent).toHaveBeenCalledWith(
      'evt-1',
      'user-1',
      'ADMIN',
    );
    expect(result).toEqual(expected);
  });

  it('should cancel event', async () => {
    const expected = { id: 'evt-1', status: 'CANCELED' } as any;
    service.cancelEvent.mockResolvedValue(expected);

    const result = await controller.cancelEvent('evt-1', 'user-1', 'ADMIN');

    expect(service.cancelEvent).toHaveBeenCalledWith(
      'evt-1',
      'user-1',
      'ADMIN',
    );
    expect(result).toEqual(expected);
  });
});
