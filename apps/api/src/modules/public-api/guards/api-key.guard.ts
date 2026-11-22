import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { prisma, PlanTier } from '@orbitly/db';
import { hashApiKey, hasScope, PLAN_SPECS, ApiKeyScope } from '@orbitly/shared';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

// In-memory sliding window rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'MISSING_API_KEY',
        message: 'API Key must be provided as Bearer token in Authorization header.',
        requestId: request.headers['x-request-id'] || `req_${Date.now()}`,
      });
    }

    const rawKey = authHeader.replace('Bearer ', '').trim();
    const keyHash = hashApiKey(rawKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        workspace: {
          include: { subscription: true },
        },
      },
    });

    if (!apiKey) {
      throw new UnauthorizedException({
        code: 'INVALID_API_KEY',
        message: 'The provided API key is invalid or unrecognized.',
        requestId: request.headers['x-request-id'] || `req_${Date.now()}`,
      });
    }

    // Revocation check
    if (apiKey.revokedAt) {
      throw new UnauthorizedException({
        code: 'KEY_REVOKED',
        message: 'This API key has been revoked and can no longer be used.',
        revokedAt: apiKey.revokedAt,
      });
    }

    // Expiry check
    if (apiKey.expiresAt && apiKey.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        code: 'KEY_EXPIRED',
        message: 'This API key has expired.',
        expiresAt: apiKey.expiresAt,
      });
    }

    // IP allowlist check
    if (apiKey.ipAllowlist && apiKey.ipAllowlist.length > 0) {
      const clientIp = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
      const isAllowed = apiKey.ipAllowlist.some((ip: string) => String(clientIp).includes(ip));
      if (!isAllowed) {
        throw new ForbiddenException({
          code: 'IP_NOT_ALLOWED',
          message: `Client IP ${clientIp} is not authorized for this API key.`,
        });
      }
    }

    // Rate Limiting based on Plan Tier
    const planKey = (apiKey.workspace.subscription?.planKey as PlanTier) || PlanTier.FREE;
    const planSpecs = PLAN_SPECS[planKey];
    const maxReqsPerMin = planSpecs.limits.apiRequestsPerMin || 60;

    const now = Date.now();
    let rl = rateLimits.get(apiKey.id);
    if (!rl || rl.resetAt < now) {
      rl = { count: 1, resetAt: now + 60000 };
      rateLimits.set(apiKey.id, rl);
    } else {
      rl.count++;
    }

    const remaining = Math.max(0, maxReqsPerMin - rl.count);
    const resetSeconds = Math.ceil((rl.resetAt - now) / 1000);

    // Attach standard rate-limit headers
    response.setHeader('X-RateLimit-Limit', maxReqsPerMin);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', rl.resetAt);

    if (rl.count > maxReqsPerMin) {
      response.setHeader('Retry-After', resetSeconds);
      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `API rate limit of ${maxReqsPerMin} req/min exceeded. Upgrade your plan for higher throughput.`,
          limit: maxReqsPerMin,
          retryAfterSeconds: resetSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Scope check
    const requiredScopes = this.reflector.getAllAndOverride<ApiKeyScope[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredScopes && requiredScopes.length > 0) {
      for (const scope of requiredScopes) {
        if (!hasScope(apiKey.scopes, scope)) {
          throw new ForbiddenException({
            code: 'INSUFFICIENT_SCOPE',
            message: `This endpoint requires scope '${scope}'. Granted scopes: [${apiKey.scopes.join(', ')}]`,
          });
        }
      }
    }

    // Fire & forget update lastUsedAt
    prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    // Attach workspace and key to request
    request.apiKey = apiKey;
    request.workspace = apiKey.workspace;
    request.workspaceId = apiKey.workspaceId;

    return true;
  }
}
