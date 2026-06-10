import { Controller, Get, Post, Put, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { ManufacturingService } from './manufacturing.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('manufacturing')
@UseGuards(JwtAuthGuard)
export class ManufacturingController {
  constructor(@Inject(ManufacturingService) private readonly svc: ManufacturingService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('bom') getBoms(@Query() q: any) { return this.svc.getBoms(q); }
  @Post('bom') createBom(@Body() dto: any) { return this.svc.createBom(dto); }
  @Get('bom/:id') getBom(@Param('id') id: string) { return this.svc.getBom(id); }
  @Put('bom/:id') updateBom(@Param('id') id: string, @Body() dto: any) { return this.svc.updateBom(id, dto); }
  @Get('work-centers') getWorkCenters() { return this.svc.getWorkCenters(); }
  @Post('work-centers') createWorkCenter(@Body() dto: any) { return this.svc.createWorkCenter(dto); }
  @Get('orders') getOrders(@Query() q: any) { return this.svc.getOrders(q); }
  @Post('orders') createOrder(@Body() dto: any) { return this.svc.createOrder(dto); }
  @Get('orders/:id') getOrder(@Param('id') id: string) { return this.svc.getOrder(id); }
  @Post('orders/:id/confirm') confirmOrder(@Param('id') id: string) { return this.svc.confirmOrder(id); }
  @Post('orders/:id/start') startOrder(@Param('id') id: string) { return this.svc.startOrder(id); }
  @Post('orders/:id/complete') completeOrder(@Param('id') id: string, @Body('qtyProduced') qty: number) { return this.svc.completeOrder(id, qty); }
}
