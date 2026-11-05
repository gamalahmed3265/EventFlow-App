import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const port = process.env.API_GATEWAY_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API Gateway is running on port ${port}`, 'Bootstrap');
}
void bootstrap();
