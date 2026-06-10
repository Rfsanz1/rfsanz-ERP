import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-this-secret',
    });
  }

  async validate(payload: { sub: string; email: string; tenantId?: string; roles?: string[]; permissions?: string[] }) {
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  }
}
