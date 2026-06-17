import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');

@Injectable()
export class StrictJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authHeader.slice(7);
    try {
      const secret = process.env.JWT_SECRET || 'change-this-secret';
      const payload = jwt.verify(token, secret) as any;
      request.user = {
        sub: payload.sub ?? payload.userId,
        userId: payload.sub ?? payload.userId,
        email: payload.email,
        role: payload.role ?? payload.roles?.[0] ?? 'admin',
        tenantId: payload.tenantId ?? 'default',
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
