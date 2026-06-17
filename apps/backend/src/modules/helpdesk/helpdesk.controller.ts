import { Controller, Get, Post, Put, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { HelpdeskService } from './helpdesk.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('helpdesk')
@UseGuards(JwtAuthGuard)
export class HelpdeskController {
  constructor(@Inject(HelpdeskService) private readonly svc: HelpdeskService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('teams') getTeams() { return this.svc.getTeams(); }
  @Post('teams') createTeam(@Body() dto: any) { return this.svc.createTeam(dto); }
  @Get('tickets') getTickets(@Query() q: any) { return this.svc.getTickets(q); }
  @Post('tickets') createTicket(@Body() dto: any) { return this.svc.createTicket(dto); }
  @Get('tickets/:id') getTicket(@Param('id') id: string) { return this.svc.getTicket(id); }
  @Put('tickets/:id') updateTicket(@Param('id') id: string, @Body() dto: any) { return this.svc.updateTicket(id, dto); }
  @Post('tickets/:id/close') closeTicket(@Param('id') id: string, @Body() dto: any) { return this.svc.closeTicket(id, dto.rating, dto.ratingComment); }
}
