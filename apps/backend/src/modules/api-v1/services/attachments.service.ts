import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', '..', 'uploads');

@Injectable()
export class AttachmentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(entityType: string, entityId: string) {
    return this.prisma.tmsAttachment.findMany({ where: { entityType, entityId }, orderBy: { createdAt: 'asc' } });
  }

  async create(file: Express.Multer.File, dto: any, uploadedBy?: string) {
    const { entityType, entityId, description } = dto;
    return this.prisma.tmsAttachment.create({
      data: { entityType, entityId, fileName: file.originalname, mimeType: file.mimetype, fileSize: file.size, storagePath: file.filename, uploadedBy, description },
    });
  }

  async findOne(id: string) {
    const att = await this.prisma.tmsAttachment.findUnique({ where: { id } });
    if (!att) throw new NotFoundException('Attachment tidak ditemukan');
    return att;
  }

  getFilePath(storagePath: string) {
    return path.join(UPLOADS_DIR, storagePath);
  }

  async remove(id: string) {
    const att = await this.findOne(id);
    const filePath = this.getFilePath(att.storagePath);
    try { fs.unlinkSync(filePath); } catch { /* file already gone */ }
    await this.prisma.tmsAttachment.delete({ where: { id } });
    return { deleted: true };
  }
}
