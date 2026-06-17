import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRequire } from 'module';
import * as bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');

@Injectable()
export class FleetbaseAdapterService {
  private getJwtSecret(): string {
    return process.env.JWT_SECRET || 'change-this-secret';
  }

  private signToken(payload: object): string {
    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
    });
  }

  private verifyToken(token: string): any {
    return jwt.verify(token, this.getJwtSecret());
  }

  async login(identity: string, password: string): Promise<object> {
    if (!identity || !password) {
      return { errors: ['Identity and password are required'] };
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
    if (identity.toLowerCase().trim() !== adminEmail) {
      return { errors: ['Invalid credentials'] };
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD || 'admin123';
    const valid = hash
      ? await bcrypt.compare(password, hash)
      : password === plain;

    if (!valid) {
      return { errors: ['Invalid credentials'] };
    }

    const payload = {
      sub: 'admin',
      email: adminEmail,
      tenantId: 'default',
      roles: ['admin'],
      permissions: [],
    };

    const token = this.signToken(payload);
    return { token, user: 'admin' };
  }

  session(authHeader: string | undefined): object {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { restore: false, error: 'No token provided' };
    }

    const token = authHeader.slice(7);
    try {
      this.verifyToken(token);
      return { restore: true, token, user: 'admin' };
    } catch {
      return { restore: false, error: 'Session expired' };
    }
  }

  logout(): object {
    return { status: 'ok' };
  }

  getMe(authHeader: string | undefined): object {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.slice(7);
    try {
      this.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Token expired or invalid');
    }

    return {
      data: {
        id: 'admin',
        type: 'user',
        attributes: {
          name: process.env.ADMIN_NAME || 'Administrator',
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
          avatar_url: null,
          is_admin: true,
          company_uuid: 'default',
          company_name: process.env.COMPANY_NAME || 'RFSANZ',
        },
      },
    };
  }

  checkTwoFa(): object {
    return { isTwoFaEnabled: false, twoFaSession: null };
  }

  getLocale(): object {
    return { locale: 'en-us' };
  }

  getOrganizations(authHeader: string | undefined): object {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        this.verifyToken(token);
      } catch {
        return { data: [] };
      }
    }

    return {
      data: [
        {
          id: 'default',
          type: 'company',
          attributes: {
            name: process.env.COMPANY_NAME || 'RFSANZ',
          },
        },
      ],
    };
  }
}
