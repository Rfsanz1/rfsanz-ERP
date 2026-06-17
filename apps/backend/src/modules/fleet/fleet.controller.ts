import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, Inject, UseGuards, Request } from '@nestjs/common';
import { FleetService } from './fleet.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('fleet')
@UseGuards(JwtAuthGuard)
export class FleetController {
  constructor(@Inject(FleetService) private readonly svc: FleetService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('vehicles') getVehicles(@Query() q: any) { return this.svc.getVehicles(q); }
  @Post('vehicles') createVehicle(@Body() dto: any) { return this.svc.createVehicle(dto); }
  @Get('vehicles/:id') getVehicle(@Param('id') id: string) { return this.svc.getVehicle(id); }
  @Put('vehicles/:id') updateVehicle(@Param('id') id: string, @Body() dto: any) { return this.svc.updateVehicle(id, dto); }
  @Delete('vehicles/:id') deactivateVehicle(@Param('id') id: string) { return this.svc.deactivateVehicle(id); }
  @Get('services') getServices(@Query() q: any) { return this.svc.getServices(q); }
  @Post('services') createService(@Body() dto: any) { return this.svc.createService(dto); }

  // ─── Delivery Task Endpoints (untuk Driver App) ────────────────────────────
  @Get('delivery/my-tasks')
  getMyDeliveryTasks(@Request() req: any) {
    return this.svc.getMyDeliveryTasks(req.user);
  }

  @Get('delivery/tasks/:id')
  getDeliveryTask(@Param('id') id: string) {
    return this.svc.getDeliveryTask(id);
  }

  @Patch('delivery/tasks/:id/status')
  updateDeliveryStatus(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.svc.updateDeliveryStatus(id, dto, req.user);
  }

  @Get('delivery/history')
  getDeliveryHistory(@Query() q: any, @Request() req: any) {
    return this.svc.getDeliveryHistory(q, req.user);
  }
}
