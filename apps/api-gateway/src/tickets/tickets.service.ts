import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  CheckTicketDto,
  PurchaseTicketDto,
  SERVICE_PORTS,
  TicketResponse,
} from '@app/common';

@Injectable()
export class TicketsService {
  private readonly ticketsServiceUrl =
    process.env.TICKETS_SERVICE_URL ||
    `http://localhost:${SERVICE_PORTS.TICKET_SERVICE}`;

  constructor(private readonly httpService: HttpService) {}

  async purchase(data: PurchaseTicketDto, userId: string):Promise<TicketResponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<TicketResponse[]>(`${this.ticketsServiceUrl}/purchase`, data, {
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

  async findMyTickets(userId: string):Promise<TicketResponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<TicketResponse[]>(`${this.ticketsServiceUrl}/my-tickets`, {
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

  async findEventTickets(eventId: string, organizerId: string):Promise<TicketResponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<TicketResponse[]>(`${this.ticketsServiceUrl}/event/${eventId}`, {
          headers: {
            'x-user-id': organizerId,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async checkIn(data: CheckTicketDto, organizerId: string):Promise<TicketResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<TicketResponse>(`${this.ticketsServiceUrl}/check-in`, data, {
          headers: {
            'x-user-id': organizerId,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOne(id: string, userId: string):Promise<TicketResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<TicketResponse>(`${this.ticketsServiceUrl}/${id}`, {
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

  async cancel(id: string, userId: string):Promise<TicketResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.patch<TicketResponse>(
          `${this.ticketsServiceUrl}/${id}/cancel`,
          {},
          {
            headers: {
              'x-user-id': userId,
            },
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
    throw new HttpException('Tickets service unavailable', 503);
  }
}

