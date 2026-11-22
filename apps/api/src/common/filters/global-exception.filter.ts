import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { z } from '@orbitly/shared';
import { RequestWithCorrelation } from '../middleware/correlation-id.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelation>();

    const requestId =
      request.correlationId ||
      request.header('x-request-id') ||
      request.header('x-correlation-id') ||
      `req_${Date.now()}`;

    response.setHeader('X-Request-Id', requestId);
    response.setHeader('X-Correlation-Id', requestId);

    // 1. Handle Zod Validation Errors -> 400 Bad Request with field-level map
    if (exception instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of exception.issues) {
        const fieldName = issue.path.join('.') || 'root';
        fieldErrors[fieldName] = issue.message;
      }

      this.logger.warn(
        `[RequestId: ${requestId}] Validation error on ${request.method} ${request.url}: ${JSON.stringify(fieldErrors)}`,
      );

      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: fieldErrors,
        requestId,
      });
    }

    // 2. Handle NestJS HttpExceptions (e.g. ConflictException 409, BadRequestException 400)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      let message = exception.message;
      let fieldErrors: Record<string, string> | undefined;

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (resObj.message) {
          message = Array.isArray(resObj.message) ? resObj.message.join(', ') : resObj.message;
        }
        if (resObj.errors) {
          fieldErrors = resObj.errors;
        }
      }

      // If duplicate email conflict, attach email field error
      if (status === HttpStatus.CONFLICT && message.toLowerCase().includes('email')) {
        fieldErrors = { email: message };
      }

      this.logger.warn(`[RequestId: ${requestId}] HTTP ${status} on ${request.method} ${request.url}: ${message}`);

      return response.status(status).json({
        statusCode: status,
        message,
        errors: fieldErrors,
        requestId,
      });
    }

    // 3. Handle Database Connectivity & Prisma Initialization Errors
    const err = exception as Error;
    if (
      err?.message?.includes("Can't reach database server") ||
      err?.name === 'PrismaClientInitializationError'
    ) {
      this.logger.error(
        `[RequestId: ${requestId}] Database unreachable: ${err.message}`,
      );

      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database server is unreachable. Please ensure PostgreSQL is running and accessible.',
        requestId,
      });
    }

    // 4. Handle Unexpected Server Errors -> 500 with requestId, full log server-side
    this.logger.error(
      `[RequestId: ${requestId}] Unhandled Exception on ${request.method} ${request.url}: ${err?.message || exception}`,
      err?.stack || '',
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `An unexpected internal error occurred. Please contact support with reference ID: ${requestId}`,
      requestId,
    });
  }
}
