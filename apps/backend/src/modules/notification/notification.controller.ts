import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationController {
  constructor(@Inject(NotificationService) private readonly notificationService: NotificationService) {}

  @Get()
  @Permissions('notifications.view')
  list(@CurrentUser() user: any) {
    return this.notificationService.findAll(user.userId || user.sub || user.id);
  }

  @Put(':id/read')
  @Permissions('notifications.update')
  markRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @Permissions('notifications.update')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user.userId || user.sub || user.id);
  }

  @Delete(':id')
  @Permissions('notifications.delete')
  deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteOne(id);
  }

  @Post('send')
  @Permissions('notifications.create')
  send(@Body() payload: { recipient: string; title: string; message: string }) {
    return this.notificationService.create(payload.recipient, payload.title, payload.message);
  }

  @Post('whatsapp')
  @Permissions('notifications.create')
  sendWhatsApp(@Body() payload: { target: string; message: string }) {
    return this.notificationService.sendWhatsApp(payload.target, payload.message);
  }
}
