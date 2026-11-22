import { NestFactory } from '@nestjs/core';
import { NotificationsServiceModule } from './notifications-service.module';
import { SERVICE_PORTS } from '@app/common';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {MicroserviceOptions,Transport} from "@nestjs/microservices"
import {KAFKA_BROKER,KAFKA_CLIENT_ID} from "@app/kafka"
async function bootstrap() {
  const app = await NestFactory.create(NotificationsServiceModule);
  // connect kafka microservices for consuming events

  app.connectMicroservice<MicroserviceOptions>({
    transport:Transport.KAFKA,
    options:{
      client:{
        clientId:`${KAFKA_CLIENT_ID}-notifications`,
        brokers:[KAFKA_BROKER]
      },
      consumer:{
        groupId: `${KAFKA_CLIENT_ID}-notifications-consumer`
      }
    }
  });
  await app.startAllMicroservices();
  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Notifications Service API')
    .setDescription('Notifications Service with Kafka Notifications Streaming')
    .setVersion('1.0')
    .addTag('Notifications')
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
 await app.listen(SERVICE_PORTS.NOTIFICATION_SERVICE);
  Logger.log(
    `Notifications Service is running on http://localhost:${SERVICE_PORTS.NOTIFICATION_SERVICE}`,
    'Bootstrap',
  );
  Logger.log(
    `Swagger Docs available at http://localhost:${SERVICE_PORTS.NOTIFICATION_SERVICE}/docs`,
    'Bootstrap',
  );
}
bootstrap();