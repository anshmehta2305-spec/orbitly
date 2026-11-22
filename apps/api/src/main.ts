import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

// Load .env if present
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../..', '.env'),
  path.resolve(__dirname, '../../..', '.env'),
  path.resolve(__dirname, '../../../..', '.env'),
];
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // Continue search
    }
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { validateProductionSecrets } from './common/security/startup-validation';
import { OrbitlyStructuredLogger } from './common/logger/structured-logger';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  // 1. Fail-fast validation of required production secrets
  validateProductionSecrets();

  const logger = new OrbitlyStructuredLogger();
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Enable graceful shutdown hooks for SIGTERM / SIGINT
  app.enableShutdownHooks();

  // 2. Correlation ID Middleware
  const correlationMiddleware = new CorrelationIdMiddleware();
  app.use((req: any, res: any, next: any) => correlationMiddleware.use(req, res, next));

  // Response-time tracking & slow-endpoint guardrail (> 200ms)
  app.use((req: any, res: any, next: any) => {
    const start = performance.now();
    res.on('finish', () => {
      const duration = Math.round(performance.now() - start);
      if (duration > 200) {
        logger.warn(`🐢 [SLOW API] ${req.method} ${req.originalUrl || req.url} took ${duration}ms [status: ${res.statusCode}]`);
      }
    });
    next();
  });

  // 3. Cookie parser & secure headers
  app.use(cookieParser());

  // Security Headers Middleware
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    next();
  });

  // 4. CORS locked to configured allowed origins
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or in whitelist
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.orbitly.app')) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-Id', 'Idempotency-Key'],
  });

  // 5. Global Validation Pipe with Mass Assignment Prevention
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exception Filter for structured errors & correlation tracking
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 6. Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Orbitly Public & Internal API')
    .setDescription('Production-grade API for the Orbitly Social Media Scheduling & Publishing Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.API_PORT || process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Orbitly API running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`📚 Swagger OpenAPI documentation available at http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
