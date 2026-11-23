import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NotificationsServiceModule } from './notifications-service.module';
import { SERVICE_PORTS } from '@app/common';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsServiceModule);
  const configService = app.get(ConfigService);

  const kafkaBroker = configService.get<string>(
    'KAFKA_BROKER',
    'localhost:9092',
  );
  const kafkaClientId = configService.get<string>(
    'KAFKA_CLIENT_ID',
    'eventflow-app',
  );

  // Connect Kafka microservice for consuming events
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: `${kafkaClientId}-notifications`,
        brokers: [kafkaBroker],
      },
      consumer: {
        groupId: `${kafkaClientId}-notifications-consumer`,
      },
    },
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
    `Kafka consumer connected to ${kafkaBroker}`,
    'Bootstrap',
  );
  Logger.log(
    `Swagger Docs available at http://localhost:${SERVICE_PORTS.NOTIFICATION_SERVICE}/docs`,
    'Bootstrap',
  );
}
void bootstrap();
