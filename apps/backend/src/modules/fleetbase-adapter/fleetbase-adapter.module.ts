import { Module } from '@nestjs/common';
import { FleetbaseAdapterController } from './fleetbase-adapter.controller.js';
import { FleetbaseAdapterService } from './fleetbase-adapter.service.js';

@Module({
  controllers: [FleetbaseAdapterController],
  providers: [FleetbaseAdapterService],
})
export class FleetbaseAdapterModule {}
