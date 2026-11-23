import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule, ObserveInstrument } from './app.module';
import { SERVICE_PORTS } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // Security headers & hide Express fingerprint
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp.disable === 'function') {
    expressApp.disable('x-powered-by');
  }
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Enable CORS
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Swagger Documentation Setup (disabled in production unless explicitly enabled)
  const isSwaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true';
  if (isSwaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('API Gateway')
      .setDescription('API Gateway for EventFlow')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Enable Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT) || SERVICE_PORTS.API_GATEWAY;
  await app.listen(port);
  Logger.log(
    `API Gateway is running on http://localhost:${port}`,
    'Bootstrap',
  );
  if (isSwaggerEnabled) {
    Logger.log(
      `Swagger Docs available at http://localhost:${port}/docs`,
      'Bootstrap',
    );
  }
}
void bootstrap();
