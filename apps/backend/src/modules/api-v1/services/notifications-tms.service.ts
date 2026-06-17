import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class NotificationsTmsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.tmsUserNotification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async markRead(id: string, userId: string) {
    const n = await this.prisma.tmsUserNotification.findFirst({ where: { id, userId } });
    if (!n) return { success: false };
    await this.prisma.tmsUserNotification.update({ where: { id }, data: { read: true } });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.tmsUserNotification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.tmsUserNotification.count({ where: { userId, read: false } });
    return { count };
  }
}
