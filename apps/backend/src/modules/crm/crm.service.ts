import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class CrmService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getLeads(query: any) {
    const { search, stage, type, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (stage) where.stage = stage;
    if (type) where.type = type;
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take: Number(limit), include: { team: true, activities: { where: { status: 'planned' }, take: 1 } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getLead(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { team: true, activities: { orderBy: { dueDate: 'asc' } } } });
    if (!lead) throw new NotFoundException('Lead tidak ditemukan');
    return lead;
  }

  async createLead(dto: any) { return this.prisma.lead.create({ data: dto }); }

  async updateLead(id: string, dto: any) { return this.prisma.lead.update({ where: { id }, data: dto }); }

  async deleteLead(id: string) { return this.prisma.lead.update({ where: { id }, data: { active: false } }); }

  async convertToOpportunity(id: string) {
    return this.prisma.lead.update({ where: { id }, data: { type: 'opportunity', stage: 'qualified' } });
  }

  async markAsWon(id: string) {
    return this.prisma.lead.update({ where: { id }, data: { stage: 'won', closingDate: new Date(), probability: 100 } });
  }

  async markAsLost(id: string, reason: string) {
    return this.prisma.lead.update({ where: { id }, data: { stage: 'lost', lostReason: reason, closingDate: new Date(), probability: 0 } });
  }

  async getPipeline(query: any) {
    const { teamId } = query;
    const where: any = { active: true, type: 'opportunity' };
    if (teamId) where.teamId = teamId;
    const stages = ['new', 'qualified', 'proposition', 'won', 'lost'];
    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const leads = await this.prisma.lead.findMany({ where: { ...where, stage }, orderBy: { priority: 'desc' } });
        const total = leads.reduce((s, l) => s + Number(l.expectedRevenue), 0);
        return { stage, leads, total };
      })
    );
    return pipeline;
  }

  async getSalesTeams() { return this.prisma.salesTeam.findMany({ where: { active: true } }); }
  async createSalesTeam(dto: any) { return this.prisma.salesTeam.create({ data: dto }); }

  async getActivities(query: any) {
    const { status, leadId } = query;
    const where: any = {};
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;
    return this.prisma.crmActivity.findMany({ where, include: { lead: true }, orderBy: { dueDate: 'asc' } });
  }

  async scheduleActivity(dto: any) { return this.prisma.crmActivity.create({ data: dto }); }

  async markActivityDone(id: string) {
    return this.prisma.crmActivity.update({ where: { id }, data: { status: 'done', doneDate: new Date() } });
  }

  async getWinLossReport(query: any) {
    const { from, to } = query;
    const where: any = { stage: { in: ['won', 'lost'] } };
    if (from) where.closingDate = { gte: new Date(from) };
    if (to) where.closingDate = { ...where.closingDate, lte: new Date(to) };
    const [won, lost] = await Promise.all([
      this.prisma.lead.aggregate({ where: { ...where, stage: 'won' }, _count: true, _sum: { expectedRevenue: true } }),
      this.prisma.lead.aggregate({ where: { ...where, stage: 'lost' }, _count: true }),
    ]);
    return { won: { count: won._count, revenue: won._sum.expectedRevenue ?? 0 }, lost: { count: lost._count } };
  }

  async getLostReasons() { return this.prisma.lostReason.findMany({ where: { active: true } }); }

  async getStats() {
    const [total, opportunities, won, lost] = await Promise.all([
      this.prisma.lead.count({ where: { active: true } }),
      this.prisma.lead.count({ where: { active: true, type: 'opportunity' } }),
      this.prisma.lead.count({ where: { stage: 'won' } }),
      this.prisma.lead.count({ where: { stage: 'lost' } }),
    ]);
    const pipeline = await this.prisma.lead.aggregate({ where: { active: true, type: 'opportunity' }, _sum: { expectedRevenue: true } });
    return { total, opportunities, won, lost, pipelineValue: pipeline._sum.expectedRevenue ?? 0 };
  }
}
