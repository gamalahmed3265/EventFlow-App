import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateEventDto, EventReponse, SERVICE_PORTS, UpdateEventDto } from '@app/common';

@Injectable()
export class EventsService {
  private readonly eventsServiceUrl = `http://localhost:${SERVICE_PORTS.EVENT_SERVICE}`;

  constructor(private readonly httpService: HttpService) {}

  async createEvent(data: CreateEventDto, userId: string):Promise<EventReponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<EventReponse>(this.eventsServiceUrl, data, {
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

  async findAllEvents():Promise<EventReponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<EventReponse[]>(this.eventsServiceUrl),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findEventsByOrganizer(organizerId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.eventsServiceUrl}/organizer/${organizerId}`,
        ),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findMyEvents(userId: string):Promise<EventReponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<EventReponse[]>(`${this.eventsServiceUrl}/my-events`, {
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

  async findEventById(id: string):Promise<EventReponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<EventReponse>(`${this.eventsServiceUrl}/${id}`),
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
  ):Promise<EventReponse> {
    try {
      const headers: Record<string, string> = {
        'x-user-id': userId,
      };
      if (userRole) {
        headers['x-user-role'] = userRole;
      }
      const response = await firstValueFrom(
        this.httpService.patch<EventReponse>(`${this.eventsServiceUrl}/${id}`, data, {
          headers,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async publishEvent(id: string, userId: string, userRole?: string):Promise<EventReponse> {
    try {
      const headers: Record<string, string> = {
        'x-user-id': userId,
      };
      if (userRole) {
        headers['x-user-role'] = userRole;
      }
      const response = await firstValueFrom(
        this.httpService.patch<EventReponse>(
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

  async cancelEvent(id: string, userId: string, userRole?: string):Promise<EventReponse>{
    try {
      const headers: Record<string, string> = {
        'x-user-id': userId,
      };
      if (userRole) {
        headers['x-user-role'] = userRole;
      }
      const response = await firstValueFrom(
        this.httpService.patch<EventReponse>(
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
