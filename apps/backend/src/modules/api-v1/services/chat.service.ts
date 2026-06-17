import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class ChatService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createRoom(dto: any) {
    const existing = dto.entityId
      ? await this.prisma.tmsChatRoom.findFirst({ where: { type: dto.type, entityId: dto.entityId } })
      : null;
    if (existing) return { roomId: existing.id };
    const room = await this.prisma.tmsChatRoom.create({ data: { type: dto.type, entityId: dto.entityId } });
    return { roomId: room.id };
  }

  async getRooms() {
    return this.prisma.tmsChatRoom.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getMessages(roomId: string, query: any) {
    const limit = Number(query.limit || 50);
    const room = await this.prisma.tmsChatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room tidak ditemukan');
    const where: any = { roomId };
    if (query.before) where.createdAt = { lt: new Date(query.before) };
    return this.prisma.tmsChatMessage.findMany({ where, take: limit, orderBy: { createdAt: 'desc' } });
  }

  async createMessage(roomId: string, senderId: string, body: string, senderName?: string) {
    const room = await this.prisma.tmsChatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room tidak ditemukan');
    return this.prisma.tmsChatMessage.create({
      data: { roomId, senderId, senderName: senderName ?? 'User', senderType: 'user', body },
    });
  }
}
