import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      roles: [user.role?.name ?? 'user'],
      permissions: user.role?.permissions.map((rp) => rp.permission.name) ?? [],
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
  }

  async findAll(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role?.name,
      roleId: u.roleId,
      active: u.isActive,
      createdAt: u.createdAt,
    }));
  }

  async create(dto: { name: string; email: string; password: string; roleId: string; tenantId: string }) {
    const existing = await this.prisma.user.findFirst({ where: { tenantId: dto.tenantId, email: dto.email } });
    if (existing) throw new ConflictException('Email sudah terdaftar');
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role || role.tenantId !== dto.tenantId) throw new NotFoundException('Role tidak ditemukan');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        roleId: dto.roleId,
        tenantId: dto.tenantId,
        isActive: true,
      },
      include: { role: true },
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
      roleId: user.roleId,
      active: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async update(
    id: string,
    dto: { name?: string; email?: string; password?: string; roleId?: string },
    tenantId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User tidak ditemukan');
    if (dto.email && dto.email !== user.email) {
      const conflict = await this.prisma.user.findFirst({ where: { tenantId, email: dto.email } });
      if (conflict) throw new ConflictException('Email sudah digunakan');
    }
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role || role.tenantId !== tenantId) throw new NotFoundException('Role tidak ditemukan');
    }
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    if (dto.roleId) data.roleId = dto.roleId;
    const updated = await this.prisma.user.update({ where: { id }, data, include: { role: true } });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role?.name,
      roleId: updated.roleId,
      active: updated.isActive,
      createdAt: updated.createdAt,
    };
  }

  async toggleActive(id: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User tidak ditemukan');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: { role: true },
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role?.name,
      roleId: updated.roleId,
      active: updated.isActive,
      createdAt: updated.createdAt,
    };
  }

  async remove(id: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User tidak ditemukan');
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
