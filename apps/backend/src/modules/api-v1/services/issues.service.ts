import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class IssuesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { status, priority, assigneeId, entityType, entityId } = query;
    const where: any = { archived: false };
    if (status)     where.status = status;
    if (priority)   where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (entityType) where.entityType = entityType;
    if (entityId)   where.entityId = entityId;

    const issues = await this.prisma.tmsIssue.findMany({
      where,
      include: {
        labels: { include: { label: { select: { id: true, name: true, color: true } } } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return issues.map(i => ({
      ...i,
      commentCount: (i as any)._count.comments,
      labels: i.labels.map(l => l.label),
    }));
  }

  async getStats() {
    const [open, in_progress, resolved, closed, critical, high] = await Promise.all([
      this.prisma.tmsIssue.count({ where: { status: 'open',        archived: false } }),
      this.prisma.tmsIssue.count({ where: { status: 'in_progress', archived: false } }),
      this.prisma.tmsIssue.count({ where: { status: 'resolved',    archived: false } }),
      this.prisma.tmsIssue.count({ where: { status: 'closed',      archived: false } }),
      this.prisma.tmsIssue.count({ where: { priority: 'critical',  archived: false } }),
      this.prisma.tmsIssue.count({ where: { priority: 'high',      archived: false } }),
    ]);
    return { open, in_progress, resolved, closed, critical, high };
  }

  async findOne(id: string) {
    const issue = await this.prisma.tmsIssue.findUnique({
      where: { id },
      include: { labels: { include: { label: true } }, comments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!issue) throw new NotFoundException('Issue tidak ditemukan');
    return issue;
  }

  async create(dto: any) {
    const { title, description, priority, category, assigneeId, entityType, entityId } = dto;
    return this.prisma.tmsIssue.create({ data: { title, description, priority, category, assigneeId, entityType, entityId } });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsIssue.update({ where: { id }, data: dto });
  }

  async resolve(id: string) {
    await this.findOne(id);
    return this.prisma.tmsIssue.update({ where: { id }, data: { status: 'resolved' } });
  }

  async close(id: string, dto: any, userId: string) {
    await this.findOne(id);
    return this.prisma.tmsIssue.update({ where: { id }, data: { status: 'closed', resolution: dto.resolution, closedAt: new Date(), closedBy: userId } });
  }

  async reopen(id: string) {
    await this.findOne(id);
    return this.prisma.tmsIssue.update({ where: { id }, data: { status: 'open', closedAt: null, closedBy: null, snoozedUntil: null } });
  }

  async snooze(id: string, dto: any, userId: string) {
    await this.findOne(id);
    return this.prisma.tmsIssue.update({ where: { id }, data: { snoozedUntil: new Date(dto.snoozedUntil), snoozedBy: userId } });
  }

  async unsnooze(id: string) {
    await this.findOne(id);
    return this.prisma.tmsIssue.update({ where: { id }, data: { snoozedUntil: null, snoozedBy: null } });
  }

  async getActivity(id: string) {
    const issue = await this.findOne(id);
    const comments = issue.comments.map((c: any) => ({ ...c, activityType: 'comment' }));
    return comments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async addLabel(id: string, labelId: string) {
    await this.findOne(id);
    await this.prisma.tmsIssueLabel.findUniqueOrThrow({ where: { id: labelId } });
    return this.prisma.tmsIssueLabelAssignment.create({ data: { issueId: id, labelId } });
  }

  async removeLabel(id: string, labelId: string) {
    const asgn = await this.prisma.tmsIssueLabelAssignment.findUnique({ where: { issueId_labelId: { issueId: id, labelId } } });
    if (!asgn) throw new NotFoundException('Label assignment tidak ditemukan');
    await this.prisma.tmsIssueLabelAssignment.delete({ where: { issueId_labelId: { issueId: id, labelId } } });
    return { removed: true };
  }

  async findAllLabels(orgId = 'default') {
    return this.prisma.tmsIssueLabel.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  }

  async createLabel(dto: any) {
    return this.prisma.tmsIssueLabel.create({ data: { name: dto.name, color: dto.color ?? '#6B7280' } });
  }

  async updateLabel(id: string, dto: any) {
    return this.prisma.tmsIssueLabel.update({ where: { id }, data: dto });
  }

  async deleteLabel(id: string) {
    await this.prisma.tmsIssueLabelAssignment.deleteMany({ where: { labelId: id } });
    await this.prisma.tmsIssueLabel.delete({ where: { id } });
    return { success: true };
  }

  async findAllKanban(orgId = 'default') {
    return this.prisma.tmsKanbanView.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } });
  }

  async createKanban(dto: any, createdBy?: string) {
    return this.prisma.tmsKanbanView.create({ data: { ...dto, createdBy } });
  }

  async updateKanban(id: string, dto: any) {
    return this.prisma.tmsKanbanView.update({ where: { id }, data: dto });
  }

  async deleteKanban(id: string) {
    await this.prisma.tmsKanbanView.delete({ where: { id } });
    return { success: true };
  }
}
