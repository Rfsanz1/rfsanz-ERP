import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import * as bcrypt from 'bcryptjs';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(companyName: string) {
    const baseSlug = this.slugify(companyName) || 'tenant';
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
    return slug;
  }

  async register(dto: RegisterTenantDto) {
    const email = dto.email.toLowerCase().trim();
    const ownerExists = await this.prisma.user.findFirst({ where: { email, isOwner: true } });
    if (ownerExists) {
      throw new ConflictException('Email sudah terdaftar sebagai owner di perusahaan lain');
    }

    const slug = await this.generateUniqueSlug(dto.companyName);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        slug,
        email,
        phone: dto.phone,
        plan: dto.plan ?? 'trial',
        trialEndsAt,
      },
    });

    const permissions = await this.prisma.permission.findMany();
    const allPermissionKeys = permissions.map((permission) => `${permission.module}.${permission.action}`);

    const rolesMap = {
      Administrator: allPermissionKeys,
      'Report Reader': ['reporting.view', 'reporting.export', 'dashboard.view'],
      Banker: [
        'finance.view',
        'finance.create',
        'finance.edit',
        'finance.delete',
        'accounting.view',
        'accounting.create',
        'accounting.edit',
        'accounting.delete',
        'reporting.view',
        'dashboard.view',
      ],
      Sales: [
        'sales.view',
        'sales.create',
        'sales.edit',
        'sales.delete',
        'sales.approve',
        'invoice.view',
        'invoice.create',
        'invoice.edit',
        'invoice.delete',
        'invoice.approve',
        'crm.view',
        'crm.create',
        'crm.edit',
        'crm.delete',
        'dashboard.view',
      ],
      Purchasing: [
        'purchasing.view',
        'purchasing.create',
        'purchasing.edit',
        'purchasing.delete',
        'purchasing.approve',
        'inventory.view',
        'dashboard.view',
      ],
      'Warehouse Staff': [
        'inventory.view',
        'inventory.create',
        'inventory.edit',
        'inventory.delete',
        'inventory.export',
        'dashboard.view',
      ],
    } as Record<string, string[]>;

    const roles = await Promise.all(
      Object.keys(rolesMap).map((name) =>
        this.prisma.role.create({
          data: {
            tenantId: tenant.id,
            name,
            description: `${name} default role for tenant ${tenant.name}`,
            isDefault: true,
          },
        }),
      ),
    );

    const rolePermissions = roles.flatMap((role) => {
      const allowedKeys = new Set(rolesMap[role.name] ?? []);
      return permissions
        .filter((permission) => allowedKeys.has(`${permission.module}.${permission.action}`))
        .map((permission) => ({ roleId: role.id, permissionId: permission.id, allowed: true }));
    });

    if (rolePermissions.length > 0) {
      await this.prisma.rolePermission.createMany({ data: rolePermissions, skipDuplicates: true });
    }

    const adminRole = roles.find((role) => role.name === 'Administrator');
    if (!adminRole) {
      throw new NotFoundException('Administrator role gagal dibuat');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const owner = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: dto.ownerName,
        email,
        password,
        isActive: true,
        isOwner: true,
        roleId: adminRole.id,
      },
    });

    return { tenant, owner, adminRole, permissions };
  }

  async checkSlug(slug: string) {
    if (!slug) {
      return { available: false, message: 'Slug harus diisi' };
    }
    const normalized = this.slugify(slug);
    const exists = await this.prisma.tenant.findUnique({ where: { slug: normalized } });
    return { available: !exists, slug: normalized };
  }

  async getTenantProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan');
    return tenant;
  }

  async updateTenantProfile(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan');
    return this.prisma.tenant.update({ where: { id: tenantId }, data: dto });
  }

  async getTenantStats(tenantId: string) {
    const [userCount, activeRoles] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.role.count({ where: { tenantId } }),
    ]);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, trialEndsAt: true } });
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan');
    return {
      tenant: {
        plan: tenant.plan,
        trialEndsAt: tenant.trialEndsAt,
      },
      users: userCount,
      roles: activeRoles,
      trialRemainingDays: tenant.trialEndsAt ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
    };
  }
}
