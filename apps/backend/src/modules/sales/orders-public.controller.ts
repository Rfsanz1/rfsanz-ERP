import { Controller, Get, Param, Res, NotFoundException, Inject } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service.js';

@Controller('orders')
export class OrdersPublicController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get(':id/bukti-tf')
  async getBuktiTf(@Param('id') id: string, @Res() res: Response) {
    const order = await this.prisma.order.findUnique({
      where: { id: Number(id) },
      select: { fotoPengiriman: true, namaCustomer: true },
    });
    if (!order || !order.fotoPengiriman) {
      throw new NotFoundException('Foto bukti transfer tidak ditemukan');
    }

    const raw = order.fotoPengiriman as string;
    let mimeType = 'image/jpeg';
    let base64Data = raw;

    if (raw.startsWith('data:')) {
      const [header, data] = raw.split(',');
      base64Data = data;
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch) mimeType = mimeMatch[1];
    }

    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('gif') ? 'gif' : 'jpg';
    const buffer = Buffer.from(base64Data, 'base64');

    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length,
      'Content-Disposition': `inline; filename="bukti-tf-order-${id}.${ext}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(buffer);
  }
}
