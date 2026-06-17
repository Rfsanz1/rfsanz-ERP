import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(@Inject(HrService) private readonly svc: HrService) {}

  // ─── STATS & GENERAL ─────────────────────────────────────────────────────
  @Get('stats')
  getStats() { return this.svc.getStats(); }

  // ─── EMPLOYEES ───────────────────────────────────────────────────────────
  @Get('employees')
  getEmployees(@Query() q: any) { return this.svc.getEmployees(q); }

  @Get('employees/:id')
  getEmployee(@Param('id') id: string) { return this.svc.getEmployee(id); }

  @Post('employees')
  createEmployee(@Body() dto: any) { return this.svc.createEmployee(dto); }

  @Put('employees/:id')
  updateEmployee(@Param('id') id: string, @Body() dto: any) { return this.svc.updateEmployee(id, dto); }

  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string) { return this.svc.deleteEmployee(id); }

  @Get('employees/:id/history')
  getEmployeeHistory(@Param('id') id: string) { return this.svc.getEmployeeHistory(id); }

  // ─── PAYROLLS ────────────────────────────────────────────────────────────
  @Get('payrolls')
  getPayrolls(@Query() q: any) { return this.svc.getPayrolls(q); }

  @Post('payrolls')
  createPayroll(@Body() dto: any) { return this.svc.createPayroll(dto); }

  @Put('payrolls/:id')
  updatePayroll(@Param('id') id: string, @Body() dto: any) { return this.svc.updatePayroll(id, dto); }

  // ─── ATTENDANCES ─────────────────────────────────────────────────────────
  @Get('attendances')
  getAttendances(@Query() q: any) { return this.svc.getAttendances(q); }

  @Post('attendances')
  createAttendance(@Body() dto: any) { return this.svc.createAttendance(dto); }

  @Post('attendances/import-csv')
  importAttendanceCsv(@Body() dto: { rows: any[] }) { return this.svc.importAttendanceCsv(dto.rows); }

  @Get('attendances/report')
  getAttendanceReport(@Query() q: any) {
    const { employeeId, month, year } = q;
    return this.svc.getAttendanceReport(employeeId, Number(month), Number(year));
  }

  @Get('attendances/summary')
  getAttendanceSummary(@Query() q: any) {
    const { month, year, departemenId } = q;
    return this.svc.getAttendanceSummary(Number(month), Number(year), departemenId);
  }

  // ─── SHIFTS ──────────────────────────────────────────────────────────────
  @Get('shifts')
  getShifts(@Query() q: any) { return this.svc.getShifts(q); }

  @Post('shifts')
  createShift(@Body() dto: any) { return this.svc.createShift(dto); }

  @Put('shifts/:id')
  updateShift(@Param('id') id: string, @Body() dto: any) { return this.svc.updateShift(id, dto); }

  @Delete('shifts/:id')
  deleteShift(@Param('id') id: string) { return this.svc.deleteShift(id); }

  @Post('employees/:id/assign-shift')
  assignShift(@Param('id') employeeId: string, @Body() dto: { shiftId: string }) {
    return this.svc.assignShift(employeeId, dto.shiftId);
  }

  // ─── MUTASI/TRANSFER ─────────────────────────────────────────────────────
  @Get('mutasi')
  getMutasi(@Query() q: any) { return this.svc.getMutasi(q); }

  @Post('mutasi')
  createMutasi(@Body() dto: any) { return this.svc.createMutasi(dto); }

  // ─── LEAVE TYPES ─────────────────────────────────────────────────────────
  @Get('leaves/types')
  getLeaveTypes() { return this.svc.getLeaveTypes(); }

  @Post('leaves/types')
  createLeaveType(@Body() dto: any) { return this.svc.createLeaveType(dto); }

  // ─── LEAVE REQUESTS ──────────────────────────────────────────────────────
  @Get('leaves/requests')
  getLeaveRequests(@Query() q: any) {
    const { employeeId, status } = q;
    return this.svc.getLeaveRequests(employeeId, status);
  }

  @Post('leaves/requests')
  createLeaveRequest(@Body() dto: any) { return this.svc.createLeaveRequest(dto); }

  @Post('leaves/requests/:id/approve')
  approveLeaveRequest(@Param('id') id: string, @Body() dto: { approvedBy: string }) {
    return this.svc.approveLeaveRequest(id, dto.approvedBy);
  }

  @Post('leaves/requests/:id/reject')
  rejectLeaveRequest(@Param('id') id: string, @Body() dto: { reason?: string }) {
    return this.svc.rejectLeaveRequest(id, dto.reason);
  }

  // ─── LEAVE ALLOCATIONS ───────────────────────────────────────────────────
  @Get('leaves/allocations')
  getLeaveAllocations(@Query() q: any) {
    const { employeeId, year } = q;
    return this.svc.getLeaveAllocations(employeeId, year ? Number(year) : undefined);
  }

  @Post('leaves/allocations')
  createLeaveAllocation(@Body() dto: any) { return this.svc.createLeaveAllocation(dto); }

  // ─── LEAVE BALANCE ───────────────────────────────────────────────────────
  @Get('leaves/balance/:employeeId')
  getLeaveBalance(@Param('employeeId') employeeId: string, @Query('year') year?: string) {
    return this.svc.getLeaveBalance(employeeId, year ? Number(year) : undefined);
  }

  // ─── LEAVE CALENDAR ──────────────────────────────────────────────────────
  @Get('leaves/calendar')
  getLeaveCalendar(@Query() q: any) {
    const { month, year, departemenId } = q;
    return this.svc.getLeaveCalendar(Number(month), Number(year), departemenId);
  }

  // ─── CONTRACTS ───────────────────────────────────────────────────────────
  @Get('contracts')
  getContracts(@Query() q: any) { return this.svc.getContracts(q); }

  @Get('contracts/:id')
  getContract(@Param('id') id: string) { return this.svc.getContract(id); }

  @Post('contracts')
  createContract(@Body() dto: any) { return this.svc.createContract(dto); }

  @Put('contracts/:id')
  updateContract(@Param('id') id: string, @Body() dto: any) { return this.svc.updateContract(id, dto); }

  @Delete('contracts/:id')
  deleteContract(@Param('id') id: string) { return this.svc.deleteContract(id); }

  @Get('employees/:id/contracts')
  getEmployeeContracts(@Param('id') employeeId: string) { return this.svc.getEmployeeContracts(employeeId); }

  @Post('employees/:id/contracts')
  createEmployeeContract(@Param('id') employeeId: string, @Body() dto: any) {
    return this.svc.createEmployeeContract(employeeId, dto);
  }

  @Put('employees/:id/contracts/:contractId')
  updateEmployeeContract(@Param('contractId') contractId: string, @Body() dto: any) {
    return this.svc.updateEmployeeContract(contractId, dto);
  }

  // ─── EMPLOYEE TRANSFER ────────────────────────────────────────────────────
  @Post('employees/:id/transfer')
  transferEmployee(@Param('id') employeeId: string, @Body() dto: any) {
    return this.svc.transferEmployee(employeeId, dto);
  }

  @Get('employees/:id/transfer-history')
  getTransferHistory(@Param('id') employeeId: string) { return this.svc.getTransferHistory(employeeId); }

  // ─── CSV IMPORT ───────────────────────────────────────────────────────────
  @Post('import-csv')
  importCsv(@Body() dto: { rows: any[] }) { return this.svc.importCsv(dto.rows); }
}
