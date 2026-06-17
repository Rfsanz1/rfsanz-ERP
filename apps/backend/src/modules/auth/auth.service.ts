import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');

@Injectable()
export class AuthService {

  private buildPayload() {
    return {
      sub: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      tenantId: 'default',
      roleId: 'admin',
      roles: ['admin'],
      permissions: [],
    };
  }

  private signTokens(payload: any) {
    const secret = process.env.JWT_SECRET || 'change-this-secret';
    const accessToken = jwt.sign(payload, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
    });
    const refreshToken = jwt.sign(
      { sub: payload.sub, email: payload.email },
      process.env.JWT_REFRESH_SECRET || secret,
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  private buildUserResponse() {
    const { accessToken, refreshToken } = this.signTokens(this.buildPayload());
    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: 'admin',
        name: process.env.ADMIN_NAME || 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        tenantId: 'default',
        roleId: 'admin',
        role: 'admin',
        roles: ['admin'],
        permissions: [],
      },
      tenant: {
        id: 'default',
        name: process.env.COMPANY_NAME || 'RFSANZ',
        slug: 'rfsanz',
        plan: 'enterprise',
        trialEndsAt: null,
      },
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) throw new BadRequestException('Email dan password wajib diisi');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
    if (email.toLowerCase().trim() !== adminEmail) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD || 'admin123';

    const valid = hash
      ? await bcrypt.compare(password, hash)
      : password === plain;

    if (!valid) throw new UnauthorizedException('Kredensial tidak valid');

    return this.buildUserResponse();
  }

  async selectTenant(email: string, password: string, _tenantId: string) {
    return this.login(email, password);
  }

  async register(_dto: any) {
    return { message: 'Pendaftaran tidak tersedia dalam mode ini. Gunakan ADMIN_EMAIL & ADMIN_PASSWORD di .env', data: null };
  }

  async logout(_userId: string) {
    return { message: 'Logout berhasil', data: null };
  }

  async forgotPassword(_email: string) {
    return { message: 'Fitur reset password: ubah ADMIN_PASSWORD di file .env server Anda', data: null };
  }

  async resetPassword(_token: string, _newPassword: string) {
    return { message: 'Fitur reset password: ubah ADMIN_PASSWORD di file .env server Anda', data: null };
  }

  async changePassword(_userId: string, oldPassword: string, newPassword: string) {
    if (!oldPassword || !newPassword || newPassword.length < 6)
      throw new BadRequestException('Password baru minimal 6 karakter');

    const plain = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = process.env.ADMIN_PASSWORD_HASH;
    const valid = hash ? await bcrypt.compare(oldPassword, hash) : oldPassword === plain;
    if (!valid) throw new UnauthorizedException('Password lama tidak sesuai');

    const newHash = await bcrypt.hash(newPassword, 10);
    console.log(`[CHANGE PASSWORD] Set ADMIN_PASSWORD_HASH=${newHash} di .env Anda`);
    return { message: `Password baru: set ADMIN_PASSWORD_HASH=${newHash} di file .env server`, data: null };
  }

  async refreshToken(token: string) {
    try {
      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change-this-secret';
      jwt.verify(token, secret);
      const payload = this.buildPayload();
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'change-this-secret', {
        expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
      });
      return { accessToken, refreshToken: token };
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }
}
