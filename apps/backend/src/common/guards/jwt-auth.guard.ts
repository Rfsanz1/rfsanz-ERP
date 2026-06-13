import { Injectable, ExecutionContext } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader: string | undefined = request.headers?.['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.slice(7);
    if (!token) return true;

    try {
      const secret = process.env.JWT_SECRET || 'change-this-secret';
      const payload = jwt.verify(token, secret) as any;
      request.user = {
        userId: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
      };
    } catch {
      // Invalid token — don't set user, let downstream guards decide
    }

    return true;
  }
}
