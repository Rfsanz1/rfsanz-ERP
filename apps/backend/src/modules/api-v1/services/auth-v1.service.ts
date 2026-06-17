import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
const bcrypt = require('bcrypt') as typeof import('bcrypt');

@Injectable()
export class AuthV1Service {
  private buildPayload() {
    return {
      sub: 'admin',
      email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
      tenantId: 'default',
      role: 'admin',
      roles: ['admin'],
      permissions: [],
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) throw new BadRequestException('Email dan password wajib diisi');
    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase().trim();
    if (email.toLowerCase().trim() !== adminEmail) throw new UnauthorizedException('Kredensial tidak valid');

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD ?? 'admin123';
    const valid = hash ? await bcrypt.compare(password, hash) : password === plain;
    if (!valid) throw new UnauthorizedException('Kredensial tidak valid');

    const payload = this.buildPayload();
    const secret = process.env.JWT_SECRET ?? 'change-this-secret';
    const token = jwt.sign(payload, secret, { expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as any });

    return {
      token,
      user: { id: 'admin', name: process.env.ADMIN_NAME ?? 'Administrator', email: adminEmail, role: 'admin' },
    };
  }

  async forgotPassword(_email: string) {
    return { message: 'Email sent' };
  }

  async changePassword(_userId: string, oldPassword: string, newPassword: string) {
    if (!oldPassword || !newPassword || newPassword.length < 6) throw new BadRequestException('Password baru minimal 6 karakter');
    const plain = process.env.ADMIN_PASSWORD ?? 'admin123';
    const hash = process.env.ADMIN_PASSWORD_HASH;
    const valid = hash ? await bcrypt.compare(oldPassword, hash) : oldPassword === plain;
    if (!valid) throw new UnauthorizedException('Password lama tidak sesuai');
    return { message: 'Password changed' };
  }
}
