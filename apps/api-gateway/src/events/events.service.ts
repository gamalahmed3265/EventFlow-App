import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateEventDto, SERVICE_PORTS, UpdateEventDto } from '@app/common';

@Injectable()
export class EventsService {
  private readonly eventsServiceUrl = `http://localhost:${SERVICE_PORTS.EVENT_SERVICE}/events`;

  constructor(private readonly httpService: HttpService) {}

  async createEvent(data: CreateEventDto, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.eventsServiceUrl, data, {
          headers: {
            'x-user-id': userId,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAllEvents() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.eventsServiceUrl),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findEventsByOrganizer(organizerId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.eventsServiceUrl}/organizer/${organizerId}`),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findEventById(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.eventsServiceUrl}/${id}`),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateEvent(
    id: string,
    data: UpdateEventDto,
    userId: string,
    userRole?: string,
  ) {
    try {
      const headers: Record<string, string> = {
        'x-user-id': userId,
      };
      if (userRole) {
        headers['x-user-role'] = userRole;
      }
      const response = await firstValueFrom(
        this.httpService.patch(`${this.eventsServiceUrl}/${id}`, data, {
          headers,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async publishEvent(id: string, userId: string, userRole?: string) {
    try {
      const headers: Record<string, string> = {
        'x-user-id': userId,
      };
      if (userRole) {
        headers['x-user-role'] = userRole;
      }
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.eventsServiceUrl}/${id}/publish`,
          {},
          {
            headers,
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async cancelEvent(id: string, userId: string, userRole?: string) {
    try {
      const headers: Record<string, string> = {
        'x-user-id': userId,
      };
      if (userRole) {
        headers['x-user-role'] = userRole;
      }
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.eventsServiceUrl}/${id}/cancel`,
          {},
          {
            headers,
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    if (error.response) {
      throw new HttpException(error.response.data, error.response.status);
    }
    throw new HttpException('Events service unavailable', 503);
  }
}
