import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus, Request , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IssuesService } from '../services/issues.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/issues')
@Controller('v1/issues')
@UseGuards(StrictJwtGuard)
export class IssuesV1Controller {
  constructor(@Inject(IssuesService) private readonly service: IssuesService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('stats')
  getStats() { return this.service.getStats(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Post(':id/resolve')
  @HttpCode(200)
  resolve(@Param('id') id: string) { return this.service.resolve(id); }

  @Post(':id/close')
  @HttpCode(200)
  close(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.close(id, body, req.user?.sub ?? 'system');
  }

  @Post(':id/reopen')
  @HttpCode(200)
  reopen(@Param('id') id: string) { return this.service.reopen(id); }

  @Post(':id/snooze')
  @HttpCode(200)
  snooze(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.snooze(id, body, req.user?.sub ?? 'system');
  }

  @Post(':id/unsnooze')
  @HttpCode(200)
  unsnooze(@Param('id') id: string) { return this.service.unsnooze(id); }

  @Get(':id/activity')
  getActivity(@Param('id') id: string) { return this.service.getActivity(id); }

  @Post(':id/labels')
  @HttpCode(HttpStatus.CREATED)
  addLabel(@Param('id') id: string, @Body() body: any) { return this.service.addLabel(id, body.labelId); }

  @Delete(':id/labels/:labelId')
  @HttpCode(200)
  removeLabel(@Param('id') id: string, @Param('labelId') labelId: string) { return this.service.removeLabel(id, labelId); }
}
