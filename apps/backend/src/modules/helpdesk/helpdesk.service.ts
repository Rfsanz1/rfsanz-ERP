import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class HelpdeskService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async generateTicketNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.helpdeskTicket.count();
    return `TICKET/${year}/${String(count + 1).padStart(4, '0')}`;
  }

  async getTeams() { return this.prisma.helpdeskTeam.findMany({ where: { active: true }, include: { _count: { select: { tickets: true } } } }); }
  async createTeam(dto: any) { return this.prisma.helpdeskTeam.create({ data: dto }); }

  async getTickets(query: any) {
    const { search, stage, teamId, priority, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.subject = { contains: search, mode: 'insensitive' };
    if (stage) where.stage = stage;
    if (teamId) where.teamId = teamId;
    if (priority !== undefined) where.priority = Number(priority);
    const [data, total] = await Promise.all([
      this.prisma.helpdeskTicket.findMany({ where, skip, take: Number(limit), include: { team: true }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.helpdeskTicket.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getTicket(id: string) {
    const t = await this.prisma.helpdeskTicket.findUnique({ where: { id }, include: { team: true } });
    if (!t) throw new NotFoundException('Tiket tidak ditemukan');
    return t;
  }

  async createTicket(dto: any) {
    const noTicket = await this.generateTicketNo();
    const teamId = dto.teamId;
    let slaDeadline: Date | undefined;
    if (teamId) {
      const team = await this.prisma.helpdeskTeam.findUnique({ where: { id: teamId } });
      if (team) { slaDeadline = new Date(Date.now() + team.slaHours * 3600000); }
    }
    return this.prisma.helpdeskTicket.create({ data: { ...dto, noTicket, slaDeadline } });
  }

  async updateTicket(id: string, dto: any) { return this.prisma.helpdeskTicket.update({ where: { id }, data: dto }); }

  async closeTicket(id: string, rating?: number, ratingComment?: string) {
    return this.prisma.helpdeskTicket.update({ where: { id }, data: { stage: 'closed', closedAt: new Date(), rating, ratingComment } });
  }

  async getStats() {
    const [total, open, inProgress, solved, closed] = await Promise.all([
      this.prisma.helpdeskTicket.count(),
      this.prisma.helpdeskTicket.count({ where: { stage: 'new' } }),
      this.prisma.helpdeskTicket.count({ where: { stage: 'in_progress' } }),
      this.prisma.helpdeskTicket.count({ where: { stage: 'solved' } }),
      this.prisma.helpdeskTicket.count({ where: { stage: 'closed' } }),
    ]);
    const urgent = await this.prisma.helpdeskTicket.count({ where: { priority: 3, stage: { notIn: ['solved', 'closed'] } } });
    return { total, open, inProgress, solved, closed, urgent };
  }
}
