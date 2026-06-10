import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(@Inject(MaintenanceService) private readonly svc: MaintenanceService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('equipment') getEquipment(@Query() q: any) { return this.svc.getEquipment(q); }
  @Post('equipment') createEquipment(@Body() dto: any) { return this.svc.createEquipment(dto); }
  @Put('equipment/:id') updateEquipment(@Param('id') id: string, @Body() dto: any) { return this.svc.updateEquipment(id, dto); }
  @Delete('equipment/:id') deactivateEquipment(@Param('id') id: string) { return this.svc.deactivateEquipment(id); }
  @Get('requests') getRequests(@Query() q: any) { return this.svc.getRequests(q); }
  @Post('requests') createRequest(@Body() dto: any) { return this.svc.createRequest(dto); }
  @Get('requests/:id') getRequest(@Param('id') id: string) { return this.svc.getRequest(id); }
  @Put('requests/:id') updateRequest(@Param('id') id: string, @Body() dto: any) { return this.svc.updateRequest(id, dto); }
  @Post('requests/:id/close') closeRequest(@Param('id') id: string) { return this.svc.closeRequest(id); }
}
