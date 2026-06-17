import { Controller, Get, Post, Patch, Param, UseGuards, HttpCode, Request , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsTmsService } from '../services/notifications-tms.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/notifications')
@Controller('v1/notifications')
@UseGuards(StrictJwtGuard)
export class NotificationsV1Controller {
  constructor(@Inject(NotificationsTmsService) private readonly service: NotificationsTmsService) {}

  @Get()
  findAll(@Request() req: any) { return this.service.findAll(req.user.sub); }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) { return this.service.getUnreadCount(req.user.sub); }

  @Patch(':id/read')
  @HttpCode(200)
  markRead(@Param('id') id: string, @Request() req: any) { return this.service.markRead(id, req.user.sub); }

  @Post('read-all')
  @HttpCode(200)
  markAllRead(@Request() req: any) { return this.service.markAllRead(req.user.sub); }
}
