import { IsNotEmpty, IsString } from 'class-validator';

export class CheckTicketDto {
  @IsString({ message: 'Ticket Code Must be a String' })
  @IsNotEmpty({
    message: 'Event ID is required',
  })
  ticketCode: string;
}
