import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.seedDefaultTenant();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async seedDefaultTenant() {
    try {
      await (this as any).tenant.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          name: process.env.COMPANY_NAME || 'Gentong Mas',
          slug: 'default',
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
        },
      });
    } catch {
      // ignore if tenant already seeded
    }
  }
}
