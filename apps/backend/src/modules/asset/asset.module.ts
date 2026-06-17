import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller.js';
import { AssetService } from './asset.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [AssetController],
  providers: [AssetService, PrismaService],
  exports: [AssetService],
})
export class AssetModule {}
