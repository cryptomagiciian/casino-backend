import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
// import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
// import * as compression from 'compression';
import * as crypto from 'crypto';

import { AppModule } from './app.module';

// Polyfill for crypto module if not available
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto as any;
}

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

  // Manual CORS headers as fallback
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log(`🌐 Manual CORS middleware - Origin: ${origin}`);
    
    // Allow specific origins
    const allowedOrigins = [
      'https://dexinocasino.com',
      'https://www.dexinocasino.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    const isLovable = origin && (origin.includes('.lovable.app') || origin.includes('.lovableproject.com'));
    const isAllowed = origin && (allowedOrigins.includes(origin) || isLovable);
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log(`✅ Manual CORS - Allowed origin: ${origin}`);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', '*');
      console.log('✅ Manual CORS - Allowed no origin');
    } else {
      console.log(`❌ Manual CORS - Blocked origin: ${origin}`);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    
    next();
  });

  // CORS - Allow multiple origins including Lovable preview URLs
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
  const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
  
  // Explicit CORS configuration for production
  const allowedOriginsList = [
    'https://dexinocasino.com',
    'https://www.dexinocasino.com',
    'http://localhost:3000',
    'http://localhost:3001',
    ...allowedOrigins
  ];

  app.enableCors({
    origin: (origin, callback) => {
      console.log(`🔍 CORS Request from origin: ${origin}`);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ Allowing request with no origin');
        return callback(null, true);
      }
      
      // Check if origin is in our explicit list
      const isInExplicitList = allowedOriginsList.includes(origin);
      
      // Check if origin is a Lovable domain
      const isLovable = origin.includes('.lovable.app') || origin.includes('.lovableproject.com');
      
      // Check if origin is our custom domain
      const isCustomDomain = origin.includes('dexinocasino.com');
      
      const isAllowed = isInExplicitList || isLovable || isCustomDomain;
      
      console.log(`🔍 CORS Check - Origin: ${origin}`);
      console.log(`   - In explicit list: ${isInExplicitList}`);
      console.log(`   - Is Lovable: ${isLovable}`);
      console.log(`   - Is custom domain: ${isCustomDomain}`);
      console.log(`   - Final decision: ${isAllowed ? 'ALLOW' : 'BLOCK'}`);
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 204
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
