import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module';
import { SERVICE_PORTS } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('API Gateway for EventFlow')
    .setVersion('1.0')
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

  await app.listen(SERVICE_PORTS.API_GATEWAY);
  Logger.log(
    `API Gateway is running on http://localhost:${SERVICE_PORTS.API_GATEWAY}`,
    'Bootstrap',
  );
  Logger.log(
    `Swagger Docs available at http://localhost:${SERVICE_PORTS.API_GATEWAY}/docs`,
    'Bootstrap',
  );
}
void bootstrap();
