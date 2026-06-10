import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { RoleModule } from './modules/role/role.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { PurchasingModule } from './modules/purchasing/purchasing.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { HrModule } from './modules/hr/hr.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { ExpenseModule } from './modules/expense/expense.module.js';
import { KledoModule } from './modules/kledo/kledo.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { DriverAreasModule } from './modules/driver-areas/driver-areas.module.js';
import { PosModule } from './modules/pos/pos.module.js';
import { CrmModule } from './modules/crm/crm.module.js';
import { ProjectModule } from './modules/project/project.module.js';
import { HelpdeskModule } from './modules/helpdesk/helpdesk.module.js';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module.js';
import { LeaveModule } from './modules/leave/leave.module.js';
import { RecruitmentModule } from './modules/recruitment/recruitment.module.js';
import { QualityModule } from './modules/quality/quality.module.js';
import { MaintenanceModule } from './modules/maintenance/maintenance.module.js';
import { FleetModule } from './modules/fleet/fleet.module.js';
import { TaxModule } from './modules/tax/tax.module.js';
import { PayrollModule } from './modules/payroll/payroll.module.js';
import { AssetModule } from './modules/asset/asset.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { BranchModule } from './modules/branch/branch.module.js';
import { InvoiceModule } from './modules/invoice/invoice.module.js';
import { ContactModule } from './modules/contact/contact.module.js';
import { ReportingModule } from './modules/reporting/reporting.module.js';
import { WorkflowModule } from './modules/workflow/workflow.module.js';
import { CanAccessGuard } from './common/guards/can-access.guard.js';
import { RouteRoleGuard } from './common/guards/route-role.guard.js';
import { PrismaService } from './database/prisma.service.js';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    HealthModule,
    AuthModule,
    UserModule,
    RoleModule,
    NotificationModule,
    DashboardModule,
    InventoryModule,
    SalesModule,
    PurchasingModule,
    CustomersModule,
    HrModule,
    FinanceModule,
    ExpenseModule,
    KledoModule,
    SettingsModule,
    DriverAreasModule,
    PosModule,
    CrmModule,
    ProjectModule,
    HelpdeskModule,
    ManufacturingModule,
    LeaveModule,
    RecruitmentModule,
    QualityModule,
    MaintenanceModule,
    FleetModule,
    TaxModule,
    PayrollModule,
    AssetModule,
    AuditModule,
    BranchModule,
    InvoiceModule,
    ContactModule,
    ReportingModule,
    WorkflowModule,
  ],
  providers: [
    PrismaService,
    CanAccessGuard,
    { provide: APP_GUARD, useClass: RouteRoleGuard },
  ],
})
export class AppModule {}
