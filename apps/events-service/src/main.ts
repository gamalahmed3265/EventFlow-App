import { NestFactory } from '@nestjs/core';
import { EventsServiceModule } from './events-service.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SERVICE_PORTS } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(EventsServiceModule);

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Events Service API')
    .setDescription('Events Service with Kafka Event Streaming')
    .setVersion('1.0')
    .addTag('Events')
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

  await app.listen(SERVICE_PORTS.EVENT_SERVICE);
  Logger.log(
    `EventsService is running on http://localhost:${SERVICE_PORTS.EVENT_SERVICE}`,
    'Bootstrap',
  );
  Logger.log(
    `Swagger Docs available at http://localhost:${SERVICE_PORTS.EVENT_SERVICE}/docs`,
    'Bootstrap',
  );
}
void bootstrap();
