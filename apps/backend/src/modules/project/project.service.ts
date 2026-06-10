import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ProjectService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getProjects(query: any) {
    const { search, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({ where, skip, take: Number(limit), include: { _count: { select: { tasks: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getProject(id: string) {
    const p = await this.prisma.project.findUnique({ where: { id }, include: { tasks: { where: { active: true }, orderBy: { priority: 'desc' } }, milestones: true } });
    if (!p) throw new NotFoundException('Proyek tidak ditemukan');
    return p;
  }

  async createProject(dto: any) { return this.prisma.project.create({ data: dto }); }
  async updateProject(id: string, dto: any) { return this.prisma.project.update({ where: { id }, data: dto }); }
  async deleteProject(id: string) { return this.prisma.project.update({ where: { id }, data: { active: false } }); }

  async getTasks(query: any) {
    const { projectId, stage, assignedTo, page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { active: true };
    if (projectId) where.projectId = projectId;
    if (stage) where.stage = stage;
    if (assignedTo) where.assignedTo = assignedTo;
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({ where, skip, take: Number(limit), include: { project: true, milestone: true, subtasks: { where: { active: true } } }, orderBy: { priority: 'desc' } }),
      this.prisma.task.count({ where }),
    ]);
    return { data, total };
  }

  async createTask(dto: any) { return this.prisma.task.create({ data: dto, include: { project: true } }); }
  async updateTask(id: string, dto: any) { return this.prisma.task.update({ where: { id }, data: dto }); }
  async deleteTask(id: string) { return this.prisma.task.update({ where: { id }, data: { active: false } }); }

  async getMilestones(projectId: string) { return this.prisma.milestone.findMany({ where: { projectId }, include: { tasks: { where: { active: true } } } }); }
  async createMilestone(dto: any) { return this.prisma.milestone.create({ data: dto }); }

  async getTimesheets(query: any) {
    const { taskId, employeeId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (taskId) where.taskId = taskId;
    if (employeeId) where.employeeId = employeeId;
    const [data, total] = await Promise.all([
      this.prisma.timesheet.findMany({ where, skip, take: Number(limit), include: { task: { include: { project: true } } }, orderBy: { date: 'desc' } }),
      this.prisma.timesheet.count({ where }),
    ]);
    return { data, total };
  }

  async logTimesheet(dto: any) { return this.prisma.timesheet.create({ data: dto }); }

  async getStats() {
    const [total, active, done, totalTasks] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'in_progress', active: true } }),
      this.prisma.project.count({ where: { status: 'done' } }),
      this.prisma.task.count({ where: { active: true } }),
    ]);
    return { total, active, done, totalTasks };
  }
}
