import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module';
import { SERVICE_PORTS } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // Enable Validation
  app.useGlobalPipes(
   new ValidationPipe({
     whitelist:true,
    transform:true,
    forbidNonWhitelisted:true
   }),
  );


  await app.listen(SERVICE_PORTS.API_GATEWAY);
  Logger.log(`API Gateway is running on port ${SERVICE_PORTS.API_GATEWAY}`, 'Bootstrap');
}
void bootstrap();
