import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class CommentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(entityType: string, entityId: string) {
    return this.prisma.tmsComment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: any, userId: string) {
    const { entityType, entityId, body, authorName } = dto;
    return this.prisma.tmsComment.create({
      data: { entityType, entityId, authorId: userId, authorName: authorName ?? 'User', body },
    });
  }

  async update(id: string, body: string, userId: string) {
    const comment = await this.prisma.tmsComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment tidak ditemukan');
    if (comment.authorId !== userId) throw new ForbiddenException('Tidak bisa edit comment orang lain');
    return this.prisma.tmsComment.update({ where: { id }, data: { body } });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.tmsComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment tidak ditemukan');
    if (comment.authorId !== userId) throw new ForbiddenException('Tidak bisa hapus comment orang lain');
    await this.prisma.tmsComment.delete({ where: { id } });
    return { success: true };
  }
}
