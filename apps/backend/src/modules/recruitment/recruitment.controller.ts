import { Controller, Get, Post, Put, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('recruitment')
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
  constructor(@Inject(RecruitmentService) private readonly svc: RecruitmentService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('positions') getPositions(@Query() q: any) { return this.svc.getPositions(q); }
  @Post('positions') createPosition(@Body() dto: any) { return this.svc.createPosition(dto); }
  @Put('positions/:id') updatePosition(@Param('id') id: string, @Body() dto: any) { return this.svc.updatePosition(id, dto); }
  @Get('applications') getApplications(@Query() q: any) { return this.svc.getApplications(q); }
  @Post('applications') createApplication(@Body() dto: any) { return this.svc.createApplication(dto); }
  @Get('applications/:id') getApplication(@Param('id') id: string) { return this.svc.getApplication(id); }
  @Put('applications/:id') updateApplication(@Param('id') id: string, @Body() dto: any) { return this.svc.updateApplication(id, dto); }
  @Post('applications/:id/advance') advanceStage(@Param('id') id: string, @Body('stage') stage: string) { return this.svc.advanceStage(id, stage); }
  @Post('applications/:id/refuse') refuseApplication(@Param('id') id: string, @Body('reason') reason: string) { return this.svc.refuseApplication(id, reason); }
}
