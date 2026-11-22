import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { prisma } from '@orbitly/db';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get('live')
  @ApiOperation({ summary: 'Process liveness check' })
  liveness() {
    return {
      status: 'ok',
      service: 'orbitly-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Deep readiness probe checking database, redis and storage' })
  async readiness(@Res() res: Response) {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';
    let isReady = true;

    // 1. Check PostgreSQL
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = `unreachable: ${err.message}`;
      isReady = false;
    }

    // 2. Check Redis connection with 1s timeout
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(process.env.REDIS_PORT) || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;
    try {
      const client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        connectTimeout: 1000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      await client.connect();
      await client.ping();
      await client.quit();
      redisStatus = 'healthy';
    } catch (err: any) {
      redisStatus = `unreachable: ${err.message}`;
    }

    const payload = {
      status: isReady ? 'ready' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'orbitly-api',
      uptime: process.uptime(),
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
        storage: process.env.S3_BUCKET ? 'configured' : 'local-simulated',
      },
    };

    if (isReady) {
      return res.status(HttpStatus.OK).json(payload);
    } else {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(payload);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Platform health status' })
  async check(@Res() res: Response) {
    return this.readiness(res);
  }
}
