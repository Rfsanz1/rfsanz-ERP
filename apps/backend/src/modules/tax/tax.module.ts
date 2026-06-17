import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller.js';
import { TaxService } from './tax.service.js';
import { EFakturService } from './efaktur.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [TaxController],
  providers: [TaxService, EFakturService, PrismaService],
  exports: [TaxService, EFakturService],
})
export class TaxModule {}
