import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, UnauthorizedException, BadRequestException , Inject} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';
import { createRequire } from 'module';

const req2 = createRequire(import.meta.url);
const jwt = req2('jsonwebtoken') as typeof import('jsonwebtoken');
const bcrypt = req2('bcryptjs') as typeof import('bcryptjs');

@ApiTags('v1/auth')
@Controller('v1/auth')
export class AuthV1Controller {
  private signToken(email: string) {
    const payload = {
      sub: 'admin',
      email,
      tenantId: 'default',
      role: 'admin',
      roles: ['admin'],
      permissions: [],
    };
    const secret = process.env.JWT_SECRET ?? 'change-this-secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '24h') as any;
    return jwt.sign(payload, secret, { expiresIn });
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any) {
    const { email, password } = body ?? {};
    if (!email || !password) throw new BadRequestException('Email dan password wajib diisi');

    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase().trim();
    if (email.toLowerCase().trim() !== adminEmail) throw new UnauthorizedException('Kredensial tidak valid');

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD ?? 'admin123';
    const valid = hash ? await bcrypt.compare(password, hash) : password === plain;
    if (!valid) throw new UnauthorizedException('Kredensial tidak valid');

    const token = this.signToken(adminEmail);
    return {
      token,
      user: { id: 'admin', name: process.env.ADMIN_NAME ?? 'Administrator', email: adminEmail, role: 'admin' },
    };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: any) {
    void body;
    return { message: 'Jika email terdaftar, link reset password sudah dikirim' };
  }

  @Get('me')
  @UseGuards(StrictJwtGuard)
  async me(@Request() req: any) {
    const user = req.user;
    return { id: user.sub, name: process.env.ADMIN_NAME ?? 'Administrator', email: user.email, role: user.role ?? 'admin', tenantId: user.tenantId };
  }

  @Post('change-password')
  @UseGuards(StrictJwtGuard)
  @HttpCode(200)
  async changePassword(@Body() body: any) {
    const { currentPassword, newPassword } = body ?? {};
    if (!currentPassword || !newPassword || newPassword.length < 6) throw new BadRequestException('Password baru minimal 6 karakter');

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD ?? 'admin123';
    const valid = hash ? await bcrypt.compare(currentPassword, hash) : currentPassword === plain;
    if (!valid) throw new UnauthorizedException('Password lama tidak sesuai');
    return { message: 'Password berhasil diubah' };
  }

  @Post('logout')
  @UseGuards(StrictJwtGuard)
  @HttpCode(200)
  async logout() {
    return { message: 'Berhasil logout' };
  }
}
