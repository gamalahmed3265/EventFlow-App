import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);
  const port = process.env.AUTH_SERVICE_PORT ?? process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`AuthService is running on http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
