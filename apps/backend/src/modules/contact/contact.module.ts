import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [ContactController],
  providers: [ContactService, PrismaService],
  exports: [ContactService],
})
export class ContactModule {}
