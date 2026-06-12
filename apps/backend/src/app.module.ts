import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

import { HealthModule }       from './modules/health/health.module.js';
import { AuthModule }         from './modules/auth/auth.module.js';
import { KledoModule }        from './modules/kledo/kledo.module.js';
import { SalesModule }        from './modules/sales/sales.module.js';
import { InventoryModule }    from './modules/inventory/inventory.module.js';
import { CustomersModule }    from './modules/customers/customers.module.js';
import { FinanceModule }      from './modules/finance/finance.module.js';
import { PayrollModule }      from './modules/payroll/payroll.module.js';
import { PosModule }          from './modules/pos/pos.module.js';
import { PurchasingModule }   from './modules/purchasing/purchasing.module.js';
import { DashboardModule }    from './modules/dashboard/dashboard.module.js';
import { HrModule }           from './modules/hr/hr.module.js';
import { InvoiceModule }      from './modules/invoice/invoice.module.js';
import { CrmModule }          from './modules/crm/crm.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { SettingsModule }     from './modules/settings/settings.module.js';
import { UserModule }         from './modules/user/user.module.js';
import { RoleModule }         from './modules/role/role.module.js';
import { AuditModule }        from './modules/audit/audit.module.js';
import { ReportingModule }    from './modules/reporting/reporting.module.js';
import { TenantModule }       from './modules/tenant/tenant.module.js';
import { ContactModule }      from './modules/contact/contact.module.js';
import { ExpenseModule }      from './modules/expense/expense.module.js';

import { CanAccessGuard }     from './common/guards/can-access.guard.js';
import { RouteRoleGuard }     from './common/guards/route-role.guard.js';
import { APP_GUARD }          from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    ScheduleModule.forRoot(),
    HttpModule,

    // Core
    HealthModule,
    AuthModule,
    NotificationModule,
    SettingsModule,
    UserModule,
    RoleModule,
    TenantModule,
    AuditModule,

    // Kledo Integration
    KledoModule,

    // Business Modules
    CustomersModule,
    ContactModule,
    InventoryModule,
    SalesModule,
    PurchasingModule,
    InvoiceModule,
    PosModule,

    // Finance & Accounting
    FinanceModule,
    ExpenseModule,

    // HR & Payroll
    HrModule,
    PayrollModule,

    // CRM
    CrmModule,

    // Reporting & Dashboard
    DashboardModule,
    ReportingModule,
  ],
  providers: [
    CanAccessGuard,
    { provide: APP_GUARD, useClass: RouteRoleGuard },
  ],
})
export class AppModule {}
