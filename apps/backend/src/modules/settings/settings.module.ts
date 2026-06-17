import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({ controllers: [SettingsController], providers: [SettingsService, PrismaService], exports: [SettingsService] })
export class SettingsModule {}
