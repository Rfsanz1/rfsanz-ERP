import { Controller, Get, Put, Body, Inject, UseGuards } from '@nestjs/common';
import { DriverAreasService } from './driver-areas.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CanAccessGuard } from '../../common/guards/can-access.guard.js';
import { CanAccess } from '../../common/decorators/can-access.decorator.js';

@Controller('driver-areas')
@UseGuards(JwtAuthGuard, CanAccessGuard)
@CanAccess({ roles: ['Super Admin', 'Owner', 'Admin', 'Driver'] })
export class DriverAreasController {
  constructor(@Inject(DriverAreasService) private readonly svc: DriverAreasService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Put() update(@Body() dto: any[]) { return this.svc.update(dto); }
}
