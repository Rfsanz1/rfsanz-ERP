import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { KledoModule } from '../kledo/kledo.module.js';

@Module({
  imports: [KledoModule],
  controllers: [CustomersController],
  providers: [CustomersService, PrismaService],
  exports: [CustomersService],
})
export class CustomersModule {}
