import { Injectable, Inject, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

const req2 = createRequire(import.meta.url);
const jwt    = req2('jsonwebtoken') as typeof import('jsonwebtoken');
const bcrypt = req2('bcryptjs') as typeof import('bcryptjs');

@Injectable()
export class DriverPortalService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private get uploadDir(): string {
    return process.env.UPLOAD_DIR ?? '/DATA/AppData/tms-driver/uploads';
  }

  private get fileBaseUrl(): string {
    return (process.env.FILE_BASE_URL ?? 'https://briskly-underpaid-shucking.ngrok-free.dev/uploads').replace(/\/$/, '');
  }

  private signToken(user: { id: string; email: string; name: string }): string {
    const secret    = process.env.JWT_SECRET ?? 'change-this-secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as any;
    return jwt.sign({ sub: user.id, email: user.email, name: user.name, role: 'driver', roles: ['driver'], permissions: [], tenantId: 'default' }, secret, { expiresIn });
  }

  async login(identifier: string, password: string) {
    if (!identifier || !password) throw new BadRequestException('identifier dan password wajib diisi');

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: identifier, mode: 'insensitive' } },
    });
    if (!user) throw new UnauthorizedException('Kredensial tidak valid');

    const valid = await bcrypt.compare(password, user.password).catch(() => false);
    if (!valid) throw new UnauthorizedException('Kredensial tidak valid');

    const token = this.signToken(user);
    return {
      token,
      user: { id: user.id, name: user.name, phone: null, email: user.email },
    };
  }

  async getMyLoads(driverId: string, query: any) {
    const where: any = { archived: false };
    if (query.status) where.status = query.status;

    const assignedEvents = await this.prisma.tmsShipmentEvent.findMany({
      where: { actorId: driverId, eventType: 'driver_assigned' },
      select: { shipmentId: true },
    });
    if (assignedEvents.length > 0) {
      where.id = { in: assignedEvents.map((e: any) => e.shipmentId) };
    }

    const shipments = await this.prisma.tmsShipment.findMany({
      where,
      include: {
        origin:      { select: { id: true, name: true, address1: true, city: true } },
        destination: { select: { id: true, name: true, address1: true, city: true } },
        customer:    { select: { id: true, name: true } },
        carrier:     { select: { id: true, name: true } },
        items:       true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return shipments;
  }

  async getLoad(id: string) {
    const shipment = await this.prisma.tmsShipment.findUnique({
      where: { id },
      include: {
        origin:      true,
        destination: true,
        customer:    true,
        carrier:     true,
        items:       true,
        events:      { orderBy: { eventTime: 'desc' }, take: 20 },
      },
    });
    if (!shipment) throw new NotFoundException('Load tidak ditemukan');
    return shipment;
  }

  async updateLoadStatus(id: string, driverId: string, dto: { status: string; note?: string }) {
    if (!dto.status) throw new BadRequestException('status wajib diisi');

    await this.prisma.tmsShipment.update({ where: { id }, data: { status: dto.status } });
    await this.prisma.tmsShipmentEvent.create({
      data: { shipmentId: id, eventType: dto.status, description: dto.note ?? null, actorId: driverId },
    });
    return { updated: true, status: dto.status };
  }

  async getLoadDocuments(shipmentId: string) {
    return this.prisma.tmsAttachment.findMany({
      where: { entityType: 'shipment', entityId: shipmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadLoadDocument(shipmentId: string, driverId: string, file: Express.Multer.File, documentType: string) {
    const subfolder  = 'proof-of-delivery';
    const destDir    = path.join(this.uploadDir, subfolder);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const ext      = path.extname(file.originalname) || '.jpg';
    const fileName = `pod-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const destPath = path.join(destDir, fileName);
    fs.renameSync(file.path, destPath);

    const url = `${this.fileBaseUrl}/${subfolder}/${fileName}`;
    await this.prisma.tmsAttachment.create({
      data: {
        entityType:  'shipment',
        entityId:    shipmentId,
        fileName,
        mimeType:    file.mimetype ?? 'application/octet-stream',
        fileSize:    file.size,
        storagePath: destPath,
        uploadedBy:  driverId,
        description: documentType ?? null,
      },
    });
    return { url, fileName, createdAt: new Date().toISOString() };
  }

  async uploadStopSignature(stopId: string, driverId: string, file: Express.Multer.File, recipientName: string) {
    const subfolder  = 'signatures';
    const destDir    = path.join(this.uploadDir, subfolder);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const ext      = path.extname(file.originalname) || '.png';
    const fileName = `sig-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const destPath = path.join(destDir, fileName);
    fs.renameSync(file.path, destPath);

    const url = `${this.fileBaseUrl}/${subfolder}/${fileName}`;
    await this.prisma.tmsDeliveryProof.create({
      data: {
        orderId:   stopId,
        driverId,
        photoUrl:  url,
        signature: url,
        notes:     recipientName ?? null,
      },
    });
    return { url, fileName, createdAt: new Date().toISOString() };
  }

  async saveLocation(loadId: string, driverId: string, dto: { latitude: number; longitude: number; accuracy?: number; timestamp?: string }) {
    if (!dto.latitude || !dto.longitude) throw new BadRequestException('latitude dan longitude wajib diisi');

    await this.prisma.tmsDriverLocation.create({
      data: {
        driverId,
        lat:       dto.latitude,
        lng:       dto.longitude,
        accuracy:  dto.accuracy ?? null,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
    });

    if (loadId) {
      await this.prisma.tmsShipment.update({
        where: { id: loadId },
        data: { currentLat: dto.latitude, currentLng: dto.longitude },
      }).catch(() => null);
    }
    return { saved: true, timestamp: new Date().toISOString() };
  }

  async getAllDocuments(driverId: string) {
    return this.prisma.tmsAttachment.findMany({
      where: { uploadedBy: driverId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReport(driverId: string, period: string) {
    const now = new Date();
    let from: Date | null = null;
    if (period === 'week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const locationWhere: any   = { driverId };
    const proofWhere: any      = { driverId };
    const earningWhere: any    = { driverId };
    if (from) {
      locationWhere.timestamp  = { gte: from };
      proofWhere.capturedAt    = { gte: from };
      earningWhere.date        = { gte: from };
    }

    const [locationCount, proofCount, earnings] = await Promise.all([
      this.prisma.tmsDriverLocation.count({ where: locationWhere }),
      this.prisma.tmsDeliveryProof.count({ where: proofWhere }),
      this.prisma.tmsDriverEarning.findMany({ where: earningWhere }),
    ]);

    const totalEarning   = earnings.reduce((s: number, e: any) => s + e.amount, 0);
    const pendingEarning = earnings.filter((e: any) => e.status === 'pending').reduce((s: number, e: any) => s + e.amount, 0);
    const paidEarning    = earnings.filter((e: any) => e.status === 'paid').reduce((s: number, e: any) => s + e.amount, 0);

    return {
      period:          period ?? 'all',
      locationUpdates: locationCount,
      deliveries:      proofCount,
      earning: {
        total:   totalEarning,
        pending: pendingEarning,
        paid:    paidEarning,
      },
    };
  }

  async changePassword(driverId: string, dto: { currentPassword: string; newPassword: string }) {
    const { currentPassword, newPassword } = dto ?? {};
    if (!currentPassword || !newPassword) throw new BadRequestException('currentPassword dan newPassword wajib diisi');
    if (newPassword.length < 6) throw new BadRequestException('Password baru minimal 6 karakter');

    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException('Driver tidak ditemukan');

    const valid = await bcrypt.compare(currentPassword, user.password).catch(() => false);
    if (!valid) throw new UnauthorizedException('Password lama tidak sesuai');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: driverId }, data: { password: hashed } });
    return { message: 'Password berhasil diubah' };
  }
}
