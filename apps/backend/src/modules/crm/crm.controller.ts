import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(@Inject(CrmService) private readonly svc: CrmService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('leads') getLeads(@Query() q: any) { return this.svc.getLeads(q); }
  @Post('leads') createLead(@Body() dto: any) { return this.svc.createLead(dto); }
  @Get('leads/:id') getLead(@Param('id') id: string) { return this.svc.getLead(id); }
  @Put('leads/:id') updateLead(@Param('id') id: string, @Body() dto: any) { return this.svc.updateLead(id, dto); }
  @Delete('leads/:id') deleteLead(@Param('id') id: string) { return this.svc.deleteLead(id); }
  @Post('leads/:id/convert') convertToOpportunity(@Param('id') id: string) { return this.svc.convertToOpportunity(id); }
  @Post('leads/:id/won') markAsWon(@Param('id') id: string) { return this.svc.markAsWon(id); }
  @Post('leads/:id/lost') markAsLost(@Param('id') id: string, @Body('reason') reason: string) { return this.svc.markAsLost(id, reason); }
  @Get('pipeline') getPipeline(@Query() q: any) { return this.svc.getPipeline(q); }
  @Get('teams') getSalesTeams() { return this.svc.getSalesTeams(); }
  @Post('teams') createSalesTeam(@Body() dto: any) { return this.svc.createSalesTeam(dto); }
  @Get('activities') getActivities(@Query() q: any) { return this.svc.getActivities(q); }
  @Post('activities') scheduleActivity(@Body() dto: any) { return this.svc.scheduleActivity(dto); }
  @Post('activities/:id/done') markActivityDone(@Param('id') id: string) { return this.svc.markActivityDone(id); }
  @Get('analysis/win-loss') getWinLoss(@Query() q: any) { return this.svc.getWinLossReport(q); }
  @Get('lost-reasons') getLostReasons() { return this.svc.getLostReasons(); }
}
