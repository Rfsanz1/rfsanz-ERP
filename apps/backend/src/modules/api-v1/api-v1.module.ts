import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { PrismaService } from '../../database/prisma.service.js';
import { UserModule } from '../user/user.module.js';
import { UserService } from '../user/user.service.js';
import { RoleModule } from '../role/role.module.js';
import { RoleService } from '../role/role.service.js';

import { StrictJwtGuard } from './guards/strict-jwt.guard.js';

import { ShipmentsService }        from './services/shipments.service.js';
import { CarriersService }         from './services/carriers.service.js';
import { LocationsService }        from './services/locations.service.js';
import { LanesService }            from './services/lanes.service.js';
import { IssuesService }           from './services/issues.service.js';
import { CommentsService }         from './services/comments.service.js';
import { AttachmentsService }      from './services/attachments.service.js';
import { OrganizationService }     from './services/organization.service.js';
import { EmailService }            from './services/email.service.js';
import { DevicesService }          from './services/devices.service.js';
import { DriverService }           from './services/driver.service.js';
import { DriverPortalService }     from './services/driver-portal.service.js';
import { ChatService }             from './services/chat.service.js';
import { NotificationsTmsService } from './services/notifications-tms.service.js';
import { TmsCustomersService }     from './services/tms-customers.service.js';

import { AuthV1Controller }             from './controllers/auth.controller.js';
import { UsersV1Controller }            from './controllers/users.controller.js';
import { RolesV1Controller }            from './controllers/roles.controller.js';
import { CustomersV1Controller }        from './controllers/customers.controller.js';
import { OrdersV1Controller }           from './controllers/orders.controller.js';
import { ShipmentsV1Controller }        from './controllers/shipments.controller.js';
import { CarriersV1Controller }         from './controllers/carriers.controller.js';
import { LocationsV1Controller }        from './controllers/locations.controller.js';
import { LanesV1Controller }            from './controllers/lanes.controller.js';
import { IssuesV1Controller }           from './controllers/issues.controller.js';
import { IssueLabelsV1Controller }      from './controllers/issue-labels.controller.js';
import { KanbanViewsV1Controller }      from './controllers/kanban-views.controller.js';
import { CommentsV1Controller }         from './controllers/comments.controller.js';
import { AttachmentsV1Controller }      from './controllers/attachments.controller.js';
import { OrganizationV1Controller, ThemeV1Controller } from './controllers/organization.controller.js';
import { EmailV1Controller, DocumentTemplatesV1Controller, DocumentsV1Controller } from './controllers/email.controller.js';
import { DevicesV1Controller }          from './controllers/devices.controller.js';
import { DriverV1Controller }           from './controllers/driver.controller.js';
import { DriverPortalController }       from './controllers/driver-portal.controller.js';
import { ChatV1Controller }             from './controllers/chat.controller.js';
import { NotificationsV1Controller }    from './controllers/notifications.controller.js';

import { ChatGateway } from './gateways/chat.gateway.js';

@Module({
  imports: [
    UserModule,
    RoleModule,
    MulterModule.register({ dest: './uploads' }),
  ],
  controllers: [
    AuthV1Controller,
    UsersV1Controller,
    RolesV1Controller,
    CustomersV1Controller,
    OrdersV1Controller,
    ShipmentsV1Controller,
    CarriersV1Controller,
    LocationsV1Controller,
    LanesV1Controller,
    IssuesV1Controller,
    IssueLabelsV1Controller,
    KanbanViewsV1Controller,
    CommentsV1Controller,
    AttachmentsV1Controller,
    OrganizationV1Controller,
    ThemeV1Controller,
    EmailV1Controller,
    DocumentTemplatesV1Controller,
    DocumentsV1Controller,
    DevicesV1Controller,
    DriverV1Controller,
    DriverPortalController,
    ChatV1Controller,
    NotificationsV1Controller,
  ],
  providers: [
    PrismaService,
    StrictJwtGuard,
    UserService,
    RoleService,
    ShipmentsService,
    CarriersService,
    LocationsService,
    LanesService,
    IssuesService,
    CommentsService,
    AttachmentsService,
    OrganizationService,
    EmailService,
    DevicesService,
    DriverService,
    DriverPortalService,
    ChatService,
    NotificationsTmsService,
    TmsCustomersService,
    ChatGateway,
  ],
})
export class ApiV1Module {}
