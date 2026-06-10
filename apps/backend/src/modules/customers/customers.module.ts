import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({ controllers: [CustomersController], providers: [CustomersService, PrismaService], exports: [CustomersService] })
export class CustomersModule {}
