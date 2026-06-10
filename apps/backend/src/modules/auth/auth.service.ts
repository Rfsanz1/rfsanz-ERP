import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import { TenantService } from '../tenant/tenant.service.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  private buildJwtPayload(user: any, roleName: string, permissions: string[]) {
    return {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      roles: [roleName],
      permissions,
    };
  }

  private signTokens(payload: any) {
    const secret = process.env.JWT_SECRET || 'change-this-secret';
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
    const refreshToken = this.jwtService.sign(
      { sub: payload.sub, email: payload.email, tenantId: payload.tenantId, roleId: payload.roleId },
      { secret: process.env.JWT_REFRESH_SECRET || secret, expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new BadRequestException('Email tidak valid');
    }
    if (!password || typeof password !== 'string') {
      throw new BadRequestException('Password harus diisi');
    }

    const users = await this.prisma.user.findMany({
      where: { email: email.toLowerCase().trim(), isActive: true },
      include: {
        tenant: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    const matches = [];
    for (const candidate of users) {
      if (await bcrypt.compare(password, candidate.password)) {
        matches.push(candidate);
      }
    }

    if (matches.length === 0) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    return matches;
  }

  async login(email: string, password: string) {
    const matches = await this.validateUser(email, password);
    if (matches.length > 1) {
      return {
        selectTenant: true,
        tenants: matches.map((user) => ({
          tenantId: user.tenantId,
          tenantName: user.tenant?.name,
          slug: user.tenant?.slug,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role?.name,
          isOwner: user.isOwner,
        })),
      };
    }

    const user = matches[0];
    const roleName = user.role?.name ?? 'user';
    const permissions = user.role?.permissions?.map((rp) => `${rp.permission.module}.${rp.permission.action}`) ?? [];
    const payload = this.buildJwtPayload(user, roleName, permissions);
    const { accessToken, refreshToken } = this.signTokens(payload);

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        roleId: user.roleId,
        role: roleName,
        roles: [roleName],
        permissions,
      },
      tenant: {
        id: user.tenant?.id,
        name: user.tenant?.name,
        slug: user.tenant?.slug,
        plan: user.tenant?.plan,
        trialEndsAt: user.tenant?.trialEndsAt,
      },
    };
  }

  async selectTenant(email: string, password: string, tenantId: string) {
    const matches = await this.validateUser(email, password);
    const user = matches.find((item) => item.tenantId === tenantId);
    if (!user) {
      throw new UnauthorizedException('Tenant tidak valid atau kredensial salah');
    }

    const roleName = user.role?.name ?? 'user';
    const permissions = user.role?.permissions?.map((rp) => `${rp.permission.module}.${rp.permission.action}`) ?? [];
    const payload = this.buildJwtPayload(user, roleName, permissions);
    const { accessToken, refreshToken } = this.signTokens(payload);

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        roleId: user.roleId,
        role: roleName,
        roles: [roleName],
        permissions,
      },
      tenant: {
        id: user.tenant?.id,
        name: user.tenant?.name,
        slug: user.tenant?.slug,
        plan: user.tenant?.plan,
        trialEndsAt: user.tenant?.trialEndsAt,
      },
    };
  }

  async register(dto: RegisterDto) {
    const result = await this.tenantService.register(dto);
    const user = result.owner;
    const tenant = result.tenant;
    const roleName = result.adminRole.name;
    const permissions = result.permissions.map((permission) => `${permission.module}.${permission.action}`);
    const payload = this.buildJwtPayload(user, roleName, permissions);
    const { accessToken, refreshToken } = this.signTokens(payload);

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: tenant.id,
        roleId: user.roleId,
        role: roleName,
        roles: [roleName],
        permissions,
      },
      tenant,
    };
  }

  async logout(userId: string) {
    return { message: 'Logout berhasil', data: null };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email: email.toLowerCase().trim(), isActive: true } });
    if (!user) {
      return { message: 'Jika email terdaftar, link reset akan dikirim', data: null };
    }

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    console.log(`[FORGOT PASSWORD] Reset token for ${email}: ${token}`);

    return {
      message: 'Link reset password telah dikirim ke email Anda',
      data: process.env.NODE_ENV === 'development' ? { token, expiresAt } : null,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new BadRequestException('Token harus diisi');
    if (!newPassword || newPassword.length < 6) throw new BadRequestException('Password minimal 6 karakter');

    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt) throw new BadRequestException('Token tidak valid atau sudah digunakan');
    if (resetToken.expiresAt < new Date()) throw new BadRequestException('Token sudah kadaluarsa');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } });
    await this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });

    return { message: 'Password berhasil direset. Silakan login kembali', data: null };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    if (!oldPassword) throw new BadRequestException('Password lama harus diisi');
    if (!newPassword || newPassword.length < 6) throw new BadRequestException('Password baru minimal 6 karakter');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new UnauthorizedException('Password lama tidak sesuai');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return { message: 'Password berhasil diubah', data: null };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change-this-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      if (!user) throw new UnauthorizedException('User tidak ditemukan');

      const roleName = user.role?.name ?? 'user';
      const permissions = user.role?.permissions?.map((rp) => `${rp.permission.module}.${rp.permission.action}`) ?? [];
      const secret = process.env.JWT_SECRET || 'change-this-secret';

      const accessToken = this.jwtService.sign(
        this.buildJwtPayload(user, roleName, permissions),
        { secret, expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
      );

      return { accessToken, refreshToken: token };
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }
}
