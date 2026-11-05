import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);
  const port = process.env.AUTH_SERVICE_PORT ?? process.env.PORT ?? 3001;

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Auth Service with Kafka Event Streaming')
    .setVersion('1.0')
    .addTag('Auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  Logger.log(`AuthService is running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(
    `Swagger Docs available at http://localhost:${port}/docs`,
    'Bootstrap',
  );
}
void bootstrap();
