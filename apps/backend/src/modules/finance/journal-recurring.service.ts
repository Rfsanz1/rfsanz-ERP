import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class JournalRecurringService {
  private readonly logger = new Logger(JournalRecurringService.name);

  constructor(private readonly prisma: PrismaService) {}

  private genNomor(): string {
    const d = new Date();
    return `RJR/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}/${String(Date.now()).slice(-6)}`;
  }

  private normalizeFrequency(frequency: string) {
    const value = String(frequency ?? 'MONTHLY').toUpperCase();
    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value)) {
      throw new BadRequestException('Frequency harus salah satu dari DAILY, WEEKLY, MONTHLY, YEARLY');
    }
    return value;
  }

  private nextRunDate(current: Date, frequency: string, interval = 1) {
    const next = new Date(current);
    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + interval);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + interval * 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + interval);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + interval);
        break;
    }
    return next;
  }

  private async validateLines(lines: any[]) {
    if (!lines || lines.length < 2) {
      throw new BadRequestException('Recurring journal minimal memiliki 2 baris');
    }
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalKredit = lines.reduce((sum, line) => sum + Number(line.kredit || 0), 0);
    if (Math.abs(totalDebit - totalKredit) > 0.01) {
      throw new BadRequestException('Total debit dan kredit harus seimbang');
    }
    for (const line of lines) {
      const account = await this.prisma.account.findUnique({ where: { id: line.accountId } });
      if (!account) throw new BadRequestException(`Akun ID ${line.accountId} tidak ditemukan`);
      if (!account.isActive) throw new BadRequestException(`Akun ${account.code} tidak aktif`);
    }
  }

  async findAll(query: any) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.journalRecurring.findMany({ where, skip, take: Number(limit), include: { lines: true }, orderBy: { nextRunAt: 'asc' } }),
      this.prisma.journalRecurring.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string) {
    const recurring = await this.prisma.journalRecurring.findUnique({ where: { id }, include: { lines: true } });
    if (!recurring) throw new NotFoundException(`Recurring journal ${id} tidak ditemukan`);
    return recurring;
  }

  async create(dto: any) {
    const frequency = this.normalizeFrequency(dto.frequency);
    const interval = Number(dto.interval || 1);
    const nextRunAt = dto.nextRunAt ? new Date(dto.nextRunAt) : new Date();
    await this.validateLines(dto.lines);
    return this.prisma.journalRecurring.create({
      data: {
        name: dto.name,
        description: dto.description,
        frequency,
        interval,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        nextRunAt,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status ?? 'ACTIVE',
        createdById: dto.createdById,
        lines: { create: dto.lines.map((line: any) => ({
          accountId: line.accountId,
          debit: line.debit || 0,
          kredit: line.kredit || 0,
          deskripsi: line.deskripsi,
        })) },
      } as any,
      include: { lines: true },
    });
  }

  async update(id: string, dto: any) {
    const recurring = await this.findOne(id);
    const frequency = dto.frequency ? this.normalizeFrequency(dto.frequency) : recurring.frequency;
    const interval = dto.interval !== undefined ? Number(dto.interval) : recurring.interval;
    if (dto.lines) {
      await this.validateLines(dto.lines);
    }
    const updateData: any = {
      ...dto,
      frequency,
      interval,
      startDate: dto.startDate ? new Date(dto.startDate) : recurring.startDate,
      nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : recurring.nextRunAt,
      endDate: dto.endDate ? new Date(dto.endDate) : recurring.endDate,
    };
    if (dto.lines) {
      await this.prisma.journalRecurringLine.deleteMany({ where: { journalRecurringId: id } });
      updateData.lines = { create: dto.lines.map((line: any) => ({
        accountId: line.accountId,
        debit: line.debit || 0,
        kredit: line.kredit || 0,
        deskripsi: line.deskripsi,
      })) };
    }
    return this.prisma.journalRecurring.update({ where: { id }, data: updateData, include: { lines: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.journalRecurring.delete({ where: { id } });
    return { message: 'Recurring journal berhasil dihapus' };
  }

  async runDueRecurring(id?: string) {
    const now = new Date();
    const where: any = { status: 'ACTIVE', nextRunAt: { lte: now } };
    if (id) where.id = id;
    const items = await this.prisma.journalRecurring.findMany({ where, include: { lines: true } });
    if (!items.length) return { message: 'Tidak ada recurring journal yang perlu dijalankan' };

    const results: any[] = [];
    for (const recurring of items) {
      try {
        const journal = await this.prisma.journal.create({
          data: {
            nomor: this.genNomor(),
            tanggal: recurring.nextRunAt,
            deskripsi: recurring.description || `Recurring journal ${recurring.name}`,
            referensi: recurring.id,
            status: 'POSTED',
            lines: {
              create: ((recurring.lines as any[]).map((line) => ({
                accountId: line.accountId,
                debit: line.debit,
                kredit: line.kredit,
                deskripsi: line.deskripsi,
              })) as any[]),
            },
          } as any,
        });

        const nextRun = this.nextRunDate(recurring.nextRunAt, recurring.frequency, recurring.interval);
        const statusUpdate = recurring.endDate && nextRun > recurring.endDate ? 'INACTIVE' : recurring.status;
        await this.prisma.journalRecurring.update({
          where: { id: recurring.id },
          data: {
            journalId: journal.id,
            nextRunAt: statusUpdate === 'INACTIVE' ? recurring.nextRunAt : nextRun,
            status: statusUpdate,
          },
        });
        results.push({ recurringId: recurring.id, journalId: journal.id, status: 'posted' });
      } catch (err) {
        this.logger.error(`Gagal menjalankan recurring journal ${recurring.id}`, err);
        results.push({ recurringId: recurring.id, error: (err as Error).message });
      }
    }
    return { message: 'Recurring journal dijalankan', results };
  }
}
