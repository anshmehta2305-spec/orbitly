import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check Authorization header first, then cookie
    let token: string | undefined;
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies && request.cookies.orbitly_access_token) {
      token = request.cookies.orbitly_access_token;
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-orbitly-1234567890';
      const decoded = jwt.verify(token, secret);
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Authentication token is invalid or expired');
    }
  }
}
