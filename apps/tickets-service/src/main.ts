import { NestFactory } from '@nestjs/core';
import { TicketsServiceModule } from './tickets-service.module';
import { SERVICE_PORTS } from '@app/common';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(TicketsServiceModule);
  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Ticket Service API')
    .setDescription('Ticket Service with Kafka Ticket Streaming')
    .setVersion('1.0')
    .addTag('Ticket')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

    // Enable Validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
 await app.listen(SERVICE_PORTS.TICKET_SERVICE);
  Logger.log(
    `TicketService is running on http://localhost:${SERVICE_PORTS.TICKET_SERVICE}`,
    'Bootstrap',
  );
  Logger.log(
    `Swagger Docs available at http://localhost:${SERVICE_PORTS.TICKET_SERVICE}/docs`,
    'Bootstrap',
  );
}
bootstrap();
