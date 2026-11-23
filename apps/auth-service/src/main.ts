import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthServiceModule } from './auth-service.module';
import { SERVICE_PORTS } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Auth Service with Kafka Event Streaming')
    .setVersion('1.0')
    .addTag('Auth')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Enable Validation
  app.useGlobalPipes(
   new ValidationPipe({
     whitelist:true,
    transform:true,
    forbidNonWhitelisted:true
   }),
  );
  await app.listen(SERVICE_PORTS.AUTH_SERVICE);
  Logger.log(`AuthService is running on http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`, 'Bootstrap');
  Logger.log(
    `Swagger Docs available at http://localhost:${SERVICE_PORTS.AUTH_SERVICE}/docs`,
    'Bootstrap',
  );
}
void bootstrap();
