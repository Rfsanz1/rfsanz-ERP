import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus, Request , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IssuesService } from '../services/issues.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/kanban-views')
@Controller('v1/kanban-views')
@UseGuards(StrictJwtGuard)
export class KanbanViewsV1Controller {
  constructor(@Inject(IssuesService) private readonly service: IssuesService) {}

  @Get()
  findAll() { return this.service.findAllKanban(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any, @Request() req: any) { return this.service.createKanban(body, req.user?.sub); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.updateKanban(id, body); }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) { return this.service.deleteKanban(id); }
}
