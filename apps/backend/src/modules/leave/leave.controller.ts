import { Controller, Get, Post, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { LeaveService } from './leave.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(@Inject(LeaveService) private readonly svc: LeaveService) {}

  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('types') getTypes() { return this.svc.getLeaveTypes(); }
  @Post('types') createType(@Body() dto: any) { return this.svc.createLeaveType(dto); }
  @Get('allocations') getAllocations(@Query() q: any) { return this.svc.getAllocations(q); }
  @Post('allocations') createAllocation(@Body() dto: any) { return this.svc.createAllocation(dto); }
  @Get('requests') getRequests(@Query() q: any) { return this.svc.getRequests(q); }
  @Post('requests') createRequest(@Body() dto: any) { return this.svc.createRequest(dto); }
  @Post('requests/:id/approve') approveRequest(@Param('id') id: string, @CurrentUser() user: any) { return this.svc.approveRequest(id, user?.sub ?? 'system'); }
  @Post('requests/:id/refuse') refuseRequest(@Param('id') id: string) { return this.svc.refuseRequest(id); }
  @Get('balance/:employeeId') getBalance(@Param('employeeId') empId: string, @Query('year') year: string) { return this.svc.getLeaveBalance(empId, Number(year) || new Date().getFullYear()); }
}
