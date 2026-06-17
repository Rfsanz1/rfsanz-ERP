import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, Request , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';
import { PrismaService } from '../../../database/prisma.service.js';

@ApiTags('v1/orders')
@Controller('v1/orders')
@UseGuards(StrictJwtGuard)
export class OrdersV1Controller {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query() query: any) {
    const where: any = {};
    if (query.status)     where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    const orderBy: any = {};
    if (query.sortBy) orderBy[query.sortBy] = query.sortOrder ?? 'desc';
    else orderBy.createdAt = 'desc';
    return this.prisma.order.findMany({ where, orderBy, include: { customer: { select: { id: true, name: true } } } });
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: any, @Request() req: any) {
    const { items, ...rest } = body;
    const order = await this.prisma.order.create({
      data: { ...rest, tenantId: rest.tenantId ?? 'default', items: items ?? [] },
    });
    return order;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true, orderItems: { include: { product: { select: { id: true, name: true } } } } },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.order.update({ where: { id: parseInt(id) }, data: body });
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return this.prisma.order.update({ where: { id: parseInt(id) }, data: { status: 'cancelled' } });
  }

  @Get(':id/audit-logs')
  async getAuditLogs(@Param('id') id: string) {
    return this.prisma.auditLog.findMany({
      where: { tableName: 'orders', recordId: id },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id/status-timeline')
  async getStatusTimeline(@Param('id') id: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tableName: 'orders', recordId: id },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return logs
      .filter((l: any) => l.action === 'UPDATE' && (l.newData as any)?.status)
      .map((l: any) => ({ status: (l.newData as any).status, timestamp: l.createdAt, actor: l.actor?.name ?? l.actorId }));
  }

  @Get(':id/telemetry')
  async getTelemetry(@Param('id') id: string) {
    const readings = await this.prisma.tmsSensorReading.findMany({
      where: { orderId: id },
      take: 500,
      orderBy: { eventTime: 'desc' },
      include: { device: { select: { id: true, name: true, displayId: true } } },
    });
    const temps = readings.filter(r => r.temperature !== null).map(r => r.temperature as number);
    return {
      readings,
      summary: {
        readingCount: readings.length,
        alertCount: readings.filter(r => r.isAlert).length,
        temperature: temps.length ? { min: Math.min(...temps), max: Math.max(...temps), avg: temps.reduce((a, b) => a + b, 0) / temps.length, latest: temps[0] } : null,
        latestBattery: readings.find(r => r.batteryLevel !== null)?.batteryLevel ?? null,
        devices: [...new Set(readings.map(r => r.deviceId))],
      },
    };
  }
}
