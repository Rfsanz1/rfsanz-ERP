import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(@Inject(ProjectService) private readonly svc: ProjectService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('projects') getProjects(@Query() q: any) { return this.svc.getProjects(q); }
  @Post('projects') createProject(@Body() dto: any) { return this.svc.createProject(dto); }
  @Get('projects/:id') getProject(@Param('id') id: string) { return this.svc.getProject(id); }
  @Put('projects/:id') updateProject(@Param('id') id: string, @Body() dto: any) { return this.svc.updateProject(id, dto); }
  @Delete('projects/:id') deleteProject(@Param('id') id: string) { return this.svc.deleteProject(id); }
  @Get('tasks') getTasks(@Query() q: any) { return this.svc.getTasks(q); }
  @Post('tasks') createTask(@Body() dto: any) { return this.svc.createTask(dto); }
  @Put('tasks/:id') updateTask(@Param('id') id: string, @Body() dto: any) { return this.svc.updateTask(id, dto); }
  @Delete('tasks/:id') deleteTask(@Param('id') id: string) { return this.svc.deleteTask(id); }
  @Get('projects/:id/milestones') getMilestones(@Param('id') id: string) { return this.svc.getMilestones(id); }
  @Post('milestones') createMilestone(@Body() dto: any) { return this.svc.createMilestone(dto); }
  @Get('timesheets') getTimesheets(@Query() q: any) { return this.svc.getTimesheets(q); }
  @Post('timesheets') logTimesheet(@Body() dto: any) { return this.svc.logTimesheet(dto); }
}
