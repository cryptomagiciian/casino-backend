import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
// import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
// import * as compression from 'compression';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  // const logger = app.get(Logger);
  // app.useLogger(logger);

  // Security middleware
  app.use(helmet());
  // app.use(compression());

  // CORS - Allow multiple origins including Lovable preview URLs
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
  const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed origin or is a Lovable domain
      const isLovable = origin.includes('.lovable.app') || origin.includes('.lovableproject.com');
      const isAllowed = allowedOrigins.includes(origin) || isLovable;
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Casino API')
    .setDescription('Production-grade mini-casino backend with multi-asset balances and provably fair games')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}/${apiPrefix}`);
  console.log(`📚 Swagger documentation: http://0.0.0.0:${port}/docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
