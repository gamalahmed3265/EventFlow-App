import { Controller, Get, Logger } from '@nestjs/common';
import { NotificationsServiceService } from './notifications-service.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/kafka';

@Controller()
export class NotificationsServiceController {
  constructor(private readonly notificationsServiceService: NotificationsServiceService) {}
  private readonly logger=new Logger(NotificationsServiceService.name)

  @Get('health')
  healthCheck(){
    return {
      status :"Ok" ,service:"Notifications Service "
    }
  }

    @EventPattern(KAFKA_TOPICS.USER_REGISTERED)
    async handleUserRegistered(@Payload() data:{
      userId:string,email:string,name:string
    }){
      this.logger.log(`Received User Register Event: ${JSON.stringify(data)}`)
      await this.notificationsServiceService.sendWelcomeEmail(data)
    }


  @EventPattern(KAFKA_TOPICS.TICKET_PURCHASED)
  async handleTicketPurchased(
    @Payload()
    data:{
      ticketId:string,
      ticketCode:string,
      userId:string,
      quantity:number,
      totalPrice:number,
      eventId:string
    }
  ){
    this.logger.log(`Received Tikect purchase event : ${JSON.stringify(data)}`)
    await this.notificationsServiceService.sendTicketPurchasedEmail(data);
  }

  @EventPattern(KAFKA_TOPICS.TICKET_CANCELLED)
  async handleTicketCancelled(@Payload() data:{ticketId:string,userId:string}){
    
    this.logger.log(
      `Received Ticket Cancellation Event: ${JSON.stringify(data)}`
    )
    await this.notificationsServiceService.sendTicketCancelledEmail(data)
  }
} 
