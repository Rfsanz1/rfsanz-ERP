import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IssuesService } from '../services/issues.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/issue-labels')
@Controller('v1/issue-labels')
@UseGuards(StrictJwtGuard)
export class IssueLabelsV1Controller {
  constructor(@Inject(IssuesService) private readonly service: IssuesService) {}

  @Get()
  findAll() { return this.service.findAllLabels(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.service.createLabel(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.updateLabel(id, body); }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) { return this.service.deleteLabel(id); }
}
