import { Module } from '@nestjs/common';
import { PosController } from './pos.controller.js';
import { PosService } from './pos.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({ controllers: [PosController], providers: [PosService, PrismaService], exports: [PosService] })
export class PosModule {}
