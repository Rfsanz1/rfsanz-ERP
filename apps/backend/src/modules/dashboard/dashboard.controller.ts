import { Controller, Get, Inject, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

  // ─── EXECUTIVE DASHBOARD (COMPREHENSIVE) ───────────────────────────────────
  @Get()
  @Roles('admin', 'owner', 'super admin', 'manager', 'finance')
  async executiveDashboard(@Query('branchId') branchId?: string) {
    return this.dashboardService.getExecutiveDashboard(branchId);
  }

  @Get('summary')
  async summary() {
    return this.dashboardService.getSummary();
  }

  @Get('admin')
  @Roles('admin', 'owner', 'super admin')
  async adminDashboard() {
    return this.dashboardService.getAdminSummary();
  }

  @Get('sales')
  @Roles('admin', 'owner', 'super admin', 'sales', 'sales manager')
  async salesDashboard() {
    return this.dashboardService.getSalesSummary();
  }

  @Get('gudang')
  @Roles('admin', 'owner', 'super admin', 'staff gudang', 'gudang')
  async gudangDashboard() {
    return this.dashboardService.getGudangSummary();
  }

  @Get('pos')
  @Roles('admin', 'owner', 'super admin', 'kasir')
  async posDashboard() {
    return this.dashboardService.getPosSummary();
  }

  @Get('driver')
  @Roles('admin', 'owner', 'super admin', 'driver')
  async driverDashboard() {
    return this.dashboardService.getDriverSummary();
  }
}
