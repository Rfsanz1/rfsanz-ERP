import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { KledoModule } from './modules/kledo/kledo.module.js';
import { CanAccessGuard } from './common/guards/can-access.guard.js';
import { RouteRoleGuard } from './common/guards/route-role.guard.js';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    HttpModule,
    HealthModule,
    AuthModule,
    KledoModule,
  ],
  providers: [
    CanAccessGuard,
    { provide: APP_GUARD, useClass: RouteRoleGuard },
  ],
})
export class AppModule {}
