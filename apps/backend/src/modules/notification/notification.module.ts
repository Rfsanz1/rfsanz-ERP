import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';
import { NotificationGateway } from './notification.gateway.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-this-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
