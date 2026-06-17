import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus, Request , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from '../services/comments.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/comments')
@Controller('v1/comments')
@UseGuards(StrictJwtGuard)
export class CommentsV1Controller {
  constructor(@Inject(CommentsService) private readonly service: CommentsService) {}

  @Get()
  findAll(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.service.findAll(entityType, entityId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any, @Request() req: any) { return this.service.create(body, req.user?.sub ?? 'anon'); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.update(id, body.body, req.user?.sub ?? 'anon');
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string, @Request() req: any) { return this.service.remove(id, req.user?.sub ?? 'anon'); }
}
