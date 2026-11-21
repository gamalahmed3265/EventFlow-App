import { Test, TestingModule } from '@nestjs/testing';
import { EventsServiceController } from './events-service.controller';
import { EventsServiceService } from './events-service.service';

describe('EventsServiceController', () => {
  let eventsServiceController: EventsServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EventsServiceController],
      providers: [
        {
          provide: EventsServiceService,
          useValue: {
            createEvent: jest.fn(),
            findAllEvents: jest.fn(),
            findEventById: jest.fn(),
            updateEvent: jest.fn(),
            publishEvent: jest.fn(),
            cancelEvent: jest.fn(),
            findEventsByOrganizer: jest.fn(),
          },
        },
      ],
    }).compile();

    eventsServiceController = app.get<EventsServiceController>(
      EventsServiceController,
    );
  });

  it('should be defined', () => {
    expect(eventsServiceController).toBeDefined();
  });
});
