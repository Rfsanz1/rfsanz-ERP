import { Controller, Get, Post, Put, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { QualityService } from './quality.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('quality')
@UseGuards(JwtAuthGuard)
export class QualityController {
  constructor(@Inject(QualityService) private readonly svc: QualityService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('qcp') getQcps(@Query() q: any) { return this.svc.getQcps(q); }
  @Post('qcp') createQcp(@Body() dto: any) { return this.svc.createQcp(dto); }
  @Put('qcp/:id') updateQcp(@Param('id') id: string, @Body() dto: any) { return this.svc.updateQcp(id, dto); }
  @Get('checks') getChecks(@Query() q: any) { return this.svc.getChecks(q); }
  @Post('checks') createCheck(@Body() dto: any) { return this.svc.createCheck(dto); }
  @Post('checks/:id/pass') passCheck(@Param('id') id: string, @Body('measuredValue') val: number) { return this.svc.passCheck(id, val); }
  @Post('checks/:id/fail') failCheck(@Param('id') id: string, @Body('notes') notes: string) { return this.svc.failCheck(id, notes); }
  @Get('alerts') getAlerts(@Query() q: any) { return this.svc.getAlerts(q); }
  @Post('alerts') createAlert(@Body() dto: any) { return this.svc.createAlert(dto); }
  @Put('alerts/:id') updateAlert(@Param('id') id: string, @Body() dto: any) { return this.svc.updateAlert(id, dto); }
}
